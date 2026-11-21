import { unstable_cache } from "next/cache";

import { getPayloadClient } from "@/lib/payload";
import type { DeskPage } from "@/payload-types";

/** A published desk page by slug. */
export const getDeskPage = (slug: string) =>
  unstable_cache(
    async (): Promise<DeskPage | null> => {
      const payload = await getPayloadClient();
      return (
        await payload.find({ collection: "desk-pages", where: { slug: { equals: slug }, _status: { equals: "published" } }, limit: 1, depth: 1 })
      ).docs[0] ?? null;
    },
    ["desk-page", slug],
    { tags: ["desk-pages", `desk-pages:${slug}`], revalidate: 3600 },
  )();
