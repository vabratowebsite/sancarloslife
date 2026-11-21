import type { Metadata } from "next";
import { Lato, Oswald, Playfair_Display } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sancarloslife.com"),
  title: {
    default: "San Carlos Life | Events, Food, Homes and Life in San Carlos, CA",
    template: "%s | San Carlos Life",
  },
  description:
    "Your guide to San Carlos, California: events this weekend, restaurants and shops, parks, neighborhoods and homes for sale.",
  // The preview build must not be indexed until cutover (milestone 26).
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${lato.variable} ${oswald.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
