import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import Image from "next/image";
import Link from "next/link";

import { EventRow } from "@/components/events/EventRow";
import { SubscribeForm } from "@/components/forms/SiteForms";
import { HeroVideo } from "@/components/home/HeroVideo";
import { NeighborhoodGrid } from "@/components/realestate/NeighborhoodGrid";
import { PostCard } from "@/components/content/PostCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { fromLA, laParts } from "@/lib/events/recurrence";
import { mediaSrc } from "@/lib/media";
import { getPayloadClient } from "@/lib/payload";
import { listOccurrences } from "@/lib/queries/events";
import { listNeighborhoods } from "@/lib/queries/pages";
import { listPosts } from "@/lib/queries/posts";
import { getSettings, telHref } from "@/lib/queries/settings";
import { absolute, buildMetadata } from "@/lib/seo";
import type { HomePage, Post } from "@/payload-types";

const getHome = unstable_cache(
  async () => (await getPayloadClient()).findGlobal({ slug: "home-page", depth: 1 }) as Promise<HomePage>,
  ["home-page"],
  { tags: ["home-page"], revalidate: 3600 },
);

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Your Guide to San Carlos CA | San Carlos Life",
    description:
      'Live in California\'s "City of Good Living". Find the latest news, best restaurants, things to do, events calendar, real estate in San Carlos CA 94070',
    path: "/",
  });
}

/** Today 00:00 to 8 days out, Los Angeles time, rounded so the cache key changes once a day. */
function thisWeek() {
  const p = laParts(new Date());
  const from = fromLA(p.year, p.month, p.day);
  const to = new Date(from.getTime() + 8 * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

const btn = "eyebrow inline-flex items-center rounded-button border-2 px-6 py-3 transition-colors";

export default async function Home() {
  const week = thisWeek();
  const [home, settings, occ, posts, hoods] = await Promise.all([
    getHome(),
    getSettings(),
    listOccurrences(week),
    listPosts({ page: 1 }),
    listNeighborhoods(),
  ]);
  // A thin week still shows something: fall back to the next 60 days.
  const events =
    occ.length >= 4
      ? occ.slice(0, 4)
      : (await listOccurrences({ from: week.from, to: new Date(new Date(week.from).getTime() + 60 * 86400000).toISOString() })).slice(0, 4);
  const poster = mediaSrc(home.heroPoster, "hero");
  const agent = mediaSrc(home.agentPhoto, "card");
  const latest = (posts.docs as Post[]).slice(0, 3);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "San Carlos Life",
          url: absolute("/"),
          potentialAction: { "@type": "SearchAction", target: `${absolute("/search/")}?q={search_term_string}`, "query-input": "required name=search_term_string" },
        }}
      />

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-ink-900 text-white">
        {poster && (
          <Image src={poster.src} alt="" fill priority sizes="100vw" className="-z-20 object-cover" />
        )}
        {home.heroVimeoId && <HeroVideo vimeoId={home.heroVimeoId} />}
        <div className="absolute inset-0 -z-[5] bg-gradient-to-r from-ink-900/85 via-ink-900/60 to-ink-900/20" aria-hidden="true" />
        <div className="container-site relative py-24 md:py-32">
          {home.heroEyebrow && <p className="eyebrow text-teal-50">{home.heroEyebrow}</p>}
          <h1 className="mt-3 max-w-3xl text-h1 text-white">{home.heroTitle}</h1>
          {home.heroIntro && <p className="mt-5 max-w-2xl text-lg text-white/90">{home.heroIntro}</p>}
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/events/" className={`${btn} border-teal-700 bg-teal-700 text-white hover:border-teal-500 hover:bg-teal-500`}>
              What&rsquo;s on this week
            </Link>
            <Link href="/homes-for-sale-in-san-carlos-ca/" className={`${btn} border-white text-white hover:bg-white hover:text-ink-900`}>
              Homes for sale
            </Link>
          </div>
        </div>
      </section>

      {/* This week */}
      <section className="py-16" aria-labelledby="week-heading">
        <div className="container-site">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-teal-700">Events</p>
              <h2 id="week-heading" className="mt-1 text-h2">
                {occ.length >= 4 ? "This week in San Carlos" : "Coming up in San Carlos"}
              </h2>
            </div>
            <Link href="/events/" className="font-bold">
              Full calendar <span aria-hidden="true">→</span>
            </Link>
          </div>
          {events.length ? (
            <ul className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
              {events.map((o) => (
                <li key={`${o.event.id}-${o.start}`} className="min-w-0">
                  <EventRow occ={o} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-8 text-ink-500">
              Nothing on the calendar yet. Know of something? <Link href="/events/submit/">Submit an event</Link>.
            </p>
          )}
        </div>
      </section>

      {/* Homes for sale teaser. Live listings arrive with Buying Buddy (milestone 18). */}
      <section className="bg-teal-50 py-16" aria-labelledby="homes-heading">
        <div className="container-site grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
          <div>
            <p className="eyebrow text-teal-700">Real estate</p>
            <h2 id="homes-heading" className="mt-1 text-h2">
              Homes for sale in San Carlos
            </h2>
            <p className="mt-4 text-ink-500">
              Search live MLS listings, browse by neighborhood, or see this weekend&rsquo;s open houses. Save a search and get new listings by
              email.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link href="/homes-for-sale-in-san-carlos-ca/" className={`${btn} border-teal-700 bg-teal-700 text-white hover:border-teal-500 hover:bg-teal-500`}>
                Search homes
              </Link>
              <Link href="/open-houses-in-san-carlos-ca/" className={`${btn} border-teal-700 text-teal-700 hover:bg-white`}>
                Open houses this weekend
              </Link>
            </div>
          </div>
          <div className="rounded-card bg-white p-6 shadow-card">
            <h3 className="font-heading text-[22px]">What&rsquo;s my home worth?</h3>
            <p className="mt-2 text-ink-500">
              Get a free, no-obligation valuation from Viv and Mark, based on recent San Carlos sales.
            </p>
            <div className="mt-5 flex flex-wrap gap-4">
              <Link href="/sell-my-house/" className={`${btn} border-coral-700 bg-coral-700 text-white hover:border-ink-900 hover:bg-ink-900`}>
                Get my valuation
              </Link>
              <Link href="/san-carlos-ca-real-estate-market-trends/" className="self-center font-bold">
                Market trends <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Neighborhoods */}
      {hoods.length > 0 && (
        <section className="py-16" aria-labelledby="hoods-heading">
          <div className="container-site">
            <p className="eyebrow text-teal-700">Neighborhoods</p>
            <h2 id="hoods-heading" className="mt-1 text-h2">
              Find your corner of San Carlos
            </h2>
            <div className="mt-8">
              <NeighborhoodGrid hoods={hoods} />
            </div>
          </div>
        </section>
      )}

      {/* Latest posts */}
      <section className="bg-sand-100 py-16" aria-labelledby="blog-heading">
        <div className="container-site">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-teal-700">Blog</p>
              <h2 id="blog-heading" className="mt-1 text-h2">
                Latest from San Carlos Life
              </h2>
            </div>
            <Link href="/san-carlos-life-blog/" className="font-bold">
              All posts <span aria-hidden="true">→</span>
            </Link>
          </div>
          <ul className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-gutter sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((p) => (
              <li key={p.id} className="flex min-w-0">
                <PostCard post={p} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Buy or sell */}
      <section className="py-16" aria-labelledby="agent-heading">
        <div className="container-site grid items-center gap-10 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          {agent && (
            <Image
              src={agent.src}
              alt="Viv Kelvin and Mark Martinho of Vabrato Real Estate"
              width={agent.width}
              height={agent.height}
              sizes="(min-width: 768px) 40vw, 100vw"
              className="w-full rounded-card object-cover shadow-card"
            />
          )}
          <div>
            <h2 id="agent-heading" className="text-h2">
              {home.agentHeading}
            </h2>
            {home.agentText && <p className="mt-4 text-ink-500">{home.agentText}</p>}
            <div className="mt-6 flex flex-wrap gap-4">
              <a href={telHref(settings.phone)} className={`${btn} border-teal-700 bg-teal-700 text-white hover:border-teal-500 hover:bg-teal-500`}>
                Call us
              </a>
              <a href={`mailto:${settings.email}`} className={`${btn} border-teal-700 text-teal-700 hover:bg-teal-50`}>
                Send us an email
              </a>
              <Link href="/one-of-the-best-realtor-teams-in-san-carlos-ca/" className="self-center font-bold">
                Meet Viv &amp; Mark <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Subscribe */}
      <section className="bg-teal-700 py-16 text-white" aria-labelledby="subscribe-heading">
        <div className="container-site grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center">
          <div>
            <h2 id="subscribe-heading" className="text-h2 text-white">
              {home.subscribeHeading}
            </h2>
            {home.subscribeText && <p className="mt-3 text-white">{home.subscribeText}</p>}
          </div>
          <div className="rounded-card bg-white p-6 text-ink-900">
            <SubscribeForm compact />
          </div>
        </div>
      </section>
    </>
  );
}
