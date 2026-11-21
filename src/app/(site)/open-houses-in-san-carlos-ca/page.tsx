import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { IdxEmbed } from "@/components/realestate/IdxEmbed";
import { metadataFromPage } from "@/lib/pageMeta";

const PATH = "/open-houses-in-san-carlos-ca/";

export const generateMetadata = () =>
  metadataFromPage("open-houses-in-san-carlos-ca", {
    title: "Open Houses",
    description: "Get up to date information about Open Houses in San Carlos CA.",
  });

export default function OpenHousesPage() {
  return (
    <>
      <section className="bg-teal-50">
        <div className="container-site py-12">
          <Breadcrumbs
            items={[
              { name: "Real Estate", path: "/san-carlos-ca-real-estate-and-homes-for-sale/" },
              { name: "Open Houses", path: PATH },
            ]}
          />
          <h1 className="mt-3 text-h2 md:text-h1">Open houses in San Carlos</h1>
          <p className="mt-3 max-w-2xl text-ink-500">
            In San Carlos, open houses usually run from 1 to 4 pm on Saturdays and Sundays. Drop in without an appointment, with or
            without your agent.
          </p>
        </div>
      </section>
      <div className="container-site py-10">
        <IdxEmbed widget="open-houses" label="This weekend's open houses" />
      </div>
      <section className="bg-sand-100 py-12" aria-labelledby="why">
        <div className="container-site max-w-3xl">
          <h2 id="why" className="text-h2">
            Why visit in person
          </h2>
          <p className="mt-3 text-ink-500">
            Photos and videos never do a home justice. An open house lets you get a feel for the rooms, the street and the neighborhood,
            and neighbors or community members are often on hand to answer questions, which can save you time when you decide.
          </p>
        </div>
      </section>
    </>
  );
}
