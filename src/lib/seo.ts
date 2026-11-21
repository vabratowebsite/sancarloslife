import type { Metadata } from "next";

import { indexingAllowed } from "@/lib/indexing";
import { mediaSrc } from "@/lib/media";
import type { Media } from "@/payload-types";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://sancarloslife.com").replace(/\/$/, "");
export const absolute = (path: string) => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

type SeoGroup = {
  title?: string | null;
  description?: string | null;
  image?: number | Media | null;
  canonical?: string | null;
  noindex?: boolean | null;
} | null | undefined;

/**
 * Page metadata from a document's SEO group. Title falls back to the document
 * title; the social image falls back to the cover, then the generated OG image.
 */
export function buildMetadata(args: {
  path: string;
  title: string;
  description?: string | null;
  seo?: SeoGroup;
  image?: number | Media | null;
  /** A plain image path (code pages), used when there's no SEO or document image. */
  imageSrc?: { src: string; width: number; height: number };
  type?: "website" | "article";
  publishedTime?: string | null;
}): Metadata {
  const { path, seo } = args;
  const title = seo?.title || args.title;
  const description = seo?.description || args.description || undefined;
  const img = mediaSrc(seo?.image ?? args.image, "hero");
  const ogImage = img
    ? { url: absolute(img.src), width: img.width, height: img.height, alt: img.alt }
    : args.imageSrc
      ? { url: absolute(args.imageSrc.src), width: args.imageSrc.width, height: args.imageSrc.height }
      : { url: absolute(`/og/?title=${encodeURIComponent(args.title)}`), width: 1200, height: 630 };
  return {
    // Migrated titles already carry their own branding; don't add the template suffix twice.
    title: /san carlos life/i.test(title) ? { absolute: title } : title,
    description,
    alternates: { canonical: seo?.canonical || absolute(path) },
    robots: !indexingAllowed() ? { index: false, follow: false } : seo?.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: args.type ?? "website",
      url: absolute(path),
      title,
      description,
      siteName: "San Carlos Life",
      images: [ogImage],
      ...(args.publishedTime ? { publishedTime: args.publishedTime } : {}),
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImage.url] },
  };
}

export const breadcrumbJsonLd = (items: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absolute(it.path) })),
});
