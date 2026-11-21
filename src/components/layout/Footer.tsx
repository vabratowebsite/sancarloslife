import Link from "next/link";

import { legalLinks } from "@/lib/navigation";
import { telHref, type SiteSettings } from "@/lib/queries/settings";

export function Footer({ settings }: { settings: SiteSettings }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t-4 border-teal-700 bg-teal-50">
      <div className="container-site grid gap-8 py-12 text-small md:grid-cols-[4fr_2fr_2fr_2fr_2fr]">
        <div>
          <p className="font-heading text-[26px] font-bold text-teal-700">SanCarlosLife.com</p>
          <p className="mt-2 text-ink-500">
            A guide to all things San Carlos, California: its amenities, activities and all life has to offer.
            Maintained by the Vabrato team.
          </p>
          <p className="mt-3">
            Call <a href={telHref(settings.phone)}>{settings.phone}</a>
            <br />
            Email <a href={`mailto:${settings.email}`}>{settings.email}</a>
          </p>
        </div>
        {settings.footerColumns.map((col) => (
          <nav key={col.heading} aria-label={col.heading}>
            <p className="eyebrow mb-3 text-[13px] text-ink-900">{col.heading}</p>
            <ul className="grid gap-2">
              {col.links.map((l) => (
                <li key={l.href + l.label}>
                  <Link href={l.href} className="text-ink-900 hover:text-teal-700">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="container-site pb-6 text-center text-xs text-ink-500">
        <p>
          © {year} Vabrato Real Estate
          {legalLinks.map((l) => (
            <span key={l.href}>
              {" · "}
              <Link href={l.href} className="text-ink-500 hover:text-teal-700">
                {l.label}
              </Link>
            </span>
          ))}
        </p>
        {settings.footerNote && <p className="mt-2 whitespace-pre-line">{settings.footerNote}</p>}
      </div>
    </footer>
  );
}
