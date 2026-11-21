import "server-only";

import type { Payload, TypedUser, Where } from "payload";
import { z } from "zod";

import { isStaffUser } from "@/access/roles";
import { STATIC_PAGES, staticPage } from "@/content/pages";
import { loadPageHtml } from "@/content/pages/load";
import { FORMATS, toDraftData, type FormatKey } from "@/lib/ai/formats";
import { lexicalToText } from "@/lib/ai/lexical";
import { siteSearch } from "@/lib/queries/search";

/**
 * Tools the website connector offers to AI assistants (Claude, ChatGPT and
 * other MCP clients). Read tools are open to any signed-in staff account;
 * write tools only create or change DRAFTS and send them to the Approval
 * queue. Nothing here approves or publishes: that stays with people in
 * /admin/desk.
 */

export type ToolContext = { payload: Payload; user: TypedUser };
type Tool = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean; idempotentHint?: boolean };
  run: (args: Record<string, unknown>, ctx: ToolContext) => Promise<unknown>;
};

export class ToolError extends Error {}

const COLLECTIONS = ["posts", "desk-pages", "events", "places", "city-projects"] as const;
type Coll = (typeof COLLECTIONS)[number];
const TITLE: Record<Coll, string> = { posts: "title", "desk-pages": "title", events: "title", places: "name", "city-projects": "title" };
const DRAFTS: Record<Coll, boolean> = { posts: true, "desk-pages": true, events: false, places: true, "city-projects": true };
const FORMAT_OF: Partial<Record<Coll, FormatKey>> = { posts: "blog", "desk-pages": "desk-page" };

const collEnum = { type: "string", enum: [...COLLECTIONS], description: "posts = blog posts; desk-pages = guide pages made through the desk" };
const parse = <T extends z.ZodTypeAny>(schema: T, args: unknown): z.infer<T> => {
  const r = schema.safeParse(args ?? {});
  if (!r.success) throw new ToolError(r.error.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; "));
  return r.data;
};
const needStaff = (user: TypedUser) => {
  if (!isStaffUser(user)) throw new ToolError("This account can't change content. Ask an admin for an editor role.");
};

/** Rich-text fields become readable text for the AI. */
function readable(doc: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(doc)) {
    if (v && typeof v === "object" && "root" in (v as object)) out[`${k}_text`] = lexicalToText(v);
    else if (Array.isArray(v)) out[k] = v.map((x) => (x && typeof x === "object" ? readable(x as Record<string, unknown>) : x));
    else out[k] = v;
  }
  return out;
}

export const TOOLS: Tool[] = [
  {
    name: "search_site",
    title: "Search the site",
    description: "Search published San Carlos Life content (events, places, neighborhoods, parks, blog posts, pages) by keywords.",
    inputSchema: { type: "object", properties: { query: { type: "string", description: "Words to search for" } }, required: ["query"] },
    annotations: { readOnlyHint: true },
    run: async (args) => {
      const { query } = parse(z.object({ query: z.string().min(2).max(80) }), args);
      return siteSearch(query);
    },
  },
  {
    name: "list_items",
    title: "List items",
    description: "List blog posts, desk pages, events, places or city projects, newest edits first, optionally only those in a desk review state.",
    inputSchema: {
      type: "object",
      properties: {
        collection: collEnum,
        reviewState: { type: "string", enum: ["none", "in-review", "approved", "rejected"] },
        limit: { type: "number", minimum: 1, maximum: 50 },
      },
      required: ["collection"],
    },
    annotations: { readOnlyHint: true },
    run: async (args, { payload, user }) => {
      const a = parse(z.object({ collection: z.enum(COLLECTIONS), reviewState: z.enum(["none", "in-review", "approved", "rejected"]).optional(), limit: z.number().int().min(1).max(50).default(20) }), args);
      const res = await payload.find({
        collection: a.collection,
        where: (a.reviewState ? { "review.state": { equals: a.reviewState } } : {}) as Where,
        draft: DRAFTS[a.collection],
        sort: "-updatedAt",
        limit: a.limit,
        depth: 0,
        user,
        overrideAccess: false,
      });
      return res.docs.map((d) => {
        const doc = d as unknown as Record<string, unknown> & { review?: { state?: string } };
        return { id: doc.id, title: doc[TITLE[a.collection]], slug: doc.slug, status: doc._status ?? doc.status, reviewState: doc.review?.state ?? "none", updatedAt: doc.updatedAt };
      });
    },
  },
  {
    name: "get_item",
    title: "Read an item",
    description: "Read one blog post, desk page, event, place or city project in full (latest draft), with rich text as plain text ('## ' headings, '- ' bullets).",
    inputSchema: { type: "object", properties: { collection: collEnum, id: { type: ["string", "number"] } }, required: ["collection", "id"] },
    annotations: { readOnlyHint: true },
    run: async (args, { payload, user }) => {
      const a = parse(z.object({ collection: z.enum(COLLECTIONS), id: z.union([z.string(), z.number()]) }), args);
      const doc = await payload.findByID({ collection: a.collection, id: a.id, draft: DRAFTS[a.collection], depth: 1, user, overrideAccess: false }).catch(() => null);
      if (!doc) throw new ToolError("Not found, or this account can't read it.");
      return readable(doc as unknown as Record<string, unknown>);
    },
  },
  {
    name: "get_page",
    title: "Read a site page",
    description: "Read one of the site's fixed pages (About, Hometown Days, Privacy and others) as HTML, by its address slug. Lists the slugs when called without one.",
    inputSchema: { type: "object", properties: { slug: { type: "string" } } },
    annotations: { readOnlyHint: true },
    run: async (args) => {
      const { slug } = parse(z.object({ slug: z.string().max(120).optional() }), args);
      if (!slug) return Object.entries(STATIC_PAGES).map(([s, p]) => ({ slug: s, title: p.title }));
      const page = staticPage(slug);
      if (!page) throw new ToolError("No fixed page with that slug. Blog posts and desk pages are read with get_item.");
      return { slug, title: page.title, heading: page.heading, subheading: page.subheading, html: (await loadPageHtml(slug)) ?? "" };
    },
  },
  {
    name: "get_prompt",
    title: "Get a writing prompt",
    description:
      "Get the site's current prompt for a format (blog or desk-page): instructions, rules, example and the exact JSON shape submit_draft expects. Use it before writing, so every AI writes the same way.",
    inputSchema: { type: "object", properties: { format: { type: "string", enum: Object.keys(FORMATS) } }, required: ["format"] },
    annotations: { readOnlyHint: true },
    run: async (args, { payload, user }) => {
      const { format } = parse(z.object({ format: z.enum(Object.keys(FORMATS) as [FormatKey, ...FormatKey[]]) }), args);
      const p = (await payload.find({ collection: "ai-prompts", where: { and: [{ format: { equals: format } }, { active: { equals: true } }] }, sort: "-updatedAt", limit: 1, depth: 0, user, overrideAccess: false })).docs[0];
      return { format, prompt: p ? { name: p.name, instructions: p.instructions, rules: p.rules, example: p.example } : null, shape: FORMATS[format].shape };
    },
  },
  {
    name: "submit_draft",
    title: "Submit a draft for approval",
    description:
      "Create a new blog post or desk page as a DRAFT and send it to the Approval queue. 'data' must match the shape from get_prompt. Returns the draft's id and any format problems to fix with update_draft. Never publishes.",
    inputSchema: {
      type: "object",
      properties: {
        format: { type: "string", enum: Object.keys(FORMATS) },
        data: { type: "object", description: "The draft, shaped as get_prompt describes" },
        note: { type: "string", description: "Optional note for the reviewer (sources checked, open questions)" },
      },
      required: ["format", "data"],
    },
    annotations: { readOnlyHint: false, destructiveHint: false },
    run: async (args, { payload, user }) => {
      needStaff(user);
      const a = parse(z.object({ format: z.enum(Object.keys(FORMATS) as [FormatKey, ...FormatKey[]]), data: z.record(z.string(), z.unknown()), note: z.string().max(2000).optional() }), args);
      const out = FORMATS[a.format].schema.safeParse(a.data);
      if (!out.success) throw new ToolError(`The draft doesn't match the ${FORMATS[a.format].label} shape: ${out.error.issues.slice(0, 8).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
      let categoryId: number | null = null;
      if (a.format === "blog" && "category" in out.data && out.data.category) {
        categoryId = ((await payload.find({ collection: "categories", where: { name: { equals: out.data.category } }, limit: 1, depth: 0 })).docs[0]?.id as number) ?? null;
      }
      const data = toDraftData(a.format, out.data, { categoryId }) as Record<string, unknown>;
      (data.review as Record<string, unknown>).source = "claude";
      if (a.note) (data.review as Record<string, unknown>).note = a.note;
      const doc = (await payload.create({ collection: FORMATS[a.format].collection, data: data as never, draft: true, user, overrideAccess: false })) as unknown as {
        id: number | string;
        review?: { check?: { ok?: boolean; problems?: string[] } };
      };
      return { id: doc.id, collection: FORMATS[a.format].collection, passesFormatCheck: Boolean(doc.review?.check?.ok), problems: doc.review?.check?.problems ?? [] };
    },
  },
  {
    name: "update_draft",
    title: "Revise a draft",
    description:
      "Revise an existing blog post or desk page as a new DRAFT version and send it back to the Approval queue (for re-editing published items too; the live version stays until a person approves). 'data' is the full draft in the get_prompt shape.",
    inputSchema: {
      type: "object",
      properties: { collection: { type: "string", enum: ["posts", "desk-pages"] }, id: { type: ["string", "number"] }, data: { type: "object" }, note: { type: "string" } },
      required: ["collection", "id", "data"],
    },
    annotations: { readOnlyHint: false, destructiveHint: false },
    run: async (args, { payload, user }) => {
      needStaff(user);
      const a = parse(z.object({ collection: z.enum(["posts", "desk-pages"]), id: z.union([z.string(), z.number()]), data: z.record(z.string(), z.unknown()), note: z.string().max(2000).optional() }), args);
      const format = FORMAT_OF[a.collection]!;
      const out = FORMATS[format].schema.safeParse(a.data);
      if (!out.success) throw new ToolError(`The draft doesn't match the ${FORMATS[format].label} shape: ${out.error.issues.slice(0, 8).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
      const existing = await payload.findByID({ collection: a.collection, id: a.id, draft: true, depth: 0, user, overrideAccess: false }).catch(() => null);
      if (!existing) throw new ToolError("Not found, or this account can't edit it.");
      const data = toDraftData(format, out.data, { categoryId: null }) as Record<string, unknown>;
      // Keep what the AI doesn't manage (photos, categories, address of a published item).
      delete data.categories;
      delete data.slug;
      delete data.generateSlug;
      data.review = { state: "in-review", source: "claude", ...(a.note ? { note: a.note } : {}) };
      const doc = (await payload.update({ collection: a.collection, id: a.id, data: data as never, draft: true, user, overrideAccess: false })) as unknown as {
        id: number | string;
        review?: { check?: { ok?: boolean; problems?: string[] } };
      };
      return { id: doc.id, collection: a.collection, passesFormatCheck: Boolean(doc.review?.check?.ok), problems: doc.review?.check?.problems ?? [] };
    },
  },
  {
    name: "log_run",
    title: "Record a research run",
    description:
      "Record a scheduled research run in the desk's run log. Call it at the end of every run: it is also the heartbeat that tells the website's backup runner not to take over.",
    inputSchema: {
      type: "object",
      properties: {
        job: { type: "string", description: "e.g. local-news-scan, events-scan, newsletter-draft" },
        status: { type: "string", enum: ["ok", "partial", "failed"] },
        startedAt: { type: "string", description: "ISO date-time" },
        summary: { type: "string" },
        checked: { type: "number" },
        drafted: { type: "number" },
        notes: { type: "array", items: { type: "array", items: { type: "string" } }, description: '[["ok"|"bad", "what happened"], ...]' },
      },
      required: ["job", "status", "startedAt", "summary"],
    },
    annotations: { readOnlyHint: false, destructiveHint: false },
    run: async (args, { payload, user }) => {
      needStaff(user);
      const a = parse(
        z.object({
          job: z.string().regex(/^[a-z0-9:-]{2,60}$/),
          status: z.enum(["ok", "partial", "failed"]),
          startedAt: z.string().datetime({ offset: true }),
          summary: z.string().max(250),
          checked: z.number().int().min(0).optional(),
          drafted: z.number().int().min(0).optional(),
          notes: z.array(z.tuple([z.enum(["ok", "bad"]), z.string().max(300)])).max(50).optional(),
        }),
        args,
      );
      const doc = await payload.create({ collection: "desk-runs", data: { ...a, runner: "claude", finishedAt: new Date().toISOString() }, user, overrideAccess: false });
      return { id: doc.id };
    },
  },
];
