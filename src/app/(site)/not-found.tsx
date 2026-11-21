import Link from "next/link";

export const metadata = { title: "Page not found" };

const suggestions = [
  { label: "Events this week", href: "/events/" },
  { label: "The San Carlos Life blog", href: "/san-carlos-life-blog/" },
  { label: "Restaurants and services", href: "/restaurants-and-services/" },
  { label: "Homes for sale", href: "/homes-for-sale-in-san-carlos-ca/" },
];

export default function NotFound() {
  return (
    <section className="container-site py-20">
      <p className="eyebrow text-teal-700">Error 404</p>
      <h1 className="mt-2 text-h2 md:text-h1">We couldn&rsquo;t find that page</h1>
      <p className="mt-4 max-w-2xl text-ink-500">
        It may have moved when we rebuilt the site. Try a search, or start from one of these:
      </p>
      <form action="/search/" method="get" role="search" className="mt-6 flex max-w-xl gap-2">
        <label htmlFor="nf-q" className="sr-only">
          Search San Carlos Life
        </label>
        <input
          id="nf-q"
          name="q"
          type="search"
          placeholder="Search events, posts, places"
          className="flex-1 rounded-button border border-teal-500/40 px-4 py-3"
        />
        <button type="submit" className="eyebrow rounded-button bg-teal-700 px-5 text-white hover:bg-teal-500">
          Search
        </button>
      </form>
      <ul className="mt-8 grid gap-2">
        {suggestions.map((s) => (
          <li key={s.href}>
            <Link href={s.href}>{s.label}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
