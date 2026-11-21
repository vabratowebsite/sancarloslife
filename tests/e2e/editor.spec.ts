import { expect, test } from "@playwright/test";

/**
 * The on-page editor: edit mode needs a sign-in; a word change saves, shows to
 * the public, and Restore original takes it back. Needs a staff account:
 *   E2E_EDITOR_EMAIL=… E2E_EDITOR_PASSWORD=… pnpm test:e2e
 */
const email = process.env.E2E_EDITOR_EMAIL;
const password = process.env.E2E_EDITOR_PASSWORD;

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
  await visitor.goto("/privacy-policy/");
  await expect(visitor.getByText(marker)).toBeVisible();

  page.on("dialog", (d) => d.accept());
  await bar.getByRole("button", { name: "Versions" }).click();
  await bar.getByRole("button", { name: "Restore original" }).click();
  await expect(page.getByText(marker)).toHaveCount(0);
  await visitor.reload();
  await expect(visitor.getByText(marker)).toHaveCount(0);
  await page.goto("/edit/?exit=1&path=/");
});
