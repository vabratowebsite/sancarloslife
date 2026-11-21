import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { PlaceCard } from "@/components/places/PlaceCard";
import { listPlaces, STREETS } from "@/lib/queries/places";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  path: "/restaurants-and-services/",
  title: "Restaurants, Shops and Services in San Carlos, CA",
  description: "Where to eat, shop and get things done in San Carlos, California: Laurel Street restaurants, local shops and services.",
});

export default async function RestaurantsAndServices() {
  const [restaurants, shops] = await Promise.all([listPlaces("restaurants"), listPlaces("shops")]);
  const laurel = restaurants.filter((p) => p.street === "laurel").slice(0, 6);
  const featured = (restaurants.some((p) => p.featured) ? restaurants.filter((p) => p.featured) : restaurants).slice(0, 3);
  return (
    <>
      <section className="bg-teal-50">
        <div className="container-site py-12">
          <Breadcrumbs items={[{ name: "Restaurants & Services", path: "/restaurants-and-services/" }]} />
          <h1 className="mt-3 text-h2 md:text-h1">Restaurants &amp; Services</h1>
          <p className="mt-3 max-w-2xl text-ink-500">
            {restaurants.length} places to eat and drink and {shops.length} shops and services, most of them locally owned.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Link href="/restaurants-and-services/all-restaurants/" className="rounded-card bg-teal-700 p-6 text-white no-underline hover:bg-teal-500">
              <span className="eyebrow text-teal-50">Eat &amp; drink</span>
              <span className="mt-1 block font-heading text-h3 text-white">All restaurants →</span>
            </Link>
            <Link href="/restaurants-and-services/all-shops-services/" className="rounded-card bg-white p-6 no-underline shadow-card hover:bg-sand-100">
              <span className="eyebrow text-teal-700">Shop &amp; services</span>
              <span className="mt-1 block font-heading text-h3 text-ink-900">All shops and services →</span>
            </Link>
          </div>
        </div>
      </section>
      <section aria-labelledby="featured" className="container-site py-12">
        <h2 id="featured" className="text-h3">
          Featured
        </h2>
        <div className="mt-6 grid gap-gutter sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p, i) => (
            <PlaceCard key={p.id} place={p} priority={i < 3} />
          ))}
        </div>
      </section>
      {laurel.length > 0 && (
        <section aria-labelledby="laurel" className="bg-sand-100">
          <div className="container-site py-12">
            <h2 id="laurel" className="text-h3">
              On {STREETS.laurel}
            </h2>
            <p className="mt-2 text-ink-500">Downtown San Carlos&rsquo;s main street.</p>
            <div className="mt-6 grid gap-gutter sm:grid-cols-2 lg:grid-cols-3">
              {laurel.map((p) => (
                <PlaceCard key={p.id} place={p} />
              ))}
            </div>
            <Link href="/restaurants-and-services/all-restaurants/?street=laurel" className="eyebrow mt-6 inline-block">
              Everything on Laurel Street →
            </Link>
          </div>
        </section>
      )}
    </>
  );
}

export const revalidate = 3600;
