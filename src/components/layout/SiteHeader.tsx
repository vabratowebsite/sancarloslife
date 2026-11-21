import Link from "next/link";

import { mainNav } from "@/lib/navigation";
import type { SiteSettings } from "@/lib/queries/settings";

import { Logo } from "./Logo";
import { MobileNav } from "./MobileNav";
import { TopBar } from "./TopBar";

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </svg>
  );
}

export function SiteHeader({ settings }: { settings: SiteSettings }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-button focus:bg-white focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <div className="hidden md:block">
        <TopBar settings={settings} />
      </div>
      <header className="border-b border-teal-50 bg-white">
        {/* Desktop: centered logo with the menu underneath */}
        <div className="container-site hidden flex-col items-center gap-4 pt-6 pb-4 md:flex">
          <Logo />
          <nav aria-label="Main" className="w-full">
            <ul className="eyebrow flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-sm">
              {mainNav.map((item) => (
                <li key={item.href} className="group relative">
                  <Link href={item.href} className="inline-block py-2 text-teal-700 hover:text-teal-500">
                    {item.label}
                  </Link>
                  {item.children && (
                    <ul className="invisible absolute left-1/2 top-full z-40 min-w-60 -translate-x-1/2 rounded-card bg-white py-2 text-left normal-case opacity-0 shadow-card transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                      {item.children.map((child) => (
                        <li key={child.href + child.label}>
                          <Link
                            href={child.href}
                            className="block px-4 py-2 font-sans text-small tracking-normal text-ink-900 hover:bg-teal-50 hover:text-teal-700"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
              <li>
                <Link href="/search/" aria-label="Search" className="inline-flex p-2 text-teal-700 hover:text-teal-500">
                  <SearchIcon />
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Mobile: small logo, search and menu buttons */}
        <div className="flex items-center justify-between px-4 py-3 md:hidden">
          <Logo size="sm" />
          <div className="flex gap-2">
            <Link
              href="/search/"
              aria-label="Search"
              className="flex size-11 items-center justify-center rounded-button bg-teal-50 text-teal-700"
            >
              <SearchIcon />
            </Link>
            <MobileNav settings={settings} />
          </div>
        </div>
      </header>
    </>
  );
}
