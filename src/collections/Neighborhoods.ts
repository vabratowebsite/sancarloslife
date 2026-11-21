import { slugField, type CollectionConfig } from "payload";

import { publishedOrStaff, staffOnly } from "../access/roles";
import { bodyField } from "../fields/richText";
import { jsonLdField, seoFields, wpIdField } from "../fields/seo";
import { revalidateHooks } from "../hooks/revalidate";

export const Neighborhoods: CollectionConfig = {
  slug: "neighborhoods",
  admin: { useAsTitle: "name", group: "Real estate", defaultColumns: ["name", "slug", "_status"] },
  access: { read: publishedOrStaff, create: staffOnly, update: staffOnly, delete: staffOnly },
  versions: { drafts: true, maxPerDoc: 10 },
  hooks: revalidateHooks("neighborhoods"),
  fields: [
    { name: "name", type: "text", required: true },
    slugField({ useAsSlug: "name" }),
    { name: "tagline", type: "text" },
    { name: "hero", type: "upload", relationTo: "media" },
    bodyField("intro", "Story"),
    {
      name: "highlights",
      type: "array",
      fields: [
        { name: "icon", type: "text", admin: { description: "Icon name, e.g. park, school, coffee" } },
        { name: "title", type: "text", required: true },
        { name: "text", type: "textarea" },
      ],
    },
    {
      name: "schools",
      type: "array",
      admin: { description: "Assigned schools. Facts only, no rankings (Fair Housing)." },
      fields: [
        { name: "name", type: "text", required: true },
        { name: "grades", type: "text" },
        { name: "district", type: "text" },
        { name: "url", type: "text" },
      ],
    },
    {
      name: "faq",
      type: "array",
      fields: [
        { name: "question", type: "text", required: true },
        { name: "answer", type: "textarea", required: true },
      ],
    },
    {
      name: "bbFilterId",
      type: "text",
      label: "Buying Buddy filter",
      admin: {
        position: "sidebar",
        description:
          "Filter for this neighborhood's listings, copied from Buying Buddy's Widget Wizard (the data-filter value, e.g. a saved polygon/hotsheet). Empty shows all San Carlos listings.",
      },
    },
    {
      name: "ihfMarketId",
      type: "number",
      label: "Old iHomefinder market id",
      admin: { position: "sidebar", readOnly: true },
    },
    { name: "polygon", type: "json", admin: { description: "GeoJSON boundary for maps." } },
    seoFields,
    jsonLdField,
    wpIdField,
  ],
};
