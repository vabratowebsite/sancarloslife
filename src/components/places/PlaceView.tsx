import Image from "next/image";
import Link from "next/link";

import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { RichText } from "@/components/content/RichText";
import { JsonLd } from "@/components/seo/JsonLd";
import { mediaSrc } from "@/lib/media";
import { placePath, STREETS } from "@/lib/queries/places";
import { absolute } from "@/lib/seo";
import type { Media, Place } from "@/payload-types";

const youtubeId = (url: string) => url.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/)?.[1];

export function PlaceView({ place }: { place: Place }) {
  const isFood = place.type === "restaurant" || place.type === "bar";
  const cover = mediaSrc(place.cover, "hero");
  const gallery = (place.gallery ?? []).filter((m): m is Media => typeof m === "object").slice(0, 12);
  const path = placePath(place);
  const links = place.links ?? [];
  const group = (k: string) => links.filter((l) => l.kind === k);
  const mapsHref =
    place.mapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name}, ${place.address ?? "San Carlos, CA"}`)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": isFood ? (place.type === "bar" ? "BarOrPub" : "Restaurant") : "LocalBusiness",
    name: place.name,
    url: absolute(path),
    image: cover ? [absolute(cover.src)] : undefined,
    telephone: place.phone || undefined,
    priceRange: place.priceRange || undefined,
    servesCuisine: isFood && place.cuisines?.length ? place.cuisines : undefined,
    address: place.address
      ? { "@type": "PostalAddress", streetAddress: place.address.split(",")[0], addressLocality: "San Carlos", addressRegion: "CA", postalCode: "94070", addressCountry: "US" }
      : undefined,
    geo: place.lat && place.lng ? { "@type": "GeoCoordinates", latitude: place.lat, longitude: place.lng } : undefined,
    sameAs: links.filter((l) => /facebook|instagram|yelp|tripadvisor/.test(l.url)).map((l) => l.url),
  };

  return (
    <>
      <section className="relative overflow-hidden bg-ink-900">
        {cover && <Image src={cover.src} alt="" fill priority sizes="100vw" className="object-cover opacity-55" />}
        <div className="container-site relative py-16 text-white md:py-24">
          <div className="[&_a]:!text-white [&_*]:!text-white">
            <Breadcrumbs
              items={[
                { name: "Restaurants & Services", path: "/restaurants-and-services/" },
                isFood
                  ? { name: "All Restaurants", path: "/restaurants-and-services/all-restaurants/" }
                  : { name: "All Shops & Services", path: "/restaurants-and-services/all-shops-services/" },
                { name: place.name, path },
              ]}
            />
          </div>
          <h1 className="mt-3 max-w-4xl text-h2 !text-white md:text-h1">{place.headline || place.name}</h1>
          <p className="mt-3 text-lg">
            {[place.street ? STREETS[place.street] : null, place.priceRange, (place.cuisines ?? []).join(", ")].filter(Boolean).join(" · ")}
          </p>
          {place.businessStatus === "temporarily_closed" && (
            <p className="eyebrow mt-4 inline-block rounded-button bg-coral-700 px-3 py-1.5 text-white">Temporarily closed</p>
          )}
        </div>
      </section>

      <div className="container-site grid grid-cols-[minmax(0,1fr)] gap-10 py-10 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
        <div className="min-w-0">
          <RichText data={place.body} />
          {gallery.length > 0 && (
            <section aria-labelledby="photos" className="mt-10">
              <h2 id="photos" className="text-h3">
                Photos
              </h2>
              <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                {gallery.map((m) => {
                  const img = mediaSrc(m, "card");
                  return img ? (
                    <li key={m.id}>
                      <a href={mediaSrc(m)?.src} target="_blank" rel="noopener">
                        <Image src={img.src} alt={img.alt} width={img.width} height={img.height} sizes="(min-width: 1024px) 250px, 50vw" className="aspect-square w-full rounded-button object-cover" />
                      </a>
                    </li>
                  ) : null;
                })}
              </ul>
            </section>
          )}
          {(place.videos ?? []).length > 0 && (
            <section aria-labelledby="videos" className="mt-10">
              <h2 id="videos" className="text-h3">
                Videos
              </h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {(place.videos ?? []).slice(0, 4).map((u) => {
                  const id = youtubeId(u);
                  return id ? (
                    <iframe
                      key={u}
                      src={`https://www.youtube-nocookie.com/embed/${id}`}
                      title={`${place.name} video`}
                      loading="lazy"
                      allow="accelerometer; encrypted-media; picture-in-picture"
                      allowFullScreen
                      className="aspect-video w-full rounded-card"
                    />
                  ) : null;
                })}
              </div>
            </section>
          )}
        </div>

        <aside aria-label={`${place.name} details`} className="grid h-fit gap-6 rounded-card bg-teal-50 p-6">
          {place.hours && (
            <div>
              <h2 className="eyebrow text-teal-700">Hours</h2>
              <p className="mt-1 whitespace-pre-line text-small">{place.hours}</p>
            </div>
          )}
          {place.address && (
            <div>
              <h2 className="eyebrow text-teal-700">Address</h2>
              <p className="mt-1 text-small">{place.address}</p>
              <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="text-small">
                Get directions
              </a>
            </div>
          )}
          {(place.phone || place.email || place.website) && (
            <div>
              <h2 className="eyebrow text-teal-700">Contact</h2>
              <ul className="mt-1 grid gap-1 text-small">
                {place.phone && (
                  <li>
                    <a href={`tel:${place.phone.replace(/[^\d+]/g, "")}`}>{place.phone}</a>
                  </li>
                )}
                {place.email && (
                  <li>
                    <a href={`mailto:${place.email}`}>{place.email}</a>
                  </li>
                )}
                {place.website && (
                  <li>
                    <a href={place.website} target="_blank" rel="noopener noreferrer">
                      Website
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}
          {[
            ["order", "Menu & ordering"],
            ["reserve", "Reservations"],
            ["reviews", "Reviews"],
            ["web", "Online"],
          ].map(([k, label]) =>
            group(k).length ? (
              <div key={k}>
                <h2 className="eyebrow text-teal-700">{label}</h2>
                <ul className="mt-1 flex flex-wrap gap-2">
                  {group(k).map((l) => (
                    <li key={l.url}>
                      <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-block rounded-full bg-white px-3 py-1 text-small">
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null,
          )}
          {(place.features ?? []).length > 0 && (
            <div>
              <h2 className="eyebrow text-teal-700">Good to know</h2>
              <p className="mt-1 text-small">{[...(place.features ?? []), ...(place.specialDiets ?? [])].join(" · ")}</p>
            </div>
          )}
          {(place.nearby ?? []).length > 0 && (
            <div>
              <h2 className="eyebrow text-teal-700">Nearby</h2>
              <p className="mt-1 text-small">{(place.nearby ?? []).join(" · ")}</p>
            </div>
          )}
          <Link href="/contact-us/" className="text-small">
            Something out of date? Tell us
          </Link>
        </aside>
      </div>
      <JsonLd data={jsonLd} />
      {place.jsonLd ? <JsonLd data={place.jsonLd} /> : null}
    </>
  );
}
