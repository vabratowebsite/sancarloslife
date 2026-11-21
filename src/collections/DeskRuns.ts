import type { CollectionConfig } from "payload";

import { adminsOnly, staffOnly } from "../access/roles";

/**
 * The desk's run log and heartbeat. Every scheduled run (a Claude research run
 * or the website's backup run) records itself here; the backup runner checks
 * this to decide whether Claude's run happened.
 */
export const DeskRuns: CollectionConfig = {
  slug: "desk-runs",
  labels: { singular: "Desk run", plural: "Desk runs" },
  admin: {
    useAsTitle: "job",
    defaultColumns: ["job", "runner", "status", "startedAt", "summary"],
    group: "Operations Desk",
  },
  access: { read: staffOnly, create: staffOnly, update: staffOnly, delete: adminsOnly },
  defaultSort: "-startedAt",
  fields: [
    { name: "job", type: "text", required: true, index: true, admin: { description: "e.g. local-news-scan, events-scan, newsletter-draft" } },
    {
      name: "runner",
      type: "select",
      required: true,
      options: [
        { label: "Claude", value: "claude" },
        { label: "Website (backup AI)", value: "website-ai" },
        { label: "Editor", value: "editor" },
      ],
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "ok",
      options: [
        { label: "OK", value: "ok" },
        { label: "Partly failed", value: "partial" },
        { label: "Failed", value: "failed" },
      ],
    },
    { name: "startedAt", type: "date", required: true, index: true },
    { name: "finishedAt", type: "date" },
    { name: "summary", type: "text" },
    { name: "checked", type: "number", admin: { description: "Sources checked" } },
    { name: "drafted", type: "number", admin: { description: "Drafts sent for review" } },
    { name: "notes", type: "json", admin: { description: "[[\"ok\"|\"bad\", text], …]" } },
  ],
};
