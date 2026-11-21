import type { Metadata } from "next";

import { getPageSeo } from "@/lib/queries/pages";
import { buildMetadata } from "@/lib/seo";

/**
 * Metadata for a page whose content is code: the admin's Page SEO record for
 * the slug (if any) wins over the defaults given here.
 */
export async function metadataFromPage(
  slug: string,
  fallback: { title: string; description?: string; image?: { src: string; width: number; height: number } },
): Promise<Metadata> {
  const page = await getPageSeo(slug);
  return buildMetadata({
    path: slug === "home" ? "/" : `/${slug}/`,
    title: page?.title || fallback.title,
    description: fallback.description,
    seo: page?.seo,
    imageSrc: fallback.image,
  });
}
