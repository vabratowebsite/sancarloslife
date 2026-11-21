import Link from "next/link";

import { EventRow } from "@/components/events/EventRow";
import { laDateKey, laParts } from "@/lib/events/recurrence";
import type { EventOccurrence } from "@/lib/queries/events";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Groups: Today, This weekend, This week, Next week, then one group per month. */
function groupOccurrences(occ: EventOccurrence[], now: Date) {
  const todayKey = laDateKey(now);
  const p = laParts(now);
  const dow = new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay();
  const dayKey = (offset: number) => laDateKey(new Date(now.getTime() + offset * 86_400_000));
  // Upcoming Sunday (end of this week) and the one after.
  const endOfWeek = dayKey(dow === 0 ? 0 : 7 - dow);
  const endOfNextWeek = dayKey((dow === 0 ? 0 : 7 - dow) + 7);
  const weekendStart = dayKey(dow === 0 ? 0 : dow === 6 ? 0 : 5 - dow); // Friday (or today on Sat/Sun)

  const groups = new Map<string, EventOccurrence[]>();
  for (const o of occ) {
    // Events that started earlier but are still running count as today.
    const k = laDateKey(new Date(o.start)) < todayKey ? todayKey : laDateKey(new Date(o.start));
    let label: string;
    if (k === todayKey) label = "Today";
    else if (k >= weekendStart && k <= endOfWeek) label = "This weekend";
    else if (k <= endOfWeek) label = "This week";
    else if (k <= endOfNextWeek) label = "Next week";
    else {
      const [y, m] = k.split("-").map(Number);
      label = `${MONTHS[m - 1]}${y !== p.year ? ` ${y}` : ""}`;
    }
    groups.set(label, [...(groups.get(label) ?? []), o]);
  }
  return [...groups.entries()];
}

export function EventsList({ occurrences, emptyText }: { occurrences: EventOccurrence[]; emptyText?: React.ReactNode }) {
  if (occurrences.length === 0)
    return (
      <p className="rounded-card bg-sand-100 p-6">
        {emptyText ?? (
          <>
            No upcoming events here yet. Know of one? <Link href="/events/submit/">Submit an event</Link> and we&rsquo;ll
            list it.
          </>
        )}
      </p>
    );
  return (
    <div className="grid gap-8">
      {groupOccurrences(occurrences, new Date()).map(([label, items]) => (
        <section key={label} aria-label={label}>
          <h2 className="eyebrow text-sm text-teal-700">{label}</h2>
          <div className="mt-3 grid gap-3">
            {items.map((o) => (
              <EventRow key={`${o.event.id}-${o.start}`} occ={o} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
