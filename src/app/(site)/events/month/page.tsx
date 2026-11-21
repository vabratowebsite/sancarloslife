import type { Metadata } from "next";
import Link from "next/link";

import { EventsShell } from "@/components/events/EventsShell";
import { fromLA, laDateKey, laParts } from "@/lib/events/recurrence";
import { formatTime } from "@/lib/format";
import { getActiveEventCategories, listOccurrences, type EventOccurrence } from "@/lib/queries/events";
import { buildMetadata } from "@/lib/seo";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

type Props = { searchParams: Promise<{ m?: string }> };

function parseMonth(m: string | undefined) {
  const now = laParts(new Date());
  const match = m?.match(/^(\d{4})-(\d{2})$/);
  const year = match ? Number(match[1]) : now.year;
  const month = match ? Math.min(12, Math.max(1, Number(match[2]))) : now.month;
  return { year, month };
}

const hourIso = (d: Date) => new Date(Math.floor(d.getTime() / 3_600_000) * 3_600_000).toISOString();
const key = (y: number, m: number) => `${y}-${String(m).padStart(2, "0")}`;
const shift = (y: number, m: number, by: number) => {
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { m } = await searchParams;
  const { year, month } = parseMonth(m);
  const meta = buildMetadata({
    path: "/events/month/",
    title: `San Carlos Events Calendar: ${MONTHS[month - 1]} ${year}`,
    description: `Month calendar of events in San Carlos, California for ${MONTHS[month - 1]} ${year}.`,
  });
  return m ? { ...meta, alternates: { canonical: undefined }, robots: { index: false, follow: true } } : meta;
}

export default async function MonthPage({ searchParams }: Props) {
  const { m } = await searchParams;
  const { year, month } = parseMonth(m);
  const from = fromLA(year, month, 1).toISOString();
  const next = shift(year, month, 1);
  const prev = shift(year, month, -1);
  const to = fromLA(next.year, next.month, 1).toISOString();
  const now = new Date();
  const [occ, categories] = await Promise.all([
    listOccurrences({ from, to }),
    getActiveEventCategories(hourIso(now), hourIso(new Date(now.getTime() + 180 * 86_400_000))),
  ]);
  const byDay = new Map<string, EventOccurrence[]>();
  for (const o of occ) {
    const k = laDateKey(new Date(o.start));
    byDay.set(k, [...(byDay.get(k) ?? []), o]);
  }
  const startDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (number | null)[] = [...Array(startDow).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const today = laDateKey(new Date());

  return (
    <EventsShell
      title={`${MONTHS[month - 1]} ${year}`}
      intro={<p>The month at a glance. Select an event for times, place and tickets.</p>}
      crumbs={[
        { name: "Events", path: "/events/" },
        { name: "Month", path: "/events/month/" },
      ]}
      categories={categories}
      view="month"
      monthOccurrences={occ}
    >
      <nav aria-label="Months" className="mb-4 flex items-center justify-between">
        <Link href={`/events/month/?m=${key(prev.year, prev.month)}`} className="eyebrow">
          ← {MONTHS[prev.month - 1]}
        </Link>
        <Link href={`/events/month/?m=${key(next.year, next.month)}`} className="eyebrow">
          {MONTHS[next.month - 1]} →
        </Link>
      </nav>

      {/* Grid on wide screens */}
      <table className="hidden w-full table-fixed border-collapse md:table">
        <caption className="sr-only">
          Events in {MONTHS[month - 1]} {year}
        </caption>
        <thead>
          <tr>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <th key={d} scope="col" className="eyebrow pb-2 text-xs text-ink-500">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: cells.length / 7 }, (_, w) => (
            <tr key={w}>
              {cells.slice(w * 7, w * 7 + 7).map((d, i) => {
                const k = d ? `${key(year, month)}-${String(d).padStart(2, "0")}` : "";
                const list = d ? byDay.get(k) ?? [] : [];
                return (
                  <td key={i} id={d ? `d-${k}` : undefined} className={`h-28 border border-teal-50 p-1.5 align-top ${k === today ? "bg-teal-50" : ""}`}>
                    {d && <span className={`text-xs ${k === today ? "font-bold text-teal-700" : "text-ink-500"}`}>{d}</span>}
                    <ul className="mt-1 grid gap-1">
                      {list.slice(0, 3).map((o) => (
                        <li key={o.event.id + o.start}>
                          <Link href={`/event/${o.event.slug}/`} className="line-clamp-2 rounded bg-teal-50 px-1.5 py-0.5 text-[12px] leading-tight text-ink-900 hover:bg-teal-700 hover:text-white">
                            {o.event.title}
                          </Link>
                        </li>
                      ))}
                      {list.length > 3 && <li className="text-[11px] text-ink-500">+{list.length - 3} more</li>}
                    </ul>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Agenda on phones */}
      <div className="grid gap-4 md:hidden">
        {[...byDay.entries()].map(([k, list]) => (
          <section key={k} id={`d-${k}`} aria-label={k}>
            <h2 className="eyebrow text-sm text-teal-700">
              {new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric" }).format(new Date(`${k}T12:00:00Z`))}
            </h2>
            <ul className="mt-2 grid gap-2">
              {list.map((o) => (
                <li key={o.event.id + o.start} className="rounded-card border border-teal-50 p-3">
                  <span className="eyebrow text-xs text-coral-700">{o.event.allDay ? "All day" : formatTime(o.start)}</span>
                  <Link href={`/event/${o.event.slug}/`} className="block font-heading text-ink-900">
                    {o.event.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {byDay.size === 0 && <p className="rounded-card bg-sand-100 p-6">No events listed for this month yet.</p>}
      </div>
    </EventsShell>
  );
}

export const revalidate = 600;
