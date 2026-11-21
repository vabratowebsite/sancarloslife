import { expect, test } from "@playwright/test";

/**
 * The website connector (MCP at /mcp). Sign-in checks always run; the tool
 * round trip needs a staff API key: E2E_API_KEY=… pnpm test:e2e
 */
const key = process.env.E2E_API_KEY;
const rpc = (method: string, params?: object, id = 1) => ({ jsonrpc: "2.0", id, method, ...(params ? { params } : {}) });

test("refuses calls without a key, from other sites, and GET", async ({ request }) => {
  test.skip(test.info().project.name !== "desktop", "Runs once");
  expect((await request.post("/mcp", { data: rpc("tools/list") })).status()).toBe(401);
  expect((await request.post("/mcp", { data: rpc("ping"), headers: { Origin: "https://evil.example" } })).status()).toBe(403);
  expect((await request.get("/mcp")).status()).toBe(405);
});

test("initializes, lists tools and rejects a malformed draft", async ({ request }) => {
  test.skip(!key, "Set E2E_API_KEY to a staff user's API key to run");
  test.skip(test.info().project.name !== "desktop", "Runs once");
  const headers = { Authorization: `Bearer ${key}`, Accept: "application/json, text/event-stream" };
  const init = await (await request.post("/mcp", { headers, data: rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "e2e", version: "1" } }) })).json();
  expect(init.result.serverInfo.name).toBe("sancarloslife");
  const tools = await (await request.post("/mcp", { headers, data: rpc("tools/list") })).json();
  expect(tools.result.tools.map((t: { name: string }) => t.name)).toEqual(expect.arrayContaining(["get_prompt", "submit_draft", "update_draft", "log_run"]));
  const bad = await (await request.post("/mcp", { headers, data: rpc("tools/call", { name: "submit_draft", arguments: { format: "desk-page", data: { title: "x" } } }) })).json();
  expect(bad.result.isError).toBe(true);
});
