import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeskPageView } from "@/components/content/DeskPageView";
import { DiviPage } from "@/components/divi/DiviPage";
import { diviLayout } from "@/lib/divi/layouts";
import { PostView } from "@/components/content/PostView";
import { StaticPageView } from "@/components/content/StaticPageView";
import { NeighborhoodView } from "@/components/realestate/NeighborhoodView";
import { staticPage } from "@/content/pages";
import { loadPageHtml } from "@/content/pages/load";
import { SiteMapList } from "@/components/content/SiteMapList";
import { applyHtmlEdits, editablePage } from "@/lib/pageEdits";
import { metadataFromPage } from "@/lib/pageMeta";
import { getNeighborhoodBySlug, getPageSeo } from "@/lib/queries/pages";
import { getDeskPage } from "@/lib/queries/desk";
import { getPostBySlug } from "@/lib/queries/posts";
import { buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

/**
 * Root-level URLs, exactly as on WordPress: blog posts (/<post-slug>/), code
 * pages (src/content/pages), desk pages and the six neighborhood pages share
 * one namespace. Lookup order: WordPress layout page (src/content/divi), post, code page,
 * desk page, neighborhood.
 */
type Props = { params: Promise<{ slug: string }> };

async function resolve(slug: string) {
  // Pages kept exactly as laid out on WordPress (sections, order, photos).
  const layout = diviLayout(slug);
  if (layout) return { kind: "divi" as const, layout };
  const post = await getPostBySlug(slug);
  if (post) return { kind: "post" as const, post };
  const page = staticPage(slug);
  if (page) return { kind: "page" as const, page };
  const desk = await getDeskPage(slug);
  if (desk) return { kind: "desk" as const, desk };
  const hood = await getNeighborhoodBySlug(slug);
  if (hood) return { kind: "neighborhood" as const, hood };
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const hit = await resolve(slug);
  if (!hit) return {};
  const path = `/${slug}/`;
  if (hit.kind === "divi") return metadataFromPage(slug, { title: hit.layout.title });
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
  if (hit.kind === "desk")
    return buildMetadata({ path, title: hit.desk.title, description: hit.desk.summary, seo: hit.desk.seo, image: hit.desk.hero, type: "article" });
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
  if (hit.kind === "divi") {
    // Neighborhood pages keep their Buying Buddy filter from the admin.
    const [seo, hood] = await Promise.all([getPageSeo(slug), getNeighborhoodBySlug(slug)]);
    return (
      <>
        <DiviPage layout={hit.layout} filterId={hood?.bbFilterId ?? null} />
        {seo?.jsonLd ? <JsonLd data={seo.jsonLd} /> : null}
      </>
    );
  }
  if (hit.kind === "post") return <PostView post={hit.post} />;
  if (hit.kind === "desk") return <DeskPageView page={hit.desk} />;
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
