import type { CollectionConfig } from "payload";

import { adminsOnly, staffOnly } from "../access/roles";
import { checkUrl } from "../lib/desk/urlCheck";

/**
 * The desk's scheduled jobs (ops desk phase 3). Claude runs them through the
 * connector and logs each run with `log_run` under the job's name. If Claude's
 * run is missing once the grace period has passed, the website's backup runner
 * (/cron/desk/) runs the job itself with the job's prompt, AI connection and
 * sources, and the draft goes to the Approval queue like any other.
 */
export const DeskJobs: CollectionConfig = {
  slug: "desk-jobs",
  labels: { singular: "Desk job", plural: "Desk jobs" },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "cadence", "hour", "backup", "prompt"],
    group: "Operations Desk",
    description:
      "Scheduled research jobs. Claude runs them and logs each run; if a run is missing after the grace period, the website runs the job with the backup AI.",
  },
  access: { read: staffOnly, create: adminsOnly, update: adminsOnly, delete: adminsOnly },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      unique: true,
      index: true,
      validate: (v: unknown) => (typeof v === "string" && /^[a-z0-9:-]{2,60}$/.test(v)) || "Lowercase letters, numbers and dashes (e.g. local-news-scan).",
      admin: { description: "The name Claude uses when it logs the run (log_run job). Lowercase with dashes." },
    },
    { name: "description", type: "textarea", admin: { rows: 2 } },
    {
      type: "row",
      fields: [
        {
          name: "cadence",
          type: "select",
          required: true,
          defaultValue: "daily",
          options: [
            { label: "Every day", value: "daily" },
            { label: "Weekdays", value: "weekdays" },
            { label: "Once a week", value: "weekly" },
          ],
        },
        {
          name: "weekday",
          type: "select",
          options: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((label, i) => ({ label, value: String(i) })),
          admin: { condition: (_, s) => s?.cadence === "weekly", description: "For weekly jobs" },
        },
        { name: "hour", type: "number", required: true, defaultValue: 6, min: 0, max: 23, admin: { description: "Hour of the day, San Carlos time (0–23)" } },
        {
          name: "graceHours",
          type: "number",
          required: true,
          defaultValue: 3,
          min: 1,
          max: 72,
          admin: { description: "How long to wait for Claude's run before the backup runs" },
        },
      ],
    },
    {
      name: "backup",
      type: "checkbox",
      defaultValue: true,
      label: "Run on the website if Claude's run is missing",
    },
    {
      type: "row",
      fields: [
        { name: "prompt", type: "relationship", relationTo: "ai-prompts", required: true, admin: { description: "Which format and voice the draft uses" } },
        {
          name: "connection",
          type: "relationship",
          relationTo: "ai-connections",
          admin: { description: "Backup AI; empty uses the default connection" },
        },
      ],
    },
    {
      name: "instructions",
      type: "textarea",
      required: true,
      admin: { rows: 5, description: "What this run should find and write about, sent to the AI with the sources." },
    },
    {
      name: "sources",
      type: "array",
      maxRows: 15,
      admin: { description: "Pages or RSS feeds the backup run reads (https only). Their text is sent to the AI as material, never as instructions." },
      fields: [
        {
          name: "url",
          type: "text",
          required: true,
          validate: (v: unknown) => {
            try {
              checkUrl(String(v ?? ""));
              return true;
            } catch (e) {
              return (e as Error).message;
            }
          },
        },
        { name: "label", type: "text" },
      ],
    },
  ],
};
