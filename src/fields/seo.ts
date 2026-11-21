import type { Field } from "payload";

/** SEO fields shared by every public content type (blueprint section 3 rules). */
export const seoFields: Field = {
  name: "seo",
  type: "group",
  label: "SEO",
  admin: { position: "sidebar" },
  fields: [
    {
      name: "title",
      type: "text",
      admin: { description: "Under 60 characters. Leave empty to use the page title." },
      validate: (value: unknown) =>
        typeof value === "string" && value.length > 70
          ? "Keep the SEO title under 60 characters (70 at most)."
          : true,
    },
    {
      name: "description",
      type: "textarea",
      admin: { description: "Under 155 characters." },
      validate: (value: unknown) =>
        typeof value === "string" && value.length > 170
          ? "Keep the description under 155 characters (170 at most)."
          : true,
    },
    { name: "focusKeyword", type: "text" },
    { name: "image", type: "upload", relationTo: "media", label: "Social image" },
    { name: "canonical", type: "text", admin: { description: "Only if this page copies another URL." } },
    { name: "noindex", type: "checkbox", defaultValue: false },
  ],
};

/** Structured data carried over from Rank Math or written by editors. */
export const jsonLdField: Field = {
  name: "jsonLd",
  type: "json",
  label: "JSON-LD",
  admin: {
    position: "sidebar",
    description: "Extra schema.org data. The site adds Article/Event/Place schema automatically.",
  },
};

/** WordPress id kept for migration and redirects. */
export const wpIdField: Field = {
  name: "wpId",
  type: "number",
  index: true,
  admin: { position: "sidebar", readOnly: true, description: "WordPress id (migration)." },
};
