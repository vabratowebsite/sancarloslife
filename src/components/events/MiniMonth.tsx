import Link from "next/link";

import { fromLA, laDateKey, laParts } from "@/lib/events/recurrence";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Small month grid for the events sidebar; days with events link to the month view. */
export function MiniMonth({ year, month, eventDays }: { year: number; month: number; eventDays: Set<string> }) {
  const first = fromLA(year, month, 1, 12);
  const startDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const today = laDateKey(new Date());
  const cells: (number | null)[] = [...Array(startDow).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const key = (d: number) => `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return (
    <div className="rounded-card border border-teal-50 p-5">
      <p className="eyebrow text-teal-700">
        {MONTHS[laParts(first).month - 1]} {year}
      </p>
      <table className="mt-3 w-full table-fixed text-center text-small">
        <caption className="sr-only">Days with events are links</caption>
        <thead>
          <tr className="eyebrow text-[11px] text-ink-500">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <th key={i} scope="col" className="py-1 font-normal">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: Math.ceil(cells.length / 7) }, (_, w) => (
            <tr key={w}>
              {cells.slice(w * 7, w * 7 + 7).map((d, i) => (
                <td key={i} className="py-0.5">
                  {d &&
                    (eventDays.has(key(d)) ? (
                      <Link
                        href={`/events/month/?m=${year}-${String(month).padStart(2, "0")}#d-${key(d)}`}
                        className={`mx-auto flex size-8 items-center justify-center rounded-full font-bold ${key(d) === today ? "bg-teal-700 text-white" : "bg-teal-50 text-teal-700"}`}
                        aria-label={`Events on ${MONTHS[month - 1]} ${d}`}
                      >
                        {d}
                      </Link>
                    ) : (
                      <span className={`mx-auto flex size-8 items-center justify-center rounded-full ${key(d) === today ? "border border-teal-700" : "text-ink-500"}`}>
                        {d}
                      </span>
                    ))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
