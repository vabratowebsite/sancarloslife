import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { RichText } from "@/components/content/RichText";
import { PostCard } from "@/components/content/PostCard";
import { EventRow } from "@/components/events/EventRow";
import { YouTubeGrid } from "@/components/media/YouTubeGrid";
import { PlaceCard } from "@/components/places/PlaceCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { fromLA, laParts } from "@/lib/events/recurrence";
import { mediaSrc } from "@/lib/media";
import { listParks } from "@/lib/queries/community";
import { listOccurrences } from "@/lib/queries/events";
import { listPlaces } from "@/lib/queries/places";
import { listPosts } from "@/lib/queries/posts";
import type { Page, Post } from "@/payload-types";

export type LayoutBlock = NonNullable<Page["layout"]>[number];
type B<T extends LayoutBlock["blockType"]> = Extract<LayoutBlock, { blockType: T }>;

const btn = "eyebrow inline-flex items-center rounded-button border-2 px-6 py-3 no-underline transition-colors";
const isExternal = (href: string) => /^https?:\/\//.test(href);

function SmartLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return isExternal(href) ? (
    <a href={href} className={className} rel="noopener">
      {children}
    </a>
  ) : (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

/** Section wrapper: optional anchor, eyebrow, heading and "see all" link. Alternating bands are set by the renderer. */
function Section({
  block,
  band,
  children,
  more,
}: {
  block: { id?: string | null; anchor?: string | null; eyebrow?: string | null; heading?: string | null };
  band: boolean;
  children: ReactNode;
  more?: { label?: string | null; href?: string | null } | null;
}) {
  const hid = block.heading ? `h-${block.id ?? block.anchor}` : undefined;
  return (
    <section id={block.anchor || undefined} aria-labelledby={hid} className={`scroll-mt-24 py-12 md:py-14 ${band ? "bg-sand-100" : ""}`}>
      <div className="container-site">
        {(block.heading || more?.href) && (
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              {block.eyebrow && <p className="eyebrow text-teal-700">{block.eyebrow}</p>}
              {block.heading && (
                <h2 id={hid} className="mt-1 text-h2">
                  {block.heading}
                </h2>
              )}
            </div>
            {more?.href && more.label && (
              <SmartLink href={more.href} className="font-bold">
                {more.label} <span aria-hidden="true">→</span>
              </SmartLink>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

function Stats({ block, band }: { block: B<"stats">; band: boolean }) {
  return (
    <Section block={block} band={band}>
      <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {(block.items ?? []).map((s) => (
          <div key={s.id ?? s.label} className="flex flex-col-reverse rounded-card bg-white p-5 shadow-card">
            <dt className="mt-1 text-small text-ink-500">{s.label}</dt>
            <dd className="font-heading text-[30px] leading-tight text-teal-700">{s.value}</dd>
          </div>
        ))}
      </dl>
      {block.note && <p className="mt-3 text-xs text-ink-500">{block.note}</p>}
    </Section>
  );
}

function FeatureList({ block, band }: { block: B<"featureList">; band: boolean }) {
  return (
    <Section block={block} band={band}>
      {block.intro && <p className="mb-6 max-w-3xl text-ink-500">{block.intro}</p>}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(block.items ?? []).map((f) => (
          <li key={f.id ?? f.title} className="rounded-card border-t-4 border-teal-700 bg-white p-5 shadow-card">
            <h3 className="font-heading text-[20px]">{f.title}</h3>
            {f.text && <p className="mt-2 text-ink-500">{f.text}</p>}
          </li>
        ))}
      </ul>
    </Section>
  );
}

const gridCls = "grid grid-cols-[minmax(0,1fr)] gap-gutter sm:grid-cols-2 lg:grid-cols-3";

async function CardGrid({ block, band }: { block: B<"cardGrid">; band: boolean }) {
  const limit = block.limit ?? 6;
  let body: ReactNode = null;
  switch (block.source) {
    case "restaurants":
    case "shops": {
      const places = (await listPlaces(block.source === "restaurants" ? "restaurants" : "shops", { sort: "featured" })).slice(0, limit);
      body = (
        <ul className={gridCls}>
          {places.map((p) => (
            <li key={p.id} className="flex min-w-0">
              <PlaceCard place={p} />
            </li>
          ))}
        </ul>
      );
      break;
    }
    case "events": {
      const p = laParts(new Date());
      const from = fromLA(p.year, p.month, p.day);
      const occ = (await listOccurrences({ from: from.toISOString(), to: new Date(from.getTime() + 60 * 86400000).toISOString() })).slice(0, limit);
      body = occ.length ? (
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
          {occ.map((o) => (
            <li key={`${o.event.id}-${o.start}`} className="min-w-0">
              <EventRow occ={o} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-ink-500">
          Nothing on the calendar yet. <Link href="/events/submit/">Submit an event</Link>.
        </p>
      );
      break;
    }
    case "parks": {
      const parks = (await listParks()).slice(0, limit);
      body = (
        <ul className={gridCls}>
          {parks.map((park) => {
            const img = mediaSrc(park.cover, "card");
            return (
              <li key={park.id} className="flex min-w-0 flex-col overflow-hidden rounded-card bg-white shadow-card">
                {img && <Image src={img.src} alt="" width={img.width} height={img.height} sizes="(min-width: 1024px) 380px, 100vw" className="aspect-[3/2] object-cover" />}
                <div className="p-5">
                  <h3 className="font-heading text-[20px]">
                    <Link href={`/parks-of-san-carlos/#${park.slug}`} className="text-ink-900 hover:text-teal-700">
                      {park.name}
                    </Link>
                  </h3>
                  {park.summary && <p className="mt-2 line-clamp-3 text-ink-500">{park.summary}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      );
      break;
    }
    case "posts": {
      const posts = ((await listPosts({ page: 1 })).docs as Post[]).slice(0, limit);
      body = (
        <ul className={gridCls}>
          {posts.map((p) => (
            <li key={p.id} className="flex min-w-0">
              <PostCard post={p} />
            </li>
          ))}
        </ul>
      );
      break;
    }
    default:
      body = (
        // Four cards sit in one row on wide screens instead of leaving an orphan.
        <ul className={(block.cards ?? []).length === 4 ? `${gridCls} lg:grid-cols-4` : gridCls}>
          {(block.cards ?? []).map((c) => {
            const img = mediaSrc(c.image, "card");
            return (
              <li key={c.id ?? c.href} className="group relative flex min-w-0 flex-col overflow-hidden rounded-card bg-white shadow-card">
                {img && (
                  <div className="aspect-[3/2] overflow-hidden bg-teal-50">
                    <Image src={img.src} alt="" width={img.width} height={img.height} sizes="(min-width: 1024px) 380px, 100vw" className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-heading text-[20px]">
                    {/* The whole card is clickable through the stretched link. */}
                    <SmartLink href={c.href} className="text-ink-900 no-underline after:absolute after:inset-0 hover:text-teal-700">
                      {c.title}
                    </SmartLink>
                  </h3>
                  {c.text && <p className="mt-2 flex-1 text-ink-500">{c.text}</p>}
                  <p className="mt-3 font-bold text-teal-700" aria-hidden="true">
                    {c.label} →
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      );
  }
  return (
    <Section block={block} band={band} more={block.more}>
      {block.intro && <p className="mb-6 max-w-3xl text-ink-500">{block.intro}</p>}
      {body}
    </Section>
  );
}

function Cta({ block }: { block: B<"cta"> }) {
  const teal = block.tone !== "sand";
  return (
    <section id={block.anchor || undefined} className={`scroll-mt-24 py-14 ${teal ? "bg-teal-700 text-white" : "bg-sand-100"}`}>
      <div className="container-site max-w-3xl text-center">
        <h2 className={`text-h2 ${teal ? "text-white" : ""}`}>{block.heading}</h2>
        {block.text && <p className={`mt-3 ${teal ? "text-white" : "text-ink-500"}`}>{block.text}</p>}
        {!!block.buttons?.length && (
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            {block.buttons.map((b, i) => (
              <SmartLink
                key={b.id ?? b.href}
                href={b.href}
                className={
                  teal
                    ? `${btn} ${i === 0 ? "border-white bg-white text-teal-700 hover:bg-teal-50" : "border-white text-white hover:bg-white hover:text-teal-700"}`
                    : `${btn} ${i === 0 ? "border-teal-700 bg-teal-700 text-white hover:bg-teal-500" : "border-teal-700 text-teal-700 hover:bg-white"}`
                }
              >
                {b.label}
              </SmartLink>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Faq({ block, band }: { block: B<"faq">; band: boolean }) {
  const items = block.items ?? [];
  return (
    <Section block={block} band={band}>
      <div className="max-w-3xl divide-y divide-teal-50 rounded-card bg-white shadow-card">
        {items.map((f) => (
          <details key={f.id ?? f.question} className="group p-5">
            <summary className="cursor-pointer list-none font-bold marker:hidden">
              <span className="flex items-start justify-between gap-4">
                {f.question}
                <span className="text-teal-700 transition-transform group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </span>
            </summary>
            <p className="mt-3 whitespace-pre-line text-ink-500">{f.answer}</p>
          </details>
        ))}
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
        }}
      />
    </Section>
  );
}

function Gallery({ block, band }: { block: B<"gallery">; band: boolean }) {
  return (
    <Section block={block} band={band}>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {(block.photos ?? []).map((m, i) => {
          const img = mediaSrc(m, "card");
          return img ? (
            <li key={typeof m === "object" ? m.id : i}>
              <Image src={img.src} alt={img.alt} width={img.width} height={img.height} sizes="(min-width: 768px) 33vw, 50vw" className="aspect-[4/3] w-full rounded-card object-cover" />
            </li>
          ) : null;
        })}
      </ul>
    </Section>
  );
}

/**
 * Renders a page's layout sections in order. Sections without their own
 * background alternate white and sand so long pages keep a rhythm.
 */
export async function BlockRenderer({ blocks }: { blocks: Page["layout"] }) {
  if (!blocks?.length) return null;
  let n = 0;
  const out: ReactNode[] = [];
  for (const block of blocks) {
    const band = n++ % 2 === 1;
    const key = block.id ?? `${block.blockType}-${n}`;
    switch (block.blockType) {
      case "prose":
        out.push(
          <Section key={key} block={block} band={band}>
            <RichText data={block.content} className="max-w-3xl" />
          </Section>,
        );
        break;
      case "stats":
        out.push(<Stats key={key} block={block} band={band} />);
        break;
      case "featureList":
        out.push(<FeatureList key={key} block={block} band={band} />);
        break;
      case "cardGrid":
        out.push(<CardGrid key={key} block={block} band={band} />);
        break;
      case "cta":
        n = 0; // a coloured band resets the alternation
        out.push(<Cta key={key} block={block} />);
        break;
      case "faq":
        out.push(<Faq key={key} block={block} band={band} />);
        break;
      case "video":
        out.push(
          <Section key={key} block={block} band={band}>
            <YouTubeGrid single videos={[{ youtubeId: block.youtubeId, title: block.title }]} />
          </Section>,
        );
        break;
      case "image": {
        const img = mediaSrc(block.image, "hero");
        if (img)
          out.push(
            <figure key={key} className={`py-10 ${band ? "bg-sand-100" : ""}`}>
              <div className="container-site">
                <Image src={img.src} alt={img.alt} width={img.width} height={img.height} sizes="(min-width: 1200px) 1200px, 100vw" className="w-full max-w-4xl rounded-card" />
                {block.caption && <figcaption className="mt-2 text-small text-ink-500">{block.caption}</figcaption>}
              </div>
            </figure>,
          );
        break;
      }
      case "gallery":
        out.push(<Gallery key={key} block={block} band={band} />);
        break;
    }
  }
  return <>{out}</>;
}
