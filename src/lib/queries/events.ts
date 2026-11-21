import { unstable_cache } from "next/cache";
import type { Where } from "payload";

import { occurrences } from "@/lib/events/recurrence";
import { getPayloadClient } from "@/lib/payload";
import type { Event, EventCategory } from "@/payload-types";

export type EventOccurrence = { event: Event; start: string; end: string | null };

// Archived = past; the date window decides what shows, so both statuses are public.
const PUBLIC = { status: { in: ["published", "archived"] } };

/**
 * Event occurrences between two dates (recurring events expanded), sorted by
 * start. Dates are ISO strings so the result can be cached.
 */
export const listOccurrences = (opts: { from: string; to: string; categoryId?: number; q?: string }) =>
  unstable_cache(
    async (): Promise<EventOccurrence[]> => {
      const payload = await getPayloadClient();
      const and: Where[] = [PUBLIC];
      if (opts.categoryId) and.push({ categories: { in: [opts.categoryId] } });
      if (opts.q) and.push({ title: { like: opts.q } });
      const from = new Date(opts.from);
      const to = new Date(opts.to);
      // One-off events overlapping the window, plus every recurring event that has started.
      const res = await payload.find({
        collection: "events",
        where: {
          and: [
            ...and,
            {
              or: [
                { and: [{ rrule: { exists: false } }, { startsAt: { less_than_equal: opts.to } }, { or: [{ endsAt: { greater_than_equal: opts.from } }, { startsAt: { greater_than_equal: opts.from } }] }] },
                { and: [{ rrule: { exists: true } }, { rrule: { not_equals: "" } }, { startsAt: { less_than_equal: opts.to } }] },
              ],
            },
          ],
        },
        limit: 1000,
        depth: 1,
        pagination: false,
      });
      const out: EventOccurrence[] = [];
      for (const event of res.docs) {
        for (const o of occurrences(event, from, to)) {
          out.push({ event, start: o.start.toISOString(), end: o.end?.toISOString() ?? null });
        }
      }
      return out.sort((a, b) => a.start.localeCompare(b.start));
    },
    ["occurrences-v2", opts.from, opts.to, String(opts.categoryId ?? ""), opts.q ?? ""],
    { tags: ["events"], revalidate: 600 },
  )();

export const getEventBySlug = (slug: string) =>
  unstable_cache(
    async (): Promise<Event | null> => {
      const payload = await getPayloadClient();
      const res = await payload.find({
        collection: "events",
        where: { slug: { equals: slug }, status: { in: ["published", "archived"] } },
        limit: 1,
        depth: 1,
      });
      return res.docs[0] ?? null;
    },
    ["event", slug],
    { tags: ["events", `events:${slug}`], revalidate: 3600 },
  )();

export const getEventCategoryBySlug = (slug: string) =>
  unstable_cache(
    async (): Promise<EventCategory | null> => {
      const payload = await getPayloadClient();
      return (await payload.find({ collection: "event-categories", where: { slug: { equals: slug } }, limit: 1 })).docs[0] ?? null;
    },
    ["event-category", slug],
    { tags: ["event-categories"], revalidate: 3600 },
  )();

/** Categories used by upcoming events, most used first (the filter chips). */
export const getActiveEventCategories = (fromIso: string, toIso: string) =>
  unstable_cache(
    async (): Promise<(EventCategory & { count: number })[]> => {
      const occ = await listOccurrences({ from: fromIso, to: toIso });
      const counts = new Map<number, { cat: EventCategory; count: number }>();
      for (const o of occ)
        for (const c of o.event.categories ?? [])
          if (typeof c === "object") counts.set(c.id, { cat: c, count: (counts.get(c.id)?.count ?? 0) + 1 });
      return [...counts.values()].sort((a, b) => b.count - a.count).map((x) => ({ ...x.cat, count: x.count }));
    },
    ["active-event-categories", fromIso.slice(0, 10), toIso.slice(0, 10)],
    { tags: ["events", "event-categories"], revalidate: 600 },
  )();

/** Past events of a category, newest first (archive under the category page). */
export const listPastEvents = (opts: { categoryId?: number; limit?: number; before: string }) =>
  unstable_cache(
    async () => {
      const payload = await getPayloadClient();
      return (
        await payload.find({
          collection: "events",
          where: {
            and: [
              { status: { in: ["published", "archived"] } },
              { startsAt: { less_than: opts.before } },
              ...(opts.categoryId ? [{ categories: { in: [opts.categoryId] } }] : []),
            ],
          },
          sort: "-startsAt",
          limit: opts.limit ?? 12,
          depth: 1,
        })
      ).docs;
    },
    ["past-events", String(opts.categoryId ?? ""), opts.before.slice(0, 10), String(opts.limit ?? 12)],
    { tags: ["events"], revalidate: 3600 },
  )();
