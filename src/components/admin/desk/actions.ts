"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { isStaffUser } from "@/access/roles";
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
