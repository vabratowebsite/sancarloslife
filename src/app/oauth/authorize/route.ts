import { isStaffUser } from "@/access/roles";
import { consentPage, errorPage } from "@/lib/oauth/pages";
import { checkAuthRequest, checkConsentToken, consentToken, findClient, issuerFor, issueCode } from "@/lib/oauth/server";
import { getPayloadClient } from "@/lib/payload";

/**
 * Authorization endpoint. GET shows the consent page to a signed-in editor
 * (or sends them to the admin sign-in first); POST records their decision and
 * sends the browser back to the app with a one-time code.
 */

const PARAMS = ["response_type", "client_id", "redirect_uri", "code_challenge", "code_challenge_method", "state", "scope", "resource"] as const;

const see = (url: string) => new Response(null, { status: 303, headers: { Location: url, "Cache-Control": "no-store" } });

async function session(request: Request) {
  const payload = await getPayloadClient();
  const { user } = await payload.auth({ headers: request.headers });
  return { payload, user };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const issuer = issuerFor(request);
  const { payload, user } = await session(request);
  const check = await checkAuthRequest(payload, issuer, url.searchParams);
  if ("page" in check) return errorPage(check.page);
  if ("redirect" in check) return see(check.redirect);

  if (!user) {
    const login = new URL("/admin/login", issuer);
    login.searchParams.set("redirect", `${url.pathname}${url.search}`);
    return see(login.href);
  }
  if (!isStaffUser(user)) return errorPage("Only San Carlos Life editors and admins can connect apps to the website.", 403);

  const hidden: Record<string, string> = {};
  for (const k of PARAMS) {
    const v = url.searchParams.get(k);
    if (v !== null) hidden[k] = v;
  }
  hidden.consent = consentToken(user.id, check.ok);
  return consentPage({ appName: check.ok.clientName, redirectUri: check.ok.redirectUri, userEmail: String((user as { email?: string }).email ?? ""), hidden });
}

export async function POST(request: Request) {
  const issuer = issuerFor(request);
  // The decision must come from this site's own consent page.
  if (request.headers.get("origin") !== issuer || (request.headers.get("sec-fetch-site") ?? "same-origin") !== "same-origin") {
    return errorPage("This request didn't come from the San Carlos Life sign-in page.", 403);
  }
  const form = new URLSearchParams(await request.text());
  const { payload, user } = await session(request);
  const check = await checkAuthRequest(payload, issuer, form);
  if ("page" in check) return errorPage(check.page);
  if ("redirect" in check) return see(check.redirect);
  if (!user || !isStaffUser(user)) return errorPage("Your admin sign-in has ended. Start connecting again from your app.", 401);
  if (!checkConsentToken(form.get("consent") ?? "", user.id, check.ok)) return errorPage("This page expired. Start connecting again from your app.");

  const back = new URL(check.ok.redirectUri);
  if (check.ok.state) back.searchParams.set("state", check.ok.state);
  back.searchParams.set("iss", issuer);
  if (form.get("decision") !== "allow") {
    back.searchParams.set("error", "access_denied");
    back.searchParams.set("error_description", "The editor didn't allow access.");
    return see(back.href);
  }
  const client = await findClient(payload, check.ok.clientId);
  if (!client) return errorPage("This app isn't registered with the website.");
  back.searchParams.set("code", await issueCode(payload, user, client, check.ok));
  return see(back.href);
}

export const dynamic = "force-dynamic";
