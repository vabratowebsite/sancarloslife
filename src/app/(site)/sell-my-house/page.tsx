import { FormPage } from "@/components/forms/FormPage";
import { SellMyHouseForm } from "@/components/forms/SiteForms";
import { getSettings, telHref } from "@/lib/queries/settings";
import { metadataFromPage } from "@/lib/pageMeta";

export const generateMetadata = () =>
  metadataFromPage("sell-my-house", {
    title: "Sell My House",
    description: 'If you\'re asking, "how much can I sell my house in San Carlos CA for?" we can help you answer that.',
  });

const STEPS = [
  ["We look at your home", "Viv and Mark compare it with recent San Carlos sales nearby, as it is today and after any upgrades worth making."],
  ["We weigh the upgrades", "As general contractors and interior designers, we price improvements against time to market and the hassle to you."],
  ["We market it", "Professional photos and video, the latest marketing tools, and a network of buyers and agents focused on San Carlos."],
] as const;

export default async function SellMyHousePage() {
  const settings = await getSettings();
  return (
    <>
      <FormPage
        title="What's your San Carlos home worth?"
        crumbs={[
          { name: "Real Estate", path: "/san-carlos-ca-real-estate-and-homes-for-sale/" },
          { name: "Sell My House", path: "/sell-my-house/" },
        ]}
        intro={
          <p>
            Tell us about your home and Viv or Mark will send you a free, no-obligation valuation based on recent sales near you. Prefer
            to talk? Call <a href={telHref(settings.phone)}>{settings.phone}</a>.
          </p>
        }
        aside={
          <div className="rounded-card bg-teal-50 p-6">
            <h2 className="font-heading text-[22px]">How we sell San Carlos homes</h2>
            <ol className="mt-4 grid gap-4">
              {STEPS.map(([t, d], i) => (
                <li key={t} className="grid grid-cols-[32px_minmax(0,1fr)] gap-3">
                  <span className="flex size-8 items-center justify-center rounded-full bg-teal-700 font-bold text-white" aria-hidden="true">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-bold">{t}</p>
                    <p className="text-small text-ink-500">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        }
      >
        <SellMyHouseForm />
      </FormPage>
    </>
  );
}
