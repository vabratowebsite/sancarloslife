import { describe, expect, it } from "vitest";

import { checkFormat } from "@/lib/desk/format";

const lex = (text: string) => ({ root: { children: [{ type: "paragraph", children: [{ type: "text", text }] }] } });
const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(" ");

describe("desk format check", () => {
  it("lists every problem with a desk page that is too thin", () => {
    const r = checkFormat("desk-pages", { title: "Lights", summary: "Short", sections: [{ heading: "", body: lex("few words") }], sources: [{ label: "x", url: "nope" }] });
    expect(r.ok).toBe(false);
    expect(r.problems.join(" ")).toMatch(/quick answer/);
    expect(r.problems.join(" ")).toMatch(/at least 2 sections/);
    expect(r.problems.join(" ")).toMatch(/3 FAQs/);
    expect(r.problems.join(" ")).toMatch(/Source 1 needs a full link/);
    expect(r.problems.join(" ")).toMatch(/call to action/);
  });

  it("passes a complete desk page", () => {
    const r = checkFormat("desk-pages", {
      title: "Holiday Lights in San Carlos",
      summary: "Where to see holiday lights in San Carlos this year, with dates, streets and parking tips.",
      sections: [
        { heading: "Streets", body: lex(words(25)) },
        { heading: "Downtown", body: lex(words(25)) },
      ],
      faq: [1, 2, 3].map((i) => ({ question: `Q${i}?`, answer: "A." })),
      sources: [{ label: "City", url: "https://www.cityofsancarlos.org/" }],
      cta: { heading: "Subscribe", buttonLabel: "Subscribe", buttonHref: "/subscribe/" },
      seo: { title: "Holiday Lights in San Carlos 2026", description: "Where to see holiday lights in San Carlos in 2026, with streets, dates and tips." },
    });
    expect(r).toMatchObject({ ok: true, problems: [] });
  });

  it("holds blog posts to 300 words, a cover, a summary and a category", () => {
    const r = checkFormat("posts", { title: "T", body: lex(words(120)) });
    expect(r.problems).toEqual(expect.arrayContaining([expect.stringMatching(/300/), expect.stringMatching(/cover/), expect.stringMatching(/summary/), expect.stringMatching(/category/)]));
  });
});
