import type { ReactNode } from "react";

import { HeroVideo } from "@/components/home/HeroVideo";
import { IdxEmbed } from "@/components/realestate/IdxEmbed";
import { localHref, wpImage, wpImagesInHtml } from "@/lib/divi/media";
import { sanitizeLayout } from "@/lib/sanitize";

import { SiteMap, type MapMarker, type MapPolygon } from "./SiteMap";
import { MAPS } from "./maps";
import { YouTubeLite } from "./YouTubeLite";

/**
 * Renders a page from its WordPress (Divi) layout file (src/content/divi/<slug>.json,
 * made by scripts/migrate/95-divi-layouts.py): the live site's sections, rows, columns and
 * modules in their original order, with our design tokens. Text is sanitized again here.
 */
type Btn = { text: string; href: string };
type Item = { t: string; hide?: string[]; [k: string]: unknown };
type Col = { w: string; items: Item[] };
type Row = { cols: Col[]; hide?: string[] };
type Section = { rows: Row[]; full?: boolean; id?: string; hide?: string[]; bg?: string; veil?: "white" | "sand" };
export type DiviLayout = { slug: string; title: string; sections: Section[]; banner?: string };

const NEIGHBORHOODS: Record<string, string> = {
  "alder manor": "/alder-manor/",
  "beverley terrace": "/beverly-terrace/",
  "beverly terrace": "/beverly-terrace/",
  "clearfield park": "/clearfield-park/",
  cordes: "/cordes/",
  "el sereno": "/el-sereno/",
  "howard park": "/howard-park/",
};

const vis = (hide?: string[]) =>
  hide?.includes("desktop") && hide.includes("phone") ? "hidden" : hide?.includes("desktop") ? "md:hidden" : hide?.includes("phone") ? "hidden md:block" : "";

// Links to the old site become site-relative; WordPress photo addresses keep their host.
const clean = (html: unknown) => sanitizeLayout(wpImagesInHtml(String(html ?? "")).replace(/https?:\/\/(?:www\.)?sancarloslife\.com(?=\/(?!wp-content\/))/g, ""));
const ENTITIES: Record<string, string> = { amp: "&", nbsp: " ", quot: '"', "#39": "'", rsquo: "’", lsquo: "‘", ndash: "–", mdash: "—" };
const plain = (html: unknown) =>
  String(html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(amp|nbsp|quot|#39|rsquo|lsquo|ndash|mdash);/g, (_, e: string) => ENTITIES[e])
    .replace(/\s+/g, " ")
    .trim();

/** A module's look from the live stylesheet (scripts/migrate/divi_styles.py), already mapped to tokens. */
type Part = { f?: string; s?: number; ps?: number; w?: string; c?: string; tt?: string; ta?: string; ls?: number; bl?: number; blc?: string; bg?: string };
type Look = Record<string, Part>;

const size = (s: number, ps?: number) => (s <= 18 ? `${s}px` : `clamp(${ps ?? Math.max(16, Math.round(s * 0.68))}px, ${(s / 13.66).toFixed(2)}vw, ${s}px)`);

function partVars(prefix: string, p: Part | undefined, out: Record<string, string>) {
  if (!p) return;
  if (p.f) out[`--${prefix}-f`] = `var(--font-${p.f})`;
  if (p.s) out[`--${prefix}-s`] = size(p.s, p.ps);
  if (p.w) out[`--${prefix}-w`] = p.w;
  if (p.c) out[`--${prefix}-c`] = p.c === "white" ? "white" : `var(--color-${p.c})`;
  if (p.tt) out[`--${prefix}-tt`] = p.tt;
  if (p.ls) out[`--${prefix}-ls`] = `${p.ls}px`;
}

function lookStyle(look?: Look): { style?: Record<string, string>; className: string } {
  if (!look) return { className: "" };
  const v: Record<string, string> = {};
  partVars("b", look.b, v);
  for (const h of ["h1", "h2", "h3", "h4", "h5", "h6"]) partVars(h, look[h], v);
  if (look.t) partVars("h4", look.t, v);
  const m = look.m ?? {};
  const ta = m.ta ?? look.b?.ta;
  if (ta) v.textAlign = ta;
  let className = "divi-look";
  if (m.bl) {
    className += " border-l-2 pl-4";
    v.borderLeftColor = `var(--color-${m.blc ?? "teal-500"})`;
  }
  if (m.bg) {
    className += " rounded-card p-5";
    v.backgroundColor = m.bg === "white" ? "white" : `var(--color-${m.bg})`;
  }
  return { style: v, className };
}

function Html({ html, className = "", look }: { html: unknown; className?: string; look?: Look }) {
  const l = lookStyle(look);
  return <div className={`divi-text ${l.className} ${className}`} style={l.style} dangerouslySetInnerHTML={{ __html: clean(html) }} />;
}

function Button({ b }: { b: Btn }) {
  if (!b?.text) return null;
  return (
    <a
      href={localHref(b.href)}
      className="inline-flex min-h-11 items-center justify-center rounded-button border-2 border-teal-700 bg-teal-700 px-7 py-2 font-label text-base uppercase tracking-wide text-white transition hover:bg-white hover:text-teal-700"
    >
      {b.text}
    </a>
  );
}

function YouTube({ id, title }: { id: string; title?: string }) {
  return <YouTubeLite id={id} title={title} />;
}

function Module({ it, ctx }: { it: Item; ctx: Ctx }): ReactNode {
  switch (it.t) {
    case "heading": {
      const L = `h${Math.min(6, Math.max(2, Number(it.level) || 2))}` as "h2";
      return <L className="text-center font-heading text-h3 text-ink-900">{String(it.text)}</L>;
    }
    case "text":
      return <Html html={it.html} look={it.look as Look | undefined} />;
    case "image": {
      const src = wpImage(String(it.src));
      if (!src) return null;
      // eslint-disable-next-line @next/next/no-img-element
      const img = <img src={src} alt={String(it.alt ?? "")} loading="lazy" className="h-auto w-full rounded-card" />;
      return it.href ? <a href={localHref(String(it.href))}>{img}</a> : img;
    }
    case "button":
      return (
        <div className="text-center">
          <Button b={it as unknown as Btn} />
        </div>
      );
    case "blurb": {
      const body = (
        <>
          {it.img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={wpImage(String(it.img))} alt="" loading="lazy" className="mx-auto mb-3 h-16 w-16 object-contain" />
          ) : null}
          {it.title ? (
            <h4 className="divi-look mb-2 font-heading text-h4 uppercase text-ink-900" style={lookStyle({ b: (it.look as Look | undefined)?.t ?? (it.look as Look | undefined)?.h4 ?? {} }).style}>
              {String(it.title)}
            </h4>
          ) : null}
          <Html html={it.html} className="text-small" look={it.look ? { b: (it.look as Look).b ?? {} } : undefined} />
        </>
      );
      return <div className="text-center">{it.href ? <a href={localHref(String(it.href))}>{body}</a> : body}</div>;
    }
    case "gallery": {
      const imgs = (it.images as { src: string; alt: string }[]) ?? [];
      if (!imgs.length) return null;
      return it.slider ? (
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2" tabIndex={0} aria-label="Photo gallery, scroll sideways">
          {imgs.map((g, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={wpImage(g.src)} alt={g.alt} loading="lazy" className="h-72 w-auto max-w-none snap-start rounded-card object-cover md:h-96" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {imgs.map((g, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={wpImage(g.src)} alt={g.alt} loading="lazy" className="aspect-[4/3] w-full rounded-card object-cover" />
          ))}
        </div>
      );
    }
    case "timeline": {
      type Story = { year: string; when?: string; title: string; img: string; alt: string; html: string; side: string };
      const stories = (it.items as Story[]) ?? [];
      if (it.horizontal) {
        // The live page shows these as a sliding row, three at a time, along a line.
        return (
          <ol className="flex snap-x snap-mandatory gap-5 overflow-x-auto border-t-2 border-teal-500 pb-4 pt-6" tabIndex={0} aria-label="Annual timeline, scroll sideways">
            {stories.map((st, i) => (
              <li key={i} className="w-[85%] shrink-0 snap-start sm:w-[calc(50%-0.7rem)] lg:w-[calc(33.333%-0.85rem)]">
                <p className="font-label text-2xl uppercase leading-none text-teal-700">{st.year}</p>
                {st.when ? <p className="mb-3 mt-1 text-small text-ink-500">{st.when}</p> : null}
                <div className="overflow-hidden rounded-card bg-white shadow-card">
                  {st.img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={wpImage(st.img)} alt={st.alt} loading="lazy" className="aspect-[16/11] w-full object-cover" />
                  ) : null}
                  <div className="space-y-2 p-4">
                    {st.title ? <h3 className="font-sans text-lg font-bold text-ink-900">{st.title}</h3> : null}
                    <Html html={st.html} className="text-small" />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        );
      }
      const card = (st: Story, i: number) => (
        <li key={i} className="overflow-hidden rounded-card bg-white shadow-card">
          <p className="bg-teal-700 px-4 py-2 font-label text-2xl text-white">{st.year}</p>
          {st.img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={wpImage(st.img)} alt={st.alt} loading="lazy" className="w-full" />
          ) : null}
          <div className="space-y-2 p-4">
            {st.title ? <h3 className="font-sans text-lg font-bold text-ink-900">{st.title}</h3> : null}
            <Html html={st.html} className="text-small" />
          </div>
        </li>
      );
      // The live timeline packs stories into two columns either side of a line (Cool Timeline
      // "right" stories sit in the left column). Phones read them in order.
      const left = stories.filter((s) => s.side === "right");
      const right = stories.filter((s) => s.side !== "right");
      return (
        <div className="rounded-card bg-teal-50 p-4 md:p-6">
          {it.title ? <h2 className="mb-5 font-heading text-h2 uppercase text-ink-900">{String(it.title)}</h2> : null}
          <ol className="space-y-5 md:hidden">{stories.map(card)}</ol>
          <div className="relative hidden gap-10 md:grid md:grid-cols-2">
            <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-ink-900" aria-hidden />
            <ol className="space-y-6">{left.map(card)}</ol>
            <ol className="space-y-6 pt-10">{right.map(card)}</ol>
          </div>
        </div>
      );
    }
    case "cards": {
      const cards = (it.items as { title: string; href: string; img: string; alt: string; tags: string[][]; more: boolean; html?: string }[]) ?? [];
      return (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c, i) => (
            <li key={`${i}-${c.title}`} className="group relative">
              {c.img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={wpImage(c.img)} alt={c.alt} loading="lazy" className="aspect-square w-full object-cover transition group-hover:opacity-90" />
              ) : null}
              <h3 className="mt-3 font-label text-lg uppercase leading-tight text-ink-900">
                {c.href ? (
                  <a href={localHref(c.href)} className="text-ink-900 after:absolute after:inset-0 hover:text-teal-700">
                    {c.title}
                  </a>
                ) : (
                  c.title
                )}
              </h3>
              {c.html ? <Html html={c.html} className="mt-1 text-small" /> : null}
              {c.tags.length ? <p className="mt-1 text-small text-ink-500">{c.tags.map((g) => g.join(", ")).join(" | ")}</p> : null}
              {c.more ? <p className="mt-1 font-label text-sm uppercase text-teal-700">Read more →</p> : null}
            </li>
          ))}
        </ul>
      );
    }
    case "collage": {
      // The live page scatters these photos over a mural; phones get a tidy two-column grid.
      const imgs = (it.images as { src: string; alt: string; box: [number, number, number, number] }[]) ?? [];
      return (
        <>
          <div className="relative hidden w-full md:block" style={{ aspectRatio: String(it.ratio) }}>
            {imgs.map((g, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={wpImage(g.src)}
                alt={g.alt}
                loading="lazy"
                className="absolute border-[6px] border-white object-cover shadow-card"
                style={{ left: `${g.box[0]}%`, top: `${g.box[1]}%`, width: `${g.box[2]}%`, height: `${g.box[3]}%` }}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 md:hidden">
            {imgs.map((g, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={wpImage(g.src)} alt={g.alt} loading="lazy" className="aspect-[3/4] w-full border-4 border-white object-cover shadow-card" />
            ))}
          </div>
        </>
      );
    }
    case "video":
      return <YouTube id={String(it.id)} />;
    case "videos":
      return (
        <div className="grid gap-4 md:grid-cols-2">
          {(it.ids as string[]).map((id) => (
            <YouTube key={id} id={id} />
          ))}
        </div>
      );
    case "toggle":
      return (
        <details className="divi-toggle" open={Boolean(it.open)}>
          <summary>{String(it.title)}</summary>
          <Html html={it.html} />
        </details>
      );
    case "accordion":
      return (
        <div className="space-y-2">
          {(it.items as Item[]).map((x, i) => (
            <Module key={i} it={x} ctx={ctx} />
          ))}
        </div>
      );
    case "cta": {
      const name = plain(it.html).toLowerCase();
      if (it.bg) {
        const b = it.button as Btn | null;
        const href = b?.href ? localHref(b.href) : NEIGHBORHOODS[name];
        return (
          <a
            href={href}
            className="group relative flex h-full min-h-[300px] flex-col justify-end overflow-hidden bg-ink-900 bg-cover bg-center text-center md:min-h-[340px]"
            style={{ backgroundImage: `url(${wpImage(String(it.bg))})` }}
          >
            <span className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-ink-900/0 to-ink-900/0 transition group-hover:from-ink-900/80" aria-hidden />
            <span className="relative mb-6 block bg-white/75 px-3 py-4 font-heading text-[1.35rem] uppercase leading-tight text-ink-900">{plain(it.title || it.html)}</span>
            <span className="relative mb-5 block font-label text-sm uppercase tracking-wider text-white underline-offset-4 group-hover:underline">{b?.text || "Browse"}</span>
          </a>
        );
      }
      const btn = (it.button as Btn | null) ?? (NEIGHBORHOODS[name] ? { text: "", href: NEIGHBORHOODS[name] } : null);
      const box = (
        <div className="flex h-full flex-col items-center justify-center gap-3 rounded-card bg-teal-50 p-5 text-center">
          {it.title ? <h3 className="font-heading text-h4 uppercase text-ink-900">{String(it.title)}</h3> : null}
          {it.html ? <Html html={it.html} className="font-heading uppercase tracking-wide" /> : null}
          {btn?.text ? <Button b={btn} /> : null}
        </div>
      );
      return btn && !btn.text ? (
        <a href={btn.href} className="block h-full transition hover:-translate-y-0.5 hover:shadow-card">
          {box}
        </a>
      ) : (
        box
      );
    }
    case "divider":
      return <hr className="mx-auto my-2 w-full border-ink-500/20" />;
    case "counter":
      return (
        <div className="text-center">
          <p className="font-heading text-[clamp(2.2rem,4vw,3.1rem)] font-bold leading-tight text-ink-900">
            {String(it.prefix ?? "")}
            {String(it.number)}
            {String(it.suffix ?? "")}
          </p>
          <p className="mx-auto mt-2 w-fit border-t-2 border-teal-500 pt-2 font-label text-[1.5rem] uppercase leading-none text-teal-700">{String(it.title)}</p>
        </div>
      );
    case "map": {
      const id = String(it.id);
      if (id === "29" && ctx.maps.has("18")) return null; // phone copy of the neighborhood map
      ctx.maps.add(id);
      const m = MAPS[id];
      if (!m) return null;
      return <SiteMap polygons={m.polygons as MapPolygon[]} markers={m.markers as MapMarker[]} label={`Map of ${ctx.title}`} />;
    }
    case "listings":
      return <IdxEmbed widget="results" filterId={ctx.filterId} label={`${ctx.title} homes for sale`} />;
    case "posts":
      return (
        <p className="text-center">
          <Button b={{ text: "Read the latest stories", href: "/san-carlos-life-blog/" }} />
        </p>
      );
    case "embed":
      return null; // background videos are drawn by the hero; other embeds are not carried over
    case "slider":
      return (
        <div className="grid gap-4 md:grid-cols-2">
          {(it.slides as { title: string; html: string; button: Btn | null }[]).map((s, i) => (
            <div key={i} className="rounded-card bg-teal-50 p-6 text-center">
              <h3 className="mb-2 font-heading text-h4 text-ink-900">{s.title}</h3>
              <Html html={s.html} />
              {s.button ? <Button b={s.button} /> : null}
            </div>
          ))}
        </div>
      );
    default:
      return null;
  }
}

type Ctx = { title: string; maps: Set<string>; filterId?: string | null };

const frac = (w: string) => {
  const [a, b] = w.split("/").map(Number);
  return b ? a / b : 1;
};

/** A row of photo link boxes (CTAs with a background) runs edge to edge with no gaps, as on the live site. */
const isPhotoRow = (cols: Col[]) => cols.length > 1 && cols.every((c) => c.items.length === 1 && c.items[0].t === "cta" && c.items[0].bg);

function Columns({ cols, ctx, parent = "1/1" }: { cols: Col[]; ctx: Ctx; parent?: string }) {
  if (isPhotoRow(cols)) {
    return (
      <div className={`grid grid-cols-2 ${cols.length === 5 ? "md:grid-cols-5" : cols.length === 3 || cols.length === 6 ? "md:grid-cols-3" : "md:grid-cols-4"}`}>
        {cols.map((c, i) => (
          <Module key={i} it={c.items[0]} ctx={ctx} />
        ))}
      </div>
    );
  }
  // Divi sizes inner columns against the page (1/4 inside a 1/2 column is half of it).
  const within = frac(parent);
  return (
    <div className="-mx-4 flex flex-wrap gap-y-6">
      {cols.map((c, i) => (
        <div key={i} className="w-full space-y-5 px-4 md:w-[var(--w)]" style={{ ["--w" as string]: `${Math.min(100, (frac(c.w) / within) * 100)}%` }}>
          {c.items.map((it, j) =>
            it.t === "row" ? (
              <div key={j} className={vis(it.hide)}>
                <Columns cols={(it as unknown as Row).cols} ctx={ctx} parent={c.w} />
              </div>
            ) : (
              <div key={j} className={vis(it.hide)}>
                <Module it={it} ctx={ctx} />
              </div>
            ),
          )}
        </div>
      ))}
    </div>
  );
}

const veil = (v?: string) => (v === "white" ? "rgb(255 255 255 / 80%)" : "color-mix(in srgb, var(--color-sand-100) 90%, transparent)");

function Banner({ title, image }: { title: string; image: string }) {
  return (
    <section
      className="relative isolate flex min-h-[200px] items-center justify-center overflow-hidden bg-sand-100 bg-cover bg-center md:min-h-[220px]"
      style={{ backgroundImage: `linear-gradient(color-mix(in srgb, var(--color-ink-900) 57%, transparent), var(--color-teal-500)), url(${wpImage(image)})` }}
    >
      <h1 className="container-site py-10 text-center font-sans text-[clamp(2.2rem,5vw,4rem)] font-normal leading-tight text-white [text-shadow:0_2px_10px_rgb(0_0_0/35%)]">{title}</h1>
    </section>
  );
}

function Hero({ title, vimeo, poster }: { title: string; vimeo?: string; poster?: string }) {
  return (
    <section
      className="relative isolate flex min-h-[260px] items-center justify-center overflow-hidden bg-ink-900 bg-cover bg-center md:min-h-[460px]"
      style={poster ? { backgroundImage: `url(${wpImage(poster)})` } : undefined}
    >
      {vimeo ? (
        <div className="absolute inset-0 -z-10 opacity-90">
          <HeroVideo vimeoId={vimeo} />
        </div>
      ) : null}
      <div className="absolute inset-0 -z-10 bg-ink-900/30" aria-hidden />
      <h1 className="container-site text-center font-sans text-[clamp(2.4rem,6vw,4.5rem)] font-light text-white [text-shadow:0_2px_12px_rgb(0_0_0/45%)]">{title}</h1>
    </section>
  );
}

export function DiviPage({ layout, filterId = null }: { layout: DiviLayout; filterId?: string | null }) {
  // Short name for labels: the banner title ("Alder Manor"), not the long SEO page title.
  const heroTitle = layout.sections.flatMap((s) => s.rows.flatMap((r) => r.cols.flatMap((c) => c.items))).find((x) => x.t === "hero")?.title;
  const ctx: Ctx = { title: heroTitle ? String(heroTitle) : layout.title, maps: new Set(), filterId };
  const secs = layout.sections;
  const heroAt = secs.findIndex((s) => s.rows.some((r) => r.cols.some((c) => c.items.some((i) => i.t === "hero"))));
  return (
    <article>
      {layout.banner && heroAt < 0 ? <Banner title={layout.title} image={layout.banner} /> : null}
      {secs.map((s, i) => {
        const items = s.rows.flatMap((r) => r.cols.flatMap((c) => c.items));
        const hero = items.find((x) => x.t === "hero");
        if (hero) {
          const embed = items.find((x) => x.t === "embed" && String(x.src).includes("vimeo"));
          const vimeo = embed ? String(embed.src).match(/video\/(\d+)/)?.[1] : undefined;
          return <Hero key={i} title={String(hero.title)} vimeo={vimeo} poster={hero.poster ? String(hero.poster) : undefined} />;
        }
        // The phone-only title above a video banner repeats the banner's title.
        if (heroAt === i + 1 && items.length === 1 && /^<h1/i.test(String(items[0].html ?? "").trim())) return null;
        if (s.rows.length === 1 && isPhotoRow(s.rows[0].cols)) {
          return (
            <section key={i} id={s.id} className={vis(s.hide)}>
              <Columns cols={s.rows[0].cols} ctx={ctx} />
            </section>
          );
        }
        return (
          <section
            key={i}
            id={s.id}
            className={`relative isolate py-10 md:py-14 ${s.bg ? "bg-cover bg-center" : ""} ${vis(s.hide)}`}
            style={s.bg ? { backgroundImage: `linear-gradient(${veil(s.veil)}, ${veil(s.veil)}), url(${wpImage(s.bg)})` } : undefined}
          >
            <div className={s.rows.some((r) => r.cols.some((c) => c.items.some((x) => x.t === "collage"))) ? "space-y-8 px-2" : "container-site space-y-8"}>
              {s.rows.map((r, j) => (
                <div key={j} className={vis(r.hide)}>
                  <Columns cols={r.cols} ctx={ctx} />
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </article>
  );
}
