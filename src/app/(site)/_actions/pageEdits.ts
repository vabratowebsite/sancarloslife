"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { headers } from "next/headers";

import { isStaffUser } from "@/access/roles";
import { getPayloadClient } from "@/lib/payload";
import type { ImageEdit, PageEditData, TextEdit } from "@/lib/pageEdits";

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; message: string };

async function editor() {
  const payload = await getPayloadClient();
  const { user } = await payload.auth({ headers: await headers() });
  if (!isStaffUser(user)) throw new Error("not-allowed");
  return { payload, user: user! };
}

const PAGE = /^[a-z0-9-]{1,120}$/;
const okPath = (p: string) => p.startsWith("/") && !p.startsWith("//") && p.length < 300;
const okSrc = (s: string) => /^\/api\/media\/file\/[^/?#]+$/.test(s) || /^https:\/\/[^/]+\/[^?#]*\.(jpe?g|png|webp)$/i.test(s);

function clean(input: { texts: Record<string, TextEdit>; images: Record<string, ImageEdit> }): PageEditData {
  const texts: PageEditData["texts"] = {};
  for (const [k, v] of Object.entries(input.texts ?? {})) {
    if (!/^[a-z0-9.\-_]{1,120}$/i.test(k) || typeof v?.to !== "string") continue;
    const to = v.to.replace(/\s+/g, " ").trim().slice(0, 5000);
    if (to) texts[k] = { to, ...(typeof v.from === "string" ? { from: v.from.slice(0, 5000) } : {}) };
  }
  const images: PageEditData["images"] = {};
  for (const [k, v] of Object.entries(input.images ?? {})) {
    if (!/^[a-z0-9.\-_]{1,120}$/i.test(k) || !v || !okSrc(String(v.src))) continue;
    images[k] = { src: v.src, width: Math.round(Number(v.width)) || 1200, height: Math.round(Number(v.height)) || 800, alt: String(v.alt ?? "").slice(0, 300) };
  }
  return { texts, images };
}

function refresh(page: string, path: string) {
  revalidateTag(`page-edits:${page}`, "max");
  revalidatePath(path);
}

/** Save: the editor sends every changed word and photo on the page (the full set, not a diff). */
export async function savePageEdits(page: string, path: string, input: PageEditData): Promise<Result<{ changes: number }>> {
  if (!PAGE.test(page) || !okPath(path)) return { ok: false, message: "Unknown page" };
  try {
    const { payload, user } = await editor();
    const data = clean(input);
    const changes = Object.keys(data.texts).length + Object.keys(data.images).length;
    const found = (await payload.find({ collection: "page-edits", where: { page: { equals: page } }, limit: 1, depth: 0 })).docs[0];
    const doc = { page, path, ...data, changes, updatedBy: user.id };
    if (found) await payload.update({ collection: "page-edits", id: found.id, data: doc, user, overrideAccess: false });
    else await payload.create({ collection: "page-edits", data: doc, user, overrideAccess: false });
    refresh(page, path);
    return { ok: true, data: { changes } };
  } catch (e) {
    if (e instanceof Error && e.message === "not-allowed") return { ok: false, message: "Your sign-in has expired or you can't edit pages. Sign in again." };
    console.error("savePageEdits", e);
    return { ok: false, message: "Couldn't save. Check your connection and try again." };
  }
}

export type VersionRow = { id: string; updatedAt: string; by: string; changes: number };

/** The last 10 saves of a page, newest first. */
export async function listPageVersions(page: string): Promise<Result<{ current?: VersionRow; history: VersionRow[] }>> {
  if (!PAGE.test(page)) return { ok: false, message: "Unknown page" };
  try {
    const { payload } = await editor();
    const doc = (await payload.find({ collection: "page-edits", where: { page: { equals: page } }, limit: 1, depth: 1 })).docs[0];
    if (!doc) return { ok: true, data: { history: [] } };
    const name = (u: unknown) => (u && typeof u === "object" && "email" in u ? String((u as { name?: string; email: string }).name || (u as { email: string }).email) : "an editor");
    const v = await payload.findVersions({ collection: "page-edits", where: { parent: { equals: doc.id } }, sort: "-updatedAt", limit: 11, depth: 1 });
    const history = v.docs.slice(1).map((d) => ({
      id: String(d.id),
      updatedAt: d.updatedAt,
      by: name(d.version.updatedBy),
      changes: Number(d.version.changes ?? 0),
    }));
    return { ok: true, data: { current: { id: String(doc.id), updatedAt: doc.updatedAt, by: name(doc.updatedBy), changes: Number(doc.changes ?? 0) }, history } };
  } catch {
    return { ok: false, message: "Couldn't load versions." };
  }
}

/** Restore a saved version, or the page's original (no changes) with versionId "__original". */
export async function restorePageVersion(page: string, path: string, versionId: string): Promise<Result> {
  if (!PAGE.test(page) || !okPath(path)) return { ok: false, message: "Unknown page" };
  try {
    const { payload, user } = await editor();
    const doc = (await payload.find({ collection: "page-edits", where: { page: { equals: page } }, limit: 1, depth: 0 })).docs[0];
    if (!doc) return { ok: true };
    if (versionId === "__original") {
      // Kept as a new version (not deleted), so the change can be undone too.
      await payload.update({ collection: "page-edits", id: doc.id, data: { texts: {}, images: {}, changes: 0, updatedBy: user.id }, user, overrideAccess: false });
    } else {
      const v = await payload.findVersionByID({ collection: "page-edits", id: versionId, depth: 0 });
      if (String(v.parent) !== String(doc.id)) return { ok: false, message: "That version belongs to another page." };
      const { texts, images, changes } = v.version;
      await payload.update({ collection: "page-edits", id: doc.id, data: { texts, images, changes, updatedBy: user.id }, user, overrideAccess: false });
    }
    refresh(page, path);
    return { ok: true };
  } catch {
    return { ok: false, message: "Couldn't restore. Try again." };
  }
}
