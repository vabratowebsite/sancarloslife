import { slugField, type CollectionConfig } from "payload";

import { publishedOrStaff, staffOnly } from "../access/roles";
import { STATIC_PAGES } from "../content/pages";
import { reviewField } from "../fields/review";
import { bodyField } from "../fields/richText";
import { jsonLdField, seoFields } from "../fields/seo";
import { revalidateHooks } from "../hooks/revalidate";
import { reviewCheck } from "../hooks/review";

/** Slugs already taken by code routes; desk pages can't use them. */
const RESERVED = new Set([
  ...Object.keys(STATIC_PAGES),
  "about-san-carlos", "explore-the-city", "one-of-the-best-realtor-teams-in-san-carlos-ca", "parks-of-san-carlos",
  "history-of-san-carlos", "videos-of-san-carlos-ca", "restaurants-and-services", "homes-for-sale-in-san-carlos-ca",
  "open-houses-in-san-carlos-ca", "sell-my-house", "how-much-house-can-i-afford-mortgage-calculator", "buyers-and-sellers-guides",
  "contact-us", "subscribe", "events", "event", "restaurant", "store", "category", "search", "edit", "feed", "og", "admin", "api",
  "san-carlos-life-blog", "city-projects", "gallery", "listing-results", "listing-details", "market-area-report", "featured-communities",
]);

type Find = (a: object) => Promise<{ totalDocs: number }>;

/** A desk page's address must be free: not a code page, blog post, neighborhood or other desk page. */
async function validateDeskSlug(value: unknown, { req, id }: { req: { payload: { find: Find } }; id?: string | number }) {
  const slug = String(value ?? "");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return "Use lower-case words joined by dashes";
  if (RESERVED.has(slug)) return "That address belongs to another page";
  for (const collection of ["posts", "neighborhoods"]) {
    const hit = await req.payload.find({ collection, where: { slug: { equals: slug } }, limit: 1, depth: 0 });
    if (hit.totalDocs) return `A ${collection === "posts" ? "blog post" : "neighborhood"} already uses that address`;
  }
  const own = await req.payload.find({ collection: "desk-pages", where: { slug: { equals: slug }, ...(id ? { id: { not_equals: id } } : {}) }, limit: 1, depth: 0 });
  return own.totalDocs ? "Another desk page uses that address" : true;
}

/**
 * Pages the Operations Desk creates (guides, roundups, landing pages). Stored
 * here rather than in code so approving one publishes it at once. The AI
 * fills these fields; the site's template decides how they look.
 */
export const DeskPages: CollectionConfig = {
  slug: "desk-pages",
  labels: { singular: "Desk page", plural: "Desk pages" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "template", "_status", "updatedAt"],
    group: "Content",
    description: "Pages made through the Operations Desk. They live at sancarloslife.com/<slug>/ and use the site's page templates.",
  },
  access: { read: publishedOrStaff, create: staffOnly, update: staffOnly, delete: staffOnly },
  versions: { drafts: true, maxPerDoc: 25 },
  hooks: { ...revalidateHooks("desk-pages"), beforeChange: [reviewCheck("desk-pages")] },
  fields: [
    reviewField,
    { name: "title", type: "text", required: true },
    slugField({
      overrides: (field) => {
        const slug = (field as { fields: { name?: string; validate?: unknown }[] }).fields.find((f) => f.name === "slug");
        if (slug) slug.validate = validateDeskSlug;
        return field;
      },
    }),
    {
      name: "template",
      type: "select",
      required: true,
      defaultValue: "guide",
      options: [{ label: "Guide (quick answer, sections, FAQ, sources, call to action)", value: "guide" }],
    },
    { name: "eyebrow", type: "text", admin: { description: "Small label above the title, e.g. Holiday guide" } },
    {
      name: "summary",
      type: "textarea",
      required: true,
      admin: { description: "The quick answer at the top (40–320 characters). Search engines and AI answers quote this." },
    },
    { name: "hero", type: "upload", relationTo: "media" },
    {
      name: "sections",
      type: "array",
      fields: [{ name: "heading", type: "text", required: true }, bodyField("body", "Text")],
    },
    {
      name: "faq",
      type: "array",
      labels: { singular: "Question", plural: "FAQ" },
      fields: [
        { name: "question", type: "text", required: true },
        { name: "answer", type: "textarea", required: true },
      ],
    },
    {
      name: "sources",
      type: "array",
      fields: [
        {
          type: "row",
          fields: [
            { name: "label", type: "text", required: true },
            { name: "url", type: "text", required: true },
          ],
        },
      ],
    },
    {
      name: "cta",
      type: "group",
      label: "Call to action",
      fields: [
        { name: "heading", type: "text" },
        { name: "text", type: "textarea" },
        {
          type: "row",
          fields: [
            { name: "buttonLabel", type: "text" },
            { name: "buttonHref", type: "text" },
          ],
        },
      ],
    },
    { name: "updated", type: "date", admin: { position: "sidebar", description: "\"Last updated\" date shown on the page" } },
    seoFields,
    jsonLdField,
  ],
};
