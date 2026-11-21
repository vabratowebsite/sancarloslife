import type { Access, FieldAccess } from "payload";

export type Role = "admin" | "editor";

// Accepts Payload users, client users and JWT payloads alike.
type MaybeUser = { role?: unknown } | object | null | undefined;

const roleOf = (user: MaybeUser): unknown =>
  user && typeof user === "object" && "role" in user ? (user as { role?: unknown }).role : undefined;

export const isAdminUser = (user: MaybeUser): boolean => roleOf(user) === "admin";
export const isStaffUser = (user: MaybeUser): boolean =>
  roleOf(user) === "admin" || roleOf(user) === "editor";

/** Only admins (user management, redirects, settings). */
export const adminsOnly: Access = ({ req }) => isAdminUser(req.user);

/** Admins and editors (content). */
export const staffOnly: Access = ({ req }) => isStaffUser(req.user);

/** Anyone may read, but only published documents unless signed in as staff. */
export const publishedOrStaff: Access = ({ req }) => {
  if (isStaffUser(req.user)) return true;
  return { _status: { equals: "published" } };
};

/** Public read for collections without drafts (media, venues ...). */
export const anyone: Access = () => true;

export const adminFieldOnly: FieldAccess = ({ req }) => isAdminUser(req.user);
