import type { Metadata } from "next";

import { FormPage } from "@/components/forms/FormPage";
import { PhotoSubmitForm } from "@/components/forms/SiteForms";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  path: "/gallery/submit/",
  title: "Send a Photo to the San Carlos Photo Gallery",
  description: "Share your photo of San Carlos. Chosen photos are posted on San Carlos Life with credit to you.",
});

export default function SubmitPhotoPage() {
  return (
    <FormPage
      title="Send us your photo"
      crumbs={[
        { name: "Photo Gallery", path: "/gallery/" },
        { name: "Send a photo", path: "/gallery/submit/" },
      ]}
      intro={<p>The gallery tells the story of San Carlos through its residents&rsquo; photos. Chosen photos are posted with credit to you.</p>}
    >
      <div className="max-w-2xl">
        <PhotoSubmitForm />
      </div>
    </FormPage>
  );
}
