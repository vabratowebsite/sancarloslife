import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { PostList } from "@/components/content/PostList";
import { getCategories, getCategoryBySlug, listPosts } from "@/lib/queries/posts";
import { buildMetadata } from "@/lib/seo";
import type { Post } from "@/payload-types";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  if (!cat) return {};
  return buildMetadata({
    path: `/category/${slug}/`,
    title: `${cat.name} | San Carlos Life Blog`,
    description: cat.description || `${cat.name} posts from San Carlos Life, the guide to San Carlos, California.`,
  });
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const cat = await getCategoryBySlug(slug);
  if (!cat) notFound();
  const page = Math.max(1, Number(pageParam) || 1);
  const [result, categories] = await Promise.all([listPosts({ page, categoryId: cat.id }), getCategories()]);
  return (
    <div className="container-site py-10">
      <Breadcrumbs
        items={[
          { name: "Blog", path: "/san-carlos-life-blog/" },
          { name: cat.name, path: `/category/${slug}/` },
        ]}
      />
      <h1 className="mt-3 text-h2 md:text-h1">{cat.name}</h1>
      {cat.description && <p className="mt-3 max-w-2xl text-ink-500">{cat.description}</p>}
      <div className="mt-8">
        <PostList
          posts={result.docs as Post[]}
          page={result.page ?? 1}
          totalPages={result.totalPages}
          basePath={`/category/${slug}/`}
          categories={categories.filter((c) => c.slug !== "uncategorized")}
          activeCategory={slug}
        />
      </div>
    </div>
  );
}
