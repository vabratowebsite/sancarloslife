/**
 * Milestone 8: The Events Calendar → events, venues, organizers, event categories.
 * Every WordPress event is a single dated post (no recurrence rules in the public
 * API), so each one becomes one event with its URL slug unchanged (/event/<slug>/).
 * Upserts by WordPress id.
 *   pnpm payload run scripts/migrate/30-events.ts
 */
import { htmlToLexical, loadJson, MediaImporter, migrateHtml, payload, run, seoFrom, seoIndex, text } from "./lib";

type TribeTerm = { id: number; name: string; slug: string };
type TribeVenue = {
  id: number;
  venue: string;
  slug: string;
  address?: string;
  city?: string;
  stateprovince?: string;
  state?: string;
  zip?: string;
  phone?: string;
  website?: string;
  geo_lat?: number;
  geo_lng?: number;
};
type TribeOrganizer = { id: number; organizer: string; slug: string; phone?: string; website?: string; email?: string };
type TribeEvent = {
  id: number;
  title: string;
  slug: string;
  url: string;
  description: string;
  excerpt: string;
  status: string;
  all_day: boolean;
  utc_start_date: string;
  utc_end_date: string;
  timezone: string;
  cost: string;
  website: string;
  featured: boolean;
  image?: { id: number } | false;
  venue?: { id: number } | [];
  organizer?: { id: number }[];
  categories?: TribeTerm[];
};

async function upsert<T extends Record<string, unknown>>(collection: "venues" | "organizers" | "event-categories" | "events", wpId: number, slug: string, data: T) {
  const p = await payload();
  const found = await p.find({
    collection,
    where: { or: [{ wpId: { equals: wpId } }, { slug: { equals: slug } }] },
    limit: 1,
    depth: 0,
  });
  return found.docs[0]
    ? p.update({ collection, id: found.docs[0].id, data: data as never, depth: 0 })
    : p.create({ collection, data: data as never, depth: 0 });
}

const utc = (s: string) => new Date(s.replace(" ", "T") + "Z").toISOString();

await run("events", async () => {
  const media = await MediaImporter.create();
  const seo = await seoIndex();

  const catMap = new Map<number, number>();
  for (const c of await loadJson<TribeTerm[]>("eventCategories")) {
    const doc = await upsert("event-categories", c.id, c.slug, { name: text(c.name), slug: c.slug, generateSlug: false, wpId: c.id });
    catMap.set(c.id, doc.id as number);
  }
  console.log(`event categories: ${catMap.size}`);

  const venueMap = new Map<number, number>();
  for (const v of await loadJson<TribeVenue[]>("venues")) {
    const doc = await upsert("venues", v.id, v.slug, {
      name: text(v.venue),
      slug: v.slug,
      generateSlug: false,
      // The address field often holds the whole address; keep only the street part.
      address: text(v.address).split(",")[0] || undefined,
      city: text(v.city) || "San Carlos",
      state: v.stateprovince || v.state || "CA",
      zip: v.zip || undefined,
      lat: v.geo_lat || undefined,
      lng: v.geo_lng || undefined,
      phone: v.phone || undefined,
      url: v.website || undefined,
      wpId: v.id,
    });
    venueMap.set(v.id, doc.id as number);
  }
  console.log(`venues: ${venueMap.size}`);

  const orgMap = new Map<number, number>();
  for (const o of await loadJson<TribeOrganizer[]>("organizers")) {
    const doc = await upsert("organizers", o.id, o.slug, {
      name: text(o.organizer),
      slug: o.slug,
      generateSlug: false,
      phone: o.phone || undefined,
      url: o.website || undefined,
      email: o.email && /@/.test(o.email) ? o.email : undefined,
      wpId: o.id,
    });
    orgMap.set(o.id, doc.id as number);
  }
  console.log(`organizers: ${orgMap.size}`);

  const events = await loadJson<TribeEvent[]>("events");
  const now = Date.now();
  const problems: string[] = [];
  for (const [i, e] of events.entries()) {
    const title = text(e.title);
    try {
      const startsAt = utc(e.utc_start_date);
      const endsAt = e.utc_end_date ? utc(e.utc_end_date) : undefined;
      const past = new Date(endsAt ?? startsAt).getTime() < now;
      const venueId = !Array.isArray(e.venue) && e.venue?.id ? venueMap.get(e.venue.id) : undefined;
      const { seo: seoGroup } = seoFrom(seo[e.url], title);
      await upsert("events", e.id, e.slug, {
        title,
        slug: e.slug,
        generateSlug: false,
        // Past events stay online as archived pages (their URLs keep working).
        status: past ? "archived" : "published",
        startsAt,
        endsAt,
        allDay: Boolean(e.all_day),
        timezone: /^[A-Za-z]+\//.test(e.timezone) ? e.timezone : "America/Los_Angeles",
        venue: venueId,
        organizer: (e.organizer ?? []).map((o) => orgMap.get(o.id)).find(Boolean),
        categories: (e.categories ?? []).map((c) => catMap.get(c.id)).filter((x): x is number => Boolean(x)),
        cost: text(e.cost) || undefined,
        url: e.website ? text(e.website).replace(/^.*?(https?:\/\/\S+).*$/, "$1") : undefined,
        featured: Boolean(e.featured),
        cover: e.image && e.image.id ? await media.ensure(e.image.id) : undefined,
        body: htmlToLexical(await migrateHtml(e.description || "", media)),
        seo: seoGroup,
        wpId: e.id,
      });
    } catch (err) {
      problems.push(`${e.slug}: ${(err as Error).message}`);
    }
    if (i % 10 === 0) process.stdout.write(`\revents ${i + 1}/${events.length}`);
  }
  await media.save();
  console.log(`\nevents: ${events.length - problems.length} imported, ${problems.length} failed`);
  for (const pr of problems) console.log("  ", pr);
});
