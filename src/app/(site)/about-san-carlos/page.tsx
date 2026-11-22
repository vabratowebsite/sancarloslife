import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import {
  CardGrid,
  Cta,
  Faq,
  FeatureList,
  Figure,
  PageHero,
  Prose,
  Section,
  Stats,
  Video,
} from "@/components/sections";
import { EXPLORE_CARDS } from "@/content/explore";
import { IMAGES } from "@/content/images";
import { metadataFromPage } from "@/lib/pageMeta";
import { editablePage, EditMarker, T } from "@/lib/pageEdits";
import { DiviPage } from "@/components/divi/DiviPage";
import { diviLayout } from "@/lib/divi/layouts";

const SLUG = "about-san-carlos";
const TITLE = "What’s Great about San Carlos?";
const INTRO =
  "Top schools, beautiful homes, a downtown of its own, parks and trails, and a history that goes back to the 1700s.";

export const generateMetadata = () =>
  metadataFromPage(SLUG, {
    title: TITLE,
    description: INTRO,
    image: IMAGES.aboutHero,
  });

const FAQ = [
  {
    question: "What is San Carlos, California known for?",
    answer:
      "The walkable downtown on Laurel Street, the schools, the parks, and the Caltrain stop. Locals call it the City of Good Living. It sits midway down the Peninsula in San Mateo County, between Belmont and Redwood City, with quick freeway access in both directions.",
  },
  {
    question: "Is San Carlos a good place to live?",
    answer:
      'For people who want a smaller-town feel with full Bay Area access, yes. It regularly appears on "best places to live" lists. The trade-off is cost: homes are expensive and inventory is tight. Whether it\'s the right fit comes down to budget, commute, and what you want your weekends to look like.',
  },
  {
    question: "Where is San Carlos located?",
    answer:
      "On the San Francisco Peninsula in San Mateo County, between Belmont to the north and Redwood City to the south. Highway 101, Interstate 280, El Camino Real and Caltrain all run through or alongside the city.",
  },
  {
    question: "What's the lifestyle like?",
    answer:
      "Quiet residential streets, a downtown people actually walk to, a busy calendar of community events, and park access that makes weekends easy. Plenty of families, plenty of dogs, and a Caltrain ride to San Francisco or Silicon Valley without driving.",
  },
  {
    question: "Is San Carlos walkable?",
    answer:
      "Parts of it. Around Laurel Street, El Camino, Burton Park and the Caltrain station, walking is the norm. Hillside neighborhoods on the west side are more car-dependent, mostly because of slope and street layout.",
  },
  {
    question: "How are the parks and trails?",
    answer:
      "Strong for a city this size. Burton Park is the community hub. Highlands Park has athletic facilities. Big Canyon, Vista Park and Eaton Park offer real hiking. There's a dog exercise area at Heather Park and playgrounds in nearly every neighborhood.",
  },
  {
    question: "What should people know before moving here?",
    answer:
      "Compare neighborhoods before settling on one; they're more different than they look on a map. Drive the commute. Verify the school assignment for the exact address you're considering. And budget realistically for hillside conditions if you're looking west: driveways, parking and landscaping cost more on a slope.",
  },
];

export default async function AboutSanCarlosPage() {
  // The live site\'s exact layout (src/content/divi); the code below is the earlier version.
  const layout = diviLayout("about-san-carlos");
  if (layout) return <DiviPage layout={layout} />;
  await editablePage(SLUG, `/${SLUG}/`);
  return (
    <>
      <EditMarker />
      <PageHero
        ek="hero"
        title={TITLE}
        subheading={INTRO}
        image={IMAGES.aboutHero}
        crumbs={<Breadcrumbs items={[{ name: TITLE, path: `/${SLUG}/` }]} />}
      />

      <Section id="video">
        <Video
          youtubeId="_vUY1Bv4g5Y"
          title="San Carlos Life, with Viv Kelvin and Mark Martinho"
        />
      </Section>

      <Section
        ek="facts"
        id="quick-facts"
        eyebrow="Quick facts"
        heading="San Carlos at a glance"
        band
      >
        <Stats
          ek="facts.items"
          items={[
            { value: "30,722", label: "Population" },
            { value: "$189,739", label: "Median household income" },
            { value: "11,894", label: "Residential homes" },
            { value: "5.41", label: "Total area in square miles" },
          ]}
          note="Figures as published on the previous San Carlos Life site; check the latest U.S. Census QuickFacts before quoting them."
        />
      </Section>

      <Section
        ek="schools"
        id="schools"
        eyebrow="Schools in San Carlos"
        heading="Top schools in California"
      >
        <Prose>
          <p>
            <T k="schools.p1">
              Public schools overseen by the San Carlos School District rank
              among the highest in the United States. Elementary and middle
              schools in San Carlos place within the top 5% in the state of
              California.
            </T>
          </p>
          <p>
            <T k="schools.p2">
              In January 2023 the California Department of Education (CDE)
              published its list of Distinguished Elementary Schools, and every
              elementary school in San Carlos made the list. Of the 5,872
              elementary schools in California, only 356 were selected (roughly
              6%). Leading the group is White Oaks Elementary School, which
              ranks at about #5 of all California elementary schools, while
              Central Middle School ranks #100 of all California middle schools.
            </T>
          </p>
          <p>
            <T k="schools.p3">
              The city’s public school system serves students from kindergarten
              through eighth grade across nine schools. Older students go on to
              Carlmont High School in Belmont or Sequoia High School in Redwood
              City, both part of the Sequoia Union High School District.
            </T>
          </p>
          <h3>
            <T k="schools.h-which">Which schools will my children go to?</T>
          </h3>
          <p>
            <T k="schools.which.1">Look up any address with the</T>{" "}
            <a href="https://locator.decisioninsite.com/?studyId=199008">
              <T k="schools.which.link1">San Carlos School Locator</T>
            </a>
            <T k="schools.which.2">, or read the district’s</T>{" "}
            <a href="https://www.scsdk8.org/apps/pages/School-Boundaries">
              <T k="schools.which.link2">school boundaries guide</T>
            </a>
            .
          </p>
          <h3>
            <T k="schools.h-contact">Who can I contact for more information?</T>
          </h3>
          <p>
            <a href="https://www.scsdk8.org/">
              <T k="schools.contact.name">San Carlos School District</T>
            </a>
            <br />
            <T k="schools.contact.address">
              1200 Industrial Road, Unit 9, San Carlos, CA 94070
            </T>
            <br />
            <T k="schools.contact.phone">
              Phone (650) 508-7333 · Fax (650) 508-7340
            </T>
          </p>
          <p>
            <T k="schools.staff.1">
              For individual departments, see the district’s
            </T>{" "}
            <a href="https://www.scsdk8.org/apps/pages/index.jsp?uREC_ID=1136262&type=d&pREC_ID=1394035">
              <T k="schools.staff.link">staff directory</T>
            </a>
            .
          </p>
        </Prose>
        <div className="mt-8">
          <Figure
            ek="schools.photo"
            image={IMAGES.centralMiddleSchool}
            caption="Central Middle School, a California Distinguished School"
          />
        </div>
      </Section>

      <Section
        ek="living"
        id="living"
        eyebrow="Living in San Carlos"
        heading="The City of Good Living"
        band
      >
        <FeatureList
          ek="living.items"
          intro="A few reasons people choose to live in San Carlos."
          items={[
            {
              title: "Beautiful homes",
              text: "Many hillside homes look out over the bay. A mix of modern and historic architecture, they are among the most sought-after on the Peninsula.",
            },
            {
              title: "Strategic location",
              text: "Midway between San Francisco and Silicon Valley, with an easy commute in either direction by car or Caltrain.",
            },
            {
              title: "Downtown",
              text: "A walkable downtown on Laurel Street with cafes, restaurants and boutique shops. Everyday services are close by, and within walking distance in some neighborhoods.",
            },
            {
              title: "Parks & hiking trails",
              text: "Parks spread across every neighborhood, with playgrounds, sports fields and tennis courts, plus hiking in the nearby canyons and hills.",
            },
            {
              title: "Safe streets",
              text: "San Carlos is known as a safe, family-friendly city, with policing provided by the San Mateo County Sheriff's Office.",
            },
            {
              title: "Good weather",
              text: "A mild Mediterranean climate: sunny most of the year, with winter rain and no snow.",
            },
          ]}
        />
      </Section>

      <Section
        ek="explore"
        id="explore"
        eyebrow="Things to do in San Carlos"
        heading="Explore the city"
      >
        <p className="mb-6 max-w-3xl text-ink-500">
          <T k="explore.intro">
            Browse the restaurants, shops, attractions, events, parks and trails
            in San Carlos.
          </T>
        </p>
        <CardGrid ek="explore.cards" cards={EXPLORE_CARDS} />
      </Section>

      <Section
        ek="faq"
        id="faq"
        heading="About San Carlos: common questions"
        band
      >
        <Faq ek="faq.items" items={FAQ} />
      </Section>

      <Cta
        ek="cta"
        heading="Thinking of moving to San Carlos?"
        text="Viv and Mark know every neighborhood. Ask them anything, or start browsing homes for sale."
        buttons={[
          { label: "Contact Viv & Mark", href: "/contact-us/" },
          {
            label: "Homes for sale",
            href: "/homes-for-sale-in-san-carlos-ca/",
          },
        ]}
      />
    </>
  );
}
