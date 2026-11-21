import type { Metadata } from "next";

import { FormPage } from "@/components/forms/FormPage";
import { SubscribeForm } from "@/components/forms/SiteForms";
import { buildMetadata } from "@/lib/seo";
import { editablePage, EditMarker, T } from "@/lib/pageEdits";

export const metadata: Metadata = buildMetadata({
  path: "/subscribe/",
  title: "Subscribe to the San Carlos Life Newsletter",
  description:
    "Events, new restaurants, city news and the local home market in one weekly email about San Carlos, California.",
});

export default async function SubscribePage() {
  await editablePage("subscribe", "/subscribe/");
  return (
    <>
      <EditMarker />
      <FormPage
        title={<T k="title">Subscribe to San Carlos Life</T>}
        crumbs={[{ name: "Subscribe", path: "/subscribe/" }]}
        intro={
          <p>
            <T k="intro">
              The weekend&rsquo;s events, new restaurants, what the City decided
              and the local home market, once a week.
            </T>
          </p>
        }
      >
        <div className="max-w-xl">
          <SubscribeForm />
        </div>
      </FormPage>
    </>
  );
}
