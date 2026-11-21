import { FormPage } from "@/components/forms/FormPage";
import { SellMyHouseForm } from "@/components/forms/SiteForms";
import { getSettings, telHref } from "@/lib/queries/settings";
import { metadataFromPage } from "@/lib/pageMeta";
import { editablePage, EditMarker, T } from "@/lib/pageEdits";

const SLUG = "sell-my-house";

export const generateMetadata = () =>
  metadataFromPage(SLUG, {
    title: "Sell My House",
    description: 'If you\'re asking, "how much can I sell my house in San Carlos CA for?" we can help you answer that.',
  });

const STEPS = [
  ["We look at your home", "Viv and Mark compare it with recent San Carlos sales nearby, as it is today and after any upgrades worth making."],
  ["We weigh the upgrades", "As general contractors and interior designers, we price improvements against time to market and the hassle to you."],
  ["We market it", "Professional photos and video, the latest marketing tools, and a network of buyers and agents focused on San Carlos."],
] as const;

/** Words and the steps are editable on the page; the form itself is not. */
export default async function SellMyHousePage() {
  await editablePage(SLUG, `/${SLUG}/`);
  const settings = await getSettings();
  return (
    <>
      <EditMarker />
      <FormPage
        title={<T k="title">What&apos;s your San Carlos home worth?</T>}
        crumbs={[
          { name: "Real Estate", path: "/san-carlos-ca-real-estate-and-homes-for-sale/" },
          { name: "Sell My House", path: "/sell-my-house/" },
        ]}
        intro={
          <p>
            <T k="intro">
              Tell us about your home and Viv or Mark will send you a free, no-obligation valuation based on recent sales near you.
              Prefer to talk? Call
            </T>{" "}
            <a href={telHref(settings.phone)}>{settings.phone}</a>.
          </p>
        }
        aside={
          <div className="rounded-card bg-teal-50 p-6">
            <h2 className="font-heading text-[22px]">
              <T k="steps.heading">How we sell San Carlos homes</T>
            </h2>
            <ol className="mt-4 grid gap-4">
              {STEPS.map(([t, d], i) => (
                <li key={t} className="grid grid-cols-[32px_minmax(0,1fr)] gap-3">
                  <span className="flex size-8 items-center justify-center rounded-full bg-teal-700 font-bold text-white" aria-hidden="true">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-bold">
                      <T k={`steps.${i + 1}.title`}>{t}</T>
                    </p>
                    <p className="text-small text-ink-500">
                      <T k={`steps.${i + 1}.text`}>{d}</T>
                    </p>
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
