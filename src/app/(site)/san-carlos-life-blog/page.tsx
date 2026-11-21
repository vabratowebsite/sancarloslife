import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { PostList } from "@/components/content/PostList";
import { getCategories, listPosts } from "@/lib/queries/posts";
import { buildMetadata } from "@/lib/seo";
import type { Post } from "@/payload-types";

type Props = { searchParams: Promise<{ page?: string; q?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { page, q } = await searchParams;
  const meta = buildMetadata({
    path: "/san-carlos-life-blog/",
    title: "San Carlos Life Blog: Local News, Restaurants, Events and Real Estate",
    description:
      "News and stories from San Carlos, CA: new restaurants, city decisions, events, interviews and monthly home sales.",
  });
  // Search results and deep pages aren't indexed; page 1 is the canonical listing.
  return q || (page && page !== "1") ? { ...meta, robots: { index: false, follow: true } } : meta;
}

export default async function BlogIndex({ searchParams }: Props) {
  const { page: pageParam, q } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const query = q?.trim().slice(0, 80) || undefined;
  const [result, categories] = await Promise.all([listPosts({ page, q: query }), getCategories()]);
  return (
    <div className="container-site py-10">
      <Breadcrumbs items={[{ name: "Blog", path: "/san-carlos-life-blog/" }]} />
      <h1 className="mt-3 text-h2 md:text-h1">San Carlos Life Blog</h1>
      <p className="mt-3 max-w-2xl text-ink-500">
        News, interviews, new restaurants, city projects and the monthly home sales report.
      </p>
      <div className="mt-8">
        <PostList
          posts={result.docs as Post[]}
          page={result.page ?? 1}
          totalPages={result.totalPages}
          basePath="/san-carlos-life-blog/"
          q={query}
          categories={categories.filter((c) => c.slug !== "uncategorized")}
        />
      </div>
    </div>
  );
}
