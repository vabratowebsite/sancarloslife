import Link from "next/link";

import { Pagination } from "@/components/content/Pagination";
import { PostCard } from "@/components/content/PostCard";
import type { Category, Post } from "@/payload-types";

/** Blog grid with search box, category chips and paging (blog index and category pages). */
export function PostList({
  posts,
  page,
  totalPages,
  basePath,
  q,
  categories,
  activeCategory,
}: {
  posts: Post[];
  page: number;
  totalPages: number;
  basePath: string;
  q?: string;
  categories: Category[];
  activeCategory?: string;
}) {
  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <form role="search" action={basePath} method="get" className="flex w-full max-w-md gap-2">
          <label htmlFor="blog-q" className="sr-only">
            Search the blog
          </label>
          <input
            id="blog-q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search posts"
            className="flex-1 rounded-button border border-teal-500/40 px-4 py-2.5"
          />
          <button type="submit" className="eyebrow rounded-button bg-teal-700 px-4 text-white hover:bg-teal-500">
            Search
          </button>
        </form>
      </div>
      <nav aria-label="Categories" className="mt-5">
        <ul className="flex flex-wrap gap-2">
          <li>
            <Link
              href="/san-carlos-life-blog/"
              aria-current={!activeCategory ? "page" : undefined}
              className={`eyebrow inline-block rounded-full px-3 py-1.5 text-xs ${!activeCategory ? "bg-teal-700 text-white" : "bg-teal-50"}`}
            >
              All posts
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                href={`/category/${c.slug}/`}
                aria-current={activeCategory === c.slug ? "page" : undefined}
                className={`eyebrow inline-block rounded-full px-3 py-1.5 text-xs ${activeCategory === c.slug ? "bg-teal-700 text-white" : "bg-teal-50"}`}
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {posts.length === 0 ? (
        <p className="mt-10 rounded-card bg-sand-100 p-6">
          No posts match {q ? <>“{q}”</> : "this filter"} yet. Try another word, or{" "}
          <Link href="/san-carlos-life-blog/">see all posts</Link>.
        </p>
      ) : (
        <div className="mt-8 grid gap-gutter sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p, i) => (
            <PostCard key={p.id} post={p} priority={i < 3} />
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} basePath={basePath} query={{ q }} />
    </>
  );
}
