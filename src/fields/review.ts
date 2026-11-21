import type { Field } from "payload";

/**
 * The Operations Desk review workflow, shared by every kind of item the desk
 * handles (posts, events, places, city projects, desk pages). An item sent for
 * review gets a format check; the Approval queue (/admin/desk) approves it,
 * which publishes, or rejects it with a note.
 */
export const reviewField: Field = {
  name: "review",
  type: "group",
  label: "Desk review",
  admin: { position: "sidebar" },
  fields: [
    {
      name: "state",
      type: "select",
      defaultValue: "none",
      index: true,
      options: [
        { label: "Not in the desk", value: "none" },
        { label: "Waiting for approval", value: "in-review" },
        { label: "Approved (published)", value: "approved" },
        { label: "Sent back", value: "rejected" },
      ],
    },
    {
      name: "source",
      type: "select",
      options: [
        { label: "Editor", value: "editor" },
        { label: "Claude research run", value: "claude" },
        { label: "Website AI", value: "website-ai" },
        { label: "Public submission", value: "public" },
      ],
    },
    { name: "note", type: "textarea", admin: { description: "Why it was sent back, or notes for the reviewer." } },
    { name: "check", type: "json", admin: { readOnly: true, description: "Format check result" } },
    { name: "submittedAt", type: "date", admin: { readOnly: true } },
    { name: "reviewedAt", type: "date", admin: { readOnly: true } },
    { name: "reviewedBy", type: "relationship", relationTo: "users", admin: { readOnly: true } },
  ],
};
