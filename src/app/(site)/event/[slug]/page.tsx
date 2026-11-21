import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { RichText } from "@/components/content/RichText";
import { JsonLd } from "@/components/seo/JsonLd";
import { occurrences } from "@/lib/events/recurrence";
import { formatDate, formatTime, plainText } from "@/lib/format";
import { mediaSrc } from "@/lib/media";
import { getEventBySlug } from "@/lib/queries/events";
import { absolute, buildMetadata } from "@/lib/seo";
import type { EventCategory, Organizer, Venue } from "@/payload-types";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return {};
  return buildMetadata({
    path: `/event/${slug}/`,
    title: event.title,
    description: plainText(event.body, 155) || `${event.title} in San Carlos, California on ${formatDate(event.startsAt)}.`,
    seo: event.seo,
    image: event.cover,
  });
}

const mapsLink = (v: Venue) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([v.name, v.address, v.city, v.state, v.zip].filter(Boolean).join(", "))}`;

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();
  const venue = typeof event.venue === "object" ? (event.venue as Venue) : undefined;
  const organizer = typeof event.organizer === "object" ? (event.organizer as Organizer) : undefined;
  const categories = (event.categories ?? []).filter((c): c is EventCategory => typeof c === "object");
  const cover = mediaSrc(event.cover, "hero");
  const now = new Date();
  // For a recurring event show the next date; otherwise its own date.
  const next = event.rrule ? occurrences(event, now, new Date(now.getTime() + 365 * 86_400_000))[0] : undefined;
  const start = next?.start.toISOString() ?? event.startsAt;
  const end = next ? next.end?.toISOString() ?? null : event.endsAt ?? null;
  const isPast = new Date(end ?? start) < now;
  const when = event.allDay
    ? formatDate(start, { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    : `${formatDate(start, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}, ${formatTime(start)}${end ? ` – ${formatTime(end)}` : ""}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: start,
    ...(end ? { endDate: end } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: absolute(`/event/${slug}/`),
    description: plainText(event.body, 300) || undefined,
    image: cover ? [absolute(cover.src)] : undefined,
    ...(venue
      ? {
          location: {
            "@type": "Place",
            name: venue.name,
            address: { "@type": "PostalAddress", streetAddress: venue.address, addressLocality: venue.city, addressRegion: venue.state, postalCode: venue.zip, addressCountry: "US" },
          },
        }
      : { location: { "@type": "Place", name: "San Carlos, CA", address: { "@type": "PostalAddress", addressLocality: "San Carlos", addressRegion: "CA", addressCountry: "US" } } }),
    ...(organizer ? { organizer: { "@type": "Organization", name: organizer.name, url: organizer.url || undefined } } : {}),
    ...(event.cost ? { offers: { "@type": "Offer", url: event.url || absolute(`/event/${slug}/`), price: /free/i.test(event.cost) ? "0" : event.cost.replace(/[^\d.]/g, "") || undefined, priceCurrency: "USD", availability: "https://schema.org/InStock" } } : {}),
  };

  return (
    <div className="container-site grid grid-cols-[minmax(0,1fr)] gap-10 py-10 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
      <article className="min-w-0">
        <Breadcrumbs
          items={[
            { name: "Events", path: "/events/" },
            ...(categories[0] ? [{ name: categories[0].name, path: `/events/category/${categories[0].slug}/` }] : []),
            { name: event.title, path: `/event/${slug}/` },
          ]}
        />
        {isPast && (
          <p className="mt-4 rounded-button bg-sand-100 px-4 py-3 text-small">
            This event has passed. See <Link href="/events/">what&rsquo;s coming up</Link> in San Carlos.
          </p>
        )}
        <h1 className="mt-3 text-h2 md:text-h1">{event.title}</h1>
        <p className="eyebrow mt-3 text-coral-700">
          <time dateTime={start}>{when}</time>
          {event.rrule && " · Repeats"}
        </p>
        {cover && (
          <Image
            src={cover.src}
            alt={cover.alt}
            width={cover.width}
            height={cover.height}
            priority
            sizes="(min-width: 1024px) 760px, 100vw"
            className="mt-6 w-full rounded-card object-cover"
          />
        )}
        <RichText data={event.body} className="mt-8" />
        {categories.length > 0 && (
          <ul className="mt-8 flex flex-wrap gap-2" aria-label="Categories">
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/events/category/${c.slug}/`} className="eyebrow inline-block rounded-full bg-teal-50 px-3 py-1 text-xs">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <JsonLd data={jsonLd} />
      </article>

      <aside aria-label="Event details" className="grid h-fit gap-6 rounded-card bg-teal-50 p-6">
        <div>
          <h2 className="eyebrow text-teal-700">When</h2>
          <p className="mt-1">{when}</p>
          {!isPast && (
            <a href={`/event/${slug}/calendar.ics`} className="eyebrow mt-3 inline-block rounded-button bg-teal-700 px-4 py-2 text-xs text-white hover:bg-teal-500" download>
              Add to calendar
            </a>
          )}
        </div>
        {venue && (
          <div>
            <h2 className="eyebrow text-teal-700">Where</h2>
            <p className="mt-1 font-bold">{venue.name}</p>
            <p className="text-small">{[venue.address, [venue.city, venue.state].filter(Boolean).join(", "), venue.zip].filter(Boolean).join(" · ")}</p>
            <a href={mapsLink(venue)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-small">
              Directions on Google Maps
            </a>
          </div>
        )}
        {event.cost && (
          <div>
            <h2 className="eyebrow text-teal-700">Cost</h2>
            <p className="mt-1">{event.cost}</p>
          </div>
        )}
        {organizer && (
          <div>
            <h2 className="eyebrow text-teal-700">Organizer</h2>
            <p className="mt-1">{organizer.name}</p>
            {organizer.url && (
              <a href={organizer.url} target="_blank" rel="noopener noreferrer" className="text-small">
                Organizer website
              </a>
            )}
          </div>
        )}
        {event.url && (
          <a href={event.url} target="_blank" rel="noopener noreferrer" className="eyebrow rounded-button border-2 border-teal-700 px-4 py-2 text-center text-xs text-teal-700">
            Event website and tickets
          </a>
        )}
      </aside>
    </div>
  );
}

export const revalidate = 3600;
