import type { Metadata } from "next";
import Image from "next/image";

import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { RichText } from "@/components/content/RichText";
import { mediaSrc } from "@/lib/media";
import { listTimeline } from "@/lib/queries/community";
import { getPageBySlug } from "@/lib/queries/pages";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("history-of-san-carlos");
  return buildMetadata({
    path: "/history-of-san-carlos/",
    title: "History of San Carlos, CA: A Timeline from 1700 to Today",
    description: "The story of San Carlos, California: the Costanoan people, the ship San Carlos, the railroad, incorporation in 1925 and the city today.",
    seo: page?.seo,
  });
}

export default async function HistoryPage() {
  const entries = await listTimeline();
  const decades = [...new Set(entries.map((e) => Math.floor(e.year / 100) * 100))];
  return (
    <>
      <section className="bg-sand-100">
        <div className="container-site py-12">
          <Breadcrumbs items={[{ name: "History of San Carlos", path: "/history-of-san-carlos/" }]} />
          <h1 className="mt-3 text-h2 md:text-h1">History of San Carlos</h1>
          <p className="mt-3 max-w-2xl text-ink-500">
            From the Costanoan people and the ship that gave the city its name to the City of Good Living today, in {entries.length} moments.
          </p>
          <nav aria-label="Centuries" className="mt-5 flex flex-wrap gap-2">
            {decades.map((d) => (
              <a key={d} href={`#c-${d}`} className="eyebrow rounded-full bg-white px-3 py-1.5 text-xs no-underline">
                {d}s
              </a>
            ))}
          </nav>
        </div>
      </section>
      <div className="container-site py-12">
        <ol className="relative border-l-2 border-teal-50 pl-6 md:pl-10">
          {entries.map((e, i) => {
            const img = mediaSrc(e.image, "card");
            const century = Math.floor(e.year / 100) * 100;
            const firstOfCentury = i === entries.findIndex((x) => Math.floor(x.year / 100) * 100 === century);
            return (
              <li key={e.id} id={firstOfCentury ? `c-${century}` : undefined} className="relative mb-10 scroll-mt-24">
                <span className="absolute -left-[33px] top-1.5 size-4 rounded-full border-4 border-white bg-teal-700 md:-left-[49px]" aria-hidden="true" />
                <p className="font-heading text-h3 text-teal-700">{e.dateLabel || e.year}</p>
                <h2 className="mt-1 font-heading text-h4">{e.title}</h2>
                <div className="mt-3 grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
                  <RichText data={e.body} className="[&_p]:text-small" />
                  {img && <Image src={img.src} alt={img.alt} width={img.width} height={img.height} sizes="260px" className="w-full rounded-card object-cover" />}
                </div>
                {e.sourceUrl && (
                  <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs">
                    Source
                  </a>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </>
  );
}

export const revalidate = 3600;
