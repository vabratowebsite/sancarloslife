import Image from "next/image";
import Link from "next/link";

import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { PostCard } from "@/components/content/PostCard";
import { RichText } from "@/components/content/RichText";
import { SidebarCta } from "@/components/layout/SidebarCta";
import { JsonLd } from "@/components/seo/JsonLd";
import { formatDate, plainText } from "@/lib/format";
import { mediaSrc } from "@/lib/media";
import { getRelatedPosts } from "@/lib/queries/posts";
import { getSettings } from "@/lib/queries/settings";
import { absolute } from "@/lib/seo";
import type { Category, Post } from "@/payload-types";

const readingMinutes = (post: Post) => Math.max(1, Math.round(plainText(post.body, 100_000).split(/\s+/).length / 230));

export async function PostView({ post }: { post: Post }) {
  const [settings, related] = await Promise.all([getSettings(), getRelatedPosts(post)]);
  const cover = mediaSrc(post.cover, "hero");
  const category = (post.categories ?? []).find((c): c is Category => typeof c === "object");
  const path = `/${post.slug}/`;
  const isRealEstate = (post.categories ?? []).some((c) => typeof c === "object" && /real-estate/.test(c.slug ?? ""));

  const article = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seo?.description || post.excerpt || undefined,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: absolute(path),
    image: cover ? [absolute(cover.src)] : undefined,
    author: { "@type": "Organization", name: "San Carlos Life", url: absolute("/") },
    publisher: { "@type": "Organization", name: "Vabrato Real Estate", url: absolute("/") },
  };

  return (
    <div className="container-site grid grid-cols-[minmax(0,1fr)] gap-10 py-10 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
      <article className="min-w-0">
        <Breadcrumbs
          items={[
            { name: "Blog", path: "/san-carlos-life-blog/" },
            ...(category ? [{ name: category.name, path: `/category/${category.slug}/` }] : []),
            { name: post.title, path },
          ]}
        />
        <h1 className="mt-3 text-h2 md:text-h1">{post.title}</h1>
        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-ink-500">
          <span>By San Carlos Life</span>
          {post.publishedAt && (
            <>
              <span aria-hidden="true">·</span>
              <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span>{readingMinutes(post)} min read</span>
          {category && (
            <Link href={`/category/${category.slug}/`} className="eyebrow rounded-full bg-teal-50 px-3 py-1 text-xs">
              {category.name}
            </Link>
          )}
        </p>
        {cover && (
          <figure className="mt-6">
            <Image
              src={cover.src}
              alt={cover.alt}
              width={cover.width}
              height={cover.height}
              priority
              sizes="(min-width: 1024px) 760px, 100vw"
              className="w-full rounded-card object-cover"
            />
          </figure>
        )}
        <RichText data={post.body} className="mt-8" />

        {isRealEstate && (
          <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-card bg-teal-700 p-6 text-white sm:flex-row sm:items-center">
            <div>
              <p className="font-heading text-h4 text-white">Wondering what your home would sell for?</p>
              <p className="mt-1 text-small text-teal-50">Viv and Mark will prepare a free, no-obligation valuation.</p>
            </div>
            <Link href="/sell-my-house/" className="eyebrow shrink-0 rounded-button bg-white px-5 py-3 text-teal-700">
              Get my home value
            </Link>
          </div>
        )}

        {related.length > 0 && (
          <section aria-labelledby="related-heading" className="mt-12">
            <h2 id="related-heading" className="eyebrow text-teal-700">
              Related posts
            </h2>
            <div className="mt-4 grid gap-gutter sm:grid-cols-3">
              {related.map((r) => (
                <PostCard key={r.id} post={r} />
              ))}
            </div>
          </section>
        )}
        <JsonLd data={article} />
        {post.jsonLd ? <JsonLd data={post.jsonLd} /> : null}
      </article>

      <div className="grid content-start gap-6 lg:sticky lg:top-6">
        <SidebarCta settings={settings} />
        <aside aria-labelledby="subscribe-heading" className="rounded-card border border-teal-50 p-6">
          <h2 id="subscribe-heading" className="eyebrow text-teal-700">
            Subscribe to San Carlos Life
          </h2>
          <p className="mt-2 text-small text-ink-500">Events, new restaurants and local news, once a week.</p>
          <Link href="/subscribe/" className="eyebrow mt-4 inline-block rounded-button bg-teal-700 px-4 py-2.5 text-white">
            Subscribe
          </Link>
        </aside>
      </div>
    </div>
  );
}
