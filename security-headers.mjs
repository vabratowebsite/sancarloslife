// Response headers for every route (see next.config.ts). Kept in a plain module
// so tests can read the policy without booting Next.

const dev = process.env.NODE_ENV !== "production";

/**
 * Buying Buddy IDX (@buyingbuddy/react 0.3.x). Hosts taken from its runtime bundle:
 * the bundle and images on CloudFront, theme and data API on www.mbb2.com,
 * MapLibre, map style, tiles and fonts on basemap.mbb2.com, terrain tiles on S3,
 * Chart.js/ApexCharts (market reports) on jsDelivr, the GreatSchools map in a frame.
 */
const BUYING_BUDDY = {
  cdn: "https://d2w6u17ngtanmy.cloudfront.net",
  api: "https://www.mbb2.com",
  basemap: "https://basemap.mbb2.com",
};

/** Third parties the public site may load, by directive. */
export const CSP_SOURCES = {
  script: [
    "https://challenges.cloudflare.com",
    "https://www.googletagmanager.com",
    BUYING_BUDDY.cdn,
    BUYING_BUDDY.api,
    BUYING_BUDDY.basemap,
    "https://cdn.jsdelivr.net/npm/chart.js@3.7.0/",
    "https://cdn.jsdelivr.net/npm/apexcharts@8.7.0/",
  ],
  style: [BUYING_BUDDY.cdn, BUYING_BUDDY.api, BUYING_BUDDY.basemap],
  font: [BUYING_BUDDY.cdn, BUYING_BUDDY.api, BUYING_BUDDY.basemap],
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
    "https://www.greatschools.org",
    BUYING_BUDDY.api,
  ],
  connect: [
    "https://www.google-analytics.com",
    "https://*.google-analytics.com",
    "https://*.analytics.google.com",
    "https://challenges.cloudflare.com",
    BUYING_BUDDY.cdn,
    BUYING_BUDDY.api,
    BUYING_BUDDY.basemap,
    "https://s3.amazonaws.com/elevation-tiles-prod/",
  ],
};

/**
 * Pages that host Buying Buddy widgets. Only these get 'unsafe-eval', which the
 * Buying Buddy runtime needs for template click handlers (`new Function`).
 * Neighborhood pages live at /<slug>/: add a new neighborhood's slug here.
 */
export const IDX_PATHS = [
  "/homes-for-sale-in-san-carlos-ca",
  "/open-houses-in-san-carlos-ca",
  "/listing-results",
  "/listing-details",
  "/market-area-report",
  "/featured-communities",
  "/alder-manor",
  "/beverly-terrace",
  "/clearfield-park",
  "/cordes",
  "/el-sereno",
  "/howard-park",
];

export function contentSecurityPolicy({ idx = false } = {}) {
  const evalSrc = dev || idx ? " 'unsafe-eval'" : "";
  return [
    "default-src 'self'",
    // Next.js inlines its bootstrap scripts; nonces would force every page to render dynamically.
    `script-src 'self' 'unsafe-inline'${evalSrc} ${CSP_SOURCES.script.join(" ")}`,
    `style-src 'self' 'unsafe-inline' ${CSP_SOURCES.style.join(" ")}`,
    "img-src 'self' data: blob: https:",
    `font-src 'self' data: ${CSP_SOURCES.font.join(" ")}`,
    `connect-src 'self'${dev ? " ws:" : ""} ${CSP_SOURCES.connect.join(" ")}`,
    `frame-src ${CSP_SOURCES.frame.join(" ")}`,
    // MapLibre (Buying Buddy maps) runs its tile worker from a blob: URL.
    "worker-src 'self' blob:",
    "media-src 'self' https:",
    "object-src 'none'",
    "base-uri 'self'",
    // Buying Buddy's lead forms can post through a hidden frame to its API.
    `form-action 'self' ${BUYING_BUDDY.api}`,
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
