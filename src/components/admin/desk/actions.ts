"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { isAdminUser, isStaffUser } from "@/access/roles";
import { generateDraft } from "@/lib/ai/generate";
import { attachPhoto } from "@/lib/media/attach";
import { importPhotoFromUrl } from "@/lib/media/fromUrl";
import { AI_COLLECTIONS, fromPexels, fromSourcePages, generateIllustration, searchQuery, SUGGEST_COLLECTIONS, type Suggestion, type SuggestCollection } from "@/lib/media/suggest";
import { runDueJobs } from "@/lib/desk/runner";
import { getPayloadClient } from "@/lib/payload";

const COLLECTIONS = ["posts", "events", "places", "city-projects", "desk-pages"] as const;
type DeskCollection = (typeof COLLECTIONS)[number];
const DRAFTS: Record<DeskCollection, boolean> = { posts: true, events: false, places: true, "city-projects": true, "desk-pages": true };

async function staff() {
  const payload = await getPayloadClient();
  const { user } = await payload.auth({ headers: await headers() });
  if (!isStaffUser(user)) throw new Error("Sign in as an editor to approve.");
  return { payload, user: user! };
}

const parse = (form: FormData) => {
  const collection = String(form.get("collection")) as DeskCollection;
  const id = String(form.get("id"));
  if (!COLLECTIONS.includes(collection) || !/^\w{1,40}$/.test(id)) throw new Error("Unknown item");
  return { collection, id };
};

/** Approve = publish the latest draft, if it passed the format check. */
export async function approveItem(form: FormData) {
  const { payload, user } = await staff();
  const { collection, id } = parse(form);
  const doc = (await payload.findByID({ collection, id, draft: DRAFTS[collection], depth: 0, overrideAccess: true })) as unknown as Record<string, unknown> & {
    review?: { check?: { ok?: boolean } };
  };
  if (!doc.review?.check?.ok) throw new Error("This item hasn't passed the format check yet.");
  const review = { ...doc.review, state: "approved", reviewedAt: new Date().toISOString(), reviewedBy: user.id };
  const publish = collection === "events" ? { status: "published" } : { _status: "published" };
  // Publish the latest draft's content (not the older published copy).
  const { id: _id, createdAt: _c, updatedAt: _u, ...content } = doc;
  void _id;
  void _c;
  void _u;
  await payload.update({ collection, id, data: { ...content, ...publish, review } as never, draft: false, user, overrideAccess: false });
  revalidatePath("/admin/desk");
}

/** Send back with a note; the item stays a draft. */
export async function rejectItem(form: FormData) {
  const { payload, user } = await staff();
  const { collection, id } = parse(form);
  const note = String(form.get("note") ?? "").trim().slice(0, 2000);
  const doc = (await payload.findByID({ collection, id, draft: DRAFTS[collection], depth: 0, overrideAccess: true })) as unknown as { review?: object };
  await payload.update({
    collection,
    id,
    data: { review: { ...doc.review, state: "rejected", note, reviewedAt: new Date().toISOString(), reviewedBy: user.id } } as never,
    draft: DRAFTS[collection],
    user,
    overrideAccess: false,
  });
  revalidatePath("/admin/desk");
}

/** Generate draft: the AI writes a draft from a stored prompt and the editor's notes; it lands in the queue. */
export async function generateAction(form: FormData) {
  const { payload, user } = await staff();
  const promptId = String(form.get("prompt") ?? "");
  const connectionId = String(form.get("connection") ?? "") || null;
  const notes = String(form.get("notes") ?? "");
  const res = await generateDraft(payload, user, { promptId, connectionId, notes });
  revalidatePath("/admin/desk");
  const q = new URLSearchParams(
    res.ok
      ? { gen: "ok", title: res.title, problems: String(res.problems.length) }
      : { gen: "error", message: res.message.slice(0, 300) },
  );
  redirect(`/admin/desk?${q}`);
}

/** Run one desk job's backup now (admins), whatever its schedule. Uses the job's AI connection. */
export async function runJobNow(form: FormData) {
  const { payload, user } = await staff();
  if (!isAdminUser(user)) throw new Error("Only admins can start a backup run.");
  const id = String(form.get("job") ?? "");
  if (!/^\w{1,40}$/.test(id)) throw new Error("Unknown job");
  const [r] = await runDueJobs(payload, { force: id });
  revalidatePath("/admin/desk");
  const q = new URLSearchParams(
    r?.action === "ran" ? { gen: "ok", title: r.draft?.title ?? r.job, problems: "0" } : { gen: "error", message: (r?.reason ?? "Job not found").slice(0, 300) },
  );
  redirect(`/admin/desk?${q}`);
}

// ---------------------------------------------------------------- photo suggestions

type PhotoResult<T> = { ok: true; data: T } | { ok: false; message: string };
const photoItem = (collection: string, id: string) => {
  if (!SUGGEST_COLLECTIONS.includes(collection as SuggestCollection) || !/^\w{1,40}$/.test(id)) throw new Error("Unknown item");
  return { collection: collection as SuggestCollection, id };
};

/** Candidate photos for an item in review: its source pages, then Pexels (if the key is set). Attaches nothing. */
export async function suggestPhotosAction(collection: string, id: string): Promise<PhotoResult<{ fromSources: Suggestion[]; stock: Suggestion[]; notes: string[]; checked: string[] }>> {
  try {
    const { payload, user } = await staff();
    const item = photoItem(collection, id);
    const doc = (await payload.findByID({ collection: item.collection, id: item.id, draft: DRAFTS[item.collection], depth: 0, user, overrideAccess: false })) as unknown as Record<string, unknown>;
    const src = await fromSourcePages(doc);
    let stock: Suggestion[] = [];
    const notes = [...src.errors];
    if (!process.env.PEXELS_API_KEY) notes.push("Stock photos are off until a Pexels key (PEXELS_API_KEY) is added.");
    else
      try {
        stock = await fromPexels(searchQuery(doc));
      } catch (e) {
        notes.push((e as Error).message);
      }
    return { ok: true, data: { fromSources: src.suggestions, stock, notes, checked: src.checked } };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

/** Use a suggested photo: download it into the media library and set it on a new draft version (in review). */
export async function pickPhotoAction(
  collection: string,
  id: string,
  pick: { url: string; alt: string; credit: string; link?: string; kind: Suggestion["kind"] },
): Promise<PhotoResult<{ passesFormatCheck: boolean }>> {
  try {
    const { payload, user } = await staff();
    const item = photoItem(collection, id);
    const alt = String(pick.alt ?? "").trim().slice(0, 200);
    if (alt.length < 5) return { ok: false, message: "Describe the photo in a few words (alt text) first." };
    const credit = String(pick.credit ?? "").trim().slice(0, 120) || "Photo";
    const media = await importPhotoFromUrl(payload, user, { url: String(pick.url), alt, credit });
    const note =
      pick.kind === "pexels"
        ? `Stock photo from Pexels (${credit}${pick.link ? `, ${pick.link}` : ""}), picked in the Suggest photos panel.`
        : `Photo picked in the Suggest photos panel from ${pick.link ?? pick.url} (credit: ${credit}). Check you may use it before publishing.`;
    const r = await attachPhoto(payload, user, { collection: item.collection, id: item.id, mediaId: media.id, note });
    revalidatePath("/admin/desk");
    return { ok: true, data: { passesFormatCheck: r.passesFormatCheck } };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

/** Generate an AI illustration (posts and guide pages only) and set it as the photo of a new draft version. */
export async function generateIllustrationAction(collection: string, id: string, input: { topic: string; alt: string; connection?: string }): Promise<PhotoResult<{ passesFormatCheck: boolean }>> {
  try {
    const { payload, user } = await staff();
    const item = photoItem(collection, id);
    if (!AI_COLLECTIONS.includes(item.collection)) return { ok: false, message: "AI illustrations are only for blog posts and guide pages, never for real places, events or City projects." };
    const topic = String(input.topic ?? "").trim();
    const alt = String(input.alt ?? "").trim().slice(0, 200);
    if (topic.length < 5 || alt.length < 5) return { ok: false, message: "Give a topic and an alt text (a few words each)." };
    const media = await generateIllustration(payload, user, { topic, alt, connectionId: input.connection || null });
    const r = await attachPhoto(payload, user, {
      collection: item.collection,
      id: item.id,
      mediaId: media.id,
      note: `AI illustration generated in the Suggest photos panel (topic: ${topic.slice(0, 200)}). Credit shown as "AI illustration".`,
    });
    revalidatePath("/admin/desk");
    return { ok: true, data: { passesFormatCheck: r.passesFormatCheck } };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}
