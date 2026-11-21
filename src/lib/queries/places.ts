import { unstable_cache } from "next/cache";
import type { Where } from "payload";

import { getPayloadClient } from "@/lib/payload";
import type { Place } from "@/payload-types";

/** Restaurants and bars came from the WordPress "restaurant" type; shops and services from "store". */
export type PlaceKind = "restaurants" | "shops";
export const KIND_TYPES: Record<PlaceKind, Place["type"][]> = {
  restaurants: ["restaurant", "bar"],
  shops: ["shop", "service"],
};
export const placePath = (p: Pick<Place, "slug" | "type">) =>
  `/${p.type === "restaurant" || p.type === "bar" ? "restaurant" : "store"}/${p.slug}/`;

export const STREETS: Record<string, string> = {
  laurel: "Laurel Street",
  "san-carlos-ave": "San Carlos Ave",
  "el-camino": "El Camino Real",
  industrial: "Industrial Road",
  other: "Elsewhere in San Carlos",
};

export type PlaceFilters = { q?: string; cuisine?: string; street?: string; price?: string; meal?: string; sort?: "featured" | "az" };

export const listPlaces = (kind: PlaceKind, f: PlaceFilters = {}) =>
  unstable_cache(
    async (): Promise<Place[]> => {
      const payload = await getPayloadClient();
      const and: Where[] = [{ _status: { equals: "published" } }, { type: { in: KIND_TYPES[kind] } }, { businessStatus: { not_equals: "closed" } }];
      if (f.q) and.push({ or: [{ name: { like: f.q } }, { headline: { like: f.q } }, { cuisines: { like: f.q } }] });
      if (f.cuisine) and.push({ cuisines: { contains: f.cuisine } });
      if (f.meal) and.push({ meals: { contains: f.meal } });
      if (f.street && STREETS[f.street]) and.push({ street: { equals: f.street } });
      if (f.price) and.push({ priceRange: { equals: f.price } });
      const res = await payload.find({
        collection: "places",
        where: { and },
        sort: f.sort === "az" ? "name" : ["-featured", "name"],
        limit: 500,
        depth: 1,
        pagination: false,
        // Card fields only; the full page body would push the cached result past 2 MB.
        select: {
          name: true, headline: true, slug: true, type: true, street: true, priceRange: true,
          cuisines: true, meals: true, features: true, cover: true, featured: true, businessStatus: true,
        },
      });
      return res.docs as Place[];
    },
    ["places", kind, JSON.stringify(f)],
    { tags: ["places"], revalidate: 3600 },
  )();

/** Values for the filter menus, taken from the places themselves. */
export const placeFacets = (kind: PlaceKind) =>
  unstable_cache(
    async () => {
      const all = await listPlaces(kind);
      const count = (pick: (p: Place) => string[] | null | undefined) => {
        const m = new Map<string, number>();
        for (const p of all) for (const v of pick(p) ?? []) m.set(v, (m.get(v) ?? 0) + 1);
        return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([v]) => v);
      };
      return {
        total: all.length,
        cuisines: count((p) => p.cuisines),
        meals: count((p) => p.meals),
        streets: [...new Set(all.map((p) => p.street).filter((s): s is NonNullable<Place["street"]> => Boolean(s)))],
        prices: [...new Set(all.map((p) => p.priceRange).filter(Boolean))].sort() as string[],
      };
    },
    ["place-facets", kind],
    { tags: ["places"], revalidate: 3600 },
  )();

export const getPlace = (slug: string, kind: PlaceKind) =>
  unstable_cache(
    async (): Promise<Place | null> => {
      const payload = await getPayloadClient();
      const res = await payload.find({
        collection: "places",
        where: { slug: { equals: slug }, type: { in: KIND_TYPES[kind] }, _status: { equals: "published" } },
        limit: 1,
        depth: 1,
      });
      return res.docs[0] ?? null;
    },
    ["place", kind, slug],
    { tags: ["places", `places:${slug}`], revalidate: 3600 },
  )();
