import { unstable_cache } from "next/cache";

import { getPayloadClient } from "@/lib/payload";
import type { Neighborhood, Page } from "@/payload-types";

export const getPageBySlug = (slug: string) =>
  unstable_cache(
    async (): Promise<Page | null> => {
      const payload = await getPayloadClient();
      const res = await payload.find({
        collection: "pages",
        where: { slug: { equals: slug }, _status: { equals: "published" } },
        limit: 1,
        depth: 1,
      });
      return res.docs[0] ?? null;
    },
    ["page", slug],
    { tags: ["pages", `pages:${slug}`], revalidate: 3600 },
  )();

export const getNeighborhoodBySlug = (slug: string) =>
  unstable_cache(
    async (): Promise<Neighborhood | null> => {
      const payload = await getPayloadClient();
      const res = await payload.find({
        collection: "neighborhoods",
        where: { slug: { equals: slug }, _status: { equals: "published" } },
        limit: 1,
        depth: 1,
      });
      return res.docs[0] ?? null;
    },
    ["neighborhood", slug],
    { tags: ["neighborhoods", `neighborhoods:${slug}`], revalidate: 3600 },
  )();

export const listNeighborhoods = unstable_cache(
  async (): Promise<Neighborhood[]> => {
    const payload = await getPayloadClient();
    return (
      await payload.find({ collection: "neighborhoods", where: { _status: { equals: "published" } }, sort: "name", limit: 20, depth: 1 })
    ).docs;
  },
  ["neighborhoods-list"],
  { tags: ["neighborhoods"], revalidate: 3600 },
);
