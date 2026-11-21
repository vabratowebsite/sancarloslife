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
const dateTime = z.string().trim().datetime({ offset: true, message: "ISO 8601 date and time with offset, e.g. 2026-12-05T17:00:00-08:00" });
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
  event: {
    label: "Event",
    collection: "events" as const,
    schema: z.object({
      title: str(5, 120),
      slug,
      startsAt: dateTime,
      endsAt: dateTime.optional(),
      allDay: z.boolean().optional(),
      venue: z.object({ name: str(2, 120), address: z.string().trim().max(200).optional() }),
      organizer: z.object({ name: str(2, 120), url: url.optional() }).optional(),
      cost: z.string().trim().max(60).optional(),
      url: url.optional(),
      category: z.string().trim().max(60).optional(),
      description: str(150, 4000),
      sources: z.array(source).min(1).max(10),
      seo: seo.partial().optional(),
    }),
    shape: `{
  "title": "event name as the organizer gives it",
  "slug": "lowercase-words-with-dashes",
  "startsAt": "2026-12-05T17:00:00-08:00 (ISO 8601 with the San Carlos offset)",
  "endsAt": "optional, same format",
  "allDay": false,
  "venue": { "name": "venue name", "address": "street address, San Carlos, CA" },
  "organizer": { "name": "who runs it", "url": "https://... (optional)" },
  "cost": "Free, or e.g. $15 to $25",
  "url": "https://... official event page",
  "category": "one of the site's event categories",
  "description": "150 to 600 words: what happens, who it's for, practical details (parking, tickets, RSVP); paragraphs separated by blank lines",
  "sources": [{ "label": "where each fact comes from", "url": "https://..." }],
  "seo": { "title": "≤ 60 characters", "description": "50 to 155 characters" }
}`,
  },
  place: {
    label: "Restaurant or business profile",
    collection: "places" as const,
    schema: z.object({
      name: str(2, 80),
      slug,
      headline: str(10, 140),
      type: z.enum(["restaurant", "shop", "service", "bar"]),
      street: z.enum(["laurel", "san-carlos-ave", "el-camino", "industrial", "other"]),
      address: str(5, 200),
      phone: z.string().trim().max(40).optional(),
      website: url.optional(),
      priceRange: z.enum(["$", "$$", "$$$", "$$$$"]).optional(),
      hours: z.string().trim().max(600).optional(),
      cuisines: z.array(str(2, 40)).max(10).optional(),
      highlights: z.array(str(2, 80)).max(8).optional(),
      sections: z.array(section).min(2).max(8),
      faq: z.array(faq).max(6).optional(),
      sources: z.array(source).min(1).max(15),
      seo,
    }),
    shape: `{
  "name": "short business name for cards",
  "slug": "lowercase-words-with-dashes",
  "headline": "one line on what makes it worth a visit",
  "type": "restaurant | shop | service | bar",
  "street": "laurel | san-carlos-ave | el-camino | industrial | other",
  "address": "street address, San Carlos, CA 94070",
  "phone": "(650) 555-0100",
  "website": "https://...",
  "priceRange": "$ | $$ | $$$ | $$$$",
  "hours": "one line per day group, e.g. Mon–Fri 11am–9pm (only if a source gives them)",
  "cuisines": ["for restaurants"],
  "highlights": ["short, specific things to try or know"],
  "sections": [{ "heading": "The story / What to expect / Good to know", "text": "paragraphs separated by blank lines" }],
  "faq": [{ "question": "...", "answer": "40 to 80 words" }],
  "sources": [{ "label": "...", "url": "https://..." }],
  "seo": { "title": "≤ 60 characters", "description": "50 to 155 characters" }
}`,
  },
  "city-project": {
    label: "City project",
    collection: "city-projects" as const,
    schema: z.object({
      title: str(10, 140),
      slug,
      area: z.string().trim().max(80).optional(),
      status: z.enum(["proposed", "planning", "approved", "construction", "completed", "on_hold"]),
      summary: str(80, 700),
      sections: z.array(section).min(2).max(10),
      faq: z.array(faq).max(6).optional(),
      sources: z.array(source.extend({ publishedAt: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}/).optional() })).min(1).max(25),
      seo,
    }),
    shape: `{
  "title": "project name as the City uses it",
  "slug": "lowercase-words-with-dashes",
  "area": "neighborhood or street",
  "status": "proposed | planning | approved | construction | completed | on_hold",
  "summary": "80 to 700 characters: what it is, where, the stage it's at, the next decision and its date",
  "sections": [{ "heading": "What's planned / Cost and funding / Timeline / What residents can do", "text": "paragraphs separated by blank lines; label staff estimates and meeting statements as such" }],
  "faq": [{ "question": "...", "answer": "40 to 80 words" }],
  "sources": [{ "label": "official document or meeting", "url": "https://...", "publishedAt": "YYYY-MM-DD" }],
  "seo": { "title": "≤ 60 characters", "description": "50 to 155 characters" }
}`,
  },
} as const;

export type FormatKey = keyof typeof FORMATS;
export type FormatOutput<K extends FormatKey> = z.infer<(typeof FORMATS)[K]["schema"]>;

export type DraftRefs = { categoryId?: number | null; venueId?: number | string | null; organizerId?: number | string | null; eventCategoryId?: number | string | null };

const bodyText = (sections: { heading: string; text: string }[], faqs?: { question: string; answer: string }[]) =>
  [...sections.map((s) => `## ${s.heading}\n${s.text}`), ...(faqs?.length ? [`## Frequently asked questions`, ...faqs.map((f) => `### ${f.question}\n${f.answer}`)] : [])].join("\n\n");

/** Sources that don't show on the page go to the reviewer in the review note. */
export const sourcesNote = (sources: { label: string; url: string }[]) => `Sources the AI used:\n${sources.map((s) => `- ${s.label}: ${s.url}`).join("\n")}`;

/** Turns a validated AI answer into the data for a new draft in the format's collection. */
export function toDraftData(format: FormatKey, out: FormatOutput<FormatKey>, refs: DraftRefs = {}) {
  const review: Record<string, unknown> = { state: "in-review", source: "website-ai" };
  switch (format) {
    case "blog": {
      const o = out as FormatOutput<"blog">;
      const body = [bodyText(o.sections, o.faq), `## Sources`, ...o.sources.map((s) => `- ${s.label}: ${s.url}`)].join("\n\n");
      return {
        title: o.title,
        slug: o.slug,
        generateSlug: false,
        excerpt: o.excerpt,
        body: textToLexical(body),
        categories: refs.categoryId ? [refs.categoryId] : [],
        seo: { title: o.seo.title, description: o.seo.description, focusKeyword: o.seo.focusKeyword },
        _status: "draft",
        review,
      };
    }
    case "desk-page": {
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
    case "event": {
      const o = out as FormatOutput<"event">;
      review.note = sourcesNote(o.sources);
      return {
        title: o.title,
        slug: o.slug,
        generateSlug: false,
        // Events have their own status instead of Payload drafts; "draft" is visible to staff only.
        status: "draft",
        startsAt: new Date(o.startsAt).toISOString(),
        endsAt: o.endsAt ? new Date(o.endsAt).toISOString() : undefined,
        allDay: o.allDay ?? false,
        timezone: "America/Los_Angeles",
        venue: refs.venueId ?? undefined,
        organizer: refs.organizerId ?? undefined,
        categories: refs.eventCategoryId ? [refs.eventCategoryId] : [],
        cost: o.cost,
        url: o.url,
        body: textToLexical(o.description),
        seo: o.seo ? { title: o.seo.title, description: o.seo.description } : undefined,
        review,
      };
    }
    case "place": {
      const o = out as FormatOutput<"place">;
      review.note = sourcesNote(o.sources);
      return {
        name: o.name,
        slug: o.slug,
        generateSlug: false,
        headline: o.headline,
        type: o.type,
        street: o.street,
        address: o.address,
        phone: o.phone,
        website: o.website,
        priceRange: o.priceRange,
        hours: o.hours,
        cuisines: o.cuisines,
        highlights: o.highlights,
        body: textToLexical(bodyText(o.sections, o.faq)),
        seo: { title: o.seo.title, description: o.seo.description, focusKeyword: o.seo.focusKeyword },
        _status: "draft",
        review,
      };
    }
    case "city-project": {
      const o = out as FormatOutput<"city-project">;
      return {
        title: o.title,
        slug: o.slug,
        generateSlug: false,
        area: o.area,
        status: o.status,
        summary: o.summary,
        latestUpdateAt: new Date().toISOString(),
        body: textToLexical(bodyText(o.sections, o.faq)),
        sources: o.sources.map((s) => ({ title: s.label, url: s.url, publishedAt: s.publishedAt ? new Date(s.publishedAt).toISOString() : undefined })),
        seo: { title: o.seo.title, description: o.seo.description, focusKeyword: o.seo.focusKeyword },
        _status: "draft",
        review,
      };
    }
  }
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
  if (format === "event") {
    const start = new Date(Date.now() + 14 * 86_400_000);
    start.setUTCHours(1, 0, 0, 0); // 5 or 6 pm in San Carlos
    return JSON.stringify({
      title: `Test event: ${topic}`.slice(0, 110),
      slug: `test-${slug}`.slice(0, 80),
      startsAt: start.toISOString().replace(".000Z", "+00:00"),
      venue: { name: "Test venue (Burton Park)", address: "1070 Cedar St, San Carlos, CA 94070" },
      organizer: { name: "City of San Carlos (test)", url: "https://www.cityofsancarlos.org/" },
      cost: "Free",
      category: "Community",
      description: `${para(1)}\n\n${para(2)}`,
      sources,
      seo,
    });
  }
  if (format === "place")
    return JSON.stringify({
      name: `Test place ${topic}`.slice(0, 70),
      slug: `test-${slug}`.slice(0, 80),
      headline: `Test headline for ${topic}, written by the test AI`.slice(0, 130),
      type: "restaurant",
      street: "laurel",
      address: "700 Laurel St, San Carlos, CA 94070",
      priceRange: "$$",
      cuisines: ["Test cuisine"],
      highlights: ["Test highlight"],
      sections: sections.slice(0, 2),
      faq: faq.slice(0, 2),
      sources,
      seo,
    });
  if (format === "city-project")
    return JSON.stringify({
      title: `Test project: ${topic}`.slice(0, 130),
      slug: `test-${slug}`.slice(0, 80),
      area: "Downtown",
      status: "planning",
      summary: `Test summary of ${topic}, written by the test AI. A real summary says what the project is, where, its stage and the next decision.`,
      sections: sections.slice(0, 2),
      sources: [{ ...sources[0], publishedAt: "2026-11-01" }],
      seo,
    });
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
