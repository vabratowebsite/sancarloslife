import { expect, test } from "@playwright/test";

/**
 * The on-page editor: edit mode needs a sign-in; a word change saves, shows to
 * the public, and Restore original takes it back. Needs a staff account:
 *   E2E_EDITOR_EMAIL=… E2E_EDITOR_PASSWORD=… pnpm test:e2e
 */
const email = process.env.E2E_EDITOR_EMAIL;
const password = process.env.E2E_EDITOR_PASSWORD;

// Payload keeps sign-in sessions on the user record; two logins of the same account at the
// same moment can overwrite each other, so these tests sign in one after another.
test.describe.configure({ mode: "serial" });

test("edit mode needs a sign-in", async ({ page }) => {
  await page.goto("/edit/?path=/about-san-carlos/");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("edit, save, see it public, restore original", async ({ page, browser }) => {
  test.skip(!email || !password, "Set E2E_EDITOR_EMAIL and E2E_EDITOR_PASSWORD to run");
  test.skip(test.info().project.name !== "desktop", "Runs once");
  await page.request.post("/api/users/login", { data: { email, password } });
  await page.goto("/edit/?path=/privacy-policy/");
  const bar = page.getByRole("region", { name: "Page editor" });
  await bar.getByRole("button", { name: "Edit text" }).click();
  const piece = page.locator(".prose [data-edit-key]").nth(2);
  const marker = `E2E edit ${Date.now()}`;
  await piece.evaluate((el, text) => {
    el.textContent = text;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, marker);
  await bar.getByRole("button", { name: "Save changes" }).click();
  await expect(bar.getByRole("status")).toContainText("Saved");

  const visitor = await browser.newPage();
  // Pages are cached; the save refreshes them, which can take a moment under load.
  await expect
    .poll(async () => (await visitor.goto("/privacy-policy/"), visitor.getByText(marker).count()), { timeout: 20_000 })
    .toBe(1);

  page.on("dialog", (d) => d.accept());
  await bar.getByRole("button", { name: "Versions" }).click();
  await bar.getByRole("button", { name: "Restore original" }).click();
  await expect(page.getByText(marker)).toHaveCount(0, { timeout: 20_000 });
  await expect.poll(async () => (await visitor.reload(), visitor.getByText(marker).count()), { timeout: 20_000 }).toBe(0);
  await page.goto("/edit/?exit=1&path=/");
});

test("tool pages: words are editable, the form is not", async ({ page, browser }) => {
  test.skip(!email || !password, "Set E2E_EDITOR_EMAIL and E2E_EDITOR_PASSWORD to run");
  test.skip(test.info().project.name !== "desktop", "Runs once");
  await page.request.post("/api/users/login", { data: { email, password } });
  await page.goto("/edit/?path=/sell-my-house/");
  const bar = page.getByRole("region", { name: "Page editor" });
  await bar.getByRole("button", { name: "Edit text" }).click();

  // Every marked piece of text is on the page; nothing inside the form is editable.
  await expect(page.locator('[data-edit-key="title"]')).toHaveCount(1);
  await expect(page.locator('[data-edit-key^="steps."]')).toHaveCount(7);
  await expect(page.locator("form [data-edit-key]")).toHaveCount(0);

  const heading = page.locator('[data-edit-key="steps.heading"]');
  const marker = `E2E steps ${Date.now()}`;
  await heading.evaluate((el, text) => {
    el.textContent = text;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, marker);
  await bar.getByRole("button", { name: "Save changes" }).click();
  await expect(bar.getByRole("status")).toContainText("Saved");

  const visitor = await browser.newPage();
  await expect.poll(async () => (await visitor.goto("/sell-my-house/"), visitor.getByText(marker).count()), { timeout: 20_000 }).toBe(1);
  // The valuation form still works for visitors.
  await expect(visitor.getByRole("button", { name: "Get my home's value" })).toBeVisible();

  page.on("dialog", (d) => d.accept());
  await bar.getByRole("button", { name: "Versions" }).click();
  await bar.getByRole("button", { name: "Restore original" }).click();
  await expect(page.getByText(marker)).toHaveCount(0, { timeout: 20_000 });
  await expect.poll(async () => (await visitor.reload(), visitor.getByText(marker).count()), { timeout: 20_000 }).toBe(0);
  await page.goto("/edit/?exit=1&path=/");
});

test("rebuilt WordPress pages: module words and photos are editable", async ({ page, browser }) => {
  test.skip(!email || !password, "Set E2E_EDITOR_EMAIL and E2E_EDITOR_PASSWORD to run");
  test.skip(test.info().project.name !== "desktop", "Runs once");
  await page.request.post("/api/users/login", { data: { email, password } });
  await page.goto("/edit/?path=/about-san-carlos/");
  const bar = page.getByRole("region", { name: "Page editor" });
  await bar.getByRole("button", { name: "Edit text" }).click();

  // Banner title, module text, counters and photos all carry edit markers.
  await expect(page.locator('[data-edit-key="banner.title"]')).toHaveCount(1);
  await expect(page.locator('[data-edit-key$=".number"]')).not.toHaveCount(0);
  await expect(page.locator("[data-edit-img]")).not.toHaveCount(0);

  const piece = page.locator('.divi-text [data-edit-key*=".h"]').first();
  const marker = `E2E divi ${Date.now()}`;
  await piece.evaluate((el, text) => {
    el.textContent = text;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, marker);
  await bar.getByRole("button", { name: "Save changes" }).click();
  await expect(bar.getByRole("status")).toContainText("Saved");

  const visitor = await browser.newPage();
  await expect.poll(async () => (await visitor.goto("/about-san-carlos/"), visitor.getByText(marker).count()), { timeout: 20_000 }).toBe(1);
  // Visitors never see edit markers.
  await expect(visitor.locator("[data-edit-key], [data-edit-img]")).toHaveCount(0);

  page.on("dialog", (d) => d.accept());
  await bar.getByRole("button", { name: "Versions" }).click();
  await bar.getByRole("button", { name: "Restore original" }).click();
  await expect(page.getByText(marker)).toHaveCount(0, { timeout: 20_000 });
  await page.goto("/edit/?exit=1&path=/");
});
