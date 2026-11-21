import Link from "next/link";

import { Breadcrumbs, type Crumb } from "@/components/content/Breadcrumbs";
import { MiniMonth } from "@/components/events/MiniMonth";
import { laDateKey, laParts } from "@/lib/events/recurrence";
import type { EventOccurrence } from "@/lib/queries/events";
import type { EventCategory } from "@/payload-types";

/** Shared frame for the events pages: title, search, category chips, view toggle, sidebar. */
export function EventsShell({
  title,
  intro,
  crumbs,
  categories,
  activeCategory,
  q,
  view,
  monthOccurrences,
  children,
}: {
  title: string;
  intro?: React.ReactNode;
  crumbs: Crumb[];
  categories: (EventCategory & { count?: number })[];
  activeCategory?: string;
  q?: string;
  view: "list" | "month";
  monthOccurrences: EventOccurrence[];
  children: React.ReactNode;
}) {
  const now = laParts(new Date());
  const days = new Set(monthOccurrences.map((o) => laDateKey(new Date(o.start))));
  const chip = (active: boolean) =>
    `eyebrow inline-block rounded-full px-3 py-1.5 text-xs ${active ? "bg-teal-700 text-white" : "bg-white text-teal-700"}`;
  return (
    <>
      <section className="bg-teal-50">
        <div className="container-site py-10">
          <Breadcrumbs items={crumbs} />
          <h1 className="mt-3 text-h2 md:text-h1">{title}</h1>
          <div className="mt-3 max-w-2xl text-ink-500">{intro}</div>
          <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <form role="search" action="/events/" method="get" className="flex w-full max-w-md gap-2">
              <label htmlFor="events-q" className="sr-only">
                Search events
              </label>
              <input
                id="events-q"
                name="q"
                type="search"
                defaultValue={q}
                placeholder="Search events"
                className="flex-1 rounded-button border border-teal-500/40 bg-white px-4 py-2.5"
              />
              <button type="submit" className="eyebrow rounded-button bg-teal-700 px-4 text-white hover:bg-teal-500">
                Search
              </button>
            </form>
            <nav aria-label="Calendar view" className="flex gap-1 rounded-button bg-white p-1">
              <Link href="/events/" aria-current={view === "list" ? "page" : undefined} className={`eyebrow rounded-button px-4 py-2 text-xs ${view === "list" ? "bg-teal-700 text-white" : "text-teal-700"}`}>
                List
              </Link>
              <Link href="/events/month/" aria-current={view === "month" ? "page" : undefined} className={`eyebrow rounded-button px-4 py-2 text-xs ${view === "month" ? "bg-teal-700 text-white" : "text-teal-700"}`}>
                Month
              </Link>
            </nav>
          </div>
          {categories.length > 0 && (
            <nav aria-label="Event categories" className="mt-4">
              <ul className="flex flex-wrap gap-2">
                <li>
                  <Link href="/events/" className={chip(!activeCategory)} aria-current={!activeCategory ? "page" : undefined}>
                    All
                  </Link>
                </li>
                {categories.slice(0, 10).map((c) => (
                  <li key={c.id}>
                    <Link href={`/events/category/${c.slug}/`} className={chip(activeCategory === c.slug)} aria-current={activeCategory === c.slug ? "page" : undefined}>
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </section>
      <div className="container-site grid grid-cols-[minmax(0,1fr)] gap-10 py-10 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
        <div className="min-w-0">{children}</div>
        <div className="grid content-start gap-6">
          <MiniMonth year={now.year} month={now.month} eventDays={days} />
          <aside aria-labelledby="submit-heading" className="rounded-card bg-teal-700 p-6 text-white">
            <h2 id="submit-heading" className="font-heading text-h4 !text-white">
              Hosting an event in San Carlos?
            </h2>
            <p className="mt-2 text-small text-teal-50">Send it to us and we&rsquo;ll add it to the calendar, free.</p>
            <Link href="/events/submit/" className="eyebrow mt-4 inline-block rounded-button bg-white px-4 py-2.5 text-teal-700">
              Submit an event
            </Link>
          </aside>
          <aside aria-labelledby="weekly-heading" className="rounded-card border border-teal-50 p-6">
            <h2 id="weekly-heading" className="eyebrow text-teal-700">
              This week in your inbox
            </h2>
            <p className="mt-2 text-small text-ink-500">Get the weekend&rsquo;s events every Thursday.</p>
            <Link href="/subscribe/" className="eyebrow mt-4 inline-block rounded-button border-2 border-teal-700 px-4 py-2 text-teal-700">
              Subscribe
            </Link>
          </aside>
        </div>
      </div>
    </>
  );
}
