import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { PostCard } from "@/components/content/PostCard";
import { EventRow } from "@/components/events/EventRow";
import { YouTubeGrid } from "@/components/media/YouTubeGrid";
import { PlaceCard } from "@/components/places/PlaceCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { fromLA, laParts } from "@/lib/events/recurrence";
import { mediaSrc } from "@/lib/media";
import { listParks, listTestimonials } from "@/lib/queries/community";
import { listOccurrences } from "@/lib/queries/events";
import { listPlaces } from "@/lib/queries/places";
import { listPosts } from "@/lib/queries/posts";
import { telHref } from "@/lib/queries/settings";
import type { Post } from "@/payload-types";

/**
 * Building blocks for pages written in code (home, About, Explore, Viv & Mark).
 * Each takes plain props; pages pass their own copy. Sections alternate
 * white and sand through the `band` prop.
 */

export type Img = { src: string; width: number; height: number; alt?: string };
export type LinkItem = { label: string; href: string };

const btn = "eyebrow inline-flex items-center rounded-button border-2 px-6 py-3 no-underline transition-colors";
const gridCls = "grid grid-cols-[minmax(0,1fr)] gap-gutter sm:grid-cols-2 lg:grid-cols-3";
const isExternal = (href: string) => /^https?:\/\//.test(href);

export function SmartLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
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

type SectionProps = { id?: string; eyebrow?: string; heading?: string; band?: boolean; more?: LinkItem; children: ReactNode };

/** A page section: optional anchor id, eyebrow, heading and "see all" link. */
export function Section({ id, eyebrow, heading, band, more, children }: SectionProps) {
  const hid = heading ? `h-${id ?? heading.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` : undefined;
  return (
    <section id={id} aria-labelledby={hid} className={`scroll-mt-24 py-12 md:py-14 ${band ? "bg-sand-100" : ""}`}>
      <div className="container-site">
        {(heading || more) && (
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              {eyebrow && <p className="eyebrow text-teal-700">{eyebrow}</p>}
              {heading && (
                <h2 id={hid} className="mt-1 text-h2">
                  {heading}
                </h2>
              )}
            </div>
            {more && (
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

/** Body copy in the site's prose style. */
export function Prose({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`prose max-w-3xl ${className}`}>{children}</div>;
}

export function Stats({ items, note }: { items: { value: string; label: string }[]; note?: string }) {
  return (
    <>
      <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {items.map((s) => (
          <div key={s.label} className="flex flex-col-reverse rounded-card bg-white p-5 shadow-card">
            <dt className="mt-1 text-small text-ink-500">{s.label}</dt>
            <dd className="font-heading text-[30px] leading-tight text-teal-700">{s.value}</dd>
          </div>
        ))}
      </dl>
      {note && <p className="mt-3 text-xs text-ink-500">{note}</p>}
    </>
  );
}

export function FeatureList({ intro, items }: { intro?: string; items: { title: string; text?: string }[] }) {
  return (
    <>
      {intro && <p className="mb-6 max-w-3xl text-ink-500">{intro}</p>}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((f) => (
          <li key={f.title} className="rounded-card border-t-4 border-teal-700 bg-white p-5 shadow-card">
            <h3 className="font-heading text-[20px]">{f.title}</h3>
            {f.text && <p className="mt-2 text-ink-500">{f.text}</p>}
          </li>
        ))}
      </ul>
    </>
  );
}

export type Card = { title: string; text?: string; image?: Img; label: string; href: string };

/** Link cards; four cards sit in one row on wide screens. */
export function CardGrid({ cards }: { cards: Card[] }) {
  return (
    <ul className={cards.length === 4 ? `${gridCls} lg:grid-cols-4` : gridCls}>
      {cards.map((c) => (
        <li key={c.href} className="group relative flex min-w-0 flex-col overflow-hidden rounded-card bg-white shadow-card">
          {c.image && (
            <div className="aspect-[3/2] overflow-hidden bg-teal-50">
              <Image
                src={c.image.src}
                alt=""
                width={c.image.width}
                height={c.image.height}
                sizes="(min-width: 1024px) 380px, 100vw"
                className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
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
      ))}
    </ul>
  );
}

/** Upcoming events, next 60 days. */
export async function UpcomingEvents({ limit = 4 }: { limit?: number }) {
  const p = laParts(new Date());
  const from = fromLA(p.year, p.month, p.day);
  const occ = (await listOccurrences({ from: from.toISOString(), to: new Date(from.getTime() + 60 * 86400000).toISOString() })).slice(0, limit);
  if (!occ.length)
    return (
      <p className="text-ink-500">
        Nothing on the calendar yet. <Link href="/events/submit/">Submit an event</Link>.
      </p>
    );
  return (
    <ul className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
      {occ.map((o) => (
        <li key={`${o.event.id}-${o.start}`} className="min-w-0">
          <EventRow occ={o} />
        </li>
      ))}
    </ul>
  );
}

export async function FeaturedPlaces({ kind = "restaurants", limit = 6 }: { kind?: "restaurants" | "shops"; limit?: number }) {
  const places = (await listPlaces(kind, { sort: "featured" })).slice(0, limit);
  return (
    <ul className={gridCls}>
      {places.map((p) => (
        <li key={p.id} className="flex min-w-0">
          <PlaceCard place={p} />
        </li>
      ))}
    </ul>
  );
}

export async function ParkCards({ limit = 6 }: { limit?: number }) {
  const parks = (await listParks()).slice(0, limit);
  return (
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
}

export async function LatestPosts({ limit = 3 }: { limit?: number }) {
  const posts = ((await listPosts({ page: 1 })).docs as Post[]).slice(0, limit);
  return (
    <ul className={gridCls}>
      {posts.map((p) => (
        <li key={p.id} className="flex min-w-0">
          <PostCard post={p} />
        </li>
      ))}
    </ul>
  );
}

/** A full-width coloured band with a heading and up to three buttons. */
export function Cta({ id, heading, text, buttons, tone = "teal" }: { id?: string; heading: string; text?: string; buttons: LinkItem[]; tone?: "teal" | "sand" }) {
  const teal = tone === "teal";
  return (
    <section id={id} className={`scroll-mt-24 py-14 ${teal ? "bg-teal-700 text-white" : "bg-sand-100"}`}>
      <div className="container-site max-w-3xl text-center">
        <h2 className={`text-h2 ${teal ? "text-white" : ""}`}>{heading}</h2>
        {text && <p className={`mt-3 ${teal ? "text-white" : "text-ink-500"}`}>{text}</p>}
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          {buttons.map((b, i) => (
            <SmartLink
              key={b.href}
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
      </div>
    </section>
  );
}

/** Expandable questions, with FAQPage structured data. */
export function Faq({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <>
      <div className="max-w-3xl divide-y divide-teal-50 rounded-card bg-white shadow-card">
        {items.map((f) => (
          <details key={f.question} className="group p-5">
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
    </>
  );
}

export function Video({ youtubeId, title }: { youtubeId: string; title: string }) {
  return <YouTubeGrid single videos={[{ youtubeId, title }]} />;
}

export function Figure({ image, caption }: { image: Img; caption?: string }) {
  return (
    <figure>
      <Image src={image.src} alt={image.alt ?? ""} width={image.width} height={image.height} sizes="(min-width: 1200px) 900px, 100vw" className="w-full max-w-4xl rounded-card" />
      {caption && <figcaption className="mt-2 text-small text-ink-500">{caption}</figcaption>}
    </figure>
  );
}

export type Person = { name: string; role?: string; photo?: Img; bio?: string; license?: string; phone?: string; email?: string };

export function Team({ people }: { people: Person[] }) {
  return (
    <ul className="grid gap-gutter md:grid-cols-2">
      {people.map((person) => (
        <li key={person.name} className="flex min-w-0 flex-col overflow-hidden rounded-card bg-white shadow-card sm:flex-row md:flex-col lg:flex-row">
          {person.photo && (
            <Image
              src={person.photo.src}
              alt={person.name}
              width={person.photo.width}
              height={person.photo.height}
              sizes="(min-width: 1024px) 220px, 100vw"
              className="aspect-[4/5] w-full object-cover sm:w-56 md:w-full lg:w-56"
            />
          )}
          <div className="flex min-w-0 flex-1 flex-col p-6">
            <h3 className="font-heading text-[26px] leading-tight">{person.name}</h3>
            {person.role && <p className="eyebrow mt-1 text-xs text-teal-700">{person.role}</p>}
            {person.bio && <p className="mt-3 whitespace-pre-line text-ink-500">{person.bio}</p>}
            <dl className="mt-4 grid gap-1 text-small">
              {person.license && (
                <div>
                  <dt className="sr-only">License</dt>
                  <dd className="text-ink-500">{person.license}</dd>
                </div>
              )}
              {person.phone && (
                <div>
                  <dt className="sr-only">Phone</dt>
                  <dd>
                    <a href={telHref(person.phone)}>{person.phone}</a>
                  </dd>
                </div>
              )}
              {person.email && (
                <div>
                  <dt className="sr-only">Email</dt>
                  <dd>
                    <a href={`mailto:${person.email}`}>{person.email}</a>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Client testimonials from the Testimonials collection (still edited in the admin). */
export async function Testimonials({ limit = 6, featuredOnly = false }: { limit?: number; featuredOnly?: boolean }) {
  const items = await listTestimonials(featuredOnly, limit);
  return (
    <ul className="columns-1 gap-gutter md:columns-2 lg:columns-3">
      {items.map((t) => {
        const [headline, place] = (t.context ?? "").split(" · ");
        return (
          <li key={t.id} className="mb-gutter break-inside-avoid">
            <figure className="rounded-card bg-white p-6 shadow-card">
              {headline && <p className="font-heading text-[20px] leading-snug text-teal-700">{headline}</p>}
              <blockquote className="mt-3 whitespace-pre-line text-ink-900">{t.quote}</blockquote>
              <figcaption className="eyebrow mt-4 text-xs text-ink-500">
                {t.author}
                {place && <> · {place}</>}
              </figcaption>
            </figure>
          </li>
        );
      })}
    </ul>
  );
}

/** The heading band at the top of a code page. */
export function PageHero({ title, subheading, image, crumbs }: { title: string; subheading?: string; image?: Img; crumbs: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-teal-50">
      {image && <Image src={image.src} alt="" fill priority sizes="100vw" className="object-cover opacity-25" />}
      <div className="container-site relative py-14">
        {crumbs}
        <h1 className="mt-3 max-w-4xl text-h2 md:text-h1">{title}</h1>
        {subheading && <p className="mt-4 max-w-2xl text-ink-500">{subheading}</p>}
      </div>
    </section>
  );
}
