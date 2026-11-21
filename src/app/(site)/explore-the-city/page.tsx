import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import {
  CardGrid,
  Cta,
  FeaturedPlaces,
  PageHero,
  ParkCards,
  Section,
  UpcomingEvents,
} from "@/components/sections";
import { EXPLORE_CARDS } from "@/content/explore";
import { metadataFromPage } from "@/lib/pageMeta";
import { editablePage, EditMarker, T } from "@/lib/pageEdits";

const SLUG = "explore-the-city";
const TITLE = "Explore the City";
const INTRO =
  "Restaurants, attractions, events, parks and trails in San Carlos, California.";

export const generateMetadata = () =>
  metadataFromPage(SLUG, { title: TITLE, description: INTRO });

export default async function ExploreTheCityPage() {
  await editablePage(SLUG, `/${SLUG}/`);
  return (
    <>
      <EditMarker />
      <PageHero
        ek="hero"
        title={TITLE}
        subheading={INTRO}
        crumbs={<Breadcrumbs items={[{ name: TITLE, path: `/${SLUG}/` }]} />}
      />

      <Section
        id="places"
        ek="places"
        eyebrow="Places to visit"
        heading="Let us guide you there"
      >
        <p className="mb-6 max-w-3xl text-ink-500">
          <T k="places.intro">
            San Carlos and its neighboring towns are home to some of the most
            beautiful landscapes in California: forests, the bay, gardens and
            flower beds, even aerial tours. There’s lots of culture, history,
            entertainment and outdoor living to enjoy.
          </T>
        </p>
        <CardGrid ek="places.cards" cards={EXPLORE_CARDS} />
      </Section>

      <Section
        id="events"
        ek="events"
        eyebrow="Coming up"
        heading="Upcoming events"
        more={{ label: "Full calendar", href: "/events/" }}
        band
      >
        <UpcomingEvents limit={4} />
      </Section>

      <Section
        id="restaurants"
        ek="restaurants"
        eyebrow="Eat & drink"
        heading="Featured restaurants"
        more={{
          label: "All restaurants",
          href: "/restaurants-and-services/all-restaurants/",
        }}
      >
        <FeaturedPlaces kind="restaurants" limit={6} />
      </Section>

      <Section
        id="parks"
        ek="parks"
        eyebrow="Outdoors"
        heading="Parks"
        more={{ label: "All parks", href: "/parks-of-san-carlos/" }}
        band
      >
        <ParkCards limit={6} />
      </Section>

      <Cta
        ek="cta"
        heading="Never miss a thing"
        text="One email a week with events, new restaurants, and what sold in San Carlos."
        buttons={[{ label: "Subscribe", href: "/subscribe/" }]}
      />
    </>
  );
}

export const revalidate = 600;
