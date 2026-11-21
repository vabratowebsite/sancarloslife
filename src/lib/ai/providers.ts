import "server-only";

import { mockAnswer } from "./formats";

/**
 * One call shape for every AI provider: system + user text in, text out.
 * Anthropic uses its Messages API; OpenAI, Gemini, OpenRouter and any
 * OpenAI-compatible server use Chat Completions. "mock" returns a canned answer
 * for tests and never leaves the server.
 */

export type Provider = "anthropic" | "openai" | "gemini" | "openrouter" | "openai-compatible" | "mock";

export type Connection = {
  provider: Provider;
  model: string;
  apiKey: string; // decrypted, server only
  baseUrl?: string | null;
  maxOutputTokens?: number | null;
};

export type AiResult = { text: string; inputTokens?: number; outputTokens?: number };

const BASE: Record<Exclude<Provider, "anthropic" | "mock" | "openai-compatible">, string> = {
  openai: "https://api.openai.com/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai",
  openrouter: "https://openrouter.ai/api/v1",
};

export const mockAllowed = () => process.env.NODE_ENV !== "production" || process.env.AI_ALLOW_MOCK === "1";

/** Set by tests: what the mock provider answers. */
let mockReply: ((system: string, user: string) => string) | null = null;
export const setMockReply = (fn: typeof mockReply) => {
  mockReply = fn;
};

async function post(url: string, headers: Record<string, string>, body: unknown, timeoutMs = 120_000) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await res.text();
  if (!res.ok) {
    // Never echo request headers (they hold the key); the provider's message is enough.
    let msg = text.slice(0, 300);
    try {
      const j = JSON.parse(text) as { error?: { message?: string } | string };
      msg = typeof j.error === "string" ? j.error : (j.error?.message ?? msg);
    } catch {
      /* not JSON */
    }
    throw new Error(`The AI provider answered ${res.status}: ${msg}`);
  }
  return JSON.parse(text) as Record<string, unknown>;
}

export async function callAI(conn: Connection, system: string, user: string): Promise<AiResult> {
  const maxTokens = conn.maxOutputTokens || 8000;
  if (conn.provider === "mock") {
    if (!mockAllowed()) throw new Error("The test AI is turned off in production.");
    const format = system.includes('"excerpt"') ? "blog" : "desk-page";
    return { text: mockReply ? mockReply(system, user) : mockAnswer(format, user) };
  }
  if (conn.provider === "anthropic") {
    const j = await post(
      `${(conn.baseUrl || "https://api.anthropic.com").replace(/\/$/, "")}/v1/messages`,
      { "x-api-key": conn.apiKey, "anthropic-version": "2023-06-01" },
      { model: conn.model, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] },
    );
    const content = (j.content as { type: string; text?: string }[] | undefined) ?? [];
    const usage = j.usage as { input_tokens?: number; output_tokens?: number } | undefined;
    return { text: content.filter((c) => c.type === "text").map((c) => c.text).join(""), inputTokens: usage?.input_tokens, outputTokens: usage?.output_tokens };
  }
  const base = (conn.provider === "openai-compatible" ? conn.baseUrl : conn.baseUrl || BASE[conn.provider])?.replace(/\/$/, "");
  if (!base || !/^https:\/\//.test(base)) throw new Error("This connection needs an https base URL.");
  const j = await post(
    `${base}/chat/completions`,
    { Authorization: `Bearer ${conn.apiKey}` },
    {
      model: conn.model,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    },
  );
  const choice = (j.choices as { message?: { content?: string } }[] | undefined)?.[0];
  const usage = j.usage as { prompt_tokens?: number; completion_tokens?: number } | undefined;
  return { text: choice?.message?.content ?? "", inputTokens: usage?.prompt_tokens, outputTokens: usage?.completion_tokens };
}
