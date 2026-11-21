import { occurrences } from "@/lib/events/recurrence";
import { plainText } from "@/lib/format";
import { getEventBySlug } from "@/lib/queries/events";
import { absolute } from "@/lib/seo";
import type { Venue } from "@/payload-types";

/** iCalendar file for one event (Add to calendar). */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return new Response("Not found", { status: 404 });

  const now = new Date();
  const next = event.rrule ? occurrences(event, now, new Date(now.getTime() + 365 * 86_400_000))[0] : undefined;
  const start = next?.start ?? new Date(event.startsAt);
  const end = next?.end ?? (event.endsAt ? new Date(event.endsAt) : new Date(start.getTime() + 60 * 60 * 1000));
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const day = (d: Date) => stamp(d).slice(0, 8);
  // RFC 5545 text escaping and 75-octet line folding.
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
  const fold = (line: string) => line.replace(/(.{74})(?=.)/g, "$1\r\n ");
  const venue = typeof event.venue === "object" ? (event.venue as Venue) : undefined;
  const url = absolute(`/event/${slug}/`);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//San Carlos Life//Events//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:event-${event.id}@sancarloslife.com`,
    `DTSTAMP:${stamp(now)}`,
    ...(event.allDay
      ? [`DTSTART;VALUE=DATE:${day(start)}`, `DTEND;VALUE=DATE:${day(new Date(end.getTime() + 86_400_000))}`]
      : [`DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`]),
    ...(event.rrule && !next ? [`RRULE:${event.rrule.replace(/^RRULE:/i, "")}`] : []),
    `SUMMARY:${esc(event.title)}`,
    `DESCRIPTION:${esc(`${plainText(event.body, 600)}\n\n${url}`)}`,
    ...(venue ? [`LOCATION:${esc([venue.name, venue.address, venue.city, venue.state].filter(Boolean).join(", "))}`] : []),
    `URL:${url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].map(fold);

  return new Response(lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.ics"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
