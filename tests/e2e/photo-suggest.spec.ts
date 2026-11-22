import { expect, test } from "@playwright/test";

/**
 * The approval queue's "Suggest photos" panel: finding candidates never attaches anything,
 * and an AI illustration (Test AI, so nothing is billed) lands on the draft, labelled.
 * Needs a staff account and a local site with a Test AI connection:
 *   E2E_EDITOR_EMAIL=… E2E_EDITOR_PASSWORD=… pnpm test:e2e tests/e2e/photo-suggest.spec.ts
 */
const email = process.env.E2E_EDITOR_EMAIL;
const password = process.env.E2E_EDITOR_PASSWORD;
const origin = process.env.BASE_URL || "http://localhost:3000";
// Payload only trusts the sign-in cookie on same-site browser requests.
const same = { Origin: origin, "Sec-Fetch-Site": "same-origin", "Sec-Fetch-Mode": "cors" };

test("suggest photos and generate an AI illustration for a draft post", async ({ page }) => {
  test.skip(!email || !password, "Set E2E_EDITOR_EMAIL and E2E_EDITOR_PASSWORD to run");
  test.skip(test.info().project.name !== "desktop", "Runs once");
  test.setTimeout(120_000);
  await page.request.post("/api/users/login", { data: { email, password } });
  const title = `E2E photo panel ${Date.now()}`;
  const created = await page.request.post("/api/posts?draft=true", {
    headers: same,
    data: { title, slug: title.toLowerCase().replace(/\W+/g, "-"), _status: "draft", review: { state: "in-review", source: "editor", note: "Sources: https://www.cityofsancarlos.org/" } },
  });
  expect(created.ok()).toBeTruthy();
  const id = (await created.json()).doc.id;

  try {
    await page.goto("/admin/desk");
    const item = page.locator("article", { hasText: title });
    await item.getByText("Suggest photos").click();
    await item.getByRole("button", { name: "Find photos" }).click();
    // Source pages are listed (the sandbox may not reach them); nothing is attached by looking.
    await expect(item.getByText(/Checked: https:\/\/www\.cityofsancarlos\.org\//)).toBeVisible({ timeout: 60_000 });
    let doc = await (await page.request.get(`/api/posts/${id}?draft=true&depth=0`, { headers: same })).json();
    expect(doc.cover ?? null).toBeNull();

    const ai = item.getByRole("group", { name: /AI illustration/ });
    await ai.getByLabel("Alt text").fill("Abstract teal shapes for a test article");
    await ai.getByRole("button", { name: /Generate with/ }).first().click();
    await expect(item.getByRole("status")).toContainText("Illustration set on the draft", { timeout: 60_000 });

    doc = await (await page.request.get(`/api/posts/${id}?draft=true&depth=1`, { headers: same })).json();
    expect(doc.cover?.credit).toBe("AI illustration");
    expect(doc.review.state).toBe("in-review");
    expect(doc._status).toBe("draft");
    expect(doc.review.note).toContain("AI illustration generated");
  } finally {
    if (!process.env.E2E_KEEP) await page.request.delete(`/api/posts/${id}`, { headers: same });
  }
});
