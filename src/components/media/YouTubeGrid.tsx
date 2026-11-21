"use client";

import { useState } from "react";

type Video = { youtubeId: string; title: string };

/**
 * Thumbnails that turn into a player when chosen. Nothing loads from YouTube
 * until a visitor clicks (privacy and page speed).
 */
export function YouTubeGrid({ videos }: { videos: Video[] }) {
  const [playing, setPlaying] = useState<string | null>(null);
  return (
    <ul className="grid gap-gutter sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((v) => (
        <li key={v.youtubeId} className="overflow-hidden rounded-card bg-white shadow-card">
          {playing === v.youtubeId ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}?autoplay=1&rel=0`}
              title={v.title}
              allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="aspect-video w-full"
            />
          ) : (
            <button type="button" onClick={() => setPlaying(v.youtubeId)} className="group relative block aspect-video w-full" aria-label={`Play: ${v.title}`}>
              {/* eslint-disable-next-line @next/next/no-img-element -- YouTube thumbnails, not our media */}
              <img src={`https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`} alt="" loading="lazy" className="size-full object-cover" />
              <span className="absolute inset-0 flex items-center justify-center bg-ink-900/20 group-hover:bg-ink-900/35" aria-hidden="true">
                <span className="flex size-14 items-center justify-center rounded-full bg-white/90 text-teal-700">▶</span>
              </span>
            </button>
          )}
          <p className="p-4 text-small">{v.title}</p>
        </li>
      ))}
    </ul>
  );
}
