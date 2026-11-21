import Image from "next/image";

import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { RichText } from "@/components/content/RichText";
import { JsonLd } from "@/components/seo/JsonLd";
import { mediaSrc } from "@/lib/media";
import type { Page } from "@/payload-types";

/** Generic page: hero band plus rich text. Hub pages get layout blocks in milestone 12. */
export function PageView({ page }: { page: Page }) {
  const hero = mediaSrc(page.hero?.image, "hero");
  return (
    <>
      <section className="relative overflow-hidden bg-teal-50">
        {hero && (
          <Image src={hero.src} alt="" fill priority sizes="100vw" className="object-cover opacity-25" />
        )}
        <div className="container-site relative py-14">
          <Breadcrumbs items={[{ name: page.title, path: `/${page.slug}/` }]} />
          <h1 className="mt-3 max-w-4xl text-h2 md:text-h1">{page.hero?.heading || page.title}</h1>
          {page.hero?.subheading && <p className="mt-4 max-w-2xl text-ink-500">{page.hero.subheading}</p>}
        </div>
      </section>
      <div className="container-site py-10">
        <RichText data={page.body} className="max-w-3xl" />
      </div>
      {page.jsonLd ? <JsonLd data={page.jsonLd} /> : null}
    </>
  );
}
