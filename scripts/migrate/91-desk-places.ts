/**
 * Ops desk phase 4, places: brings the Operations Desk's 17 restaurant and shop profiles
 * (16 shops + Soko Soko, design B "Quick guide") into the matching places as NEW DRAFT
 * VERSIONS IN REVIEW (source claude). The published page doesn't change until an editor
 * approves the draft on /admin/desk.
 *
 * Reads scripts/migrate/data/desk/bundle.json (gitignored): rest/data/shops/*.json,
 * rest/data/soko-soko-japanese-cuisine-san-carlos.json and rest/src/shops_raw/manifest.json
 * (each photo's real WordPress upload URL). Photos are linked to the media library copy of
 * that upload (MediaImporter copies it if it isn't there yet).
 *
 *   pnpm migrate:desk-places                      dry run: prints what would change
 *   DESK_IMPORT_APPLY=1 pnpm migrate:desk-places  writes, only to a database on this computer
 *
 * The desk data is treated as data: plain text fields only, no HTML is carried over.
 */
import fs from "node:fs/promises";
import path from "node:path";

import { DATA, MediaImporter, payload, run } from "./lib";

const DESK = path.join(DATA, "desk");
const APPLY = process.env.DESK_IMPORT_APPLY === "1";

type Img = { img: string; alt?: string } | null | undefined;
type Hours = { days: string; dow: string[]; slots: [string, string][] };
type Profile = {
  kind?: "shop";
  slug: string;
  name: string;
  tagline?: string;
  summary?: string;
  area?: string;
  schema_type?: string;
  categories?: string[];
  cuisine?: string[];
  meals?: string[];
  good_for?: string[];
  primary?: { label: string; url: string } | null;
  reserve?: { label: string; url: string } | null;
  order?: { label: string; url: string } | null;
  story?: { h: string; p: string[] }[];
  items_title?: string;
  items?: { name: string; desc: string; img?: string | null; alt?: string }[];
  dishes?: { name: string; desc: string; img?: string | null; alt?: string }[];
  also_try?: string[];
  know?: { k: string; v: string }[];
  people_say?: { praise: string[]; notes?: string[]; source: string };
  diners_say?: { praise: string[]; notes?: string[]; source: string };
  faq?: { q: string; a: string }[];
  related?: { label: string; url: string; note?: string }[];
  hours: Hours[];
  hours_note?: string | null;
  hours_source?: string | null;
  updated?: string;
  status?: string;
  status_note?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  maps?: string | null;
  links?: { label: string; url: string }[];
  address: { street: string; city: string; region: string; zip: string };
  geo?: [number, number] | null;
  price?: string | null;
  hero?: Img;
  mosaic?: Img[];
  gallery?: Img[];
  logo?: Img;
  wp_base?: string;
  seo_title?: string;
  meta_description?: string;
  focus_keyword?: string;
  sources?: unknown;
  verify?: unknown;
  youtube?: string | null;
};

const list = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => (typeof x === "string" ? x : typeof x === "object" && x ? Object.values(x).filter((y) => typeof y === "string").join(" — ") : "")).filter(Boolean) : [];

const relLink = (url: string) => url.replace(/^https?:\/\/(?:www\.)?sancarloslife\.com(?=\/)/, "");

await run("desk-places", async () => {
  const dbUrl = process.env.DATABASE_URL ?? "";
  if (APPLY && !/@(localhost|127\.0\.0\.1)(:\d+)?\//.test(dbUrl)) {
    throw new Error("DESK_IMPORT_APPLY only writes to a database on this computer. Production imports need the owner's go-ahead and a separate run.");
  }
  const p = await payload();
  const bundle = JSON.parse(await fs.readFile(path.join(DESK, "bundle.json"), "utf8")) as Record<string, string>;
  const manifest = JSON.parse(bundle["rest/src/shops_raw/manifest.json"]) as Record<string, { file: string; url: string }[]>;
  const keys = Object.keys(bundle).filter((k) => /^rest\/data\/shops\/.+\.json$/.test(k) || k === "rest/data/soko-soko-japanese-cuisine-san-carlos.json");
  const media = APPLY ? await MediaImporter.create() : null;
  const out: string[] = [];

  for (const k of keys.sort()) {
    const d = JSON.parse(bundle[k]) as Profile;
    const isShop = d.kind === "shop";
    const found = (await p.find({ collection: "places", where: { slug: { equals: d.slug } }, limit: 1, depth: 0, draft: true })).docs[0];
    if (!found) {
      out.push(`skip  ${d.slug}: no place with this address on the site`);
      continue;
    }

    const urlOf = (file: string) => (isShop ? manifest[d.slug]?.find((x) => x.file === file)?.url : d.wp_base ? d.wp_base + file : undefined);
    const missing: string[] = [];
    const photo = async (x: Img): Promise<number | undefined> => {
      if (!x?.img) return undefined;
      const url = urlOf(x.img);
      if (!url) {
        missing.push(x.img);
        return undefined;
      }
      if (!media) return -1; // dry run
      const m = await media.ensureByUrl(url);
      if (!m) missing.push(x.img);
      return m?.id;
    };

    const items = isShop ? (d.items ?? []) : (d.dishes ?? []);
    const itemRows = [];
    for (const x of items) itemRows.push({ name: x.name, description: x.desc, image: await photo(x.img ? { img: x.img, alt: x.alt } : null) });
    const cover = await photo(d.hero ?? d.mosaic?.[0]);
    const galleryIds: number[] = [];
    for (const x of [...(d.mosaic ?? []), ...(d.gallery ?? [])]) {
      const id = await photo(x);
      if (id && id !== cover && !galleryIds.includes(id)) galleryIds.push(id);
    }
    const logo = await photo(d.logo);
    const reviews = d.people_say ?? d.diners_say;
    const extraLinks = [
      d.reserve?.url && { label: d.reserve.label, url: d.reserve.url, kind: "reserve" },
      d.order?.url && { label: d.order.label, url: d.order.url, kind: "order" },
    ].filter(Boolean) as { label: string; url: string; kind: string }[];

    const data: Record<string, unknown> = {
      businessStatus: d.status === "closed" || d.status === "moved" ? "closed" : "open",
      address: `${d.address.street}, ${d.address.city}, ${d.address.region} ${d.address.zip}`,
      ...(d.geo ? { lat: d.geo[0], lng: d.geo[1] } : {}),
      ...(d.phone ? { phone: d.phone } : {}),
      ...(d.email ? { email: d.email } : {}),
      ...(d.website ? { website: d.website } : {}),
      ...(d.maps ? { mapsUrl: d.maps } : {}),
      ...(d.price ? { priceRange: d.price } : {}),
      ...(!isShop && d.cuisine?.length ? { cuisines: d.cuisine } : {}),
      ...(!isShop && d.meals?.length ? { meals: d.meals } : {}),
      links: [...extraLinks, ...(d.links ?? []).map((l) => ({ label: l.label, url: l.url, kind: /review|yelp/i.test(l.label) ? "reviews" : /menu|order/i.test(l.label) ? "order" : "web" }))],
      openingHours: d.hours.map((h) => ({ days: h.days, dow: h.dow.map((x) => x.toLowerCase()), slots: h.slots.map(([opens, closes]) => ({ opens, closes })) })),
      ...(cover && cover > 0 ? { cover } : {}),
      ...(galleryIds.length && galleryIds[0] > 0 ? { gallery: galleryIds } : {}),
      ...(logo && logo > 0 ? { logo } : {}),
      ...(d.youtube ? { videos: [d.youtube] } : {}),
      guide: {
        tagline: d.tagline,
        summary: d.summary,
        area: d.area,
        schemaType: d.schema_type || (isShop ? "Store" : "Restaurant"),
        categories: isShop ? (d.categories ?? []) : (d.cuisine ?? []),
        goodFor: d.good_for ?? [],
        primaryAction: d.primary?.url ? { label: d.primary.label, url: d.primary.url } : d.reserve?.url ? { label: d.reserve.label, url: d.reserve.url } : {},
        story: (d.story ?? []).map((s) => ({ heading: s.h, text: s.p.join("\n\n") })),
        itemsTitle: isShop ? d.items_title : "Menu highlights",
        items: itemRows.map((r) => ({ ...r, image: r.image && r.image > 0 ? r.image : undefined })),
        alsoTry: d.also_try ?? [],
        know: (d.know ?? []).map((x) => ({ label: x.k, value: x.v })),
        reviews: reviews ? { praise: reviews.praise, notes: reviews.notes ?? [], source: reviews.source } : {},
        faq: (d.faq ?? []).map((f) => ({ question: f.q, answer: f.a })),
        related: (d.related ?? []).map((r) => ({ label: r.label, url: relLink(r.url), note: r.note })),
        hoursNote: d.hours_note ?? undefined,
        hoursSource: d.hours_source ?? undefined,
        checkedAt: d.updated ? `${d.updated}T12:00:00.000Z` : undefined,
      },
      seo: { title: d.seo_title, description: d.meta_description, focusKeyword: d.focus_keyword },
      _status: "draft",
      review: {
        state: "in-review",
        source: "claude",
        note: [
          "[desk import] Quick guide profile (design B) from the Operations Desk; the published page is unchanged until this draft is approved.",
          d.status_note && `Status: ${d.status_note}`,
          list(d.verify).length && `Check before publishing:\n- ${list(d.verify).join("\n- ")}`,
          list(d.sources).length && `Sources:\n- ${list(d.sources).join("\n- ")}`,
          missing.length && `Photos not found on the old site: ${missing.join(", ")}`,
          "Photos: the business's own, or Vabrato Real Estate Services for the team's (owner decision 2026-11-22).",
        ]
          .filter(Boolean)
          .join("\n\n")
          .slice(0, 8000),
      },
    };

    out.push(`${APPLY ? "draft" : "would draft"}  /${found.type === "restaurant" || found.type === "bar" ? "restaurant" : "store"}/${d.slug}/  ${items.length} items, ${d.hours.length} hours rows, ${(d.faq ?? []).length} FAQ${missing.length ? `, ${missing.length} photo(s) missing` : ""}`);
    if (APPLY) await p.update({ collection: "places", id: found.id, data: data as never, draft: true, overrideAccess: true });
  }
  if (media) await media.save();
  console.log(out.join("\n"));
});
