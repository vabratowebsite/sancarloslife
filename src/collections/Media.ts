import type { CollectionConfig } from "payload";

import { anyone, staffOnly } from "../access/roles";

export const Media: CollectionConfig = {
  slug: "media",
  admin: {
    group: "Content",
    defaultColumns: ["filename", "alt", "updatedAt"],
  },
  access: {
    read: anyone,
    create: staffOnly,
    update: staffOnly,
    delete: staffOnly,
  },
  upload: {
    staticDir: "media",
    mimeTypes: ["image/*", "application/pdf"],
    focalPoint: true,
    imageSizes: [
      { name: "thumbnail", width: 400, height: 300, position: "centre" },
      { name: "card", width: 768, height: 512, position: "centre" },
      { name: "hero", width: 1920, height: undefined, position: "centre" },
    ],
    adminThumbnail: "thumbnail",
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
      admin: { description: "Describe the image for people using screen readers." },
    },
    { name: "caption", type: "text" },
    { name: "credit", type: "text" },
    {
      name: "wpAttachmentId",
      type: "number",
      index: true,
      admin: { position: "sidebar", readOnly: true, description: "WordPress attachment id (migration)." },
    },
  ],
};
