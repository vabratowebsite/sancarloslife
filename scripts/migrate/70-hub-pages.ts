/**
 * Milestones 12 and 19: rebuild About San Carlos, Explore the City and the
 * Viv & Mark page from layout
 * sections. The words come from the live Divi pages (scripts/migrate/data/
 * pages.json, read as data); the Divi markup, the broken WP Go Maps directions
 * widget and the mismatched stats labels are left behind. Photos are picked
 * from imported media by file name. Safe to re-run: it replaces body + layout.
 *   pnpm payload run scripts/migrate/70-hub-pages.ts
 */
import { convertHTMLToLexical, editorConfigFactory } from "@payloadcms/richtext-lexical";
import { JSDOM } from "jsdom";

import { payload, run } from "./lib";

type Layout = Record<string, unknown>[];

const explore = (ids: Record<string, number | null>) => ({
  blockType: "cardGrid",
  source: "manual",
  cards: [
    {
      title: "Restaurants & Services",
      text: "Where to eat, shop and get things done, from Laurel Street to Industrial Road.",
      image: ids.restaurants,
      label: "Browse all",
      href: "/restaurants-and-services/",
    },
    {
      title: "Attractions",
      text: "Museums, aviation, wineries and day trips in and around San Carlos.",
      image: ids.attractions,
      label: "Browse all",
      href: "/attractions/",
    },
    {
      title: "Events & Activities",
      text: "Hometown Days, farmers markets, holiday lights and what's on this week.",
      image: ids.events,
      label: "Browse all",
      href: "/events/",
    },
    {
      title: "Parks & Trails",
      text: "Playgrounds, sports fields, dog areas and canyon hikes across the city.",
      image: ids.parks,
      label: "Browse all",
      href: "/parks-of-san-carlos/",
    },
  ],
});

await run("hub-pages", async () => {
  const p = await payload();
  const byName = async (filename: string) =>
    (await p.find({ collection: "media", where: { filename: { equals: filename } }, limit: 1, depth: 0 })).docs[0]?.id ?? null;
  const ids = {
    restaurants: await byName("doppio-zero-san-carlos-ca-scaled.jpeg"),
    attractions: await byName("Flying-Car-eVTOL-Hiller-Aviation-San-Carlos-1.jpg"),
    events: await byName("night-of-holiday-lights-2022-at-laurel-street-san-carlos-ca-december-friday-photo-by-vabrato-real-estate-9.jpg"),
    parks: await byName("san-carlos-youth-center-at-burton-park-in-howard-park-san-carlos-ca-photo-by-vabrato-real-estate-services-2.jpg"),
    school: await byName("central-middle-school-san-carlos-ca-photo-by-vabrato-real-estate-services.jpg"),
    viv: await byName("viv-kelvin-of-vabrato-real-estate-san-carlos-realtors.jpg"),
    mark: await byName("mark-martinho-of-vabrato-real-estate-san-carlos-realtors.jpg"),
    team: await byName("viv-kelvin-and-mark-martinho-of-vabrato-real-estate-san-carlos-realtors.jpg"),
  };
  for (const [k, v] of Object.entries(ids)) if (!v) console.warn(`image not found: ${k}`);

  // Real rich text (not a raw HTML block), so editors can change it in the admin.
  const editorConfig = await editorConfigFactory.default({ config: p.config });
  const prose = async (html: string) => convertHTMLToLexical({ editorConfig, html: html.replace(/\n\s*/g, ""), JSDOM });

  const about: Layout = [
    { blockType: "video", heading: null, youtubeId: "_vUY1Bv4g5Y", title: "San Carlos Life, with Viv Kelvin and Mark Martinho" },
    {
      blockType: "stats",
      anchor: "quick-facts",
      eyebrow: "Quick facts",
      heading: "San Carlos at a glance",
      items: [
        { value: "30,722", label: "Population" },
        { value: "$189,739", label: "Median household income" },
        { value: "11,894", label: "Residential homes" },
        { value: "5.41", label: "Total area in square miles" },
      ],
      note: "Figures as published on the previous San Carlos Life site; check the latest U.S. Census QuickFacts before quoting them.",
    },
    {
      blockType: "prose",
      anchor: "schools",
      eyebrow: "Schools in San Carlos",
      heading: "Top schools in California",
      content: await prose(`
<p>Public schools overseen by the San Carlos School District rank among the highest in the United States. Elementary and middle schools in San Carlos place within the top 5% in the state of California.</p>
<p>In January 2023 the California Department of Education (CDE) published its list of Distinguished Elementary Schools, and every elementary school in San Carlos made the list. Of the 5,872 elementary schools in California, only 356 were selected (roughly 6%). Leading the group is White Oaks Elementary School, which ranks at about #5 of all California elementary schools, while Central Middle School ranks #100 of all California middle schools.</p>
<p>The city's public school system serves students from kindergarten through eighth grade across nine schools. Older students go on to Carlmont High School in Belmont or Sequoia High School in Redwood City, both part of the Sequoia Union High School District.</p>
<h3>Which schools will my children go to?</h3>
<p>Look up any address with the <a href="https://locator.decisioninsite.com/?studyId=199008">San Carlos School Locator</a>, or read the district's <a href="https://www.scsdk8.org/apps/pages/School-Boundaries">school boundaries guide</a>.</p>
<h3>Who can I contact for more information?</h3>
<p><a href="https://www.scsdk8.org/">San Carlos School District</a><br>1200 Industrial Road, Unit 9, San Carlos, CA 94070<br>Phone (650) 508-7333 · Fax (650) 508-7340</p>
<p>For individual departments, see the district's <a href="https://www.scsdk8.org/apps/pages/index.jsp?uREC_ID=1136262&amp;type=d&amp;pREC_ID=1394035">staff directory</a>.</p>`),
    },
    ...(ids.school ? [{ blockType: "image", image: ids.school, caption: "Central Middle School, a California Distinguished School" }] : []),
    {
      blockType: "featureList",
      anchor: "living",
      eyebrow: "Living in San Carlos",
      heading: "The City of Good Living",
      intro: "A few reasons people choose to live in San Carlos.",
      items: [
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
        { title: "Safe streets", text: "San Carlos is known as a safe, family-friendly city, with policing provided by the San Mateo County Sheriff's Office." },
        { title: "Good weather", text: "A mild Mediterranean climate: sunny most of the year, with winter rain and no snow." },
      ],
    },
    {
      ...explore(ids),
      anchor: "explore",
      eyebrow: "Things to do in San Carlos",
      heading: "Explore the city",
      intro: "Browse the restaurants, shops, attractions, events, parks and trails in San Carlos.",
    },
    {
      blockType: "faq",
      anchor: "faq",
      heading: "About San Carlos: common questions",
      items: [
        {
          question: "What is San Carlos, California known for?",
          answer:
            "The walkable downtown on Laurel Street, the schools, the parks, and the Caltrain stop. Locals call it the City of Good Living. It sits midway down the Peninsula in San Mateo County, between Belmont and Redwood City, with quick freeway access in both directions.",
        },
        {
          question: "Is San Carlos a good place to live?",
          answer:
            "For people who want a smaller-town feel with full Bay Area access, yes. It regularly appears on \"best places to live\" lists. The trade-off is cost: homes are expensive and inventory is tight. Whether it's the right fit comes down to budget, commute, and what you want your weekends to look like.",
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
      ],
    },
    {
      blockType: "cta",
      heading: "Thinking of moving to San Carlos?",
      text: "Viv and Mark know every neighborhood. Ask them anything, or start browsing homes for sale.",
      tone: "teal",
      buttons: [
        { label: "Contact Viv & Mark", href: "/contact-us/" },
        { label: "Homes for sale", href: "/homes-for-sale-in-san-carlos-ca/" },
      ],
    },
  ];

  const exploreLayout: Layout = [
    {
      ...explore(ids),
      eyebrow: "Places to visit",
      heading: "Let us guide you there",
      intro:
        "San Carlos and its neighboring towns are home to some of the most beautiful landscapes in California: forests, the bay, gardens and flower beds, even aerial tours. There's lots of culture, history, entertainment and outdoor living to enjoy.",
    },
    { blockType: "cardGrid", eyebrow: "Coming up", heading: "Upcoming events", source: "events", limit: 4, more: { label: "Full calendar", href: "/events/" } },
    {
      blockType: "cardGrid",
      eyebrow: "Eat & drink",
      heading: "Featured restaurants",
      source: "restaurants",
      limit: 6,
      more: { label: "All restaurants", href: "/restaurants-and-services/all-restaurants/" },
    },
    { blockType: "cardGrid", eyebrow: "Outdoors", heading: "Parks", source: "parks", limit: 6, more: { label: "All parks", href: "/parks-of-san-carlos/" } },
    {
      blockType: "cta",
      heading: "Never miss a thing",
      text: "One email a week with events, new restaurants, and what sold in San Carlos.",
      tone: "teal",
      buttons: [{ label: "Subscribe", href: "/subscribe/" }],
    },
  ];

  const vivMark: Layout = [
    {
      blockType: "prose",
      anchor: "meet-vabrato",
      eyebrow: "Meet Vabrato",
      heading: "Your local San Carlos real estate experts",
      content: await prose(`
<p>Mark Martinho and Vivienne Kelvin are the co-owners of Vabrato, a real estate brokerage serving San Carlos and Silicon Valley.</p>
<p>With over 30 years of combined experience and 95% of their clients coming from referrals, Mark and Viv take great pride in exceeding your expectations. They listen carefully to your needs and build a plan around your goals, for clients across San Mateo and Santa Clara Counties.</p>`),
    },
    { blockType: "video", youtubeId: "IYLONiahfYs", title: "Viv and Mark, your local San Carlos real estate experts" },
    {
      blockType: "featureList",
      anchor: "skills",
      eyebrow: "Our skills at work for you",
      heading: "What Viv and Mark bring to your sale or purchase",
      items: [
        { title: "Over 30 years of combined experience", text: "An award-winning team with decades in the industry." },
        {
          title: "Local market knowledge",
          text: "Years of experience in the Silicon Valley and Bay Area market. Homes sold by Vabrato often sell above list price, and quickly.",
        },
        { title: "Design and staging", text: "A team of professional designers and stagers to make your home look its best when it goes on the market." },
        {
          title: "Connected in the community",
          text: "Viv leads local business networking groups in San Carlos, from the Chamber of Commerce to adult care programs.",
        },
        { title: "Professional marketing", text: "Staging, photography, drone video, and web and social media marketing so your home stands out online." },
        { title: "Legal and financing expertise", text: "Mark holds a law degree and knows the legal requirements of real estate agreements." },
        { title: "Interior design", text: "Viv is formally trained in interior design and specializes in design to sell." },
        {
          title: "Engineering and construction",
          text: "Mark is a mechanical engineer and a licensed general contractor, with experience from foundations to roofs.",
        },
      ],
    },
    {
      blockType: "team",
      anchor: "team",
      eyebrow: "The team",
      heading: "Viv and Mark",
      people: [
        {
          name: "Viv Kelvin",
          role: "Broker Associate · Partner · SRES · Interior Designer",
          photo: ids.viv,
          bio: "I enjoy helping people feel at home in their new San Carlos house and neighborhood, whether they are relocating from across the pond or somewhere closer. I raised children who went through the San Carlos school system, so I can recommend schools, good places to eat, health care professionals and other community resources.\n\nI lead the San Carlos Chamber of Commerce Business Networking Group and was the 2018 San Carlos Chamber Champion.",
          license: "CA DRE Lic. # 01909927",
          phone: "650.291.7241",
          email: "viv@vabrato.com",
        },
        {
          name: "Mark Martinho",
          role: "Broker · Partner · J.D. · General Contractor",
          photo: ids.mark,
          bio: "I'm one of the luckiest guys in the world: I have a great family and I love my job. I moved into real estate in 2003 and still look forward to every day.\n\nHelping people find the home of their dreams, or move on from the one they have, is a privilege I don't take for granted. That's why I've invested so much time in building skills that help my clients.",
          license: "CA DRE Lic. # 01372898 · GC Lic. # 1088685",
          phone: "650.346.1595",
          email: "mark@vabrato.com",
        },
      ],
    },
    { blockType: "testimonials", anchor: "testimonials", eyebrow: "Testimonials", heading: "What clients say", limit: 6 },
    {
      blockType: "cta",
      anchor: "contact",
      heading: "Thinking of buying or selling in San Carlos?",
      text: "Tell Viv and Mark what you're planning, or start with a free home valuation.",
      tone: "teal",
      buttons: [
        { label: "Contact Viv & Mark", href: "/contact-us/" },
        { label: "What's my home worth?", href: "/sell-my-house/" },
      ],
    },
  ];

  for (const [slug, layout, subheading] of [
    ["one-of-the-best-realtor-teams-in-san-carlos-ca", vivMark, "Co-owners of Vabrato Real Estate, with over 30 years of combined experience helping people buy and sell in San Carlos."],
    ["about-san-carlos", about, "Top schools, beautiful homes, a downtown of its own, parks and trails, and a history that goes back to the 1700s."],
    ["explore-the-city", exploreLayout, "Restaurants, attractions, events, parks and trails in San Carlos, California."],
  ] as const) {
    const page = (await p.find({ collection: "pages", where: { slug: { equals: slug } }, limit: 1, depth: 0 })).docs[0];
    if (!page) {
      console.warn(`page not found: ${slug}`);
      continue;
    }
    await p.update({
      collection: "pages",
      id: page.id,
      data: {
        body: null,
        layout: layout as never,
        hero: { ...page.hero, subheading, ...(slug === "one-of-the-best-realtor-teams-in-san-carlos-ca" && ids.team ? { image: ids.team } : {}) },
        _status: "published",
      },
    });
    console.log(`${slug}: ${layout.length} sections`);
  }
});
