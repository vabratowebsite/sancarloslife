/**
 * Milestone 9b: history timeline, testimonials, neighborhoods and pages.
 * Timeline stories and testimonials are only public on rendered pages (their own
 * URLs redirect to the home page), so they are read from those pages.
 *   pnpm payload run scripts/migrate/50-misc.ts
 */
import { decodeHTML } from "entities";

import { htmlToLexical, loadJson, MediaImporter, migrateHtml, payload, run, seoFrom, seoIndex, SITE, text } from "./lib";

type WpPage = {
  id: number;
  slug: string;
  status: string;
  link: string;
  parent: number;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  featured_media: number;
};

/** Pages the blueprint drops (helpers, tests, builder leftovers). */
const DROPPED = new Set([
  "test", "sample-page-3", "sample-end-page-call-to-actions", "real-estate-call-to-action-shortcode",
  "divi-login-designer", "welcome2024", "cookie-consent",
  "iframe-map-howard-park", "iframe-map-el-sereno", "iframe-map-cordes", "iframe-map-clearfield-park",
  "iframe-map-beverley-terrace", "iframe-map-alder-manor",
]);

const NEIGHBORHOODS: Record<string, { name: string; ihf: number }> = {
  "alder-manor": { name: "Alder Manor", ihf: 2243056 },
  "beverly-terrace": { name: "Beverly Terrace", ihf: 2242921 },
  "clearfield-park": { name: "Clearfield Park", ihf: 2242828 },
  cordes: { name: "Cordes", ihf: 2242907 },
  "el-sereno": { name: "El Sereno & White Oaks", ihf: 2242844 },
  "howard-park": { name: "Howard Park", ihf: 2242880 },
};

const fetchHtml = async (url: string) => {
  const res = await fetch(url, { headers: { "User-Agent": "SanCarlosLife-migration/1.0" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
};

async function upsertBySlug(collection: "timeline-entries" | "testimonials", where: Record<string, unknown>, data: Record<string, unknown>) {
  const p = await payload();
  const found = await p.find({ collection, where: where as never, limit: 1 });
  return found.docs[0]
    ? p.update({ collection, id: found.docs[0].id, data: data as never })
    : p.create({ collection, data: data as never });
}

await run("misc", async () => {
  const p = await payload();
  const media = await MediaImporter.create();
  const seo = await seoIndex();

  // ---- History timeline (Cool Timeline stories on /history-of-san-carlos/)
  const history = await fetchHtml(`${SITE}/history-of-san-carlos/`);
  const stories = [...history.matchAll(/<div id="ctl-story-(\d+)"[\s\S]*?(?=<div id="ctl-story-\d+"|<\/div><\/div><\/div><!--\s*end|$)/g)];
  let sort = 0;
  for (const m of stories) {
    const block = m[0];
    const wpId = Number(m[1]);
    const title = text(block.match(/class="ctl-title[^"]*"[^>]*>([\s\S]*?)<\/div>/)?.[1]);
    const date = text(block.match(/story-date">([\s\S]*?)<\/div>/)?.[1]);
    const year = Number(date.match(/\d{4}/)?.[0]);
    const imageUrl = block.match(/class="ctl_glightbox"[^>]*href="([^"]+)"|href="([^"]+)"[^>]*class="ctl_glightbox"/);
    const desc = block.match(/<div class="ctl-description">([\s\S]*?)<\/div><\/div><\/div>/)?.[1] ?? "";
    if (!year) continue;
    const img = imageUrl ? await media.ensureByUrl(imageUrl[1] ?? imageUrl[2]) : undefined;
    await upsertBySlug("timeline-entries", { wpId: { equals: wpId } }, {
      year,
      dateLabel: date !== String(year) ? date : undefined,
      sort: sort++,
      title: title || `San Carlos in ${year}`,
      body: htmlToLexical(await migrateHtml(desc, media)),
      image: img?.id,
      wpId,
    });
  }
  console.log(`timeline: ${sort} stories`);

  // ---- Testimonials (Strong Testimonials on the Viv & Mark page)
  const team = await fetchHtml(`${SITE}/one-of-the-best-realtor-teams-in-san-carlos-ca/`);
  const blocks = [...team.matchAll(/<div class="wpmtst-testimonial[ "][\s\S]*?(?=<div class="wpmtst-testimonial[ "]|<\/section|<div class="wpmtst-pagination|$)/g)];
  let tCount = 0;
  for (const [i, b] of blocks.entries()) {
    const html = b[0];
    const heading = text(html.match(/wpmtst-testimonial-heading[^>]*>([\s\S]*?)<\/(?:h\d|div)>/)?.[1]);
    const quote = text(
      html.match(/class="readmore-content[^"]*"[^>]*>([\s\S]*?)<\/div>/)?.[1] ??
        html.match(/class="readmore-excerpt[^"]*"[^>]*>([\s\S]*?)<\/div><\/div>/)?.[1] ??
        // Short testimonials have no "read more" block: take the text before the author fields.
        html.match(/wpmtst-testimonial-content[^>]*>([\s\S]*?)<div class="wpmtst-testimonial-field/)?.[1],
    ).replace(/\s*Read (more|less)\s*$/i, "");
    const fields = [...html.matchAll(/wpmtst-testimonial-field[^>]*>([\s\S]*?)<\/div>/g)].map((x) => text(x[1])).filter(Boolean);
    if (!quote) continue;
    await upsertBySlug("testimonials", { quote: { like: quote.slice(0, 60) } }, {
      quote,
      author: fields[0] || heading || "Vabrato client",
      context: [heading, fields[1]].filter(Boolean).join(" · ") || undefined,
      featured: i < 3,
    });
    tCount++;
  }
  console.log(`testimonials: ${tCount}`);

  // ---- Pages and neighborhoods
  const pages = await loadJson<WpPage[]>("pages");
  let pCount = 0;
  for (const wp of pages) {
    if (DROPPED.has(wp.slug)) continue;
    const title = text(wp.title.rendered);
    const { seo: seoGroup, jsonLd } = seoFrom(seo[wp.link], title);
    const body = await migrateHtml(wp.content.rendered, media);
    const hood = NEIGHBORHOODS[wp.slug];
    if (hood) {
      const plain = decodeHTML(body.replace(/<[^>]+>/g, "\n")).split("\n").map((l) => l.trim()).filter(Boolean);
      // Divi layout: ABOUT / NAME, intro paragraph, then UPPERCASE heading + sentence pairs.
      const isCaps = (l: string) => l === l.toUpperCase() && /[A-Z]/.test(l);
      const aboutAt = plain.findIndex((l) => /^ABOUT\b/i.test(l));
      let i = aboutAt >= 0 ? aboutAt + 1 : 0;
      while (i < plain.length && isCaps(plain[i])) i++; // skip "HOWARD PARK" heading lines
      const intro = plain[i++];
      const highlights: { title: string; text: string }[] = [];
      for (; i < plain.length - 1; i++) {
        if (/^(PHOTO|MAPS|HOMES|GALLERY)\b/i.test(plain[i])) break;
        if (isCaps(plain[i]) && !isCaps(plain[i + 1])) {
          const t = plain[i].toLowerCase();
          highlights.push({ title: t.charAt(0).toUpperCase() + t.slice(1), text: plain[i + 1] });
          i++;
        }
      }
      // "<Name> questions" section: question lines end with "?" and the answer follows.
      const faq: { question: string; answer: string }[] = [];
      const qAt = plain.findIndex((l) => /questions$/i.test(l));
      if (qAt >= 0) {
        for (let j = qAt + 1; j < plain.length - 1; j++) {
          if (plain[j].endsWith("?") && !plain[j + 1].endsWith("?")) {
            faq.push({ question: plain[j], answer: plain[j + 1] });
            j++;
          }
        }
      }
      const data = {
        name: hood.name,
        slug: wp.slug,
        generateSlug: false,
        tagline: title.split(":")[0]?.includes("San Carlos") ? undefined : title,
        hero: await media.ensure(wp.featured_media),
        intro: htmlToLexical(intro ? `<p>${intro}</p>` : ""),
        highlights,
        faq,
        ihfMarketId: hood.ihf,
        seo: { ...seoGroup, title: seoGroup.title ?? title },
        jsonLd,
        wpId: wp.id,
        _status: "published" as const,
      };
      const found = await p.find({ collection: "neighborhoods", where: { slug: { equals: wp.slug } }, limit: 1, draft: true });
      if (found.docs[0]) await p.update({ collection: "neighborhoods", id: found.docs[0].id, data });
      else await p.create({ collection: "neighborhoods", data });
      continue;
    }
    const data = {
      title,
      slug: wp.slug,
      generateSlug: false,
      hero: { image: await media.ensure(wp.featured_media) },
      body: htmlToLexical(body),
      seo: seoGroup,
      jsonLd,
      wpId: wp.id,
      _status: (wp.status === "publish" ? "published" : "draft") as "published" | "draft",
    };
    const found = await p.find({ collection: "pages", where: { slug: { equals: wp.slug } }, limit: 1, draft: true });
    if (found.docs[0]) await p.update({ collection: "pages", id: found.docs[0].id, data });
    else await p.create({ collection: "pages", data });
    pCount++;
  }
  await media.save();
  console.log(`pages: ${pCount}, neighborhoods: ${Object.keys(NEIGHBORHOODS).length}`);
});
