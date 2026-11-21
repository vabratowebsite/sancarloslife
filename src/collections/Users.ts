import type { CollectionConfig } from "payload";

import { adminFieldOnly, adminsOnly, isAdminUser } from "../access/roles";

export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    useAsTitle: "email",
    defaultColumns: ["name", "email", "role"],
    group: "Admin",
    // Editors manage content only; the Users screen is for admins.
    hidden: ({ user }) => !isAdminUser(user),
  },
  auth: {
    // Editors and Claude publish through API keys with the editor role.
    useAPIKey: true,
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    cookies: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
    },
  },
  access: {
    // Signed-in users can read their own record; admins read everyone.
    read: ({ req }) => {
      if (isAdminUser(req.user)) return true;
      if (req.user) return { id: { equals: req.user.id } };
      return false;
    },
    // The very first user (no users yet) may be created from the setup screen.
    create: async ({ req }) => {
      if (isAdminUser(req.user)) return true;
      const { totalDocs } = await req.payload.count({ collection: "users", overrideAccess: true });
      return totalDocs === 0;
    },
    update: ({ req }) => {
      if (isAdminUser(req.user)) return true;
      if (req.user) return { id: { equals: req.user.id } };
      return false;
    },
    delete: adminsOnly,
  },
  fields: [
    { name: "name", type: "text" },
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "editor",
      options: [
        { label: "Admin", value: "admin" },
        { label: "Editor", value: "editor" },
      ],
      saveToJWT: true,
      access: {
        // Only admins can change roles, so an editor can't promote themselves.
        create: adminFieldOnly,
        update: adminFieldOnly,
      },
      hooks: {
        beforeChange: [
          // The first account created becomes an admin.
          async ({ req, value, operation }) => {
            if (operation !== "create") return value;
            const { totalDocs } = await req.payload.count({
              collection: "users",
              overrideAccess: true,
            });
            return totalDocs === 0 ? "admin" : value;
          },
        ],
      },
    },
  ],
};
