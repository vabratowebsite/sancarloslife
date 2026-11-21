import { NextResponse, type NextRequest } from "next/server";

import { findRedirect, getRedirects } from "@/lib/redirects";

/**
 * 1. Old WordPress URLs: rules from the Redirects collection (one hop, cached).
 * 2. Public pages keep WordPress-style trailing slashes (one canonical URL each).
 * The admin and API are excluded so Payload's requests are never redirected.
 */
export async function proxy(request: NextRequest) {
  if (request.method !== "GET" && request.method !== "HEAD") return NextResponse.next();

  // Use the raw URL: nextUrl normalizes trailing slashes away.
  const url = new URL(request.url);
  const { pathname } = url;

  const rule = findRedirect(await getRedirects(), pathname);
  if (rule) {
    if (rule.code === 410 || !rule.to) return new NextResponse("Gone", { status: 410 });
    const target = new URL(rule.to, url.origin);
    // Keep campaign parameters (utm_*, fbclid) the visitor arrived with.
    for (const [k, v] of url.searchParams) if (!target.searchParams.has(k)) target.searchParams.set(k, v);
    return NextResponse.redirect(target.toString(), rule.code);
  }

  const isPage = !pathname.endsWith("/") && !/\.[a-z0-9]+$/i.test(pathname);
  if (isPage) {
    url.pathname = `${pathname}/`;
    return NextResponse.redirect(url.toString(), 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|admin|mcp/?$|cron/|oauth/|\\.well-known/|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
