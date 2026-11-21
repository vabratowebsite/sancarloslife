"use client";

import Script from "next/script";

// Cloudflare's documented test site key (always passes); used until a real key is set.
const TEST_SITE_KEY = "1x00000000000000000000AA";

/** Invisible-by-default bot check. Adds a cf-turnstile-response field to the form. */
export function Turnstile() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || TEST_SITE_KEY;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <div className="cf-turnstile" data-sitekey={siteKey} data-size="flexible" data-appearance="interaction-only" />
    </>
  );
}
