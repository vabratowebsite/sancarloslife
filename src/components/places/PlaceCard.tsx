import Image from "next/image";
import Link from "next/link";

import { mediaSrc } from "@/lib/media";
import { placePath, STREETS } from "@/lib/queries/places";
import type { Place } from "@/payload-types";

export function PlaceCard({ place, priority = false }: { place: Place; priority?: boolean }) {
  const img = mediaSrc(place.cover, "card");
  const href = placePath(place);
  const meta = [place.street ? STREETS[place.street] : null, place.priceRange, (place.cuisines ?? []).slice(0, 2).join(", ")].filter(Boolean);
  const tags = [...(place.meals ?? []), ...(place.features ?? [])].slice(0, 3);
  return (
    <article className="flex flex-col overflow-hidden rounded-card bg-white shadow-card">
      <Link href={href} className="relative block aspect-[3/2] overflow-hidden bg-teal-50" tabIndex={-1} aria-hidden="true">
        {img && (
          <Image src={img.src} alt="" width={img.width} height={img.height} priority={priority} sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw" className="size-full object-cover" />
        )}
        {place.featured && <span className="eyebrow absolute left-3 top-3 rounded-full bg-coral-700 px-2.5 py-1 text-[11px] text-white">Featured</span>}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-heading text-[20px] leading-snug">
          <Link href={href} className="text-ink-900 hover:text-teal-700">
            {place.name}
          </Link>
        </h3>
        {meta.length > 0 && <p className="mt-1 text-small text-ink-500">{meta.join(" · ")}</p>}
        {tags.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Good for">
            {tags.map((t) => (
              <li key={t} className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs text-teal-700">
                {t}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
