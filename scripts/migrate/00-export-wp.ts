/**
 * Milestone 5: pull every public content item from the live WordPress site into
 * scripts/migrate/data/*.json. Read-only: GET requests to the public REST API.
 *
 *   pnpm migrate:export            # everything
 *   pnpm migrate:export posts pages  # only these sets
 *
 * Drafts and private items need WP_APP_USER + WP_APP_PASSWORD (an application
 * password); without them only published content is exported.
 *
 * Node's fetch only uses HTTPS_PROXY when NODE_USE_ENV_PROXY=1 (set by the
 * package script).
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SITE = process.env.WP_SITE_URL || "https://sancarloslife.com";
const OUT = path.resolve(import.meta.dirname, "data");
const auth =
  process.env.WP_APP_USER && process.env.WP_APP_PASSWORD
    ? "Basic " + Buffer.from(`${process.env.WP_APP_USER}:${process.env.WP_APP_PASSWORD}`).toString("base64")
    : undefined;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getJson(url: string, attempt = 1): Promise<{ body: unknown; headers: Headers }> {
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "SanCarlosLife-migration/1.0", ...(auth ? { Authorization: auth } : {}) },
  });
  if ((res.status === 429 || res.status >= 500) && attempt < 5) {
    await sleep(2000 * attempt);
    return getJson(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`${res.status} ${url}\n${(await res.text()).slice(0, 300)}`);
  return { body: await res.json(), headers: res.headers };
}

/** WordPress core-style pagination (X-WP-TotalPages). */
async function pageAll(endpoint: string, params: Record<string, string> = {}): Promise<unknown[]> {
  const all: unknown[] = [];
  for (let page = 1; ; page++) {
    const qs = new URLSearchParams({ per_page: "100", page: String(page), ...params });
    const { body, headers } = await getJson(`${SITE}/wp-json/${endpoint}?${qs}`);
    all.push(...(body as unknown[]));
    const totalPages = Number(headers.get("x-wp-totalpages") || 1);
    process.stdout.write(`\r  ${endpoint}: page ${page}/${totalPages} (${all.length})   `);
    if (page >= totalPages) break;
    await sleep(250);
  }
  process.stdout.write("\n");
  return all;
}

/** The Events Calendar's own API (pagination in the body, not headers). */
async function tribeAll(resource: "events" | "venues" | "organizers" | "categories", params: Record<string, string> = {}) {
  const key = resource;
  const all: unknown[] = [];
  for (let page = 1; ; page++) {
    const qs = new URLSearchParams({ per_page: "50", page: String(page), ...params });
    const { body } = await getJson(`${SITE}/wp-json/tribe/events/v1/${resource}?${qs}`);
    const b = body as Record<string, unknown> & { total_pages?: number };
    all.push(...((b[key] as unknown[]) ?? []));
    const totalPages = Number(b.total_pages || 1);
    process.stdout.write(`\r  tribe ${resource}: page ${page}/${totalPages} (${all.length})   `);
    if (page >= totalPages) break;
    await sleep(250);
  }
  process.stdout.write("\n");
  return all;
}

const status: Record<string, string> = auth ? { status: "publish,draft,pending,private,future" } : {};

const sets: Record<string, () => Promise<unknown>> = {
  posts: () => pageAll("wp/v2/posts", { ...status, context: auth ? "edit" : "view" }),
  pages: () => pageAll("wp/v2/pages", { ...status, context: auth ? "edit" : "view" }),
  media: () => pageAll("wp/v2/media"),
  categories: () => pageAll("wp/v2/categories"),
  tags: () => pageAll("wp/v2/tags"),
  restaurants: () => pageAll("wp/v2/restaurant"),
  stores: () => pageAll("wp/v2/store"),
  projects: () => pageAll("wp/v2/project"),
  // Restaurant and store taxonomies (cuisine, meal, ...), keyed by taxonomy.
  taxonomies: async () => {
    const out: Record<string, unknown[]> = {};
    for (const tax of [
      "price_range", "meal", "cuisine", "feature", "special_diet", "restaurant_type",
      "restaurant_highlight", "featured_restaurant", "restaurant_location", "product_service_type",
      "project_category", "tribe_events_cat",
    ]) {
      out[tax] = await pageAll(`wp/v2/${tax}`);
    }
    return out;
  },
  events: () => tribeAll("events", { start_date: "2000-01-01 00:00:00", end_date: "2035-12-31 23:59:59" }),
  venues: () => tribeAll("venues"),
  organizers: () => tribeAll("organizers"),
  eventCategories: () => tribeAll("categories"),
  // Raw wp/v2 records for events/venues carry fields the tribe API omits (featured_media, tags).
  eventsWp: () => pageAll("wp/v2/tribe_events"),
  // Every URL the live site publishes, from the Rank Math sitemaps.
  sitemap: async () => {
    const index = await (await fetch(`${SITE}/sitemap_index.xml`)).text();
    const maps = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const urls: { sitemap: string; url: string; lastmod?: string }[] = [];
    for (const map of maps) {
      const xml = await (await fetch(map)).text();
      for (const m of xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>(?:\s*<lastmod>([^<]+)<\/lastmod>)?/g)) {
        urls.push({ sitemap: map, url: m[1], lastmod: m[2] });
      }
      await sleep(250);
    }
    console.log(`  sitemap: ${maps.length} sitemaps, ${urls.length} URLs`);
    return urls;
  },
};

async function main() {
  await mkdir(OUT, { recursive: true });
  const wanted = process.argv.slice(2);
  const names = wanted.length ? wanted : Object.keys(sets);
  const counts: Record<string, number> = {};
  for (const name of names) {
    const fn = sets[name];
    if (!fn) throw new Error(`Unknown set "${name}". Known: ${Object.keys(sets).join(", ")}`);
    console.log(`Exporting ${name}...`);
    const data = await fn();
    await writeFile(path.join(OUT, `${name}.json`), JSON.stringify(data, null, 1));
    counts[name] = Array.isArray(data) ? data.length : Object.values(data as Record<string, unknown[]>).reduce((n, v) => n + v.length, 0);
  }
  await writeFile(
    path.join(OUT, `export-summary${wanted.length ? "-partial" : ""}.json`),
    JSON.stringify({ site: SITE, at: new Date().toISOString(), authenticated: Boolean(auth), counts }, null, 2),
  );
  console.table(counts);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
