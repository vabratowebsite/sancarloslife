import { expect, test, type APIRequestContext } from "@playwright/test";

import { FORMATS, mockAnswer, type FormatKey } from "../../src/lib/ai/formats";

/**
 * Every desk format end to end, with the Test AI only (no AI spending):
 *  1. Claude's path: get_prompt → submit_draft through the connector (needs E2E_API_KEY, a staff API key).
 *  2. The website's path is in desk-runner.spec.ts ("drafts every format"), which runs its
 *     cron calls one after another.
 * Everything created is deleted afterwards.
 */
const apiKey = process.env.E2E_API_KEY;
const FORMAT_KEYS = Object.keys(FORMATS) as FormatKey[];

test.beforeEach(() => {
  test.skip(test.info().project.name !== "desktop", "Runs once");
});

async function mcp(request: APIRequestContext, name: string, args: object) {
  const res = await request.post("/mcp", {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json, text/event-stream" },
    data: { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } },
  });
  const body = await res.json();
  return { isError: body.result?.isError as boolean, data: body.result?.structuredContent as Record<string, unknown>, text: body.result?.content?.[0]?.text as string };
}

test("Claude can submit every format through the connector", async ({ request }) => {
  test.skip(!apiKey, "Set E2E_API_KEY to a staff user's API key");
  const tag = Date.now().toString(36);
  const made: { collection: string; id: number | string }[] = [];
  try {
    for (const format of FORMAT_KEYS) {
      const p = await mcp(request, "get_prompt", { format });
      expect(p.isError, p.text).toBe(false);
      expect(p.data.shape).toBeTruthy();
      const data = JSON.parse(mockAnswer(format, `E2E ${format} ${tag}`));
      const r = await mcp(request, "submit_draft", { format, data, note: "e2e" });
      expect(r.isError, `${format}: ${r.text}`).toBe(false);
      expect(r.data.collection).toBe(FORMATS[format].collection);
      made.push({ collection: String(r.data.collection), id: r.data.id as number });

      const item = await mcp(request, "get_item", { collection: r.data.collection, id: r.data.id });
      expect(item.isError, item.text).toBe(false);
      expect(JSON.stringify(item.data)).toContain("in-review");
    }
    // A bad shape is refused with the reason.
    const bad = await mcp(request, "submit_draft", { format: "event", data: { title: "No date" } });
    expect(bad.isError).toBe(true);
    expect(bad.text).toContain("startsAt");

    // An unpublished event can be revised; the revision keeps it a staff-only draft.
    const ev = made.find((m) => m.collection === "events")!;
    const rev = await mcp(request, "update_draft", { collection: "events", id: ev.id, data: JSON.parse(mockAnswer("event", `E2E revised ${tag}`)) });
    expect(rev.isError, rev.text).toBe(false);
  } finally {
    const headers = { Authorization: `users API-Key ${apiKey}` };
    for (const m of made) await request.delete(`/api/${m.collection}/${m.id}`, { headers });
    for (const c of ["venues", "organizers"]) {
      const res = await (await request.get(`/api/${c}?where[name][contains]=(test)&limit=20&depth=0`, { headers })).json();
      for (const d of res.docs ?? []) await request.delete(`/api/${c}/${d.id}`, { headers });
    }
  }
});
