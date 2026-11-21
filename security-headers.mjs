// Response headers for every route (see next.config.ts). Kept in a plain module
// so tests can read the policy without booting Next.

const dev = process.env.NODE_ENV !== "production";

/** Third parties the public site may load, by directive. Add Buying Buddy's hosts when IDX goes in. */
export const CSP_SOURCES = {
  script: ["https://challenges.cloudflare.com", "https://www.googletagmanager.com"],
  frame: [
    "https://challenges.cloudflare.com",
    "https://www.youtube-nocookie.com",
    "https://www.youtube.com",
    "https://player.vimeo.com",
    "https://www.google.com",
    "https://maps.google.com",
    "https://calendar.google.com",
    "https://docs.google.com",
    "https://www.facebook.com",
    "https://www.instagram.com",
    "https://www.canva.com",
  ],
  connect: ["https://www.google-analytics.com", "https://*.google-analytics.com", "https://*.analytics.google.com", "https://challenges.cloudflare.com"],
};

export function contentSecurityPolicy() {
  return [
    "default-src 'self'",
    // Next.js inlines its bootstrap scripts; nonces would force every page to render dynamically.
    `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""} ${CSP_SOURCES.script.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self'${dev ? " ws:" : ""} ${CSP_SOURCES.connect.join(" ")}`,
    `frame-src ${CSP_SOURCES.frame.join(" ")}`,
    "media-src 'self' https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

export const baseHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  ...(dev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];
