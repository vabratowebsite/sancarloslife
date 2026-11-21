import { isStaffUser } from "@/access/roles";
import { getPayloadClient } from "@/lib/payload";
import { ToolError, TOOLS } from "@/lib/mcp/tools";

/**
 * The San Carlos Life website connector: a Model Context Protocol server
 * (Streamable HTTP transport, stateless, JSON responses) at /mcp, for Claude,
 * ChatGPT and other MCP clients.
 *
 * Sign-in: `Authorization: Bearer <API key>`, where the key is a staff user's
 * API key (admin → Users → the user → Enable API key). Each call acts as that
 * user with that user's permissions. Browser requests from other sites are
 * refused (Origin check).
 */

const SUPPORTED = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];
const LATEST = SUPPORTED[0];

type RpcId = string | number | null;
type RpcRequest = { jsonrpc: "2.0"; id?: RpcId; method: string; params?: Record<string, unknown> };

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...extra } });
const rpcError = (id: RpcId, code: number, message: string, status = 200) => json({ jsonrpc: "2.0", id, error: { code, message } }, status);

function allowedOrigin(origin: string | null) {
  if (!origin) return true; // MCP clients on servers don't send one
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const ok = [site, process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`, process.env.VERCEL_BRANCH_URL && `https://${process.env.VERCEL_BRANCH_URL}`];
  return ok.includes(origin);
}

async function authenticate(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const m = auth.match(/^Bearer\s+(\S{10,200})$/i);
  if (!m) return null;
  const payload = await getPayloadClient();
  // Payload's API-key strategy reads "users API-Key <key>".
  const { user } = await payload.auth({ headers: new Headers({ Authorization: `users API-Key ${m[1]}` }) });
  return user && isStaffUser(user) ? { payload, user } : null;
}

const unauthorized = () =>
  json({ jsonrpc: "2.0", id: null, error: { code: -32001, message: "Sign in with a staff user's API key: Authorization: Bearer <key>" } }, 401, {
    "WWW-Authenticate": 'Bearer realm="sancarloslife"',
  });

export async function POST(request: Request) {
  if (!allowedOrigin(request.headers.get("origin"))) return json({ error: "Origin not allowed" }, 403);
  const version = request.headers.get("mcp-protocol-version");
  if (version && !SUPPORTED.includes(version)) return rpcError(null, -32600, `Unsupported MCP-Protocol-Version: ${version}`, 400);

  let msg: unknown;
  try {
    msg = await request.json();
  } catch {
    return rpcError(null, -32700, "Parse error", 400);
  }
  if (Array.isArray(msg)) return rpcError(null, -32600, "Batching isn't supported; send one message per request.", 400);
  const req = msg as Partial<RpcRequest>;
  if (req?.jsonrpc !== "2.0" || typeof req.method !== "string") {
    // A JSON-RPC response from the client (we never send requests) or garbage.
    return "result" in (req ?? {}) || "error" in (req ?? {}) ? new Response(null, { status: 202 }) : rpcError(null, -32600, "Invalid request", 400);
  }
  const isNotification = !("id" in req) || req.id === undefined;
  if (isNotification) return new Response(null, { status: 202 }); // notifications/initialized, cancelled, …
  const id = req.id as RpcId;

  const session = await authenticate(request);
  if (!session) return unauthorized();

  switch (req.method) {
    case "initialize": {
      const asked = String(req.params?.protocolVersion ?? "");
      return json({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: SUPPORTED.includes(asked) ? asked : LATEST,
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: "sancarloslife", title: "San Carlos Life website", version: "1.0.0" },
          instructions:
            "Read San Carlos Life content and send drafts to its Approval queue. Before writing, call get_prompt for the format and follow it exactly; submit with submit_draft (new) or update_draft (revisions). Nothing you submit goes live until a person approves it. End every scheduled run with log_run.",
        },
      });
    }
    case "ping":
      return json({ jsonrpc: "2.0", id, result: {} });
    case "tools/list":
      return json({
        jsonrpc: "2.0",
        id,
        result: { tools: TOOLS.map(({ name, title, description, inputSchema, annotations }) => ({ name, title, description, inputSchema, annotations })) },
      });
    case "tools/call": {
      const name = String(req.params?.name ?? "");
      const tool = TOOLS.find((t) => t.name === name);
      if (!tool) return rpcError(id, -32602, `Unknown tool: ${name}`);
      try {
        const data = await tool.run((req.params?.arguments as Record<string, unknown>) ?? {}, session);
        const structured = data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>) : { items: data };
        return json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: structured, isError: false } });
      } catch (e) {
        const message = e instanceof ToolError ? e.message : "The tool failed on the server. Try again; if it keeps failing, tell the site admin.";
        if (!(e instanceof ToolError)) console.error(`mcp tool ${name}`, e);
        return json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: message }], isError: true } });
      }
    }
    default:
      return rpcError(id, -32601, `Method not found: ${req.method}`);
  }
}

/** No server-to-client stream; per the spec, GET answers 405. */
export function GET() {
  return new Response(null, { status: 405, headers: { Allow: "POST" } });
}
export function DELETE() {
  return new Response(null, { status: 405, headers: { Allow: "POST" } });
}

export const dynamic = "force-dynamic";
