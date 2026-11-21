import { unstable_cache } from "next/cache";
import type { Where } from "payload";

import { getPayloadClient } from "@/lib/payload";
import type { Category, Post } from "@/payload-types";

export const POSTS_PER_PAGE = 12;

export const getPostBySlug = (slug: string) =>
  unstable_cache(
    async (): Promise<Post | null> => {
      const payload = await getPayloadClient();
      const res = await payload.find({
        collection: "posts",
        where: { slug: { equals: slug }, _status: { equals: "published" } },
        limit: 1,
        depth: 1,
      });
      return res.docs[0] ?? null;
    },
    ["post", slug],
    { tags: ["posts", `posts:${slug}`], revalidate: 3600 },
  )();

export const listPosts = (opts: { page?: number; categoryId?: number; q?: string } = {}) =>
  unstable_cache(
    async () => {
      const payload = await getPayloadClient();
      const and: Where[] = [{ _status: { equals: "published" } }];
      if (opts.categoryId) and.push({ categories: { in: [opts.categoryId] } });
      if (opts.q) and.push({ or: [{ title: { like: opts.q } }, { excerpt: { like: opts.q } }] });
      return payload.find({
        collection: "posts",
        where: { and },
        sort: "-publishedAt",
        limit: POSTS_PER_PAGE,
        page: opts.page ?? 1,
        depth: 1,
        select: { title: true, slug: true, excerpt: true, cover: true, categories: true, publishedAt: true },
      });
    },
    ["posts-list", String(opts.page ?? 1), String(opts.categoryId ?? ""), opts.q ?? ""],
    { tags: ["posts"], revalidate: 3600 },
  )();

export const getRelatedPosts = (post: Post, count = 3) =>
  unstable_cache(
    async () => {
      const payload = await getPayloadClient();
      const catIds = (post.categories ?? []).map((c) => (typeof c === "number" ? c : c.id));
      const res = await payload.find({
        collection: "posts",
        where: {
          and: [
            { _status: { equals: "published" } },
            { id: { not_equals: post.id } },
            ...(catIds.length ? [{ categories: { in: catIds } }] : []),
          ],
        },
        sort: "-publishedAt",
        limit: count,
        depth: 1,
        select: { title: true, slug: true, excerpt: true, cover: true, categories: true, publishedAt: true },
      });
      return res.docs as Post[];
    },
    ["related", String(post.id)],
    { tags: ["posts"], revalidate: 3600 },
  )();

export const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
    const payload = await getPayloadClient();
    return (await payload.find({ collection: "categories", limit: 100, sort: "name", depth: 0 })).docs;
  },
  ["categories"],
  { tags: ["categories"], revalidate: 3600 },
);

export const getCategoryBySlug = (slug: string) =>
  unstable_cache(
    async (): Promise<Category | null> => {
      const payload = await getPayloadClient();
      return (await payload.find({ collection: "categories", where: { slug: { equals: slug } }, limit: 1 })).docs[0] ?? null;
    },
    ["category", slug],
    { tags: ["categories"], revalidate: 3600 },
  )();
