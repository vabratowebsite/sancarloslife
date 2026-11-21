/**
 * Desk job schedules, in San Carlos time (America/Los_Angeles).
 * No cron parser: a job runs daily, on weekdays, or weekly at a whole hour,
 * which covers every Operations Desk job and is easy to set in the admin.
 */

export const DESK_TZ = "America/Los_Angeles";

export type Cadence = "daily" | "weekdays" | "weekly";
export type JobSchedule = { cadence: Cadence; hour: number; weekday?: number | null; graceHours?: number | null };

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** Wall-clock parts of an instant in a time zone. */
function wallParts(ms: number, tz = DESK_TZ) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
  }).formatToParts(new Date(ms));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { y: +get("year"), m: +get("month"), d: +get("day"), h: +get("hour"), min: +get("minute"), s: +get("second"), weekday };
}

/** Offset (ms) of the zone from UTC at an instant: wall time minus real time. */
function offsetAt(ms: number, tz = DESK_TZ) {
  const p = wallParts(ms, tz);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s) - Math.floor(ms / 1000) * 1000;
}

/** The instant a wall-clock time happens in the zone (DST gaps resolve to the later hour). */
export function zonedTime(y: number, m: number, d: number, h: number, tz = DESK_TZ) {
  const guess = Date.UTC(y, m - 1, d, h);
  let t = guess - offsetAt(guess, tz);
  t = guess - offsetAt(t, tz);
  return t;
}

function runsOn(s: JobSchedule, weekday: number) {
  if (s.cadence === "daily") return true;
  if (s.cadence === "weekdays") return weekday >= 1 && weekday <= 5;
  return weekday === (s.weekday ?? 1);
}

/** The most recent scheduled time at or before `now`. */
export function lastScheduled(s: JobSchedule, now: number): number {
  const hour = Math.min(23, Math.max(0, Math.floor(s.hour)));
  for (let back = 0; back <= 8; back++) {
    // Noon is never in a DST gap, so stepping days from there is safe.
    const p = wallParts(now - back * DAY);
    const noon = zonedTime(p.y, p.m, p.d, 12);
    const day = wallParts(noon);
    if (!runsOn(s, day.weekday)) continue;
    const at = zonedTime(day.y, day.m, day.d, hour);
    if (at <= now) return at;
  }
  throw new Error("No scheduled time in the last week; check the job's schedule.");
}

/** Runs logged this long before the scheduled time still count (a run that started a bit early). */
export const EARLY_SLACK = 2 * HOUR;

export type DueCheck = { due: boolean; scheduledAt: number; deadline: number; reason: string };

/**
 * A job is due for the backup runner when its grace period after the last
 * scheduled time has passed and nobody (Claude, an editor, or an earlier backup
 * run) has logged a run for it since then.
 */
export function backupDue(s: JobSchedule, now: number, lastRunStartedAt: number | null): DueCheck {
  const scheduledAt = lastScheduled(s, now);
  const deadline = scheduledAt + Math.max(0, s.graceHours ?? 3) * HOUR;
  if (lastRunStartedAt !== null && lastRunStartedAt >= scheduledAt - EARLY_SLACK) {
    return { due: false, scheduledAt, deadline, reason: "already ran" };
  }
  if (now < deadline) return { due: false, scheduledAt, deadline, reason: "waiting for Claude" };
  return { due: true, scheduledAt, deadline, reason: "Claude's run is missing" };
}
