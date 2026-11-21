import type { GlobalConfig } from "payload";

import { adminsOnly, anyone } from "../access/roles";
import { revalidateGlobal } from "../hooks/revalidate";

const link = [
  { name: "label", type: "text", required: true },
  { name: "url", type: "text", required: true },
] as const;

export const Settings: GlobalConfig = {
  slug: "settings",
  admin: { group: "Admin" },
  access: { read: anyone, update: adminsOnly },
  hooks: { afterChange: [revalidateGlobal("settings")] },
  fields: [
    { name: "siteTitle", type: "text", defaultValue: "San Carlos Life", required: true },
    { name: "tagline", type: "text", defaultValue: "Your guide to life in San Carlos, California" },
    { name: "phone", type: "text" },
    { name: "email", type: "email" },
    { name: "address", type: "textarea" },
    {
      name: "social",
      type: "array",
      fields: [
        {
          name: "platform",
          type: "select",
          required: true,
          options: ["facebook", "instagram", "youtube", "linkedin", "x", "tiktok", "nextdoor"],
        },
        { name: "url", type: "text", required: true },
      ],
    },
    { name: "defaultOgImage", type: "upload", relationTo: "media", label: "Default social image" },
    {
      name: "sidebarCta",
      type: "group",
      label: "Viv & Mark sidebar card",
      fields: [
        { name: "heading", type: "text", defaultValue: "Thinking of buying or selling in San Carlos?" },
        { name: "text", type: "textarea" },
        { name: "photo", type: "upload", relationTo: "media" },
        { name: "phone", type: "text" },
        { name: "email", type: "email" },
        { name: "valuationLabel", type: "text", defaultValue: "What's my home worth?" },
        { name: "valuationUrl", type: "text", defaultValue: "/sell-my-house" },
      ],
    },
    {
      name: "footerColumns",
      type: "array",
      maxRows: 4,
      fields: [
        { name: "heading", type: "text", required: true },
        { name: "links", type: "array", fields: [...link] },
      ],
    },
    { name: "footerNote", type: "textarea", admin: { description: "Copyright line, brokerage disclosure." } },
  ],
};
