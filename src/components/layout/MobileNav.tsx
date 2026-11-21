"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { mainNav } from "@/lib/navigation";
import type { SiteSettings } from "@/lib/queries/settings";

/**
 * Mobile menu in a native <dialog>: the browser traps focus, Escape closes it,
 * and focus returns to the menu button.
 */
export function MobileNav({ settings }: { settings: SiteSettings }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  // Close after navigating.
  useEffect(() => {
    dialogRef.current?.close();
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}
        className="flex size-11 items-center justify-center rounded-button bg-teal-700 text-white"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Menu"
        className="m-0 ml-auto h-dvh max-h-none w-[min(22rem,90vw)] max-w-none bg-white p-0 backdrop:bg-ink-900/50"
        onClick={(e) => {
          // A click on the backdrop (the dialog element itself) closes the menu.
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        <div className="flex items-center justify-between border-b border-teal-50 px-4 py-3">
          <span className="eyebrow text-teal-700">Menu</span>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => dialogRef.current?.close()}
            className="flex size-11 items-center justify-center rounded-button bg-teal-50 text-teal-700"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <nav aria-label="Main" className="px-4 py-2">
          <ul>
            {mainNav.map((item) => (
              <li key={item.href} className="border-b border-teal-50 py-1">
                {item.children ? (
                  <details>
                    <summary className="eyebrow flex cursor-pointer list-none items-center justify-between py-3 text-teal-700">
                      {item.label}
                      <span aria-hidden="true">+</span>
                    </summary>
                    <ul className="pb-2 pl-3">
                      {item.children.map((child) => (
                        <li key={child.href + child.label}>
                          <Link href={child.href} className="block py-2 text-ink-900">
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : (
                  <Link href={item.href} className="eyebrow block py-3 text-teal-700">
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-6 grid gap-3">
            <Link
              href="/subscribe/"
              className="eyebrow rounded-button bg-teal-700 px-4 py-3 text-center text-white"
            >
              Subscribe
            </Link>
            <a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`} className="text-center text-teal-700">
              Call {settings.phone}
            </a>
          </div>
        </nav>
      </dialog>
    </>
  );
}
