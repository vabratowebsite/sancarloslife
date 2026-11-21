import Link from "next/link";

import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

export type Crumb = { name: string; path: string };

/** Visible trail plus BreadcrumbList structured data. The last item is the current page. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all = [{ name: "Home", path: "/" }, ...items];
  return (
    <>
      <nav aria-label="Breadcrumb" className="eyebrow text-xs text-ink-500">
        <ol className="flex flex-wrap gap-x-2">
          {all.map((c, i) => (
            <li key={c.path} className="flex min-w-0 gap-x-2">
              {i > 0 && <span aria-hidden="true">›</span>}
              {i === all.length - 1 ? (
                <span aria-current="page">{c.name}</span>
              ) : (
                <Link href={c.path} className="text-teal-700">
                  {c.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(all)} />
    </>
  );
}
