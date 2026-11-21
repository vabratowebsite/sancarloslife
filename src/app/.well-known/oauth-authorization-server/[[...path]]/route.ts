import { json, preflight } from "@/lib/oauth/http";
import { issuerFor, metadata } from "@/lib/oauth/server";

/** RFC 8414 authorization server metadata. */
export function GET(request: Request) {
  return json(metadata(issuerFor(request)).authorizationServer, 200, { "Cache-Control": "public, max-age=3600" });
}
export const OPTIONS = preflight;
