import type { CollectionConfig } from "payload";

import { adminsOnly, isAdminUser, staffOnly } from "../access/roles";
import { revalidateHooks } from "../hooks/revalidate";

/**
 * Every public form submission. Created only by server actions (overrideAccess),
 * read by staff, purged after 12 months by the housekeeping cron.
 */
export const FormSubmissions: CollectionConfig = {
  slug: "form-submissions",
  admin: {
    useAsTitle: "formKey",
    group: "Admin",
    defaultColumns: ["formKey", "email", "createdAt", "handledAt"],
  },
  access: {
    read: staffOnly,
    create: () => false,
    update: staffOnly,
    delete: adminsOnly,
  },
  defaultSort: "-createdAt",
  fields: [
    { name: "formKey", type: "text", required: true, index: true },
    { name: "email", type: "email", index: true },
    { name: "payload", type: "json", required: true },
    { name: "ipHash", type: "text", admin: { readOnly: true } },
    { name: "turnstileOk", type: "checkbox", admin: { readOnly: true } },
    { name: "handledAt", type: "date" },
    { name: "handledBy", type: "relationship", relationTo: "users" },
    { name: "note", type: "textarea" },
  ],
};

/** Old WordPress URLs and anything that moves. Served by the middleware. */
export const Redirects: CollectionConfig = {
  slug: "redirects",
  admin: {
    useAsTitle: "fromPath",
    group: "Admin",
    defaultColumns: ["fromPath", "toPath", "statusCode", "hits"],
    hidden: ({ user }) => !isAdminUser(user),
  },
  access: { read: adminsOnly, create: adminsOnly, update: adminsOnly, delete: adminsOnly },
  hooks: revalidateHooks("redirects"),
  fields: [
    {
      name: "fromPath",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: { description: "Path only, starting with /, e.g. /old-page/" },
      validate: (value: unknown) =>
        typeof value === "string" && value.startsWith("/") ? true : "Start the path with /",
    },
    {
      name: "toPath",
      type: "text",
      admin: { description: "Path or full URL. Leave empty for 410 Gone." },
    },
    {
      name: "statusCode",
      type: "select",
      required: true,
      defaultValue: "301",
      options: [
        { label: "301 Permanent", value: "301" },
        { label: "302 Temporary", value: "302" },
        { label: "410 Gone", value: "410" },
      ],
    },
    { name: "hits", type: "number", defaultValue: 0, admin: { readOnly: true } },
    { name: "source", type: "text", admin: { readOnly: true, description: "rankmath, crawl, manual" } },
  ],
};

