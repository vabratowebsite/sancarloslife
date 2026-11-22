"use client";

import { useState } from "react";

/**
 * A YouTube video that shows its thumbnail and loads the player only when clicked, so
 * pages with several videos stay fast and nothing from YouTube loads until the visitor asks.
 */
export function YouTubeLite({ id, title }: { id: string; title?: string }) {
  const [play, setPlay] = useState(false);
  const label = title || "Video";
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-card bg-ink-900">
      {play ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?rel=0&autoplay=1`}
          title={label}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          className="h-full w-full"
        />
      ) : (
        <button type="button" onClick={() => setPlay(true)} className="group absolute inset-0 h-full w-full" aria-label={`Play video: ${label}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" className="h-full w-full object-cover" />
          <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ink-900/75 text-white transition group-hover:bg-teal-700" aria-hidden>
            <svg viewBox="0 0 24 24" className="ml-1 h-8 w-8 fill-current">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
