"use client";

import { useEffect, useState } from "react";

import { openStatus, statusLabel, todayLine, type HoursRow } from "@/lib/places/hours";

/**
 * "Open now · closes 9:00 PM" and today's hours, worked out in the visitor's browser
 * (pages are cached, so the server can't know the time). Empty until mounted, then
 * refreshed every minute.
 */
export function OpenNow({ rows, today = true }: { rows: HoursRow[]; today?: boolean }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    // First tick right after mount (not during it), then every minute.
    const first = setTimeout(() => setNow(new Date()), 0);
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, []);
  if (!now || !rows.length) return <p className="min-h-6" aria-hidden />;
  const s = openStatus(rows, now);
  return (
    <div className="space-y-1">
      <p className={`flex items-center gap-2 font-bold ${s.open ? "text-teal-700" : "text-coral-700"}`}>
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${s.open ? "bg-teal-500" : "bg-coral-500"}`} aria-hidden />
        {statusLabel(s)}
      </p>
      {today ? <p className="text-small text-ink-500">{todayLine(rows, now)}</p> : null}
    </div>
  );
}
