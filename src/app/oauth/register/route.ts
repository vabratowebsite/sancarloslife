import { clientIp, json, oauthError, preflight } from "@/lib/oauth/http";
import { rateLimited, registerClient } from "@/lib/oauth/server";
import { getPayloadClient } from "@/lib/payload";

/** RFC 7591 dynamic client registration (how claude.ai and ChatGPT add a connector). */
export async function POST(request: Request) {
  if (rateLimited(`register:${clientIp(request)}`, 10, 60 * 60_000)) return json({ error: "slow_down", error_description: "Too many registrations; try again later." }, 429);
  try {
    const body = await request.json().catch(() => null);
    const payload = await getPayloadClient();
    return json(await registerClient(payload, body), 201);
  } catch (e) {
    return oauthError(e);
  }
}
export const OPTIONS = preflight;
export const dynamic = "force-dynamic";
