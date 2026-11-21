// 404 for URLs that match no route at all. It bypasses the site layout,
// so it brings its own fonts, styles and a minimal header.
import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/layout/Logo";
import { fontVariables } from "@/lib/fonts";

import "./(site)/globals.css";

export const metadata: Metadata = {
  title: "Page not found | San Carlos Life",
  robots: { index: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="en" className={`${fontVariables} antialiased`}>
      <body>
        <header className="flex justify-center border-b border-teal-50 py-6">
          <Logo />
        </header>
        <main className="container-site py-20">
          <p className="eyebrow text-teal-700">Error 404</p>
          <h1 className="mt-2 text-h2 md:text-h1">We couldn&rsquo;t find that page</h1>
          <p className="mt-4 max-w-2xl text-ink-500">
            It may have moved when we rebuilt the site. Search for it, or go back to the{" "}
            <Link href="/">home page</Link>.
          </p>
          <form action="/search/" method="get" role="search" className="mt-6 flex max-w-xl gap-2">
            <label htmlFor="gnf-q" className="sr-only">
              Search San Carlos Life
            </label>
            <input
              id="gnf-q"
              name="q"
              type="search"
              placeholder="Search events, posts, places"
              className="flex-1 rounded-button border border-teal-500/40 px-4 py-3"
            />
            <button type="submit" className="eyebrow rounded-button bg-teal-700 px-5 text-white">
              Search
            </button>
          </form>
        </main>
      </body>
    </html>
  );
}
