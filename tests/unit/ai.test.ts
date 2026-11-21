import { afterEach, describe, expect, it, vi } from "vitest";

import { decryptSecret, encryptSecret, isEncrypted } from "@/lib/ai/crypto";
import { extractJson, FORMATS, mockAnswer, toDraftData } from "@/lib/ai/formats";
import { textToLexical } from "@/lib/ai/lexical";
import { callAI } from "@/lib/ai/providers";

process.env.PAYLOAD_SECRET ||= "test-secret-test-secret-test-secret";

describe("AI key encryption", () => {
  it("round-trips and never stores the plain key", () => {
    const enc = encryptSecret("sk-live-abc123");
    expect(isEncrypted(enc)).toBe(true);
    expect(enc).not.toContain("abc123");
    expect(decryptSecret(enc)).toBe("sk-live-abc123");
    expect(encryptSecret("same")).not.toBe(encryptSecret("same")); // fresh IV each time
  });
  it("rejects tampered values", () => {
    const enc = encryptSecret("sk-live-abc123");
    expect(() => decryptSecret(enc.slice(0, -2) + (enc.endsWith("A") ? "BB" : "AA"))).toThrow();
  });
});

describe("AI answers", () => {
  it("pulls JSON out of fenced or chatty replies", () => {
    expect(extractJson('Here you go:\n```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(extractJson('Sure! {"a":{"b":2}} Hope that helps')).toEqual({ a: { b: 2 } });
    expect(() => extractJson("no json here")).toThrow();
  });
  it("the test AI's answers match both formats", () => {
    expect(FORMATS.blog.schema.safeParse(JSON.parse(mockAnswer("blog", "Farmers market\nnotes"))).success).toBe(true);
    expect(FORMATS["desk-page"].schema.safeParse(JSON.parse(mockAnswer("desk-page", "Parking\nnotes"))).success).toBe(true);
  });
  it("the test AI's answers match every format", () => {
    for (const f of Object.keys(FORMATS) as (keyof typeof FORMATS)[]) {
      const r = FORMATS[f].schema.safeParse(JSON.parse(mockAnswer(f, "Holiday tree lighting\nnotes")));
      expect(r.success, `${f}: ${r.success ? "" : JSON.stringify(r.error.issues)}`).toBe(true);
    }
  });
  it("turns an event answer into a staff-only draft with its venue and sources for the reviewer", () => {
    const out = FORMATS.event.schema.parse(JSON.parse(mockAnswer("event", "Tree lighting")));
    const d = toDraftData("event", out, { venueId: 4, organizerId: 9, eventCategoryId: 2 }) as unknown as Record<string, unknown> & { review: { note: string } };
    expect(d).toMatchObject({ status: "draft", venue: 4, organizer: 9, categories: [2], timezone: "America/Los_Angeles" });
    expect(d.review.note).toContain("https://www.cityofsancarlos.org/");
    expect(Number.isNaN(Date.parse(String(d.startsAt)))).toBe(false);
  });
  it("rejects events without a time zone and places with unknown types", () => {
    const ev = JSON.parse(mockAnswer("event", "x"));
    expect(FORMATS.event.schema.safeParse({ ...ev, startsAt: "2026-12-05 17:00" }).success).toBe(false);
    const pl = JSON.parse(mockAnswer("place", "x"));
    expect(FORMATS.place.schema.safeParse({ ...pl, type: "casino" }).success).toBe(false);
    expect(FORMATS.place.schema.safeParse({ ...pl, website: "javascript:alert(1)" }).success).toBe(false);
  });
  it("keeps a city project's sources on the page with their dates", () => {
    const out = FORMATS["city-project"].schema.parse(JSON.parse(mockAnswer("city-project", "Library expansion")));
    const d = toDraftData("city-project", out) as unknown as { sources: { title: string; url: string; publishedAt?: string }[]; status: string; _status: string };
    expect(d._status).toBe("draft");
    expect(d.status).toBe("planning");
    expect(d.sources[0]).toMatchObject({ url: "https://www.cityofsancarlos.org/" });
    expect(d.sources[0].publishedAt).toMatch(/^2026-11-01/);
  });
  it("turns a blog answer into a draft in review with rich text", () => {
    const out = FORMATS.blog.schema.parse(JSON.parse(mockAnswer("blog", "Farmers market")));
    const d = toDraftData("blog", out, { categoryId: 3 }) as unknown as { _status: string; review: { state: string; source: string }; categories: number[] };
    expect(d).toMatchObject({ _status: "draft", review: { state: "in-review", source: "website-ai" }, categories: [3] });
  });
});

describe("text to rich text", () => {
  it("makes headings, paragraphs and lists", () => {
    const types = textToLexical("## Title\nFirst para.\n\n- one\n- two\n### Sub\nEnd.").root.children.map((c) => `${c.type}${"tag" in c ? `:${c.tag}` : ""}`);
    expect(types).toEqual(["heading:h2", "paragraph", "list:ul", "heading:h3", "paragraph"]);
  });
});

describe("provider calls", () => {
  afterEach(() => vi.unstubAllGlobals());
  const ok = (body: unknown) => vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }));

  it("calls Anthropic's Messages API with the key in x-api-key", async () => {
    const f = ok({ content: [{ type: "text", text: '{"x":1}' }], usage: { input_tokens: 10, output_tokens: 5 } });
    vi.stubGlobal("fetch", f);
    const r = await callAI({ provider: "anthropic", model: "claude-x", apiKey: "k1" }, "sys", "user");
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    expect((init.headers as Record<string, string>)["x-api-key"]).toBe("k1");
    expect(JSON.parse(String(init.body))).toMatchObject({ model: "claude-x", system: "sys", messages: [{ role: "user", content: "user" }] });
    expect(r).toEqual({ text: '{"x":1}', inputTokens: 10, outputTokens: 5 });
  });

  it("calls OpenAI-style APIs (Gemini base URL) with a bearer key and JSON mode", async () => {
    const f = ok({ choices: [{ message: { content: '{"y":2}' } }] });
    vi.stubGlobal("fetch", f);
    const r = await callAI({ provider: "gemini", model: "gemini-x", apiKey: "k2" }, "sys", "user");
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer k2");
    expect(JSON.parse(String(init.body)).response_format).toEqual({ type: "json_object" });
    expect(r.text).toBe('{"y":2}');
  });

  it("reports provider errors without leaking the key", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: { message: "Invalid API key" } }), { status: 401 })));
    await expect(callAI({ provider: "openai", model: "m", apiKey: "sk-secret" }, "s", "u")).rejects.toThrow(/401: Invalid API key/);
    await expect(callAI({ provider: "openai", model: "m", apiKey: "sk-secret" }, "s", "u")).rejects.not.toThrow(/sk-secret/);
  });

  it("refuses a non-https custom base URL", async () => {
    await expect(callAI({ provider: "openai-compatible", model: "m", apiKey: "k", baseUrl: "http://10.0.0.1/v1" }, "s", "u")).rejects.toThrow(/https/);
  });
});
