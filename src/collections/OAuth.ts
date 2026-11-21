import type { CollectionConfig } from "payload";

import { adminsOnly } from "../access/roles";

/**
 * Sign-in for the website connector (/mcp) through OAuth 2.1, used by
 * claude.ai, ChatGPT and other MCP clients (src/lib/oauth). Records are created
 * only by the OAuth routes (local API); nobody can create or edit them through
 * the admin or REST API. Admins can see them and delete one to cut an app off.
 */

const noWrites = () => false;

export const OAuthClients: CollectionConfig = {
  slug: "oauth-clients",
  labels: { singular: "Connected app", plural: "Connected apps" },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "redirectUris", "createdAt"],
    group: "Operations Desk",
    description: "Apps registered to sign in to the website connector (e.g. Claude, ChatGPT). Deleting one signs it out everywhere.",
  },
  access: { read: adminsOnly, create: noWrites, update: noWrites, delete: adminsOnly },
  hooks: {
    afterDelete: [
      async ({ req, id }) => {
        await req.payload.delete({ collection: "oauth-tokens", where: { client: { equals: id } }, overrideAccess: true, req });
      },
    ],
  },
  fields: [
    { name: "clientId", type: "text", required: true, unique: true, index: true, admin: { readOnly: true } },
    { name: "name", type: "text", required: true, admin: { readOnly: true } },
    { name: "redirectUris", type: "json", required: true, admin: { readOnly: true } },
    {
      name: "authMethod",
      type: "select",
      required: true,
      defaultValue: "none",
      options: ["none", "client_secret_post", "client_secret_basic"].map((v) => ({ label: v, value: v })),
      admin: { readOnly: true },
    },
    { name: "secretHash", type: "text", hidden: true },
    { name: "clientUri", type: "text", admin: { readOnly: true } },
  ],
};

export const OAuthTokens: CollectionConfig = {
  slug: "oauth-tokens",
  labels: { singular: "Connector sign-in", plural: "Connector sign-ins" },
  admin: {
    useAsTitle: "kind",
    defaultColumns: ["kind", "client", "user", "expiresAt", "revokedAt"],
    group: "Operations Desk",
    description: "Codes and tokens issued to connected apps (only their hashes are stored). Delete a row to revoke it.",
  },
  access: { read: adminsOnly, create: noWrites, update: noWrites, delete: adminsOnly },
  fields: [
    {
      name: "kind",
      type: "select",
      required: true,
      options: [
        { label: "Authorization code", value: "code" },
        { label: "Access token", value: "access" },
        { label: "Refresh token", value: "refresh" },
      ],
    },
    { name: "hash", type: "text", required: true, unique: true, index: true, hidden: true },
    { name: "client", type: "relationship", relationTo: "oauth-clients", required: true, index: true },
    { name: "user", type: "relationship", relationTo: "users", required: true, index: true },
    { name: "family", type: "text", required: true, index: true, admin: { description: "Every token from one sign-in shares a family; reuse of a spent code or refresh token revokes it." } },
    { name: "scope", type: "text" },
    { name: "resource", type: "text" },
    { name: "redirectUri", type: "text" },
    { name: "codeChallenge", type: "text", hidden: true },
    { name: "expiresAt", type: "date", required: true, index: true },
    { name: "usedAt", type: "date" },
    { name: "revokedAt", type: "date" },
  ],
};
