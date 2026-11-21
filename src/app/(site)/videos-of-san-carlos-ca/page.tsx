import type { Metadata } from "next";
import { unstable_cache } from "next/cache";

import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { YouTubeGrid } from "@/components/media/YouTubeGrid";
import { getPayloadClient } from "@/lib/payload";
import { getPageBySlug } from "@/lib/queries/pages";
import { getSettings } from "@/lib/queries/settings";
import { buildMetadata } from "@/lib/seo";

const getVideosPage = unstable_cache(
  async () => (await getPayloadClient()).findGlobal({ slug: "videos-page" }),
  ["videos-page"],
  { tags: ["videos-page"], revalidate: 3600 },
);

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("videos-of-san-carlos-ca");
  return buildMetadata({
    path: "/videos-of-san-carlos-ca/",
    title: "Videos of San Carlos, CA: Restaurants, Events and Neighborhoods",
    description: "Short videos of San Carlos restaurants and shops, event highlights and neighborhood guides.",
    seo: page?.seo,
  });
}

export default async function VideosPage() {
  const [data, settings] = await Promise.all([getVideosPage(), getSettings()]);
  const youtube = settings.social.find((s) => s.platform === "youtube")?.url;
  return (
    <>
      <section className="bg-teal-50">
        <div className="container-site py-12">
          <Breadcrumbs items={[{ name: "Videos", path: "/videos-of-san-carlos-ca/" }]} />
          <h1 className="mt-3 text-h2 md:text-h1">Videos of San Carlos</h1>
          {data.intro && <p className="mt-3 max-w-2xl text-ink-500">{data.intro}</p>}
        </div>
      </section>
      <div className="container-site py-10">
        {(data.sections ?? []).map((s) => (
          <section key={s.id} aria-labelledby={`v-${s.id}`} className="mb-14">
            <h2 id={`v-${s.id}`} className="text-h3">
              {s.title}
            </h2>
            {s.playlistId && (
              <div className="mt-6 max-w-3xl">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(s.playlistId)}&rel=0`}
                  title={`${s.title} playlist`}
                  loading="lazy"
                  allow="accelerometer; encrypted-media; picture-in-picture"
                  allowFullScreen
                  className="aspect-video w-full rounded-card"
                />
              </div>
            )}
            {(s.videos ?? []).length > 0 && (
              <div className="mt-6">
                <YouTubeGrid videos={(s.videos ?? []).map((v) => ({ youtubeId: v.youtubeId, title: v.title }))} />
              </div>
            )}
          </section>
        ))}
        {youtube && (
          <p className="rounded-card bg-sand-100 p-6">
            More event highlights and neighborhood guides are on the{" "}
            <a href={youtube} target="_blank" rel="noopener noreferrer">
              Vabrato Real Estate YouTube channel
            </a>
            .
          </p>
        )}
      </div>
    </>
  );
}

export const revalidate = 3600;
