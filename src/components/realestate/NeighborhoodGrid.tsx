import Image from "next/image";
import Link from "next/link";

import { mediaSrc } from "@/lib/media";
import type { Neighborhood } from "@/payload-types";

/** Photo tiles linking to the neighborhood pages. */
export function NeighborhoodGrid({ hoods }: { hoods: Neighborhood[] }) {
  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {hoods.map((n) => {
        const img = mediaSrc(n.hero, "card");
        return (
          <li key={n.id}>
            <Link href={`/${n.slug}/`} className="group relative block aspect-[4/3] overflow-hidden rounded-card bg-teal-700">
              {img && (
                <Image
                  src={img.src}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 33vw, 50vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              )}
              <span className="absolute inset-0 bg-gradient-to-t from-ink-900/80 to-transparent" aria-hidden="true" />
              <span className="absolute bottom-3 left-4 right-4 font-heading text-[20px] text-white md:text-[24px]">{n.name}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
