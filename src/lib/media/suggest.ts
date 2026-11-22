import "server-only";

import { JSDOM } from "jsdom";
import type { Payload, TypedUser } from "payload";

import { decryptSecret } from "@/lib/ai/crypto";
import { mockAllowed } from "@/lib/ai/providers";
import { safeFetch } from "@/lib/desk/fetchSource";

import { PhotoError, reencode } from "./fromUrl";

/**
 * Photo suggestions for drafts in review. Nothing here publishes or attaches anything: it
 * lists candidates, and an editor picks one (which then goes through importPhotoFromUrl,
 * the same path as the connector's attach_photo). Three layers:
 *   1. source: images found on the item's own source pages (og:image, large <img>),
 *      fetched with the desk's safe fetch, credited to the site, flagged "check rights";
 *   2. pexels: free stock photos, only when PEXELS_API_KEY is set (credit the photographer
 *      and link to Pexels, as their terms require);
 *   3. ai: an AI illustration, only for generic topics (posts and guide pages), only when an
 *      editor clicks Generate, labelled "AI illustration", never of real people, places or events.
 */

export type Suggestion = {
  kind: "source" | "pexels" | "ai";
  url: string; // full-size image to import
  thumb: string; // small preview
  alt: string;
  credit: string;
  link?: string; // page to credit / check
  note?: string; // e.g. "Check you may use this photo"
};

export const SUGGEST_COLLECTIONS = ["posts", "events", "places", "city-projects", "desk-pages"] as const;
export type SuggestCollection = (typeof SUGGEST_COLLECTIONS)[number];
/** AI illustrations are only for generic topics: never places, events or City projects (real things). */
export const AI_COLLECTIONS: SuggestCollection[] = ["posts", "desk-pages"];

const URL_RE = /https:\/\/[^\s"'<>)\]]+/g;
const SKIP_HOSTS = /(^|\.)(google\.[a-z.]+|goo\.gl|maps\.app\.goo\.gl|facebook\.com|instagram\.com|x\.com|twitter\.com|tiktok\.com|yelp\.com|youtube\.com|youtu\.be|linkedin\.com)$/i;

/** Pages worth looking at for photos: the item's own website and the sources in its review note or fields. */
export function sourcePages(doc: Record<string, unknown>): string[] {
  const found: string[] = [];
  const push = (u: unknown) => {
    if (typeof u !== "string") return;
    for (const m of u.match(URL_RE) ?? []) found.push(m.replace(/[.,;:]+$/, ""));
  };
  push(doc.website);
  for (const l of (doc.links as { url?: string }[] | undefined) ?? []) push(l?.url);
  for (const s of (doc.sources as { url?: string }[] | undefined) ?? []) push(s?.url);
  push((doc.review as { note?: string } | undefined)?.note);
  const out: string[] = [];
  for (const u of found) {
    try {
      const url = new URL(u);
      if (SKIP_HOSTS.test(url.hostname) || /\.(jpe?g|png|gif|webp|pdf)$/i.test(url.pathname)) continue;
      if (!out.some((x) => x === url.href)) out.push(url.href);
    } catch {
      /* not a URL */
    }
  }
  return out.slice(0, 5);
}

/** Candidate photos in one page's HTML: social preview image first, then large inline images. */
export function imagesInHtml(html: string, pageUrl: string): { url: string; alt: string }[] {
  const doc = new JSDOM(html).window.document;
  const out: { url: string; alt: string }[] = [];
  const add = (raw: string | null | undefined, alt: string) => {
    if (!raw) return;
    try {
      const u = new URL(raw.trim(), pageUrl);
      if (u.protocol !== "https:" || /\.svg($|\?)/i.test(u.pathname) || /(logo|icon|sprite|pixel|spacer|avatar|badge)/i.test(u.pathname)) return;
      if (!out.some((x) => x.url === u.href)) out.push({ url: u.href, alt: alt.replace(/\s+/g, " ").trim().slice(0, 200) });
    } catch {
      /* bad URL */
    }
  };
  const title = doc.querySelector('meta[property="og:title"]')?.getAttribute("content") || doc.title || "";
  add(doc.querySelector('meta[property="og:image"], meta[property="og:image:url"]')?.getAttribute("content"), title);
  add(doc.querySelector('meta[name="twitter:image"]')?.getAttribute("content"), title);
  for (const img of doc.querySelectorAll("img")) {
    const w = Number(img.getAttribute("width") || 0);
    const h = Number(img.getAttribute("height") || 0);
    if ((w && w < 400) || (h && h < 260)) continue;
    // The largest candidate from srcset, else src (lazy-load attributes too).
    const set = (img.getAttribute("srcset") || img.getAttribute("data-srcset") || "")
      .split(",")
      .map((s) => s.trim().split(/\s+/))
      .filter((p) => p[0])
      .sort((a, b) => parseInt(b[1] || "0") - parseInt(a[1] || "0"));
    add(set[0]?.[0] || img.getAttribute("data-src") || img.getAttribute("src"), img.getAttribute("alt") || title);
    if (out.length >= 8) break;
  }
  return out;
}

export async function fromSourcePages(doc: Record<string, unknown>): Promise<{ suggestions: Suggestion[]; checked: string[]; errors: string[] }> {
  const pages = sourcePages(doc);
  const suggestions: Suggestion[] = [];
  const errors: string[] = [];
  for (const page of pages) {
    try {
      const r = await safeFetch(page);
      if (!/html/i.test(r.contentType)) continue;
      const host = new URL(r.url).hostname.replace(/^www\./, "");
      for (const img of imagesInHtml(r.body, r.url).slice(0, 6))
        suggestions.push({ kind: "source", url: img.url, thumb: img.url, alt: img.alt, credit: `Photo: ${host}`, link: r.url, note: "From the source page: check you may use it before publishing." });
    } catch (e) {
      errors.push(`${page}: ${(e as Error).message}`);
    }
    if (suggestions.length >= 12) break;
  }
  return { suggestions: suggestions.slice(0, 12), checked: pages, errors };
}

type PexelsPhoto = { url: string; alt?: string; photographer: string; photographer_url: string; src: { large2x: string; medium: string } };

/** Free stock photos from Pexels (needs PEXELS_API_KEY). */
export async function fromPexels(query: string, fetcher: typeof fetch = fetch): Promise<Suggestion[]> {
  const key = process.env.PEXELS_API_KEY;
  if (!key || !query.trim()) return [];
  const u = new URL("https://api.pexels.com/v1/search");
  u.searchParams.set("query", query.trim().slice(0, 100));
  u.searchParams.set("per_page", "9");
  u.searchParams.set("orientation", "landscape");
  const res = await fetcher(u, { headers: { Authorization: key }, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`Pexels answered ${res.status}`);
  const j = (await res.json()) as { photos?: PexelsPhoto[] };
  return (j.photos ?? []).map((p) => ({
    kind: "pexels",
    url: p.src.large2x,
    thumb: p.src.medium,
    alt: p.alt || query,
    credit: `Photo by ${p.photographer} on Pexels`,
    link: p.url,
  }));
}

/** Search words for stock photos: the item's title plus, for places, its categories. */
export function searchQuery(doc: Record<string, unknown>): string {
  const title = String(doc.title ?? doc.name ?? "");
  const cats = ((doc.guide as { categories?: string[] } | undefined)?.categories ?? (doc.cuisines as string[] | undefined) ?? []).slice(0, 2);
  return [cats.length ? cats.join(" ") : title].join(" ").replace(/san carlos|california|\bca\b/gi, "").replace(/\s+/g, " ").trim() || title;
}

/** What we ask the image model for: a generic editorial illustration, never real people or places. */
export function illustrationPrompt(topic: string): string {
  return [
    "Editorial illustration for a local community website article.",
    `Topic: ${topic.replace(/\s+/g, " ").trim().slice(0, 300)}.`,
    "Generic and symbolic: no text or lettering, no logos or brands, no real or recognizable people, no real buildings, landmarks or maps, no news events.",
    "Warm, calm palette with teal and sand tones, soft light, clean shapes, landscape composition.",
  ].join(" ");
}

/**
 * Generates one AI illustration with an OpenAI connection and stores it in the media library
 * (credit "AI illustration", re-encoded like every imported photo). Only for posts and guide pages.
 */
export async function generateIllustration(
  payload: Payload,
  user: TypedUser,
  input: { connectionId?: string | null; topic: string; alt: string },
): Promise<{ id: number | string; url?: string }> {
  const conns = await payload.find({
    collection: "ai-connections",
    where: input.connectionId ? { id: { equals: input.connectionId } } : { and: [{ enabled: { equals: true } }, { provider: { in: ["openai", "mock"] } }] },
    sort: "-isDefault",
    limit: 1,
    depth: 0,
    overrideAccess: true,
    context: { revealKey: true },
  });
  const c = conns.docs[0];
  if (!c || !c.enabled) throw new PhotoError("AI illustrations need an OpenAI connection (Operations Desk → AI connections).");
  let bytes: Buffer;
  if (c.provider === "mock") {
    if (!mockAllowed()) throw new PhotoError("The Test AI only works on a local or test site.");
    // A plain teal test image, so tests never spend money.
    const sharp = (await import("sharp")).default;
    bytes = await sharp({ create: { width: 1536, height: 1024, channels: 3, background: { r: 31, g: 122, b: 122 } } }).png().toBuffer();
  } else if (c.provider === "openai") {
    if (!c.apiKey) throw new PhotoError(`The connection "${c.name}" has no API key saved.`);
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${decryptSecret(c.apiKey)}` },
      body: JSON.stringify({ model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1", prompt: illustrationPrompt(input.topic), size: "1536x1024", n: 1 }),
      signal: AbortSignal.timeout(180_000),
    });
    const j = (await res.json().catch(() => ({}))) as { data?: { b64_json?: string }[]; error?: { message?: string } };
    if (!res.ok || !j.data?.[0]?.b64_json) throw new PhotoError(`The image service answered ${res.status}: ${j.error?.message ?? "no image"}`);
    bytes = Buffer.from(j.data[0].b64_json, "base64");
  } else {
    throw new PhotoError("AI illustrations work with an OpenAI connection only.");
  }
  const { buffer } = await reencode(bytes);
  const media = await payload.create({
    collection: "media",
    data: { alt: input.alt, credit: "AI illustration", caption: "AI illustration" },
    file: { data: buffer, mimetype: "image/jpeg", name: `ai-illustration-${Date.now().toString(36)}.jpg`, size: buffer.length },
    user,
    overrideAccess: false,
  });
  return { id: media.id, url: (media as { url?: string }).url };
}
