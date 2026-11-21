import { slugField, type Access, type CollectionConfig } from "payload";

import { anyone, isStaffUser, staffOnly } from "../access/roles";
import { bodyField } from "../fields/richText";
import { seoFields, wpIdField } from "../fields/seo";
import { reviewField } from "../fields/review";
import { revalidateHooks } from "../hooks/revalidate";
import { reviewCheck } from "../hooks/review";

/**
 * Public visitors see published events; archived (past) events keep their URL.
 * Pending submissions and drafts are visible to staff only.
 */
const eventsRead: Access = ({ req }) => {
  if (isStaffUser(req.user)) return true;
  return { status: { in: ["published", "archived"] } };
};

export const Events: CollectionConfig = {
  slug: "events",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "startsAt", "status", "venue"],
    group: "Events",
    listSearchableFields: ["title", "slug"],
  },
  access: { read: eventsRead, create: staffOnly, update: staffOnly, delete: staffOnly },
  versions: { maxPerDoc: 10 },
  defaultSort: "startsAt",
  hooks: { ...revalidateHooks("events"), beforeChange: [reviewCheck("events")] },
  fields: [
    reviewField,
    { name: "title", type: "text", required: true },
    slugField(),
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "draft",
      index: true,
      options: [
        { label: "Draft", value: "draft" },
        { label: "Pending review (public submission)", value: "pending" },
        { label: "Published", value: "published" },
        { label: "Archived (past)", value: "archived" },
      ],
      admin: { position: "sidebar" },
    },
    {
      type: "row",
      fields: [
        {
          name: "startsAt",
          type: "date",
          required: true,
          index: true,
          admin: { date: { pickerAppearance: "dayAndTime" } },
        },
        { name: "endsAt", type: "date", admin: { date: { pickerAppearance: "dayAndTime" } } },
        { name: "allDay", type: "checkbox", defaultValue: false },
      ],
    },
    { name: "timezone", type: "text", defaultValue: "America/Los_Angeles", admin: { position: "sidebar" } },
    {
      name: "rrule",
      type: "text",
      label: "Repeats (RRULE)",
      admin: {
        description:
          "Recurrence rule, e.g. FREQ=WEEKLY;BYDAY=FR. Occurrences are expanded at query time, 24 months at most.",
      },
    },
    {
      name: "exdates",
      type: "array",
      label: "Skipped dates",
      admin: { condition: (data) => Boolean(data?.rrule) },
      fields: [{ name: "date", type: "date", required: true }],
    },
    { name: "series", type: "relationship", relationTo: "events", admin: { position: "sidebar" } },
    { name: "venue", type: "relationship", relationTo: "venues" },
    { name: "organizer", type: "relationship", relationTo: "organizers" },
    { name: "categories", type: "relationship", relationTo: "event-categories", hasMany: true },
    {
      type: "row",
      fields: [
        { name: "cost", type: "text", admin: { description: 'e.g. "Free" or "$15–$25"' } },
        { name: "url", type: "text", label: "Event website" },
      ],
    },
    { name: "cover", type: "upload", relationTo: "media" },
    { name: "featured", type: "checkbox", defaultValue: false, admin: { position: "sidebar" } },
    bodyField(),
    {
      name: "submittedBy",
      type: "group",
      admin: { condition: (data) => Boolean(data?.submittedBy?.email) },
      access: { read: ({ req }) => isStaffUser(req.user) },
      fields: [
        { name: "name", type: "text" },
        { name: "email", type: "email" },
        { name: "phone", type: "text" },
      ],
    },
    seoFields,
    wpIdField,
  ],
};

export const Venues: CollectionConfig = {
  slug: "venues",
  admin: { useAsTitle: "name", group: "Events", defaultColumns: ["name", "address", "city"] },
  access: { read: anyone, create: staffOnly, update: staffOnly, delete: staffOnly },
  hooks: revalidateHooks("venues"),
  fields: [
    { name: "name", type: "text", required: true },
    slugField({ useAsSlug: "name" }),
    { name: "address", type: "text" },
    {
      type: "row",
      fields: [
        { name: "city", type: "text", defaultValue: "San Carlos" },
        { name: "state", type: "text", defaultValue: "CA" },
        { name: "zip", type: "text" },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "lat", type: "number" },
        { name: "lng", type: "number" },
      ],
    },
    { name: "url", type: "text" },
    { name: "phone", type: "text" },
    wpIdField,
  ],
};

export const Organizers: CollectionConfig = {
  slug: "organizers",
  admin: { useAsTitle: "name", group: "Events" },
  access: { read: anyone, create: staffOnly, update: staffOnly, delete: staffOnly },
  hooks: revalidateHooks("organizers"),
  fields: [
    { name: "name", type: "text", required: true },
    slugField({ useAsSlug: "name" }),
    { name: "url", type: "text" },
    { name: "email", type: "email" },
    { name: "phone", type: "text" },
    wpIdField,
  ],
};

export const EventCategories: CollectionConfig = {
  slug: "event-categories",
  admin: { useAsTitle: "name", group: "Events" },
  access: { read: anyone, create: staffOnly, update: staffOnly, delete: staffOnly },
  hooks: revalidateHooks("event-categories"),
  fields: [
    { name: "name", type: "text", required: true },
    slugField({ useAsSlug: "name" }),
    { name: "color", type: "text", admin: { description: "Hex color for calendar chips, e.g. #2E9C9C" } },
    wpIdField,
  ],
};
