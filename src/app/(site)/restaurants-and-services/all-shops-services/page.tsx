import type { Metadata } from "next";

import { PlaceDirectory } from "@/components/places/PlaceDirectory";
import type { PlaceFilters } from "@/lib/queries/places";
import { buildMetadata } from "@/lib/seo";

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const meta = buildMetadata({
    path: "/restaurants-and-services/all-shops-services/",
    title: "Shops and Services in San Carlos, CA",
    description: "Independent shops and local services in San Carlos, California: boutiques, bookstores, pet stores, barbers, cleaners and more.",
  });
  return Object.values(sp).some(Boolean) ? { ...meta, robots: { index: false, follow: true } } : meta;
}

export default async function AllShops({ searchParams }: Props) {
  const sp = await searchParams;
  const filters: PlaceFilters = {
    q: sp.q?.trim().slice(0, 60) || undefined,
    street: sp.street || undefined,
    sort: sp.sort === "az" ? "az" : undefined,
  };
  return <PlaceDirectory kind="shops" filters={filters} />;
}

export const revalidate = 3600;
