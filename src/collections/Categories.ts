import { slugField, type CollectionConfig } from "payload";

import { anyone, staffOnly } from "../access/roles";
import { wpIdField } from "../fields/seo";
import { revalidateHooks } from "../hooks/revalidate";

export const Categories: CollectionConfig = {
  slug: "categories",
  admin: { useAsTitle: "name", group: "Content", defaultColumns: ["name", "slug"] },
  access: { read: anyone, create: staffOnly, update: staffOnly, delete: staffOnly },
  hooks: revalidateHooks("categories"),
  fields: [
    { name: "name", type: "text", required: true },
    slugField({ useAsSlug: "name" }),
    { name: "description", type: "textarea" },
    wpIdField,
  ],
};
