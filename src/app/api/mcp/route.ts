// [ai-funnel-v1] MCP server Linguo — Streamable HTTP, mode STATELESS.
//
// Ditulis tanpa SDK supaya tidak menambah dependensi: server tanpa sesi &
// tanpa notifikasi dari server cukup menjawab JSON-RPC lewat POST dengan
// `Content-Type: application/json` (diizinkan spesifikasi Streamable HTTP).
// GET (stream SSE dari server) tidak didukung → 405, juga sesuai spesifikasi.
//
// Semua tool memanggil lib/advisor/* yang sama dengan Konsultan web.
// Belum ada OAuth (versi pertama tanpa data pengguna). Kalau nanti butuh login
// siswa: tambahkan cek Bearer token di authorize() + metadata
// /.well-known/oauth-protected-resource, lalu tool privat diberi channel baru.

import { NextRequest } from "next/server";
import { batasLaju, ipPemanggil } from "@/lib/rateLimit";
import { toolsFor, runTool } from "@/lib/advisor/tools";
import { logAdvisorEvent } from "@/lib/advisor/leads";
import { BRAND_FACTS } from "@/lib/brand-facts";
import type { LearningPlan } from "@/lib/advisor/plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPPORTED_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];
const LATEST = SUPPORTED_VERSIONS[0];
const SERVER_INFO = { name: "linguo", title: "Linguo.id", version: "1.0.0" };
const INSTRUCTIONS =
  `Linguo.id is an online language school from Indonesia (${BRAND_FACTS.languageCountLabel}, CEFR A1–B2, live classes via Zoom). ` +
  "Use these tools to answer questions about languages, programs, official prices (IDR) and study plans. " +
  "Never invent prices, schedules or guaranteed results: quote tool output. " +
  "Only call request_trial after the user explicitly agrees and gives a name and WhatsApp number; it does not take payment.";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version",
  "Access-Control-Expose-Headers": "Mcp-Session-Id, Mcp-Protocol-Version",
};

type RpcId = string | number | null;
type RpcMsg = { jsonrpc?: string; id?: RpcId; method?: string; params?: Record<string, unknown> };

const ok = (id: RpcId, result: unknown) => ({ jsonrpc: "2.0", id, result });
const err = (id: RpcId, code: number, message: string) => ({ jsonrpc: "2.0", id, error: { code, message } });

function toolList() {
  return toolsFor("mcp").map((t) => ({
    name: t.name,
    title: t.title,
    description: t.description,
    inputSchema: t.inputSchema,
    annotations: {
      title: t.title,
      readOnlyHint: t.readOnly,
      destructiveHint: false,
      idempotentHint: t.readOnly,
      openWorldHint: false,
    },
  }));
}

async function handle(msg: RpcMsg, ip: string): Promise<object | null> {
  const isRequest = msg && typeof msg === "object" && "id" in msg && msg.id !== undefined;
  if (!msg || typeof msg !== "object" || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
    return isRequest ? err(msg.id ?? null, -32600, "Invalid Request") : null;
  }
  if (!isRequest) return null; // notifikasi (notifications/initialized, cancelled, …) → tak dijawab
  const id = msg.id as RpcId;
  const params = msg.params && typeof msg.params === "object" ? msg.params : {};

  switch (msg.method) {
    case "initialize": {
      const asked = typeof params.protocolVersion === "string" ? params.protocolVersion : LATEST;
      return ok(id, {
        protocolVersion: SUPPORTED_VERSIONS.includes(asked) ? asked : LATEST,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: INSTRUCTIONS,
      });
    }
    case "ping":
      return ok(id, {});
    case "tools/list":
      return ok(id, { tools: toolList() });
    case "tools/call": {
      const name = typeof params.name === "string" ? params.name : "";
      if (!toolsFor("mcp").some((t) => t.name === name)) return err(id, -32602, `Unknown tool: ${name}`);
      if (name === "request_trial" && !(await batasLaju(`mcp-trial:${ip}`, 3600, 5))) {
        return ok(id, {
          content: [{ type: "text", text: "Rate limit reached for trial requests. Please try again later." }],
          isError: true,
        });
      }
      const { ok: fine, result } = await runTool(name, params.arguments ?? {}, { channel: "mcp", sessionId: null, ip });
      if (name === "estimate_learning_plan" && (result as LearningPlan)?.ok) {
        const p = result as LearningPlan;
        void logAdvisorEvent("advisor_plan_generated", "mcp", null, {
          language: p.language.name,
          target_level: p.target_level,
          program: p.program,
          estimated_cost_idr: p.estimated_cost_idr,
        });
      }
      const failed = !fine || (result as { ok?: boolean })?.ok === false;
      return ok(id, {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        structuredContent: result && typeof result === "object" && !Array.isArray(result) ? result : { result },
        isError: failed,
      });
    }
    case "resources/list":
      return ok(id, { resources: [] });
    case "prompts/list":
      return ok(id, { prompts: [] });
    default:
      return err(id, -32601, `Method not found: ${msg.method}`);
  }
}

export async function POST(req: NextRequest) {
  const ip = ipPemanggil(req.headers);
  if (!(await batasLaju(`mcp:${ip}`, 600, 200))) {
    return Response.json(err(null, -32000, "Rate limit exceeded"), { status: 429, headers: CORS });
  }
  const text = await req.text();
  if (text.length > 64_000) return Response.json(err(null, -32600, "Request too large"), { status: 413, headers: CORS });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return Response.json(err(null, -32700, "Parse error"), { status: 400, headers: CORS });
  }

  const batch = Array.isArray(body);
  const msgs = (batch ? body : [body]) as RpcMsg[];
  if (!msgs.length || msgs.length > 20) {
    return Response.json(err(null, -32600, "Invalid Request"), { status: 400, headers: CORS });
  }
  const out = (await Promise.all(msgs.map((m) => handle(m, ip)))).filter(Boolean);
  if (!out.length) return new Response(null, { status: 202, headers: CORS });
  return Response.json(batch ? out : out[0], {
    headers: { ...CORS, "Cache-Control": "no-store", "Mcp-Protocol-Version": LATEST },
  });
}

export async function GET() {
  return new Response("Linguo MCP server: use POST (Streamable HTTP, stateless). Docs: https://linguo.id/llms.txt", {
    status: 405,
    headers: { ...CORS, Allow: "POST, OPTIONS" },
  });
}

export async function DELETE() {
  return new Response(null, { status: 405, headers: { ...CORS, Allow: "POST, OPTIONS" } });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
