import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { fromPexels, illustrationPrompt, imagesInHtml, searchQuery, sourcePages } = await import("@/lib/media/suggest");

describe("photo suggestions", () => {
  it("finds source pages: website, links and review-note sources, skipping maps and social sites", () => {
    const pages = sourcePages({
      website: "https://www.thereadingbug.com/",
      links: [{ url: "https://www.instagram.com/readingbugbox" }, { url: "https://www.readingbugbox.com/" }],
      review: { note: "Sources:\n- https://goo.gl/maps/x\n- https://www.cityofsancarlos.org/news.php, checked\n- https://example.org/photo.jpg" },
    });
    expect(pages).toEqual(["https://www.thereadingbug.com/", "https://www.readingbugbox.com/", "https://www.cityofsancarlos.org/news.php"]);
  });

  it("reads og:image first, then large images, never SVGs, logos or tiny icons", () => {
    const html = `<html><head><meta property="og:title" content="Storytime"><meta property="og:image" content="/img/hero.jpg"></head><body>
      <img src="logo.png" width="800"><img src="https://cdn.example.org/icon.svg"><img src="small.jpg" width="120" height="120">
      <img srcset="a-400.jpg 400w, a-1600.jpg 1600w" alt="Kids at storytime" width="1600" height="1000">
      <img src="http://insecure.example.org/b.jpg" width="900"></body></html>`;
    const imgs = imagesInHtml(html, "https://shop.example.org/events/");
    expect(imgs).toEqual([
      { url: "https://shop.example.org/img/hero.jpg", alt: "Storytime" },
      { url: "https://shop.example.org/events/a-1600.jpg", alt: "Kids at storytime" },
    ]);
  });

  it("uses Pexels only with a key, and credits the photographer", async () => {
    delete process.env.PEXELS_API_KEY;
    expect(await fromPexels("bookstore")).toEqual([]);
    process.env.PEXELS_API_KEY = "test-key";
    const fake = vi.fn(async (_u: URL | RequestInfo, init?: RequestInit) => {
      expect((init?.headers as Record<string, string>).Authorization).toBe("test-key");
      return new Response(JSON.stringify({ photos: [{ url: "https://www.pexels.com/photo/1/", alt: "Books", photographer: "Ana", photographer_url: "x", src: { large2x: "https://images.pexels.com/1-large.jpg", medium: "https://images.pexels.com/1-m.jpg" } }] }));
    });
    const out = await fromPexels("bookstore", fake as unknown as typeof fetch);
    expect(out[0]).toMatchObject({ kind: "pexels", url: "https://images.pexels.com/1-large.jpg", credit: "Photo by Ana on Pexels", link: "https://www.pexels.com/photo/1/" });
    delete process.env.PEXELS_API_KEY;
  });

  it("searches stock photos by category, without the town name", () => {
    expect(searchQuery({ name: "The Reading Bug", guide: { categories: ["Bookstore", "Kids & family", "Events"] } })).toBe("Bookstore Kids & family");
    expect(searchQuery({ title: "Downtown San Carlos parking guide" })).toBe("Downtown parking guide");
  });

  it("asks the image model for generic illustrations only", () => {
    const p = illustrationPrompt("Saving water in the garden");
    expect(p).toContain("Saving water in the garden");
    expect(p).toMatch(/no real or recognizable people/);
    expect(p).toMatch(/no real buildings, landmarks/);
  });
});
