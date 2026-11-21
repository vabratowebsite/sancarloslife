import Image from "next/image";
import Link from "next/link";

import { formatTime } from "@/lib/format";
import { laParts } from "@/lib/events/recurrence";
import { mediaSrc } from "@/lib/media";
import type { EventOccurrence } from "@/lib/queries/events";
import type { EventCategory, Venue } from "@/payload-types";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** One event in the list: date block, time and category, title, place and cost, photo. */
export function EventRow({ occ }: { occ: EventOccurrence }) {
  const { event } = occ;
  const start = new Date(occ.start);
  const p = laParts(start);
  const dow = new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay();
  const venue = typeof event.venue === "object" ? (event.venue as Venue) : undefined;
  const category = (event.categories ?? []).find((c): c is EventCategory => typeof c === "object");
  const img = mediaSrc(event.cover, "thumbnail");
  const time = event.allDay ? "All day" : `${formatTime(occ.start)}${occ.end ? ` – ${formatTime(occ.end)}` : ""}`;
  const where = [venue?.name, venue?.address].filter(Boolean).join(", ");
  return (
    <article className="grid grid-cols-[64px_minmax(0,1fr)] gap-4 rounded-card border border-teal-50 bg-white p-4 sm:grid-cols-[64px_minmax(0,1fr)_120px]">
      <div className="flex h-fit flex-col items-center rounded-button bg-teal-50 py-2 text-center" aria-hidden="true">
        <span className="eyebrow text-[11px] text-ink-500">{DOW[dow]}</span>
        <span className="font-heading text-[26px] font-bold leading-none text-teal-700">{p.day}</span>
        <span className="eyebrow text-[11px] text-ink-500">{MON[p.month - 1]}</span>
      </div>
      <div className="min-w-0">
        <p className="eyebrow text-xs text-coral-700">
          <time dateTime={occ.start}>{time}</time>
          {category && <> · {category.name}</>}
        </p>
        <h3 className="mt-1 font-heading text-[19px] leading-snug">
          <Link href={`/event/${event.slug}/`} className="text-ink-900 hover:text-teal-700">
            {event.title}
          </Link>
        </h3>
        <p className="mt-1 text-small text-ink-500">{[where, event.cost].filter(Boolean).join(" · ")}</p>
      </div>
      {img ? (
        <Image
          src={img.src}
          alt=""
          width={img.width}
          height={img.height}
          sizes="120px"
          className="hidden aspect-[4/3] w-[120px] rounded-button object-cover sm:block"
        />
      ) : (
        <div className="hidden aspect-[4/3] w-[120px] rounded-button bg-teal-50 sm:block" aria-hidden="true" />
      )}
    </article>
  );
}
