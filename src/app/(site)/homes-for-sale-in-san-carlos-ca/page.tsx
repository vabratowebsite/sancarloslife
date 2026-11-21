import Link from "next/link";

import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { IdxEmbed } from "@/components/realestate/IdxEmbed";
import { NeighborhoodGrid } from "@/components/realestate/NeighborhoodGrid";
import { metadataFromPage } from "@/lib/pageMeta";
import { listNeighborhoods } from "@/lib/queries/pages";

const PATH = "/homes-for-sale-in-san-carlos-ca/";

export const generateMetadata = () =>
  metadataFromPage("homes-for-sale-in-san-carlos-ca", {
    title: "San Carlos CA Homes for Sale",
    description: "Find homes for sale in San Carlos - look into maps and browse by neighborhoods",
  });

/** The IDX search entry page (it keeps the old URL, per docs/PLAN.md). */
export default async function HomesForSalePage() {
  const hoods = await listNeighborhoods();
  return (
    <>
      <section className="bg-teal-50">
        <div className="container-site py-12">
          <Breadcrumbs
            items={[
              { name: "Real Estate", path: "/san-carlos-ca-real-estate-and-homes-for-sale/" },
              { name: "Homes for Sale", path: PATH },
            ]}
          />
          <h1 className="mt-3 text-h2 md:text-h1">Homes for sale in San Carlos, CA</h1>
          <p className="mt-3 max-w-2xl text-ink-500">
            Search San Carlos real estate on the map, browse by neighborhood, or see{" "}
            <Link href="/open-houses-in-san-carlos-ca/">this weekend&rsquo;s open houses</Link>.
          </p>
        </div>
      </section>
      <div className="container-site grid gap-6 py-10">
        <IdxEmbed widget="search" label="Search homes for sale" disclaimer={false} />
        <IdxEmbed widget="results" label="Newest listings in San Carlos" />
      </div>
      <section className="bg-sand-100 py-12" aria-labelledby="by-hood">
        <div className="container-site">
          <h2 id="by-hood" className="text-h2">
            Browse by neighborhood
          </h2>
          <div className="mt-6">
            <NeighborhoodGrid hoods={hoods} />
          </div>
        </div>
      </section>
    </>
  );
}
