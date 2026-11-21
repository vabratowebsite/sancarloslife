import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { RichText } from "@/components/content/RichText";
import { GuideRequestForm } from "@/components/forms/SiteForms";
import { getPageBySlug } from "@/lib/queries/pages";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("buyers-and-sellers-guides");
  return buildMetadata({
    path: "/buyers-and-sellers-guides/",
    title: "Free San Carlos Home Buyer's and Seller's Guides",
    description: "Free guides to buying or selling a home in San Carlos, CA from Viv Kelvin and Mark Martinho of Vabrato Real Estate.",
    seo: page?.seo,
  });
}

export default async function GuidesPage() {
  const page = await getPageBySlug("buyers-and-sellers-guides");
  return (
    <div className="container-site py-10">
      <Breadcrumbs items={[{ name: "Buyer and Seller Guides", path: "/buyers-and-sellers-guides/" }]} />
      <h1 className="mt-3 text-h2 md:text-h1">Buyer and Seller Guides</h1>
      <p className="mt-3 max-w-2xl text-ink-500">Free guides from Viv &amp; Mark of Vabrato Real Estate. Tell us where to send yours.</p>
      <div className="mt-8 grid gap-gutter md:grid-cols-2">
        <section aria-labelledby="buyer" className="rounded-card bg-teal-50 p-6">
          <h2 id="buyer" className="text-h3">
            Buying in San Carlos
          </h2>
          <div className="mt-4">
            <GuideRequestForm guide="buyer" />
          </div>
        </section>
        <section aria-labelledby="seller" className="rounded-card bg-sand-100 p-6">
          <h2 id="seller" className="text-h3">
            Selling in San Carlos
          </h2>
          <div className="mt-4">
            <GuideRequestForm guide="seller" />
          </div>
        </section>
      </div>
      {page && <RichText data={page.body} className="mt-12" />}
    </div>
  );
}

export const revalidate = 3600;
