// Cloudflare Worker for simonnepirizstud.io. Static pages are served straight from assets;
// this script only answers /api/kickoff-chat, which relays the Kickoff chat to Claude.
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, RESPONSE_SCHEMA } from "./prompt.js";

const DEFAULT_MODEL = "claude-opus-5-5";
const MAX_MESSAGES = 120;
const MAX_BODY_BYTES = 300_000;
const MAX_USER_CHARS = 4_000;
const ALLOWED_ORIGINS = [/^https:\/\/(www\.)?simonnepirizstud\.io$/, /^https:\/\/([a-z0-9-]+-)?simonne-piriz-services\.[a-z0-9-]+\.workers\.dev$/, /^http:\/\/localhost(:\d+)?$/];

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

// The visitor's browser keeps the conversation and sends it each turn. Check its shape before relaying it.
function validMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) return false;
  if (messages[0].role !== "user" || messages[messages.length - 1].role !== "user") return false;
  return messages.every((m, i) => {
    if (!m || typeof m !== "object") return false;
    if (m.role !== (i % 2 === 0 ? "user" : "assistant")) return false;
    if (m.role === "user") return typeof m.content === "string" && m.content.trim() !== "" && m.content.length <= MAX_USER_CHARS;
    return Array.isArray(m.content) && m.content.length > 0;
  });
}

async function handleChat(request, env) {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const origin = request.headers.get("Origin");
  if (origin && !ALLOWED_ORIGINS.some((re) => re.test(origin))) return json({ error: "forbidden" }, 403);

  if (env.CHAT_LIMITER) {
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const { success } = await env.CHAT_LIMITER.limit({ key: ip });
    if (!success) return json({ error: "rate_limited" }, 429);
  }

  if (!env.ANTHROPIC_API_KEY) return json({ error: "not_configured" }, 503);

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return json({ error: "too_long" }, 413);
  let messages;
  try {
    ({ messages } = JSON.parse(raw));
  } catch (e) {
    return json({ error: "bad_request" }, 400);
  }
  if (!validMessages(messages)) return json({ error: "bad_request" }, 400);

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  try {
    const response = await client.beta.messages.create({
      model: env.CHAT_MODEL || DEFAULT_MODEL,
      max_tokens: 8000,
      // If a safety classifier declines a turn, Anthropic retries it on its recommended model.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: { type: "json_schema", schema: RESPONSE_SCHEMA } },
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      cache_control: { type: "ephemeral" },
      messages,
    });
    // Token counts only, never conversation content, so costs can be checked in Cloudflare's logs.
    console.log(JSON.stringify({ event: "kickoff_chat_turn", model: response.model, stop_reason: response.stop_reason, usage: response.usage }));
    return json({ content: response.content, stop_reason: response.stop_reason });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return json({ error: "busy" }, 429);
    if (error instanceof Anthropic.BadRequestError) {
      console.error("kickoff_chat bad request:", error.message);
      return json({ error: "bad_request" }, 400);
    }
    if (error instanceof Anthropic.APIError) {
      console.error(`kickoff_chat API error ${error.status}:`, error.message);
      return json({ error: "upstream" }, 502);
    }
    console.error("kickoff_chat error:", error);
    return json({ error: "upstream" }, 502);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/kickoff-chat") return handleChat(request, env);
    return env.ASSETS.fetch(request);
  },
};
