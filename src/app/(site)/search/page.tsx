import type { Metadata } from "next";
import Link from "next/link";

import { formatDate } from "@/lib/format";
import { normalizeQuery, siteSearch } from "@/lib/queries/search";

type Props = { searchParams: Promise<{ q?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = normalizeQuery((await searchParams).q);
  return {
    title: q ? `Search results for “${q}”` : "Search",
    robots: { index: false, follow: true },
  };
}

const SUGGESTED = ["farmers market", "italian", "Howard Park", "hometown days", "library", "sold homes"];

export default async function SearchPage({ searchParams }: Props) {
  const q = normalizeQuery((await searchParams).q);
  const results = q ? await siteSearch(q) : null;

  return (
    <section className="container-site py-12 md:py-16">
      <p className="eyebrow text-teal-700">Search</p>
      <h1 className="mt-2 text-h2">{q ? <>Results for &ldquo;{q}&rdquo;</> : "Search San Carlos Life"}</h1>

      <form action="/search/" method="get" role="search" className="mt-6 flex max-w-2xl gap-2">
        <label htmlFor="search-q" className="sr-only">
          Search events, posts, places and neighborhoods
        </label>
        <input
          id="search-q"
          name="q"
          type="search"
          defaultValue={q}
          minLength={2}
          maxLength={80}
          placeholder="Search events, posts, places"
          className="min-w-0 flex-1 rounded-button border border-ink-500/40 px-4 py-3"
        />
        <button type="submit" className="eyebrow rounded-button bg-teal-700 px-5 text-white hover:bg-teal-500">
          Search
        </button>
      </form>

      {results && (
        <p className="mt-4 text-ink-500" role="status">
          {q.length < 2
            ? "Type at least two letters."
            : results.total
              ? `${results.total} result${results.total === 1 ? "" : "s"}${results.total >= 8 ? " (top matches in each section)" : ""}.`
              : "No matches. Try a shorter or different word."}
        </p>
      )}

      {results?.groups.map((g) => (
        <section key={g.label} className="mt-10" aria-labelledby={`g-${g.label}`}>
          <h2 id={`g-${g.label}`} className="text-h3">
            {g.label}
          </h2>
          <ul className="mt-4 grid gap-3">
            {g.hits.map((h) => (
              <li key={h.href} className="rounded-card border border-teal-50 bg-white p-4">
                <Link href={h.href} className="font-heading text-[19px] text-ink-900 hover:text-teal-700">
                  {h.title}
                </Link>
                {h.date && <p className="text-sm text-ink-500">{formatDate(h.date)}</p>}
                {h.text && <p className="mt-1 line-clamp-2 text-ink-500">{h.text}</p>}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {(!q || results?.total === 0) && (
        <div className="mt-10">
          <h2 className="eyebrow text-ink-500">Popular searches</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {SUGGESTED.map((s) => (
              <li key={s}>
                <Link href={`/search/?q=${encodeURIComponent(s)}`} className="inline-block rounded-button bg-teal-50 px-4 py-2 text-teal-700 no-underline hover:bg-teal-700 hover:text-white">
                  {s}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
