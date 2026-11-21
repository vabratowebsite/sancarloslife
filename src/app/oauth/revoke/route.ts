import { formOf, oauthError, preflight } from "@/lib/oauth/http";
import { authenticateClient, revoke } from "@/lib/oauth/server";
import { CORS } from "@/lib/oauth/http";
import { getPayloadClient } from "@/lib/payload";

/** RFC 7009 token revocation. */
export async function POST(request: Request) {
  try {
    const form = await formOf(request);
    const payload = await getPayloadClient();
    const client = await authenticateClient(payload, request, form);
    await revoke(payload, client, form.get("token") ?? "");
    return new Response(null, { status: 200, headers: { "Cache-Control": "no-store", ...CORS } });
  } catch (e) {
    return oauthError(e);
  }
}
export const OPTIONS = preflight;
export const dynamic = "force-dynamic";
