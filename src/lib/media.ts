import type { Media } from "@/payload-types";

export type ImageSize = "thumbnail" | "card" | "hero";

/** URL and dimensions of a Payload media doc (or of one of its sizes). */
export function mediaSrc(media: number | Media | null | undefined, size?: ImageSize) {
  if (!media || typeof media === "number") return undefined;
  const sized = size ? media.sizes?.[size] : undefined;
  const raw = sized?.url || media.url;
  if (!raw) return undefined;
  // Same-site file URLs become relative, without the slash Payload adds after the extension.
  const url = raw.replace(/^https?:\/\/[^/]+(?=\/api\/media\/)/, "").replace(/(\.[a-z0-9]{2,5})\/$/i, "$1");
  return {
    src: url,
    width: (sized?.width || media.width || 1200) as number,
    height: (sized?.height || media.height || 800) as number,
    alt: media.alt || "",
  };
}
