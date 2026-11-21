import "server-only";

import type { Payload, TypedUser } from "payload";
import sharp from "sharp";

import { safeFetchBytes } from "../desk/fetchSource";

/**
 * Brings a photo from a web address into the media library: fetched with the
 * desk's safe-fetch rules (https, public addresses only, checked on every hop),
 * at most 15 MB, raster images only (no SVG, which can carry scripts), decoded
 * and re-encoded by sharp so EXIF/location data and anything that isn't pixels
 * is dropped, capped at 2400 px. Alt text and a credit are required.
 */

export const PHOTO_LIMITS = { maxBytes: 15_000_000, maxPixels: 60_000_000, maxEdge: 2400, minEdge: 400 };
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

export class PhotoError extends Error {}

/** Content type check, before decoding. */
export function acceptableType(contentType: string): boolean {
  const t = contentType.split(";")[0].trim().toLowerCase();
  return TYPES.includes(t);
}

/** Decodes and re-encodes; throws PhotoError for anything that isn't a usable photo. */
export async function reencode(input: Buffer): Promise<{ buffer: Buffer; width: number; height: number }> {
  let meta: Awaited<ReturnType<ReturnType<typeof sharp>["metadata"]>>;
  try {
    meta = await sharp(input, { failOn: "error", limitInputPixels: PHOTO_LIMITS.maxPixels }).metadata();
  } catch {
    throw new PhotoError("That file isn't a photo the site can read.");
  }
  if (!meta.format || !["jpeg", "png", "webp", "avif", "heif", "gif"].includes(meta.format)) throw new PhotoError("Only JPEG, PNG, WebP, AVIF or GIF photos.");
  const shortEdge = Math.min(meta.width ?? 0, meta.height ?? 0);
  if (shortEdge < PHOTO_LIMITS.minEdge) throw new PhotoError(`The photo is too small (${meta.width}×${meta.height}); it needs to be at least ${PHOTO_LIMITS.minEdge} px on its short side.`);
  const { data, info } = await sharp(input, { failOn: "error", limitInputPixels: PHOTO_LIMITS.maxPixels, animated: false })
    .rotate()
    .resize({ width: PHOTO_LIMITS.maxEdge, height: PHOTO_LIMITS.maxEdge, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });
  return { buffer: data, width: info.width, height: info.height };
}

const fileName = (url: URL) => {
  const base = (url.pathname.split("/").pop() ?? "photo").replace(/\.[a-z0-9]+$/i, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 50) || "photo";
  return `${base}-${Date.now().toString(36)}.jpg`;
};

export async function importPhotoFromUrl(payload: Payload, user: TypedUser, input: { url: string; alt: string; credit: string; caption?: string }) {
  let fetched;
  try {
    fetched = await safeFetchBytes(input.url, { maxBytes: PHOTO_LIMITS.maxBytes, accept: "image/avif,image/webp,image/jpeg,image/png,image/gif;q=0.9" });
  } catch (e) {
    throw new PhotoError(`Couldn't download the photo: ${(e as Error).message}`);
  }
  if (!acceptableType(fetched.contentType)) throw new PhotoError(`That address returned ${fetched.contentType || "an unknown type"}, not a JPEG, PNG, WebP, AVIF or GIF photo.`);
  const { buffer, width, height } = await reencode(fetched.bytes);
  const media = await payload.create({
    collection: "media",
    data: { alt: input.alt, credit: input.credit, caption: input.caption },
    file: { data: buffer, mimetype: "image/jpeg", name: fileName(new URL(fetched.url)), size: buffer.length },
    user,
    overrideAccess: false,
  });
  return { id: media.id, width, height, url: (media as { url?: string }).url };
}
