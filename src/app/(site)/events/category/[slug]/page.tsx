import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EventsList } from "@/components/events/EventsList";
import { EventsShell } from "@/components/events/EventsShell";
import { fromLA, laParts } from "@/lib/events/recurrence";
import { formatDate } from "@/lib/format";
import { getActiveEventCategories, getEventCategoryBySlug, listOccurrences, listPastEvents } from "@/lib/queries/events";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getEventCategoryBySlug(slug);
  if (!cat) return {};
  return buildMetadata({
    path: `/events/category/${slug}/`,
    title: `${cat.name} Events in San Carlos, CA`,
    description: `Upcoming and past ${cat.name.toLowerCase()} events in San Carlos, California.`,
  });
}

const hourIso = (d: Date) => new Date(Math.floor(d.getTime() / 3_600_000) * 3_600_000).toISOString();

export default async function EventCategoryPage({ params }: Props) {
  const { slug } = await params;
  const cat = await getEventCategoryBySlug(slug);
  if (!cat) notFound();
  const now = new Date();
  const p = laParts(now);
  const from = hourIso(now);
  const to = hourIso(new Date(now.getTime() + 365 * 86_400_000));
  const [occ, categories, month, past] = await Promise.all([
    listOccurrences({ from, to, categoryId: cat.id }),
    getActiveEventCategories(from, hourIso(new Date(now.getTime() + 180 * 86_400_000))),
    listOccurrences({ from: fromLA(p.year, p.month, 1).toISOString(), to: fromLA(p.month === 12 ? p.year + 1 : p.year, p.month === 12 ? 1 : p.month + 1, 1).toISOString() }),
    listPastEvents({ categoryId: cat.id, before: from, limit: 12 }),
  ]);
  // Keep the current category visible among the chips even with no upcoming events.
  const chips = categories.some((c) => c.id === cat.id) ? categories : [cat, ...categories];

  return (
    <EventsShell
      title={`${cat.name} events`}
      crumbs={[
        { name: "Events", path: "/events/" },
        { name: cat.name, path: `/events/category/${slug}/` },
      ]}
      categories={chips}
      activeCategory={slug}
      view="list"
      monthOccurrences={month}
    >
      <EventsList occurrences={occ} />
      {past.length > 0 && (
        <section aria-labelledby="past-heading" className="mt-12">
          <h2 id="past-heading" className="eyebrow text-sm text-ink-500">
            Past {cat.name.toLowerCase()} events
          </h2>
          <ul className="mt-3 grid gap-2">
            {past.map((e) => (
              <li key={e.id} className="flex flex-wrap justify-between gap-x-4 border-b border-teal-50 py-2">
                <Link href={`/event/${e.slug}/`}>{e.title}</Link>
                <span className="text-small text-ink-500">{formatDate(e.startsAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </EventsShell>
  );
}

export const revalidate = 600;
