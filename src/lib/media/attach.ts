import "server-only";

import type { Payload, TypedUser } from "payload";

/** Collections a photo can be attached to, and whether they keep draft versions. */
export const PHOTO_DRAFTS = { posts: true, events: false, places: true, "city-projects": true, "desk-pages": true } as const;
export type PhotoCollection = keyof typeof PHOTO_DRAFTS;

export class AttachError extends Error {}

/**
 * Sets a media item as an item's photo (cover; desk pages: hero; places can add to the gallery)
 * on a NEW DRAFT VERSION built from the latest draft, in review, with a note for the reviewer.
 * The published item doesn't change until a person approves. Published events are refused.
 * Shared by the connector's attach_photo / suggest_photos and the desk's "Suggest photos" panel.
 */
export async function attachPhoto(
  payload: Payload,
  user: TypedUser,
  input: { collection: PhotoCollection; id: string | number; mediaId: number | string; role?: "cover" | "gallery"; note: string },
) {
  const { collection, id } = input;
  const role = input.role ?? "cover";
  if (role === "gallery" && collection !== "places") throw new AttachError("Only places have a photo gallery; use cover.");
  const existing = (await payload.findByID({ collection, id, draft: PHOTO_DRAFTS[collection], depth: 0, user, overrideAccess: false }).catch(() => null)) as
    | (Record<string, unknown> & { status?: string; review?: Record<string, unknown>; gallery?: unknown[] })
    | null;
  if (!existing) throw new AttachError("Not found, or this account can't edit it.");
  if (collection === "events" && !["draft", "pending"].includes(String(existing.status))) {
    throw new AttachError("This event is already on the calendar; an editor has to change its photo.");
  }
  const field = collection === "desk-pages" ? "hero" : role === "gallery" ? "gallery" : "cover";
  const value =
    field === "gallery" ? [...((existing.gallery ?? []) as unknown[]).map((g) => (g && typeof g === "object" ? (g as { id: unknown }).id : g)), input.mediaId] : input.mediaId;
  const review = { ...existing.review, state: "in-review", note: [existing.review?.note, input.note].filter(Boolean).join("\n\n").slice(0, 10000) };
  let data: Record<string, unknown> = { [field]: value, review };
  if (PHOTO_DRAFTS[collection]) {
    // A new draft version built from the latest draft, so nothing else in it changes.
    const { id: _i, createdAt: _c, updatedAt: _u, ...content } = existing;
    void _i;
    void _c;
    void _u;
    data = { ...content, ...data, _status: "draft" };
  }
  const doc = (await payload.update({ collection, id, data: data as never, draft: PHOTO_DRAFTS[collection], user, overrideAccess: false })) as unknown as {
    id: number | string;
    review?: { check?: { ok?: boolean; problems?: string[] } };
  };
  return { id: doc.id, field, passesFormatCheck: Boolean(doc.review?.check?.ok), problems: doc.review?.check?.problems ?? [] };
}
