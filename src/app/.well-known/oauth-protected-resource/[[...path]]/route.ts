import { json, preflight } from "@/lib/oauth/http";
import { issuerFor, metadata } from "@/lib/oauth/server";

/** RFC 9728 protected resource metadata for /mcp (also at /.well-known/oauth-protected-resource/mcp). */
export function GET(request: Request) {
  return json(metadata(issuerFor(request)).protectedResource, 200, { "Cache-Control": "public, max-age=3600" });
}
export const OPTIONS = preflight;
