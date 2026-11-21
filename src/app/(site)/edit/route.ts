import { draftMode, headers } from "next/headers";
import { NextResponse } from "next/server";

import { isStaffUser } from "@/access/roles";
import { getPayloadClient } from "@/lib/payload";

/**
 * Turns the on-page editor on or off.
 *   /edit/?path=/about-san-carlos/   → sign-in check, edit mode on, back to the page
 *   /edit/?exit=1&path=/about-san-carlos/ → edit mode off
 * Signed-out visitors are sent to the admin login and come back here after.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const raw = url.searchParams.get("path") || "/";
  // Only paths on this site.
  const path = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
  const back = new URL(path, url.origin);

  if (url.searchParams.get("exit")) {
    (await draftMode()).disable();
    return NextResponse.redirect(back);
  }
  const payload = await getPayloadClient();
  const { user } = await payload.auth({ headers: await headers() });
  if (!isStaffUser(user)) {
    const login = new URL("/admin/login", url.origin);
    login.searchParams.set("redirect", `/edit/?path=${encodeURIComponent(path)}`);
    return NextResponse.redirect(login);
  }
  (await draftMode()).enable();
  const res = NextResponse.redirect(back);
  // A readable hint (no secret in it) so the site can show editors the "Edit this page" button.
  res.cookies.set("scl-editor", "1", { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", secure: url.protocol === "https:" });
  return res;
}
