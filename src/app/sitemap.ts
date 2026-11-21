import type { MetadataRoute } from "next";

import { getPayloadClient } from "@/lib/payload";
import { placePath } from "@/lib/queries/places";
import { absolute } from "@/lib/seo";

/** Template-driven pages that aren't documents. */
const STATIC: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/events/", priority: 0.9, changeFrequency: "daily" },
  { path: "/san-carlos-life-blog/", priority: 0.8, changeFrequency: "daily" },
  { path: "/restaurants-and-services/", priority: 0.7, changeFrequency: "weekly" },
  { path: "/restaurants-and-services/all-restaurants/", priority: 0.7, changeFrequency: "weekly" },
  { path: "/restaurants-and-services/all-shops-services/", priority: 0.6, changeFrequency: "weekly" },
  { path: "/parks-of-san-carlos/", priority: 0.6, changeFrequency: "monthly" },
  { path: "/history-of-san-carlos/", priority: 0.6, changeFrequency: "monthly" },
  { path: "/videos-of-san-carlos-ca/", priority: 0.5, changeFrequency: "monthly" },
  { path: "/buyers-and-sellers-guides/", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact-us/", priority: 0.4, changeFrequency: "yearly" },
  { path: "/subscribe/", priority: 0.5, changeFrequency: "yearly" },
  { path: "/events/submit/", priority: 0.4, changeFrequency: "yearly" },
];

type Doc = { slug?: string | null; updatedAt?: string; seo?: { noindex?: boolean | null } | null; type?: string };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayloadClient();
  const find = async (collection: "posts" | "pages" | "neighborhoods" | "places" | "events" | "categories" | "city-projects", where: object = {}) =>
    (
      await payload.find({
        collection,
        where: where as never,
        limit: 5000,
        depth: 0,
        pagination: false,
        select: { slug: true, updatedAt: true, seo: true, type: true } as never,
      })
    ).docs as unknown as Doc[];

  const published = { _status: { equals: "published" } };
  const [posts, pages, hoods, places, events, categories, projects] = await Promise.all([
    find("posts", published),
    find("pages", published),
    find("neighborhoods", published),
    find("places", published),
    find("events", { status: { in: ["published", "archived"] } }),
    find("categories"),
    find("city-projects", published),
  ]);
  const staticPaths = new Set(STATIC.map((s) => s.path));
  const entry = (path: string, d: Doc, priority = 0.5): MetadataRoute.Sitemap[number] => ({
    url: absolute(path),
    lastModified: d.updatedAt ? new Date(d.updatedAt) : undefined,
    priority,
  });
  const keep = (d: Doc) => d.slug && !d.seo?.noindex;

  return [
    ...STATIC.map((s) => ({ url: absolute(s.path), changeFrequency: s.changeFrequency, priority: s.priority })),
    ...posts.filter(keep).map((d) => entry(`/${d.slug}/`, d, 0.6)),
    // Pages whose URL is served by a template are listed once, above.
    ...pages.filter(keep).filter((d) => !staticPaths.has(`/${d.slug}/`)).map((d) => entry(`/${d.slug}/`, d, 0.5)),
    ...hoods.filter(keep).map((d) => entry(`/${d.slug}/`, d, 0.8)),
    ...places.filter(keep).map((d) => entry(placePath({ slug: d.slug!, type: d.type as never }), d, 0.6)),
    ...events.filter(keep).map((d) => entry(`/event/${d.slug}/`, d, 0.4)),
    ...categories.filter((d) => d.slug && d.slug !== "uncategorized").map((d) => entry(`/category/${d.slug}/`, d, 0.3)),
    ...projects.filter(keep).map((d) => entry(`/city-projects/${d.slug}/`, d, 0.5)),
  ];
}

export const revalidate = 3600;
