import { NextResponse, type NextRequest } from "next/server";

/**
 * Public pages keep WordPress-style trailing slashes (one canonical URL each).
 * The admin and API are left alone so Payload's requests aren't redirected.
 * Old-URL redirects from the Redirects collection are added here in milestone 10.
 */
export function proxy(request: NextRequest) {
  // Use the raw URL: nextUrl normalizes trailing slashes away.
  const url = new URL(request.url);
  const { pathname } = url;
  const isPage = !pathname.endsWith("/") && !/\.[a-z0-9]+$/i.test(pathname);
  if (isPage && (request.method === "GET" || request.method === "HEAD")) {
    url.pathname = `${pathname}/`;
    return NextResponse.redirect(url.toString(), 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|admin|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|feed.xml).*)"],
};
