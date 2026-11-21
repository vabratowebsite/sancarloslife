import type { Metadata } from "next";

import { IdxEmbed } from "@/components/realestate/IdxEmbed";

/** Buying Buddy foundation route (milestone 18); the widget reads its own query string. */
export const metadata: Metadata = { title: "Listing results", robots: { index: false, follow: true } };

export default function ListingResultsPage() {
  return (
    <div className="container-site py-10">
      <h1 className="text-h2">Listing results</h1>
      <div className="mt-6">
        <IdxEmbed widget="results" label="Search results" />
      </div>
    </div>
  );
}
