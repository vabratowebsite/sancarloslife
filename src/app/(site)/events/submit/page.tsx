import type { Metadata } from "next";

import { FormPage } from "@/components/forms/FormPage";
import { EventSubmitForm } from "@/components/forms/SiteForms";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  path: "/events/submit/",
  title: "Submit an Event in San Carlos",
  description: "Add your San Carlos event to the San Carlos Life community calendar. It's free.",
});

export default function SubmitEventPage() {
  return (
    <FormPage
      title="Submit an event"
      crumbs={[
        { name: "Events", path: "/events/" },
        { name: "Submit an event", path: "/events/submit/" },
      ]}
      intro={<p>Listing is free for anything happening in San Carlos. We check every event before it goes on the calendar, usually within two days.</p>}
      aside={
        <aside className="rounded-card bg-teal-50 p-6 text-small">
          <h2 className="eyebrow text-teal-700">What we list</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Events open to the public in San Carlos</li>
            <li>Community, school, library, arts, food and civic events</li>
            <li>Recurring events (tell us the pattern in the description)</li>
          </ul>
        </aside>
      }
    >
      <EventSubmitForm />
    </FormPage>
  );
}
