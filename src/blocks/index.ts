import type { Block, Field } from "payload";

import { richTextEditor } from "../fields/richText";

/**
 * Layout blocks for hub and guide pages. Each block has a matching component in
 * src/components/blocks/; BlockRenderer maps slug to component.
 */

const heading: Field = { name: "heading", type: "text" };
const eyebrow: Field = { name: "eyebrow", type: "text", admin: { description: "Small label above the heading (optional)." } };
const anchor: Field = {
  name: "anchor",
  type: "text",
  admin: { description: "Optional id for links to this section, e.g. schools → /about-san-carlos/#schools" },
  validate: (v: unknown) => !v || /^[a-z0-9-]+$/.test(String(v)) || "Lower-case letters, numbers and dashes only",
};
const linkFields: Field[] = [
  {
    type: "row",
    fields: [
      { name: "label", type: "text", required: true },
      {
        name: "href",
        type: "text",
        required: true,
        admin: { description: "/path/ on this site, or a full https:// link" },
        validate: (v: unknown) => /^(\/|https:\/\/|mailto:|tel:)/.test(String(v ?? "")) || "Start with /, https://, mailto: or tel:",
      },
    ],
  },
];

export const ProseBlock: Block = {
  slug: "prose",
  labels: { singular: "Text", plural: "Text" },
  fields: [anchor, eyebrow, heading, { name: "content", type: "richText", editor: richTextEditor }],
};

export const StatsBlock: Block = {
  slug: "stats",
  labels: { singular: "Quick facts", plural: "Quick facts" },
  fields: [
    anchor,
    eyebrow,
    heading,
    {
      name: "items",
      type: "array",
      minRows: 1,
      maxRows: 8,
      fields: [
        {
          type: "row",
          fields: [
            { name: "value", type: "text", required: true },
            { name: "label", type: "text", required: true },
          ],
        },
      ],
    },
    { name: "note", type: "text", admin: { description: "Source and date of the figures, shown in small print." } },
  ],
};

export const FeatureListBlock: Block = {
  slug: "featureList",
  labels: { singular: "Feature list", plural: "Feature lists" },
  fields: [
    anchor,
    eyebrow,
    heading,
    { name: "intro", type: "textarea" },
    {
      name: "items",
      type: "array",
      minRows: 1,
      fields: [
        { name: "title", type: "text", required: true },
        { name: "text", type: "textarea" },
      ],
    },
  ],
};

export const CardGridBlock: Block = {
  slug: "cardGrid",
  labels: { singular: "Card grid", plural: "Card grids" },
  fields: [
    anchor,
    eyebrow,
    heading,
    { name: "intro", type: "textarea" },
    {
      name: "source",
      type: "select",
      defaultValue: "manual",
      options: [
        { label: "Cards I enter below", value: "manual" },
        { label: "Featured restaurants", value: "restaurants" },
        { label: "Shops and services", value: "shops" },
        { label: "Upcoming events", value: "events" },
        { label: "Parks", value: "parks" },
        { label: "Latest blog posts", value: "posts" },
      ],
    },
    { name: "limit", type: "number", defaultValue: 6, min: 1, max: 12, admin: { condition: (_, s) => s?.source !== "manual" } },
    {
      name: "more",
      type: "group",
      label: "\"See all\" link (optional)",
      fields: [
        {
          type: "row",
          fields: [
            { name: "label", type: "text" },
            {
              name: "href",
              type: "text",
              validate: (v: unknown) => !v || /^(\/|https:\/\/)/.test(String(v)) || "Start with / or https://",
            },
          ],
        },
      ],
    },
    {
      name: "cards",
      type: "array",
      admin: { condition: (_, s) => !s?.source || s.source === "manual" },
      fields: [
        { name: "title", type: "text", required: true },
        { name: "text", type: "textarea" },
        { name: "image", type: "upload", relationTo: "media" },
        ...linkFields,
      ],
    },
  ],
};

export const CtaBlock: Block = {
  slug: "cta",
  labels: { singular: "Call to action", plural: "Calls to action" },
  fields: [
    anchor,
    { name: "heading", type: "text", required: true },
    { name: "text", type: "textarea" },
    {
      name: "tone",
      type: "select",
      defaultValue: "teal",
      options: [
        { label: "Teal band", value: "teal" },
        { label: "Sand band", value: "sand" },
      ],
    },
    { name: "buttons", type: "array", maxRows: 3, fields: linkFields },
  ],
};

export const FaqBlock: Block = {
  slug: "faq",
  labels: { singular: "FAQ", plural: "FAQs" },
  fields: [
    anchor,
    { ...heading, defaultValue: "Frequently asked questions" },
    {
      name: "items",
      type: "array",
      minRows: 1,
      fields: [
        { name: "question", type: "text", required: true },
        { name: "answer", type: "textarea", required: true },
      ],
    },
  ],
};

export const VideoBlock: Block = {
  slug: "video",
  labels: { singular: "YouTube video", plural: "YouTube videos" },
  fields: [
    anchor,
    heading,
    {
      type: "row",
      fields: [
        {
          name: "youtubeId",
          type: "text",
          required: true,
          admin: { description: "The 11-character id from the YouTube link" },
          validate: (v: unknown) => /^[\w-]{11}$/.test(String(v ?? "")) || "Paste the 11-character video id",
        },
        { name: "title", type: "text", required: true, admin: { description: "Used for screen readers" } },
      ],
    },
  ],
};

export const ImageBlock: Block = {
  slug: "image",
  labels: { singular: "Image", plural: "Images" },
  fields: [
    { name: "image", type: "upload", relationTo: "media", required: true },
    { name: "caption", type: "text" },
  ],
};

export const GalleryBlock: Block = {
  slug: "gallery",
  labels: { singular: "Photo gallery", plural: "Photo galleries" },
  fields: [anchor, heading, { name: "photos", type: "upload", relationTo: "media", hasMany: true, minRows: 1 }],
};

export const TeamBlock: Block = {
  slug: "team",
  labels: { singular: "Team profiles", plural: "Team profiles" },
  fields: [
    anchor,
    eyebrow,
    heading,
    {
      name: "people",
      type: "array",
      minRows: 1,
      fields: [
        {
          type: "row",
          fields: [
            { name: "name", type: "text", required: true },
            { name: "role", type: "text", admin: { description: "e.g. Broker / Partner / J.D." } },
          ],
        },
        { name: "photo", type: "upload", relationTo: "media" },
        { name: "bio", type: "textarea" },
        { name: "license", type: "text", admin: { description: "Shown as written, e.g. CA DRE Lic. # 01372898" } },
        {
          type: "row",
          fields: [
            { name: "phone", type: "text" },
            { name: "email", type: "email" },
          ],
        },
      ],
    },
  ],
};

export const TestimonialsBlock: Block = {
  slug: "testimonials",
  labels: { singular: "Testimonials", plural: "Testimonials" },
  fields: [
    anchor,
    eyebrow,
    { ...heading, defaultValue: "What clients say" },
    { name: "featuredOnly", type: "checkbox", defaultValue: false, admin: { description: "Only testimonials marked Featured" } },
    { name: "limit", type: "number", defaultValue: 6, min: 1, max: 24 },
  ],
};

export const layoutBlocks = [ProseBlock, StatsBlock, FeatureListBlock, CardGridBlock, CtaBlock, FaqBlock, VideoBlock, ImageBlock, GalleryBlock, TeamBlock, TestimonialsBlock];

export const layoutField = (): Field => ({
  name: "layout",
  type: "blocks",
  blocks: layoutBlocks,
  admin: { description: "Sections shown after the body text, in order. Leave the body empty to build the page from sections only." },
});
