import type { CollectionConfig } from "payload";

import { adminsOnly, staffOnly } from "../access/roles";
import { FORMATS } from "../lib/ai/formats";

/**
 * The prompts library: one prompt per content format, used by every AI that
 * writes for the site (Claude research runs through the connector, Generate
 * draft, and the backup runs). The fields the AI must return are fixed in code
 * per format (src/lib/ai/formats.ts), so the site's templates always get what
 * they need; the prompt sets voice, structure, research and SEO/AEO/GEO rules.
 */
export const AiPrompts: CollectionConfig = {
  slug: "ai-prompts",
  labels: { singular: "AI prompt", plural: "AI prompts" },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "format", "active", "updatedAt"],
    group: "Operations Desk",
    description: "How the AI writes each kind of content. Every save is kept as a version.",
  },
  access: { read: staffOnly, create: staffOnly, update: staffOnly, delete: adminsOnly },
  versions: { maxPerDoc: 30 },
  fields: [
    { name: "name", type: "text", required: true },
    {
      type: "row",
      fields: [
        {
          name: "format",
          type: "select",
          required: true,
          options: Object.entries(FORMATS).map(([value, f]) => ({ label: f.label, value })),
          admin: { description: "Which template the result fills" },
        },
        { name: "active", type: "checkbox", defaultValue: true, admin: { description: "Offered in Generate draft" } },
      ],
    },
    { name: "instructions", type: "textarea", required: true, admin: { rows: 14, description: "What to write and how it's structured." } },
    { name: "rules", type: "textarea", admin: { rows: 12, description: "Voice, accuracy, sources, SEO / AEO / GEO, compliance." } },
    { name: "example", type: "textarea", admin: { rows: 10, description: "A good example to follow (optional)." } },
    { name: "notes", type: "textarea", admin: { description: "For editors; not sent to the AI." } },
  ],
};
