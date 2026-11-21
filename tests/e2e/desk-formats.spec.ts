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

// A test JPEG from sharp's public test fixtures (GitHub is reachable from CI and sandboxes); override with E2E_PHOTO_URL.
const PHOTO_URL = process.env.E2E_PHOTO_URL ?? "https://raw.githubusercontent.com/lovell/sharp/main/test/fixtures/2569067123_aca715a2ee_o.jpg";

test("Claude can attach a photo by URL; unsafe addresses are refused", async ({ request }) => {
  test.skip(!apiKey, "Set E2E_API_KEY to a staff user's API key");
  test.setTimeout(90_000);
  const tag = Date.now().toString(36);
  const headers = { Authorization: `users API-Key ${apiKey}` };
  const media: (number | string)[] = [];
  let placeId: number | string | undefined;
  try {
    const sub = await mcp(request, "submit_draft", { format: "place", data: JSON.parse(mockAnswer("place", `E2E photo ${tag}`)) });
    expect(sub.isError, sub.text).toBe(false);
    placeId = sub.data.id as number;
    expect(sub.data.problems as string[]).toContain("Add a cover photo.");

    const cover = await mcp(request, "attach_photo", { collection: "places", id: placeId, imageUrl: PHOTO_URL, alt: "Edgewood Park trail in spring", credit: "Photo: San Carlos Life" });
    expect(cover.isError, cover.text).toBe(false);
    media.push((cover.data.media as { id: number }).id);
    expect(cover.data.field).toBe("cover");
    expect(cover.data.problems as string[]).not.toContain("Add a cover photo.");
    expect(cover.data.passesFormatCheck).toBe(true);

    const gallery = await mcp(request, "attach_photo", { collection: "places", id: placeId, imageUrl: PHOTO_URL, alt: "Edgewood Park trail, second view", credit: "Photo: San Carlos Life", role: "gallery" });
    expect(gallery.isError, gallery.text).toBe(false);
    media.push((gallery.data.media as { id: number }).id);

    // The draft kept its text and now has both photos; the stored file is a re-encoded JPEG with alt and credit.
    const draft = await (await request.get(`/api/places/${placeId}?draft=true&depth=1`, { headers })).json();
    expect(draft.name).toContain(`E2E photo ${tag}`);
    expect(draft.cover.alt).toBe("Edgewood Park trail in spring");
    expect(draft.cover.credit).toBe("Photo: San Carlos Life");
    expect(draft.cover.mimeType).toBe("image/jpeg");
    expect(draft.gallery).toHaveLength(1);
    expect(draft.review.note).toContain(PHOTO_URL);

    for (const [imageUrl, why] of [
      ["http://sancarloslife.com/wp-content/uploads/2022/04/Edgewood1.jpg", "https"],
      ["https://localhost/x.jpg", "Private"],
      ["https://169.254.169.254/latest/meta-data", "Private"],
      ["https://raw.githubusercontent.com/lovell/sharp/main/README.md", "not a JPEG"],
      ["https://raw.githubusercontent.com/lovell/sharp/main/test/fixtures/check.svg", "not a JPEG"],
    ]) {
      const r = await mcp(request, "attach_photo", { collection: "places", id: placeId, imageUrl, alt: "Should not work", credit: "Test" });
      expect(r.isError, imageUrl).toBe(true);
      expect(r.text, imageUrl).toContain(why);
    }
    const wrongRole = await mcp(request, "attach_photo", { collection: "posts", id: placeId, imageUrl: PHOTO_URL, alt: "Should not work", credit: "Test", role: "gallery" });
    expect(wrongRole.isError).toBe(true);
  } finally {
    if (placeId) await request.delete(`/api/places/${placeId}`, { headers });
    for (const id of media) await request.delete(`/api/media/${id}`, { headers });
  }
});
