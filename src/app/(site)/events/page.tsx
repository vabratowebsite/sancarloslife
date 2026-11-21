import type { Metadata } from "next";
import Link from "next/link";

import { EventsList } from "@/components/events/EventsList";
import { EventsShell } from "@/components/events/EventsShell";
import { fromLA, laParts } from "@/lib/events/recurrence";
import { getActiveEventCategories, listOccurrences } from "@/lib/queries/events";
import { buildMetadata } from "@/lib/seo";

type Props = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  const meta = buildMetadata({
    path: "/events/",
    title: "San Carlos, CA Events: Things to Do This Weekend",
    description:
      "Every event in San Carlos, California: festivals, farmers markets, music, family activities, library programs and city meetings.",
  });
  return q ? { ...meta, robots: { index: false, follow: true } } : meta;
}

/** Window boundaries rounded to the hour so cached results are shared. */
const hourIso = (d: Date) => new Date(Math.floor(d.getTime() / 3_600_000) * 3_600_000).toISOString();

export default async function EventsPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim().slice(0, 80) || undefined;
  const now = new Date();
  const p = laParts(now);
  const from = hourIso(now);
  const to = hourIso(new Date(now.getTime() + 180 * 86_400_000));
  const monthFrom = fromLA(p.year, p.month, 1).toISOString();
  const monthTo = fromLA(p.month === 12 ? p.year + 1 : p.year, p.month === 12 ? 1 : p.month + 1, 1).toISOString();
  const [occ, categories, month] = await Promise.all([
    listOccurrences({ from, to, q: query }),
    getActiveEventCategories(from, to),
    listOccurrences({ from: monthFrom, to: monthTo }),
  ]);

  return (
    <EventsShell
      title={query ? `Events matching “${query}”` : "Events in San Carlos"}
      intro={
        <p>
          Everything happening in town, from farmers markets to council meetings. Have an event?{" "}
          <Link href="/events/submit/">Submit it</Link> and we&rsquo;ll list it.
        </p>
      }
      crumbs={[{ name: "Events", path: "/events/" }]}
      categories={categories}
      q={query}
      view="list"
      monthOccurrences={month}
    >
      <EventsList occurrences={occ} />
      <p className="mt-10 text-small text-ink-500">
        Looking for something that already happened? Past events stay on their pages; browse them by{" "}
        <Link href="/events-and-activities/">annual event</Link> or category.
      </p>
    </EventsShell>
  );
}

export const revalidate = 600;
