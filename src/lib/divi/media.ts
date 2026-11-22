import "server-only";

import index from "@/content/media-index.json";

/**
 * Photo addresses for pages rebuilt from the WordPress layouts (src/content/divi).
 * A WordPress upload URL becomes the media library copy once media storage (R2) is
 * configured; until then it keeps the WordPress original so photos show on the demo.
 * At cutover R2 must be set, because the WordPress uploads go away with the old site.
 */
type Entry = { wp: string; file?: string };
const INDEX = index as Record<string, Entry>;
const WP_UPLOADS = "https://sancarloslife.com/wp-content/uploads/";
const storageReady = Boolean(process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID);

export function wpImage(src: string | undefined | null): string {
  if (!src) return "";
  if (!src.includes("/wp-content/uploads/")) return src;
  const base = decodeURIComponent(src.split("?")[0].split("/").pop() ?? "");
  const hit = INDEX[base];
  if (hit?.file && storageReady) return `/api/media/file/${encodeURIComponent(hit.file)}`;
  return hit ? WP_UPLOADS + hit.wp : src;
}

/** Rewrites every WordPress upload URL inside a block of HTML. */
export function wpImagesInHtml(html: string): string {
  return html.replace(/https?:\/\/(?:www\.)?sancarloslife\.com\/wp-content\/uploads\/[^"'\s)]+/g, (u) => wpImage(u));
}

/** Internal links stay on this site: https://sancarloslife.com/x/ becomes /x/. */
export function localHref(href: string | undefined | null): string {
  if (!href) return "";
  const h = href.replace(/^https?:\/\/(?:www\.)?sancarloslife\.com/i, "");
  if (h.startsWith("/real-estate/the-neighborhood/")) return `/${h.split("/").filter(Boolean).pop()}/`;
  return h || "/";
}
