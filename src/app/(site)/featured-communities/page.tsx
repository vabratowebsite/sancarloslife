import type { Metadata } from "next";

import { IdxEmbed } from "@/components/realestate/IdxEmbed";

/** Buying Buddy foundation route (milestone 18); the widget reads its own query string. */
export const metadata: Metadata = { title: "Featured communities", robots: { index: false, follow: true } };

export default function FeaturedCommunitiesPage() {
  return (
    <div className="container-site py-10">
      <h1 className="text-h2">Featured communities</h1>
      <div className="mt-6">
        <IdxEmbed widget="communities" label="Communities" />
      </div>
    </div>
  );
}
