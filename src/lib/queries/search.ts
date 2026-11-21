import { unstable_cache } from "next/cache";

import { getPayloadClient } from "@/lib/payload";
import { placeIdsByCuisine, placePath } from "@/lib/queries/places";
import { STATIC_PAGES } from "@/content/pages";
import type { DeskPage, Event, Neighborhood, Park, Place, Post } from "@/payload-types";

export type SearchHit = { kind: string; title: string; href: string; text?: string | null; date?: string | null };
export type SearchResults = { q: string; groups: { label: string; hits: SearchHit[] }[]; total: number };

/** Trimmed, lower-cased, at most 80 characters: the cache key and the query. */
export const normalizeQuery = (q: string | string[] | undefined) =>
  (Array.isArray(q) ? q[0] : q ?? "").replace(/\s+/g, " ").trim().toLowerCase().slice(0, 80);

const PER_GROUP = 8;

/** Searchable pages: the content registry plus pages that have their own route folder. */
const CODE_PAGES: { title: string; href: string }[] = [
  ...Object.entries(STATIC_PAGES)
    .filter(([slug]) => !slug.startsWith("thank-you"))
    .map(([slug, p]) => ({ title: p.title, href: `/${slug}/` })),
  { title: "About San Carlos", href: "/about-san-carlos/" },
  { title: "Explore the City", href: "/explore-the-city/" },
  { title: "Viv and Mark, Realtors in San Carlos", href: "/one-of-the-best-realtor-teams-in-san-carlos-ca/" },
  { title: "Parks of San Carlos", href: "/parks-of-san-carlos/" },
  { title: "History of San Carlos", href: "/history-of-san-carlos/" },
  { title: "Videos of San Carlos", href: "/videos-of-san-carlos-ca/" },
  { title: "Restaurants and Services", href: "/restaurants-and-services/" },
  { title: "Homes for Sale in San Carlos", href: "/homes-for-sale-in-san-carlos-ca/" },
  { title: "Open Houses in San Carlos", href: "/open-houses-in-san-carlos-ca/" },
  { title: "Sell My House: home valuation", href: "/sell-my-house/" },
  { title: "Mortgage Calculator", href: "/how-much-house-can-i-afford-mortgage-calculator/" },
  { title: "Buyers and Sellers Guides", href: "/buyers-and-sellers-guides/" },
  { title: "Contact Us", href: "/contact-us/" },
  { title: "Subscribe to the newsletter", href: "/subscribe/" },
];

/**
 * Site search across posts, upcoming events, places, neighborhoods, parks and
 * pages. Payload's `like` on Postgres is a case-insensitive match on every
 * word, which is enough for a site this size (about 1,200 documents).
 */
export const siteSearch = (raw: string) => {
  const q = normalizeQuery(raw);
  return unstable_cache(
    async (): Promise<SearchResults> => {
      if (q.length < 2) return { q, groups: [], total: 0 };
      const payload = await getPayloadClient();
      const published = { _status: { equals: "published" } };
      const now = new Date().toISOString();
      const cuisineIds = await placeIdsByCuisine(q);
      const [posts, events, places, hoods, parks, deskPages] = await Promise.all([
        payload.find({
          collection: "posts",
          where: { and: [published, { or: [{ title: { like: q } }, { excerpt: { like: q } }] }] },
          sort: "-publishedAt",
          limit: PER_GROUP,
          depth: 0,
          select: { title: true, slug: true, excerpt: true, publishedAt: true },
        }),
        payload.find({
          collection: "events",
          where: {
            and: [
              { status: { equals: "published" } },
              { title: { like: q } },
              { or: [{ startsAt: { greater_than_equal: now } }, { endsAt: { greater_than_equal: now } }, { rrule: { exists: true } }] },
            ],
          },
          sort: "startsAt",
          limit: PER_GROUP,
          depth: 0,
          select: { title: true, slug: true, startsAt: true, rrule: true },
        }),
        payload.find({
          collection: "places",
          where: {
            and: [
              published,
              { businessStatus: { not_equals: "closed" } },
              { or: [{ name: { like: q } }, { headline: { like: q } }, ...(cuisineIds.length ? [{ id: { in: cuisineIds } }] : [])] },
            ],
          },
          sort: ["-featured", "name"],
          limit: PER_GROUP,
          depth: 0,
          select: { name: true, slug: true, type: true, headline: true },
        }),
        payload.find({
          collection: "neighborhoods",
          where: { and: [published, { or: [{ name: { like: q } }, { tagline: { like: q } }] }] },
          limit: PER_GROUP,
          depth: 0,
          select: { name: true, slug: true, tagline: true },
        }),
        payload.find({
          collection: "parks",
          where: { and: [published, { or: [{ name: { like: q } }, { summary: { like: q } }] }] },
          limit: PER_GROUP,
          depth: 0,
          select: { name: true, slug: true, summary: true },
        }),
        payload.find({
          collection: "desk-pages",
          where: { and: [published, { or: [{ title: { like: q } }, { summary: { like: q } }] }] },
          limit: PER_GROUP,
          depth: 0,
          select: { title: true, slug: true, summary: true },
        }),
      ]);
      // Pages are code: match every word of the query against their titles.
      const words = q.split(" ");
      const pages = CODE_PAGES.filter((pg) => words.every((w) => pg.title.toLowerCase().includes(w))).slice(0, PER_GROUP);
      const groups = [
        {
          label: "Events",
          hits: (events.docs as Event[]).map((e) => ({ kind: "Event", title: e.title, href: `/event/${e.slug}/`, date: e.rrule ? null : e.startsAt })),
        },
        {
          label: "Restaurants, shops and services",
          hits: (places.docs as Place[]).map((p) => ({ kind: "Place", title: p.name, href: placePath(p), text: p.headline })),
        },
        {
          label: "Neighborhoods",
          hits: (hoods.docs as Neighborhood[]).map((n) => ({ kind: "Neighborhood", title: n.name, href: `/${n.slug}/`, text: n.tagline })),
        },
        {
          label: "Parks",
          // Parks are sections of one page; link to the park's anchor there.
          hits: (parks.docs as Park[]).map((p) => ({ kind: "Park", title: p.name, href: `/parks-of-san-carlos/#${p.slug}`, text: p.summary })),
        },
        {
          label: "Blog posts",
          hits: (posts.docs as Post[]).map((p) => ({ kind: "Post", title: p.title, href: `/${p.slug}/`, text: p.excerpt, date: p.publishedAt })),
        },
        {
          label: "Pages",
          hits: [
            ...(deskPages.docs as DeskPage[]).map((p) => ({ kind: "Page", title: p.title, href: `/${p.slug}/`, text: p.summary })),
            ...pages.map((p) => ({ kind: "Page", title: p.title, href: p.href })),
          ].slice(0, PER_GROUP),
        },
      ].filter((g) => g.hits.length);
      return { q, groups, total: groups.reduce((n, g) => n + g.hits.length, 0) };
    },
    ["search-v4", q],
    { tags: ["posts", "events", "places", "neighborhoods", "parks", "desk-pages"], revalidate: 600 },
  )();
};
