import { slugField, type CollectionConfig } from "payload";

import { publishedOrStaff, staffOnly } from "../access/roles";
import { bodyField } from "../fields/richText";
import { jsonLdField, seoFields, wpIdField } from "../fields/seo";
import { revalidateHooks } from "../hooks/revalidate";

/** Restaurants, shops, services and bars (replaces the Themify restaurant + store types). */
export const Places: CollectionConfig = {
  slug: "places",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "type", "street", "featured", "_status"],
    group: "Directory",
    listSearchableFields: ["name", "slug", "address"],
  },
  access: { read: publishedOrStaff, create: staffOnly, update: staffOnly, delete: staffOnly },
  versions: { drafts: true, maxPerDoc: 10 },
  hooks: revalidateHooks("places"),
  fields: [
    { name: "name", type: "text", required: true },
    slugField({ useAsSlug: "name" }),
    {
      type: "row",
      fields: [
        {
          name: "type",
          type: "select",
          required: true,
          index: true,
          options: [
            { label: "Restaurant", value: "restaurant" },
            { label: "Shop", value: "shop" },
            { label: "Service", value: "service" },
            { label: "Bar", value: "bar" },
          ],
        },
        {
          name: "businessStatus",
          type: "select",
          defaultValue: "open",
          options: [
            { label: "Open", value: "open" },
            { label: "Temporarily closed", value: "temporarily_closed" },
            { label: "Closed", value: "closed" },
          ],
        },
        { name: "featured", type: "checkbox", defaultValue: false, index: true },
      ],
    },
    {
      name: "street",
      type: "select",
      options: [
        { label: "Laurel Street", value: "laurel" },
        { label: "San Carlos Avenue", value: "san-carlos-ave" },
        { label: "El Camino Real", value: "el-camino" },
        { label: "Industrial Road", value: "industrial" },
        { label: "Other", value: "other" },
      ],
    },
    { name: "address", type: "text" },
    {
      type: "row",
      fields: [
        { name: "lat", type: "number" },
        { name: "lng", type: "number" },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "phone", type: "text" },
        { name: "website", type: "text" },
        {
          name: "priceRange",
          type: "select",
          options: ["$", "$$", "$$$", "$$$$"],
        },
      ],
    },
    { name: "hours", type: "textarea", admin: { description: "One line per day, e.g. Mon–Fri 11am–9pm" } },
    { name: "cuisines", type: "text", hasMany: true },
    { name: "meals", type: "text", hasMany: true },
    { name: "features", type: "text", hasMany: true },
    { name: "specialDiets", type: "text", hasMany: true },
    { name: "cover", type: "upload", relationTo: "media" },
    { name: "gallery", type: "upload", relationTo: "media", hasMany: true },
    bodyField(),
    seoFields,
    jsonLdField,
    wpIdField,
  ],
};
