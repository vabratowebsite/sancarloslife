import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { MortgageCalculator } from "@/components/realestate/MortgageCalculator";
import { getSettings, telHref } from "@/lib/queries/settings";
import { metadataFromPage } from "@/lib/pageMeta";
import { editablePage, EditMarker, T } from "@/lib/pageEdits";

const SLUG = "how-much-house-can-i-afford-mortgage-calculator";
const PATH = `/${SLUG}/`;

export const generateMetadata = () =>
  metadataFromPage(SLUG, {
    title: "Mortgage Calculator",
    description: "Use the mortgage calculator to find out your monthly payment in San Carlos, CA, and how much house you can afford.",
  });

export default async function MortgageCalculatorPage() {
  await editablePage(SLUG, PATH);
  const settings = await getSettings();
  return (
    <>
      <EditMarker />
      <section className="bg-teal-50">
        <div className="container-site py-12">
          <Breadcrumbs
            items={[
              { name: "Real Estate", path: "/san-carlos-ca-real-estate-and-homes-for-sale/" },
              { name: "Mortgage Calculator", path: PATH },
            ]}
          />
          <h1 className="mt-3 text-h2 md:text-h1">
            <T k="title">How much house can I afford?</T>
          </h1>
          <p className="mt-3 max-w-2xl text-ink-500">
            <T k="intro">Work out the monthly payment on a San Carlos home, or start from your income and see what price fits.</T>
          </p>
        </div>
      </section>
      <div className="container-site py-10">
        <MortgageCalculator />
      </div>
      <section className="bg-sand-100 py-12" aria-labelledby="financing">
        <div className="container-site max-w-3xl">
          <h2 id="financing" className="text-h2">
            <T k="financing.heading">Need help financing a home?</T>
          </h2>
          <p className="mt-3 text-ink-500">
            <T k="financing.text">Mark and Viv can refer you to mortgage brokers they trust to help make your San Carlos home a reality.</T>
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <a href={telHref(settings.phone)} className="eyebrow inline-flex rounded-button border-2 border-teal-700 bg-teal-700 px-6 py-3 text-white no-underline hover:bg-teal-500">
              <T k="financing.call">Call us</T>
            </a>
            <a href={`mailto:${settings.email}`} className="eyebrow inline-flex rounded-button border-2 border-teal-700 px-6 py-3 text-teal-700 no-underline hover:bg-white">
              <T k="financing.email">Send us an email</T>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
