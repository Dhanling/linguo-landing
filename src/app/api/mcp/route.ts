// [ai-funnel-v1] MCP server Linguo — Streamable HTTP, tanpa penyimpanan sesi.
//
// Ditulis tanpa SDK supaya tidak menambah dependensi: server cukup menjawab
// JSON-RPC lewat POST dengan `Content-Type: application/json` (diizinkan
// spesifikasi Streamable HTTP). GET (stream SSE dari server) → 405.
//
// [ai-kanal-v1] Membedakan ChatGPT vs Claude vs klien lain:
// saat `initialize`, klien mengirim clientInfo.name. Server membalas header
// `Mcp-Session-Id` = "<uuid>.<Label-Klien>" dan klien WAJIB mengirim header itu
// lagi di setiap request berikutnya (aturan spesifikasi MCP). Jadi tiap
// tools/call tahu klien asalnya TANPA tabel sesi. Klien yang tidak mengirim
// header jatuh ke tebakan dari User-Agent.
//
// Semua tool memanggil lib/advisor/* yang sama dengan Konsultan web.
// Belum ada OAuth (versi pertama tanpa data pengguna). Kalau nanti butuh login
// siswa: tambahkan cek Bearer token + /.well-known/oauth-protected-resource.

import { NextRequest, after } from "next/server";
import { batasLaju, ipPemanggil } from "@/lib/rateLimit";
import { toolsFor, runTool } from "@/lib/advisor/tools";
import { logAdvisorEvent } from "@/lib/advisor/leads";
import { mcpClientLabel, MCP_CLIENT_LABELS } from "@/lib/advisor/aiSource";
import { BRAND_FACTS } from "@/lib/brand-facts";
import type { LearningPlan } from "@/lib/advisor/plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPPORTED_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];
const LATEST = SUPPORTED_VERSIONS[0];
const SERVER_INFO = { name: "linguo", title: "Linguo.id", version: "1.1.0" };
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
type Caller = { ip: string; ua: string; sessionUuid: string | null; client: string };

const ok = (id: RpcId, result: unknown) => ({ jsonrpc: "2.0", id, result });
const err = (id: RpcId, code: number, message: string) => ({ jsonrpc: "2.0", id, error: { code, message } });

const slug = (label: string) => label.replace(/\s+/g, "-");
const LABEL_BY_SLUG = new Map(MCP_CLIENT_LABELS.map((l) => [slug(l), l]));
const SESSION_RE = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.([A-Za-z-]{1,40})$/;

function callerFrom(req: NextRequest): Caller {
  const ua = (req.headers.get("user-agent") || "").slice(0, 200);
  const m = (req.headers.get("mcp-session-id") || "").match(SESSION_RE);
  const fromSession = m ? LABEL_BY_SLUG.get(m[2]) : undefined;
  return {
    ip: ipPemanggil(req.headers),
    ua,
    sessionUuid: m ? m[1] : null,
    client: fromSession ?? mcpClientLabel(null, ua),
  };
}

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

async function handle(
  msg: RpcMsg,
  caller: Caller,
): Promise<{ body: object | null; sessionHeader?: string }> {
  const isRequest = msg && typeof msg === "object" && "id" in msg && msg.id !== undefined;
  if (!msg || typeof msg !== "object" || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
    return { body: isRequest ? err(msg.id ?? null, -32600, "Invalid Request") : null };
  }
  if (!isRequest) return { body: null }; // notifikasi → tak dijawab
  const id = msg.id as RpcId;
  const params = msg.params && typeof msg.params === "object" ? msg.params : {};

  switch (msg.method) {
    case "initialize": {
      const asked = typeof params.protocolVersion === "string" ? params.protocolVersion : LATEST;
      const info = (params.clientInfo && typeof params.clientInfo === "object" ? params.clientInfo : {}) as Record<string, unknown>;
      const clientName = typeof info.name === "string" ? info.name.slice(0, 80) : null;
      const clientVersion = typeof info.version === "string" ? info.version.slice(0, 40) : null;
      const client = mcpClientLabel(clientName, caller.ua);
      const sessionUuid = crypto.randomUUID();
      after(() => logAdvisorEvent("mcp_connected", "mcp", sessionUuid, {
        client,
        client_name: clientName,
        client_version: clientVersion,
        user_agent: caller.ua || null,
        protocol: asked,
      }));
      return {
        body: ok(id, {
          protocolVersion: SUPPORTED_VERSIONS.includes(asked) ? asked : LATEST,
          capabilities: { tools: { listChanged: false } },
          serverInfo: SERVER_INFO,
          instructions: INSTRUCTIONS,
        }),
        sessionHeader: `${sessionUuid}.${slug(client)}`,
      };
    }
    case "ping":
      return { body: ok(id, {}) };
    case "tools/list":
      return { body: ok(id, { tools: toolList() }) };
    case "tools/call": {
      const name = typeof params.name === "string" ? params.name : "";
      if (!toolsFor("mcp").some((t) => t.name === name)) return { body: err(id, -32602, `Unknown tool: ${name}`) };
      if (name === "request_trial" && !(await batasLaju(`mcp-trial:${caller.ip}`, 3600, 5))) {
        return {
          body: ok(id, {
            content: [{ type: "text", text: "Rate limit reached for trial requests. Please try again later." }],
            isError: true,
          }),
        };
      }
      const { ok: fine, result } = await runTool(name, params.arguments ?? {}, {
        channel: "mcp",
        sessionId: caller.sessionUuid,
        ip: caller.ip,
        via: caller.client,
      });
      const failed = !fine || (result as { ok?: boolean })?.ok === false;
      after(() => logAdvisorEvent("mcp_tool_called", "mcp", caller.sessionUuid, {
        tool: name,
        client: caller.client,
        ok: !failed,
      }));
      if (name === "estimate_learning_plan" && (result as LearningPlan)?.ok) {
        const p = result as LearningPlan;
        after(() => logAdvisorEvent("advisor_plan_generated", "mcp", caller.sessionUuid, {
          client: caller.client,
          language: p.language.name,
          target_level: p.target_level,
          program: p.program,
          estimated_cost_idr: p.estimated_cost_idr,
        }));
      }
      return {
        body: ok(id, {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          structuredContent: result && typeof result === "object" && !Array.isArray(result) ? result : { result },
          isError: failed,
        }),
      };
    }
    case "resources/list":
      return { body: ok(id, { resources: [] }) };
    case "prompts/list":
      return { body: ok(id, { prompts: [] }) };
    default:
      return { body: err(id, -32601, `Method not found: ${msg.method}`) };
  }
}

export async function POST(req: NextRequest) {
  const caller = callerFrom(req);
  if (!(await batasLaju(`mcp:${caller.ip}`, 600, 200))) {
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
  const results = await Promise.all(msgs.map((m) => handle(m, caller)));
  const out = results.map((r) => r.body).filter(Boolean);
  const sessionHeader = results.find((r) => r.sessionHeader)?.sessionHeader;
  const headers: Record<string, string> = { ...CORS, "Cache-Control": "no-store", "Mcp-Protocol-Version": LATEST };
  if (sessionHeader) headers["Mcp-Session-Id"] = sessionHeader;
  if (!out.length) return new Response(null, { status: 202, headers });
  return Response.json(batch ? out : out[0], { headers });
}

export async function GET() {
  return new Response("Linguo MCP server: use POST (Streamable HTTP). Docs: https://linguo.id/llms.txt", {
    status: 405,
    headers: { ...CORS, Allow: "POST, OPTIONS" },
  });
}

// Mengakhiri sesi: tak ada yang disimpan di server, cukup diiyakan.
export async function DELETE() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
