/**
 * Milestone 9a: restaurants and stores (Themify PTB types) → places.
 * Restaurants keep /restaurant/<slug>/ and stores keep /store/<slug>/ URLs.
 *   pnpm payload run scripts/migrate/40-places.ts
 */
import { htmlToLexical, loadJson, MediaImporter, migrateHtml, payload, run, seoFrom, seoIndex, text } from "./lib";

type Term = { id: number; name: string; slug: string };
type WpPlace = {
  id: number;
  slug: string;
  status: string;
  link: string;
  type: "restaurant" | "store";
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  featured_media: number;
  ptb_metabox?: Record<string, unknown>;
  [tax: string]: unknown;
};

/** PTB stores repeaters as Python-style dict strings: "{'label': ['A'], 'url': ['x']}" */
function ptbDict(raw: unknown): Record<string, string[]> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return Object.fromEntries(
      Object.entries(raw as Record<string, unknown>).map(([k, v]) => [k, ([] as unknown[]).concat(v ?? []).map(String)]),
    );
  }
  if (typeof raw !== "string" || !raw.startsWith("{")) return {};
  try {
    const json = raw
      .replace(/(?<=[{\[,]\s*)'/g, '"')
      .replace(/'(?=\s*[:,\]}])/g, '"')
      .replace(/\\'/g, "'");
    return JSON.parse(json);
  } catch {
    // Fall back to pulling quoted values per key.
    const out: Record<string, string[]> = {};
    for (const m of raw.matchAll(/'(\w+)':\s*\[([^\]]*)\]/g)) {
      out[m[1]] = [...m[2].matchAll(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g)].map((x) => x[1] ?? x[2]);
    }
    return out;
  }
}

function ptbList(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw !== "string" || !raw.startsWith("[")) return [];
  return [...raw.matchAll(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g)].map((x) => x[1] ?? x[2]);
}

/** Google Maps embed URLs carry the point as !2d<lng>!3d<lat>. */
function latLngFromEmbed(iframe: string | undefined) {
  const m = iframe?.match(/!2d(-?\d+\.\d+)!3d(-?\d+\.\d+)/);
  return m ? { lat: Number(m[2]), lng: Number(m[1]) } : {};
}

function streetOf(address: string): "laurel" | "san-carlos-ave" | "el-camino" | "industrial" | "other" | undefined {
  const a = address.toLowerCase();
  if (!a) return undefined;
  if (a.includes("laurel")) return "laurel";
  if (a.includes("san carlos ave")) return "san-carlos-ave";
  if (a.includes("el camino")) return "el-camino";
  if (a.includes("industrial")) return "industrial";
  return "other";
}

const PRICE: Record<string, "$" | "$$" | "$$$" | "$$$$"> = {
  "cheap-eats": "$",
  "mid-range": "$$",
  "high-end": "$$$",
};
const BAR_TYPES = /^(bars-pubs|beer|cocktail-lounge|wine)$/;
const SERVICE_TYPES = /^(barbershop|laundry-or-dry-cleaning|shoe-repair-and-alterations|studio-rent|art-classes)$/;

const linkKind = (label: string): "order" | "reserve" | "reviews" | "web" => {
  const l = label.toLowerCase();
  if (/doordash|postmates|uber|grubhub|seamless|order|menu|delivery|caviar|toast/.test(l)) return "order";
  if (/opentable|resy|reserv|tock/.test(l)) return "reserve";
  if (/yelp|tripadvisor|google review/.test(l)) return "reviews";
  return "web";
};

await run("places", async () => {
  const p = await payload();
  const media = await MediaImporter.create();
  const seo = await seoIndex();
  const taxonomies = await loadJson<Record<string, Term[]>>("taxonomies");
  const termName = (tax: string, ids: unknown) =>
    ((ids as number[]) ?? [])
      .map((id) => taxonomies[tax]?.find((t) => t.id === id))
      .filter((t): t is Term => Boolean(t));

  const restaurants = await loadJson<WpPlace[]>("restaurants");
  const stores = await loadJson<WpPlace[]>("stores");
  const problems: string[] = [];

  for (const wp of [...restaurants, ...stores]) {
    const isRestaurant = wp.type === "restaurant";
    const m = wp.ptb_metabox ?? {};
    const raw = (r: string, s: string) => (isRestaurant ? m[`ptb_restaurant_${r}`] : m[`ptb_store_${s}`]);
    // Scalar fields as strings; repeaters go through ptbDict/ptbList with the raw value.
    const k = (r: string, s: string) => {
      const v = raw(r, s);
      return typeof v === "string" ? v : v == null ? undefined : JSON.stringify(v);
    };
    const name = text(wp.title.rendered);
    try {
      const address = text(k("address", "address"));
      const gallery = [...(ptbDict(raw("gallery", "gallery")).url ?? []), ...(ptbDict(raw("optional_gallery", "optional_gallery")).url ?? [])].filter(Boolean);
      const galleryIds: number[] = [];
      for (const url of gallery.slice(0, 24)) {
        const hit = await media.ensureByUrl(url);
        if (hit) galleryIds.push(hit.id);
      }
      const links: { label: string; url: string; kind: "order" | "reserve" | "reviews" | "web" }[] = [];
      for (const key of [raw("menu_and_online_delivery", "menu_and_online_delivery"), raw("web_and_social_media_links", "web_and_social_media_links")]) {
        const d = ptbDict(key);
        (d.label ?? []).forEach((label, i) => {
          const url = d.url?.[i];
          if (label && /^https?:\/\//.test(url)) links.push({ label: text(label), url, kind: linkKind(label) });
        });
      }
      const fb = k("facebook_page_url", "facebook_page_url");
      if (fb && !links.some((l) => l.url === fb)) links.push({ label: "Facebook", url: fb, kind: "web" });
      const website = links.find((l) => l.kind === "web" && !/facebook|instagram|yelp|twitter|nextdoor|tripadvisor|tiktok/i.test(l.url))?.url;
      const videos = [...(ptbDict(raw("video_gallery", "video_gallery")).url ?? []), ...(ptbDict(raw("video", "video")).url ?? [])].filter((u) => /youtu/.test(u));
      const nearby = ptbDict(raw("nearby_places", "nearby_places")).label?.map(text).filter(Boolean) ?? [];
      const mapsUrl = ptbList(raw("maps_ios", "maps_android"))[1];
      const logo = ptbList(raw("logo", "logo"));
      const aboutHtml = [wp.content.rendered, k("about_content", "about")].filter(Boolean).join("\n");
      const priceSlug = termName("price_range", wp.price_range)[0]?.slug;
      const { seo: seoGroup, jsonLd } = seoFrom(seo[wp.link], name);
      const typeTerms = termName("restaurant_type", wp.restaurant_type).map((t) => t.slug);
      const short = text(k("grid_title", "grid_title") ?? m["ptb_services_and_shops_grid_title"] as string);
      const data = {
        name: short || name,
        headline: short && short !== name ? name : undefined,
        slug: wp.slug,
        generateSlug: false,
        type: isRestaurant
          ? typeTerms.length && typeTerms.every((s) => BAR_TYPES.test(s))
            ? "bar"
            : "restaurant"
          : termName("product_service_type", wp.product_service_type).some((t) => SERVICE_TYPES.test(t.slug))
            ? "service"
            : "shop",
        businessStatus: "open",
        featured: termName("featured_restaurant", wp.featured_restaurant).some((t) => t.slug === "featured-restaurants"),
        street: streetOf(address),
        address: address || undefined,
        ...latLngFromEmbed(k("wp_google_maps_shortcode", "wp_google_maps_shortcode")),
        phone: k("phone", "phone") || undefined,
        email: /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test((k("email", "email") || "").trim()) ? k("email", "email")!.trim() : undefined,
        website: website ?? null,
        mapsUrl,
        priceRange: priceSlug ? PRICE[priceSlug] : undefined,
        hours: text(k("opening_hours_and_days", "opening_hours_and_days")).split(/\s*\|\s*/).filter(Boolean).join("\n") || undefined,
        links,
        cuisines: termName("cuisine", wp.cuisine).map((t) => text(t.name)),
        meals: termName("meal", wp.meal).map((t) => text(t.name)),
        features: termName("feature", wp.feature).map((t) => text(t.name)),
        specialDiets: termName("special_diet", wp.special_diet).map((t) => text(t.name)),
        highlights: termName("restaurant_highlight", wp.restaurant_highlight).map((t) => text(t.name)),
        nearby,
        cover: await media.ensure(wp.featured_media),
        logo: logo[0] ? await media.ensure(Number(logo[0])) : undefined,
        gallery: galleryIds,
        videos,
        body: htmlToLexical(await migrateHtml(aboutHtml, media)),
        seo: { ...seoGroup, description: seoGroup.description ?? (text(wp.excerpt.rendered).slice(0, 155) || undefined) },
        jsonLd,
        wpId: wp.id,
        _status: (wp.status === "publish" ? "published" : "draft") as "published" | "draft",
      };
      const found = await p.find({
        collection: "places",
        where: { or: [{ wpId: { equals: wp.id } }, { slug: { equals: wp.slug } }] },
        limit: 1,
        draft: true,
      });
      if (found.docs[0]) await p.update({ collection: "places", id: found.docs[0].id, data: data as never });
      else await p.create({ collection: "places", data: data as never });
    } catch (e) {
      problems.push(`${wp.type} ${wp.slug}: ${(e as Error).message}`);
    }
    process.stdout.write(".");
  }
  await media.save();
  console.log(`\nplaces: ${restaurants.length + stores.length - problems.length} imported, ${problems.length} failed`);
  for (const pr of problems) console.log("  ", pr);
});
