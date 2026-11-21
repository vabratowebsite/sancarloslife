/**
 * Plain text (with "## " / "### " headings and "- " bullets) to Payload's
 * Lexical rich text, so AI output becomes normal editable text in the admin.
 */
type Node = Record<string, unknown>;

const textNode = (text: string): Node => ({ type: "text", text, format: 0, mode: "normal", style: "", detail: 0, version: 1 });
const block = (type: string, children: Node[], extra: Node = {}): Node => ({
  type,
  children,
  direction: "ltr",
  format: "",
  indent: 0,
  version: 1,
  ...extra,
});

export function textToLexical(text: string) {
  const children: Node[] = [];
  let list: Node[] = [];
  const flush = () => {
    if (list.length) children.push(block("list", list, { listType: "bullet", start: 1, tag: "ul" }));
    list = [];
  };
  for (const raw of text.replace(/\r/g, "").split(/\n+/)) {
    const line = raw.trim();
    if (!line) continue;
    const h = line.match(/^(#{2,3})\s+(.*)$/);
    const li = line.match(/^[-*]\s+(.*)$/);
    if (li) {
      list.push(block("listitem", [textNode(li[1])], { value: list.length + 1 }));
      continue;
    }
    flush();
    if (h) children.push(block("heading", [textNode(h[2])], { tag: h[1].length === 2 ? "h2" : "h3" }));
    else children.push(block("paragraph", [textNode(line)], { textFormat: 0, textStyle: "" }));
  }
  flush();
  return { root: { type: "root", format: "", indent: 0, version: 1, direction: "ltr", children } };
}

/** Rich text back to plain text in the same notation (for AI re-editing). */
export function lexicalToText(doc: unknown): string {
  const out: string[] = [];
  const text = (n: unknown): string => {
    const node = n as { text?: string; children?: unknown[]; fields?: { html?: string } };
    if (typeof node?.text === "string") return node.text;
    if (node?.fields?.html) return node.fields.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return (node?.children ?? []).map(text).join("");
  };
  const walk = (n: unknown) => {
    const node = n as { type?: string; tag?: string; children?: unknown[] };
    switch (node?.type) {
      case "heading":
        out.push(`${node.tag === "h3" ? "###" : "##"} ${text(node)}`);
        return;
      case "paragraph":
      case "quote":
        if (text(node).trim()) out.push(text(node).trim());
        return;
      case "list":
        out.push((node.children ?? []).map((li) => `- ${text(li).trim()}`).join("\n"));
        return;
      case "block":
        out.push(text(node));
        return;
      default:
        (node?.children ?? []).forEach(walk);
    }
  };
  walk((doc as { root?: unknown })?.root);
  return out.join("\n\n");
}
