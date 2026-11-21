"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState, useSyncExternalStore } from "react";

const KEY = "scl-consent";
type Choice = "granted" | "denied" | null;

const read = (): Choice => {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
};

/** Opens the banner again (the footer's "Cookie settings" link calls this). */
export const openCookieSettings = () => window.dispatchEvent(new Event("scl:cookie-settings"));

/**
 * Google Analytics 4 loads only after the visitor accepts. Nothing is stored
 * and no Google script runs before that. Without NEXT_PUBLIC_GA_ID there is no
 * analytics and no banner.
 */
const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  window.addEventListener("scl:consent", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("scl:consent", cb);
  };
};

// In private mode storage can fail; the choice then lasts for this page view.
let memory: Choice = null;

export function CookieConsent({ gaId }: { gaId?: string }) {
  // "unknown" on the server and during hydration, so the banner never flashes.
  const choice = useSyncExternalStore<Choice | "unknown">(subscribe, () => read() ?? memory, () => "unknown");
  const [reopened, setReopened] = useState(false);

  useEffect(() => {
    const reopen = () => setReopened(true);
    window.addEventListener("scl:cookie-settings", reopen);
    return () => window.removeEventListener("scl:cookie-settings", reopen);
  }, []);

  if (!gaId) return null;
  const open = reopened || choice === null;

  const decide = (c: Exclude<Choice, null>) => {
    // Turning analytics off after it was on needs a reload to unload gtag.
    const reload = choice === "granted" && c === "denied";
    memory = c;
    try {
      window.localStorage.setItem(KEY, c);
    } catch {
      /* kept in memory instead */
    }
    setReopened(false);
    window.dispatchEvent(new Event("scl:consent"));
    if (reload) window.location.reload();
  };

  return (
    <>
      {choice === "granted" && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config',${JSON.stringify(gaId)},{anonymize_ip:true});`}
          </Script>
        </>
      )}
      {open && (
        <div
          role="region"
          aria-label="Cookie choices"
          className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-card border border-teal-50 bg-white p-5 shadow-card md:flex md:items-center md:gap-6"
        >
          <p className="text-sm text-ink-900">
            We&rsquo;d like to use cookies to count visits and see which pages are popular (Google Analytics). No ads, and we never sell
            data. <Link href="/cookie-policy/">Cookie policy</Link>
          </p>
          <div className="mt-4 flex shrink-0 gap-3 md:mt-0">
            <button
              type="button"
              onClick={() => decide("denied")}
              className="eyebrow rounded-button border-2 border-teal-700 px-4 py-2 text-teal-700 hover:bg-teal-50"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={() => decide("granted")}
              className="eyebrow rounded-button border-2 border-teal-700 bg-teal-700 px-4 py-2 text-white hover:border-teal-500 hover:bg-teal-500"
            >
              Accept
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/** Footer link that reopens the banner. */
export function CookieSettingsButton({ className = "" }: { className?: string }) {
  return (
    <button type="button" onClick={openCookieSettings} className={`underline ${className}`}>
      Cookie settings
    </button>
  );
}
