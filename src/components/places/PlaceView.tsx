import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { RichText } from "@/components/content/RichText";
import { SiteMap } from "@/components/divi/SiteMap";
import { YouTubeLite } from "@/components/divi/YouTubeLite";
import { JsonLd } from "@/components/seo/JsonLd";
import { mediaSrc } from "@/lib/media";
import { closedDays, formatSlot, hoursJsonLd, shortDays, type Day, type HoursRow } from "@/lib/places/hours";
import { listPlaces, placePath, STREETS } from "@/lib/queries/places";
import { absolute } from "@/lib/seo";
import type { Media, Place } from "@/payload-types";

import { OpenNow } from "./OpenNow";

/**
 * Restaurant and shop page, design B ("Quick guide", owner's choice): photo mosaic, name and
 * one-line facts, tabs, a sticky action card (open now, Call, Directions, Website…), then
 * Overview, Menu or Shop, Photos, Hours & map, Reviews, FAQ and More nearby. Every part is
 * optional: places without the Quick guide fields fall back to their WordPress text and hours.
 */
const youtubeId = (url: string) => url.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/)?.[1];
const media = (m: number | Media | null | undefined): Media | null => (m && typeof m === "object" ? m : null);
const tel = (p: string) => p.replace(/[^\d+]/g, "");

type Photo = { m: Media; alt: string };

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 flex-none fill-current">
      <path d={d} />
    </svg>
  );
}
const ICONS = {
  phone: "M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z",
  pin: "M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z",
  globe: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 6h-2.95a15.7 15.7 0 0 0-1.38-3.56A8 8 0 0 1 18.9 8zM12 4.04A13.9 13.9 0 0 1 13.91 8h-3.82A13.9 13.9 0 0 1 12 4.04zM4.26 14a8.2 8.2 0 0 1 0-4h3.38a16.5 16.5 0 0 0 0 4zm.84 2h2.95a15.7 15.7 0 0 0 1.38 3.56A8 8 0 0 1 5.1 16zM8.05 8H5.1a8 8 0 0 1 4.33-3.56A15.7 15.7 0 0 0 8.05 8zM12 19.96A13.9 13.9 0 0 1 10.09 16h3.82A13.9 13.9 0 0 1 12 19.96zM14.34 14H9.66a14.7 14.7 0 0 1 0-4h4.68a14.7 14.7 0 0 1 0 4zm.25 5.56A15.7 15.7 0 0 0 15.95 16h2.95a8 8 0 0 1-4.31 3.56zM16.36 14a16.5 16.5 0 0 0 0-4h3.38a8.2 8.2 0 0 1 0 4z",
  star: "M12 17.3 18.2 21l-1.6-7 5.4-4.7-7.2-.6L12 2 9.2 8.7l-7.2.6 5.4 4.7-1.6 7z",
  check: "M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z",
  info: "M11 7h2v2h-2zm0 4h2v6h-2zm1-9a10 10 0 1 0 0 20 10 10 0 0 0 0-20z",
};

type Action = { label: string; href: string; icon: keyof typeof ICONS; external: boolean };

function ActionButton({ a, main, compact }: { a: Action; main?: boolean; compact?: boolean }) {
  return (
    <a
      href={a.href}
      {...(a.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`flex min-h-11 items-center justify-center gap-2 rounded-button border-2 px-3 font-label uppercase tracking-wide transition ${
        compact ? "flex-1 text-xs" : "w-full text-sm"
      } ${main ? "border-teal-700 bg-teal-700 text-white hover:bg-white hover:text-teal-700" : "border-teal-700 bg-white text-teal-700 hover:bg-teal-50"}`}
    >
      <Icon d={ICONS[a.icon]} />
      <span className="truncate">{a.label}</span>
    </a>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-28 border-t border-ink-500/15 pt-8">
      <h2 id={`${id}-h`} className="mb-4 font-heading text-h3 text-ink-900">
        {title}
      </h2>
      {children}
    </section>
  );
}

export async function PlaceView({ place }: { place: Place }) {
  const isFood = place.type === "restaurant" || place.type === "bar";
  const g = place.guide ?? {};
  const path = placePath(place);
  const links = place.links ?? [];
  const address = place.address || "";
  const street = address.split(",")[0];
  const mapsHref = place.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name}, ${address || "San Carlos, CA"}`)}`;
  const rows: HoursRow[] = (place.openingHours ?? []).map((r) => ({
    days: r.days,
    dow: (r.dow ?? []) as Day[],
    slots: (r.slots ?? []).map((s) => ({ opens: s.opens, closes: s.closes })),
  }));
  const categories = g.categories?.length ? g.categories : isFood ? (place.cuisines ?? []) : [];
  const items = (g.items ?? []).filter((x) => x.name);
  const itemsTitle = g.itemsTitle || (isFood ? "Menu highlights" : "What you'll find");
  const itemsTab = isFood ? "Menu" : "Shop";

  // Photos: cover first, then the gallery and item photos, each once.
  const seen = new Set<number>();
  const photos: Photo[] = [];
  const add = (m: Media | null, alt?: string | null) => {
    if (m && !seen.has(m.id) && mediaSrc(m)) {
      seen.add(m.id);
      photos.push({ m, alt: alt || m.alt || place.name });
    }
  };
  add(media(place.cover));
  (place.gallery ?? []).forEach((m) => add(media(m)));
  items.forEach((x) => add(media(x.image), x.name));
  const mosaic = photos.slice(0, 5);
  const gallery = photos;

  // Action card: main button, Call, Directions, Website, then reservation/order links.
  const actions: Action[] = [];
  if (g.primaryAction?.label && g.primaryAction.url) actions.push({ label: g.primaryAction.label, href: g.primaryAction.url, icon: "star", external: true });
  for (const l of links.filter((l) => l.kind === "reserve" || l.kind === "order").slice(0, actions.length ? 1 : 2))
    if (!actions.some((a) => a.href === l.url)) actions.push({ label: l.label, href: l.url, icon: "star", external: true });
  if (place.phone) actions.push({ label: "Call", href: `tel:${tel(place.phone)}`, icon: "phone", external: false });
  actions.push({ label: "Directions", href: mapsHref, icon: "pin", external: true });
  if (place.website) actions.push({ label: "Website", href: place.website, icon: "globe", external: true });

  const facts: [string, ReactNode][] = [];
  if (address)
    facts.push([
      "Address",
      <a key="a" href={mapsHref} target="_blank" rel="noopener noreferrer">
        {address}
      </a>,
    ]);
  if (place.phone)
    facts.push([
      "Phone",
      <a key="p" href={`tel:${tel(place.phone)}`}>
        {place.phone}
      </a>,
    ]);
  if (categories.length) facts.push(["Type", categories.join(", ")]);
  if (place.priceRange) facts.push(["Price", place.priceRange]);
  if (place.email)
    facts.push([
      "Email",
      <a key="e" href={`mailto:${place.email}`}>
        {place.email}
      </a>,
    ]);
  const online = links.filter((l) => l.kind === "web" || l.kind === "reviews");
  if (online.length)
    facts.push([
      "Online",
      <span key="o" className="flex flex-wrap gap-x-2">
        {online.map((l) => (
          <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer">
            {l.label}
          </a>
        ))}
      </span>,
    ]);

  const story = (g.story ?? []).filter((s) => s.heading || s.text);
  const hasOverview = Boolean(g.summary || g.goodFor?.length || story.length || place.body);
  const reviews = g.reviews ?? {};
  const hasReviews = Boolean(reviews.praise?.length || reviews.notes?.length);
  const faq = (g.faq ?? []).filter((f) => f.question && f.answer);
  const videos = (place.videos ?? []).map(youtubeId).filter((x): x is string => Boolean(x)).slice(0, 4);

  // More nearby: the editor's list, else other places on the same street.
  const related =
    g.related?.length
      ? g.related.map((r) => ({ label: r.label, url: r.url, note: r.note ?? "" }))
      : (await listPlaces(isFood ? "restaurants" : "shops", place.street ? { street: place.street } : {}))
          .filter((p) => p.id !== place.id)
          .slice(0, 4)
          .map((p) => ({ label: p.name, url: placePath(p), note: [p.street ? STREETS[p.street] : "", p.priceRange].filter(Boolean).join(" · ") }));

  const tabs = [
    hasOverview && ["overview", "Overview"],
    items.length && ["items", itemsTab],
    gallery.length > 1 && ["photos", "Photos"],
    ["visit", "Hours & map"],
    hasReviews && ["reviews", "Reviews"],
    faq.length && ["faq", "FAQ"],
  ].filter(Boolean) as [string, string][];

  const checked = g.checkedAt ? new Date(g.checkedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/Los_Angeles" }) : null;
  const listPath = isFood ? "/restaurants-and-services/all-restaurants/" : "/restaurants-and-services/all-shops-services/";
  const listName = isFood ? "All Restaurants" : "All Shops & Services";

  const sameAs = links.filter((l) => /facebook|instagram|yelp|tripadvisor|tiktok|x\.com|twitter/.test(l.url)).map((l) => l.url);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": g.schemaType || (place.type === "bar" ? "BarOrPub" : isFood ? "Restaurant" : "Store"),
    "@id": `${absolute(path)}#business`,
    name: place.name,
    description: g.summary || undefined,
    url: absolute(path),
    image: photos.slice(0, 3).map((p) => absolute(mediaSrc(p.m)!.src)),
    telephone: place.phone || undefined,
    email: place.email || undefined,
    priceRange: place.priceRange || undefined,
    servesCuisine: isFood && place.cuisines?.length ? place.cuisines : undefined,
    address: street
      ? { "@type": "PostalAddress", streetAddress: street, addressLocality: "San Carlos", addressRegion: "CA", postalCode: "94070", addressCountry: "US" }
      : undefined,
    geo: place.lat && place.lng ? { "@type": "GeoCoordinates", latitude: place.lat, longitude: place.lng } : undefined,
    hasMap: mapsHref,
    openingHoursSpecification: rows.length ? hoursJsonLd(rows) : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
  };
  const faqLd = faq.length
    ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })) }
    : null;

  return (
    <article className="container-site pb-28 pt-6 md:pb-16">
      <Breadcrumbs
        items={[
          { name: "Restaurants & Services", path: "/restaurants-and-services/" },
          { name: listName, path: listPath },
          { name: place.name, path },
        ]}
      />

      {place.businessStatus !== "open" && place.businessStatus ? (
        <p className="mt-4 rounded-card border border-coral-500 bg-white px-4 py-3 text-ink-900">
          <b className="block font-label uppercase tracking-wide text-coral-700">{place.businessStatus === "closed" ? "Permanently closed" : "Temporarily closed"}</b>
          Please check before you go.
        </p>
      ) : null}

      {/* Photo mosaic: one large photo and up to four smaller ones; phones show three. */}
      {mosaic.length ? (
        <div
          className={`relative mt-5 grid gap-1.5 overflow-hidden rounded-card ${
            mosaic.length === 1 ? "grid-cols-1" : "grid-cols-2 md:grid-cols-[2fr_1fr_1fr] md:grid-rows-2"
          }`}
        >
          {mosaic.map((p, i) => {
            const src = mediaSrc(p.m, i === 0 ? "hero" : "card")!;
            return (
              <figure
                key={p.m.id}
                className={`relative m-0 ${i === 0 ? (mosaic.length === 1 ? "aspect-[21/9]" : "col-span-2 aspect-[16/10] md:col-span-1 md:row-span-2 md:aspect-auto md:min-h-[420px]") : "aspect-[4/3]"} ${
                  i >= 3 ? "hidden md:block" : ""
                } ${mosaic.length < 4 && i > 0 ? "md:col-span-2" : ""}`}
              >
                <Image src={src.src} alt={p.alt} fill priority={i === 0} sizes={i === 0 ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 50vw"} className="object-cover" />
              </figure>
            );
          })}
          {gallery.length > 1 ? (
            <a href="#photos" className="absolute bottom-3 right-3 rounded-full bg-white px-4 py-2 text-small font-bold text-ink-900 shadow-card">
              See all {gallery.length} photos
            </a>
          ) : null}
        </div>
      ) : (
        <p className="mt-5 flex aspect-[3/1] items-center justify-center rounded-card border border-dashed border-ink-500/30 bg-sand-100 p-4 text-center text-ink-500">
          Photos of {place.name} coming soon.
        </p>
      )}

      <header className="mt-6">
        <p className="eyebrow text-teal-700">
          {isFood ? (place.type === "bar" ? "Bar" : "Restaurant") : place.type === "service" ? "Service" : "Shop"}
          {g.area || (place.street && STREETS[place.street]) ? <span className="text-ink-500"> · {(g.area || STREETS[place.street!]).split(",")[0]}</span> : null}
        </p>
        <h1 className="mt-1 font-heading text-h2 text-ink-900 md:text-h1">{place.name}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-500">
          {[categories.slice(0, 3).join(" · "), place.priceRange, street].filter(Boolean).map((t, i) => (
            <span key={i} className="flex items-center gap-3">
              {i > 0 ? <span aria-hidden>•</span> : null}
              {t}
            </span>
          ))}
        </p>
        {g.tagline ? <p className="mt-2 max-w-3xl text-lg text-ink-900">{g.tagline}</p> : null}
      </header>

      <nav aria-label="On this page" className="sticky top-0 z-20 -mx-4 mt-6 flex gap-1 overflow-x-auto border-b border-ink-500/20 bg-white px-4 [scrollbar-width:none]">
        {tabs.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="flex min-h-11 flex-none items-center border-b-[3px] border-transparent px-3 text-small font-bold text-ink-500 hover:border-teal-500 hover:text-ink-900">
            {label}
          </a>
        ))}
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <aside aria-label={`${place.name}: hours and contact`} className="h-fit rounded-card bg-teal-50 p-5 lg:sticky lg:top-16 lg:col-start-2 lg:row-start-1">
          {rows.length && place.businessStatus === "open" ? <OpenNow rows={rows} /> : null}
          <div className="mt-4 hidden flex-col gap-2 md:flex">
            {actions.map((a, i) => (
              <ActionButton key={a.href} a={a} main={i === 0} />
            ))}
          </div>
          <dl className="mt-5 grid gap-3 text-small">
            {facts.map(([k, v]) => (
              <div key={k}>
                <dt className="eyebrow text-xs text-ink-500">{k}</dt>
                <dd className="text-ink-900 [&_a]:text-teal-700 [&_a]:underline">{v}</dd>
              </div>
            ))}
          </dl>
        </aside>

        <div className="min-w-0 space-y-10 lg:col-start-1 lg:row-start-1">
          {hasOverview ? (
            <Section id="overview" title={`About ${place.name}`}>
              {g.summary ? (
                <div className="rounded-card border-l-4 border-teal-500 bg-sand-100 p-5">
                  <p className="eyebrow text-xs text-teal-700">In short</p>
                  <p className="mt-1 text-ink-900">{g.summary}</p>
                </div>
              ) : null}
              {g.goodFor?.length ? (
                <ul aria-label="Good for" className="mt-4 flex flex-wrap gap-2">
                  {g.goodFor.map((x) => (
                    <li key={x} className="rounded-full border border-teal-500/40 bg-white px-3 py-1 text-small text-ink-900">
                      {x}
                    </li>
                  ))}
                </ul>
              ) : null}
              {story.length ? (
                <div className="mt-6 space-y-3">
                  {story.map((s) => (
                    <div key={s.heading}>
                      <h3 className="font-heading text-h4 text-ink-900">{s.heading}</h3>
                      {s.text
                        .split(/\n\s*\n/)
                        .filter(Boolean)
                        .map((para, i) => (
                          <p key={i} className="mt-2 text-ink-900">
                            {para}
                          </p>
                        ))}
                    </div>
                  ))}
                </div>
              ) : place.body ? (
                <div className="mt-6">
                  <RichText data={place.body} />
                </div>
              ) : null}
            </Section>
          ) : null}

          {items.length ? (
            <Section id="items" title={itemsTitle}>
              <ul className="divide-y divide-ink-500/15 border-y border-ink-500/15">
                {items.map((x) => {
                  const img = mediaSrc(media(x.image), "card");
                  return (
                    <li key={x.name} className="flex items-center gap-4 py-4">
                      {img ? (
                        <Image src={img.src} alt={media(x.image)?.alt || x.name} width={img.width} height={img.height} sizes="132px" className="aspect-[3/2] w-24 flex-none rounded-button object-cover md:w-[132px]" />
                      ) : null}
                      <div>
                        <h3 className="font-sans text-lg font-bold text-ink-900">{x.name}</h3>
                        {x.description ? <p className="mt-1 text-ink-900">{x.description}</p> : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
              {g.alsoTry?.length ? (
                <p className="mt-4 text-ink-900">
                  <b>{isFood ? "Also worth ordering:" : "Also here:"}</b> {g.alsoTry.join("; ")}.
                </p>
              ) : null}
            </Section>
          ) : null}

          {gallery.length > 1 ? (
            <Section id="photos" title="Photos">
              <ul className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {gallery.map((p) => {
                  const img = mediaSrc(p.m, "card")!;
                  return (
                    <li key={p.m.id}>
                      <a href={mediaSrc(p.m)!.src} target="_blank" rel="noopener">
                        <Image src={img.src} alt={p.alt} width={img.width} height={img.height} sizes="(min-width: 768px) 260px, 50vw" className="aspect-[3/2] w-full rounded-button object-cover" />
                      </a>
                    </li>
                  );
                })}
              </ul>
              {videos.length ? (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {videos.map((id) => (
                    <YouTubeLite key={id} id={id} title={`${place.name} video`} />
                  ))}
                </div>
              ) : null}
            </Section>
          ) : null}

          <Section id="visit" title="Hours and location">
            <div className="grid gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
              {place.lat && place.lng ? (
                <SiteMap polygons={[]} markers={[{ title: place.name, address, lat: place.lat, lng: place.lng }]} height={320} label={`Map of ${place.name}`} />
              ) : (
                <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="flex min-h-40 items-center justify-center rounded-card bg-sand-100 p-6 text-center text-teal-700 underline">
                  Open {place.name} in Google Maps
                </a>
              )}
              <div>
                {rows.length ? (
                  <table className="w-full text-small">
                    <caption className="sr-only">Opening hours</caption>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.days} className="border-b border-ink-500/15">
                          <th scope="row" className="py-2 pr-4 text-left font-bold text-ink-900">
                            {r.days}
                          </th>
                          <td className="py-2 text-ink-900">{r.slots.map(formatSlot).join(", ")}</td>
                        </tr>
                      ))}
                      {closedDays(rows).length ? (
                        <tr className="border-b border-ink-500/15">
                          <th scope="row" className="py-2 pr-4 text-left font-bold text-ink-900">
                            {shortDays(closedDays(rows))}
                          </th>
                          <td className="py-2 text-ink-900">Closed</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                ) : place.hours ? (
                  <p className="whitespace-pre-line text-small text-ink-900">{place.hours}</p>
                ) : (
                  <p className="text-small text-ink-500">Call ahead for current hours.</p>
                )}
                {g.hoursNote ? <p className="mt-2 text-small text-ink-900">{g.hoursNote}</p> : null}
                {g.hoursSource ? <p className="mt-1 text-xs text-ink-500">{g.hoursSource}</p> : null}
                {address ? (
                  <p className="mt-4 text-small text-ink-900">
                    <b>{place.name}</b>
                    <br />
                    {address}
                  </p>
                ) : null}
              </div>
            </div>
            {g.know?.length ? (
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {g.know.map((k) => (
                  <li key={k.label} className="flex gap-3 rounded-card bg-sand-100 p-4">
                    <span className="text-teal-700">
                      <Icon d={ICONS.info} />
                    </span>
                    <div>
                      <b className="block text-ink-900">{k.label}</b>
                      <span className="text-small text-ink-900">{k.value}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </Section>

          {hasReviews ? (
            <Section id="reviews" title={isFood ? "What diners say" : "What customers say"}>
              <div className="grid gap-6 md:grid-cols-2">
                {reviews.praise?.length ? (
                  <div>
                    <h3 className="font-heading text-h4 text-ink-900">{isFood ? "What diners love" : "What customers love"}</h3>
                    <ul className="mt-2 space-y-2">
                      {reviews.praise.map((x) => (
                        <li key={x} className="flex gap-2 text-ink-900">
                          <span className="text-teal-700">
                            <Icon d={ICONS.check} />
                          </span>
                          {x}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {reviews.notes?.length ? (
                  <div>
                    <h3 className="font-heading text-h4 text-ink-900">Good to know</h3>
                    <ul className="mt-2 space-y-2">
                      {reviews.notes.map((x) => (
                        <li key={x} className="flex gap-2 text-ink-900">
                          <span className="text-ink-500">
                            <Icon d={ICONS.info} />
                          </span>
                          {x}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
              {reviews.source ? <p className="mt-3 text-xs text-ink-500">{reviews.source}. Summarized in our own words.</p> : null}
            </Section>
          ) : null}

          {faq.length ? (
            <Section id="faq" title="Frequently asked questions">
              <div className="space-y-2">
                {faq.map((f) => (
                  <details key={f.question} className="divi-toggle">
                    <summary>{f.question}</summary>
                    <p className="text-ink-900">{f.answer}</p>
                  </details>
                ))}
              </div>
            </Section>
          ) : null}

          {related.length ? (
            <Section id="more" title={isFood ? "More places to eat nearby" : "More San Carlos shops"}>
              <ul className="grid gap-3 sm:grid-cols-2">
                {related.map((r) => (
                  <li key={r.url} className="rounded-card border border-ink-500/15 p-4">
                    <Link href={r.url} className="font-bold text-teal-700 underline">
                      {r.label}
                    </Link>
                    {r.note ? <span className="block text-small text-ink-500">{r.note}</span> : null}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          <p className="text-small text-ink-500">
            {checked ? `Hours and details checked ${checked}. ` : null}Spot a change?{" "}
            <Link href="/contact-us/" className="text-teal-700 underline">
              Tell us
            </Link>
            .{" "}
            <Link href={listPath} className="text-teal-700 underline">
              Back to {listName}
            </Link>
          </p>
        </div>
      </div>

      {/* Phone action bar */}
      <nav aria-label={`Contact ${place.name}`} className="fixed inset-x-0 bottom-0 z-30 flex gap-1.5 border-t border-ink-500/20 bg-white p-2 md:hidden">
        {actions.slice(0, 3).map((a, i) => (
          <ActionButton key={a.href} a={a} main={i === 0} compact />
        ))}
      </nav>

      <JsonLd data={jsonLd} />
      {faqLd ? <JsonLd data={faqLd} /> : null}
      {place.jsonLd ? <JsonLd data={place.jsonLd} /> : null}
    </article>
  );
}
