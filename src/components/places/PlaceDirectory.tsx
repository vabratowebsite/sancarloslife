import Link from "next/link";

import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { PlaceCard } from "@/components/places/PlaceCard";
import { listPlaces, placeFacets, STREETS, type PlaceFilters, type PlaceKind } from "@/lib/queries/places";

const COPY: Record<PlaceKind, { title: string; path: string; noun: string; intro: string }> = {
  restaurants: {
    title: "All Restaurants in San Carlos",
    path: "/restaurants-and-services/all-restaurants/",
    noun: "places to eat and drink",
    intro: "Locally owned places to eat and drink, from Laurel Street to El Camino Real.",
  },
  shops: {
    title: "All Shops and Services in San Carlos",
    path: "/restaurants-and-services/all-shops-services/",
    noun: "shops and services",
    intro: "Independent shops and local services across San Carlos.",
  },
};

/** Filterable grid. Filters are a plain GET form, so they work without JavaScript. */
export async function PlaceDirectory({ kind, filters }: { kind: PlaceKind; filters: PlaceFilters }) {
  const copy = COPY[kind];
  const [places, facets] = await Promise.all([listPlaces(kind, filters), placeFacets(kind)]);
  const select = "mt-1 w-full rounded-button border border-teal-500/40 bg-white px-3 py-2.5";
  const active = Object.values(filters).some((v) => v && v !== "featured");
  return (
    <>
      <section className="bg-teal-50">
        <div className="container-site py-10">
          <Breadcrumbs
            items={[
              { name: "Restaurants & Services", path: "/restaurants-and-services/" },
              { name: kind === "restaurants" ? "All Restaurants" : "All Shops & Services", path: copy.path },
            ]}
          />
          <h1 className="mt-3 text-h2 md:text-h1">{copy.title}</h1>
          <p className="mt-3 max-w-2xl text-ink-500">
            {facets.total} {copy.intro.charAt(0).toLowerCase() + copy.intro.slice(1)} Own one?{" "}
            <Link href="/contact-us/">Add or update your listing</Link>.
          </p>
          <form method="get" action={copy.path} className="mt-6 grid gap-3 rounded-card bg-white p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
            <label className="text-xs text-ink-500">
              Search
              <input name="q" type="search" defaultValue={filters.q} placeholder={kind === "restaurants" ? "Name or cuisine" : "Name or service"} className={select} />
            </label>
            {kind === "restaurants" && facets.cuisines.length > 0 && (
              <label className="text-xs text-ink-500">
                Cuisine
                <select name="cuisine" defaultValue={filters.cuisine ?? ""} className={select}>
                  <option value="">All</option>
                  {facets.cuisines.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
            )}
            <label className="text-xs text-ink-500">
              Street
              <select name="street" defaultValue={filters.street ?? ""} className={select}>
                <option value="">All</option>
                {facets.streets.map((s) => (
                  <option key={s} value={s}>
                    {STREETS[s]}
                  </option>
                ))}
              </select>
            </label>
            {kind === "restaurants" && (
              <label className="text-xs text-ink-500">
                Price
                <select name="price" defaultValue={filters.price ?? ""} className={select}>
                  <option value="">Any</option>
                  {facets.prices.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </label>
            )}
            <div className="flex items-end gap-2">
              <button type="submit" className="eyebrow w-full rounded-button bg-teal-700 px-4 py-3 text-white hover:bg-teal-500">
                Apply
              </button>
            </div>
          </form>
        </div>
      </section>
      <section className="container-site py-10" aria-label="Results">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-small text-ink-500" aria-live="polite">
            Showing {places.length} of {facets.total} {copy.noun}
            {active && (
              <>
                {" · "}
                <Link href={copy.path}>Clear filters</Link>
              </>
            )}
          </p>
          <nav aria-label="Sort" className="flex gap-1 text-xs">
            {(["featured", "az"] as const).map((s) => {
              const qs = new URLSearchParams(Object.entries({ ...filters, sort: s === "featured" ? undefined : s }).filter(([, v]) => v) as [string, string][]);
              const on = (filters.sort ?? "featured") === s;
              return (
                <Link key={s} href={`${copy.path}${qs.size ? `?${qs}` : ""}`} aria-current={on ? "true" : undefined} className={`eyebrow rounded-button px-3 py-1.5 ${on ? "bg-teal-700 text-white" : "bg-teal-50"}`}>
                  {s === "featured" ? "Featured first" : "A–Z"}
                </Link>
              );
            })}
          </nav>
        </div>
        {places.length === 0 ? (
          <p className="mt-6 rounded-card bg-sand-100 p-6">
            Nothing matches those filters. <Link href={copy.path}>Show everything</Link>.
          </p>
        ) : (
          <div className="mt-6 grid gap-gutter sm:grid-cols-2 lg:grid-cols-3">
            {places.map((p, i) => (
              <PlaceCard key={p.id} place={p} priority={i < 3} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
