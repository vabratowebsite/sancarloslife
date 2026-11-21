import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PostView } from "@/components/content/PostView";
import { StaticPageView } from "@/components/content/StaticPageView";
import { NeighborhoodView } from "@/components/realestate/NeighborhoodView";
import { staticPage } from "@/content/pages";
import { loadPageHtml } from "@/content/pages/load";
import { SiteMapList } from "@/components/content/SiteMapList";
import { applyHtmlEdits, editablePage } from "@/lib/pageEdits";
import { metadataFromPage } from "@/lib/pageMeta";
import { getNeighborhoodBySlug, getPageSeo } from "@/lib/queries/pages";
import { getPostBySlug } from "@/lib/queries/posts";
import { buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

/**
 * Root-level URLs, exactly as on WordPress: blog posts (/<post-slug>/), code
 * pages (src/content/pages) and the six neighborhood pages share one
 * namespace. Lookup order: post, page, neighborhood.
 */
type Props = { params: Promise<{ slug: string }> };

async function resolve(slug: string) {
  const post = await getPostBySlug(slug);
  if (post) return { kind: "post" as const, post };
  const page = staticPage(slug);
  if (page) return { kind: "page" as const, page };
  const hood = await getNeighborhoodBySlug(slug);
  if (hood) return { kind: "neighborhood" as const, hood };
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const hit = await resolve(slug);
  if (!hit) return {};
  const path = `/${slug}/`;
  if (hit.kind === "post")
    return buildMetadata({
      path,
      title: hit.post.title,
      description: hit.post.excerpt,
      seo: hit.post.seo,
      image: hit.post.cover,
      type: "article",
      publishedTime: hit.post.publishedAt,
    });
  if (hit.kind === "page")
    return metadataFromPage(slug, {
      title: hit.page.title,
      description: hit.page.subheading,
      image: hit.page.image,
    });
  return buildMetadata({
    path,
    title: hit.hood.name,
    description: hit.hood.tagline,
    seo: hit.hood.seo,
    image: hit.hood.hero,
  });
}

export default async function RootSlugPage({ params }: Props) {
  const { slug } = await params;
  const hit = await resolve(slug);
  if (!hit) notFound();
  if (hit.kind === "post") return <PostView post={hit.post} />;
  if (hit.kind === "page") {
    const s = await editablePage(slug, `/${slug}/`);
    const [raw, seo] = await Promise.all([
      hit.page.body === false ? null : loadPageHtml(slug),
      getPageSeo(slug),
    ]);
    const html = raw && applyHtmlEdits(raw, s.edits, s.editing);
    return (
      <>
        <StaticPageView slug={slug} page={hit.page} html={html}>
          {slug === "site-map" && <SiteMapList />}
        </StaticPageView>
        {seo?.jsonLd ? <JsonLd data={seo.jsonLd} /> : null}
      </>
    );
  }
  return <NeighborhoodView hood={hit.hood} />;
}

// Rendered on first request and cached; publishing revalidates posts and neighborhoods.
export const revalidate = 3600;
