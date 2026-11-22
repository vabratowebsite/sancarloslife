"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * The live site's WP Go Maps maps (neighborhood outlines and places), rebuilt without a map
 * library: OpenStreetMap tiles in Web Mercator plus an SVG layer. Drag to move, +/− to zoom;
 * each neighborhood links to its page; places are focusable pins with their name.
 * Data: src/content/maps/map-<id>.json (from the live site's WP Go Maps REST API).
 */
export type MapPolygon = { title: string; fill: string; hover: string; line: string; opacity: number; href: string; points: [number, number][] };
export type MapMarker = { title: string; address?: string; lat: number; lng: number; href?: string };

const TILE = 256;
const lon2x = (lng: number, z: number) => ((lng + 180) / 360) * TILE * 2 ** z;
const lat2y = (lat: number, z: number) => {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * TILE * 2 ** z;
};

export function SiteMap({ polygons, markers = [], height = 560, label }: { polygons: MapPolygon[]; markers?: MapMarker[]; height?: number; label: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1100);
  const [hover, setHover] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  const bounds = useMemo(() => {
    const pts = [...polygons.flatMap((p) => p.points), ...markers.map((m) => [m.lat, m.lng] as [number, number])];
    const lats = pts.map((p) => p[0]);
    const lngs = pts.map((p) => p[1]);
    return { n: Math.max(...lats), s: Math.min(...lats), e: Math.max(...lngs), w: Math.min(...lngs) };
  }, [polygons, markers]);

  const fitZoom = useMemo(() => {
    for (let z = 17; z > 10; z--) {
      const w = lon2x(bounds.e, z) - lon2x(bounds.w, z);
      const h = lat2y(bounds.s, z) - lat2y(bounds.n, z);
      if (w < width * 0.92 && h < height * 0.9) return z;
    }
    return 11;
  }, [bounds, width, height]);

  const [zoom, setZoom] = useState<number | null>(null);
  const z = zoom ?? fitZoom;
  const center = { lat: (bounds.n + bounds.s) / 2, lng: (bounds.e + bounds.w) / 2 };
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // World pixel of the view's top-left corner.
  const cx = lon2x(center.lng, z) - offset.x;
  const cy = lat2y(center.lat, z) - offset.y;
  const left = Math.round(cx - width / 2);
  const top = Math.round(cy - height / 2);
  // Rounded so the server and the browser draw identical coordinates (no hydration mismatch).
  const px = (lat: number, lng: number) => [Math.round((lon2x(lng, z) - left) * 10) / 10, Math.round((lat2y(lat, z) - top) * 10) / 10] as const;

  const tiles: { x: number; y: number; key: string }[] = [];
  const max = 2 ** z;
  for (let tx = Math.floor(left / TILE); tx <= Math.floor((left + width) / TILE); tx++)
    for (let ty = Math.floor(top / TILE); ty <= Math.floor((top + height) / TILE); ty++)
      if (ty >= 0 && ty < max) tiles.push({ x: tx, y: ty, key: `${z}/${tx}/${ty}` });

  const centroid = (pts: [number, number][]) => {
    const xs = pts.map((p) => px(p[0], p[1]));
    return [xs.reduce((a, b) => a + b[0], 0) / xs.length, xs.reduce((a, b) => a + b[1], 0) / xs.length];
  };

  const zoomBy = (d: number) => {
    const nz = Math.min(18, Math.max(11, z + d));
    setOffset((o) => ({ x: o.x * 2 ** (nz - z), y: o.y * 2 ** (nz - z) }));
    setZoom(nz);
  };

  return (
    <div className="not-prose">
      <div
        ref={box}
        className="relative select-none overflow-hidden rounded-card border border-ink-500/20 bg-sand-100 touch-none"
        style={{ height }}
        role="group"
        aria-label={label}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("a,button")) return;
          drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (d) setOffset({ x: d.ox + e.clientX - d.x, y: d.oy + e.clientY - d.y });
        }}
        onPointerUp={() => (drag.current = null)}
      >
        {tiles.map((t) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={t.key}
            src={`https://tile.openstreetmap.org/${z}/${((t.x % max) + max) % max}/${t.y}.png`}
            alt=""
            width={TILE}
            height={TILE}
            draggable={false}
            className="absolute max-w-none"
            style={{ left: t.x * TILE - left, top: t.y * TILE - top }}
          />
        ))}
        <svg className="absolute inset-0" width={width} height={height} aria-hidden={polygons.length === 0}>
          {polygons.map((p) => {
            const d = p.points.map(([la, lo], i) => `${i ? "L" : "M"}${px(la, lo).join(",")}`).join("") + "Z";
            const on = hover === p.title;
            const shape = (
              <path
                d={d}
                fill={on ? p.hover : p.fill}
                fillOpacity={on ? Math.max(p.opacity, 0.6) : p.opacity}
                stroke={p.line}
                strokeOpacity={0.7}
                strokeWidth={on ? 2.5 : 1.5}
                onMouseEnter={() => setHover(p.title)}
                onMouseLeave={() => setHover(null)}
              />
            );
            return p.href ? (
              <a key={p.title} href={p.href} aria-label={`${p.title} neighborhood`} onFocus={() => setHover(p.title)} onBlur={() => setHover(null)}>
                {shape}
              </a>
            ) : (
              <g key={p.title}>{shape}</g>
            );
          })}
          {polygons.length > 1 &&
            polygons.map((p) => {
              const [x, y] = centroid(p.points);
              return (
                <text key={`l-${p.title}`} x={x} y={y} textAnchor="middle" className="pointer-events-none fill-ink-900 font-heading text-[15px] uppercase tracking-wide" style={{ paintOrder: "stroke", stroke: "white", strokeWidth: 3 }}>
                  {p.title}
                </text>
              );
            })}
        </svg>
        {markers.map((m, i) => {
          const [x, y] = px(m.lat, m.lng);
          if (x < -20 || y < -20 || x > width + 20 || y > height + 20) return null;
          return (
            <div key={i} className="absolute" style={{ left: x, top: y, transform: "translate(-50%, -100%)" }}>
              <button
                type="button"
                className="grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-teal-700 text-[10px] font-bold text-white shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900"
                aria-label={m.title}
                aria-expanded={open === i}
                onClick={() => setOpen(open === i ? null : i)}
              >
                •
              </button>
              {open === i && (
                <div className="absolute bottom-8 left-1/2 z-10 w-56 -translate-x-1/2 rounded-card bg-white p-3 text-left text-sm shadow-card">
                  <p className="font-bold text-ink-900">{m.title}</p>
                  {m.address && <p className="text-ink-500">{m.address}</p>}
                </div>
              )}
            </div>
          );
        })}
        <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-md bg-white shadow-card">
          <button type="button" className="h-9 w-9 text-lg text-ink-900 hover:bg-teal-50" onClick={() => zoomBy(1)} aria-label="Zoom in">
            +
          </button>
          <button type="button" className="h-9 w-9 border-t border-ink-500/20 text-lg text-ink-900 hover:bg-teal-50" onClick={() => zoomBy(-1)} aria-label="Zoom out">
            −
          </button>
        </div>
        <p className="absolute bottom-0 right-0 bg-white/80 px-2 py-0.5 text-[11px] text-ink-500">
          ©{" "}
          <a href="https://www.openstreetmap.org/copyright" className="underline" target="_blank" rel="noopener noreferrer">
            OpenStreetMap
          </a>{" "}
          contributors
        </p>
      </div>
      {polygons.length > 1 && (
        <ul className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
          {polygons.map((p) => (
            <li key={p.title}>
              <a href={p.href} className="inline-flex min-h-6 items-center gap-2 font-heading uppercase tracking-wide text-teal-700 hover:underline">
                <span className="inline-block h-3 w-3 rounded-sm" style={{ background: p.hover }} aria-hidden />
                {p.title}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
