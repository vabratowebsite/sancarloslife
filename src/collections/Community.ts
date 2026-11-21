import { slugField, type Access, type CollectionConfig } from "payload";

import { anyone, isStaffUser, publishedOrStaff, staffOnly } from "../access/roles";
import { bodyField } from "../fields/richText";
import { seoFields, wpIdField } from "../fields/seo";
import { revalidateHooks } from "../hooks/revalidate";

export const Parks: CollectionConfig = {
  slug: "parks",
  admin: { useAsTitle: "name", group: "Directory", defaultColumns: ["name", "type", "address"] },
  access: { read: publishedOrStaff, create: staffOnly, update: staffOnly, delete: staffOnly },
  versions: { drafts: true, maxPerDoc: 10 },
  hooks: revalidateHooks("parks"),
  fields: [
    { name: "name", type: "text", required: true },
    slugField({ useAsSlug: "name" }),
    {
      name: "type",
      type: "select",
      required: true,
      defaultValue: "park",
      options: [
        { label: "Park", value: "park" },
        { label: "Trail / open space", value: "trail" },
        { label: "Garden", value: "garden" },
      ],
    },
    { name: "address", type: "text" },
    { name: "mapsUrl", type: "text", label: "Directions link" },
    {
      type: "row",
      fields: [
        { name: "lat", type: "number" },
        { name: "lng", type: "number" },
        { name: "acres", type: "number" },
      ],
    },
    { name: "facilities", type: "text", hasMany: true },
    { name: "summary", type: "textarea", admin: { description: "One or two sentences for the parks list." } },
    { name: "cover", type: "upload", relationTo: "media" },
    bodyField(),
    seoFields,
  ],
};

export const TimelineEntries: CollectionConfig = {
  slug: "timeline-entries",
  labels: { singular: "History entry", plural: "History timeline" },
  admin: { useAsTitle: "title", group: "Community", defaultColumns: ["year", "title", "sort"] },
  access: { read: anyone, create: staffOnly, update: staffOnly, delete: staffOnly },
  defaultSort: "sort",
  hooks: revalidateHooks("timeline-entries"),
  fields: [
    {
      type: "row",
      fields: [
        { name: "year", type: "number", required: true, index: true },
        { name: "dateLabel", type: "text", admin: { description: 'Optional, e.g. "Spring 1925"' } },
        { name: "sort", type: "number", defaultValue: 0 },
      ],
    },
    { name: "title", type: "text", required: true },
    bodyField(),
    { name: "image", type: "upload", relationTo: "media" },
    { name: "sourceUrl", type: "text" },
    wpIdField,
  ],
};

export const Testimonials: CollectionConfig = {
  slug: "testimonials",
  admin: { useAsTitle: "author", group: "Real estate", defaultColumns: ["author", "context", "featured"] },
  access: { read: anyone, create: staffOnly, update: staffOnly, delete: staffOnly },
  hooks: revalidateHooks("testimonials"),
  fields: [
    { name: "quote", type: "textarea", required: true },
    { name: "author", type: "text", required: true },
    { name: "context", type: "text", admin: { description: 'e.g. "Sold in Howard Park, 2025"' } },
    { name: "date", type: "date" },
    { name: "featured", type: "checkbox", defaultValue: false },
    wpIdField,
  ],
};

/** Public sees approved photos only; submissions wait in the moderation queue. */
const approvedOrStaff: Access = ({ req }) =>
  isStaffUser(req.user) ? true : { status: { equals: "approved" } };

export const GalleryPhotos: CollectionConfig = {
  slug: "gallery-photos",
  admin: { useAsTitle: "caption", group: "Community", defaultColumns: ["caption", "photographer", "status"] },
  access: { read: approvedOrStaff, create: staffOnly, update: staffOnly, delete: staffOnly },
  defaultSort: "-submittedAt",
  hooks: revalidateHooks("gallery-photos"),
  fields: [
    { name: "image", type: "upload", relationTo: "media", required: true },
    { name: "caption", type: "text" },
    { name: "photographer", type: "text" },
    {
      name: "photographerEmail",
      type: "email",
      access: { read: ({ req }) => isStaffUser(req.user) },
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "pending",
      index: true,
      options: [
        { label: "Pending review", value: "pending" },
        { label: "Approved", value: "approved" },
        { label: "Rejected", value: "rejected" },
      ],
      admin: { position: "sidebar" },
    },
    { name: "featured", type: "checkbox", defaultValue: false, admin: { position: "sidebar" } },
    { name: "submittedAt", type: "date", admin: { position: "sidebar", readOnly: true } },
    wpIdField,
  ],
};

export const CityProjects: CollectionConfig = {
  slug: "city-projects",
  admin: {
    useAsTitle: "title",
    group: "Community",
    defaultColumns: ["title", "status", "latestUpdateAt"],
    description: "Civic project pages. Facts come from the San Carlos Civic Watch ops desk.",
  },
  access: { read: publishedOrStaff, create: staffOnly, update: staffOnly, delete: staffOnly },
  versions: { drafts: true, maxPerDoc: 25 },
  defaultSort: "-latestUpdateAt",
  hooks: revalidateHooks("city-projects"),
  fields: [
    { name: "title", type: "text", required: true },
    slugField(),
    {
      type: "row",
      fields: [
        { name: "area", type: "text" },
        {
          name: "status",
          type: "select",
          options: [
            { label: "Proposed", value: "proposed" },
            { label: "Planning", value: "planning" },
            { label: "Approved", value: "approved" },
            { label: "Under construction", value: "construction" },
            { label: "Completed", value: "completed" },
            { label: "On hold", value: "on_hold" },
          ],
        },
        { name: "latestUpdateAt", type: "date", index: true },
      ],
    },
    { name: "summary", type: "textarea" },
    { name: "cover", type: "upload", relationTo: "media" },
    bodyField(),
    {
      name: "sources",
      type: "array",
      fields: [
        { name: "title", type: "text", required: true },
        { name: "url", type: "text", required: true },
        { name: "publishedAt", type: "date" },
      ],
    },
    {
      name: "opsDeskId",
      type: "text",
      index: true,
      admin: { position: "sidebar", description: "Project id in the ops desk database." },
    },
    seoFields,
    wpIdField,
  ],
};
