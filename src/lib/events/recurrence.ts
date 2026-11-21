import { RRule, rrulestr } from "rrule";

export const EVENT_TZ = "America/Los_Angeles";
/** Never expand recurring events further than this (blueprint rule). */
export const MAX_RANGE_MS = 1000 * 60 * 60 * 24 * 365 * 2;

export type Occurrence = { start: Date; end: Date | null };

type RecurringInput = {
  startsAt: string;
  endsAt?: string | null;
  rrule?: string | null;
  exdates?: { date: string }[] | null;
};

/** Wall-clock parts of a date in Los Angeles. */
export function laParts(d: Date) {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: EVENT_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (t: string) => Number(f.find((p) => p.type === t)?.value);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute"), second: get("second") };
}

/** "2026-11-27" for a date, in Los Angeles. */
export const laDateKey = (d: Date) => {
  const p = laParts(d);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
};

/** The UTC instant for a Los Angeles wall-clock time (handles daylight saving). */
export function fromLA(year: number, month: number, day: number, hour = 0, minute = 0, second = 0): Date {
  let guess = Date.UTC(year, month - 1, day, hour, minute, second);
  for (let i = 0; i < 3; i++) {
    const p = laParts(new Date(guess));
    const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    const target = Date.UTC(year, month - 1, day, hour, minute, second);
    guess += target - asUtc;
  }
  return new Date(guess);
}

/**
 * Occurrences of an event between `from` and `to`. One-off events return their
 * own dates when they overlap the window. Recurring events repeat at the same
 * Los Angeles wall-clock time on each date (so 6 PM stays 6 PM across DST).
 */
export function occurrences(event: RecurringInput, from: Date, to: Date): Occurrence[] {
  const start = new Date(event.startsAt);
  const end = event.endsAt ? new Date(event.endsAt) : null;
  const duration = end ? end.getTime() - start.getTime() : 0;
  const windowEnd = new Date(Math.min(to.getTime(), from.getTime() + MAX_RANGE_MS));

  if (!event.rrule) {
    const last = end ?? start;
    return last >= from && start <= windowEnd ? [{ start, end }] : [];
  }

  // rrule works in "floating" time: describe the start as LA wall clock in UTC fields.
  const p = laParts(start);
  const floatingStart = new Date(Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second));
  const rule = rrulestr(event.rrule.replace(/^RRULE:/i, ""), { dtstart: floatingStart }) as RRule;
  const toFloating = (d: Date) => {
    const q = laParts(d);
    return new Date(Date.UTC(q.year, q.month - 1, q.day, q.hour, q.minute, q.second));
  };
  // Widen the window by the event length so a run that started before `from` is included.
  const dates = rule.between(toFloating(new Date(from.getTime() - duration)), toFloating(windowEnd), true);
  const skipped = new Set((event.exdates ?? []).map((x) => laDateKey(new Date(x.date))));

  return dates
    .map((f) => {
      const s = fromLA(f.getUTCFullYear(), f.getUTCMonth() + 1, f.getUTCDate(), f.getUTCHours(), f.getUTCMinutes(), f.getUTCSeconds());
      return { start: s, end: end ? new Date(s.getTime() + duration) : null };
    })
    .filter((o) => !skipped.has(laDateKey(o.start)));
}
