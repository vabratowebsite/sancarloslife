/**
 * Milestone 15: parks from the /parks-of-san-carlos/ page (a Divi tab layout; there
 * is no park post type in WordPress). Each park on the page reads:
 *   "<Name> <street>, San Carlos, CA 94070, United States. [Google Maps] <description>"
 * Addresses that the live page repeats for different parks are left empty and
 * reported rather than guessed. Facilities aren't separable from the text.
 *   pnpm payload run scripts/migrate/55-parks.ts
 */
import { decodeHTML } from "entities";

import { htmlToLexical, loadJson, payload, run } from "./lib";

const PARKS = [
  "Arguello Park", "Big Canyon Park", "Burton Park", "Chilton Park", "City Hall Dog Park", "Eaton Park",
  "Frank D Harrington Park", "Highlands Park", "Hillcrest Circle Park", "Laureola Park", "North Crestview Park", "Vista Park",
];
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

await run("parks", async () => {
  const p = await payload();
  const pages = await loadJson<{ slug: string; content: { rendered: string } }[]>("pages");
  const html = pages.find((x) => x.slug === "parks-of-san-carlos")!.content.rendered.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "");
  const text = decodeHTML(
    html
      .replace(/<a [^>]*href="(https:\/\/(?:goo\.gl|maps\.app\.goo\.gl|www\.google\.com\/maps)[^"]*)"[^>]*>/g, " [MAP $1] ")
      .replace(/<[^>]+>/g, " "),
  ).replace(/\s+/g, " ");

  const found: { name: string; address: string; map: string; at: number; end: number }[] = [];
  for (const name of PARKS) {
    const re = new RegExp(`${name}\\s+(\\d{2,5} [^,]{3,40}),\\s*San Carlos,\\s*CA\\s*94070[^.]*\\.\\s*\\[MAP ([^\\]]+)\\]`);
    const m = text.match(re);
    if (m && m.index !== undefined) found.push({ name, address: m[1], map: m[2], at: m.index, end: m.index + m[0].length });
  }
  found.sort((a, b) => a.at - b.at);
  const addrCount = new Map<string, number>();
  for (const f of found) addrCount.set(f.address, (addrCount.get(f.address) ?? 0) + 1);

  const flagged: string[] = [];
  for (const [i, f] of found.entries()) {
    const nextAt = found[i + 1]?.at ?? text.length;
    // The description is the run of full sentences after the map link.
    const rest = text.slice(f.end, nextAt).replace(/^\s*Google Maps\s*/, "").replace(/^[\s.]+/, "");
    // Protect decimals ("2.6-acre") and initials ("Frank D. Harrington") from the sentence split.
    const sentences = (rest.replace(/(\d)\.(\d)/g, "$1\u2024$2").replace(/\b([A-Z])\.(?= )/g, "$1\u2024").match(/[^.!?]+[.!?]+/g) ?? []).map((x) => x.replace(/\u2024/g, "."));
    const description = sentences.filter((s) => s.trim().split(" ").length > 4).join(" ").trim();
    const acres = Number(rest.match(/(\d+(?:\.\d+)?)[ -]acres?/)?.[1]) || undefined;
    // The first park listed at an address keeps it; later repeats are the page's copy-paste errors.
    const duplicate = (addrCount.get(f.address) ?? 0) > 1 && found.findIndex((x) => x.address === f.address) !== i;
    if (duplicate) flagged.push(`${f.name}: the live page lists ${f.address}, which belongs to another park`);
    const name = f.name.replace("Frank D Harrington", "Frank D. Harrington");
    const data = {
      name,
      slug: slugify(name),
      generateSlug: false,
      type: /canyon|eaton|crestview|vista|highlands/i.test(name) ? ("trail" as const) : ("park" as const),
      address: duplicate ? undefined : `${f.address}, San Carlos, CA 94070`,
      mapsUrl: f.map,
      acres,
      summary: sentences.find((x) => x.trim().split(" ").length > 4)?.trim(),
      body: htmlToLexical(description ? `<p>${description}</p>` : ""),
      _status: "published" as const,
    };
    const existing = await p.find({ collection: "parks", where: { slug: { equals: data.slug } }, limit: 1, draft: true });
    if (existing.docs[0]) await p.update({ collection: "parks", id: existing.docs[0].id, data });
    else await p.create({ collection: "parks", data });
  }
  console.log(`parks: ${found.length} of ${PARKS.length}`);
  for (const f of flagged) console.log(`  check: ${f}`);
});
