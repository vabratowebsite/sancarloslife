import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { YouTubeGrid } from "@/components/media/YouTubeGrid";
import { VIDEO_SECTIONS, VIDEOS_INTRO } from "@/content/videos";
import { getPageSeo } from "@/lib/queries/pages";
import { getSettings } from "@/lib/queries/settings";
import { buildMetadata } from "@/lib/seo";
import { editablePage, EditMarker, T, tx } from "@/lib/pageEdits";

const SLUG = "videos-of-san-carlos-ca";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageSeo("videos-of-san-carlos-ca");
  return buildMetadata({
    path: "/videos-of-san-carlos-ca/",
    title: "Videos of San Carlos, CA: Restaurants, Events and Neighborhoods",
    description: "Short videos of San Carlos restaurants and shops, event highlights and neighborhood guides.",
    seo: page?.seo,
  });
}

export default async function VideosPage() {
  await editablePage(SLUG, `/${SLUG}/`);
  const settings = await getSettings();
  const youtube = settings.social.find((s) => s.platform === "youtube")?.url;
  return (
    <>
      <EditMarker />
      <section className="bg-teal-50">
        <div className="container-site py-12">
          <Breadcrumbs items={[{ name: "Videos", path: "/videos-of-san-carlos-ca/" }]} />
          <h1 className="mt-3 text-h2 md:text-h1">
            <T k="title">Videos of San Carlos</T>
          </h1>
          <p className="mt-3 max-w-2xl text-ink-500">
            <T k="intro">{VIDEOS_INTRO}</T>
          </p>
        </div>
      </section>
      <div className="container-site py-10">
        {VIDEO_SECTIONS.map((s) => (
          <section key={s.id} aria-labelledby={`v-${s.id}`} className="mb-14">
            <h2 id={`v-${s.id}`} className="text-h3">
              <T k={`section.${s.id}`}>{s.title}</T>
            </h2>
            {s.playlistId && (
              <div className="mt-6 max-w-3xl">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(s.playlistId)}&rel=0`}
                  title={`${tx(`section.${s.id}`, s.title)} playlist`}
                  loading="lazy"
                  allow="accelerometer; encrypted-media; picture-in-picture"
                  allowFullScreen
                  className="aspect-video w-full rounded-card"
                />
              </div>
            )}
            {s.videos.length > 0 && (
              <div className="mt-6">
                <YouTubeGrid videos={s.videos} />
              </div>
            )}
          </section>
        ))}
        {youtube && (
          <p className="rounded-card bg-sand-100 p-6">
            <T k="more">More event highlights and neighborhood guides are on the</T>{" "}
            <a href={youtube} target="_blank" rel="noopener noreferrer">
              <T k="more.link">Vabrato Real Estate YouTube channel</T>
            </a>
            .
          </p>
        )}
      </div>
    </>
  );
}

export const revalidate = 3600;
