/**
 * Milestone 22: starting values for the Home page global. Copy and the Vimeo
 * background loop (882272881) come from the live home page; photos are picked
 * from the imported media by file name, and editors can swap them in the admin.
 *   pnpm payload run scripts/migrate/65-home.ts
 */
import { payload, run } from "./lib";

const POSTER = "mark-martinho-and-viv-kelvin-at-the-san-carlos-murale-bianchini-market.jpg";
const AGENT = "mark-martinho-and-viv-kelvin-at-the-museum-of-san-carlos-history-san-carlos-ca-photo-by-vabrato-real-estate-services-c.jpg";

await run("home", async () => {
  const p = await payload();
  const byName = async (filename: string) =>
    (await p.find({ collection: "media", where: { filename: { equals: filename } }, limit: 1, depth: 0 })).docs[0]?.id ?? null;
  const [heroPoster, agentPhoto] = await Promise.all([byName(POSTER), byName(AGENT)]);
  if (!heroPoster) console.warn(`hero poster not found: ${POSTER}`);
  if (!agentPhoto) console.warn(`agent photo not found: ${AGENT}`);
  await p.updateGlobal({
    slug: "home-page",
    data: { heroVimeoId: "882272881", heroPoster, agentPhoto },
  });
});
