import { describe, expect, it } from "vitest";

import { closedDays, formatTime, hoursJsonLd, openStatus, statusLabel, todayLine, type HoursRow } from "@/lib/places/hours";

// The Reading Bug's hours (desk profile): closed Mondays.
const shop: HoursRow[] = [
  { days: "Tue–Wed", dow: ["tuesday", "wednesday"], slots: [{ opens: "11:00", closes: "17:00" }] },
  { days: "Thu", dow: ["thursday"], slots: [{ opens: "11:00", closes: "18:00" }] },
  { days: "Fri–Sat", dow: ["friday", "saturday"], slots: [{ opens: "10:00", closes: "18:00" }] },
  { days: "Sun", dow: ["sunday"], slots: [{ opens: "10:00", closes: "17:00" }] },
];
// A bar open past midnight, and a restaurant with a lunch break.
const bar: HoursRow[] = [{ days: "Fri–Sat", dow: ["friday", "saturday"], slots: [{ opens: "17:00", closes: "01:30" }] }];
const lunch: HoursRow[] = [
  { days: "Daily", dow: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"], slots: [{ opens: "11:30", closes: "14:30" }, { opens: "17:00", closes: "21:00" }] },
];

// San Carlos is UTC-8 in November (PST): 2026-11-24 is a Tuesday.
const at = (iso: string) => new Date(iso);

describe("opening hours", () => {
  it("formats times", () => {
    expect(formatTime("09:05")).toBe("9:05 AM");
    expect(formatTime("12:00")).toBe("12:00 PM");
    expect(formatTime("17:30")).toBe("5:30 PM");
    expect(formatTime("00:00")).toBe("midnight");
    expect(formatTime("24:00")).toBe("midnight");
  });

  it("lists closed days", () => {
    expect(closedDays(shop)).toEqual(["monday"]);
  });

  it("is open during hours, in San Carlos time", () => {
    // Tue 12:00 PST = 20:00 UTC
    expect(statusLabel(openStatus(shop, at("2026-11-24T20:00:00Z")))).toBe("Open now · closes 5:00 PM");
  });

  it("is closed before opening and says when it opens", () => {
    // Tue 09:00 PST
    expect(statusLabel(openStatus(shop, at("2026-11-24T17:00:00Z")))).toBe("Closed · opens today 11:00 AM");
    // Mon 12:00 PST (closed Mondays) → opens tomorrow
    expect(statusLabel(openStatus(shop, at("2026-11-23T20:00:00Z")))).toBe("Closed · opens tomorrow 11:00 AM");
    // Sun 18:00 PST → next is Tuesday
    expect(statusLabel(openStatus(shop, at("2026-11-30T02:00:00Z")))).toBe("Closed · opens Tue 11:00 AM");
  });

  it("handles a break between lunch and dinner", () => {
    // Tue 15:00 PST
    expect(statusLabel(openStatus(lunch, at("2026-11-24T23:00:00Z")))).toBe("Closed · opens today 5:00 PM");
    expect(todayLine(lunch, at("2026-11-24T23:00:00Z"))).toBe("Today: 11:30 AM – 2:30 PM, 5:00 PM – 9:00 PM");
  });

  it("keeps a late slot open past midnight", () => {
    // Sat 00:30 PST (= Friday night)
    expect(statusLabel(openStatus(bar, at("2026-11-28T08:30:00Z")))).toBe("Open now · closes 1:30 AM");
    // Sun 00:30 PST (= Saturday night, wraps into Sunday)
    expect(statusLabel(openStatus(bar, at("2026-11-29T08:30:00Z")))).toBe("Open now · closes 1:30 AM");
    // Sun 02:00 PST: closed, opens Friday
    expect(statusLabel(openStatus(bar, at("2026-11-29T10:00:00Z")))).toBe("Closed · opens Fri 5:00 PM");
  });

  it("has no next opening without hours", () => {
    expect(statusLabel(openStatus([], at("2026-11-24T20:00:00Z")))).toBe("Closed");
  });

  it("writes schema.org hours", () => {
    expect(hoursJsonLd(shop)[0]).toEqual({ "@type": "OpeningHoursSpecification", dayOfWeek: ["Tuesday", "Wednesday"], opens: "11:00", closes: "17:00" });
  });
});
