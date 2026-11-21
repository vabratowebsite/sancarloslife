/**
 * Shared helpers for the WordPress → Payload migration scripts.
 * Run scripts with: pnpm payload run scripts/migrate/<n>-<name>.ts
 */
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { decodeHTML } from "entities";
import { getPayload, type Payload } from "payload";

import config from "../../src/payload.config";
import { cleanWordPressHtml } from "../../src/lib/sanitize";

export const DATA = path.resolve(import.meta.dirname, "data");
export const SITE = "https://sancarloslife.com";

export async function loadJson<T = unknown>(name: string): Promise<T> {
  return JSON.parse(await readFile(path.join(DATA, `${name}.json`), "utf8")) as T;
}

export async function loadJsonOr<T>(name: string, fallback: T): Promise<T> {
  const file = path.join(DATA, `${name}.json`);
  return existsSync(file) ? (JSON.parse(await readFile(file, "utf8")) as T) : fallback;
}

export async function saveJson(name: string, data: unknown) {
  await writeFile(path.join(DATA, `${name}.json`), JSON.stringify(data, null, 1));
}

let payloadPromise: Promise<Payload> | undefined;
export const payload = () => (payloadPromise ??= getPayload({ config }));

/** "Caf&eacute; &#8211; Laurel" → "Café – Laurel" */
export const text = (s: string | undefined | null) =>
  decodeHTML(String(s ?? "").replace(/<[^>]+>/g, "")).replace(/ | /g, " ").replace(/\s+/g, " ").trim();

/** Absolute links to the old site become relative, so they keep working after cutover. */
export const relativize = (html: string) =>
  html.replace(/https?:\/\/(?:www\.)?sancarloslife\.com(\/(?!wp-content\/)[^"'\s<>]*)/g, "$1");

/** A Lexical document holding one sanitized HTML block (how WordPress bodies are stored). */
export function htmlToLexical(html: string) {
  return {
    root: {
      type: "root",
      format: "" as const,
      indent: 0,
      version: 1,
      direction: null,
      children: html
        ? [
            {
              type: "block",
              version: 2,
              format: "" as const,
              fields: { id: Math.random().toString(16).slice(2, 14), blockName: "", blockType: "rawHtml", html },
            },
          ]
        : [],
    },
  };
}

// ---------------------------------------------------------------- media

type WpMedia = {
  id: number;
  source_url: string;
  mime_type: string;
  alt_text: string;
  title: { rendered: string };
  caption: { rendered: string };
  media_details?: { sizes?: Record<string, { source_url: string }> };
};

/**
 * Copies WordPress attachments into Payload on first use. Only media that the
 * migrated content actually uses is copied. Progress lives in data/media-map.json
 * ({ wpId: { id, url } }) so reruns skip finished files.
 */
export class MediaImporter {
  private byId = new Map<number, WpMedia>();
  private byUrl = new Map<string, number>();
  private map: Record<string, { id: number; url: string }> = {};
  private dirty = 0;

  static async create() {
    const m = new MediaImporter();
    const media = await loadJson<WpMedia[]>("media");
    for (const item of media) {
      m.byId.set(item.id, item);
      m.byUrl.set(stripHost(item.source_url), item.id);
      for (const size of Object.values(item.media_details?.sizes ?? {})) m.byUrl.set(stripHost(size.source_url), item.id);
    }
    m.map = await loadJsonOr("media-map", {});
    for (const v of Object.values(m.map)) v.url = cleanMediaUrl(v.url);
    return m;
  }

  async save() {
    await saveJson("media-map", this.map);
    this.dirty = 0;
  }

  /** Payload media id for a WordPress attachment id (copies the file if needed). */
  async ensure(wpId: number | string | null | undefined): Promise<number | undefined> {
    const id = Number(wpId);
    if (!id) return undefined;
    if (this.map[id]) return this.map[id].id;
    const wp = this.byId.get(id);
    if (!wp) return undefined;
    return this.copy(wp);
  }

  /** Same, starting from any upload URL (including resized variants like -300x200.jpg). */
  async ensureByUrl(url: string): Promise<{ id: number; url: string } | undefined> {
    const key = stripHost(url);
    let wpId = this.byUrl.get(key);
    // A size variant not listed in media_details: try the original file name.
    if (!wpId) wpId = this.byUrl.get(key.replace(/-\d+x\d+(?=\.\w+$)/, "").replace(/-scaled(?=\.\w+$)/, ""));
    if (wpId) {
      await this.ensure(wpId);
      return this.map[wpId];
    }
    return this.copyLoose(url);
  }

  /** An upload that isn't in the media library export (deleted attachment, manual upload). */
  private async copyLoose(url: string): Promise<{ id: number; url: string } | undefined> {
    const key = `url:${stripHost(url)}`;
    if (this.map[key]) return this.map[key];
    if (!/\.(jpe?g|png|webp|gif|svg|pdf)$/i.test(url)) return undefined;
    const res = await fetch(url, { headers: { "User-Agent": "SanCarlosLife-migration/1.0" } });
    if (!res.ok) {
      console.warn(`  upload missing on the old site: ${res.status} ${url}`);
      return undefined;
    }
    const data = Buffer.from(await res.arrayBuffer());
    const name = decodeURIComponent(url.split("/").pop() || "file");
    const alt = name.replace(/\.\w+$/, "").replace(/-\d+x\d+$/, "").replace(/[-_]+/g, " ");
    const p = await payload();
    const doc = await p.create({
      collection: "media",
      data: { alt },
      file: { data, mimetype: res.headers.get("content-type") || "application/octet-stream", name, size: data.length },
    });
    this.map[key] = { id: doc.id as number, url: cleanMediaUrl(doc.url ?? "") };
    if (++this.dirty >= 10) await this.save();
    return this.map[key];
  }

  private async copy(wp: WpMedia): Promise<number | undefined> {
    const res = await fetch(wp.source_url, { headers: { "User-Agent": "SanCarlosLife-migration/1.0" } });
    if (!res.ok) {
      console.warn(`  media ${wp.id}: ${res.status} ${wp.source_url}`);
      return undefined;
    }
    const data = Buffer.from(await res.arrayBuffer());
    const name = decodeURIComponent(wp.source_url.split("/").pop() || `wp-${wp.id}`);
    const p = await payload();
    const existing = await p.find({ collection: "media", where: { wpAttachmentId: { equals: wp.id } }, limit: 1 });
    const doc =
      existing.docs[0] ??
      (await p.create({
        collection: "media",
        data: {
          alt: text(wp.alt_text) || text(wp.title?.rendered) || "San Carlos, California",
          caption: text(wp.caption?.rendered) || undefined,
          wpAttachmentId: wp.id,
        },
        file: { data, mimetype: wp.mime_type, name, size: data.length },
      }));
    this.map[wp.id] = { id: doc.id as number, url: cleanMediaUrl(doc.url ?? "") };
    if (++this.dirty >= 10) await this.save();
    return doc.id as number;
  }

  /**
   * Rewrites every /wp-content/uploads/ URL in the HTML to the copied media file,
   * and drops srcset (the new site builds its own sizes).
   */
  async rewriteHtml(html: string): Promise<string> {
    const urls = new Set(
      [...html.matchAll(/https?:\/\/(?:www\.)?sancarloslife\.com\/wp-content\/uploads\/[^"'\s<>)]+/g)].map((m) => m[0]),
    );
    let out = html.replace(/\s(?:srcset|sizes)="[^"]*"/g, "");
    for (const url of urls) {
      const hit = await this.ensureByUrl(url);
      if (hit?.url) out = out.split(url).join(hit.url);
    }
    return out;
  }
}

const stripHost = (u: string) => u.replace(/^https?:\/\/(?:www\.)?sancarloslife\.com/, "");

/** Payload file URLs stored in content: relative, no trailing slash after the extension. */
export const cleanMediaUrl = (u: string) =>
  u.replace(/^https?:\/\/[^/]+(?=\/api\/media\/)/, "").replace(/(\.[a-z0-9]{2,5})\/$/i, "$1");

/** Full cleanup for a WordPress HTML body: media, links, Divi markup, sanitizing. */
export async function migrateHtml(html: string, media: MediaImporter) {
  return relativize(cleanWordPressHtml(await media.rewriteHtml(html)));
}

// ---------------------------------------------------------------- SEO

export type ScrapedSeo = {
  url: string;
  status: number;
  title?: string;
  description?: string;
  canonical?: string;
  robots?: string;
  ogImage?: string;
  jsonLd?: unknown[];
};

/** SEO group values from the scraped Rank Math head of the old URL. */
export function seoFrom(scraped: ScrapedSeo | undefined, fallbackTitle: string) {
  if (!scraped || scraped.status !== 200) return { seo: {}, jsonLd: undefined };
  const title = scraped.title && scraped.title !== fallbackTitle ? scraped.title.replace(/\s*[|–-]\s*San Carlos Life\s*$/i, "") : undefined;
  // Keep only content schema (Article, Event, FAQ ...); the site adds Organization/WebSite itself.
  const graph = (scraped.jsonLd ?? []).flatMap((j) => ((j as { "@graph"?: unknown[] })["@graph"] ?? [j]) as Record<string, unknown>[]);
  const keep = graph.filter((n) => {
    const t = ([] as unknown[]).concat(n["@type"] ?? []).map(String);
    return t.some((x) => ["FAQPage", "HowTo", "Recipe", "Review", "LocalBusiness", "Restaurant", "Store"].includes(x));
  });
  return {
    seo: {
      title,
      description: trimDescription(scraped.description),
      noindex: /noindex/i.test(scraped.robots ?? ""),
    },
    jsonLd: keep.length ? keep : undefined,
  };
}

/**
 * Rank Math fills missing descriptions with the opening paragraph (up to 800+
 * characters). Hand-written ones (≤300) are kept as they are; automatic ones are
 * trimmed to ~155 characters on a word boundary.
 */
export function trimDescription(d: string | undefined) {
  if (!d || d.length <= 300) return d;
  const cut = d.slice(0, 156);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.\s]+$/, "") + "…";
}

export async function seoIndex() {
  return loadJsonOr<Record<string, ScrapedSeo>>("seo", {});
}

/** Run a script body, then close the database pool so the process exits. */
export async function run(name: string, fn: () => Promise<void>) {
  const started = Date.now();
  try {
    await fn();
    console.log(`${name} finished in ${Math.round((Date.now() - started) / 1000)}s`);
    process.exit(0);
  } catch (e) {
    console.error(`${name} failed`, e);
    process.exit(1);
  }
}
