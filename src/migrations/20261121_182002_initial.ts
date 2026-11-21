import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE SCHEMA IF NOT EXISTS "web";
   CREATE TYPE "web"."enum_posts_review_state" AS ENUM('none', 'in-review', 'approved', 'rejected');
  CREATE TYPE "web"."enum_posts_review_source" AS ENUM('editor', 'claude', 'website-ai', 'public');
  CREATE TYPE "web"."enum_posts_status" AS ENUM('draft', 'published');
  CREATE TYPE "web"."enum__posts_v_version_review_state" AS ENUM('none', 'in-review', 'approved', 'rejected');
  CREATE TYPE "web"."enum__posts_v_version_review_source" AS ENUM('editor', 'claude', 'website-ai', 'public');
  CREATE TYPE "web"."enum__posts_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "web"."enum_desk_pages_review_state" AS ENUM('none', 'in-review', 'approved', 'rejected');
  CREATE TYPE "web"."enum_desk_pages_review_source" AS ENUM('editor', 'claude', 'website-ai', 'public');
  CREATE TYPE "web"."enum_desk_pages_template" AS ENUM('guide');
  CREATE TYPE "web"."enum_desk_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "web"."enum__desk_pages_v_version_review_state" AS ENUM('none', 'in-review', 'approved', 'rejected');
  CREATE TYPE "web"."enum__desk_pages_v_version_review_source" AS ENUM('editor', 'claude', 'website-ai', 'public');
  CREATE TYPE "web"."enum__desk_pages_v_version_template" AS ENUM('guide');
  CREATE TYPE "web"."enum__desk_pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "web"."enum_desk_jobs_cadence" AS ENUM('daily', 'weekdays', 'weekly');
  CREATE TYPE "web"."enum_desk_jobs_weekday" AS ENUM('0', '1', '2', '3', '4', '5', '6');
  CREATE TYPE "web"."enum_desk_runs_runner" AS ENUM('claude', 'website-ai', 'editor');
  CREATE TYPE "web"."enum_desk_runs_status" AS ENUM('ok', 'partial', 'failed');
  CREATE TYPE "web"."enum_ai_prompts_format" AS ENUM('blog', 'desk-page');
  CREATE TYPE "web"."enum__ai_prompts_v_version_format" AS ENUM('blog', 'desk-page');
  CREATE TYPE "web"."enum_ai_connections_provider" AS ENUM('anthropic', 'openai', 'gemini', 'openrouter', 'openai-compatible', 'mock');
  CREATE TYPE "web"."enum_oauth_clients_auth_method" AS ENUM('none', 'client_secret_post', 'client_secret_basic');
  CREATE TYPE "web"."enum_oauth_tokens_kind" AS ENUM('code', 'access', 'refresh');
  CREATE TYPE "web"."enum_events_review_state" AS ENUM('none', 'in-review', 'approved', 'rejected');
  CREATE TYPE "web"."enum_events_review_source" AS ENUM('editor', 'claude', 'website-ai', 'public');
  CREATE TYPE "web"."enum_events_status" AS ENUM('draft', 'pending', 'published', 'archived');
  CREATE TYPE "web"."enum__events_v_version_review_state" AS ENUM('none', 'in-review', 'approved', 'rejected');
  CREATE TYPE "web"."enum__events_v_version_review_source" AS ENUM('editor', 'claude', 'website-ai', 'public');
  CREATE TYPE "web"."enum__events_v_version_status" AS ENUM('draft', 'pending', 'published', 'archived');
  CREATE TYPE "web"."enum_places_links_kind" AS ENUM('web', 'order', 'reserve', 'reviews');
  CREATE TYPE "web"."enum_places_review_state" AS ENUM('none', 'in-review', 'approved', 'rejected');
  CREATE TYPE "web"."enum_places_review_source" AS ENUM('editor', 'claude', 'website-ai', 'public');
  CREATE TYPE "web"."enum_places_type" AS ENUM('restaurant', 'shop', 'service', 'bar');
  CREATE TYPE "web"."enum_places_business_status" AS ENUM('open', 'temporarily_closed', 'closed');
  CREATE TYPE "web"."enum_places_street" AS ENUM('laurel', 'san-carlos-ave', 'el-camino', 'industrial', 'other');
  CREATE TYPE "web"."enum_places_price_range" AS ENUM('$', '$$', '$$$', '$$$$');
  CREATE TYPE "web"."enum_places_status" AS ENUM('draft', 'published');
  CREATE TYPE "web"."enum__places_v_version_links_kind" AS ENUM('web', 'order', 'reserve', 'reviews');
  CREATE TYPE "web"."enum__places_v_version_review_state" AS ENUM('none', 'in-review', 'approved', 'rejected');
  CREATE TYPE "web"."enum__places_v_version_review_source" AS ENUM('editor', 'claude', 'website-ai', 'public');
  CREATE TYPE "web"."enum__places_v_version_type" AS ENUM('restaurant', 'shop', 'service', 'bar');
  CREATE TYPE "web"."enum__places_v_version_business_status" AS ENUM('open', 'temporarily_closed', 'closed');
  CREATE TYPE "web"."enum__places_v_version_street" AS ENUM('laurel', 'san-carlos-ave', 'el-camino', 'industrial', 'other');
  CREATE TYPE "web"."enum__places_v_version_price_range" AS ENUM('$', '$$', '$$$', '$$$$');
  CREATE TYPE "web"."enum__places_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "web"."enum_parks_type" AS ENUM('park', 'trail', 'garden');
  CREATE TYPE "web"."enum_parks_status" AS ENUM('draft', 'published');
  CREATE TYPE "web"."enum__parks_v_version_type" AS ENUM('park', 'trail', 'garden');
  CREATE TYPE "web"."enum__parks_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "web"."enum_neighborhoods_status" AS ENUM('draft', 'published');
  CREATE TYPE "web"."enum__neighborhoods_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "web"."enum_gallery_photos_status" AS ENUM('pending', 'approved', 'rejected');
  CREATE TYPE "web"."enum_city_projects_review_state" AS ENUM('none', 'in-review', 'approved', 'rejected');
  CREATE TYPE "web"."enum_city_projects_review_source" AS ENUM('editor', 'claude', 'website-ai', 'public');
  CREATE TYPE "web"."enum_city_projects_status" AS ENUM('draft', 'published');
  CREATE TYPE "web"."enum__city_projects_v_version_review_state" AS ENUM('none', 'in-review', 'approved', 'rejected');
  CREATE TYPE "web"."enum__city_projects_v_version_review_source" AS ENUM('editor', 'claude', 'website-ai', 'public');
  CREATE TYPE "web"."enum__city_projects_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "web"."enum_redirects_status_code" AS ENUM('301', '302', '410');
  CREATE TYPE "web"."enum_users_role" AS ENUM('admin', 'editor');
  CREATE TYPE "web"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'schedulePublish');
  CREATE TYPE "web"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "web"."enum_payload_jobs_task_slug" AS ENUM('inline', 'schedulePublish');
  CREATE TYPE "web"."enum_settings_social_platform" AS ENUM('facebook', 'instagram', 'youtube', 'linkedin', 'x', 'tiktok', 'nextdoor');
  CREATE TABLE "web"."posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"review_state" "web"."enum_posts_review_state" DEFAULT 'none',
  	"review_source" "web"."enum_posts_review_source",
  	"review_note" varchar,
  	"review_check" jsonb,
  	"review_submitted_at" timestamp(3) with time zone,
  	"review_reviewed_at" timestamp(3) with time zone,
  	"review_reviewed_by_id" integer,
  	"title" varchar,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar,
  	"published_at" timestamp(3) with time zone,
  	"author_id" integer,
  	"cover_id" integer,
  	"excerpt" varchar,
  	"body" jsonb,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_focus_keyword" varchar,
  	"seo_image_id" integer,
  	"seo_canonical" varchar,
  	"seo_noindex" boolean DEFAULT false,
  	"json_ld" jsonb,
  	"wp_id" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "web"."enum_posts_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "web"."posts_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "web"."posts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer
  );
  
  CREATE TABLE "web"."_posts_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_review_state" "web"."enum__posts_v_version_review_state" DEFAULT 'none',
  	"version_review_source" "web"."enum__posts_v_version_review_source",
  	"version_review_note" varchar,
  	"version_review_check" jsonb,
  	"version_review_submitted_at" timestamp(3) with time zone,
  	"version_review_reviewed_at" timestamp(3) with time zone,
  	"version_review_reviewed_by_id" integer,
  	"version_title" varchar,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_author_id" integer,
  	"version_cover_id" integer,
  	"version_excerpt" varchar,
  	"version_body" jsonb,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_focus_keyword" varchar,
  	"version_seo_image_id" integer,
  	"version_seo_canonical" varchar,
  	"version_seo_noindex" boolean DEFAULT false,
  	"version_json_ld" jsonb,
  	"version_wp_id" numeric,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "web"."enum__posts_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "web"."_posts_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "web"."_posts_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer
  );
  
  CREATE TABLE "web"."categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"wp_id" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "web"."pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_focus_keyword" varchar,
  	"seo_image_id" integer,
  	"seo_canonical" varchar,
  	"seo_noindex" boolean DEFAULT false,
  	"json_ld" jsonb,
  	"wp_id" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "web"."page_edits" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"page" varchar NOT NULL,
  	"path" varchar,
  	"texts" jsonb,
  	"images" jsonb,
  	"changes" numeric,
  	"updated_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "web"."_page_edits_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_page" varchar NOT NULL,
  	"version_path" varchar,
  	"version_texts" jsonb,
  	"version_images" jsonb,
  	"version_changes" numeric,
  	"version_updated_by_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "web"."desk_pages_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" jsonb
  );
  
  CREATE TABLE "web"."desk_pages_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "web"."desk_pages_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "web"."desk_pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"review_state" "web"."enum_desk_pages_review_state" DEFAULT 'none',
  	"review_source" "web"."enum_desk_pages_review_source",
  	"review_note" varchar,
  	"review_check" jsonb,
  	"review_submitted_at" timestamp(3) with time zone,
  	"review_reviewed_at" timestamp(3) with time zone,
  	"review_reviewed_by_id" integer,
  	"title" varchar,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar,
  	"template" "web"."enum_desk_pages_template" DEFAULT 'guide',
  	"eyebrow" varchar,
  	"summary" varchar,
  	"hero_id" integer,
  	"cta_heading" varchar,
  	"cta_text" varchar,
  	"cta_button_label" varchar,
  	"cta_button_href" varchar,
  	"updated" timestamp(3) with time zone,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_focus_keyword" varchar,
  	"seo_image_id" integer,
  	"seo_canonical" varchar,
  	"seo_noindex" boolean DEFAULT false,
  	"json_ld" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "web"."enum_desk_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "web"."_desk_pages_v_version_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" jsonb,
  	"_uuid" varchar
  );
  
  CREATE TABLE "web"."_desk_pages_v_version_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "web"."_desk_pages_v_version_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "web"."_desk_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_review_state" "web"."enum__desk_pages_v_version_review_state" DEFAULT 'none',
  	"version_review_source" "web"."enum__desk_pages_v_version_review_source",
  	"version_review_note" varchar,
  	"version_review_check" jsonb,
  	"version_review_submitted_at" timestamp(3) with time zone,
  	"version_review_reviewed_at" timestamp(3) with time zone,
  	"version_review_reviewed_by_id" integer,
  	"version_title" varchar,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_template" "web"."enum__desk_pages_v_version_template" DEFAULT 'guide',
  	"version_eyebrow" varchar,
  	"version_summary" varchar,
  	"version_hero_id" integer,
  	"version_cta_heading" varchar,
  	"version_cta_text" varchar,
  	"version_cta_button_label" varchar,
  	"version_cta_button_href" varchar,
  	"version_updated" timestamp(3) with time zone,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_focus_keyword" varchar,
  	"version_seo_image_id" integer,
  	"version_seo_canonical" varchar,
  	"version_seo_noindex" boolean DEFAULT false,
  	"version_json_ld" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "web"."enum__desk_pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "web"."desk_jobs_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "web"."desk_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"cadence" "web"."enum_desk_jobs_cadence" DEFAULT 'daily' NOT NULL,
  	"weekday" "web"."enum_desk_jobs_weekday",
  	"hour" numeric DEFAULT 6 NOT NULL,
  	"grace_hours" numeric DEFAULT 3 NOT NULL,
  	"backup" boolean DEFAULT true,
  	"prompt_id" integer NOT NULL,
  	"connection_id" integer,
  	"instructions" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "web"."desk_runs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"job" varchar NOT NULL,
  	"runner" "web"."enum_desk_runs_runner" NOT NULL,
  	"status" "web"."enum_desk_runs_status" DEFAULT 'ok' NOT NULL,
  	"started_at" timestamp(3) with time zone NOT NULL,
  	"finished_at" timestamp(3) with time zone,
  	"summary" varchar,
  	"checked" numeric,
  	"drafted" numeric,
  	"notes" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "web"."ai_prompts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"format" "web"."enum_ai_prompts_format" NOT NULL,
  	"active" boolean DEFAULT true,
  	"instructions" varchar NOT NULL,
  	"rules" varchar,
  	"example" varchar,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "web"."_ai_prompts_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar NOT NULL,
  	"version_format" "web"."enum__ai_prompts_v_version_format" NOT NULL,
  	"version_active" boolean DEFAULT true,
  	"version_instructions" varchar NOT NULL,
  	"version_rules" varchar,
  	"version_example" varchar,
  	"version_notes" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "web"."ai_connections" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"provider" "web"."enum_ai_connections_provider" NOT NULL,
  	"model" varchar NOT NULL,
  	"base_url" varchar,
  	"api_key" varchar,
  	"key_hint" varchar,
  	"enabled" boolean DEFAULT true,
  	"is_default" boolean DEFAULT false,
  	"use_for_backup" boolean DEFAULT false,
  	"max_output_tokens" numeric DEFAULT 8000,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "web"."oauth_clients" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"client_id" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"redirect_uris" jsonb NOT NULL,
  	"auth_method" "web"."enum_oauth_clients_auth_method" DEFAULT 'none' NOT NULL,
  	"secret_hash" varchar,
  	"client_uri" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "web"."oauth_tokens" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "web"."enum_oauth_tokens_kind" NOT NULL,
  	"hash" varchar NOT NULL,
  	"client_id" integer NOT NULL,
  	"user_id" integer NOT NULL,
  	"family" varchar NOT NULL,
  	"scope" varchar,
  	"resource" varchar,
  	"redirect_uri" varchar,
  	"code_challenge" varchar,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"used_at" timestamp(3) with time zone,
  	"revoked_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "web"."events_exdates" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone
  );
  
  CREATE TABLE "web"."events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"review_state" "web"."enum_events_review_state" DEFAULT 'none',
  	"review_source" "web"."enum_events_review_source",
  	"review_note" varchar,
  	"review_check" jsonb,
  	"review_submitted_at" timestamp(3) with time zone,
  	"review_reviewed_at" timestamp(3) with time zone,
  	"review_reviewed_by_id" integer,
  	"title" varchar NOT NULL,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"status" "web"."enum_events_status" DEFAULT 'draft' NOT NULL,
  	"starts_at" timestamp(3) with time zone NOT NULL,
  	"ends_at" timestamp(3) with time zone,
  	"all_day" boolean DEFAULT false,
  	"timezone" varchar DEFAULT 'America/Los_Angeles',
  	"rrule" varchar,
  	"series_id" integer,
  	"venue_id" integer,
  	"organizer_id" integer,
  	"cost" varchar,
  	"url" varchar,
  	"cover_id" integer,
  	"featured" boolean DEFAULT false,
  	"body" jsonb,
  	"submitted_by_name" varchar,
  	"submitted_by_email" varchar,
  	"submitted_by_phone" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_focus_keyword" varchar,
  	"seo_image_id" integer,
  	"seo_canonical" varchar,
  	"seo_noindex" boolean DEFAULT false,
  	"wp_id" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "web"."events_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"event_categories_id" integer
  );
  
  CREATE TABLE "web"."_events_v_version_exdates" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone,
  	"_uuid" varchar
  );
  
  CREATE TABLE "web"."_events_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_review_state" "web"."enum__events_v_version_review_state" DEFAULT 'none',
  	"version_review_source" "web"."enum__events_v_version_review_source",
  	"version_review_note" varchar,
  	"version_review_check" jsonb,
  	"version_review_submitted_at" timestamp(3) with time zone,
  	"version_review_reviewed_at" timestamp(3) with time zone,
  	"version_review_reviewed_by_id" integer,
  	"version_title" varchar NOT NULL,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar NOT NULL,
  	"version_status" "web"."enum__events_v_version_status" DEFAULT 'draft' NOT NULL,
  	"version_starts_at" timestamp(3) with time zone NOT NULL,
  	"version_ends_at" timestamp(3) with time zone,
  	"version_all_day" boolean DEFAULT false,
  	"version_timezone" varchar DEFAULT 'America/Los_Angeles',
  	"version_rrule" varchar,
  	"version_series_id" integer,
  	"version_venue_id" integer,
  	"version_organizer_id" integer,
  	"version_cost" varchar,
  	"version_url" varchar,
  	"version_cover_id" integer,
  	"version_featured" boolean DEFAULT false,
  	"version_body" jsonb,
  	"version_submitted_by_name" varchar,
  	"version_submitted_by_email" varchar,
  	"version_submitted_by_phone" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_focus_keyword" varchar,
  	"version_seo_image_id" integer,
  	"version_seo_canonical" varchar,
  	"version_seo_noindex" boolean DEFAULT false,
  	"version_wp_id" numeric,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "web"."_events_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"event_categories_id" integer
  );
  
  CREATE TABLE "web"."venues" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"address" varchar,
  	"city" varchar DEFAULT 'San Carlos',
  	"state" varchar DEFAULT 'CA',
  	"zip" varchar,
  	"lat" numeric,
  	"lng" numeric,
  	"url" varchar,
  	"phone" varchar,
  	"wp_id" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "web"."organizers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"url" varchar,
  	"email" varchar,
  	"phone" varchar,
  	"wp_id" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "web"."event_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"color" varchar,
  	"wp_id" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "web"."places_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"kind" "web"."enum_places_links_kind" DEFAULT 'web'
  );
  
  CREATE TABLE "web"."places" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"review_state" "web"."enum_places_review_state" DEFAULT 'none',
  	"review_source" "web"."enum_places_review_source",
  	"review_note" varchar,
  	"review_check" jsonb,
  	"review_submitted_at" timestamp(3) with time zone,
  	"review_reviewed_at" timestamp(3) with time zone,
  	"review_reviewed_by_id" integer,
  	"name" varchar,
  	"headline" varchar,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar,
  	"type" "web"."enum_places_type",
  	"business_status" "web"."enum_places_business_status" DEFAULT 'open',
  	"featured" boolean DEFAULT false,
  	"street" "web"."enum_places_street",
  	"address" varchar,
  	"lat" numeric,
  	"lng" numeric,
  	"phone" varchar,
  	"website" varchar,
  	"price_range" "web"."enum_places_price_range",
  	"email" varchar,
  	"maps_url" varchar,
  	"hours" varchar,
  	"cover_id" integer,
  	"logo_id" integer,
  	"body" jsonb,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_focus_keyword" varchar,
  	"seo_image_id" integer,
  	"seo_canonical" varchar,
  	"seo_noindex" boolean DEFAULT false,
  	"json_ld" jsonb,
  	"wp_id" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "web"."enum_places_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "web"."places_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "web"."places_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
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
  
  CREATE TABLE "web"."_places_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_review_state" "web"."enum__places_v_version_review_state" DEFAULT 'none',
  	"version_review_source" "web"."enum__places_v_version_review_source",
  	"version_review_note" varchar,
  	"version_review_check" jsonb,
  	"version_review_submitted_at" timestamp(3) with time zone,
  	"version_review_reviewed_at" timestamp(3) with time zone,
  	"version_review_reviewed_by_id" integer,
  	"version_name" varchar,
  	"version_headline" varchar,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_type" "web"."enum__places_v_version_type",
  	"version_business_status" "web"."enum__places_v_version_business_status" DEFAULT 'open',
  	"version_featured" boolean DEFAULT false,
  	"version_street" "web"."enum__places_v_version_street",
  	"version_address" varchar,
  	"version_lat" numeric,
  	"version_lng" numeric,
  	"version_phone" varchar,
  	"version_website" varchar,
  	"version_price_range" "web"."enum__places_v_version_price_range",
  	"version_email" varchar,
  	"version_maps_url" varchar,
  	"version_hours" varchar,
  	"version_cover_id" integer,
  	"version_logo_id" integer,
  	"version_body" jsonb,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_focus_keyword" varchar,
  	"version_seo_image_id" integer,
  	"version_seo_canonical" varchar,
  	"version_seo_noindex" boolean DEFAULT false,
  	"version_json_ld" jsonb,
  	"version_wp_id" numeric,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "web"."enum__places_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "web"."_places_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "web"."_places_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "web"."parks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar,
  	"type" "web"."enum_parks_type" DEFAULT 'park',
  	"address" varchar,
  	"maps_url" varchar,
  	"lat" numeric,
  	"lng" numeric,
  	"acres" numeric,
  	"summary" varchar,
  	"cover_id" integer,
  	"body" jsonb,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_focus_keyword" varchar,
  	"seo_image_id" integer,
  	"seo_canonical" varchar,
  	"seo_noindex" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "web"."enum_parks_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "web"."parks_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "web"."_parks_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_type" "web"."enum__parks_v_version_type" DEFAULT 'park',
  	"version_address" varchar,
  	"version_maps_url" varchar,
  	"version_lat" numeric,
  	"version_lng" numeric,
  	"version_acres" numeric,
  	"version_summary" varchar,
  	"version_cover_id" integer,
  	"version_body" jsonb,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_focus_keyword" varchar,
  	"version_seo_image_id" integer,
  	"version_seo_canonical" varchar,
  	"version_seo_noindex" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "web"."enum__parks_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "web"."_parks_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "web"."neighborhoods_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" varchar,
  	"title" varchar,
  	"text" varchar
  );
  
  CREATE TABLE "web"."neighborhoods_schools" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"grades" varchar,
  	"district" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "web"."neighborhoods_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "web"."neighborhoods" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar,
  	"tagline" varchar,
  	"hero_id" integer,
  	"intro" jsonb,
  	"bb_filter_id" varchar,
  	"ihf_market_id" numeric,
  	"polygon" jsonb,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_focus_keyword" varchar,
  	"seo_image_id" integer,
  	"seo_canonical" varchar,
  	"seo_noindex" boolean DEFAULT false,
  	"json_ld" jsonb,
  	"wp_id" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "web"."enum_neighborhoods_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "web"."_neighborhoods_v_version_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"icon" varchar,
  	"title" varchar,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "web"."_neighborhoods_v_version_schools" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"grades" varchar,
  	"district" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "web"."_neighborhoods_v_version_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "web"."_neighborhoods_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_tagline" varchar,
  	"version_hero_id" integer,
  	"version_intro" jsonb,
  	"version_bb_filter_id" varchar,
  	"version_ihf_market_id" numeric,
  	"version_polygon" jsonb,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_focus_keyword" varchar,
  	"version_seo_image_id" integer,
  	"version_seo_canonical" varchar,
  	"version_seo_noindex" boolean DEFAULT false,
  	"version_json_ld" jsonb,
  	"version_wp_id" numeric,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "web"."enum__neighborhoods_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "web"."testimonials" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"quote" varchar NOT NULL,
  	"author" varchar NOT NULL,
  	"context" varchar,
  	"date" timestamp(3) with time zone,
  	"featured" boolean DEFAULT false,
  	"wp_id" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "web"."timeline_entries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"year" numeric NOT NULL,
  	"date_label" varchar,
  	"sort" numeric DEFAULT 0,
  	"title" varchar NOT NULL,
  	"body" jsonb,
  	"image_id" integer,
  	"source_url" varchar,
  	"wp_id" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "web"."gallery_photos" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"caption" varchar,
  	"photographer" varchar,
  	"photographer_email" varchar,
  	"status" "web"."enum_gallery_photos_status" DEFAULT 'pending' NOT NULL,
  	"featured" boolean DEFAULT false,
  	"submitted_at" timestamp(3) with time zone,
  	"wp_id" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "web"."city_projects_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"url" varchar,
  	"published_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "web"."city_projects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"review_state" "web"."enum_city_projects_review_state" DEFAULT 'none',
  	"review_source" "web"."enum_city_projects_review_source",
  	"review_note" varchar,
  	"review_check" jsonb,
  	"review_submitted_at" timestamp(3) with time zone,
  	"review_reviewed_at" timestamp(3) with time zone,
  	"review_reviewed_by_id" integer,
  	"title" varchar,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar,
  	"area" varchar,
  	"status" "web"."enum_city_projects_status",
  	"latest_update_at" timestamp(3) with time zone,
  	"summary" varchar,
  	"cover_id" integer,
  	"body" jsonb,
  	"ops_desk_id" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_focus_keyword" varchar,
  	"seo_image_id" integer,
  	"seo_canonical" varchar,
  	"seo_noindex" boolean DEFAULT false,
  	"wp_id" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "web"."enum_city_projects_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "web"."_city_projects_v_version_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"url" varchar,
  	"published_at" timestamp(3) with time zone,
  	"_uuid" varchar
  );
  
  CREATE TABLE "web"."_city_projects_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_review_state" "web"."enum__city_projects_v_version_review_state" DEFAULT 'none',
  	"version_review_source" "web"."enum__city_projects_v_version_review_source",
  	"version_review_note" varchar,
  	"version_review_check" jsonb,
  	"version_review_submitted_at" timestamp(3) with time zone,
  	"version_review_reviewed_at" timestamp(3) with time zone,
  	"version_review_reviewed_by_id" integer,
  	"version_title" varchar,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_area" varchar,
  	"version_status" "web"."enum__city_projects_v_version_status",
  	"version_latest_update_at" timestamp(3) with time zone,
  	"version_summary" varchar,
  	"version_cover_id" integer,
  	"version_body" jsonb,
  	"version_ops_desk_id" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_focus_keyword" varchar,
  	"version_seo_image_id" integer,
  	"version_seo_canonical" varchar,
  	"version_seo_noindex" boolean DEFAULT false,
  	"version_wp_id" numeric,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "web"."enum__city_projects_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "web"."media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"caption" varchar,
  	"credit" varchar,
  	"wp_attachment_id" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar
  );
  
  CREATE TABLE "web"."form_submissions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"form_key" varchar NOT NULL,
  	"email" varchar,
  	"payload" jsonb NOT NULL,
  	"ip_hash" varchar,
  	"turnstile_ok" boolean,
  	"handled_at" timestamp(3) with time zone,
  	"handled_by_id" integer,
  	"note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "web"."redirects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"from_path" varchar NOT NULL,
  	"to_path" varchar,
  	"status_code" "web"."enum_redirects_status_code" DEFAULT '301' NOT NULL,
  	"hits" numeric DEFAULT 0,
  	"source" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "web"."users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "web"."users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" "web"."enum_users_role" DEFAULT 'editor' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"enable_a_p_i_key" boolean,
  	"api_key" varchar,
  	"api_key_index" varchar,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "web"."payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "web"."payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "web"."enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "web"."enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "web"."payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "web"."enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "web"."payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "web"."payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"posts_id" integer,
  	"categories_id" integer,
  	"pages_id" integer,
  	"page_edits_id" integer,
  	"desk_pages_id" integer,
  	"desk_jobs_id" integer,
  	"desk_runs_id" integer,
  	"ai_prompts_id" integer,
  	"ai_connections_id" integer,
  	"oauth_clients_id" integer,
  	"oauth_tokens_id" integer,
  	"events_id" integer,
  	"venues_id" integer,
  	"organizers_id" integer,
  	"event_categories_id" integer,
  	"places_id" integer,
  	"parks_id" integer,
  	"neighborhoods_id" integer,
  	"testimonials_id" integer,
  	"timeline_entries_id" integer,
  	"gallery_photos_id" integer,
  	"city_projects_id" integer,
  	"media_id" integer,
  	"form_submissions_id" integer,
  	"redirects_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "web"."payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "web"."payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "web"."payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "web"."settings_social" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" "web"."enum_settings_social_platform" NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "web"."settings_footer_columns_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "web"."settings_footer_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL
  );
  
  CREATE TABLE "web"."settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_title" varchar DEFAULT 'San Carlos Life' NOT NULL,
  	"tagline" varchar DEFAULT 'Your guide to life in San Carlos, California',
  	"phone" varchar,
  	"email" varchar,
  	"address" varchar,
  	"default_og_image_id" integer,
  	"sidebar_cta_heading" varchar DEFAULT 'Thinking of buying or selling in San Carlos?',
  	"sidebar_cta_text" varchar,
  	"sidebar_cta_photo_id" integer,
  	"sidebar_cta_phone" varchar,
  	"sidebar_cta_email" varchar,
  	"sidebar_cta_valuation_label" varchar DEFAULT 'What''s my home worth?',
  	"sidebar_cta_valuation_url" varchar DEFAULT '/sell-my-house',
  	"footer_note" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "web"."posts" ADD CONSTRAINT "posts_review_reviewed_by_id_users_id_fk" FOREIGN KEY ("review_reviewed_by_id") REFERENCES "web"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."posts" ADD CONSTRAINT "posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "web"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."posts" ADD CONSTRAINT "posts_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."posts" ADD CONSTRAINT "posts_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."posts_texts" ADD CONSTRAINT "posts_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "web"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."posts_rels" ADD CONSTRAINT "posts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "web"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."posts_rels" ADD CONSTRAINT "posts_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "web"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_posts_v" ADD CONSTRAINT "_posts_v_parent_id_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "web"."posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_posts_v" ADD CONSTRAINT "_posts_v_version_review_reviewed_by_id_users_id_fk" FOREIGN KEY ("version_review_reviewed_by_id") REFERENCES "web"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_posts_v" ADD CONSTRAINT "_posts_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "web"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_posts_v" ADD CONSTRAINT "_posts_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_posts_v" ADD CONSTRAINT "_posts_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_posts_v_texts" ADD CONSTRAINT "_posts_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "web"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "web"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "web"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."pages" ADD CONSTRAINT "pages_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."page_edits" ADD CONSTRAINT "page_edits_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "web"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_page_edits_v" ADD CONSTRAINT "_page_edits_v_parent_id_page_edits_id_fk" FOREIGN KEY ("parent_id") REFERENCES "web"."page_edits"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_page_edits_v" ADD CONSTRAINT "_page_edits_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "web"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."desk_pages_sections" ADD CONSTRAINT "desk_pages_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."desk_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."desk_pages_faq" ADD CONSTRAINT "desk_pages_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."desk_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."desk_pages_sources" ADD CONSTRAINT "desk_pages_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."desk_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."desk_pages" ADD CONSTRAINT "desk_pages_review_reviewed_by_id_users_id_fk" FOREIGN KEY ("review_reviewed_by_id") REFERENCES "web"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."desk_pages" ADD CONSTRAINT "desk_pages_hero_id_media_id_fk" FOREIGN KEY ("hero_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."desk_pages" ADD CONSTRAINT "desk_pages_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_desk_pages_v_version_sections" ADD CONSTRAINT "_desk_pages_v_version_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."_desk_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_desk_pages_v_version_faq" ADD CONSTRAINT "_desk_pages_v_version_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."_desk_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_desk_pages_v_version_sources" ADD CONSTRAINT "_desk_pages_v_version_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."_desk_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_desk_pages_v" ADD CONSTRAINT "_desk_pages_v_parent_id_desk_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "web"."desk_pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_desk_pages_v" ADD CONSTRAINT "_desk_pages_v_version_review_reviewed_by_id_users_id_fk" FOREIGN KEY ("version_review_reviewed_by_id") REFERENCES "web"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_desk_pages_v" ADD CONSTRAINT "_desk_pages_v_version_hero_id_media_id_fk" FOREIGN KEY ("version_hero_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_desk_pages_v" ADD CONSTRAINT "_desk_pages_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."desk_jobs_sources" ADD CONSTRAINT "desk_jobs_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."desk_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."desk_jobs" ADD CONSTRAINT "desk_jobs_prompt_id_ai_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "web"."ai_prompts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."desk_jobs" ADD CONSTRAINT "desk_jobs_connection_id_ai_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "web"."ai_connections"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_ai_prompts_v" ADD CONSTRAINT "_ai_prompts_v_parent_id_ai_prompts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "web"."ai_prompts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."oauth_tokens" ADD CONSTRAINT "oauth_tokens_client_id_oauth_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "web"."oauth_clients"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."oauth_tokens" ADD CONSTRAINT "oauth_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "web"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."events_exdates" ADD CONSTRAINT "events_exdates_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."events" ADD CONSTRAINT "events_review_reviewed_by_id_users_id_fk" FOREIGN KEY ("review_reviewed_by_id") REFERENCES "web"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."events" ADD CONSTRAINT "events_series_id_events_id_fk" FOREIGN KEY ("series_id") REFERENCES "web"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."events" ADD CONSTRAINT "events_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "web"."venues"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."events" ADD CONSTRAINT "events_organizer_id_organizers_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "web"."organizers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."events" ADD CONSTRAINT "events_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."events" ADD CONSTRAINT "events_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."events_rels" ADD CONSTRAINT "events_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "web"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."events_rels" ADD CONSTRAINT "events_rels_event_categories_fk" FOREIGN KEY ("event_categories_id") REFERENCES "web"."event_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_events_v_version_exdates" ADD CONSTRAINT "_events_v_version_exdates_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_events_v" ADD CONSTRAINT "_events_v_parent_id_events_id_fk" FOREIGN KEY ("parent_id") REFERENCES "web"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_events_v" ADD CONSTRAINT "_events_v_version_review_reviewed_by_id_users_id_fk" FOREIGN KEY ("version_review_reviewed_by_id") REFERENCES "web"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_events_v" ADD CONSTRAINT "_events_v_version_series_id_events_id_fk" FOREIGN KEY ("version_series_id") REFERENCES "web"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_events_v" ADD CONSTRAINT "_events_v_version_venue_id_venues_id_fk" FOREIGN KEY ("version_venue_id") REFERENCES "web"."venues"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_events_v" ADD CONSTRAINT "_events_v_version_organizer_id_organizers_id_fk" FOREIGN KEY ("version_organizer_id") REFERENCES "web"."organizers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_events_v" ADD CONSTRAINT "_events_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_events_v" ADD CONSTRAINT "_events_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_events_v_rels" ADD CONSTRAINT "_events_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "web"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_events_v_rels" ADD CONSTRAINT "_events_v_rels_event_categories_fk" FOREIGN KEY ("event_categories_id") REFERENCES "web"."event_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."places_links" ADD CONSTRAINT "places_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."places"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."places" ADD CONSTRAINT "places_review_reviewed_by_id_users_id_fk" FOREIGN KEY ("review_reviewed_by_id") REFERENCES "web"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."places" ADD CONSTRAINT "places_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."places" ADD CONSTRAINT "places_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."places" ADD CONSTRAINT "places_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."places_texts" ADD CONSTRAINT "places_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "web"."places"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."places_rels" ADD CONSTRAINT "places_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "web"."places"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."places_rels" ADD CONSTRAINT "places_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "web"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_places_v_version_links" ADD CONSTRAINT "_places_v_version_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."_places_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_places_v" ADD CONSTRAINT "_places_v_parent_id_places_id_fk" FOREIGN KEY ("parent_id") REFERENCES "web"."places"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_places_v" ADD CONSTRAINT "_places_v_version_review_reviewed_by_id_users_id_fk" FOREIGN KEY ("version_review_reviewed_by_id") REFERENCES "web"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_places_v" ADD CONSTRAINT "_places_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_places_v" ADD CONSTRAINT "_places_v_version_logo_id_media_id_fk" FOREIGN KEY ("version_logo_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_places_v" ADD CONSTRAINT "_places_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_places_v_texts" ADD CONSTRAINT "_places_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "web"."_places_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_places_v_rels" ADD CONSTRAINT "_places_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "web"."_places_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_places_v_rels" ADD CONSTRAINT "_places_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "web"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."parks" ADD CONSTRAINT "parks_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."parks" ADD CONSTRAINT "parks_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."parks_texts" ADD CONSTRAINT "parks_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "web"."parks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_parks_v" ADD CONSTRAINT "_parks_v_parent_id_parks_id_fk" FOREIGN KEY ("parent_id") REFERENCES "web"."parks"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_parks_v" ADD CONSTRAINT "_parks_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_parks_v" ADD CONSTRAINT "_parks_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_parks_v_texts" ADD CONSTRAINT "_parks_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "web"."_parks_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."neighborhoods_highlights" ADD CONSTRAINT "neighborhoods_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."neighborhoods"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."neighborhoods_schools" ADD CONSTRAINT "neighborhoods_schools_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."neighborhoods"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."neighborhoods_faq" ADD CONSTRAINT "neighborhoods_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."neighborhoods"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."neighborhoods" ADD CONSTRAINT "neighborhoods_hero_id_media_id_fk" FOREIGN KEY ("hero_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."neighborhoods" ADD CONSTRAINT "neighborhoods_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_neighborhoods_v_version_highlights" ADD CONSTRAINT "_neighborhoods_v_version_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."_neighborhoods_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_neighborhoods_v_version_schools" ADD CONSTRAINT "_neighborhoods_v_version_schools_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."_neighborhoods_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_neighborhoods_v_version_faq" ADD CONSTRAINT "_neighborhoods_v_version_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."_neighborhoods_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_neighborhoods_v" ADD CONSTRAINT "_neighborhoods_v_parent_id_neighborhoods_id_fk" FOREIGN KEY ("parent_id") REFERENCES "web"."neighborhoods"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_neighborhoods_v" ADD CONSTRAINT "_neighborhoods_v_version_hero_id_media_id_fk" FOREIGN KEY ("version_hero_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_neighborhoods_v" ADD CONSTRAINT "_neighborhoods_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."timeline_entries" ADD CONSTRAINT "timeline_entries_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."gallery_photos" ADD CONSTRAINT "gallery_photos_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."city_projects_sources" ADD CONSTRAINT "city_projects_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."city_projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."city_projects" ADD CONSTRAINT "city_projects_review_reviewed_by_id_users_id_fk" FOREIGN KEY ("review_reviewed_by_id") REFERENCES "web"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."city_projects" ADD CONSTRAINT "city_projects_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."city_projects" ADD CONSTRAINT "city_projects_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_city_projects_v_version_sources" ADD CONSTRAINT "_city_projects_v_version_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."_city_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_city_projects_v" ADD CONSTRAINT "_city_projects_v_parent_id_city_projects_id_fk" FOREIGN KEY ("parent_id") REFERENCES "web"."city_projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_city_projects_v" ADD CONSTRAINT "_city_projects_v_version_review_reviewed_by_id_users_id_fk" FOREIGN KEY ("version_review_reviewed_by_id") REFERENCES "web"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_city_projects_v" ADD CONSTRAINT "_city_projects_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_city_projects_v" ADD CONSTRAINT "_city_projects_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."form_submissions" ADD CONSTRAINT "form_submissions_handled_by_id_users_id_fk" FOREIGN KEY ("handled_by_id") REFERENCES "web"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "web"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "web"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "web"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "web"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_page_edits_fk" FOREIGN KEY ("page_edits_id") REFERENCES "web"."page_edits"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_desk_pages_fk" FOREIGN KEY ("desk_pages_id") REFERENCES "web"."desk_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_desk_jobs_fk" FOREIGN KEY ("desk_jobs_id") REFERENCES "web"."desk_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_desk_runs_fk" FOREIGN KEY ("desk_runs_id") REFERENCES "web"."desk_runs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ai_prompts_fk" FOREIGN KEY ("ai_prompts_id") REFERENCES "web"."ai_prompts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ai_connections_fk" FOREIGN KEY ("ai_connections_id") REFERENCES "web"."ai_connections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_oauth_clients_fk" FOREIGN KEY ("oauth_clients_id") REFERENCES "web"."oauth_clients"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_oauth_tokens_fk" FOREIGN KEY ("oauth_tokens_id") REFERENCES "web"."oauth_tokens"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "web"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_venues_fk" FOREIGN KEY ("venues_id") REFERENCES "web"."venues"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_organizers_fk" FOREIGN KEY ("organizers_id") REFERENCES "web"."organizers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_event_categories_fk" FOREIGN KEY ("event_categories_id") REFERENCES "web"."event_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_places_fk" FOREIGN KEY ("places_id") REFERENCES "web"."places"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parks_fk" FOREIGN KEY ("parks_id") REFERENCES "web"."parks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_neighborhoods_fk" FOREIGN KEY ("neighborhoods_id") REFERENCES "web"."neighborhoods"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "web"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_timeline_entries_fk" FOREIGN KEY ("timeline_entries_id") REFERENCES "web"."timeline_entries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_gallery_photos_fk" FOREIGN KEY ("gallery_photos_id") REFERENCES "web"."gallery_photos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_city_projects_fk" FOREIGN KEY ("city_projects_id") REFERENCES "web"."city_projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "web"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_form_submissions_fk" FOREIGN KEY ("form_submissions_id") REFERENCES "web"."form_submissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_redirects_fk" FOREIGN KEY ("redirects_id") REFERENCES "web"."redirects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "web"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "web"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "web"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."settings_social" ADD CONSTRAINT "settings_social_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."settings_footer_columns_links" ADD CONSTRAINT "settings_footer_columns_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."settings_footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."settings_footer_columns" ADD CONSTRAINT "settings_footer_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."settings" ADD CONSTRAINT "settings_default_og_image_id_media_id_fk" FOREIGN KEY ("default_og_image_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."settings" ADD CONSTRAINT "settings_sidebar_cta_photo_id_media_id_fk" FOREIGN KEY ("sidebar_cta_photo_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "posts_review_review_state_idx" ON "web"."posts" USING btree ("review_state");
  CREATE INDEX "posts_review_review_reviewed_by_idx" ON "web"."posts" USING btree ("review_reviewed_by_id");
  CREATE UNIQUE INDEX "posts_slug_idx" ON "web"."posts" USING btree ("slug");
  CREATE INDEX "posts_published_at_idx" ON "web"."posts" USING btree ("published_at");
  CREATE INDEX "posts_author_idx" ON "web"."posts" USING btree ("author_id");
  CREATE INDEX "posts_cover_idx" ON "web"."posts" USING btree ("cover_id");
  CREATE INDEX "posts_seo_seo_image_idx" ON "web"."posts" USING btree ("seo_image_id");
  CREATE INDEX "posts_wp_id_idx" ON "web"."posts" USING btree ("wp_id");
  CREATE INDEX "posts_updated_at_idx" ON "web"."posts" USING btree ("updated_at");
  CREATE INDEX "posts_created_at_idx" ON "web"."posts" USING btree ("created_at");
  CREATE INDEX "posts__status_idx" ON "web"."posts" USING btree ("_status");
  CREATE INDEX "posts_texts_order_parent" ON "web"."posts_texts" USING btree ("order","parent_id");
  CREATE INDEX "posts_rels_order_idx" ON "web"."posts_rels" USING btree ("order");
  CREATE INDEX "posts_rels_parent_idx" ON "web"."posts_rels" USING btree ("parent_id");
  CREATE INDEX "posts_rels_path_idx" ON "web"."posts_rels" USING btree ("path");
  CREATE INDEX "posts_rels_categories_id_idx" ON "web"."posts_rels" USING btree ("categories_id");
  CREATE INDEX "_posts_v_parent_idx" ON "web"."_posts_v" USING btree ("parent_id");
  CREATE INDEX "_posts_v_version_review_version_review_state_idx" ON "web"."_posts_v" USING btree ("version_review_state");
  CREATE INDEX "_posts_v_version_review_version_review_reviewed_by_idx" ON "web"."_posts_v" USING btree ("version_review_reviewed_by_id");
  CREATE INDEX "_posts_v_version_version_slug_idx" ON "web"."_posts_v" USING btree ("version_slug");
  CREATE INDEX "_posts_v_version_version_published_at_idx" ON "web"."_posts_v" USING btree ("version_published_at");
  CREATE INDEX "_posts_v_version_version_author_idx" ON "web"."_posts_v" USING btree ("version_author_id");
  CREATE INDEX "_posts_v_version_version_cover_idx" ON "web"."_posts_v" USING btree ("version_cover_id");
  CREATE INDEX "_posts_v_version_seo_version_seo_image_idx" ON "web"."_posts_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_posts_v_version_version_wp_id_idx" ON "web"."_posts_v" USING btree ("version_wp_id");
  CREATE INDEX "_posts_v_version_version_updated_at_idx" ON "web"."_posts_v" USING btree ("version_updated_at");
  CREATE INDEX "_posts_v_version_version_created_at_idx" ON "web"."_posts_v" USING btree ("version_created_at");
  CREATE INDEX "_posts_v_version_version__status_idx" ON "web"."_posts_v" USING btree ("version__status");
  CREATE INDEX "_posts_v_created_at_idx" ON "web"."_posts_v" USING btree ("created_at");
  CREATE INDEX "_posts_v_updated_at_idx" ON "web"."_posts_v" USING btree ("updated_at");
  CREATE INDEX "_posts_v_latest_idx" ON "web"."_posts_v" USING btree ("latest");
  CREATE INDEX "_posts_v_texts_order_parent" ON "web"."_posts_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "_posts_v_rels_order_idx" ON "web"."_posts_v_rels" USING btree ("order");
  CREATE INDEX "_posts_v_rels_parent_idx" ON "web"."_posts_v_rels" USING btree ("parent_id");
  CREATE INDEX "_posts_v_rels_path_idx" ON "web"."_posts_v_rels" USING btree ("path");
  CREATE INDEX "_posts_v_rels_categories_id_idx" ON "web"."_posts_v_rels" USING btree ("categories_id");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "web"."categories" USING btree ("slug");
  CREATE INDEX "categories_wp_id_idx" ON "web"."categories" USING btree ("wp_id");
  CREATE INDEX "categories_updated_at_idx" ON "web"."categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "web"."categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "web"."pages" USING btree ("slug");
  CREATE INDEX "pages_seo_seo_image_idx" ON "web"."pages" USING btree ("seo_image_id");
  CREATE INDEX "pages_wp_id_idx" ON "web"."pages" USING btree ("wp_id");
  CREATE INDEX "pages_updated_at_idx" ON "web"."pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "web"."pages" USING btree ("created_at");
  CREATE UNIQUE INDEX "page_edits_page_idx" ON "web"."page_edits" USING btree ("page");
  CREATE INDEX "page_edits_updated_by_idx" ON "web"."page_edits" USING btree ("updated_by_id");
  CREATE INDEX "page_edits_updated_at_idx" ON "web"."page_edits" USING btree ("updated_at");
  CREATE INDEX "page_edits_created_at_idx" ON "web"."page_edits" USING btree ("created_at");
  CREATE INDEX "_page_edits_v_parent_idx" ON "web"."_page_edits_v" USING btree ("parent_id");
  CREATE INDEX "_page_edits_v_version_version_page_idx" ON "web"."_page_edits_v" USING btree ("version_page");
  CREATE INDEX "_page_edits_v_version_version_updated_by_idx" ON "web"."_page_edits_v" USING btree ("version_updated_by_id");
  CREATE INDEX "_page_edits_v_version_version_updated_at_idx" ON "web"."_page_edits_v" USING btree ("version_updated_at");
  CREATE INDEX "_page_edits_v_version_version_created_at_idx" ON "web"."_page_edits_v" USING btree ("version_created_at");
  CREATE INDEX "_page_edits_v_created_at_idx" ON "web"."_page_edits_v" USING btree ("created_at");
  CREATE INDEX "_page_edits_v_updated_at_idx" ON "web"."_page_edits_v" USING btree ("updated_at");
  CREATE INDEX "desk_pages_sections_order_idx" ON "web"."desk_pages_sections" USING btree ("_order");
  CREATE INDEX "desk_pages_sections_parent_id_idx" ON "web"."desk_pages_sections" USING btree ("_parent_id");
  CREATE INDEX "desk_pages_faq_order_idx" ON "web"."desk_pages_faq" USING btree ("_order");
  CREATE INDEX "desk_pages_faq_parent_id_idx" ON "web"."desk_pages_faq" USING btree ("_parent_id");
  CREATE INDEX "desk_pages_sources_order_idx" ON "web"."desk_pages_sources" USING btree ("_order");
  CREATE INDEX "desk_pages_sources_parent_id_idx" ON "web"."desk_pages_sources" USING btree ("_parent_id");
  CREATE INDEX "desk_pages_review_review_state_idx" ON "web"."desk_pages" USING btree ("review_state");
  CREATE INDEX "desk_pages_review_review_reviewed_by_idx" ON "web"."desk_pages" USING btree ("review_reviewed_by_id");
  CREATE UNIQUE INDEX "desk_pages_slug_idx" ON "web"."desk_pages" USING btree ("slug");
  CREATE INDEX "desk_pages_hero_idx" ON "web"."desk_pages" USING btree ("hero_id");
  CREATE INDEX "desk_pages_seo_seo_image_idx" ON "web"."desk_pages" USING btree ("seo_image_id");
  CREATE INDEX "desk_pages_updated_at_idx" ON "web"."desk_pages" USING btree ("updated_at");
  CREATE INDEX "desk_pages_created_at_idx" ON "web"."desk_pages" USING btree ("created_at");
  CREATE INDEX "desk_pages__status_idx" ON "web"."desk_pages" USING btree ("_status");
  CREATE INDEX "_desk_pages_v_version_sections_order_idx" ON "web"."_desk_pages_v_version_sections" USING btree ("_order");
  CREATE INDEX "_desk_pages_v_version_sections_parent_id_idx" ON "web"."_desk_pages_v_version_sections" USING btree ("_parent_id");
  CREATE INDEX "_desk_pages_v_version_faq_order_idx" ON "web"."_desk_pages_v_version_faq" USING btree ("_order");
  CREATE INDEX "_desk_pages_v_version_faq_parent_id_idx" ON "web"."_desk_pages_v_version_faq" USING btree ("_parent_id");
  CREATE INDEX "_desk_pages_v_version_sources_order_idx" ON "web"."_desk_pages_v_version_sources" USING btree ("_order");
  CREATE INDEX "_desk_pages_v_version_sources_parent_id_idx" ON "web"."_desk_pages_v_version_sources" USING btree ("_parent_id");
  CREATE INDEX "_desk_pages_v_parent_idx" ON "web"."_desk_pages_v" USING btree ("parent_id");
  CREATE INDEX "_desk_pages_v_version_review_version_review_state_idx" ON "web"."_desk_pages_v" USING btree ("version_review_state");
  CREATE INDEX "_desk_pages_v_version_review_version_review_reviewed_by_idx" ON "web"."_desk_pages_v" USING btree ("version_review_reviewed_by_id");
  CREATE INDEX "_desk_pages_v_version_version_slug_idx" ON "web"."_desk_pages_v" USING btree ("version_slug");
  CREATE INDEX "_desk_pages_v_version_version_hero_idx" ON "web"."_desk_pages_v" USING btree ("version_hero_id");
  CREATE INDEX "_desk_pages_v_version_seo_version_seo_image_idx" ON "web"."_desk_pages_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_desk_pages_v_version_version_updated_at_idx" ON "web"."_desk_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_desk_pages_v_version_version_created_at_idx" ON "web"."_desk_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_desk_pages_v_version_version__status_idx" ON "web"."_desk_pages_v" USING btree ("version__status");
  CREATE INDEX "_desk_pages_v_created_at_idx" ON "web"."_desk_pages_v" USING btree ("created_at");
  CREATE INDEX "_desk_pages_v_updated_at_idx" ON "web"."_desk_pages_v" USING btree ("updated_at");
  CREATE INDEX "_desk_pages_v_latest_idx" ON "web"."_desk_pages_v" USING btree ("latest");
  CREATE INDEX "desk_jobs_sources_order_idx" ON "web"."desk_jobs_sources" USING btree ("_order");
  CREATE INDEX "desk_jobs_sources_parent_id_idx" ON "web"."desk_jobs_sources" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "desk_jobs_name_idx" ON "web"."desk_jobs" USING btree ("name");
  CREATE INDEX "desk_jobs_prompt_idx" ON "web"."desk_jobs" USING btree ("prompt_id");
  CREATE INDEX "desk_jobs_connection_idx" ON "web"."desk_jobs" USING btree ("connection_id");
  CREATE INDEX "desk_jobs_updated_at_idx" ON "web"."desk_jobs" USING btree ("updated_at");
  CREATE INDEX "desk_jobs_created_at_idx" ON "web"."desk_jobs" USING btree ("created_at");
  CREATE INDEX "desk_runs_job_idx" ON "web"."desk_runs" USING btree ("job");
  CREATE INDEX "desk_runs_started_at_idx" ON "web"."desk_runs" USING btree ("started_at");
  CREATE INDEX "desk_runs_updated_at_idx" ON "web"."desk_runs" USING btree ("updated_at");
  CREATE INDEX "desk_runs_created_at_idx" ON "web"."desk_runs" USING btree ("created_at");
  CREATE INDEX "ai_prompts_updated_at_idx" ON "web"."ai_prompts" USING btree ("updated_at");
  CREATE INDEX "ai_prompts_created_at_idx" ON "web"."ai_prompts" USING btree ("created_at");
  CREATE INDEX "_ai_prompts_v_parent_idx" ON "web"."_ai_prompts_v" USING btree ("parent_id");
  CREATE INDEX "_ai_prompts_v_version_version_updated_at_idx" ON "web"."_ai_prompts_v" USING btree ("version_updated_at");
  CREATE INDEX "_ai_prompts_v_version_version_created_at_idx" ON "web"."_ai_prompts_v" USING btree ("version_created_at");
  CREATE INDEX "_ai_prompts_v_created_at_idx" ON "web"."_ai_prompts_v" USING btree ("created_at");
  CREATE INDEX "_ai_prompts_v_updated_at_idx" ON "web"."_ai_prompts_v" USING btree ("updated_at");
  CREATE INDEX "ai_connections_updated_at_idx" ON "web"."ai_connections" USING btree ("updated_at");
  CREATE INDEX "ai_connections_created_at_idx" ON "web"."ai_connections" USING btree ("created_at");
  CREATE UNIQUE INDEX "oauth_clients_client_id_idx" ON "web"."oauth_clients" USING btree ("client_id");
  CREATE INDEX "oauth_clients_updated_at_idx" ON "web"."oauth_clients" USING btree ("updated_at");
  CREATE INDEX "oauth_clients_created_at_idx" ON "web"."oauth_clients" USING btree ("created_at");
  CREATE UNIQUE INDEX "oauth_tokens_hash_idx" ON "web"."oauth_tokens" USING btree ("hash");
  CREATE INDEX "oauth_tokens_client_idx" ON "web"."oauth_tokens" USING btree ("client_id");
  CREATE INDEX "oauth_tokens_user_idx" ON "web"."oauth_tokens" USING btree ("user_id");
  CREATE INDEX "oauth_tokens_family_idx" ON "web"."oauth_tokens" USING btree ("family");
  CREATE INDEX "oauth_tokens_expires_at_idx" ON "web"."oauth_tokens" USING btree ("expires_at");
  CREATE INDEX "oauth_tokens_updated_at_idx" ON "web"."oauth_tokens" USING btree ("updated_at");
  CREATE INDEX "oauth_tokens_created_at_idx" ON "web"."oauth_tokens" USING btree ("created_at");
  CREATE INDEX "events_exdates_order_idx" ON "web"."events_exdates" USING btree ("_order");
  CREATE INDEX "events_exdates_parent_id_idx" ON "web"."events_exdates" USING btree ("_parent_id");
  CREATE INDEX "events_review_review_state_idx" ON "web"."events" USING btree ("review_state");
  CREATE INDEX "events_review_review_reviewed_by_idx" ON "web"."events" USING btree ("review_reviewed_by_id");
  CREATE UNIQUE INDEX "events_slug_idx" ON "web"."events" USING btree ("slug");
  CREATE INDEX "events_status_idx" ON "web"."events" USING btree ("status");
  CREATE INDEX "events_starts_at_idx" ON "web"."events" USING btree ("starts_at");
  CREATE INDEX "events_series_idx" ON "web"."events" USING btree ("series_id");
  CREATE INDEX "events_venue_idx" ON "web"."events" USING btree ("venue_id");
  CREATE INDEX "events_organizer_idx" ON "web"."events" USING btree ("organizer_id");
  CREATE INDEX "events_cover_idx" ON "web"."events" USING btree ("cover_id");
  CREATE INDEX "events_seo_seo_image_idx" ON "web"."events" USING btree ("seo_image_id");
  CREATE INDEX "events_wp_id_idx" ON "web"."events" USING btree ("wp_id");
  CREATE INDEX "events_updated_at_idx" ON "web"."events" USING btree ("updated_at");
  CREATE INDEX "events_created_at_idx" ON "web"."events" USING btree ("created_at");
  CREATE INDEX "events_rels_order_idx" ON "web"."events_rels" USING btree ("order");
  CREATE INDEX "events_rels_parent_idx" ON "web"."events_rels" USING btree ("parent_id");
  CREATE INDEX "events_rels_path_idx" ON "web"."events_rels" USING btree ("path");
  CREATE INDEX "events_rels_event_categories_id_idx" ON "web"."events_rels" USING btree ("event_categories_id");
  CREATE INDEX "_events_v_version_exdates_order_idx" ON "web"."_events_v_version_exdates" USING btree ("_order");
  CREATE INDEX "_events_v_version_exdates_parent_id_idx" ON "web"."_events_v_version_exdates" USING btree ("_parent_id");
  CREATE INDEX "_events_v_parent_idx" ON "web"."_events_v" USING btree ("parent_id");
  CREATE INDEX "_events_v_version_review_version_review_state_idx" ON "web"."_events_v" USING btree ("version_review_state");
  CREATE INDEX "_events_v_version_review_version_review_reviewed_by_idx" ON "web"."_events_v" USING btree ("version_review_reviewed_by_id");
  CREATE INDEX "_events_v_version_version_slug_idx" ON "web"."_events_v" USING btree ("version_slug");
  CREATE INDEX "_events_v_version_version_status_idx" ON "web"."_events_v" USING btree ("version_status");
  CREATE INDEX "_events_v_version_version_starts_at_idx" ON "web"."_events_v" USING btree ("version_starts_at");
  CREATE INDEX "_events_v_version_version_series_idx" ON "web"."_events_v" USING btree ("version_series_id");
  CREATE INDEX "_events_v_version_version_venue_idx" ON "web"."_events_v" USING btree ("version_venue_id");
  CREATE INDEX "_events_v_version_version_organizer_idx" ON "web"."_events_v" USING btree ("version_organizer_id");
  CREATE INDEX "_events_v_version_version_cover_idx" ON "web"."_events_v" USING btree ("version_cover_id");
  CREATE INDEX "_events_v_version_seo_version_seo_image_idx" ON "web"."_events_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_events_v_version_version_wp_id_idx" ON "web"."_events_v" USING btree ("version_wp_id");
  CREATE INDEX "_events_v_version_version_updated_at_idx" ON "web"."_events_v" USING btree ("version_updated_at");
  CREATE INDEX "_events_v_version_version_created_at_idx" ON "web"."_events_v" USING btree ("version_created_at");
  CREATE INDEX "_events_v_created_at_idx" ON "web"."_events_v" USING btree ("created_at");
  CREATE INDEX "_events_v_updated_at_idx" ON "web"."_events_v" USING btree ("updated_at");
  CREATE INDEX "_events_v_rels_order_idx" ON "web"."_events_v_rels" USING btree ("order");
  CREATE INDEX "_events_v_rels_parent_idx" ON "web"."_events_v_rels" USING btree ("parent_id");
  CREATE INDEX "_events_v_rels_path_idx" ON "web"."_events_v_rels" USING btree ("path");
  CREATE INDEX "_events_v_rels_event_categories_id_idx" ON "web"."_events_v_rels" USING btree ("event_categories_id");
  CREATE UNIQUE INDEX "venues_slug_idx" ON "web"."venues" USING btree ("slug");
  CREATE INDEX "venues_wp_id_idx" ON "web"."venues" USING btree ("wp_id");
  CREATE INDEX "venues_updated_at_idx" ON "web"."venues" USING btree ("updated_at");
  CREATE INDEX "venues_created_at_idx" ON "web"."venues" USING btree ("created_at");
  CREATE UNIQUE INDEX "organizers_slug_idx" ON "web"."organizers" USING btree ("slug");
  CREATE INDEX "organizers_wp_id_idx" ON "web"."organizers" USING btree ("wp_id");
  CREATE INDEX "organizers_updated_at_idx" ON "web"."organizers" USING btree ("updated_at");
  CREATE INDEX "organizers_created_at_idx" ON "web"."organizers" USING btree ("created_at");
  CREATE UNIQUE INDEX "event_categories_slug_idx" ON "web"."event_categories" USING btree ("slug");
  CREATE INDEX "event_categories_wp_id_idx" ON "web"."event_categories" USING btree ("wp_id");
  CREATE INDEX "event_categories_updated_at_idx" ON "web"."event_categories" USING btree ("updated_at");
  CREATE INDEX "event_categories_created_at_idx" ON "web"."event_categories" USING btree ("created_at");
  CREATE INDEX "places_links_order_idx" ON "web"."places_links" USING btree ("_order");
  CREATE INDEX "places_links_parent_id_idx" ON "web"."places_links" USING btree ("_parent_id");
  CREATE INDEX "places_review_review_state_idx" ON "web"."places" USING btree ("review_state");
  CREATE INDEX "places_review_review_reviewed_by_idx" ON "web"."places" USING btree ("review_reviewed_by_id");
  CREATE UNIQUE INDEX "places_slug_idx" ON "web"."places" USING btree ("slug");
  CREATE INDEX "places_type_idx" ON "web"."places" USING btree ("type");
  CREATE INDEX "places_featured_idx" ON "web"."places" USING btree ("featured");
  CREATE INDEX "places_cover_idx" ON "web"."places" USING btree ("cover_id");
  CREATE INDEX "places_logo_idx" ON "web"."places" USING btree ("logo_id");
  CREATE INDEX "places_seo_seo_image_idx" ON "web"."places" USING btree ("seo_image_id");
  CREATE INDEX "places_wp_id_idx" ON "web"."places" USING btree ("wp_id");
  CREATE INDEX "places_updated_at_idx" ON "web"."places" USING btree ("updated_at");
  CREATE INDEX "places_created_at_idx" ON "web"."places" USING btree ("created_at");
  CREATE INDEX "places__status_idx" ON "web"."places" USING btree ("_status");
  CREATE INDEX "places_texts_order_parent" ON "web"."places_texts" USING btree ("order","parent_id");
  CREATE INDEX "places_rels_order_idx" ON "web"."places_rels" USING btree ("order");
  CREATE INDEX "places_rels_parent_idx" ON "web"."places_rels" USING btree ("parent_id");
  CREATE INDEX "places_rels_path_idx" ON "web"."places_rels" USING btree ("path");
  CREATE INDEX "places_rels_media_id_idx" ON "web"."places_rels" USING btree ("media_id");
  CREATE INDEX "_places_v_version_links_order_idx" ON "web"."_places_v_version_links" USING btree ("_order");
  CREATE INDEX "_places_v_version_links_parent_id_idx" ON "web"."_places_v_version_links" USING btree ("_parent_id");
  CREATE INDEX "_places_v_parent_idx" ON "web"."_places_v" USING btree ("parent_id");
  CREATE INDEX "_places_v_version_review_version_review_state_idx" ON "web"."_places_v" USING btree ("version_review_state");
  CREATE INDEX "_places_v_version_review_version_review_reviewed_by_idx" ON "web"."_places_v" USING btree ("version_review_reviewed_by_id");
  CREATE INDEX "_places_v_version_version_slug_idx" ON "web"."_places_v" USING btree ("version_slug");
  CREATE INDEX "_places_v_version_version_type_idx" ON "web"."_places_v" USING btree ("version_type");
  CREATE INDEX "_places_v_version_version_featured_idx" ON "web"."_places_v" USING btree ("version_featured");
  CREATE INDEX "_places_v_version_version_cover_idx" ON "web"."_places_v" USING btree ("version_cover_id");
  CREATE INDEX "_places_v_version_version_logo_idx" ON "web"."_places_v" USING btree ("version_logo_id");
  CREATE INDEX "_places_v_version_seo_version_seo_image_idx" ON "web"."_places_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_places_v_version_version_wp_id_idx" ON "web"."_places_v" USING btree ("version_wp_id");
  CREATE INDEX "_places_v_version_version_updated_at_idx" ON "web"."_places_v" USING btree ("version_updated_at");
  CREATE INDEX "_places_v_version_version_created_at_idx" ON "web"."_places_v" USING btree ("version_created_at");
  CREATE INDEX "_places_v_version_version__status_idx" ON "web"."_places_v" USING btree ("version__status");
  CREATE INDEX "_places_v_created_at_idx" ON "web"."_places_v" USING btree ("created_at");
  CREATE INDEX "_places_v_updated_at_idx" ON "web"."_places_v" USING btree ("updated_at");
  CREATE INDEX "_places_v_latest_idx" ON "web"."_places_v" USING btree ("latest");
  CREATE INDEX "_places_v_texts_order_parent" ON "web"."_places_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "_places_v_rels_order_idx" ON "web"."_places_v_rels" USING btree ("order");
  CREATE INDEX "_places_v_rels_parent_idx" ON "web"."_places_v_rels" USING btree ("parent_id");
  CREATE INDEX "_places_v_rels_path_idx" ON "web"."_places_v_rels" USING btree ("path");
  CREATE INDEX "_places_v_rels_media_id_idx" ON "web"."_places_v_rels" USING btree ("media_id");
  CREATE UNIQUE INDEX "parks_slug_idx" ON "web"."parks" USING btree ("slug");
  CREATE INDEX "parks_cover_idx" ON "web"."parks" USING btree ("cover_id");
  CREATE INDEX "parks_seo_seo_image_idx" ON "web"."parks" USING btree ("seo_image_id");
  CREATE INDEX "parks_updated_at_idx" ON "web"."parks" USING btree ("updated_at");
  CREATE INDEX "parks_created_at_idx" ON "web"."parks" USING btree ("created_at");
  CREATE INDEX "parks__status_idx" ON "web"."parks" USING btree ("_status");
  CREATE INDEX "parks_texts_order_parent" ON "web"."parks_texts" USING btree ("order","parent_id");
  CREATE INDEX "_parks_v_parent_idx" ON "web"."_parks_v" USING btree ("parent_id");
  CREATE INDEX "_parks_v_version_version_slug_idx" ON "web"."_parks_v" USING btree ("version_slug");
  CREATE INDEX "_parks_v_version_version_cover_idx" ON "web"."_parks_v" USING btree ("version_cover_id");
  CREATE INDEX "_parks_v_version_seo_version_seo_image_idx" ON "web"."_parks_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_parks_v_version_version_updated_at_idx" ON "web"."_parks_v" USING btree ("version_updated_at");
  CREATE INDEX "_parks_v_version_version_created_at_idx" ON "web"."_parks_v" USING btree ("version_created_at");
  CREATE INDEX "_parks_v_version_version__status_idx" ON "web"."_parks_v" USING btree ("version__status");
  CREATE INDEX "_parks_v_created_at_idx" ON "web"."_parks_v" USING btree ("created_at");
  CREATE INDEX "_parks_v_updated_at_idx" ON "web"."_parks_v" USING btree ("updated_at");
  CREATE INDEX "_parks_v_latest_idx" ON "web"."_parks_v" USING btree ("latest");
  CREATE INDEX "_parks_v_texts_order_parent" ON "web"."_parks_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "neighborhoods_highlights_order_idx" ON "web"."neighborhoods_highlights" USING btree ("_order");
  CREATE INDEX "neighborhoods_highlights_parent_id_idx" ON "web"."neighborhoods_highlights" USING btree ("_parent_id");
  CREATE INDEX "neighborhoods_schools_order_idx" ON "web"."neighborhoods_schools" USING btree ("_order");
  CREATE INDEX "neighborhoods_schools_parent_id_idx" ON "web"."neighborhoods_schools" USING btree ("_parent_id");
  CREATE INDEX "neighborhoods_faq_order_idx" ON "web"."neighborhoods_faq" USING btree ("_order");
  CREATE INDEX "neighborhoods_faq_parent_id_idx" ON "web"."neighborhoods_faq" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "neighborhoods_slug_idx" ON "web"."neighborhoods" USING btree ("slug");
  CREATE INDEX "neighborhoods_hero_idx" ON "web"."neighborhoods" USING btree ("hero_id");
  CREATE INDEX "neighborhoods_seo_seo_image_idx" ON "web"."neighborhoods" USING btree ("seo_image_id");
  CREATE INDEX "neighborhoods_wp_id_idx" ON "web"."neighborhoods" USING btree ("wp_id");
  CREATE INDEX "neighborhoods_updated_at_idx" ON "web"."neighborhoods" USING btree ("updated_at");
  CREATE INDEX "neighborhoods_created_at_idx" ON "web"."neighborhoods" USING btree ("created_at");
  CREATE INDEX "neighborhoods__status_idx" ON "web"."neighborhoods" USING btree ("_status");
  CREATE INDEX "_neighborhoods_v_version_highlights_order_idx" ON "web"."_neighborhoods_v_version_highlights" USING btree ("_order");
  CREATE INDEX "_neighborhoods_v_version_highlights_parent_id_idx" ON "web"."_neighborhoods_v_version_highlights" USING btree ("_parent_id");
  CREATE INDEX "_neighborhoods_v_version_schools_order_idx" ON "web"."_neighborhoods_v_version_schools" USING btree ("_order");
  CREATE INDEX "_neighborhoods_v_version_schools_parent_id_idx" ON "web"."_neighborhoods_v_version_schools" USING btree ("_parent_id");
  CREATE INDEX "_neighborhoods_v_version_faq_order_idx" ON "web"."_neighborhoods_v_version_faq" USING btree ("_order");
  CREATE INDEX "_neighborhoods_v_version_faq_parent_id_idx" ON "web"."_neighborhoods_v_version_faq" USING btree ("_parent_id");
  CREATE INDEX "_neighborhoods_v_parent_idx" ON "web"."_neighborhoods_v" USING btree ("parent_id");
  CREATE INDEX "_neighborhoods_v_version_version_slug_idx" ON "web"."_neighborhoods_v" USING btree ("version_slug");
  CREATE INDEX "_neighborhoods_v_version_version_hero_idx" ON "web"."_neighborhoods_v" USING btree ("version_hero_id");
  CREATE INDEX "_neighborhoods_v_version_seo_version_seo_image_idx" ON "web"."_neighborhoods_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_neighborhoods_v_version_version_wp_id_idx" ON "web"."_neighborhoods_v" USING btree ("version_wp_id");
  CREATE INDEX "_neighborhoods_v_version_version_updated_at_idx" ON "web"."_neighborhoods_v" USING btree ("version_updated_at");
  CREATE INDEX "_neighborhoods_v_version_version_created_at_idx" ON "web"."_neighborhoods_v" USING btree ("version_created_at");
  CREATE INDEX "_neighborhoods_v_version_version__status_idx" ON "web"."_neighborhoods_v" USING btree ("version__status");
  CREATE INDEX "_neighborhoods_v_created_at_idx" ON "web"."_neighborhoods_v" USING btree ("created_at");
  CREATE INDEX "_neighborhoods_v_updated_at_idx" ON "web"."_neighborhoods_v" USING btree ("updated_at");
  CREATE INDEX "_neighborhoods_v_latest_idx" ON "web"."_neighborhoods_v" USING btree ("latest");
  CREATE INDEX "testimonials_wp_id_idx" ON "web"."testimonials" USING btree ("wp_id");
  CREATE INDEX "testimonials_updated_at_idx" ON "web"."testimonials" USING btree ("updated_at");
  CREATE INDEX "testimonials_created_at_idx" ON "web"."testimonials" USING btree ("created_at");
  CREATE INDEX "timeline_entries_year_idx" ON "web"."timeline_entries" USING btree ("year");
  CREATE INDEX "timeline_entries_image_idx" ON "web"."timeline_entries" USING btree ("image_id");
  CREATE INDEX "timeline_entries_wp_id_idx" ON "web"."timeline_entries" USING btree ("wp_id");
  CREATE INDEX "timeline_entries_updated_at_idx" ON "web"."timeline_entries" USING btree ("updated_at");
  CREATE INDEX "timeline_entries_created_at_idx" ON "web"."timeline_entries" USING btree ("created_at");
  CREATE INDEX "gallery_photos_image_idx" ON "web"."gallery_photos" USING btree ("image_id");
  CREATE INDEX "gallery_photos_status_idx" ON "web"."gallery_photos" USING btree ("status");
  CREATE INDEX "gallery_photos_wp_id_idx" ON "web"."gallery_photos" USING btree ("wp_id");
  CREATE INDEX "gallery_photos_updated_at_idx" ON "web"."gallery_photos" USING btree ("updated_at");
  CREATE INDEX "gallery_photos_created_at_idx" ON "web"."gallery_photos" USING btree ("created_at");
  CREATE INDEX "city_projects_sources_order_idx" ON "web"."city_projects_sources" USING btree ("_order");
  CREATE INDEX "city_projects_sources_parent_id_idx" ON "web"."city_projects_sources" USING btree ("_parent_id");
  CREATE INDEX "city_projects_review_review_state_idx" ON "web"."city_projects" USING btree ("review_state");
  CREATE INDEX "city_projects_review_review_reviewed_by_idx" ON "web"."city_projects" USING btree ("review_reviewed_by_id");
  CREATE UNIQUE INDEX "city_projects_slug_idx" ON "web"."city_projects" USING btree ("slug");
  CREATE INDEX "city_projects_latest_update_at_idx" ON "web"."city_projects" USING btree ("latest_update_at");
  CREATE INDEX "city_projects_cover_idx" ON "web"."city_projects" USING btree ("cover_id");
  CREATE INDEX "city_projects_ops_desk_id_idx" ON "web"."city_projects" USING btree ("ops_desk_id");
  CREATE INDEX "city_projects_seo_seo_image_idx" ON "web"."city_projects" USING btree ("seo_image_id");
  CREATE INDEX "city_projects_wp_id_idx" ON "web"."city_projects" USING btree ("wp_id");
  CREATE INDEX "city_projects_updated_at_idx" ON "web"."city_projects" USING btree ("updated_at");
  CREATE INDEX "city_projects_created_at_idx" ON "web"."city_projects" USING btree ("created_at");
  CREATE INDEX "city_projects__status_idx" ON "web"."city_projects" USING btree ("_status");
  CREATE INDEX "_city_projects_v_version_sources_order_idx" ON "web"."_city_projects_v_version_sources" USING btree ("_order");
  CREATE INDEX "_city_projects_v_version_sources_parent_id_idx" ON "web"."_city_projects_v_version_sources" USING btree ("_parent_id");
  CREATE INDEX "_city_projects_v_parent_idx" ON "web"."_city_projects_v" USING btree ("parent_id");
  CREATE INDEX "_city_projects_v_version_review_version_review_state_idx" ON "web"."_city_projects_v" USING btree ("version_review_state");
  CREATE INDEX "_city_projects_v_version_review_version_review_reviewed__idx" ON "web"."_city_projects_v" USING btree ("version_review_reviewed_by_id");
  CREATE INDEX "_city_projects_v_version_version_slug_idx" ON "web"."_city_projects_v" USING btree ("version_slug");
  CREATE INDEX "_city_projects_v_version_version_latest_update_at_idx" ON "web"."_city_projects_v" USING btree ("version_latest_update_at");
  CREATE INDEX "_city_projects_v_version_version_cover_idx" ON "web"."_city_projects_v" USING btree ("version_cover_id");
  CREATE INDEX "_city_projects_v_version_version_ops_desk_id_idx" ON "web"."_city_projects_v" USING btree ("version_ops_desk_id");
  CREATE INDEX "_city_projects_v_version_seo_version_seo_image_idx" ON "web"."_city_projects_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_city_projects_v_version_version_wp_id_idx" ON "web"."_city_projects_v" USING btree ("version_wp_id");
  CREATE INDEX "_city_projects_v_version_version_updated_at_idx" ON "web"."_city_projects_v" USING btree ("version_updated_at");
  CREATE INDEX "_city_projects_v_version_version_created_at_idx" ON "web"."_city_projects_v" USING btree ("version_created_at");
  CREATE INDEX "_city_projects_v_version_version__status_idx" ON "web"."_city_projects_v" USING btree ("version__status");
  CREATE INDEX "_city_projects_v_created_at_idx" ON "web"."_city_projects_v" USING btree ("created_at");
  CREATE INDEX "_city_projects_v_updated_at_idx" ON "web"."_city_projects_v" USING btree ("updated_at");
  CREATE INDEX "_city_projects_v_latest_idx" ON "web"."_city_projects_v" USING btree ("latest");
  CREATE INDEX "media_wp_attachment_id_idx" ON "web"."media" USING btree ("wp_attachment_id");
  CREATE INDEX "media_updated_at_idx" ON "web"."media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "web"."media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "web"."media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "web"."media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "web"."media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "web"."media" USING btree ("sizes_hero_filename");
  CREATE INDEX "form_submissions_form_key_idx" ON "web"."form_submissions" USING btree ("form_key");
  CREATE INDEX "form_submissions_email_idx" ON "web"."form_submissions" USING btree ("email");
  CREATE INDEX "form_submissions_handled_by_idx" ON "web"."form_submissions" USING btree ("handled_by_id");
  CREATE INDEX "form_submissions_updated_at_idx" ON "web"."form_submissions" USING btree ("updated_at");
  CREATE INDEX "form_submissions_created_at_idx" ON "web"."form_submissions" USING btree ("created_at");
  CREATE UNIQUE INDEX "redirects_from_path_idx" ON "web"."redirects" USING btree ("from_path");
  CREATE INDEX "redirects_updated_at_idx" ON "web"."redirects" USING btree ("updated_at");
  CREATE INDEX "redirects_created_at_idx" ON "web"."redirects" USING btree ("created_at");
  CREATE INDEX "users_sessions_order_idx" ON "web"."users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "web"."users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "web"."users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "web"."users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "web"."users" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "web"."payload_kv" USING btree ("key");
  CREATE INDEX "payload_jobs_log_order_idx" ON "web"."payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "web"."payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "web"."payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "web"."payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "web"."payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "web"."payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "web"."payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "web"."payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "web"."payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "web"."payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "web"."payload_jobs" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "web"."payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "web"."payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "web"."payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "web"."payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "web"."payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "web"."payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_posts_id_idx" ON "web"."payload_locked_documents_rels" USING btree ("posts_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "web"."payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "web"."payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_page_edits_id_idx" ON "web"."payload_locked_documents_rels" USING btree ("page_edits_id");
  CREATE INDEX "payload_locked_documents_rels_desk_pages_id_idx" ON "web"."payload_locked_documents_rels" USING btree ("desk_pages_id");
  CREATE INDEX "payload_locked_documents_rels_desk_jobs_id_idx" ON "web"."payload_locked_documents_rels" USING btree ("desk_jobs_id");
  CREATE INDEX "payload_locked_documents_rels_desk_runs_id_idx" ON "web"."payload_locked_documents_rels" USING btree ("desk_runs_id");
  CREATE INDEX "payload_locked_documents_rels_ai_prompts_id_idx" ON "web"."payload_locked_documents_rels" USING btree ("ai_prompts_id");
  CREATE INDEX "payload_locked_documents_rels_ai_connections_id_idx" ON "web"."payload_locked_documents_rels" USING btree ("ai_connections_id");
  CREATE INDEX "payload_locked_documents_rels_oauth_clients_id_idx" ON "web"."payload_locked_documents_rels" USING btree ("oauth_clients_id");
  CREATE INDEX "payload_locked_documents_rels_oauth_tokens_id_idx" ON "web"."payload_locked_documents_rels" USING btree ("oauth_tokens_id");
  CREATE INDEX "payload_locked_documents_rels_events_id_idx" ON "web"."payload_locked_documents_rels" USING btree ("events_id");
  CREATE INDEX "payload_locked_documents_rels_venues_id_idx" ON "web"."payload_locked_documents_rels" USING btree ("venues_id");
  CREATE INDEX "payload_locked_documents_rels_organizers_id_idx" ON "web"."payload_locked_documents_rels" USING btree ("organizers_id");
  CREATE INDEX "payload_locked_documents_rels_event_categories_id_idx" ON "web"."payload_locked_documents_rels" USING btree ("event_categories_id");
  CREATE INDEX "payload_locked_documents_rels_places_id_idx" ON "web"."payload_locked_documents_rels" USING btree ("places_id");
  CREATE INDEX "payload_locked_documents_rels_parks_id_idx" ON "web"."payload_locked_documents_rels" USING btree ("parks_id");
  CREATE INDEX "payload_locked_documents_rels_neighborhoods_id_idx" ON "web"."payload_locked_documents_rels" USING btree ("neighborhoods_id");
  CREATE INDEX "payload_locked_documents_rels_testimonials_id_idx" ON "web"."payload_locked_documents_rels" USING btree ("testimonials_id");
  CREATE INDEX "payload_locked_documents_rels_timeline_entries_id_idx" ON "web"."payload_locked_documents_rels" USING btree ("timeline_entries_id");
  CREATE INDEX "payload_locked_documents_rels_gallery_photos_id_idx" ON "web"."payload_locked_documents_rels" USING btree ("gallery_photos_id");
  CREATE INDEX "payload_locked_documents_rels_city_projects_id_idx" ON "web"."payload_locked_documents_rels" USING btree ("city_projects_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "web"."payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_form_submissions_id_idx" ON "web"."payload_locked_documents_rels" USING btree ("form_submissions_id");
  CREATE INDEX "payload_locked_documents_rels_redirects_id_idx" ON "web"."payload_locked_documents_rels" USING btree ("redirects_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "web"."payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "web"."payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "web"."payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "web"."payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "web"."payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "web"."payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "web"."payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "web"."payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "web"."payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "web"."payload_migrations" USING btree ("created_at");
  CREATE INDEX "settings_social_order_idx" ON "web"."settings_social" USING btree ("_order");
  CREATE INDEX "settings_social_parent_id_idx" ON "web"."settings_social" USING btree ("_parent_id");
  CREATE INDEX "settings_footer_columns_links_order_idx" ON "web"."settings_footer_columns_links" USING btree ("_order");
  CREATE INDEX "settings_footer_columns_links_parent_id_idx" ON "web"."settings_footer_columns_links" USING btree ("_parent_id");
  CREATE INDEX "settings_footer_columns_order_idx" ON "web"."settings_footer_columns" USING btree ("_order");
  CREATE INDEX "settings_footer_columns_parent_id_idx" ON "web"."settings_footer_columns" USING btree ("_parent_id");
  CREATE INDEX "settings_default_og_image_idx" ON "web"."settings" USING btree ("default_og_image_id");
  CREATE INDEX "settings_sidebar_cta_sidebar_cta_photo_idx" ON "web"."settings" USING btree ("sidebar_cta_photo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "web"."posts" CASCADE;
  DROP TABLE "web"."posts_texts" CASCADE;
  DROP TABLE "web"."posts_rels" CASCADE;
  DROP TABLE "web"."_posts_v" CASCADE;
  DROP TABLE "web"."_posts_v_texts" CASCADE;
  DROP TABLE "web"."_posts_v_rels" CASCADE;
  DROP TABLE "web"."categories" CASCADE;
  DROP TABLE "web"."pages" CASCADE;
  DROP TABLE "web"."page_edits" CASCADE;
  DROP TABLE "web"."_page_edits_v" CASCADE;
  DROP TABLE "web"."desk_pages_sections" CASCADE;
  DROP TABLE "web"."desk_pages_faq" CASCADE;
  DROP TABLE "web"."desk_pages_sources" CASCADE;
  DROP TABLE "web"."desk_pages" CASCADE;
  DROP TABLE "web"."_desk_pages_v_version_sections" CASCADE;
  DROP TABLE "web"."_desk_pages_v_version_faq" CASCADE;
  DROP TABLE "web"."_desk_pages_v_version_sources" CASCADE;
  DROP TABLE "web"."_desk_pages_v" CASCADE;
  DROP TABLE "web"."desk_jobs_sources" CASCADE;
  DROP TABLE "web"."desk_jobs" CASCADE;
  DROP TABLE "web"."desk_runs" CASCADE;
  DROP TABLE "web"."ai_prompts" CASCADE;
  DROP TABLE "web"."_ai_prompts_v" CASCADE;
  DROP TABLE "web"."ai_connections" CASCADE;
  DROP TABLE "web"."oauth_clients" CASCADE;
  DROP TABLE "web"."oauth_tokens" CASCADE;
  DROP TABLE "web"."events_exdates" CASCADE;
  DROP TABLE "web"."events" CASCADE;
  DROP TABLE "web"."events_rels" CASCADE;
  DROP TABLE "web"."_events_v_version_exdates" CASCADE;
  DROP TABLE "web"."_events_v" CASCADE;
  DROP TABLE "web"."_events_v_rels" CASCADE;
  DROP TABLE "web"."venues" CASCADE;
  DROP TABLE "web"."organizers" CASCADE;
  DROP TABLE "web"."event_categories" CASCADE;
  DROP TABLE "web"."places_links" CASCADE;
  DROP TABLE "web"."places" CASCADE;
  DROP TABLE "web"."places_texts" CASCADE;
  DROP TABLE "web"."places_rels" CASCADE;
  DROP TABLE "web"."_places_v_version_links" CASCADE;
  DROP TABLE "web"."_places_v" CASCADE;
  DROP TABLE "web"."_places_v_texts" CASCADE;
  DROP TABLE "web"."_places_v_rels" CASCADE;
  DROP TABLE "web"."parks" CASCADE;
  DROP TABLE "web"."parks_texts" CASCADE;
  DROP TABLE "web"."_parks_v" CASCADE;
  DROP TABLE "web"."_parks_v_texts" CASCADE;
  DROP TABLE "web"."neighborhoods_highlights" CASCADE;
  DROP TABLE "web"."neighborhoods_schools" CASCADE;
  DROP TABLE "web"."neighborhoods_faq" CASCADE;
  DROP TABLE "web"."neighborhoods" CASCADE;
  DROP TABLE "web"."_neighborhoods_v_version_highlights" CASCADE;
  DROP TABLE "web"."_neighborhoods_v_version_schools" CASCADE;
  DROP TABLE "web"."_neighborhoods_v_version_faq" CASCADE;
  DROP TABLE "web"."_neighborhoods_v" CASCADE;
  DROP TABLE "web"."testimonials" CASCADE;
  DROP TABLE "web"."timeline_entries" CASCADE;
  DROP TABLE "web"."gallery_photos" CASCADE;
  DROP TABLE "web"."city_projects_sources" CASCADE;
  DROP TABLE "web"."city_projects" CASCADE;
  DROP TABLE "web"."_city_projects_v_version_sources" CASCADE;
  DROP TABLE "web"."_city_projects_v" CASCADE;
  DROP TABLE "web"."media" CASCADE;
  DROP TABLE "web"."form_submissions" CASCADE;
  DROP TABLE "web"."redirects" CASCADE;
  DROP TABLE "web"."users_sessions" CASCADE;
  DROP TABLE "web"."users" CASCADE;
  DROP TABLE "web"."payload_kv" CASCADE;
  DROP TABLE "web"."payload_jobs_log" CASCADE;
  DROP TABLE "web"."payload_jobs" CASCADE;
  DROP TABLE "web"."payload_locked_documents" CASCADE;
  DROP TABLE "web"."payload_locked_documents_rels" CASCADE;
  DROP TABLE "web"."payload_preferences" CASCADE;
  DROP TABLE "web"."payload_preferences_rels" CASCADE;
  DROP TABLE "web"."payload_migrations" CASCADE;
  DROP TABLE "web"."settings_social" CASCADE;
  DROP TABLE "web"."settings_footer_columns_links" CASCADE;
  DROP TABLE "web"."settings_footer_columns" CASCADE;
  DROP TABLE "web"."settings" CASCADE;
  DROP TYPE "web"."enum_posts_review_state";
  DROP TYPE "web"."enum_posts_review_source";
  DROP TYPE "web"."enum_posts_status";
  DROP TYPE "web"."enum__posts_v_version_review_state";
  DROP TYPE "web"."enum__posts_v_version_review_source";
  DROP TYPE "web"."enum__posts_v_version_status";
  DROP TYPE "web"."enum_desk_pages_review_state";
  DROP TYPE "web"."enum_desk_pages_review_source";
  DROP TYPE "web"."enum_desk_pages_template";
  DROP TYPE "web"."enum_desk_pages_status";
  DROP TYPE "web"."enum__desk_pages_v_version_review_state";
  DROP TYPE "web"."enum__desk_pages_v_version_review_source";
  DROP TYPE "web"."enum__desk_pages_v_version_template";
  DROP TYPE "web"."enum__desk_pages_v_version_status";
  DROP TYPE "web"."enum_desk_jobs_cadence";
  DROP TYPE "web"."enum_desk_jobs_weekday";
  DROP TYPE "web"."enum_desk_runs_runner";
  DROP TYPE "web"."enum_desk_runs_status";
  DROP TYPE "web"."enum_ai_prompts_format";
  DROP TYPE "web"."enum__ai_prompts_v_version_format";
  DROP TYPE "web"."enum_ai_connections_provider";
  DROP TYPE "web"."enum_oauth_clients_auth_method";
  DROP TYPE "web"."enum_oauth_tokens_kind";
  DROP TYPE "web"."enum_events_review_state";
  DROP TYPE "web"."enum_events_review_source";
  DROP TYPE "web"."enum_events_status";
  DROP TYPE "web"."enum__events_v_version_review_state";
  DROP TYPE "web"."enum__events_v_version_review_source";
  DROP TYPE "web"."enum__events_v_version_status";
  DROP TYPE "web"."enum_places_links_kind";
  DROP TYPE "web"."enum_places_review_state";
  DROP TYPE "web"."enum_places_review_source";
  DROP TYPE "web"."enum_places_type";
  DROP TYPE "web"."enum_places_business_status";
  DROP TYPE "web"."enum_places_street";
  DROP TYPE "web"."enum_places_price_range";
  DROP TYPE "web"."enum_places_status";
  DROP TYPE "web"."enum__places_v_version_links_kind";
  DROP TYPE "web"."enum__places_v_version_review_state";
  DROP TYPE "web"."enum__places_v_version_review_source";
  DROP TYPE "web"."enum__places_v_version_type";
  DROP TYPE "web"."enum__places_v_version_business_status";
  DROP TYPE "web"."enum__places_v_version_street";
  DROP TYPE "web"."enum__places_v_version_price_range";
  DROP TYPE "web"."enum__places_v_version_status";
  DROP TYPE "web"."enum_parks_type";
  DROP TYPE "web"."enum_parks_status";
  DROP TYPE "web"."enum__parks_v_version_type";
  DROP TYPE "web"."enum__parks_v_version_status";
  DROP TYPE "web"."enum_neighborhoods_status";
  DROP TYPE "web"."enum__neighborhoods_v_version_status";
  DROP TYPE "web"."enum_gallery_photos_status";
  DROP TYPE "web"."enum_city_projects_review_state";
  DROP TYPE "web"."enum_city_projects_review_source";
  DROP TYPE "web"."enum_city_projects_status";
  DROP TYPE "web"."enum__city_projects_v_version_review_state";
  DROP TYPE "web"."enum__city_projects_v_version_review_source";
  DROP TYPE "web"."enum__city_projects_v_version_status";
  DROP TYPE "web"."enum_redirects_status_code";
  DROP TYPE "web"."enum_users_role";
  DROP TYPE "web"."enum_payload_jobs_log_task_slug";
  DROP TYPE "web"."enum_payload_jobs_log_state";
  DROP TYPE "web"."enum_payload_jobs_task_slug";
  DROP TYPE "web"."enum_settings_social_platform";`)
}
