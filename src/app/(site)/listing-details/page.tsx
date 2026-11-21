import type { Metadata } from "next";

import { IdxEmbed } from "@/components/realestate/IdxEmbed";

/** Buying Buddy foundation route (milestone 18); the widget reads its own query string. */
export const metadata: Metadata = { title: "Listing details", robots: { index: false, follow: true } };

export default function ListingDetailsPage() {
  return (
    <div className="container-site py-10">
      <h1 className="text-h2">Listing details</h1>
      <div className="mt-6">
        <IdxEmbed widget="details" label="Listing details" />
      </div>
    </div>
  );
}
