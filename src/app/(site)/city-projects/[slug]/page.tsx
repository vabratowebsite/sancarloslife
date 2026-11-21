import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { RichText } from "@/components/content/RichText";
import { JsonLd } from "@/components/seo/JsonLd";
import { formatDate } from "@/lib/format";
import { getCityProject } from "@/lib/queries/community";
import { absolute, buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

const STATUS: Record<string, string> = {
  proposed: "Proposed",
  planning: "Planning",
  approved: "Approved",
  construction: "Under construction",
  completed: "Completed",
  on_hold: "On hold",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getCityProject(slug);
  if (!p) return {};
  return buildMetadata({ path: `/city-projects/${slug}/`, title: `${p.title}: San Carlos City Project`, description: p.summary, seo: p.seo, image: p.cover });
}

export default async function CityProjectPage({ params }: Props) {
  const { slug } = await params;
  const p = await getCityProject(slug);
  if (!p) notFound();
  return (
    <div className="container-site grid grid-cols-[minmax(0,1fr)] gap-10 py-10 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
      <article className="min-w-0">
        <Breadcrumbs items={[{ name: "City Projects", path: "/city-projects/" }, { name: p.title, path: `/city-projects/${slug}/` }]} />
        <h1 className="mt-3 text-h2 md:text-h1">{p.title}</h1>
        {p.summary && <p className="mt-4 text-lg text-ink-500">{p.summary}</p>}
        <RichText data={p.body} className="mt-8" />
        {(p.sources ?? []).length > 0 && (
          <section aria-labelledby="sources" className="mt-10">
            <h2 id="sources" className="text-h4">
              Sources
            </h2>
            <ol className="mt-3 list-decimal pl-6 text-small">
              {(p.sources ?? []).map((s) => (
                <li key={s.id}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.title}
                  </a>
                  {s.publishedAt && <span className="text-ink-500"> ({formatDate(s.publishedAt)})</span>}
                </li>
              ))}
            </ol>
          </section>
        )}
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Article",
            headline: p.title,
            dateModified: p.latestUpdateAt || p.updatedAt,
            mainEntityOfPage: absolute(`/city-projects/${slug}/`),
            publisher: { "@type": "Organization", name: "San Carlos Life" },
          }}
        />
      </article>
      <aside aria-label="Project status" className="grid h-fit gap-4 rounded-card bg-teal-50 p-6">
        {p.status && (
          <div>
            <h2 className="eyebrow text-teal-700">Status</h2>
            <p className="mt-1 font-bold">{STATUS[p.status] ?? p.status}</p>
          </div>
        )}
        {p.area && (
          <div>
            <h2 className="eyebrow text-teal-700">Area</h2>
            <p className="mt-1">{p.area}</p>
          </div>
        )}
        {p.latestUpdateAt && (
          <div>
            <h2 className="eyebrow text-teal-700">Last update</h2>
            <p className="mt-1">{formatDate(p.latestUpdateAt)}</p>
          </div>
        )}
        <Link href="/city-projects/" className="text-small">
          All city projects
        </Link>
      </aside>
    </div>
  );
}

export const revalidate = 3600;
