import { describe, expect, it } from "vitest";

import { cleanWordPressHtml, sanitize } from "@/lib/sanitize";

describe("sanitize", () => {
  it("removes scripts, event handlers and javascript: links", () => {
    const out = sanitize(`<p onclick="x()">Hi<script>alert(1)</script><a href="javascript:alert(1)">x</a></p>`);
    expect(out).not.toMatch(/script|onclick|javascript:/i);
    expect(out).toContain("Hi");
  });

  it("keeps YouTube iframes and drops unknown ones", () => {
    const out = sanitize(
      `<iframe src="https://www.youtube.com/embed/abc"></iframe><iframe src="https://evil.example/x"></iframe>`,
    );
    expect(out).toContain("youtube.com/embed/abc");
    expect(out).not.toContain("evil.example");
  });

  it("opens external links safely and leaves internal links alone", () => {
    const out = sanitize(`<a href="https://example.com">e</a><a href="https://sancarloslife.com/events/">i</a>`);
    expect(out).toContain('rel="noopener noreferrer"');
    expect(out.match(/target="_blank"/g)?.length).toBe(1);
  });
});

describe("cleanWordPressHtml", () => {
  it("unwraps Divi wrappers, strips shortcodes and keeps the text", () => {
    const html = `<div class="et_pb_section_0 et_pb_section"><div class="et_pb_row"><div class="et_pb_text_inner"><p>Hello [et_pb_button url="x"]world</p></div></div></div>`;
    expect(cleanWordPressHtml(html)).toBe("<p>Hello world</p>");
  });

  it("turns centered inline styles into a class", () => {
    expect(cleanWordPressHtml(`<h3 style="text-align: center;">Sold</h3>`)).toBe('<h3 class="align-center">Sold</h3>');
  });
});
