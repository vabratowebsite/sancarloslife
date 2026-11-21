"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Muted Vimeo background loop layered over the poster image. The poster stays
 * the LCP element; the iframe only mounts after the page has loaded, on screens
 * 768px and wider, and never when the visitor prefers reduced motion. A pause
 * button satisfies WCAG 2.2.2 (moving content longer than 5 seconds).
 */
export function HeroVideo({ vimeoId }: { vimeoId: string }) {
  const [mount, setMount] = useState(false);
  const [playing, setPlaying] = useState(true);
  // The iframe stays transparent until Vimeo reports playback, so the poster
  // shows while it loads and if Vimeo is blocked or slow.
  const [visible, setVisible] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!mount) return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== "https://player.vimeo.com" || typeof e.data !== "string")
        return;
      try {
        const msg = JSON.parse(e.data) as { event?: string };
        if (msg.event === "ready") {
          frame.current?.contentWindow?.postMessage(
            JSON.stringify({ method: "addEventListener", value: "play" }),
            "https://player.vimeo.com",
          );
        }
        if (msg.event === "play") setVisible(true);
      } catch {
        /* not a player message */
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [mount]);

  useEffect(() => {
    const wide = window.matchMedia("(min-width: 768px)");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!wide.matches || calm.matches) return;
    const start = () => setMount(true);
    if (document.readyState === "complete") {
      const t = setTimeout(start, 300);
      return () => clearTimeout(t);
    }
    window.addEventListener("load", start, { once: true });
    return () => window.removeEventListener("load", start);
  }, []);

  const toggle = () => {
    frame.current?.contentWindow?.postMessage(
      JSON.stringify({ method: playing ? "pause" : "play" }),
      "https://player.vimeo.com",
    );
    setPlaying(!playing);
  };

  if (!mount || !/^\d+$/.test(vimeoId)) return null;
  return (
    <>
      <div
        className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`}
        aria-hidden="true"
      >
        <iframe
          ref={frame}
          src={`https://player.vimeo.com/video/${vimeoId}?background=1&muted=1&autoplay=1&loop=1&dnt=1`}
          title="Background video of San Carlos"
          tabIndex={-1}
          allow="autoplay; fullscreen"
          className="absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2 border-0"
        />
      </div>
      {visible && (
        <button
          type="button"
          onClick={toggle}
          className="absolute bottom-4 right-4 z-10 rounded-button bg-ink-900/70 px-3 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-ink-900"
        >
          {playing ? "Pause video" : "Play video"}
        </button>
      )}
    </>
  );
}
