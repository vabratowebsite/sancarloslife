import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import { RichText as LexicalRichText, type JSXConvertersFunction } from "@payloadcms/richtext-lexical/react";

import { sanitize } from "@/lib/sanitize";

const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  blocks: {
    // WordPress HTML carried over by the migration, always sanitized.
    rawHtml: ({ node }: { node: { fields: unknown } }) => (
      <div dangerouslySetInnerHTML={{ __html: sanitize(String((node.fields as { html?: string }).html ?? "")) }} />
    ),
  },
});

/** Renders a Payload rich-text field with the site's prose styles. */
export function RichText({ data, className = "" }: { data: unknown; className?: string }) {
  if (!data || typeof data !== "object") return null;
  return (
    <LexicalRichText
      data={data as SerializedEditorState}
      converters={converters}
      className={`prose ${className}`}
    />
  );
}
