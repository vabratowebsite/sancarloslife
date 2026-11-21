import { BlocksFeature, lexicalEditor } from "@payloadcms/richtext-lexical";
import type { Block, Field } from "payload";

/**
 * Raw HTML carried over from WordPress. Rendered through the sanitizer
 * (src/lib/sanitize.ts), never as-is.
 */
export const RawHtmlBlock: Block = {
  slug: "rawHtml",
  labels: { singular: "HTML", plural: "HTML" },
  fields: [
    {
      name: "html",
      type: "code",
      required: true,
      admin: { language: "html" },
    },
  ],
};

export const richTextEditor = lexicalEditor({
  features: ({ defaultFeatures }) => [...defaultFeatures, BlocksFeature({ blocks: [RawHtmlBlock] })],
});

export const bodyField = (name = "body", label = "Body"): Field => ({
  name,
  label,
  type: "richText",
  editor: richTextEditor,
});
