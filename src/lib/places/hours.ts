/**
 * Opening hours for restaurant and shop pages: formatting and the "Open now" status,
 * always in San Carlos time. Pure functions (no React), shared by the page, the
 * client-side status label and the unit tests.
 */
export const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
export type Day = (typeof DAYS)[number];
export type HoursRow = { days: string; dow: Day[]; slots: { opens: string; closes: string }[] };

const TZ = "America/Los_Angeles";
const SHORT: Record<Day, string> = { monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun" };

const hm = (m: number) => `${String(Math.floor((m % 1440) / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** "17:30" → "5:30 PM", "12:00" → "12:00 PM", "00:00" or "24:00" → "midnight". */
export function formatTime(hhmm: string): string {
  const t = minutes(hhmm) % (24 * 60);
  if (t === 0) return "midnight";
  const h = Math.floor(t / 60);
  const m = t % 60;
  const ampm = h < 12 ? "AM" : "PM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export const formatSlot = (s: { opens: string; closes: string }) => `${formatTime(s.opens)} – ${formatTime(s.closes)}`;

/** Days of the week no row covers, in order (shown as "Closed"). */
export function closedDays(rows: HoursRow[]): Day[] {
  return DAYS.filter((d) => !rows.some((r) => r.dow.includes(d)));
}

export const shortDays = (days: Day[]) => days.map((d) => SHORT[d]).join(", ");

/** Day of week and minutes after midnight in San Carlos at `now`. */
export function localNow(now: Date): { day: Day; min: number } {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "long", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { day: get("weekday").toLowerCase() as Day, min: Number(get("hour")) * 60 + Number(get("minute")) };
}

type Interval = { day: Day; start: number; end: number };

/** Every opening as minutes from the start of its day; slots past midnight run into the next day. */
function intervals(rows: HoursRow[]): Interval[] {
  const out: Interval[] = [];
  for (const r of rows)
    for (const d of r.dow)
      for (const s of r.slots) {
        const start = minutes(s.opens);
        let end = minutes(s.closes);
        if (end <= start) end += 24 * 60; // closes after midnight (00:00 = midnight)
        out.push({ day: d, start, end });
      }
  return out;
}

export type OpenStatus =
  | { open: true; closesAt: string }
  | { open: false; opensAt?: { day: Day; time: string; today: boolean; tomorrow: boolean } };

/** Open now? If open, when it closes; if closed, the next opening within a week. */
export function openStatus(rows: HoursRow[], now: Date): OpenStatus {
  const { day, min } = localNow(now);
  const today = DAYS.indexOf(day);
  const all = intervals(rows);
  // Week minutes, Monday 00:00 = 0, so slots from yesterday that run past midnight count too.
  const week = 7 * 24 * 60;
  const nowW = today * 24 * 60 + min;
  for (const iv of all) {
    const s = DAYS.indexOf(iv.day) * 24 * 60 + iv.start;
    const e = DAYS.indexOf(iv.day) * 24 * 60 + iv.end;
    for (const shift of [0, -week]) {
      if (nowW >= s + shift && nowW < e + shift) return { open: true, closesAt: formatTime(hm(iv.end)) };
    }
  }
  let best: { at: number; iv: Interval } | null = null;
  for (const iv of all) {
    let at = DAYS.indexOf(iv.day) * 24 * 60 + iv.start - nowW;
    if (at <= 0) at += week;
    if (!best || at < best.at) best = { at, iv };
  }
  if (!best) return { open: false };
  const daysAhead = (DAYS.indexOf(best.iv.day) - today + 7) % 7;
  const sameDayLater = daysAhead === 0 && best.at < 24 * 60;
  return {
    open: false,
    opensAt: {
      day: best.iv.day,
      time: formatTime(hm(best.iv.start)),
      today: sameDayLater,
      tomorrow: daysAhead === 1,
    },
  };
}

/** Short label: "Open now · closes 9:00 PM", "Closed · opens tomorrow 11:00 AM". */
export function statusLabel(s: OpenStatus): string {
  if (s.open) return `Open now · closes ${s.closesAt}`;
  if (!s.opensAt) return "Closed";
  const when = s.opensAt.today ? "today" : s.opensAt.tomorrow ? "tomorrow" : SHORT[s.opensAt.day];
  return `Closed · opens ${when} ${s.opensAt.time}`;
}

/** Today's hours as text, e.g. "Today: 11:00 AM – 5:00 PM" or "Today: closed". */
export function todayLine(rows: HoursRow[], now: Date): string {
  const { day } = localNow(now);
  const slots = rows.filter((r) => r.dow.includes(day)).flatMap((r) => r.slots);
  return slots.length ? `Today: ${slots.map(formatSlot).join(", ")}` : "Today: closed";
}

/** schema.org openingHoursSpecification. */
export const hoursJsonLd = (rows: HoursRow[]) =>
  rows.flatMap((r) =>
    r.slots.map((s) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: r.dow.map((d) => d[0].toUpperCase() + d.slice(1)),
      opens: s.opens,
      closes: s.closes === "24:00" ? "23:59" : s.closes,
    })),
  );
