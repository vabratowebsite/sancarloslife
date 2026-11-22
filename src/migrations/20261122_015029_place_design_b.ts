import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "web"."enum_places_opening_hours_dow" AS ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
  CREATE TYPE "web"."enum__places_v_version_opening_hours_dow" AS ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
  CREATE TABLE "web"."places_opening_hours_dow" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "web"."enum_places_opening_hours_dow",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "web"."places_opening_hours_slots" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"opens" varchar,
  	"closes" varchar
  );
  
  CREATE TABLE "web"."places_opening_hours" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"days" varchar
  );
  
  CREATE TABLE "web"."places_guide_story" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"text" varchar
  );
  
  CREATE TABLE "web"."places_guide_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"image_id" integer
  );
  
  CREATE TABLE "web"."places_guide_know" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar
  );
  
  CREATE TABLE "web"."places_guide_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "web"."places_guide_related" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"note" varchar
  );
  
  CREATE TABLE "web"."_places_v_version_opening_hours_dow" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "web"."enum__places_v_version_opening_hours_dow",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "web"."_places_v_version_opening_hours_slots" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"opens" varchar,
  	"closes" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "web"."_places_v_version_opening_hours" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"days" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "web"."_places_v_version_guide_story" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "web"."_places_v_version_guide_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "web"."_places_v_version_guide_know" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "web"."_places_v_version_guide_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "web"."_places_v_version_guide_related" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"note" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "web"."places" ADD COLUMN "guide_tagline" varchar;
  ALTER TABLE "web"."places" ADD COLUMN "guide_summary" varchar;
  ALTER TABLE "web"."places" ADD COLUMN "guide_area" varchar;
  ALTER TABLE "web"."places" ADD COLUMN "guide_schema_type" varchar;
  ALTER TABLE "web"."places" ADD COLUMN "guide_primary_action_label" varchar;
  ALTER TABLE "web"."places" ADD COLUMN "guide_primary_action_url" varchar;
  ALTER TABLE "web"."places" ADD COLUMN "guide_items_title" varchar;
  ALTER TABLE "web"."places" ADD COLUMN "guide_reviews_source" varchar;
  ALTER TABLE "web"."places" ADD COLUMN "guide_hours_note" varchar;
  ALTER TABLE "web"."places" ADD COLUMN "guide_hours_source" varchar;
  ALTER TABLE "web"."places" ADD COLUMN "guide_checked_at" timestamp(3) with time zone;
  ALTER TABLE "web"."_places_v" ADD COLUMN "version_guide_tagline" varchar;
  ALTER TABLE "web"."_places_v" ADD COLUMN "version_guide_summary" varchar;
  ALTER TABLE "web"."_places_v" ADD COLUMN "version_guide_area" varchar;
  ALTER TABLE "web"."_places_v" ADD COLUMN "version_guide_schema_type" varchar;
  ALTER TABLE "web"."_places_v" ADD COLUMN "version_guide_primary_action_label" varchar;
  ALTER TABLE "web"."_places_v" ADD COLUMN "version_guide_primary_action_url" varchar;
  ALTER TABLE "web"."_places_v" ADD COLUMN "version_guide_items_title" varchar;
  ALTER TABLE "web"."_places_v" ADD COLUMN "version_guide_reviews_source" varchar;
  ALTER TABLE "web"."_places_v" ADD COLUMN "version_guide_hours_note" varchar;
  ALTER TABLE "web"."_places_v" ADD COLUMN "version_guide_hours_source" varchar;
  ALTER TABLE "web"."_places_v" ADD COLUMN "version_guide_checked_at" timestamp(3) with time zone;
  ALTER TABLE "web"."places_opening_hours_dow" ADD CONSTRAINT "places_opening_hours_dow_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "web"."places_opening_hours"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."places_opening_hours_slots" ADD CONSTRAINT "places_opening_hours_slots_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."places_opening_hours"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."places_opening_hours" ADD CONSTRAINT "places_opening_hours_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."places"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."places_guide_story" ADD CONSTRAINT "places_guide_story_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."places"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."places_guide_items" ADD CONSTRAINT "places_guide_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."places_guide_items" ADD CONSTRAINT "places_guide_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."places"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."places_guide_know" ADD CONSTRAINT "places_guide_know_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."places"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."places_guide_faq" ADD CONSTRAINT "places_guide_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."places"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."places_guide_related" ADD CONSTRAINT "places_guide_related_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."places"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_places_v_version_opening_hours_dow" ADD CONSTRAINT "_places_v_version_opening_hours_dow_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "web"."_places_v_version_opening_hours"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_places_v_version_opening_hours_slots" ADD CONSTRAINT "_places_v_version_opening_hours_slots_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."_places_v_version_opening_hours"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_places_v_version_opening_hours" ADD CONSTRAINT "_places_v_version_opening_hours_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."_places_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_places_v_version_guide_story" ADD CONSTRAINT "_places_v_version_guide_story_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."_places_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_places_v_version_guide_items" ADD CONSTRAINT "_places_v_version_guide_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_places_v_version_guide_items" ADD CONSTRAINT "_places_v_version_guide_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."_places_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_places_v_version_guide_know" ADD CONSTRAINT "_places_v_version_guide_know_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."_places_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_places_v_version_guide_faq" ADD CONSTRAINT "_places_v_version_guide_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."_places_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_places_v_version_guide_related" ADD CONSTRAINT "_places_v_version_guide_related_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."_places_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "places_opening_hours_dow_order_idx" ON "web"."places_opening_hours_dow" USING btree ("order");
  CREATE INDEX "places_opening_hours_dow_parent_idx" ON "web"."places_opening_hours_dow" USING btree ("parent_id");
  CREATE INDEX "places_opening_hours_slots_order_idx" ON "web"."places_opening_hours_slots" USING btree ("_order");
  CREATE INDEX "places_opening_hours_slots_parent_id_idx" ON "web"."places_opening_hours_slots" USING btree ("_parent_id");
  CREATE INDEX "places_opening_hours_order_idx" ON "web"."places_opening_hours" USING btree ("_order");
  CREATE INDEX "places_opening_hours_parent_id_idx" ON "web"."places_opening_hours" USING btree ("_parent_id");
  CREATE INDEX "places_guide_story_order_idx" ON "web"."places_guide_story" USING btree ("_order");
  CREATE INDEX "places_guide_story_parent_id_idx" ON "web"."places_guide_story" USING btree ("_parent_id");
  CREATE INDEX "places_guide_items_order_idx" ON "web"."places_guide_items" USING btree ("_order");
  CREATE INDEX "places_guide_items_parent_id_idx" ON "web"."places_guide_items" USING btree ("_parent_id");
  CREATE INDEX "places_guide_items_image_idx" ON "web"."places_guide_items" USING btree ("image_id");
  CREATE INDEX "places_guide_know_order_idx" ON "web"."places_guide_know" USING btree ("_order");
  CREATE INDEX "places_guide_know_parent_id_idx" ON "web"."places_guide_know" USING btree ("_parent_id");
  CREATE INDEX "places_guide_faq_order_idx" ON "web"."places_guide_faq" USING btree ("_order");
  CREATE INDEX "places_guide_faq_parent_id_idx" ON "web"."places_guide_faq" USING btree ("_parent_id");
  CREATE INDEX "places_guide_related_order_idx" ON "web"."places_guide_related" USING btree ("_order");
  CREATE INDEX "places_guide_related_parent_id_idx" ON "web"."places_guide_related" USING btree ("_parent_id");
  CREATE INDEX "_places_v_version_opening_hours_dow_order_idx" ON "web"."_places_v_version_opening_hours_dow" USING btree ("order");
  CREATE INDEX "_places_v_version_opening_hours_dow_parent_idx" ON "web"."_places_v_version_opening_hours_dow" USING btree ("parent_id");
  CREATE INDEX "_places_v_version_opening_hours_slots_order_idx" ON "web"."_places_v_version_opening_hours_slots" USING btree ("_order");
  CREATE INDEX "_places_v_version_opening_hours_slots_parent_id_idx" ON "web"."_places_v_version_opening_hours_slots" USING btree ("_parent_id");
  CREATE INDEX "_places_v_version_opening_hours_order_idx" ON "web"."_places_v_version_opening_hours" USING btree ("_order");
  CREATE INDEX "_places_v_version_opening_hours_parent_id_idx" ON "web"."_places_v_version_opening_hours" USING btree ("_parent_id");
  CREATE INDEX "_places_v_version_guide_story_order_idx" ON "web"."_places_v_version_guide_story" USING btree ("_order");
  CREATE INDEX "_places_v_version_guide_story_parent_id_idx" ON "web"."_places_v_version_guide_story" USING btree ("_parent_id");
  CREATE INDEX "_places_v_version_guide_items_order_idx" ON "web"."_places_v_version_guide_items" USING btree ("_order");
  CREATE INDEX "_places_v_version_guide_items_parent_id_idx" ON "web"."_places_v_version_guide_items" USING btree ("_parent_id");
  CREATE INDEX "_places_v_version_guide_items_image_idx" ON "web"."_places_v_version_guide_items" USING btree ("image_id");
  CREATE INDEX "_places_v_version_guide_know_order_idx" ON "web"."_places_v_version_guide_know" USING btree ("_order");
  CREATE INDEX "_places_v_version_guide_know_parent_id_idx" ON "web"."_places_v_version_guide_know" USING btree ("_parent_id");
  CREATE INDEX "_places_v_version_guide_faq_order_idx" ON "web"."_places_v_version_guide_faq" USING btree ("_order");
  CREATE INDEX "_places_v_version_guide_faq_parent_id_idx" ON "web"."_places_v_version_guide_faq" USING btree ("_parent_id");
  CREATE INDEX "_places_v_version_guide_related_order_idx" ON "web"."_places_v_version_guide_related" USING btree ("_order");
  CREATE INDEX "_places_v_version_guide_related_parent_id_idx" ON "web"."_places_v_version_guide_related" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "web"."places_opening_hours_dow" CASCADE;
  DROP TABLE "web"."places_opening_hours_slots" CASCADE;
  DROP TABLE "web"."places_opening_hours" CASCADE;
  DROP TABLE "web"."places_guide_story" CASCADE;
  DROP TABLE "web"."places_guide_items" CASCADE;
  DROP TABLE "web"."places_guide_know" CASCADE;
  DROP TABLE "web"."places_guide_faq" CASCADE;
  DROP TABLE "web"."places_guide_related" CASCADE;
  DROP TABLE "web"."_places_v_version_opening_hours_dow" CASCADE;
  DROP TABLE "web"."_places_v_version_opening_hours_slots" CASCADE;
  DROP TABLE "web"."_places_v_version_opening_hours" CASCADE;
  DROP TABLE "web"."_places_v_version_guide_story" CASCADE;
  DROP TABLE "web"."_places_v_version_guide_items" CASCADE;
  DROP TABLE "web"."_places_v_version_guide_know" CASCADE;
  DROP TABLE "web"."_places_v_version_guide_faq" CASCADE;
  DROP TABLE "web"."_places_v_version_guide_related" CASCADE;
  ALTER TABLE "web"."places" DROP COLUMN "guide_tagline";
  ALTER TABLE "web"."places" DROP COLUMN "guide_summary";
  ALTER TABLE "web"."places" DROP COLUMN "guide_area";
  ALTER TABLE "web"."places" DROP COLUMN "guide_schema_type";
  ALTER TABLE "web"."places" DROP COLUMN "guide_primary_action_label";
  ALTER TABLE "web"."places" DROP COLUMN "guide_primary_action_url";
  ALTER TABLE "web"."places" DROP COLUMN "guide_items_title";
  ALTER TABLE "web"."places" DROP COLUMN "guide_reviews_source";
  ALTER TABLE "web"."places" DROP COLUMN "guide_hours_note";
  ALTER TABLE "web"."places" DROP COLUMN "guide_hours_source";
  ALTER TABLE "web"."places" DROP COLUMN "guide_checked_at";
  ALTER TABLE "web"."_places_v" DROP COLUMN "version_guide_tagline";
  ALTER TABLE "web"."_places_v" DROP COLUMN "version_guide_summary";
  ALTER TABLE "web"."_places_v" DROP COLUMN "version_guide_area";
  ALTER TABLE "web"."_places_v" DROP COLUMN "version_guide_schema_type";
  ALTER TABLE "web"."_places_v" DROP COLUMN "version_guide_primary_action_label";
  ALTER TABLE "web"."_places_v" DROP COLUMN "version_guide_primary_action_url";
  ALTER TABLE "web"."_places_v" DROP COLUMN "version_guide_items_title";
  ALTER TABLE "web"."_places_v" DROP COLUMN "version_guide_reviews_source";
  ALTER TABLE "web"."_places_v" DROP COLUMN "version_guide_hours_note";
  ALTER TABLE "web"."_places_v" DROP COLUMN "version_guide_hours_source";
  ALTER TABLE "web"."_places_v" DROP COLUMN "version_guide_checked_at";
  DROP TYPE "web"."enum_places_opening_hours_dow";
  DROP TYPE "web"."enum__places_v_version_opening_hours_dow";`)
}
