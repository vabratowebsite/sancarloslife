import type { CollectionConfig } from "payload";

import { adminsOnly } from "../access/roles";
import { encryptSecret, isEncrypted } from "../lib/ai/crypto";

/**
 * AI providers the website can call itself (Generate draft, and the backup
 * runs when Claude's research run doesn't report). Admins only. API keys are
 * encrypted before they're saved and never sent to the browser; leave the key
 * empty when editing to keep the saved one.
 */
export const AiConnections: CollectionConfig = {
  slug: "ai-connections",
  labels: { singular: "AI connection", plural: "AI connections" },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "provider", "model", "enabled", "isDefault"],
    group: "Operations Desk",
    description: "Each call is billed by the provider to the account the key belongs to.",
  },
  access: { read: adminsOnly, create: adminsOnly, update: adminsOnly, delete: adminsOnly },
  fields: [
    { name: "name", type: "text", required: true, admin: { description: "e.g. Claude Sonnet (backup), OpenAI" } },
    {
      type: "row",
      fields: [
        {
          name: "provider",
          type: "select",
          required: true,
          options: [
            { label: "Anthropic (Claude API)", value: "anthropic" },
            { label: "OpenAI", value: "openai" },
            { label: "Google Gemini", value: "gemini" },
            { label: "OpenRouter", value: "openrouter" },
            { label: "Other OpenAI-compatible API", value: "openai-compatible" },
            { label: "Test AI (no calls, development only)", value: "mock" },
          ],
        },
        { name: "model", type: "text", required: true, admin: { description: "The provider's model id, exactly as they list it" } },
      ],
    },
    {
      name: "baseUrl",
      type: "text",
      admin: {
        description: "Only for 'Other OpenAI-compatible API' (https://…/v1). Leave empty for the others.",
        condition: (_, s) => s?.provider === "openai-compatible",
      },
      validate: (v: unknown) => !v || /^https:\/\/[^\s]+$/.test(String(v)) || "Use an https:// address",
    },
    {
      name: "apiKey",
      type: "text",
      admin: { description: "Paste the key. It's encrypted when saved and never shown again; leave empty to keep the saved key." },
      hooks: {
        beforeChange: [
          async ({ value, originalDoc, req }) => {
            if (typeof value === "string" && value.trim() && !isEncrypted(value)) return encryptSecret(value.trim());
            if (!originalDoc?.id) return null;
            // Empty means "keep the saved key". originalDoc has it masked, so read the stored value.
            const saved = await req.payload.findByID({ collection: "ai-connections", id: originalDoc.id, depth: 0, overrideAccess: true, context: { revealKey: true } });
            return saved.apiKey || null;
          },
        ],
        // Only server code that asks for it (context.revealKey) gets the stored value.
        afterRead: [({ value, context }) => (context?.revealKey ? value : "")],
      },
    },
    {
      name: "keyHint",
      type: "text",
      admin: { readOnly: true, description: "Last 4 characters of the saved key" },
      hooks: {
        beforeChange: [
          ({ siblingData, originalDoc }) => {
            const v = siblingData?.apiKey;
            return typeof v === "string" && v.trim() && !isEncrypted(v) ? `…${v.trim().slice(-4)}` : (originalDoc?.keyHint ?? null);
          },
        ],
      },
    },
    {
      type: "row",
      fields: [
        { name: "enabled", type: "checkbox", defaultValue: true },
        { name: "isDefault", type: "checkbox", label: "Default for Generate draft", defaultValue: false },
        { name: "useForBackup", type: "checkbox", label: "Use for backup runs", defaultValue: false },
      ],
    },
    { name: "maxOutputTokens", type: "number", defaultValue: 8000, min: 500, max: 64000 },
    { name: "notes", type: "textarea" },
  ],
};
