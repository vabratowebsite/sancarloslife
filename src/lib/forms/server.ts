import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import type { z } from "zod";

import { getPayloadClient } from "@/lib/payload";

export type FormState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
  /** Values to put back in the form after an error. */
  values?: Record<string, string>;
};

// Cloudflare's documented test secret: always passes. Used only when no real key is set.
const TURNSTILE_TEST_SECRET = "1x0000000000000000000000000000000AA";

export async function verifyTurnstile(token: FormDataEntryValue | null, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY || (process.env.NODE_ENV !== "production" ? TURNSTILE_TEST_SECRET : "");
  if (!secret) {
    console.error("TURNSTILE_SECRET_KEY is not set; refusing form submissions in production");
    return false;
  }
  if (typeof token !== "string" || !token) return false;
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({ secret, response: token, remoteip: ip }),
  }).catch(() => null);
  if (!res?.ok) return false;
  const data = (await res.json()) as { success?: boolean };
  return Boolean(data.success);
}

export async function clientIp() {
  const h = await headers();
  return h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "0.0.0.0";
}

/** IPs are stored only as a salted hash (spam tracing without keeping addresses). */
export const hashIp = (ip: string) =>
  createHash("sha256").update(`${ip}:${process.env.PAYLOAD_SECRET ?? ""}`).digest("hex").slice(0, 32);

// Best-effort limit per instance; the Vercel WAF rule is the real limit in production.
const hits = new Map<string, number[]>();
export function rateLimited(key: string, max = 5, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > max;
}

/** Parse FormData with a schema; errors keyed by field for the form to show. */
export function parseForm<T extends z.ZodTypeAny>(schema: T, form: FormData): { data?: z.infer<T>; state?: FormState } {
  const raw: Record<string, string> = {};
  for (const [k, v] of form.entries()) if (typeof v === "string" && !k.startsWith("cf-") && !k.startsWith("$ACTION")) raw[k] = v;
  const result = schema.safeParse(raw);
  if (result.success) return { data: result.data };
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) errors[String(issue.path[0] ?? "form")] ??= issue.message;
  return { state: { ok: false, message: "Please check the highlighted fields.", errors, values: raw } };
}

/**
 * Common checks for every form: honeypot, rate limit, Turnstile.
 * Returns a state to send back if the submission must stop.
 */
export async function guard(form: FormData, formKey: string): Promise<{ stop?: FormState; ip: string; turnstileOk: boolean }> {
  const ip = await clientIp();
  // Bots fill the hidden "website" field; people never see it.
  if (String(form.get("website") ?? "")) return { stop: { ok: true, message: "Thanks!" }, ip, turnstileOk: false };
  // Off in local development so repeated testing doesn't lock you out.
  if (process.env.NODE_ENV === "production" && rateLimited(`${formKey}:${hashIp(ip)}`)) {
    return { stop: { ok: false, message: "Too many tries from your connection. Please wait a few minutes and try again." }, ip, turnstileOk: false };
  }
  const turnstileOk = await verifyTurnstile(form.get("cf-turnstile-response"), ip);
  if (!turnstileOk) {
    return { stop: { ok: false, message: "We couldn't confirm you're not a robot. Please try again." }, ip, turnstileOk };
  }
  return { ip, turnstileOk };
}

export async function storeSubmission(formKey: string, data: Record<string, unknown>, ip: string, turnstileOk: boolean) {
  const payload = await getPayloadClient();
  return payload.create({
    collection: "form-submissions",
    data: { formKey, email: typeof data.email === "string" ? data.email : typeof data.organizerEmail === "string" ? data.organizerEmail : undefined, payload: data, ipHash: hashIp(ip), turnstileOk },
    overrideAccess: true,
  });
}
