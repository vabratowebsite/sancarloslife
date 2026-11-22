import { expect, test } from "@playwright/test";

import { seriousViolations } from "./axe";

/** One page of each template. Every one must load, have one h1, no overflow and no serious axe issues. */
const PAGES = [
  "/",
  "/events/",
  "/events/month/",
  "/san-carlos-life-blog/",
  "/about-san-carlos/",
  "/explore-the-city/",
  "/one-of-the-best-realtor-teams-in-san-carlos-ca/",
  "/privacy-policy/",
  "/hometown-days/",
  "/site-map/",
  "/city-projects/",
  "/san-carlos-centennial-2025-celebrating-100-years/",
  "/san-carlos-ca-real-estate-market-trends/",
  "/howard-park/",
  "/restaurants-and-services/all-restaurants/",
  "/parks-of-san-carlos/",
  "/history-of-san-carlos/",
  // The other pages rebuilt from their WordPress layouts.
  "/living-in-san-carlos-ca-the-complete-guide/",
  "/restaurants-and-services/",
  "/attractions/",
  "/events-and-activities/",
  "/alder-manor/",
  "/videos-of-san-carlos-ca/",
  "/contact-us/",
  "/subscribe/",
  "/events/submit/",
  "/sell-my-house/",
  "/how-much-house-can-i-afford-mortgage-calculator/",
  "/homes-for-sale-in-san-carlos-ca/",
  "/search/?q=italian",
  // One document of each kind (from the migrated content).
  "/boots-blue-jeans-bbq-returns-to-san-carlos/",
  "/event/poinsettia-in-pastels-holiday/",
  "/restaurant/888-ristorante-italiano/",
  "/store/the-reading-bug/",
];

for (const path of PAGES) {
  test(`renders ${path}`, async ({ page }) => {
    const res = await page.goto(path, { waitUntil: "load" });
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    expect(await seriousViolations(page)).toEqual([]);
  });
}

test("old WordPress URLs redirect in one hop", async ({ request }) => {
  for (const [from, to] of [
    ["/all-restaurants/", "/restaurants-and-services/all-restaurants/"],
    ["/restaurant/", "/restaurants-and-services/all-restaurants/"],
    ["/cookie-consent/", "/cookie-policy/"],
  ]) {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status(), from).toBe(301);
    expect(new URL(res.headers().location!, "http://x").pathname, from).toBe(to);
  }
});

test("pages get a trailing slash; unknown pages are 404 with search", async ({ page, request }) => {
  const res = await request.get("/events", { maxRedirects: 0 });
  expect(res.status()).toBe(308);
  expect(res.headers().location).toMatch(/\/events\/$/);
  const nf = await page.goto("/this-page-does-not-exist/");
  expect(nf?.status()).toBe(404);
  await expect(page.getByRole("search")).toBeVisible();
});

test("public pages send security headers", async ({ request }) => {
  const h = (await request.get("/")).headers();
  expect(h["content-security-policy"]).toContain("frame-ancestors 'self'");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-powered-by"]).toBeUndefined();
});

test("robots, sitemap and feed", async ({ request }) => {
  expect((await request.get("/robots.txt")).status()).toBe(200);
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect((await sitemap.text()).match(/<url>/g)!.length).toBeGreaterThan(500);
  const feed = await request.get("/feed/");
  expect(feed.headers()["content-type"]).toContain("rss");
});

test("Sell My House shows errors, then accepts a valid request", async ({ page }) => {
  test.skip(!!process.env.BASE_URL && !process.env.E2E_SUBMIT, "Only submits against local or when E2E_SUBMIT is set");
  await page.goto("/sell-my-house/");
  // Let the form hydrate so validation runs in the browser.
  await page.waitForTimeout(2500);
  const submit = page.getByRole("button", { name: "Get my home's value" });
  await submit.click();
  await expect(page.locator("[aria-invalid=true]").first()).toBeVisible();
  await page.getByLabel("Street address in San Carlos").fill("100 E2E Test Street");
  await page.getByLabel("Name").fill("E2E Test");
  await page.getByLabel("Email").fill("e2e@example.com");
  // Turnstile's test key passes after a moment.
  await page.waitForTimeout(2500);
  await submit.click();
  await expect(page.getByText("Viv or Mark will look at recent sales")).toBeVisible({ timeout: 15_000 });
});

test("mortgage calculator updates as you type", async ({ page }) => {
  await page.goto("/how-much-house-can-i-afford-mortgage-calculator/");
  await page.getByLabel("Home price").fill("1,000,000");
  await page.getByLabel("Down payment").fill("20");
  await page.getByLabel("Interest rate").fill("6");
  await page.getByLabel("Property tax").fill("0");
  await page.getByLabel("Home insurance").fill("0");
  // $800,000 at 6% for 30 years: $4,796 a month.
  await expect(page.getByText("$4,796").first()).toBeVisible();
});
