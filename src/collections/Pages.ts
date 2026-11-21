import { slugField, type CollectionConfig } from "payload";

import { publishedOrStaff, staffOnly } from "../access/roles";
import { bodyField } from "../fields/richText";
import { jsonLdField, seoFields, wpIdField } from "../fields/seo";
import { revalidateHooks } from "../hooks/revalidate";

export const Pages: CollectionConfig = {
  slug: "pages",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "_status", "updatedAt"],
    group: "Content",
    description: "Hub, guide and legal pages. Layout blocks arrive in milestone 12.",
  },
  access: {
    read: publishedOrStaff,
    create: staffOnly,
    update: staffOnly,
    delete: staffOnly,
  },
  versions: { drafts: true, maxPerDoc: 25 },
  hooks: revalidateHooks("pages"),
  fields: [
    { name: "title", type: "text", required: true },
    slugField(),
    {
      name: "hero",
      type: "group",
      fields: [
        { name: "heading", type: "text", admin: { description: "Defaults to the page title." } },
        { name: "subheading", type: "textarea" },
        { name: "image", type: "upload", relationTo: "media" },
        { name: "videoUrl", type: "text", admin: { description: "Optional background video (mp4)." } },
      ],
    },
    bodyField(),
    seoFields,
    jsonLdField,
    wpIdField,
  ],
};
