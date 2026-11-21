import { unstable_cache } from "next/cache";

import { defaultContact, defaultFooterColumns, type NavLink } from "@/lib/navigation";
import { getPayloadClient } from "@/lib/payload";

export type SiteSettings = {
  siteTitle: string;
  tagline: string;
  phone: string;
  email: string;
  social: { platform: string; url: string }[];
  footerColumns: { heading: string; links: NavLink[] }[];
  footerNote: string;
  sidebarCta: {
    heading: string;
    text: string;
    phone: string;
    email: string;
    valuationLabel: string;
    valuationUrl: string;
  };
};

const fallback: SiteSettings = {
  siteTitle: "San Carlos Life",
  tagline: "Your guide to life in San Carlos, California",
  phone: defaultContact.phone,
  email: defaultContact.email,
  social: defaultContact.social,
  footerColumns: defaultFooterColumns,
  footerNote: "",
  sidebarCta: {
    heading: "Thinking of buying or selling in San Carlos?",
    text: "Viv Kelvin and Mark Martinho of Vabrato Real Estate live and work in San Carlos.",
    phone: defaultContact.phone,
    email: defaultContact.email,
    valuationLabel: "What's my home worth?",
    valuationUrl: "/sell-my-house/",
  },
};

const orFallback = <T,>(value: T | null | undefined, fb: T): T =>
  value === null || value === undefined || (Array.isArray(value) && value.length === 0) || value === ""
    ? fb
    : value;

/** Site-wide settings, cached and revalidated with the "settings" tag. */
export const getSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    try {
      const payload = await getPayloadClient();
      const s = await payload.findGlobal({ slug: "settings", depth: 1 });
      return {
        siteTitle: orFallback(s.siteTitle, fallback.siteTitle),
        tagline: orFallback(s.tagline, fallback.tagline),
        phone: orFallback(s.phone, fallback.phone),
        email: orFallback(s.email, fallback.email),
        social: orFallback(
          s.social?.map((x) => ({ platform: x.platform, url: x.url })),
          fallback.social,
        ),
        footerColumns: orFallback(
          s.footerColumns?.map((c) => ({
            heading: c.heading,
            links: (c.links ?? []).map((l) => ({ label: l.label, href: l.url })),
          })),
          fallback.footerColumns,
        ),
        footerNote: s.footerNote ?? "",
        sidebarCta: {
          heading: orFallback(s.sidebarCta?.heading, fallback.sidebarCta.heading),
          text: orFallback(s.sidebarCta?.text, fallback.sidebarCta.text),
          phone: orFallback(s.sidebarCta?.phone, fallback.sidebarCta.phone),
          email: orFallback(s.sidebarCta?.email, fallback.sidebarCta.email),
          valuationLabel: orFallback(s.sidebarCta?.valuationLabel, fallback.sidebarCta.valuationLabel),
          valuationUrl: orFallback(s.sidebarCta?.valuationUrl, fallback.sidebarCta.valuationUrl),
        },
      };
    } catch (error) {
      // The site keeps rendering with defaults if the database is unreachable.
      console.error("getSettings failed, using defaults", error);
      return fallback;
    }
  },
  ["settings"],
  { tags: ["settings"], revalidate: 3600 },
);

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
