import { describe, expect, it } from "vitest";

import { extractText } from "@/lib/desk/fetchSource";
import { backupDue, lastScheduled, zonedTime } from "@/lib/desk/schedule";
import { checkUrl, isPrivateAddress } from "@/lib/desk/urlCheck";

const iso = (ms: number) => new Date(ms).toISOString();

describe("desk schedules (San Carlos time)", () => {
  it("converts wall-clock times across daylight saving", () => {
    expect(iso(zonedTime(2026, 7, 1, 6))).toBe("2026-07-01T13:00:00.000Z"); // PDT
    expect(iso(zonedTime(2026, 12, 1, 6))).toBe("2026-12-01T14:00:00.000Z"); // PST
    expect(iso(zonedTime(2026, 11, 1, 6))).toBe("2026-11-01T14:00:00.000Z"); // fall-back day
    expect(iso(zonedTime(2026, 3, 8, 6))).toBe("2026-03-08T13:00:00.000Z"); // spring-forward day
  });

  it("finds the last daily run", () => {
    const now = Date.parse("2026-11-22T15:30:00Z"); // 07:30 PST Sunday
    expect(iso(lastScheduled({ cadence: "daily", hour: 6 }, now))).toBe("2026-11-22T14:00:00.000Z");
    expect(iso(lastScheduled({ cadence: "daily", hour: 9 }, now))).toBe("2026-11-21T17:00:00.000Z");
  });

  it("skips weekends for weekday jobs and finds the right weekday for weekly jobs", () => {
    const sunday = Date.parse("2026-11-22T20:00:00Z");
    expect(iso(lastScheduled({ cadence: "weekdays", hour: 6 }, sunday))).toBe("2026-11-20T14:00:00.000Z"); // Friday
    expect(iso(lastScheduled({ cadence: "weekly", weekday: 3, hour: 8 }, sunday))).toBe("2026-11-18T16:00:00.000Z"); // Wednesday
  });

  it("is due only after the grace period and only if nobody ran", () => {
    const job = { cadence: "daily" as const, hour: 6, graceHours: 3 };
    const at = Date.parse("2026-11-22T14:00:00Z");
    expect(backupDue(job, at + 2 * 3600e3, null)).toMatchObject({ due: false, reason: "waiting for Claude" });
    expect(backupDue(job, at + 4 * 3600e3, null)).toMatchObject({ due: true });
    expect(backupDue(job, at + 4 * 3600e3, at + 600e3)).toMatchObject({ due: false, reason: "already ran" });
    // A run that started a little early still counts.
    expect(backupDue(job, at + 4 * 3600e3, at - 30 * 60e3)).toMatchObject({ due: false });
    // Yesterday's run doesn't.
    expect(backupDue(job, at + 4 * 3600e3, at - 20 * 3600e3)).toMatchObject({ due: true });
  });
});

describe("source addresses", () => {
  it("refuses private and internal addresses", () => {
    for (const ip of ["127.0.0.1", "10.1.2.3", "172.20.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fd00::1", "fe80::1", "::ffff:127.0.0.1"]) {
      expect(isPrivateAddress(ip), ip).toBe(true);
    }
    for (const ip of ["8.8.8.8", "151.101.1.69", "2606:4700::1111"]) expect(isPrivateAddress(ip), ip).toBe(false);
  });

  it("accepts only public https addresses", () => {
    expect(checkUrl("https://www.cityofsancarlos.org/news").hostname).toBe("www.cityofsancarlos.org");
    for (const bad of [
      "http://example.com/",
      "https://localhost/",
      "https://127.0.0.1/",
      "https://2130706433/", // 127.0.0.1 in decimal
      "https://[::1]/",
      "https://169.254.169.254/latest/meta-data",
      "https://example.com:8443/",
      "https://user:pw@example.com/",
      "https://printer.local/",
      "file:///etc/passwd",
      "not a url",
    ]) {
      expect(() => checkUrl(bad), bad).toThrow();
    }
  });
});

describe("source text", () => {
  it("reads RSS items as plain text", () => {
    const rss = `<?xml version="1.0"?><rss><channel><title>City News</title>
      <item><title>Library reopens</title><link>https://example.org/a</link><pubDate>Fri, 20 Nov 2026 10:00:00 GMT</pubDate>
      <description>&lt;p&gt;The &lt;b&gt;library&lt;/b&gt; reopens Monday.&lt;/p&gt;&lt;script&gt;alert(1)&lt;/script&gt;</description></item>
      <item><title>Council agenda</title><link>https://example.org/b</link></item></channel></rss>`;
    const r = extractText(rss, "application/rss+xml", "https://example.org/feed");
    expect(r.title).toBe("City News");
    expect(r.items).toBe(2);
    expect(r.text).toContain("Library reopens");
    expect(r.text).toContain("The library reopens Monday.");
    expect(r.text).not.toContain("<");
    expect(r.text).not.toContain("alert");
  });

  it("reads a page's main text without scripts or navigation", () => {
    const html = `<html><head><title>Events</title><script>var x=1</script></head><body><nav>Menu</nav><main><h1>Holiday Parade</h1><p>Saturday on Laurel Street.</p></main><footer>©</footer></body></html>`;
    const r = extractText(html, "text/html", "https://example.org/");
    expect(r.title).toBe("Events");
    expect(r.text).toBe("Holiday Parade Saturday on Laurel Street.");
  });
});
