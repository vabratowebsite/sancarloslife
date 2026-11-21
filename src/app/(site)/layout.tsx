import type { Metadata } from "next";

import { Footer } from "@/components/layout/Footer";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { fontVariables } from "@/lib/fonts";
import { indexingAllowed } from "@/lib/indexing";
import { getSettings } from "@/lib/queries/settings";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://sancarloslife.com"),
  title: {
    default: "San Carlos Life | Events, Food, Homes and Life in San Carlos, CA",
    template: "%s | San Carlos Life",
  },
  description:
    "Your guide to San Carlos, California: events this weekend, restaurants and shops, parks, neighborhoods and homes for sale.",
  // No indexing until cutover (ALLOW_INDEXING=true on production; see src/lib/indexing.ts).
  robots: indexingAllowed() ? undefined : { index: false, follow: false },
  alternates: { types: { "application/rss+xml": "/feed/" } },
};

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SiteHeader settings={settings} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer settings={settings} />
      </body>
    </html>
  );
}
