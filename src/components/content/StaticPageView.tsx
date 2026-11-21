import Image from "next/image";

import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import type { StaticPage } from "@/content/pages";

/** A code page: heading band, then its HTML body (or children, for template-driven pages). */
export function StaticPageView({
  slug,
  page,
  html,
  children,
}: {
  slug: string;
  page: StaticPage;
  html?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <>
      <section className="relative overflow-hidden bg-teal-50">
        {page.image && <Image src={page.image.src} alt="" fill priority sizes="100vw" className="object-cover opacity-25" />}
        <div className="container-site relative py-14">
          <Breadcrumbs items={[{ name: page.title, path: `/${slug}/` }]} />
          <h1 className="mt-3 max-w-4xl text-h2 md:text-h1">{page.heading || page.title}</h1>
          {page.subheading && <p className="mt-4 max-w-2xl text-ink-500">{page.subheading}</p>}
        </div>
      </section>
      <div className="container-site py-10">
        {html && <div className="prose max-w-3xl" dangerouslySetInnerHTML={{ __html: html }} />}
        {children}
      </div>
    </>
  );
}
