import type { Metadata } from "next";
import Image from "next/image";

import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { RichText } from "@/components/content/RichText";
import { mediaSrc } from "@/lib/media";
import { listParks } from "@/lib/queries/community";
import { loadPageHtml } from "@/content/pages/load";
import { applyHtmlEdits, editablePage, EditMarker } from "@/lib/pageEdits";
import { getPageSeo } from "@/lib/queries/pages";
import { buildMetadata } from "@/lib/seo";
import type { Park } from "@/payload-types";
import { DiviPage } from "@/components/divi/DiviPage";
import { diviLayout } from "@/lib/divi/layouts";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageSeo("parks-of-san-carlos");
  return buildMetadata({
    path: "/parks-of-san-carlos/",
    title: "Parks and Hiking Trails in San Carlos, CA",
    description:
      "Every park, trail and nature preserve in San Carlos, California, with addresses, size and directions.",
    seo: page?.seo,
  });
}

const TYPE_LABEL: Record<Park["type"], string> = {
  park: "Park",
  trail: "Trails & nature preserve",
  garden: "Garden",
};

export default async function ParksPage() {
  // The live site\'s exact layout (src/content/divi); the code below is the earlier version.
  const layout = diviLayout("parks-of-san-carlos");
  if (layout) return <DiviPage layout={layout} />;
  // The parks list comes from the admin; the guide below it is editable on the page.
  const edit = await editablePage(
    "parks-of-san-carlos",
    "/parks-of-san-carlos/",
  );
  const [parks, raw] = await Promise.all([
    listParks(),
    loadPageHtml("parks-of-san-carlos"),
  ]);
  const html = raw && applyHtmlEdits(raw, edit.edits, edit.editing);
  const groups: Park["type"][] = ["park", "trail", "garden"];
  return (
    <>
      <EditMarker />
      <section className="bg-teal-50">
        <div className="container-site py-12">
          <Breadcrumbs
            items={[
              { name: "Parks and Trails", path: "/parks-of-san-carlos/" },
            ]}
          />
          <h1 className="mt-3 text-h2 md:text-h1">
            Parks, Trails and Nature Preserves
          </h1>
          <p className="mt-3 max-w-2xl text-ink-500">
            {parks.length} parks and open spaces, from Burton Park downtown to
            the hilltop trails of Big Canyon and Vista Park.
          </p>
          <nav aria-label="Park types" className="mt-5 flex flex-wrap gap-2">
            {groups
              .filter((g) => parks.some((p) => p.type === g))
              .map((g) => (
                <a
                  key={g}
                  href={`#${g}`}
                  className="eyebrow rounded-full bg-white px-3 py-1.5 text-xs no-underline"
                >
                  {TYPE_LABEL[g]}s
                </a>
              ))}
          </nav>
        </div>
      </section>
      <div className="container-site py-10">
        {groups.map((g) => {
          const list = parks.filter((p) => p.type === g);
          if (!list.length) return null;
          return (
            <section
              key={g}
              id={g}
              aria-labelledby={`h-${g}`}
              className="mb-12 scroll-mt-24"
            >
              <h2 id={`h-${g}`} className="text-h3">
                {TYPE_LABEL[g]}s
              </h2>
              <ul className="mt-6 grid gap-gutter md:grid-cols-2">
                {list.map((park) => {
                  const img = mediaSrc(park.cover, "card");
                  return (
                    <li
                      key={park.id}
                      id={park.slug}
                      className="scroll-mt-24 overflow-hidden rounded-card bg-white shadow-card"
                    >
                      {img && (
                        <Image
                          src={img.src}
                          alt={img.alt}
                          width={img.width}
                          height={img.height}
                          sizes="(min-width: 768px) 580px, 100vw"
                          className="aspect-[2/1] w-full object-cover"
                        />
                      )}
                      <div className="p-6">
                        <h3 className="font-heading text-h4">{park.name}</h3>
                        <p className="eyebrow mt-1 text-xs text-ink-500">
                          {[
                            park.acres ? `${park.acres} acres` : null,
                            park.address?.replace(", San Carlos, CA 94070", ""),
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                        <RichText
                          data={park.body}
                          className="mt-3 text-small [&_p]:text-small"
                        />
                        {park.facilities && park.facilities.length > 0 && (
                          <p className="mt-3 text-small text-ink-500">
                            {park.facilities.join(" · ")}
                          </p>
                        )}
                        {park.mapsUrl && (
                          <a
                            href={park.mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="eyebrow mt-3 inline-flex min-h-6 items-center py-1 text-xs"
                          >
                            Directions
                          </a>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
        {html && (
          <section
            aria-labelledby="guide"
            className="mt-6 border-t border-teal-50 pt-10"
          >
            <h2 id="guide" className="text-h3">
              The full parks guide
            </h2>
            <div
              className="prose mt-4"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </section>
        )}
      </div>
    </>
  );
}

export const revalidate = 3600;
