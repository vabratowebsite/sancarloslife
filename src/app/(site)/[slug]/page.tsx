import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageView } from "@/components/content/PageView";
import { PostView } from "@/components/content/PostView";
import { NeighborhoodView } from "@/components/realestate/NeighborhoodView";
import { getNeighborhoodBySlug, getPageBySlug } from "@/lib/queries/pages";
import { getPostBySlug } from "@/lib/queries/posts";
import { buildMetadata } from "@/lib/seo";

/**
 * Root-level URLs, exactly as on WordPress: blog posts (/<post-slug>/), pages and
 * the six neighborhood pages share one namespace. Lookup order: post, page, neighborhood.
 */
type Props = { params: Promise<{ slug: string }> };

async function resolve(slug: string) {
  const post = await getPostBySlug(slug);
  if (post) return { kind: "post" as const, post };
  const page = await getPageBySlug(slug);
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
  if (hit.kind === "page") return buildMetadata({ path, title: hit.page.title, seo: hit.page.seo, image: hit.page.hero?.image });
  return buildMetadata({ path, title: hit.hood.name, description: hit.hood.tagline, seo: hit.hood.seo, image: hit.hood.hero });
}

export default async function RootSlugPage({ params }: Props) {
  const { slug } = await params;
  const hit = await resolve(slug);
  if (!hit) notFound();
  if (hit.kind === "post") return <PostView post={hit.post} />;
  if (hit.kind === "page") return <PageView page={hit.page} />;
  return <NeighborhoodView hood={hit.hood} />;
}

// Pages render on first request and are then cached; publishing revalidates them.
export const revalidate = 3600;
