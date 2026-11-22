"use client";

import { useState } from "react";

import { YouTubeLite } from "./YouTubeLite";

/** The live site's video sliders: one large video with the others as thumbnails below. */
export function VideoSlider({ ids, label }: { ids: string[]; label: string }) {
  const [current, setCurrent] = useState(0);
  if (ids.length === 1) return <YouTubeLite id={ids[0]} title={label} />;
  return (
    <div>
      <YouTubeLite key={ids[current]} id={ids[current]} title={`${label}, video ${current + 1} of ${ids.length}`} />
      <ul className="mt-2 grid grid-cols-4 gap-2">
        {ids.map((id, i) => (
          <li key={id}>
            <button
              type="button"
              onClick={() => setCurrent(i)}
              aria-pressed={i === current}
              aria-label={`Show video ${i + 1} of ${ids.length}`}
              className={`block w-full overflow-hidden rounded-button border-2 ${i === current ? "border-teal-700" : "border-transparent opacity-80 hover:opacity-100"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://i.ytimg.com/vi/${id}/mqdefault.jpg`} alt="" loading="lazy" className="aspect-video w-full object-cover" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
