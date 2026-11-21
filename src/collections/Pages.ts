import { slugField, type CollectionConfig } from "payload";

import { adminsOnly, anyone, staffOnly } from "../access/roles";
import { jsonLdField, seoFields, wpIdField } from "../fields/seo";
import { revalidateHooks } from "../hooks/revalidate";

/**
 * Search settings for the site's pages. Page content is code (src/content/pages
 * and the route folders; owner's decision 2026-11-21), so this collection only
 * holds what's worth tuning without a deploy: the Google title, description,
 * share image, canonical URL, noindex and structured data, per page slug.
 */
export const Pages: CollectionConfig = {
  slug: "pages",
  labels: { singular: "Page SEO", plural: "Page SEO" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "updatedAt"],
    group: "Settings",
    description: "Google title, description and share image for each page. Page text itself is edited in code.",
  },
  access: {
    read: anyone,
    create: staffOnly,
    update: staffOnly,
    delete: adminsOnly,
  },
  hooks: revalidateHooks("pages"),
  fields: [
    { name: "title", type: "text", required: true, admin: { description: "The page's name, used when no SEO title is set." } },
    slugField(),
    seoFields,
    jsonLdField,
    wpIdField,
  ],
};
