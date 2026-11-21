import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "web"."enum_pages_blocks_card_grid_source" AS ENUM('manual', 'restaurants', 'shops', 'events', 'parks', 'posts');
  CREATE TYPE "web"."enum_pages_blocks_cta_tone" AS ENUM('teal', 'sand');
  CREATE TYPE "web"."enum__pages_v_blocks_card_grid_source" AS ENUM('manual', 'restaurants', 'shops', 'events', 'parks', 'posts');
  CREATE TYPE "web"."enum__pages_v_blocks_cta_tone" AS ENUM('teal', 'sand');
  CREATE TYPE "web"."enum_places_links_kind" AS ENUM('web', 'order', 'reserve', 'reviews');
  CREATE TYPE "web"."enum__places_v_version_links_kind" AS ENUM('web', 'order', 'reserve', 'reviews');
  CREATE TABLE "web"."pages_blocks_prose" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"content" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "web"."pages_blocks_stats_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar
  );
  
  CREATE TABLE "web"."pages_blocks_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"note" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "web"."pages_blocks_feature_list_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar
  );
  
  CREATE TABLE "web"."pages_blocks_feature_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "web"."pages_blocks_card_grid_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"image_id" integer,
  	"label" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "web"."pages_blocks_card_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "web"."enum_pages_blocks_card_grid_source" DEFAULT 'manual',
  	"limit" numeric DEFAULT 6,
  	"more_label" varchar,
  	"more_href" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "web"."pages_blocks_cta_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "web"."pages_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"heading" varchar,
  	"text" varchar,
  	"tone" "web"."enum_pages_blocks_cta_tone" DEFAULT 'teal',
  	"block_name" varchar
  );
  
  CREATE TABLE "web"."pages_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "web"."pages_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"heading" varchar DEFAULT 'Frequently asked questions',
  	"block_name" varchar
  );
  
  CREATE TABLE "web"."pages_blocks_video" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"heading" varchar,
  	"youtube_id" varchar,
  	"title" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "web"."pages_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "web"."pages_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "web"."pages_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "web"."_pages_v_blocks_prose" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"content" jsonb,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "web"."_pages_v_blocks_stats_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "web"."_pages_v_blocks_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"note" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "web"."_pages_v_blocks_feature_list_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "web"."_pages_v_blocks_feature_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "web"."_pages_v_blocks_card_grid_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"image_id" integer,
  	"label" varchar,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "web"."_pages_v_blocks_card_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "web"."enum__pages_v_blocks_card_grid_source" DEFAULT 'manual',
  	"limit" numeric DEFAULT 6,
  	"more_label" varchar,
  	"more_href" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "web"."_pages_v_blocks_cta_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "web"."_pages_v_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"heading" varchar,
  	"text" varchar,
  	"tone" "web"."enum__pages_v_blocks_cta_tone" DEFAULT 'teal',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "web"."_pages_v_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "web"."_pages_v_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"heading" varchar DEFAULT 'Frequently asked questions',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "web"."_pages_v_blocks_video" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"heading" varchar,
  	"youtube_id" varchar,
  	"title" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "web"."_pages_v_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "web"."_pages_v_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "web"."_pages_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "web"."places_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"kind" "web"."enum_places_links_kind" DEFAULT 'web'
  );
  
  CREATE TABLE "web"."_places_v_version_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"kind" "web"."enum__places_v_version_links_kind" DEFAULT 'web',
  	"_uuid" varchar
  );
  
  CREATE TABLE "web"."home_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_eyebrow" varchar DEFAULT 'Your guide to the City of Good Living',
  	"hero_title" varchar DEFAULT 'This is San Carlos Life' NOT NULL,
  	"hero_intro" varchar DEFAULT 'Events, restaurants, neighborhoods and homes for sale in San Carlos, California 94070. Don''t miss the latest news in town.',
  	"hero_poster_id" integer,
  	"hero_vimeo_id" varchar,
  	"agent_heading" varchar DEFAULT 'Thinking of buying or selling a home?',
  	"agent_text" varchar DEFAULT 'Viv and Mark have 30+ years of combined experience and 95% of their clients come from referrals.',
  	"agent_photo_id" integer,
  	"subscribe_heading" varchar DEFAULT 'Don''t miss out',
  	"subscribe_text" varchar DEFAULT 'One email a week with events, new restaurants, and what sold in San Carlos.',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "web"."videos_page_sections_videos" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"youtube_id" varchar NOT NULL,
  	"title" varchar NOT NULL
  );
  
  CREATE TABLE "web"."videos_page_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"playlist_id" varchar
  );
  
  CREATE TABLE "web"."videos_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"intro" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "web"."places" ADD COLUMN "headline" varchar;
  ALTER TABLE "web"."places" ADD COLUMN "email" varchar;
  ALTER TABLE "web"."places" ADD COLUMN "maps_url" varchar;
  ALTER TABLE "web"."places" ADD COLUMN "logo_id" integer;
  ALTER TABLE "web"."_places_v" ADD COLUMN "version_headline" varchar;
  ALTER TABLE "web"."_places_v" ADD COLUMN "version_email" varchar;
  ALTER TABLE "web"."_places_v" ADD COLUMN "version_maps_url" varchar;
  ALTER TABLE "web"."_places_v" ADD COLUMN "version_logo_id" integer;
  ALTER TABLE "web"."parks" ADD COLUMN "maps_url" varchar;
  ALTER TABLE "web"."parks" ADD COLUMN "summary" varchar;
  ALTER TABLE "web"."_parks_v" ADD COLUMN "version_maps_url" varchar;
  ALTER TABLE "web"."_parks_v" ADD COLUMN "version_summary" varchar;
  ALTER TABLE "web"."pages_blocks_prose" ADD CONSTRAINT "pages_blocks_prose_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."pages_blocks_stats_items" ADD CONSTRAINT "pages_blocks_stats_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."pages_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."pages_blocks_stats" ADD CONSTRAINT "pages_blocks_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."pages_blocks_feature_list_items" ADD CONSTRAINT "pages_blocks_feature_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."pages_blocks_feature_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."pages_blocks_feature_list" ADD CONSTRAINT "pages_blocks_feature_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."pages_blocks_card_grid_cards" ADD CONSTRAINT "pages_blocks_card_grid_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."pages_blocks_card_grid_cards" ADD CONSTRAINT "pages_blocks_card_grid_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."pages_blocks_card_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."pages_blocks_card_grid" ADD CONSTRAINT "pages_blocks_card_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."pages_blocks_cta_buttons" ADD CONSTRAINT "pages_blocks_cta_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."pages_blocks_cta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."pages_blocks_cta" ADD CONSTRAINT "pages_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."pages_blocks_faq_items" ADD CONSTRAINT "pages_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."pages_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."pages_blocks_faq" ADD CONSTRAINT "pages_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."pages_blocks_video" ADD CONSTRAINT "pages_blocks_video_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."pages_blocks_image" ADD CONSTRAINT "pages_blocks_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."pages_blocks_image" ADD CONSTRAINT "pages_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."pages_blocks_gallery" ADD CONSTRAINT "pages_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."pages_rels" ADD CONSTRAINT "pages_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "web"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."pages_rels" ADD CONSTRAINT "pages_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "web"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_pages_v_blocks_prose" ADD CONSTRAINT "_pages_v_blocks_prose_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_pages_v_blocks_stats_items" ADD CONSTRAINT "_pages_v_blocks_stats_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."_pages_v_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_pages_v_blocks_stats" ADD CONSTRAINT "_pages_v_blocks_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_pages_v_blocks_feature_list_items" ADD CONSTRAINT "_pages_v_blocks_feature_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."_pages_v_blocks_feature_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_pages_v_blocks_feature_list" ADD CONSTRAINT "_pages_v_blocks_feature_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_pages_v_blocks_card_grid_cards" ADD CONSTRAINT "_pages_v_blocks_card_grid_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_pages_v_blocks_card_grid_cards" ADD CONSTRAINT "_pages_v_blocks_card_grid_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."_pages_v_blocks_card_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_pages_v_blocks_card_grid" ADD CONSTRAINT "_pages_v_blocks_card_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_pages_v_blocks_cta_buttons" ADD CONSTRAINT "_pages_v_blocks_cta_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."_pages_v_blocks_cta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_pages_v_blocks_cta" ADD CONSTRAINT "_pages_v_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_pages_v_blocks_faq_items" ADD CONSTRAINT "_pages_v_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."_pages_v_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_pages_v_blocks_faq" ADD CONSTRAINT "_pages_v_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_pages_v_blocks_video" ADD CONSTRAINT "_pages_v_blocks_video_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_pages_v_blocks_image" ADD CONSTRAINT "_pages_v_blocks_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_pages_v_blocks_image" ADD CONSTRAINT "_pages_v_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_pages_v_blocks_gallery" ADD CONSTRAINT "_pages_v_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "web"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "web"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."places_links" ADD CONSTRAINT "places_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."places"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_places_v_version_links" ADD CONSTRAINT "_places_v_version_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."_places_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."home_page" ADD CONSTRAINT "home_page_hero_poster_id_media_id_fk" FOREIGN KEY ("hero_poster_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."home_page" ADD CONSTRAINT "home_page_agent_photo_id_media_id_fk" FOREIGN KEY ("agent_photo_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."videos_page_sections_videos" ADD CONSTRAINT "videos_page_sections_videos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."videos_page_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."videos_page_sections" ADD CONSTRAINT "videos_page_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."videos_page"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_prose_order_idx" ON "web"."pages_blocks_prose" USING btree ("_order");
  CREATE INDEX "pages_blocks_prose_parent_id_idx" ON "web"."pages_blocks_prose" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_prose_path_idx" ON "web"."pages_blocks_prose" USING btree ("_path");
  CREATE INDEX "pages_blocks_stats_items_order_idx" ON "web"."pages_blocks_stats_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_stats_items_parent_id_idx" ON "web"."pages_blocks_stats_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_stats_order_idx" ON "web"."pages_blocks_stats" USING btree ("_order");
  CREATE INDEX "pages_blocks_stats_parent_id_idx" ON "web"."pages_blocks_stats" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_stats_path_idx" ON "web"."pages_blocks_stats" USING btree ("_path");
  CREATE INDEX "pages_blocks_feature_list_items_order_idx" ON "web"."pages_blocks_feature_list_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_feature_list_items_parent_id_idx" ON "web"."pages_blocks_feature_list_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_feature_list_order_idx" ON "web"."pages_blocks_feature_list" USING btree ("_order");
  CREATE INDEX "pages_blocks_feature_list_parent_id_idx" ON "web"."pages_blocks_feature_list" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_feature_list_path_idx" ON "web"."pages_blocks_feature_list" USING btree ("_path");
  CREATE INDEX "pages_blocks_card_grid_cards_order_idx" ON "web"."pages_blocks_card_grid_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_card_grid_cards_parent_id_idx" ON "web"."pages_blocks_card_grid_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_card_grid_cards_image_idx" ON "web"."pages_blocks_card_grid_cards" USING btree ("image_id");
  CREATE INDEX "pages_blocks_card_grid_order_idx" ON "web"."pages_blocks_card_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_card_grid_parent_id_idx" ON "web"."pages_blocks_card_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_card_grid_path_idx" ON "web"."pages_blocks_card_grid" USING btree ("_path");
  CREATE INDEX "pages_blocks_cta_buttons_order_idx" ON "web"."pages_blocks_cta_buttons" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta_buttons_parent_id_idx" ON "web"."pages_blocks_cta_buttons" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_order_idx" ON "web"."pages_blocks_cta" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta_parent_id_idx" ON "web"."pages_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_path_idx" ON "web"."pages_blocks_cta" USING btree ("_path");
  CREATE INDEX "pages_blocks_faq_items_order_idx" ON "web"."pages_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_items_parent_id_idx" ON "web"."pages_blocks_faq_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_order_idx" ON "web"."pages_blocks_faq" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_parent_id_idx" ON "web"."pages_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_path_idx" ON "web"."pages_blocks_faq" USING btree ("_path");
  CREATE INDEX "pages_blocks_video_order_idx" ON "web"."pages_blocks_video" USING btree ("_order");
  CREATE INDEX "pages_blocks_video_parent_id_idx" ON "web"."pages_blocks_video" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_video_path_idx" ON "web"."pages_blocks_video" USING btree ("_path");
  CREATE INDEX "pages_blocks_image_order_idx" ON "web"."pages_blocks_image" USING btree ("_order");
  CREATE INDEX "pages_blocks_image_parent_id_idx" ON "web"."pages_blocks_image" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_image_path_idx" ON "web"."pages_blocks_image" USING btree ("_path");
  CREATE INDEX "pages_blocks_image_image_idx" ON "web"."pages_blocks_image" USING btree ("image_id");
  CREATE INDEX "pages_blocks_gallery_order_idx" ON "web"."pages_blocks_gallery" USING btree ("_order");
  CREATE INDEX "pages_blocks_gallery_parent_id_idx" ON "web"."pages_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_gallery_path_idx" ON "web"."pages_blocks_gallery" USING btree ("_path");
  CREATE INDEX "pages_rels_order_idx" ON "web"."pages_rels" USING btree ("order");
  CREATE INDEX "pages_rels_parent_idx" ON "web"."pages_rels" USING btree ("parent_id");
  CREATE INDEX "pages_rels_path_idx" ON "web"."pages_rels" USING btree ("path");
  CREATE INDEX "pages_rels_media_id_idx" ON "web"."pages_rels" USING btree ("media_id");
  CREATE INDEX "_pages_v_blocks_prose_order_idx" ON "web"."_pages_v_blocks_prose" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_prose_parent_id_idx" ON "web"."_pages_v_blocks_prose" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_prose_path_idx" ON "web"."_pages_v_blocks_prose" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_stats_items_order_idx" ON "web"."_pages_v_blocks_stats_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_stats_items_parent_id_idx" ON "web"."_pages_v_blocks_stats_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_stats_order_idx" ON "web"."_pages_v_blocks_stats" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_stats_parent_id_idx" ON "web"."_pages_v_blocks_stats" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_stats_path_idx" ON "web"."_pages_v_blocks_stats" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_feature_list_items_order_idx" ON "web"."_pages_v_blocks_feature_list_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_feature_list_items_parent_id_idx" ON "web"."_pages_v_blocks_feature_list_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_feature_list_order_idx" ON "web"."_pages_v_blocks_feature_list" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_feature_list_parent_id_idx" ON "web"."_pages_v_blocks_feature_list" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_feature_list_path_idx" ON "web"."_pages_v_blocks_feature_list" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_card_grid_cards_order_idx" ON "web"."_pages_v_blocks_card_grid_cards" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_card_grid_cards_parent_id_idx" ON "web"."_pages_v_blocks_card_grid_cards" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_card_grid_cards_image_idx" ON "web"."_pages_v_blocks_card_grid_cards" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_card_grid_order_idx" ON "web"."_pages_v_blocks_card_grid" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_card_grid_parent_id_idx" ON "web"."_pages_v_blocks_card_grid" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_card_grid_path_idx" ON "web"."_pages_v_blocks_card_grid" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_cta_buttons_order_idx" ON "web"."_pages_v_blocks_cta_buttons" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cta_buttons_parent_id_idx" ON "web"."_pages_v_blocks_cta_buttons" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cta_order_idx" ON "web"."_pages_v_blocks_cta" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cta_parent_id_idx" ON "web"."_pages_v_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cta_path_idx" ON "web"."_pages_v_blocks_cta" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_faq_items_order_idx" ON "web"."_pages_v_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faq_items_parent_id_idx" ON "web"."_pages_v_blocks_faq_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_order_idx" ON "web"."_pages_v_blocks_faq" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faq_parent_id_idx" ON "web"."_pages_v_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_path_idx" ON "web"."_pages_v_blocks_faq" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_video_order_idx" ON "web"."_pages_v_blocks_video" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_video_parent_id_idx" ON "web"."_pages_v_blocks_video" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_video_path_idx" ON "web"."_pages_v_blocks_video" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_image_order_idx" ON "web"."_pages_v_blocks_image" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_image_parent_id_idx" ON "web"."_pages_v_blocks_image" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_image_path_idx" ON "web"."_pages_v_blocks_image" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_image_image_idx" ON "web"."_pages_v_blocks_image" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_gallery_order_idx" ON "web"."_pages_v_blocks_gallery" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_gallery_parent_id_idx" ON "web"."_pages_v_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_gallery_path_idx" ON "web"."_pages_v_blocks_gallery" USING btree ("_path");
  CREATE INDEX "_pages_v_rels_order_idx" ON "web"."_pages_v_rels" USING btree ("order");
  CREATE INDEX "_pages_v_rels_parent_idx" ON "web"."_pages_v_rels" USING btree ("parent_id");
  CREATE INDEX "_pages_v_rels_path_idx" ON "web"."_pages_v_rels" USING btree ("path");
  CREATE INDEX "_pages_v_rels_media_id_idx" ON "web"."_pages_v_rels" USING btree ("media_id");
  CREATE INDEX "places_links_order_idx" ON "web"."places_links" USING btree ("_order");
  CREATE INDEX "places_links_parent_id_idx" ON "web"."places_links" USING btree ("_parent_id");
  CREATE INDEX "_places_v_version_links_order_idx" ON "web"."_places_v_version_links" USING btree ("_order");
  CREATE INDEX "_places_v_version_links_parent_id_idx" ON "web"."_places_v_version_links" USING btree ("_parent_id");
  CREATE INDEX "home_page_hero_poster_idx" ON "web"."home_page" USING btree ("hero_poster_id");
  CREATE INDEX "home_page_agent_photo_idx" ON "web"."home_page" USING btree ("agent_photo_id");
  CREATE INDEX "videos_page_sections_videos_order_idx" ON "web"."videos_page_sections_videos" USING btree ("_order");
  CREATE INDEX "videos_page_sections_videos_parent_id_idx" ON "web"."videos_page_sections_videos" USING btree ("_parent_id");
  CREATE INDEX "videos_page_sections_order_idx" ON "web"."videos_page_sections" USING btree ("_order");
  CREATE INDEX "videos_page_sections_parent_id_idx" ON "web"."videos_page_sections" USING btree ("_parent_id");
  ALTER TABLE "web"."places" ADD CONSTRAINT "places_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_places_v" ADD CONSTRAINT "_places_v_version_logo_id_media_id_fk" FOREIGN KEY ("version_logo_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "places_logo_idx" ON "web"."places" USING btree ("logo_id");
  CREATE INDEX "_places_v_version_version_logo_idx" ON "web"."_places_v" USING btree ("version_logo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "web"."pages_blocks_prose" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "web"."pages_blocks_stats_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "web"."pages_blocks_stats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "web"."pages_blocks_feature_list_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "web"."pages_blocks_feature_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "web"."pages_blocks_card_grid_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "web"."pages_blocks_card_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "web"."pages_blocks_cta_buttons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "web"."pages_blocks_cta" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "web"."pages_blocks_faq_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "web"."pages_blocks_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "web"."pages_blocks_video" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "web"."pages_blocks_image" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "web"."pages_blocks_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "web"."pages_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "web"."_pages_v_blocks_prose" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "web"."_pages_v_blocks_stats_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "web"."_pages_v_blocks_stats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "web"."_pages_v_blocks_feature_list_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "web"."_pages_v_blocks_feature_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "web"."_pages_v_blocks_card_grid_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "web"."_pages_v_blocks_card_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "web"."_pages_v_blocks_cta_buttons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "web"."_pages_v_blocks_cta" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "web"."_pages_v_blocks_faq_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "web"."_pages_v_blocks_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "web"."_pages_v_blocks_video" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "web"."_pages_v_blocks_image" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "web"."_pages_v_blocks_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "web"."_pages_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "web"."places_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "web"."_places_v_version_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "web"."home_page" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "web"."videos_page_sections_videos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "web"."videos_page_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "web"."videos_page" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "web"."pages_blocks_prose" CASCADE;
  DROP TABLE "web"."pages_blocks_stats_items" CASCADE;
  DROP TABLE "web"."pages_blocks_stats" CASCADE;
  DROP TABLE "web"."pages_blocks_feature_list_items" CASCADE;
  DROP TABLE "web"."pages_blocks_feature_list" CASCADE;
  DROP TABLE "web"."pages_blocks_card_grid_cards" CASCADE;
  DROP TABLE "web"."pages_blocks_card_grid" CASCADE;
  DROP TABLE "web"."pages_blocks_cta_buttons" CASCADE;
  DROP TABLE "web"."pages_blocks_cta" CASCADE;
  DROP TABLE "web"."pages_blocks_faq_items" CASCADE;
  DROP TABLE "web"."pages_blocks_faq" CASCADE;
  DROP TABLE "web"."pages_blocks_video" CASCADE;
  DROP TABLE "web"."pages_blocks_image" CASCADE;
  DROP TABLE "web"."pages_blocks_gallery" CASCADE;
  DROP TABLE "web"."pages_rels" CASCADE;
  DROP TABLE "web"."_pages_v_blocks_prose" CASCADE;
  DROP TABLE "web"."_pages_v_blocks_stats_items" CASCADE;
  DROP TABLE "web"."_pages_v_blocks_stats" CASCADE;
  DROP TABLE "web"."_pages_v_blocks_feature_list_items" CASCADE;
  DROP TABLE "web"."_pages_v_blocks_feature_list" CASCADE;
  DROP TABLE "web"."_pages_v_blocks_card_grid_cards" CASCADE;
  DROP TABLE "web"."_pages_v_blocks_card_grid" CASCADE;
  DROP TABLE "web"."_pages_v_blocks_cta_buttons" CASCADE;
  DROP TABLE "web"."_pages_v_blocks_cta" CASCADE;
  DROP TABLE "web"."_pages_v_blocks_faq_items" CASCADE;
  DROP TABLE "web"."_pages_v_blocks_faq" CASCADE;
  DROP TABLE "web"."_pages_v_blocks_video" CASCADE;
  DROP TABLE "web"."_pages_v_blocks_image" CASCADE;
  DROP TABLE "web"."_pages_v_blocks_gallery" CASCADE;
  DROP TABLE "web"."_pages_v_rels" CASCADE;
  DROP TABLE "web"."places_links" CASCADE;
  DROP TABLE "web"."_places_v_version_links" CASCADE;
  DROP TABLE "web"."home_page" CASCADE;
  DROP TABLE "web"."videos_page_sections_videos" CASCADE;
  DROP TABLE "web"."videos_page_sections" CASCADE;
  DROP TABLE "web"."videos_page" CASCADE;
  ALTER TABLE "web"."places" DROP CONSTRAINT "places_logo_id_media_id_fk";
  
  ALTER TABLE "web"."_places_v" DROP CONSTRAINT "_places_v_version_logo_id_media_id_fk";
  
  DROP INDEX "web"."places_logo_idx";
  DROP INDEX "web"."_places_v_version_version_logo_idx";
  ALTER TABLE "web"."places" DROP COLUMN "headline";
  ALTER TABLE "web"."places" DROP COLUMN "email";
  ALTER TABLE "web"."places" DROP COLUMN "maps_url";
  ALTER TABLE "web"."places" DROP COLUMN "logo_id";
  ALTER TABLE "web"."_places_v" DROP COLUMN "version_headline";
  ALTER TABLE "web"."_places_v" DROP COLUMN "version_email";
  ALTER TABLE "web"."_places_v" DROP COLUMN "version_maps_url";
  ALTER TABLE "web"."_places_v" DROP COLUMN "version_logo_id";
  ALTER TABLE "web"."parks" DROP COLUMN "maps_url";
  ALTER TABLE "web"."parks" DROP COLUMN "summary";
  ALTER TABLE "web"."_parks_v" DROP COLUMN "version_maps_url";
  ALTER TABLE "web"."_parks_v" DROP COLUMN "version_summary";
  DROP TYPE "web"."enum_pages_blocks_card_grid_source";
  DROP TYPE "web"."enum_pages_blocks_cta_tone";
  DROP TYPE "web"."enum__pages_v_blocks_card_grid_source";
  DROP TYPE "web"."enum__pages_v_blocks_cta_tone";
  DROP TYPE "web"."enum_places_links_kind";
  DROP TYPE "web"."enum__places_v_version_links_kind";`)
}
