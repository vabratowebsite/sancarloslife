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
import { Pages } from "./collections/Pages";
import { Places } from "./collections/Places";
import { Posts } from "./collections/Posts";
import { Users } from "./collections/Users";
import { richTextEditor } from "./fields/richText";
import { Settings } from "./globals/Settings";
import { HomePage } from "./globals/HomePage";
import { VideosPage } from "./globals/VideosPage";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// Media goes to Supabase Storage (S3-compatible) when its keys are set.
// Without them (local development) Payload stores uploads on disk in /media.
const useS3 = Boolean(
  process.env.S3_BUCKET && process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY_ID,
);

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: " | San Carlos Life admin",
    },
  },
  collections: [
    Posts,
    Categories,
    Pages,
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
  globals: [Settings, HomePage, VideosPage],
  editor: richTextEditor,
  secret: process.env.PAYLOAD_SECRET || "",
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
