import { slugField, type CollectionConfig } from "payload";

import { publishedOrStaff, staffOnly } from "../access/roles";
import { bodyField } from "../fields/richText";
import { jsonLdField, seoFields, wpIdField } from "../fields/seo";
import { revalidateHooks } from "../hooks/revalidate";

export const Posts: CollectionConfig = {
  slug: "posts",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "categories", "publishedAt", "_status"],
    group: "Content",
    description: "Blog posts. Their URLs stay at the site root (sancarloslife.com/<slug>).",
  },
  access: {
    read: publishedOrStaff,
    create: staffOnly,
    update: staffOnly,
    delete: staffOnly,
  },
  versions: {
    drafts: { schedulePublish: true },
    maxPerDoc: 25,
  },
  defaultSort: "-publishedAt",
  hooks: revalidateHooks("posts"),
  fields: [
    { name: "title", type: "text", required: true },
    slugField(),
    {
      name: "publishedAt",
      type: "date",
      index: true,
      admin: { position: "sidebar", date: { pickerAppearance: "dayAndTime" } },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) =>
            !value && siblingData?._status === "published" ? new Date().toISOString() : value,
        ],
      },
    },
    { name: "author", type: "relationship", relationTo: "users", admin: { position: "sidebar" } },
    {
      name: "categories",
      type: "relationship",
      relationTo: "categories",
      hasMany: true,
      admin: { position: "sidebar" },
    },
    { name: "tags", type: "text", hasMany: true, admin: { position: "sidebar" } },
    { name: "cover", type: "upload", relationTo: "media" },
    { name: "excerpt", type: "textarea" },
    bodyField(),
    seoFields,
    jsonLdField,
    wpIdField,
  ],
};
