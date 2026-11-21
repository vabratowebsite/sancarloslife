import Link from "next/link";

import { telHref, type SiteSettings } from "@/lib/queries/settings";

/** The Viv & Mark card beside articles (blueprint: sidebar CTA pattern). */
export function SidebarCta({ settings }: { settings: SiteSettings }) {
  const cta = settings.sidebarCta;
  return (
    <aside aria-labelledby="sidebar-cta-heading" className="rounded-card bg-teal-50 p-6">
      <p className="eyebrow text-teal-700">Viv &amp; Mark · Vabrato Real Estate</p>
      <h2 id="sidebar-cta-heading" className="mt-2 text-h4">
        {cta.heading}
      </h2>
      <p className="mt-3 text-small text-ink-500">{cta.text}</p>
      <div className="mt-5 grid gap-3">
        <Link
          href={cta.valuationUrl}
          className="eyebrow rounded-button bg-teal-700 px-4 py-3 text-center text-white hover:bg-teal-500"
        >
          {cta.valuationLabel}
        </Link>
        <a
          href={telHref(cta.phone)}
          className="eyebrow rounded-button border-2 border-teal-700 px-4 py-2.5 text-center text-teal-700 hover:bg-white"
        >
          Call {cta.phone}
        </a>
        <a href={`mailto:${cta.email}`} className="text-center text-small">
          {cta.email}
        </a>
      </div>
    </aside>
  );
}
