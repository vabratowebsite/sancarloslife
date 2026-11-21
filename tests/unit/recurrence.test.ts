import { describe, expect, it } from "vitest";

import { laDateKey, laParts, occurrences } from "@/lib/events/recurrence";

const range = (a: string, b: string) => [new Date(a), new Date(b)] as const;

describe("occurrences", () => {
  it("returns a one-off event only when it overlaps the window", () => {
    const e = { startsAt: "2026-12-05T18:00:00Z", endsAt: "2026-12-05T20:00:00Z" };
    expect(occurrences(e, ...range("2026-12-01T00:00:00Z", "2026-12-31T00:00:00Z"))).toHaveLength(1);
    expect(occurrences(e, ...range("2027-01-01T00:00:00Z", "2027-02-01T00:00:00Z"))).toHaveLength(0);
  });

  it("includes a multi-day event that is already under way", () => {
    const e = { startsAt: "2026-11-20T17:00:00Z", endsAt: "2026-11-23T02:00:00Z" };
    expect(occurrences(e, ...range("2026-11-21T12:00:00Z", "2026-11-30T00:00:00Z"))).toHaveLength(1);
  });

  it("keeps the Los Angeles wall-clock time across the daylight-saving change", () => {
    // Beer Fridays, 4 PM PDT on Oct 30 2026; DST ends Nov 1.
    const e = { startsAt: "2026-10-30T23:00:00Z", endsAt: "2026-10-31T03:00:00Z", rrule: "FREQ=WEEKLY;BYDAY=FR" };
    const occ = occurrences(e, ...range("2026-10-29T00:00:00Z", "2026-11-14T00:00:00Z"));
    expect(occ.map((o) => laDateKey(o.start))).toEqual(["2026-10-30", "2026-11-06", "2026-11-13"]);
    for (const o of occ) {
      expect(laParts(o.start).hour).toBe(16);
      expect(o.end!.getTime() - o.start.getTime()).toBe(4 * 3600 * 1000);
    }
  });

  it("skips excluded dates and stops at UNTIL", () => {
    const e = {
      startsAt: "2026-01-06T02:00:00Z", // Mon Jan 5, 6 PM PST
      rrule: "FREQ=WEEKLY;BYDAY=MO;UNTIL=20260131T000000Z",
      exdates: [{ date: "2026-01-13T02:00:00Z" }],
    };
    const occ = occurrences(e, ...range("2026-01-01T00:00:00Z", "2026-03-01T00:00:00Z"));
    expect(occ.map((o) => laDateKey(o.start))).toEqual(["2026-01-05", "2026-01-19", "2026-01-26"]);
  });

  it("never expands more than two years ahead", () => {
    const e = { startsAt: "2026-01-01T20:00:00Z", rrule: "FREQ=DAILY" };
    const occ = occurrences(e, ...range("2026-01-01T00:00:00Z", "2035-01-01T00:00:00Z"));
    expect(occ.length).toBeLessThanOrEqual(731);
  });
});
