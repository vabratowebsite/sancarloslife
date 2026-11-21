import type { Metadata } from "next";

import { FormPage } from "@/components/forms/FormPage";
import { ContactForm } from "@/components/forms/SiteForms";
import { SidebarCta } from "@/components/layout/SidebarCta";
import { getSettings, telHref } from "@/lib/queries/settings";
import { buildMetadata } from "@/lib/seo";
import { editablePage, EditMarker, T } from "@/lib/pageEdits";

export const metadata: Metadata = buildMetadata({
  path: "/contact-us/",
  title: "Contact San Carlos Life",
  description:
    "Send San Carlos Life a question, a story idea, an event, or a correction. We reply within two business days.",
});

export default async function ContactPage() {
  await editablePage("contact-us", "/contact-us/");
  const settings = await getSettings();
  return (
    <>
      <EditMarker />
      <FormPage
        title={<T k="title">Contact us</T>}
        crumbs={[{ name: "Contact", path: "/contact-us/" }]}
        intro={
          <p>
            <T k="intro">
              Story ideas, events, business listings, corrections and questions
              are all welcome. You can also call
            </T>{" "}
            <a href={telHref(settings.phone)}>{settings.phone}</a>{" "}
            <T k="intro.or">or email</T>{" "}
            <a href={`mailto:${settings.email}`}>{settings.email}</a>.
          </p>
        }
        aside={<SidebarCta settings={settings} />}
      >
        <ContactForm />
      </FormPage>
    </>
  );
}
