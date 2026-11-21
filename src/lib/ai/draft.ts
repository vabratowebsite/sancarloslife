import "server-only";

import type { Payload, TypedUser } from "payload";

import { FORMATS, toDraftData, type DraftRefs, type FormatKey, type FormatOutput } from "./formats";

/**
 * Turns a validated answer (from the website's AI or from Claude through the
 * connector) into draft data: looks up the blog or event category by name, and
 * finds or creates the event's venue and organizer, so every format lands in
 * its collection the same way whoever wrote it.
 */

export const titleOf = (out: FormatOutput<FormatKey>) => ("title" in out ? out.title : out.name);

/** Extra lines for the AI's system message: the choices it must pick from. */
export async function formatContext(payload: Payload, format: FormatKey): Promise<string> {
  if (format === "blog") {
    const cats = await payload.find({ collection: "categories", limit: 100, depth: 0, pagination: false });
    return `BLOG CATEGORIES (choose one, spelled exactly): ${cats.docs.map((c) => c.name).join(", ")}`;
  }
  if (format === "event") {
    const cats = await payload.find({ collection: "event-categories", limit: 100, depth: 0, pagination: false });
    return `EVENT CATEGORIES (choose one, spelled exactly): ${cats.docs.map((c) => c.name).join(", ")}`;
  }
  return "";
}

const slugOf = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80) || "item";

const byName = async (payload: Payload, collection: "categories" | "event-categories" | "venues" | "organizers", name: string) =>
  (await payload.find({ collection, where: { name: { like: name } }, limit: 5, depth: 0 })).docs.find((d) => String(d.name).toLowerCase() === name.toLowerCase());

async function refsFor(payload: Payload, user: TypedUser, format: FormatKey, out: FormatOutput<FormatKey>): Promise<DraftRefs> {
  if (format === "blog") {
    const o = out as FormatOutput<"blog">;
    return { categoryId: o.category ? ((await byName(payload, "categories", o.category))?.id as number | undefined) ?? null : null };
  }
  if (format === "event") {
    const o = out as FormatOutput<"event">;
    const venue =
      (await byName(payload, "venues", o.venue.name)) ??
      (await payload.create({ collection: "venues", data: { name: o.venue.name, slug: slugOf(o.venue.name), address: o.venue.address }, user, overrideAccess: false }));
    const organizer = o.organizer
      ? ((await byName(payload, "organizers", o.organizer.name)) ??
        (await payload.create({ collection: "organizers", data: { name: o.organizer.name, slug: slugOf(o.organizer.name), url: o.organizer.url }, user, overrideAccess: false })))
      : null;
    const cat = o.category ? await byName(payload, "event-categories", o.category) : null;
    return { venueId: venue.id, organizerId: organizer?.id ?? null, eventCategoryId: cat?.id ?? null };
  }
  return {};
}

export async function buildDraft(
  payload: Payload,
  user: TypedUser,
  format: FormatKey,
  out: FormatOutput<FormatKey>,
  opts: { source: "website-ai" | "claude"; note?: string },
) {
  const data = toDraftData(format, out, await refsFor(payload, user, format, out)) as Record<string, unknown> & { review: Record<string, unknown> };
  data.review.source = opts.source;
  if (opts.note) data.review.note = [opts.note, data.review.note].filter(Boolean).join("\n\n");
  return { data, collection: FORMATS[format].collection, title: titleOf(out) };
}
