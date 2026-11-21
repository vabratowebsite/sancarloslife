import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PlaceView } from "@/components/places/PlaceView";
import { plainText } from "@/lib/format";
import { getPlace } from "@/lib/queries/places";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const place = await getPlace(slug, "restaurants");
  if (!place) return {};
  return buildMetadata({
    path: `/restaurant/${slug}/`,
    title: place.headline || place.name,
    description: plainText(place.body, 155),
    seo: place.seo,
    image: place.cover,
  });
}

export default async function RestaurantPage({ params }: Props) {
  const { slug } = await params;
  const place = await getPlace(slug, "restaurants");
  if (!place) notFound();
  return <PlaceView place={place} />;
}

export const revalidate = 3600;
