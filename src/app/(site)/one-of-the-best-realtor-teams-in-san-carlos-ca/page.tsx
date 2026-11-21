import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { Cta, FeatureList, PageHero, Prose, Section, Team, Testimonials, Video } from "@/components/sections";
import { IMAGES } from "@/content/images";
import { metadataFromPage } from "@/lib/pageMeta";

const SLUG = "one-of-the-best-realtor-teams-in-san-carlos-ca";
const TITLE = "Viv and Mark, one of the Best Realtor Teams in San Carlos CA";
const INTRO = "Co-owners of Vabrato Real Estate, with over 30 years of combined experience helping people buy and sell in San Carlos.";

export const generateMetadata = () => metadataFromPage(SLUG, { title: TITLE, description: INTRO, image: IMAGES.vivMarkHero });

export default function VivAndMarkPage() {
  return (
    <>
      <PageHero
        title={TITLE}
        subheading={INTRO}
        image={IMAGES.vivMarkHero}
        crumbs={<Breadcrumbs items={[{ name: "Viv & Mark", path: `/${SLUG}/` }]} />}
      />

      <Section id="meet-vabrato" eyebrow="Meet Vabrato" heading="Your local San Carlos real estate experts">
        <Prose>
          <p>Mark Martinho and Vivienne Kelvin are the co-owners of Vabrato, a real estate brokerage serving San Carlos and Silicon Valley.</p>
          <p>
            With over 30 years of combined experience and 95% of their clients coming from referrals, Mark and Viv take great pride in
            exceeding your expectations. They listen carefully to your needs and build a plan around your goals, for clients across San Mateo
            and Santa Clara Counties.
          </p>
        </Prose>
        <div className="mt-8">
          <Video youtubeId="IYLONiahfYs" title="Viv and Mark, your local San Carlos real estate experts" />
        </div>
      </Section>

      <Section id="skills" eyebrow="Our skills at work for you" heading="What Viv and Mark bring to your sale or purchase" band>
        <FeatureList
          items={[
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
          ]}
        />
      </Section>

      <Section id="team" eyebrow="The team" heading="Viv and Mark">
        <Team
          people={[
            {
              name: "Viv Kelvin",
              role: "Broker Associate · Partner · SRES · Interior Designer",
              photo: IMAGES.viv,
              bio: "I enjoy helping people feel at home in their new San Carlos house and neighborhood, whether they are relocating from across the pond or somewhere closer. I raised children who went through the San Carlos school system, so I can recommend schools, good places to eat, health care professionals and other community resources.\n\nI lead the San Carlos Chamber of Commerce Business Networking Group and was the 2018 San Carlos Chamber Champion.",
              license: "CA DRE Lic. # 01909927",
              phone: "650.291.7241",
              email: "viv@vabrato.com",
            },
            {
              name: "Mark Martinho",
              role: "Broker · Partner · J.D. · General Contractor",
              photo: IMAGES.mark,
              bio: "I'm one of the luckiest guys in the world: I have a great family and I love my job. I moved into real estate in 2003 and still look forward to every day.\n\nHelping people find the home of their dreams, or move on from the one they have, is a privilege I don't take for granted. That's why I've invested so much time in building skills that help my clients.",
              license: "CA DRE Lic. # 01372898 · GC Lic. # 1088685",
              phone: "650.346.1595",
              email: "mark@vabrato.com",
            },
          ]}
        />
      </Section>

      <Section id="testimonials" eyebrow="Testimonials" heading="What clients say" band>
        <Testimonials limit={6} />
      </Section>

      <Cta
        id="contact"
        heading="Thinking of buying or selling in San Carlos?"
        text="Tell Viv and Mark what you're planning, or start with a free home valuation."
        buttons={[
          { label: "Contact Viv & Mark", href: "/contact-us/" },
          { label: "What's my home worth?", href: "/sell-my-house/" },
        ]}
      />
    </>
  );
}
