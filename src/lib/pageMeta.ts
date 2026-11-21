import type { Metadata } from "next";

import { getPageBySlug } from "@/lib/queries/pages";
import { buildMetadata } from "@/lib/seo";

/**
 * Metadata for a code-built route that replaces a migrated page: the page's
 * SEO fields (kept editable in the admin) win over the defaults given here.
 */
export async function metadataFromPage(slug: string, fallback: { title: string; description: string }): Promise<Metadata> {
  const page = await getPageBySlug(slug);
  return buildMetadata({
    path: `/${slug}/`,
    title: page?.title || fallback.title,
    description: fallback.description,
    seo: page?.seo,
    image: page?.hero?.image,
  });
}
