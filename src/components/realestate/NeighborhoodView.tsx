import Image from "next/image";

import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { RichText } from "@/components/content/RichText";
import { JsonLd } from "@/components/seo/JsonLd";
import { mediaSrc } from "@/lib/media";
import type { Neighborhood } from "@/payload-types";

/**
 * Neighborhood page. Milestone 19 adds the Buying Buddy listings grid and map;
 * this renders the story, highlights, schools and FAQ.
 */
export function NeighborhoodView({ hood }: { hood: Neighborhood }) {
  const hero = mediaSrc(hood.hero, "hero");
  const faq = hood.faq ?? [];
  return (
    <>
      <section className="relative overflow-hidden bg-ink-900 text-white">
        {hero && <Image src={hero.src} alt="" fill priority sizes="100vw" className="object-cover opacity-50" />}
        <div className="container-site relative py-20">
          <div className="[&_*]:!text-white">
            <Breadcrumbs items={[{ name: "Neighborhoods", path: "/the-neighborhood/" }, { name: hood.name, path: `/${hood.slug}/` }]} />
          </div>
          <h1 className="mt-3 text-h2 !text-white md:text-h1">{hood.name}</h1>
          {hood.tagline && <p className="mt-3 max-w-2xl text-lg">{hood.tagline}</p>}
        </div>
      </section>
      <div className="container-site py-12">
        <RichText data={hood.intro} className="max-w-3xl text-lg" />
        {hood.highlights && hood.highlights.length > 0 && (
          <section aria-labelledby="hl" className="mt-10">
            <h2 id="hl" className="text-h3">
              Living in {hood.name}
            </h2>
            <ul className="mt-6 grid gap-gutter sm:grid-cols-2 lg:grid-cols-4">
              {hood.highlights.map((h) => (
                <li key={h.id} className="rounded-card bg-teal-50 p-5">
                  <p className="eyebrow text-teal-700">{h.title}</p>
                  {h.text && <p className="mt-2 text-small">{h.text}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}
        {faq.length > 0 && (
          <section aria-labelledby="faq" className="mt-12 max-w-3xl">
            <h2 id="faq" className="text-h3">
              {hood.name} questions
            </h2>
            <div className="mt-4 divide-y divide-teal-50 border-y border-teal-50">
              {faq.map((f) => (
                <details key={f.id} className="group py-4">
                  <summary className="cursor-pointer list-none font-bold text-ink-900">{f.question}</summary>
                  <p className="mt-2 text-ink-500">{f.answer}</p>
                </details>
              ))}
            </div>
            <JsonLd
              data={{
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: faq.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
              }}
            />
          </section>
        )}
      </div>
    </>
  );
}
