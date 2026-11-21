/**
 * Pages whose content lives in the repo (owner's decision, 2026-11-21: all
 * pages are code). Each entry's body is src/content/pages/<slug>.html, sanitized
 * HTML carried over from WordPress; edit it like any other source file.
 * Titles and Google descriptions can still be overridden in the admin
 * (Pages = SEO records), see src/lib/pageMeta.ts.
 *
 * Pages with their own route folder (home, About, Explore, Viv & Mark, parks,
 * real estate tools, forms…) are not listed here.
 */
export type StaticPage = {
  title: string;
  /** Large heading on the page; defaults to the title. */
  heading?: string;
  subheading?: string;
  /** Faint photo behind the heading band. */
  image?: { src: string; width: number; height: number };
  /** false when the page has no body file (the template supplies the content). */
  body?: false;
};

export const STATIC_PAGES: Record<string, StaticPage> = {
  "attractions": {
    title: "Exciting Attractions and Things to Do in San Carlos CA",
    image: { src: "/api/media/file/mark-martinho-and-viv-kelvin-at-the-museum-of-san-carlos-history-san-carlos-ca-photo-by-vabrato-real-estate-services.jpg", width: 1200, height: 900 },
  },
  "city-projects": {
    title: "San Carlos City Projects",
  },
  "cookie-policy": {
    title: "Cookie Policy",
  },
  "events-and-activities": {
    title: "Exciting Events and Activities in San Carlos CA",
    image: { src: "/api/media/file/mark-martinho-and-viv-kelvin-at-the-san-carlos-sign-in-san-carlos-ca-photo-by-vabrato-real-estate-services-b.jpg", width: 777, height: 1135 },
  },
  "gallery": {
    title: "Gallery",
  },
  "hometown-days": {
    title: "San Carlos Hometown Days 2026",
    image: { src: "/api/media/file/Hometown-Days-Train.jpg", width: 1112, height: 741 },
  },
  "living-in-san-carlos-ca-the-complete-guide": {
    title: "Living in San Carlos, CA: The Complete Guide",
  },
  "pet-costume-competition": {
    title: "Pet Costume Competition",
    image: { src: "/api/media/file/Blog-Photos.jpg", width: 1112, height: 741 },
  },
  "privacy-policy": {
    title: "Privacy Policy",
  },
  "references": {
    title: "References",
  },
  "san-carlos-ca-real-estate-and-homes-for-sale": {
    title: "San Carlos CA Real Estate & Homes for Sale",
    image: { src: "/api/media/file/viv-kelvin-and-mark-martinho-of-vabrato-real-estate-san-carlos-realtors.jpg", width: 687, height: 458 },
  },
  "san-carlos-ca-real-estate-market-trends": {
    title: "The Latest San Carlos CA Real Estate Market Trends",
    image: { src: "/api/media/file/Market-Updates-Photo-Bayview2.jpg", width: 1000, height: 563 },
  },
  "san-carlos-centennial-2025-celebrating-100-years": {
    title: "San Carlos Centennial 2025: Celebrating 100 Years",
  },
  "site-map": {
    title: "Site Map",
    body: false,
  },
  "terms-of-service": {
    title: "Terms of Service",
  },
  "the-neighborhood": {
    title: "The Neighborhoods",
  },
  "the-san-carlos-seller-guide": {
    title: "The San Carlos Seller Guide",
  },
  "thank-you": {
    title: "Thank you",
  },
  "thank-you-for-sending-your-photo": {
    title: "Thank You For Sending Your Photo",
  },
};

export const staticPage = (slug: string): StaticPage | undefined => (Object.hasOwn(STATIC_PAGES, slug) ? STATIC_PAGES[slug] : undefined);
