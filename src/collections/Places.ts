import { slugField, type CollectionConfig } from "payload";

import { publishedOrStaff, staffOnly } from "../access/roles";
import { bodyField } from "../fields/richText";
import { jsonLdField, seoFields, wpIdField } from "../fields/seo";
import { reviewField } from "../fields/review";
import { revalidateHooks } from "../hooks/revalidate";
import { reviewCheck } from "../hooks/review";

/** 24-hour "HH:MM" (00:00–24:00). */
const hhmm = (v: unknown) => (typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$|^24:00$/.test(v)) || "Use 24-hour time, e.g. 09:30 or 21:00";

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
  hooks: { ...revalidateHooks("places"), beforeChange: [reviewCheck("places")] },
  fields: [
    reviewField,
    { name: "name", type: "text", required: true, admin: { description: "Short name for cards, e.g. Pho Vinh" } },
    {
      name: "headline",
      type: "text",
      admin: { description: "Page heading, e.g. Pho Vinh San Carlos, Vibrant Authentic Vietnamese Pho. Defaults to the name." },
    },
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
    {
      type: "row",
      fields: [
        { name: "email", type: "email" },
        { name: "mapsUrl", type: "text", label: "Directions link" },
      ],
    },
    { name: "hours", type: "textarea", admin: { description: "Old free-text hours (from WordPress). Used only when Opening hours below is empty." } },
    {
      name: "openingHours",
      type: "array",
      labels: { singular: "Hours row", plural: "Opening hours" },
      admin: {
        description: "Structured hours, San Carlos time. Drives the Open now / Closed label and the hours table. Days not listed show as Closed.",
        initCollapsed: true,
      },
      fields: [
        {
          type: "row",
          fields: [
            { name: "days", type: "text", required: true, admin: { description: "Label shown, e.g. Tue–Wed" } },
            {
              name: "dow",
              type: "select",
              hasMany: true,
              required: true,
              label: "Days",
              options: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => ({ label: d, value: d.toLowerCase() })),
            },
          ],
        },
        {
          name: "slots",
          type: "array",
          minRows: 1,
          labels: { singular: "Time", plural: "Times" },
          fields: [
            {
              type: "row",
              fields: [
                { name: "opens", type: "text", required: true, admin: { description: "24-hour, e.g. 11:00" }, validate: hhmm },
                { name: "closes", type: "text", required: true, admin: { description: "e.g. 21:30 (00:00 = midnight)" }, validate: hhmm },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "links",
      type: "array",
      admin: { description: "Menu, ordering, reservations, reviews and social links." },
      fields: [
        {
          type: "row",
          fields: [
            { name: "label", type: "text", required: true },
            { name: "url", type: "text", required: true },
            {
              name: "kind",
              type: "select",
              defaultValue: "web",
              options: [
                { label: "Website / social", value: "web" },
                { label: "Menu / ordering", value: "order" },
                { label: "Reservations", value: "reserve" },
                { label: "Reviews", value: "reviews" },
              ],
            },
          ],
        },
      ],
    },
    { name: "highlights", type: "text", hasMany: true },
    { name: "nearby", type: "text", hasMany: true, label: "Nearby places" },
    { name: "cuisines", type: "text", hasMany: true },
    { name: "meals", type: "text", hasMany: true },
    { name: "features", type: "text", hasMany: true },
    { name: "specialDiets", type: "text", hasMany: true },
    { name: "cover", type: "upload", relationTo: "media" },
    { name: "logo", type: "upload", relationTo: "media" },
    { name: "gallery", type: "upload", relationTo: "media", hasMany: true },
    { name: "videos", type: "text", hasMany: true, admin: { description: "YouTube links" } },
    {
      name: "guide",
      type: "group",
      label: "Quick guide page",
      admin: {
        description:
          "The restaurant/shop page layout (design B): photo mosaic, In short, tabs for Overview, Menu or Shop, Photos, Hours & map, Reviews and FAQ, and the action card. Empty parts are simply left out.",
      },
      fields: [
        { name: "tagline", type: "text", admin: { description: "One line under the name." } },
        { name: "summary", type: "textarea", label: "In short", admin: { description: "Two or three sentences answering what it is, where and why go. Also the page description." } },
        {
          type: "row",
          fields: [
            { name: "area", type: "text", admin: { description: "e.g. Laurel Street, downtown San Carlos" } },
            { name: "schemaType", type: "text", label: "Schema type", admin: { description: "schema.org type, e.g. Restaurant, BookStore, Store" } },
          ],
        },
        { name: "categories", type: "text", hasMany: true, admin: { description: "Shown under the name, e.g. Bookstore, Kids & family." } },
        { name: "goodFor", type: "text", hasMany: true, label: "Good for" },
        {
          name: "primaryAction",
          type: "group",
          label: "Main button",
          admin: { description: "Optional first button on the action card, e.g. Reserve a table or Order online." },
          fields: [
            {
              type: "row",
              fields: [
                { name: "label", type: "text" },
                { name: "url", type: "text" },
              ],
            },
          ],
        },
        {
          name: "story",
          type: "array",
          labels: { singular: "Story section", plural: "Story" },
          admin: { initCollapsed: true },
          fields: [
            { name: "heading", type: "text", required: true },
            { name: "text", type: "textarea", required: true, admin: { description: "Leave a blank line between paragraphs." } },
          ],
        },
        { name: "itemsTitle", type: "text", label: "Menu / shop heading", admin: { description: "Defaults to Menu highlights (restaurants) or What you'll find (shops)." } },
        {
          name: "items",
          type: "array",
          labels: { singular: "Item", plural: "Menu or shop items" },
          admin: { initCollapsed: true },
          fields: [
            { name: "name", type: "text", required: true },
            { name: "description", type: "textarea" },
            { name: "image", type: "upload", relationTo: "media" },
          ],
        },
        { name: "alsoTry", type: "text", hasMany: true, label: "Also worth trying" },
        {
          name: "know",
          type: "array",
          labels: { singular: "Fact", plural: "Good to know" },
          admin: { initCollapsed: true, description: "Short facts, e.g. Parking: free lot behind the shop." },
          fields: [
            {
              type: "row",
              fields: [
                { name: "label", type: "text", required: true },
                { name: "value", type: "text", required: true },
              ],
            },
          ],
        },
        {
          name: "reviews",
          type: "group",
          label: "What customers say",
          admin: { description: "A summary in our own words, never copied review text." },
          fields: [
            { name: "praise", type: "text", hasMany: true, label: "What people love" },
            { name: "notes", type: "text", hasMany: true, label: "Good to know" },
            { name: "source", type: "text", admin: { description: "e.g. Based on Google and Yelp reviews, October 2026" } },
          ],
        },
        {
          name: "faq",
          type: "array",
          labels: { singular: "Question", plural: "FAQ" },
          admin: { initCollapsed: true },
          fields: [
            { name: "question", type: "text", required: true },
            { name: "answer", type: "textarea", required: true },
          ],
        },
        {
          name: "related",
          type: "array",
          labels: { singular: "Link", plural: "More nearby" },
          admin: { initCollapsed: true },
          fields: [
            {
              type: "row",
              fields: [
                { name: "label", type: "text", required: true },
                { name: "url", type: "text", required: true },
                { name: "note", type: "text" },
              ],
            },
          ],
        },
        {
          type: "row",
          fields: [
            { name: "hoursNote", type: "text", admin: { description: "e.g. Closed Mondays" } },
            { name: "hoursSource", type: "text", admin: { description: "Where the hours come from, e.g. Shop website, checked Oct 8, 2026" } },
            { name: "checkedAt", type: "date", label: "Details checked on" },
          ],
        },
      ],
    },
    bodyField(),
    seoFields,
    jsonLdField,
    wpIdField,
  ],
};
