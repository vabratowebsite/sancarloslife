/**
 * Reads the SEO head (Rank Math output) of every post, page, restaurant, store,
 * event and timeline page on the live site: title, description, canonical,
 * robots, social image and JSON-LD. Rank Math doesn't expose these over the
 * REST API without an admin login, so the rendered HTML is the source.
 *
 * Resumable: URLs already in data/seo.json are skipped.
 *   pnpm migrate:seo
 */
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DATA = path.resolve(import.meta.dirname, "data");
const OUT = path.join(DATA, "seo.json");
const CONCURRENCY = 3;

type Seo = {
  url: string;
  status: number;
  title?: string;
  description?: string;
  canonical?: string;
  robots?: string;
  ogImage?: string;
  focusKeyword?: string;
  jsonLd?: unknown[];
  error?: string;
};

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&#x27;|&apos;/g, "'")
    .replace(/&#8217;/g, "’")
    .replace(/&#8216;/g, "‘")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#038;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();

function meta(html: string, attr: "name" | "property", key: string): string | undefined {
  const re = new RegExp(`<meta[^>]+${attr}=["']${key}["'][^>]*>`, "i");
  const tag = html.match(re)?.[0];
  const content = tag?.match(/content=["']([^"']*)["']/i)?.[1];
  return content ? decode(content) : undefined;
}

export function parseHead(url: string, status: number, html: string): Seo {
  const head = html.split(/<\/head>/i)[0] ?? html;
  const jsonLd: unknown[] = [];
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      jsonLd.push(JSON.parse(m[1]));
    } catch {
      // Ignore malformed blocks.
    }
  }
  return {
    url,
    status,
    title: head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] && decode(head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)![1]),
    description: meta(head, "name", "description"),
    canonical: head.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1],
    robots: meta(head, "name", "robots"),
    ogImage: meta(head, "property", "og:image"),
    jsonLd,
  };
}

async function main() {
  const sitemap: { url: string }[] = JSON.parse(await readFile(path.join(DATA, "sitemap.json"), "utf8"));
  const done: Record<string, Seo> = existsSync(OUT) ? JSON.parse(await readFile(OUT, "utf8")) : {};
  const todo = sitemap.map((s) => s.url).filter((u) => !done[u]);
  console.log(`${Object.keys(done).length} done, ${todo.length} to fetch`);

  let i = 0;
  let sinceSave = 0;
  async function worker() {
    while (i < todo.length) {
      const url = todo[i++];
      try {
        const res = await fetch(url, { headers: { "User-Agent": "SanCarlosLife-migration/1.0" }, redirect: "manual" });
        const html = res.status === 200 ? await res.text() : "";
        done[url] = res.status === 200 ? parseHead(url, res.status, html) : { url, status: res.status };
      } catch (e) {
        done[url] = { url, status: 0, error: String(e) };
      }
      if (++sinceSave >= 25) {
        sinceSave = 0;
        await writeFile(OUT, JSON.stringify(done));
        process.stdout.write(`\r${Object.keys(done).length}/${sitemap.length}   `);
      }
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  await writeFile(OUT, JSON.stringify(done));
  const statuses: Record<string, number> = {};
  for (const s of Object.values(done)) statuses[s.status] = (statuses[s.status] ?? 0) + 1;
  console.log("\nstatus counts", statuses);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
