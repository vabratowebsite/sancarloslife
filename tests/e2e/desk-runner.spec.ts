import { expect, test, type APIRequestContext } from "@playwright/test";

import { FORMATS, type FormatKey } from "../../src/lib/ai/formats";

/**
 * The Operations Desk backup runner (/cron/desk/). The refusal checks always
 * run. The full round trip needs a local site with the Test AI as the default
 * AI connection, so it only runs with
 *   E2E_CRON_SECRET=<CRON_SECRET> E2E_ADMIN_EMAIL=… E2E_ADMIN_PASSWORD=… pnpm test:e2e
 * It never runs a real AI: the jobs it creates use a "mock" connection.
 */
const secret = process.env.E2E_CRON_SECRET;
const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;
const FORMAT_KEYS = Object.keys(FORMATS) as FormatKey[];

// Every cron call runs all due jobs, so these tests must not overlap.
test.describe.configure({ mode: "serial" });

test("refuses calls without the cron secret", async ({ request }) => {
  test.skip(test.info().project.name !== "desktop", "Runs once");
  const none = await request.get("/cron/desk");
  expect([401, 503]).toContain(none.status());
  expect([401, 503]).toContain((await request.get("/cron/desk", { headers: { Authorization: "Bearer wrong-secret" } })).status());
});

async function admin(request: APIRequestContext, baseURL: string) {
  const res = await request.post("/api/users/login", { data: { email, password }, headers: { Origin: baseURL } });
  const { token } = await res.json();
  return { Authorization: `JWT ${token}`, Origin: baseURL };
}

test("runs a job only when Claude's run is missing, once, and keeps sources public", async ({ request, baseURL }) => {
  test.skip(!secret || !email || !password, "Set E2E_CRON_SECRET, E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD (local site only)");
  test.skip(test.info().project.name !== "desktop", "Runs once");
  test.setTimeout(120_000);
  const headers = await admin(request, baseURL!);
  const cron = async () => (await (await request.get("/cron/desk", { headers: { Authorization: `Bearer ${secret}` } })).json()).results as { job: string; action: string; reason: string; draft?: { id: number } }[];
  const tag = Date.now().toString(36);
  const created: { collection: string; id: number | string }[] = [];
  const make = async (collection: string, data: object) => {
    const res = await request.post(`/api/${collection}`, { headers, data });
    const body = await res.json();
    expect(res.ok(), JSON.stringify(body.errors ?? body)).toBe(true);
    created.push({ collection, id: body.doc.id });
    return body.doc;
  };

  try {
    const conn = await make("ai-connections", { name: `e2e test ai ${tag}`, provider: "mock", model: "test", enabled: true, isDefault: false });
    const prompts = await (await request.get("/api/ai-prompts?where[format][equals]=blog&limit=1", { headers })).json();
    const prompt = prompts.docs[0]?.id;
    test.skip(!prompt, "Needs the seeded blog prompt (pnpm migrate:prompts)");
    const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", hourCycle: "h23" }).format(new Date(Date.now() - 2 * 3600e3)));
    const job = (name: string) => ({
      name,
      cadence: "daily",
      hour,
      graceHours: 1,
      backup: true,
      prompt,
      connection: conn.id,
      instructions: "Write a short post about San Carlos community news this week: the library reopening and the tree lighting on Laurel Street.",
    });

    const missing = await make("desk-jobs", job(`e2e-missing-${tag}`));
    const covered = await make("desk-jobs", job(`e2e-covered-${tag}`));
    await make("desk-runs", { job: covered.name, runner: "claude", status: "ok", startedAt: new Date().toISOString(), summary: "Claude ran" });

    const first = await cron();
    const ran = first.find((r) => r.job === missing.name);
    expect(ran?.action, ran?.reason).toBe("ran");
    expect(first.find((r) => r.job === covered.name)?.action).toBe("skipped");
    if (ran?.draft) created.push({ collection: "posts", id: ran.draft.id });

    const draft = await (await request.get(`/api/posts/${ran!.draft!.id}?draft=true&depth=0`, { headers })).json();
    expect(draft.review.state).toBe("in-review");
    expect(draft.review.source).toBe("website-ai");
    expect(draft._status).toBe("draft");

    const second = await cron();
    expect(second.find((r) => r.job === missing.name)).toMatchObject({ action: "skipped", reason: "already ran" });

    const bad = await request.post("/api/desk-jobs", { headers, data: { ...job(`e2e-bad-${tag}`), sources: [{ url: "https://169.254.169.254/latest/meta-data" }] } });
    expect(bad.status()).toBe(400);
  } finally {
    const runs = await (await request.get(`/api/desk-runs?where[job][contains]=${tag}&limit=50&depth=0`, { headers })).json();
    for (const r of runs.docs ?? []) await request.delete(`/api/desk-runs/${r.id}`, { headers });
    for (const c of created.reverse()) await request.delete(`/api/${c.collection}/${c.id}`, { headers });
  }
});

test("the website's backup AI drafts every format", async ({ request, baseURL }) => {
  test.skip(test.info().project.name !== "desktop", "Runs once");
  test.skip(!secret || !email || !password, "Set E2E_CRON_SECRET, E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD (local site only)");
  test.setTimeout(120_000);
  const login = await (await request.post("/api/users/login", { data: { email, password }, headers: { Origin: baseURL! } })).json();
  const headers = { Authorization: `JWT ${login.token}`, Origin: baseURL! };
  const tag = Date.now().toString(36);
  const made: { collection: string; id: number | string }[] = [];
  const make = async (collection: string, data: object) => {
    const res = await request.post(`/api/${collection}`, { headers, data });
    const body = await res.json();
    expect(res.ok(), JSON.stringify(body.errors ?? body)).toBe(true);
    made.push({ collection, id: body.doc.id });
    return body.doc;
  };
  try {
    const conn = await make("ai-connections", { name: `e2e test ai ${tag}`, provider: "mock", model: "test", enabled: true, isDefault: false });
    const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", hourCycle: "h23" }).format(new Date(Date.now() - 2 * 3600e3)));
    const jobs: Record<string, FormatKey> = {};
    for (const format of FORMAT_KEYS) {
      const prompts = await (await request.get(`/api/ai-prompts?where[format][equals]=${format}&limit=1&depth=0`, { headers })).json();
      const prompt = prompts.docs[0]?.id;
      expect(prompt, `seeded prompt for ${format} (pnpm migrate:prompts)`).toBeTruthy();
      const job = await make("desk-jobs", {
        name: `e2e-${format}-${tag}`,
        cadence: "daily",
        hour,
        graceHours: 1,
        backup: true,
        prompt,
        connection: conn.id,
        instructions: `Write about the San Carlos holiday tree lighting (${format}).`,
      });
      jobs[job.name] = format;
    }
    const results = (await (await request.get("/cron/desk", { headers: { Authorization: `Bearer ${secret}` } })).json()).results as { job: string; action: string; reason: string; draft?: { collection: string; id: number } }[];
    for (const [name, format] of Object.entries(jobs)) {
      const r = results.find((x) => x.job === name);
      expect(r?.action, `${format}: ${r?.reason}`).toBe("ran");
      expect(r!.draft!.collection).toBe(FORMATS[format].collection);
      made.push({ collection: r!.draft!.collection, id: r!.draft!.id });
    }
  } finally {
    const runs = await (await request.get(`/api/desk-runs?where[job][contains]=${tag}&limit=50&depth=0`, { headers })).json();
    for (const r of runs.docs ?? []) await request.delete(`/api/desk-runs/${r.id}`, { headers });
    for (const m of made.reverse()) await request.delete(`/api/${m.collection}/${m.id}`, { headers });
    for (const c of ["venues", "organizers"]) {
      const res = await (await request.get(`/api/${c}?where[name][contains]=(test)&limit=20&depth=0`, { headers })).json();
      for (const d of res.docs ?? []) await request.delete(`/api/${c}/${d.id}`, { headers });
    }
  }
});
