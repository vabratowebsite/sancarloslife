import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";

import { PlaceView } from "@/components/places/PlaceView";
import { plainText } from "@/lib/format";
import { getPlace, getPlaceDraft } from "@/lib/queries/places";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const place = await getPlace(slug, "shops");
  if (!place) return {};
  return buildMetadata({
    path: `/store/${slug}/`,
    title: place.headline || place.name,
    description: place.guide?.summary || plainText(place.body, 155),
    seo: place.seo,
    image: place.cover,
  });
}

export default async function StorePage({ params }: Props) {
  const { slug } = await params;
  // Staff in edit mode see the latest draft (desk imports and AI drafts wait there for review).
  const preview = (await draftMode()).isEnabled ? await getPlaceDraft(slug, "shops") : null;
  const place = preview ?? (await getPlace(slug, "shops"));
  if (!place) notFound();
  return <PlaceView place={place} />;
}

export const revalidate = 3600;
