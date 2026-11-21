import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "web"."pages_blocks_team_people" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" varchar,
  	"photo_id" integer,
  	"bio" varchar,
  	"license" varchar,
  	"phone" varchar,
  	"email" varchar
  );
  
  CREATE TABLE "web"."pages_blocks_team" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "web"."pages_blocks_testimonials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"eyebrow" varchar,
  	"heading" varchar DEFAULT 'What clients say',
  	"featured_only" boolean DEFAULT false,
  	"limit" numeric DEFAULT 6,
  	"block_name" varchar
  );
  
  CREATE TABLE "web"."_pages_v_blocks_team_people" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" varchar,
  	"photo_id" integer,
  	"bio" varchar,
  	"license" varchar,
  	"phone" varchar,
  	"email" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "web"."_pages_v_blocks_team" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "web"."_pages_v_blocks_testimonials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"eyebrow" varchar,
  	"heading" varchar DEFAULT 'What clients say',
  	"featured_only" boolean DEFAULT false,
  	"limit" numeric DEFAULT 6,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "web"."pages_blocks_team_people" ADD CONSTRAINT "pages_blocks_team_people_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."pages_blocks_team_people" ADD CONSTRAINT "pages_blocks_team_people_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."pages_blocks_team"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."pages_blocks_team" ADD CONSTRAINT "pages_blocks_team_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."pages_blocks_testimonials" ADD CONSTRAINT "pages_blocks_testimonials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_pages_v_blocks_team_people" ADD CONSTRAINT "_pages_v_blocks_team_people_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "web"."_pages_v_blocks_team_people" ADD CONSTRAINT "_pages_v_blocks_team_people_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."_pages_v_blocks_team"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_pages_v_blocks_team" ADD CONSTRAINT "_pages_v_blocks_team_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "web"."_pages_v_blocks_testimonials" ADD CONSTRAINT "_pages_v_blocks_testimonials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "web"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_team_people_order_idx" ON "web"."pages_blocks_team_people" USING btree ("_order");
  CREATE INDEX "pages_blocks_team_people_parent_id_idx" ON "web"."pages_blocks_team_people" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_team_people_photo_idx" ON "web"."pages_blocks_team_people" USING btree ("photo_id");
  CREATE INDEX "pages_blocks_team_order_idx" ON "web"."pages_blocks_team" USING btree ("_order");
  CREATE INDEX "pages_blocks_team_parent_id_idx" ON "web"."pages_blocks_team" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_team_path_idx" ON "web"."pages_blocks_team" USING btree ("_path");
  CREATE INDEX "pages_blocks_testimonials_order_idx" ON "web"."pages_blocks_testimonials" USING btree ("_order");
  CREATE INDEX "pages_blocks_testimonials_parent_id_idx" ON "web"."pages_blocks_testimonials" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_testimonials_path_idx" ON "web"."pages_blocks_testimonials" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_team_people_order_idx" ON "web"."_pages_v_blocks_team_people" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_team_people_parent_id_idx" ON "web"."_pages_v_blocks_team_people" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_team_people_photo_idx" ON "web"."_pages_v_blocks_team_people" USING btree ("photo_id");
  CREATE INDEX "_pages_v_blocks_team_order_idx" ON "web"."_pages_v_blocks_team" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_team_parent_id_idx" ON "web"."_pages_v_blocks_team" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_team_path_idx" ON "web"."_pages_v_blocks_team" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_testimonials_order_idx" ON "web"."_pages_v_blocks_testimonials" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_testimonials_parent_id_idx" ON "web"."_pages_v_blocks_testimonials" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_testimonials_path_idx" ON "web"."_pages_v_blocks_testimonials" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "web"."pages_blocks_team_people" CASCADE;
  DROP TABLE "web"."pages_blocks_team" CASCADE;
  DROP TABLE "web"."pages_blocks_testimonials" CASCADE;
  DROP TABLE "web"."_pages_v_blocks_team_people" CASCADE;
  DROP TABLE "web"."_pages_v_blocks_team" CASCADE;
  DROP TABLE "web"."_pages_v_blocks_testimonials" CASCADE;`)
}
