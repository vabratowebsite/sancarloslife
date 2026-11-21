import "server-only";

import type { Payload, TypedUser } from "payload";

import { decryptSecret } from "./crypto";
import { extractJson, FORMATS, toDraftData, type FormatKey } from "./formats";
import { callAI, type Connection, type Provider } from "./providers";

export type GenerateResult =
  | { ok: true; collection: string; id: number | string; title: string; problems: string[] }
  | { ok: false; message: string };

const today = () => new Date().toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", year: "numeric", month: "long", day: "numeric" });

/** The system message: the stored prompt, then the fixed output shape for its format. */
export function buildSystem(prompt: { instructions: string; rules?: string | null; example?: string | null }, format: FormatKey) {
  return [
    prompt.instructions.trim(),
    prompt.rules?.trim() && `RULES\n${prompt.rules.trim()}`,
    prompt.example?.trim() && `EXAMPLE TO FOLLOW\n${prompt.example.trim()}`,
    `Today is ${today()} in San Carlos, California.`,
    `OUTPUT\nReply with one JSON object and nothing else, shaped exactly like this:\n${FORMATS[format].shape}\nIf a fact can't be verified from the notes or sources given, leave it out rather than guess.`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

/**
 * Generate draft: runs a stored prompt through an AI connection and saves the
 * answer as a draft in the format's collection, sent to the Approval queue
 * (review state "in-review", source "website-ai"). The format check runs on
 * save, so anything missing shows up in the queue. Every run is logged.
 */
export async function generateDraft(
  payload: Payload,
  user: TypedUser,
  input: { promptId: number | string; connectionId?: number | string | null; notes: string; job?: string },
): Promise<GenerateResult> {
  const started = new Date().toISOString();
  const prompt = await payload.findByID({ collection: "ai-prompts", id: input.promptId, depth: 0, user, overrideAccess: false }).catch(() => null);
  if (!prompt || !prompt.active) return { ok: false, message: "Choose an active prompt." };
  const format = prompt.format as FormatKey;

  // Connections are admin-only; read them on the server with the key revealed.
  const conns = await payload.find({
    collection: "ai-connections",
    where: input.connectionId ? { id: { equals: input.connectionId } } : { and: [{ enabled: { equals: true } }, { isDefault: { equals: true } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    context: { revealKey: true },
  });
  const c = conns.docs[0];
  if (!c || !c.enabled) return { ok: false, message: "No AI connection is set up. An admin can add one under Operations Desk → AI connections." };
  let apiKey = "";
  if (c.provider !== "mock") {
    if (!c.apiKey) return { ok: false, message: `The connection "${c.name}" has no API key saved.` };
    apiKey = decryptSecret(c.apiKey);
  }
  const conn: Connection = { provider: c.provider as Provider, model: c.model, apiKey, baseUrl: c.baseUrl, maxOutputTokens: c.maxOutputTokens };

  const log = async (status: "ok" | "failed", summary: string, drafted = 0) =>
    payload.create({
      collection: "desk-runs",
      data: { job: input.job ?? `generate:${format}`, runner: "website-ai", status, startedAt: started, finishedAt: new Date().toISOString(), summary: summary.slice(0, 250), drafted },
      overrideAccess: true,
    });

  try {
    const notes = input.notes.trim().slice(0, 20_000);
    if (notes.length < 20) return { ok: false, message: "Add notes or source links (at least a sentence) for the AI to work from." };
    let system = buildSystem(prompt, format);
    if (format === "blog") {
      // The category must be one the site has.
      const cats = await payload.find({ collection: "categories", limit: 100, depth: 0, pagination: false });
      system += `\n\nBLOG CATEGORIES (choose one, spelled exactly): ${cats.docs.map((c) => c.name).join(", ")}`;
    }
    const reply = await callAI(conn, system, `NOTES AND SOURCES FROM THE EDITOR\n${notes}`);
    const parsed = FORMATS[format].schema.safeParse(extractJson(reply.text));
    if (!parsed.success) {
      const why = parsed.error.issues.slice(0, 5).map((i) => `${i.path.join(".") || "answer"}: ${i.message}`).join("; ");
      await log("failed", `The AI's answer didn't match the ${FORMATS[format].label} format: ${why}`);
      return { ok: false, message: `The AI's answer didn't match the format (${why}). Try again or adjust the prompt.` };
    }
    const out = parsed.data;
    const collection = FORMATS[format].collection;
    let categoryId: number | null = null;
    if (format === "blog" && "category" in out && out.category) {
      const cat = await payload.find({ collection: "categories", where: { name: { equals: out.category } }, limit: 1, depth: 0 });
      categoryId = (cat.docs[0]?.id as number | undefined) ?? null;
    }
    const data = toDraftData(format, out, { categoryId }) as Record<string, unknown>;
    type Saved = { id: number | string; review?: { check?: { problems?: string[] } } };
    let doc: Saved | undefined;
    // If the address is taken, try once with a numbered address.
    for (const suffix of ["", "-2"]) {
      try {
        doc = (await payload.create({
          collection,
          data: { ...data, slug: `${out.slug}${suffix}` } as never,
          draft: true,
          user,
          overrideAccess: false,
        })) as unknown as Saved;
        break;
      } catch (e) {
        if (suffix || !/slug|address|unique/i.test(String((e as Error)?.message) + JSON.stringify((e as { data?: unknown }).data ?? ""))) throw e;
      }
    }
    if (!doc) throw new Error("Couldn't save the draft.");
    await log("ok", `${FORMATS[format].label} drafted: ${out.title}`, 1);
    return { ok: true, collection, id: doc.id, title: out.title, problems: doc.review?.check?.problems ?? [] };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Something went wrong.";
    await log("failed", message).catch(() => {});
    return { ok: false, message };
  }
}
