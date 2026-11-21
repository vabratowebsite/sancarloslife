import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { EventRow } from "@/components/events/EventRow";
import { SubscribeForm } from "@/components/forms/SiteForms";
import { HeroVideo } from "@/components/home/HeroVideo";
import { NeighborhoodGrid } from "@/components/realestate/NeighborhoodGrid";
import { PostCard } from "@/components/content/PostCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { fromLA, laParts } from "@/lib/events/recurrence";
import { listOccurrences } from "@/lib/queries/events";
import { listNeighborhoods } from "@/lib/queries/pages";
import { listPosts } from "@/lib/queries/posts";
import { getSettings, telHref } from "@/lib/queries/settings";
import { metadataFromPage } from "@/lib/pageMeta";
import { absolute } from "@/lib/seo";
import { IMAGES } from "@/content/images";
import { editablePage, editImgAttrs, ei, EditMarker, T } from "@/lib/pageEdits";
import type { Post } from "@/payload-types";

/** Home page copy (code; owner's decision 2026-11-21). The hero loop is the live site's Vimeo video. */
const home = {
  heroEyebrow: "Your guide to the City of Good Living",
  heroTitle: "This is San Carlos Life",
  heroIntro:
    "Events, restaurants, neighborhoods and homes for sale in San Carlos, California 94070. Don't miss the latest news in town.",
  heroVimeoId: "882272881",
  agentHeading: "Thinking of buying or selling a home?",
  agentText:
    "Viv and Mark have 30+ years of combined experience and 95% of their clients come from referrals.",
  subscribeHeading: "Don't miss out",
  subscribeText:
    "One email a week with events, new restaurants, and what sold in San Carlos.",
};

export const generateMetadata = (): Promise<Metadata> =>
  metadataFromPage("home", {
    title: "Your Guide to San Carlos CA | San Carlos Life",
    description:
      'Live in California\'s "City of Good Living". Find the latest news, best restaurants, things to do, events calendar, real estate in San Carlos CA 94070',
  });

/** Today 00:00 to 8 days out, Los Angeles time, rounded so the cache key changes once a day. */
function thisWeek() {
  const p = laParts(new Date());
  const from = fromLA(p.year, p.month, p.day);
  const to = new Date(from.getTime() + 8 * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

const btn =
  "eyebrow inline-flex items-center rounded-button border-2 px-6 py-3 transition-colors";

export default async function Home() {
  await editablePage("home", "/");
  const week = thisWeek();
  const [settings, occ, posts, hoods] = await Promise.all([
    getSettings(),
    listOccurrences(week),
    listPosts({ page: 1 }),
    listNeighborhoods(),
  ]);
  // A thin week still shows something: fall back to the next 60 days.
  const events =
    occ.length >= 4
      ? occ.slice(0, 4)
      : (
          await listOccurrences({
            from: week.from,
            to: new Date(
              new Date(week.from).getTime() + 60 * 86400000,
            ).toISOString(),
          })
        ).slice(0, 4);
  const poster = ei("hero.image", IMAGES.homeHero);
  const agent = ei("agent.photo", IMAGES.homeAgents);
  const latest = (posts.docs as Post[]).slice(0, 3);

  return (
    <>
      <EditMarker />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "San Carlos Life",
          url: absolute("/"),
          potentialAction: {
            "@type": "SearchAction",
            target: `${absolute("/search/")}?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }}
      />

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-ink-900 text-white">
        {poster && (
          <Image
            {...editImgAttrs(poster)}
            src={poster.src}
            alt=""
            fill
            priority
            sizes="100vw"
            className="-z-20 object-cover"
          />
        )}
        {home.heroVimeoId && <HeroVideo vimeoId={home.heroVimeoId} />}
        <div
          className="absolute inset-0 -z-[5] bg-gradient-to-r from-ink-900/85 via-ink-900/60 to-ink-900/20"
          aria-hidden="true"
        />
        <div className="container-site relative py-24 md:py-32">
          {home.heroEyebrow && (
            <p className="eyebrow text-teal-50">
              <T k="hero.eyebrow">{home.heroEyebrow}</T>
            </p>
          )}
          <h1 className="mt-3 max-w-3xl text-h1 text-white">
            <T k="hero.title">{home.heroTitle}</T>
          </h1>
          {home.heroIntro && (
            <p className="mt-5 max-w-2xl text-lg text-white/90">
              <T k="hero.intro">{home.heroIntro}</T>
            </p>
          )}
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/events/"
              className={`${btn} border-teal-700 bg-teal-700 text-white hover:border-teal-500 hover:bg-teal-500`}
            >
              <T k="hero.button1">What’s on this week</T>
            </Link>
            <Link
              href="/homes-for-sale-in-san-carlos-ca/"
              className={`${btn} border-white text-white hover:bg-white hover:text-ink-900`}
            >
              <T k="hero.button2">Homes for sale</T>
            </Link>
          </div>
        </div>
      </section>

      {/* This week */}
      <section className="py-16" aria-labelledby="week-heading">
        <div className="container-site">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-teal-700">
                <T k="events.eyebrow">Events</T>
              </p>
              <h2 id="week-heading" className="mt-1 text-h2">
                {occ.length >= 4 ? (
                  <T k="events.heading-week">This week in San Carlos</T>
                ) : (
                  <T k="events.heading-later">Coming up in San Carlos</T>
                )}
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
              Nothing on the calendar yet. Know of something?{" "}
              <Link href="/events/submit/">Submit an event</Link>.
            </p>
          )}
        </div>
      </section>

      {/* Homes for sale teaser. Live listings arrive with Buying Buddy (milestone 18). */}
      <section className="bg-teal-50 py-16" aria-labelledby="homes-heading">
        <div className="container-site grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
          <div>
            <p className="eyebrow text-teal-700">
              <T k="homes.eyebrow">Real estate</T>
            </p>
            <h2 id="homes-heading" className="mt-1 text-h2">
              <T k="homes.heading">Homes for sale in San Carlos</T>
            </h2>
            <p className="mt-4 text-ink-500">
              <T k="homes.text">
                Search live MLS listings, browse by neighborhood, or see this
                weekend’s open houses. Save a search and get new listings by
                email.
              </T>
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                href="/homes-for-sale-in-san-carlos-ca/"
                className={`${btn} border-teal-700 bg-teal-700 text-white hover:border-teal-500 hover:bg-teal-500`}
              >
                <T k="homes.button1">Search homes</T>
              </Link>
              <Link
                href="/open-houses-in-san-carlos-ca/"
                className={`${btn} border-teal-700 text-teal-700 hover:bg-white`}
              >
                <T k="homes.button2">Open houses this weekend</T>
              </Link>
            </div>
          </div>
          <div className="rounded-card bg-white p-6 shadow-card">
            <h3 className="font-heading text-[22px]">
              <T k="value.heading">What’s my home worth?</T>
            </h3>
            <p className="mt-2 text-ink-500">
              <T k="value.text">
                Get a free, no-obligation valuation from Viv and Mark, based on
                recent San Carlos sales.
              </T>
            </p>
            <div className="mt-5 flex flex-wrap gap-4">
              <Link
                href="/sell-my-house/"
                className={`${btn} border-coral-700 bg-coral-700 text-white hover:border-ink-900 hover:bg-ink-900`}
              >
                <T k="value.button">Get my valuation</T>
              </Link>
              <Link
                href="/san-carlos-ca-real-estate-market-trends/"
                className="self-center font-bold"
              >
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
            <p className="eyebrow text-teal-700">
              <T k="hoods.eyebrow">Neighborhoods</T>
            </p>
            <h2 id="hoods-heading" className="mt-1 text-h2">
              <T k="hoods.heading">Find your corner of San Carlos</T>
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
              <p className="eyebrow text-teal-700">
                <T k="blog.eyebrow">Blog</T>
              </p>
              <h2 id="blog-heading" className="mt-1 text-h2">
                <T k="blog.heading">Latest from San Carlos Life</T>
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
              {...editImgAttrs(agent)}
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
              <T k="agent.heading">{home.agentHeading}</T>
            </h2>
            {home.agentText && (
              <p className="mt-4 text-ink-500">
                <T k="agent.text">{home.agentText}</T>
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-4">
              <a
                href={telHref(settings.phone)}
                className={`${btn} border-teal-700 bg-teal-700 text-white hover:border-teal-500 hover:bg-teal-500`}
              >
                <T k="agent.call">Call us</T>
              </a>
              <a
                href={`mailto:${settings.email}`}
                className={`${btn} border-teal-700 text-teal-700 hover:bg-teal-50`}
              >
                <T k="agent.email">Send us an email</T>
              </a>
              <Link
                href="/one-of-the-best-realtor-teams-in-san-carlos-ca/"
                className="self-center font-bold"
              >
                Meet Viv &amp; Mark <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Subscribe */}
      <section
        className="bg-teal-700 py-16 text-white"
        aria-labelledby="subscribe-heading"
      >
        <div className="container-site grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center">
          <div>
            <h2 id="subscribe-heading" className="text-h2 text-white">
              <T k="subscribe.heading">{home.subscribeHeading}</T>
            </h2>
            {home.subscribeText && (
              <p className="mt-3 text-white">
                <T k="subscribe.text">{home.subscribeText}</T>
              </p>
            )}
          </div>
          <div className="rounded-card bg-white p-6 text-ink-900">
            <SubscribeForm compact />
          </div>
        </div>
      </section>
    </>
  );
}
