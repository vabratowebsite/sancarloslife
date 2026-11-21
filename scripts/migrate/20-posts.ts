/**
 * Milestone 7: blog categories and posts. Upserts by WordPress id, so it can be
 * rerun after a fresh export (the cutover delta).
 *   pnpm payload run scripts/migrate/20-posts.ts
 */
import { htmlToLexical, loadJson, MediaImporter, migrateHtml, payload, run, seoFrom, seoIndex, SITE, text } from "./lib";

type WpTerm = { id: number; name: string; slug: string; description: string };
type WpPost = {
  id: number;
  date_gmt: string;
  slug: string;
  status: string;
  link: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  featured_media: number;
  categories: number[];
  tags: number[];
};

await run("posts", async () => {
  const p = await payload();
  const media = await MediaImporter.create();
  const seo = await seoIndex();

  // Categories
  const categories = await loadJson<WpTerm[]>("categories");
  const catMap = new Map<number, number>();
  for (const c of categories) {
    const data = { name: text(c.name), slug: c.slug, generateSlug: false, description: text(c.description) || undefined, wpId: c.id };
    const found = await p.find({
      collection: "categories",
      where: { or: [{ wpId: { equals: c.id } }, { slug: { equals: c.slug } }] },
      limit: 1,
    });
    const doc = found.docs[0]
      ? await p.update({ collection: "categories", id: found.docs[0].id, data })
      : await p.create({ collection: "categories", data });
    catMap.set(c.id, doc.id as number);
  }
  console.log(`categories: ${catMap.size}`);

  const tags = new Map((await loadJson<WpTerm[]>("tags")).map((t) => [t.id, text(t.name)]));
  const posts = await loadJson<WpPost[]>("posts");
  let created = 0;
  let updated = 0;
  const problems: string[] = [];

  for (const [i, post] of posts.entries()) {
    const title = text(post.title.rendered);
    try {
      const body = await migrateHtml(post.content.rendered, media);
      const { seo: seoGroup, jsonLd } = seoFrom(seo[post.link], title);
      const data = {
        title,
        slug: post.slug,
        generateSlug: false,
        publishedAt: new Date(post.date_gmt + "Z").toISOString(),
        categories: post.categories.map((c) => catMap.get(c)).filter((x): x is number => Boolean(x)),
        tags: post.tags.map((t) => tags.get(t)).filter((x): x is string => Boolean(x)),
        cover: await media.ensure(post.featured_media),
        excerpt: text(post.excerpt.rendered) || undefined,
        body: htmlToLexical(body),
        seo: seoGroup,
        jsonLd,
        wpId: post.id,
        _status: (post.status === "publish" ? "published" : "draft") as "published" | "draft",
      };
      const found = await p.find({
        collection: "posts",
        where: { or: [{ wpId: { equals: post.id } }, { slug: { equals: post.slug } }] },
        limit: 1,
        draft: true,
      });
      if (found.docs[0]) {
        await p.update({ collection: "posts", id: found.docs[0].id, data });
        updated++;
      } else {
        await p.create({ collection: "posts", data });
        created++;
      }
    } catch (e) {
      problems.push(`${post.slug}: ${(e as Error).message}`);
    }
    process.stdout.write(`\rposts ${i + 1}/${posts.length}`);
  }
  await media.save();
  console.log(`\nposts: ${created} created, ${updated} updated, ${problems.length} failed (source ${SITE})`);
  for (const pr of problems) console.log("  ", pr);
});
