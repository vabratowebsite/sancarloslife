import { createHash, timingSafeEqual } from "node:crypto";

import { runDueJobs } from "@/lib/desk/runner";
import { getPayloadClient } from "@/lib/payload";

/**
 * Vercel Cron entry for the Operations Desk backup runner (vercel.json).
 * Vercel sends `Authorization: Bearer <CRON_SECRET>`; anything else is refused,
 * and without CRON_SECRET the route is off. Runs only the jobs whose Claude run
 * is missing (src/lib/desk/runner.ts). Not under /api, which Payload owns.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const digest = (s: string) => createHash("sha256").update(s).digest();

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return false;
  const got = request.headers.get("authorization") ?? "";
  return timingSafeEqual(digest(got), digest(`Bearer ${secret}`));
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) return json({ error: "The backup runner is off (CRON_SECRET isn't set)." }, 503);
  if (!authorized(request)) return json({ error: "Unauthorized" }, 401);
  const payload = await getPayloadClient();
  const results = await runDueJobs(payload);
  for (const r of results) if (r.action !== "skipped") console.info(`[desk-runner] ${r.job}: ${r.action} (${r.reason})`);
  return json({ ok: true, at: new Date().toISOString(), results });
}
