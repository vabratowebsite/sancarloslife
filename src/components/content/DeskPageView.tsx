import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { RichText } from "@/components/content/RichText";
import { Cta, Faq, PageHero, Section } from "@/components/sections";
import { JsonLd } from "@/components/seo/JsonLd";
import { formatDate } from "@/lib/format";
import { mediaSrc } from "@/lib/media";
import { absolute } from "@/lib/seo";
import type { DeskPage } from "@/payload-types";

/**
 * The "guide" template for pages made through the Operations Desk: quick
 * answer, sections, FAQ, sources and a call to action. Every desk page looks
 * like this, whoever (or whichever AI) wrote it.
 */
export function DeskPageView({ page }: { page: DeskPage }) {
  const path = `/${page.slug}/`;
  const hero = mediaSrc(page.hero, "hero");
  const faq = (page.faq ?? []).map((f) => ({ question: f.question, answer: f.answer }));
  const sources = page.sources ?? [];
  const updated = page.updated || page.updatedAt;
  return (
    <>
      <PageHero
        title={page.title}
        subheading={page.eyebrow ?? undefined}
        image={hero ? { src: hero.src, width: hero.width, height: hero.height } : undefined}
        crumbs={<Breadcrumbs items={[{ name: page.title, path }]} />}
      />
      <Section id="answer">
        <div className="max-w-3xl rounded-card border-l-4 border-teal-700 bg-teal-50 p-6">
          <p className="eyebrow text-xs text-teal-700">Quick answer</p>
          <p className="mt-2 text-lg">{page.summary}</p>
          {updated && <p className="mt-3 text-xs text-ink-500">Last updated {formatDate(updated)}</p>}
        </div>
      </Section>
      {(page.sections ?? []).map((s, i) => (
        <Section key={s.id ?? i} id={`section-${i + 1}`} heading={s.heading} band={i % 2 === 0}>
          <RichText data={s.body} className="max-w-3xl" />
        </Section>
      ))}
      {faq.length > 0 && (
        <Section id="faq" heading="Frequently asked questions">
          <Faq items={faq} />
        </Section>
      )}
      {sources.length > 0 && (
        <Section id="sources" heading="Sources" band>
          <ul className="grid max-w-3xl gap-2">
            {sources.map((s, i) => (
              <li key={s.id ?? i}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-6 items-center">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </Section>
      )}
      {page.cta?.heading && page.cta.buttonLabel && page.cta.buttonHref && (
        <Cta heading={page.cta.heading} text={page.cta.text ?? undefined} buttons={[{ label: page.cta.buttonLabel, href: page.cta.buttonHref }]} />
      )}
      <JsonLd
        data={
          page.jsonLd ?? {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: page.title,
            description: page.summary,
            dateModified: updated,
            url: absolute(path),
            ...(hero ? { image: absolute(hero.src) } : {}),
            author: { "@type": "Organization", name: "Vabrato Real Estate", url: absolute("/one-of-the-best-realtor-teams-in-san-carlos-ca/") },
            publisher: { "@type": "Organization", name: "San Carlos Life", url: absolute("/") },
            citation: sources.map((s) => s.url),
          }
        }
      />
    </>
  );
}
