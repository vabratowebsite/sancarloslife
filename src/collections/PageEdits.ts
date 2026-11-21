import type { CollectionConfig } from "payload";

import { adminsOnly, anyone, staffOnly } from "../access/roles";

/**
 * Words and photos changed on a code page with the on-page editor
 * (Edit text / photo swap / Save / Versions), the same way the Operations Desk
 * editor works. One record per page; the page's code is the "original", and
 * these changes are laid over it when the page renders. Payload keeps the last
 * 10 saves as versions, which is what Versions → Restore uses.
 */
export const PageEdits: CollectionConfig = {
  slug: "page-edits",
  labels: { singular: "Page edit", plural: "Page edits" },
  admin: {
    useAsTitle: "page",
    defaultColumns: ["page", "changes", "updatedAt"],
    group: "Content",
    description: "Changes made with the on-page editor. To edit a page, open it on the site and press Edit this page.",
  },
  access: { read: anyone, create: staffOnly, update: staffOnly, delete: adminsOnly },
  versions: { maxPerDoc: 10 },
  fields: [
    { name: "page", type: "text", required: true, unique: true, index: true, admin: { readOnly: true, description: "Page key, e.g. about-san-carlos or home" } },
    { name: "path", type: "text", admin: { readOnly: true } },
    {
      name: "texts",
      type: "json",
      admin: { readOnly: true, description: "Changed words: { key: { from, to } }" },
    },
    {
      name: "images",
      type: "json",
      admin: { readOnly: true, description: "Swapped photos: { key: { src, width, height, alt } }" },
    },
    { name: "changes", type: "number", admin: { readOnly: true } },
    { name: "updatedBy", type: "relationship", relationTo: "users", admin: { readOnly: true } },
  ],
};
