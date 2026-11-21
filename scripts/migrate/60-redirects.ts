/**
 * Milestone 10: builds the Redirects collection so every old URL lands on a live
 * page in one hop.
 *   Sources: Rank Math redirections (rankmath-redirects.json), sitemap URLs that
 *   the live site already redirects, and URLs whose content moved in the rebuild.
 * Chains are collapsed; targets that don't exist on the new site are reported.
 *   pnpm payload run scripts/migrate/60-redirects.ts
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

import { isGone } from "./gone";
import { loadJson, payload, run, saveJson, SITE } from "./lib";

type RankMath = { rows: { pattern: string; to: string; status: string; code: number }[] };
type Seo = Record<string, { status: number }>;

const norm = (p: string) => {
  let x = p.replace(/^https?:\/\/(?:www\.)?sancarloslife\.com/, "");
  if (!x.startsWith("/")) x = "/" + x;
  x = x.split("#")[0];
  const [pathPart, query] = x.split("?");
  const withSlash = pathPart.endsWith("/") ? pathPart : `${pathPart}/`;
  return query ? `${withSlash}?${query}` : withSlash;
};

/** Paths served by templates rather than documents (milestones 11–24). */
const STATIC_ROUTES = [
  "/", "/events/", "/events/month/", "/events/submit/", "/san-carlos-life-blog/", "/search/", "/subscribe/",
  "/contact-us/", "/thank-you/", "/the-neighborhood/", "/restaurants-and-services/",
  "/restaurants-and-services/all-restaurants/", "/restaurants-and-services/all-shops-services/",
  "/history-of-san-carlos/", "/city-projects/", "/gallery/", "/videos-of-san-carlos-ca/",
  "/parks-of-san-carlos/", "/homes-for-sale-in-san-carlos-ca/", "/open-houses-in-san-carlos-ca/",
  "/san-carlos-ca-real-estate-market-trends/", "/how-much-house-can-i-afford-mortgage-calculator/",
  "/sell-my-house/", "/one-of-the-best-realtor-teams-in-san-carlos-ca/", "/buyers-and-sellers-guides/",
  "/listing-results/", "/listing-details/", "/market-area-report/", "/featured-communities/",
];

/** Content that moved or was dropped in the rebuild. */
const MOVED: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^\/timeline\/.*$/, () => "/history-of-san-carlos/"],
  [/^\/testimonial\/.*$/, () => "/one-of-the-best-realtor-teams-in-san-carlos-ca/"],
  [/^\/restaurant_type\/([^/]+)\/$/, (m) => `/restaurants-and-services/all-restaurants/?type=${m[1]}`],
  [/^\/project\/things-to-do\/$/, () => "/explore-the-city/"],
  [/^\/project\/the-neighborhood\/$/, () => "/the-neighborhood/"],
  [/^\/project\/realtor-market-data-on-san-carlos\/$/, () => "/san-carlos-ca-real-estate-market-trends/"],
  [/^\/iframe-map-(?:beverley-terrace)\/$/, () => "/beverly-terrace/"],
  [/^\/iframe-map-([a-z-]+)\/$/, (m) => `/${m[1]}/`],
  [/^\/(?:test|sample-page-3|sample-end-page-call-to-actions|welcome2024)\/$/, () => "/"],
  [/^\/real-estate-call-to-action-shortcode\/$/, () => "/homes-for-sale-in-san-carlos-ca/"],
  [/^\/cookie-consent\/$/, () => "/cookie-policy/"],
  [/^\/divi-login-designer\/$/, () => "/"],
  [/^\/all-restaurants\/$/, () => "/restaurants-and-services/all-restaurants/"],
  [/^\/all-shops-services\/$/, () => "/restaurants-and-services/all-shops-services/"],
  // Old custom post type archives.
  [/^\/restaurant\/$/, () => "/restaurants-and-services/all-restaurants/"],
  [/^\/store\/$/, () => "/restaurants-and-services/all-shops-services/"],
  // Dated occurrences of single events (/event/<slug>/<yyyy-mm-dd>/) go to the event.
  [/^\/event\/([^/]+)\/\d{4}-\d{2}-\d{2}\/$/, (m) => `/event/${m[1]}/`],
  // Organizer and venue archive pages aren't rebuilt; their events are on the calendar.
  [/^\/(?:organizer|venue)\/[^/]+\/$/, () => "/events/"],
];

/** Old Rank Math targets that no longer exist anywhere, pointed at today's equivalent page. */
const TARGET_OVERRIDES: Record<string, string> = {
  "/real-estate-in-san-carlos-ca/": "/san-carlos-ca-real-estate-and-homes-for-sale/",
  "/real-estate-market-for-san-carlos-ca/": "/san-carlos-ca-real-estate-market-trends/",
  "/event/art-and-wine-faire/2023-10-07/": "/event/art-and-wine-faire-san-carlos-festival/",
  "/lark-voted-best-gift-shop-san-mateo-area/": "/lark-san-carlos-best-gift-shop-san-mateo-area/",
};

await run("redirects", async () => {
  const p = await payload();

  // Every path the new site will answer with 200.
  const live = new Set(STATIC_ROUTES);
  const add = (prefix: string, docs: { slug?: string | null }[]) => docs.forEach((d) => d.slug && live.add(`${prefix}${d.slug}/`));
  const all = async (collection: "posts" | "pages" | "neighborhoods" | "places" | "events" | "city-projects", extra = {}) =>
    (await p.find({ collection, limit: 5000, depth: 0, draft: false, pagination: false, ...extra })).docs as unknown as { slug: string; type?: string }[];
  add("/", await all("posts"));
  add("/", await all("pages"));
  add("/", await all("neighborhoods"));
  add("/event/", await all("events"));
  add("/city-projects/", await all("city-projects"));
  for (const place of await all("places")) live.add(`/${place.type === "restaurant" || place.type === "bar" ? "restaurant" : "store"}/${place.slug}/`);
  // Places keep their old type in the URL: restaurants and stores came from separate WordPress types.
  const restaurants = new Set((await loadJson<{ slug: string }[]>("restaurants")).map((r) => r.slug));
  for (const place of await all("places")) {
    live.delete(`/restaurant/${place.slug}/`);
    live.delete(`/store/${place.slug}/`);
    live.add(restaurants.has(place.slug) ? `/restaurant/${place.slug}/` : `/store/${place.slug}/`);
  }
  for (const c of (await p.find({ collection: "event-categories", limit: 500, pagination: false })).docs) live.add(`/events/category/${c.slug}/`);
  for (const c of (await p.find({ collection: "categories", limit: 500, pagination: false })).docs) live.add(`/category/${c.slug}/`);

  const redirects = new Map<string, { to: string; code: "301" | "410"; source: string }>();
  const rm = JSON.parse(await readFile(path.resolve(import.meta.dirname, "rankmath-redirects.json"), "utf8")) as RankMath;
  for (const r of rm.rows) {
    if (r.status !== "active") continue;
    const to = norm(r.to);
    redirects.set(norm(r.pattern), { to: TARGET_OVERRIDES[to] ?? to, code: "301", source: "rankmath" });
  }

  // Sitemap URLs: anything not answered by the new site needs a rule.
  const sitemap = await loadJson<{ url: string }[]>("sitemap");
  const seo = await loadJson<Seo>("seo");
  for (const { url } of sitemap) {
    const from = norm(url);
    if (live.has(from) || redirects.has(from)) continue;
    if (isGone(from)) {
      redirects.set(from, { to: "", code: "410", source: "rebuild" });
      continue;
    }
    const moved = MOVED.find(([re]) => re.test(from));
    if (moved) {
      redirects.set(from, { to: moved[1](from.match(moved[0])!), code: "301", source: "rebuild" });
      continue;
    }
    if (seo[url]?.status === 301 || seo[url]?.status === 302) {
      // Ask the live site where it sends this URL today.
      const res = await fetch(url, { redirect: "follow", headers: { "User-Agent": "SanCarlosLife-migration/1.0" } });
      redirects.set(from, { to: norm(res.url), code: "301", source: "live-301" });
    }
  }
  // Dropped pages that aren't in the sitemap.
  for (const slug of ["test", "sample-page-3", "sample-end-page-call-to-actions", "real-estate-call-to-action-shortcode", "divi-login-designer", "welcome2024", "cookie-consent", "iframe-map-howard-park", "iframe-map-el-sereno", "iframe-map-cordes", "iframe-map-clearfield-park", "iframe-map-beverley-terrace", "iframe-map-alder-manor", "all-restaurants", "all-shops-services"]) {
    const from = `/${slug}/`;
    if (redirects.has(from) || live.has(from)) continue;
    const moved = MOVED.find(([re]) => re.test(from))!;
    redirects.set(from, { to: moved[1](from.match(moved[0])!), code: "301", source: "rebuild" });
  }

  // Collapse chains and check every target.
  const unresolved: { from: string; to: string }[] = [];
  const resolve = (to: string, seen = new Set<string>()): string | undefined => {
    const bare = to.split("?")[0];
    if (live.has(bare)) return to;
    if (seen.has(to)) return undefined;
    seen.add(to);
    const next = redirects.get(bare);
    if (next) return resolve(next.to, seen);
    const moved = MOVED.find(([re]) => re.test(bare));
    if (moved) return resolve(moved[1](bare.match(moved[0])!), seen);
    return undefined;
  };
  for (const [from, r] of redirects) {
    if (r.code === "410") continue;
    const final = resolve(r.to);
    if (final) r.to = final;
    else unresolved.push({ from, to: r.to });
  }
  // Targets gone from the new site: ask the live site where they end up today.
  for (const u of unresolved.splice(0)) {
    const res = await fetch(`${SITE}${u.to}`, { redirect: "follow", headers: { "User-Agent": "SanCarlosLife-migration/1.0" } });
    const final = res.ok ? resolve(norm(res.url)) : undefined;
    if (final && final !== u.from) redirects.get(u.from)!.to = final;
    else unresolved.push({ ...u, to: `${u.to} (live: ${res.status} ${norm(res.url)})` });
  }

  let written = 0;
  for (const [fromPath, r] of redirects) {
    if (r.to === fromPath) continue;
    const data = { fromPath, toPath: r.to || null, statusCode: r.code, source: r.source };
    const found = await p.find({ collection: "redirects", where: { fromPath: { equals: fromPath } }, limit: 1 });
    if (found.docs[0]) await p.update({ collection: "redirects", id: found.docs[0].id, data });
    else await p.create({ collection: "redirects", data });
    written++;
  }
  await saveJson("redirects-report", { live: live.size, redirects: written, unresolved });
  console.log(`new-site paths: ${live.size}; redirects written: ${written}; unresolved: ${unresolved.length}`);
  for (const u of unresolved) console.log(`  ${u.from} -> ${u.to}`);
});
