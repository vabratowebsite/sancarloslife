import type { Access, FieldAccess } from "payload";

export type Role = "admin" | "editor";

type MaybeUser = { role?: Role | null } | null | undefined;

export const isAdminUser = (user: MaybeUser): boolean => user?.role === "admin";
export const isStaffUser = (user: MaybeUser): boolean =>
  user?.role === "admin" || user?.role === "editor";

/** Only admins (user management, redirects, settings). */
export const adminsOnly: Access = ({ req }) => isAdminUser(req.user as MaybeUser);

/** Admins and editors (content). */
export const staffOnly: Access = ({ req }) => isStaffUser(req.user as MaybeUser);

/** Anyone may read, but only published documents unless signed in as staff. */
export const publishedOrStaff: Access = ({ req }) => {
  if (isStaffUser(req.user as MaybeUser)) return true;
  return { _status: { equals: "published" } };
};

/** Public read for collections without drafts (media, venues ...). */
export const anyone: Access = () => true;

export const adminFieldOnly: FieldAccess = ({ req }) => isAdminUser(req.user as MaybeUser);
