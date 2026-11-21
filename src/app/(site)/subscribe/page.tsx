import type { Metadata } from "next";

import { FormPage } from "@/components/forms/FormPage";
import { SubscribeForm } from "@/components/forms/SiteForms";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  path: "/subscribe/",
  title: "Subscribe to the San Carlos Life Newsletter",
  description: "Events, new restaurants, city news and the local home market in one weekly email about San Carlos, California.",
});

export default function SubscribePage() {
  return (
    <FormPage
      title="Subscribe to San Carlos Life"
      crumbs={[{ name: "Subscribe", path: "/subscribe/" }]}
      intro={<p>The weekend&rsquo;s events, new restaurants, what the City decided and the local home market, once a week.</p>}
    >
      <div className="max-w-xl">
        <SubscribeForm />
      </div>
    </FormPage>
  );
}
