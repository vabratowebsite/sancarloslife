import { postgresAdapter } from "@payloadcms/db-postgres";
import { s3Storage } from "@payloadcms/storage-s3";
import path from "path";
import { buildConfig } from "payload";
import sharp from "sharp";
import { fileURLToPath } from "url";

import { FormSubmissions, Redirects } from "./collections/Admin";
import { Categories } from "./collections/Categories";
import { CityProjects, GalleryPhotos, Parks, TimelineEntries, Testimonials } from "./collections/Community";
import { EventCategories, Events, Organizers, Venues } from "./collections/Events";
import { Media } from "./collections/Media";
import { Neighborhoods } from "./collections/Neighborhoods";
import { AiConnections } from "./collections/AiConnections";
import { AiPrompts } from "./collections/AiPrompts";
import { DeskPages } from "./collections/DeskPages";
import { DeskRuns } from "./collections/DeskRuns";
import { PageEdits } from "./collections/PageEdits";
import { Pages } from "./collections/Pages";
import { Places } from "./collections/Places";
import { Posts } from "./collections/Posts";
import { Users } from "./collections/Users";
import { richTextEditor } from "./fields/richText";
import { Settings } from "./globals/Settings";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// Media goes to Supabase Storage (S3-compatible) when its keys are set.
// Without them (local development) Payload stores uploads on disk in /media.
const useS3 = Boolean(
  process.env.S3_BUCKET && process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY_ID,
);

// Origins allowed to make cookie-authenticated admin/API requests: the site, plus
// the Vercel deployment and branch URLs so the admin works on previews.
const origins = [
  (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
  process.env.VERCEL_BRANCH_URL && `https://${process.env.VERCEL_BRANCH_URL}`,
].filter((o): o is string => Boolean(o));

if (process.env.NODE_ENV === "production" && (process.env.PAYLOAD_SECRET ?? "").length < 32) {
  throw new Error("PAYLOAD_SECRET must be set to at least 32 random characters in production");
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      // Page text and photos are edited on the page itself (see src/lib/pageEdits.tsx).
      afterNavLinks: ["/components/admin/EditSiteLink#EditSiteLink"],
      beforeDashboard: ["/components/admin/EditSiteBanner#EditSiteBanner"],
      views: {
        desk: { Component: "/components/admin/desk/DeskQueue#DeskQueue", path: "/desk" },
      },
    },
    meta: {
      titleSuffix: " | San Carlos Life admin",
    },
  },
  collections: [
    Posts,
    Categories,
    Pages, PageEdits, DeskPages, DeskRuns, AiPrompts, AiConnections,
    Events,
    Venues,
    Organizers,
    EventCategories,
    Places,
    Parks,
    Neighborhoods,
    Testimonials,
    TimelineEntries,
    GalleryPhotos,
    CityProjects,
    Media,
    FormSubmissions,
    Redirects,
    Users,
  ],
  globals: [Settings],
  editor: richTextEditor,
  secret: process.env.PAYLOAD_SECRET || "",
  // Cookie-authenticated requests to the admin API are only accepted from our own origin.
  cors: origins,
  csrf: origins,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || "",
    },
    // The database is shared with the San Carlos Civic Watch ops desk.
    // Everything Payload creates lives in the `web` schema only.
    schemaName: "web",
    migrationDir: path.resolve(dirname, "migrations"),
    // Schema changes reach shared databases only through reviewed migrations.
    push: process.env.PAYLOAD_DB_PUSH === "true",
  }),
  sharp,
  plugins: useS3
    ? [
        s3Storage({
          collections: { media: true },
          bucket: process.env.S3_BUCKET || "",
          config: {
            endpoint: process.env.S3_ENDPOINT,
            region: process.env.S3_REGION || "us-west-1",
            forcePathStyle: true,
            credentials: {
              accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
            },
          },
        }),
      ]
    : [],
});
