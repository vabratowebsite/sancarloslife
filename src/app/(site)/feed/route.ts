import { listPosts } from "@/lib/queries/posts";
import { absolute } from "@/lib/seo";
import type { Post } from "@/payload-types";

/** RSS 2.0 for the blog, at the same URL WordPress used (/feed/). */
export async function GET() {
  const { docs } = await listPosts({ page: 1 });
  const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);
  const items = (docs as Post[])
    .map(
      (p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${absolute(`/${p.slug}/`)}</link>
      <guid isPermaLink="true">${absolute(`/${p.slug}/`)}</guid>
      ${p.publishedAt ? `<pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>` : ""}
      ${p.excerpt ? `<description>${esc(p.excerpt)}</description>` : ""}
    </item>`,
    )
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>San Carlos Life</title>
    <link>${absolute("/")}</link>
    <atom:link href="${absolute("/feed/")}" rel="self" type="application/rss+xml"/>
    <description>News, events, restaurants and real estate in San Carlos, California</description>
    <language>en-us</language>
${items}
  </channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=600" } });
}

export const revalidate = 600;
