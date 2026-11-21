import Link from "next/link";

import { STATIC_PAGES } from "@/content/pages";
import { listNeighborhoods } from "@/lib/queries/pages";
import { legalLinks, mainNav } from "@/lib/navigation";

/** The /site-map/ page: the main menu, every neighborhood and every other page. */
export async function SiteMapList() {
  const hoods = await listNeighborhoods();
  const inMenu = new Set(mainNav.flatMap((n) => [n.href, ...(n.children ?? []).map((c) => c.href)]));
  const others = Object.entries(STATIC_PAGES)
    .map(([slug, p]) => ({ href: `/${slug}/`, label: p.title }))
    .filter((l) => !inMenu.has(l.href) && l.href !== "/site-map/" && !l.href.startsWith("/thank-you"));
  const groups = [
    ...mainNav.map((n) => ({ heading: n.label, links: n.children?.length ? n.children : [n] })),
    { heading: "Neighborhoods", links: hoods.map((h) => ({ href: `/${h.slug}/`, label: h.name })) },
    { heading: "More pages", links: [...others, ...legalLinks.filter((l) => l.href !== "/site-map/" && !others.some((o) => o.href === l.href))] },
  ];
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((g) => (
        <section key={g.heading} aria-labelledby={`sm-${g.heading}`}>
          <h2 id={`sm-${g.heading}`} className="text-h3">
            {g.heading}
          </h2>
          <ul className="mt-3 grid gap-1">
            {g.links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-flex min-h-6 items-center">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
