import type { Metadata } from "next";

import { PlaceDirectory } from "@/components/places/PlaceDirectory";
import type { PlaceFilters } from "@/lib/queries/places";
import { buildMetadata } from "@/lib/seo";

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const meta = buildMetadata({
    path: "/restaurants-and-services/all-restaurants/",
    title: "Best Restaurants in San Carlos, CA: Laurel Street and Beyond",
    description: "Every restaurant in San Carlos, California with cuisine, price, hours and location: Laurel Street, San Carlos Avenue and El Camino Real.",
  });
  return Object.values(sp).some(Boolean) ? { ...meta, robots: { index: false, follow: true } } : meta;
}

export default async function AllRestaurants({ searchParams }: Props) {
  const sp = await searchParams;
  // /restaurant_type/<type>/ redirects here with ?type=; treat it as a search term.
  const filters: PlaceFilters = {
    q: (sp.q || sp.type?.replace(/-/g, " "))?.trim().slice(0, 60) || undefined,
    cuisine: sp.cuisine || undefined,
    street: sp.street || undefined,
    price: sp.price || undefined,
    meal: sp.meal || undefined,
    sort: sp.sort === "az" ? "az" : undefined,
  };
  return <PlaceDirectory kind="restaurants" filters={filters} />;
}

export const revalidate = 3600;
