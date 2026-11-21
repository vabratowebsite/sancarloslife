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
