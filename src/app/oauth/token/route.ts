import { clientIp, formOf, json, oauthError, preflight } from "@/lib/oauth/http";
import { authenticateClient, exchange, issuerFor, OAuthError, rateLimited } from "@/lib/oauth/server";
import { getPayloadClient } from "@/lib/payload";

/** Token endpoint: authorization_code (with PKCE) and refresh_token grants. */
export async function POST(request: Request) {
  if (rateLimited(`token:${clientIp(request)}`, 60, 10 * 60_000)) return json({ error: "slow_down", error_description: "Too many requests." }, 429);
  try {
    const form = await formOf(request).catch(() => {
      throw new OAuthError("invalid_request", "Couldn't read the request body.");
    });
    const payload = await getPayloadClient();
    const client = await authenticateClient(payload, request, form);
    return json(await exchange(payload, client, form, issuerFor(request)));
  } catch (e) {
    return oauthError(e);
  }
}
export const OPTIONS = preflight;
export const dynamic = "force-dynamic";
