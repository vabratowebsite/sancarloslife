import { plainText } from "@/lib/format";

/**
 * The Operations Desk format check. Every item sent for review is checked
 * against its format before it reaches the Approval queue, whoever wrote it
 * (an editor, a Claude research run or the website's backup AI). An item that
 * fails can't be approved until it's fixed; the problems are listed in plain words.
 */

export type DeskCollection = "posts" | "events" | "places" | "city-projects" | "desk-pages";
export type FormatCheck = { ok: boolean; problems: string[]; checkedAt: string };

type Doc = Record<string, unknown>;

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const words = (richText: unknown) => plainText(richText, 1_000_000).split(/\s+/).filter(Boolean).length;
const has = (v: unknown) => v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0);
const seo = (d: Doc) => (d.seo ?? {}) as { title?: string; description?: string };
const isUrl = (v: unknown) => /^https?:\/\/\S+\.\S+/.test(text(v));

function seoProblems(d: Doc, fallbackTitle: string, out: string[]) {
  const title = text(seo(d).title) || fallbackTitle;
  const desc = text(seo(d).description);
  if (title.length > 70) out.push(`Google title is ${title.length} characters; keep it to 70 or fewer.`);
  if (!desc) out.push("Add a Google description (SEO → description).");
  else if (desc.length < 50 || desc.length > 160) out.push(`Google description is ${desc.length} characters; aim for 50 to 160.`);
}

export function checkFormat(collection: DeskCollection, d: Doc): FormatCheck {
  const p: string[] = [];
  switch (collection) {
    case "posts": {
      if (!text(d.title)) p.push("Add a title.");
      if (!has(d.cover)) p.push("Add a cover photo.");
      if (!text(d.excerpt)) p.push("Add a short summary (excerpt): the direct answer readers and AI search see first.");
      const n = words(d.body);
      if (n < 300) p.push(`The post is ${n} words; posts need at least 300.`);
      if (!has(d.categories)) p.push("Choose at least one category.");
      seoProblems(d, text(d.title), p);
      break;
    }
    case "events": {
      if (!text(d.title)) p.push("Add a title.");
      if (!has(d.startsAt)) p.push("Add the start date and time.");
      if (!has(d.venue)) p.push("Choose a venue.");
      if (words(d.body) < 30) p.push("Describe the event in at least 30 words.");
      if (!has(d.cover)) p.push("Add a photo.");
      break;
    }
    case "places": {
      if (!text(d.name)) p.push("Add the business name.");
      if (!text(d.headline)) p.push("Add a one-line headline.");
      if (!text(d.address)) p.push("Add the street address.");
      if (!has(d.cover)) p.push("Add a cover photo.");
      seoProblems(d, text(d.name), p);
      break;
    }
    case "city-projects": {
      if (!text(d.title)) p.push("Add a title.");
      if (!text(d.summary)) p.push("Add a summary.");
      if (!has(d.sources)) p.push("List at least one official source.");
      break;
    }
    case "desk-pages": {
      if (!text(d.title)) p.push("Add a title.");
      const summary = text(d.summary);
      if (summary.length < 40 || summary.length > 320) p.push("The quick answer at the top should be 40 to 320 characters.");
      const sections = (d.sections as { heading?: string; body?: unknown }[] | undefined) ?? [];
      if (sections.length < 2) p.push("Add at least 2 sections.");
      sections.forEach((s, i) => {
        if (!text(s.heading)) p.push(`Section ${i + 1} needs a heading.`);
        if (words(s.body) < 20) p.push(`Section ${i + 1} needs at least 20 words.`);
      });
      const faq = (d.faq as { question?: string; answer?: string }[] | undefined) ?? [];
      if (faq.length < 3) p.push("Add at least 3 FAQs.");
      const sources = (d.sources as { label?: string; url?: string }[] | undefined) ?? [];
      if (!sources.length) p.push("List at least one source.");
      sources.forEach((s, i) => !isUrl(s.url) && p.push(`Source ${i + 1} needs a full link starting with https://.`));
      const cta = (d.cta ?? {}) as { heading?: string; buttonLabel?: string; buttonHref?: string };
      if (!text(cta.heading) || !text(cta.buttonLabel) || !text(cta.buttonHref)) p.push("Fill in the call to action (heading, button text and link).");
      seoProblems(d, text(d.title), p);
      break;
    }
  }
  return { ok: p.length === 0, problems: p, checkedAt: new Date().toISOString() };
}
