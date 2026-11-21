import { z } from "zod";

import { textToLexical } from "./lexical";

/**
 * What the AI must return for each format, and how its answer becomes a draft
 * in the site. The AI only fills fields; the site's templates decide the look.
 * The same shape is used with every provider.
 */

const str = (min: number, max: number) => z.string().trim().min(min).max(max);
const url = z.string().trim().regex(/^https?:\/\/\S+\.\S+/, "must be a full https:// link");
const slug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "lower-case words joined by dashes")
  .max(80);
const section = z.object({ heading: str(2, 120), text: str(40, 8000) });
const faq = z.object({ question: str(5, 200), answer: str(20, 800) });
const source = z.object({ label: str(2, 200), url });
const seo = z.object({ title: str(10, 70), description: str(50, 160), focusKeyword: z.string().trim().max(80).optional() });

export const FORMATS = {
  blog: {
    label: "Blog post",
    collection: "posts" as const,
    schema: z.object({
      title: str(10, 120),
      slug,
      excerpt: str(80, 600),
      sections: z.array(section).min(3).max(12),
      faq: z.array(faq).min(3).max(8),
      sources: z.array(source).min(1).max(20),
      category: z.string().trim().max(60).optional(),
      seo,
    }),
    shape: `{
  "title": "search-friendly headline",
  "slug": "lowercase-words-with-dashes",
  "excerpt": "40 to 60 word direct answer to the post's main question",
  "sections": [{ "heading": "H2 heading", "text": "paragraphs separated by blank lines; '### ' for an H3; '- ' for bullets" }],
  "faq": [{ "question": "as a reader would type it", "answer": "40 to 80 words, self-contained" }],
  "sources": [{ "label": "Source name and what it supports", "url": "https://..." }],
  "category": "one of the site's blog categories",
  "seo": { "title": "≤ 60 characters", "description": "50 to 155 characters", "focusKeyword": "primary keyword" }
}`,
  },
  "desk-page": {
    label: "Guide page",
    collection: "desk-pages" as const,
    schema: z.object({
      title: str(10, 120),
      slug,
      eyebrow: z.string().trim().max(60).optional(),
      summary: str(40, 320),
      sections: z.array(section).min(2).max(12),
      faq: z.array(faq).min(3).max(8),
      sources: z.array(source).min(1).max(20),
      cta: z.object({ heading: str(3, 120), text: z.string().trim().max(300).optional(), buttonLabel: str(2, 40), buttonHref: z.string().trim().regex(/^(\/|https:\/\/)/) }),
      seo,
    }),
    shape: `{
  "title": "page title",
  "slug": "lowercase-words-with-dashes",
  "eyebrow": "short label above the title (optional)",
  "summary": "the quick answer, 40 to 320 characters",
  "sections": [{ "heading": "section heading", "text": "paragraphs separated by blank lines; '### ' for an H3; '- ' for bullets" }],
  "faq": [{ "question": "...", "answer": "40 to 80 words" }],
  "sources": [{ "label": "...", "url": "https://..." }],
  "cta": { "heading": "...", "text": "...", "buttonLabel": "...", "buttonHref": "/subscribe/ or another site path" },
  "seo": { "title": "≤ 60 characters", "description": "50 to 155 characters" }
}`,
  },
} as const;

export type FormatKey = keyof typeof FORMATS;
export type FormatOutput<K extends FormatKey> = z.infer<(typeof FORMATS)[K]["schema"]>;

/** Turns a validated AI answer into the data for a new draft in the format's collection. */
export function toDraftData(format: FormatKey, out: FormatOutput<FormatKey>, opts: { categoryId?: number | null }) {
  const review = { state: "in-review", source: "website-ai" };
  if (format === "blog") {
    const o = out as FormatOutput<"blog">;
    const body = [
      ...o.sections.map((s) => `## ${s.heading}\n${s.text}`),
      `## Frequently asked questions`,
      ...o.faq.map((f) => `### ${f.question}\n${f.answer}`),
      `## Sources`,
      ...o.sources.map((s) => `- ${s.label}: ${s.url}`),
    ].join("\n\n");
    return {
      title: o.title,
      slug: o.slug,
      generateSlug: false,
      excerpt: o.excerpt,
      body: textToLexical(body),
      categories: opts.categoryId ? [opts.categoryId] : [],
      seo: { title: o.seo.title, description: o.seo.description, focusKeyword: o.seo.focusKeyword },
      _status: "draft",
      review,
    };
  }
  const o = out as FormatOutput<"desk-page">;
  return {
    title: o.title,
    slug: o.slug,
    generateSlug: false,
    template: "guide",
    eyebrow: o.eyebrow,
    summary: o.summary,
    sections: o.sections.map((s) => ({ heading: s.heading, body: textToLexical(s.text) })),
    faq: o.faq,
    sources: o.sources,
    cta: o.cta,
    seo: { title: o.seo.title, description: o.seo.description },
    updated: new Date().toISOString(),
    _status: "draft",
    review,
  };
}

/** Pulls the JSON object out of a model reply (tolerates ```json fences and stray text). */
export function extractJson(reply: string): unknown {
  const fenced = reply.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : reply;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("The AI didn't return JSON.");
  return JSON.parse(raw.slice(start, end + 1));
}

/**
 * The test AI's answer: a complete, valid draft built from the notes, so the
 * whole flow can be tried without calling (or paying) any provider.
 */
export function mockAnswer(format: FormatKey, notes: string): string {
  const body = notes.replace(/^NOTES AND SOURCES FROM THE EDITOR\s*/i, "");
  const topic = (body.split("\n").find((l) => l.trim()) ?? "").trim().slice(0, 60) || "San Carlos";
  const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60) || "san-carlos";
  const para = (n: number) =>
    `This is test text written by the test AI about ${topic}. It stands in for real research so the desk can be tried end to end. Paragraph ${n} keeps one idea per paragraph, as the San Carlos Life rules ask.`;
  const sections = [1, 2, 3].map((i) => ({ heading: `Test section ${i} about ${topic}`.slice(0, 110), text: `${para(i)}\n\n${para(i + 3)}` }));
  const faq = [1, 2, 3].map((i) => ({ question: `Test question ${i} about ${topic}?`, answer: `This is a test answer from the test AI. A real answer is 40 to 80 words, self-contained and specific to San Carlos.` }));
  const sources = [{ label: "City of San Carlos (test source)", url: "https://www.cityofsancarlos.org/" }];
  const seo = { title: `${topic} | San Carlos Life`.slice(0, 60), description: `Test draft about ${topic} in San Carlos, written by the test AI to try the Operations Desk.`.slice(0, 155) };
  if (format === "blog")
    return JSON.stringify({
      title: `Test post: ${topic}`.slice(0, 110),
      slug: `test-${slug}`.slice(0, 80),
      excerpt: `This test post about ${topic} was written by the test AI. A real excerpt answers the post's main question directly in 40 to 60 words for readers and answer engines.`,
      sections,
      faq,
      sources,
      category: "Community",
      seo,
    });
  return JSON.stringify({
    title: `Test guide: ${topic}`.slice(0, 110),
    slug: `test-${slug}`.slice(0, 80),
    eyebrow: "Test guide",
    summary: `Test quick answer about ${topic}, written by the test AI so the desk can be tried without a real AI.`,
    sections,
    faq,
    sources,
    cta: { heading: "Never miss a San Carlos event", text: "One email a week.", buttonLabel: "Subscribe", buttonHref: "/subscribe/" },
    seo,
  });
}
