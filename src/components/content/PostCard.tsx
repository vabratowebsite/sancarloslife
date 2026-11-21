import Image from "next/image";
import Link from "next/link";

import { formatDate } from "@/lib/format";
import { mediaSrc } from "@/lib/media";
import type { Category, Post } from "@/payload-types";

export function PostCard({ post, priority = false }: { post: Post; priority?: boolean }) {
  const img = mediaSrc(post.cover, "card");
  const category = (post.categories ?? []).find((c): c is Category => typeof c === "object");
  return (
    <article className="flex flex-col overflow-hidden rounded-card bg-white shadow-card">
      <Link href={`/${post.slug}/`} className="block aspect-[3/2] bg-teal-50" tabIndex={-1} aria-hidden="true">
        {img && (
          <Image
            src={img.src}
            alt=""
            width={img.width}
            height={img.height}
            priority={priority}
            sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
            className="size-full object-cover"
          />
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        {category && <p className="eyebrow text-xs text-teal-700">{category.name}</p>}
        <h3 className="mt-1 font-heading text-[20px] leading-snug">
          <Link href={`/${post.slug}/`} className="text-ink-900 hover:text-teal-700">
            {post.title}
          </Link>
        </h3>
        {post.excerpt && <p className="mt-2 line-clamp-3 text-small text-ink-500">{post.excerpt}</p>}
        {post.publishedAt && (
          <p className="mt-auto pt-3 text-xs text-ink-500">
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          </p>
        )}
      </div>
    </article>
  );
}
