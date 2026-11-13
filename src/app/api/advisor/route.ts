// [ai-funnel-v1] Konsultan Linguo — percakapan streaming + tool calling.
// LLM hanya untuk percakapan; semua angka datang dari lib/advisor (deterministik).
//
// Respons = NDJSON, satu objek per baris:
//   {"t":"text","v":"..."}   potongan teks balasan
//   {"t":"plan","v":{...},"input":{...}}  rencana dari estimate_learning_plan (untuk kartu UI + simpan lead)
//   {"t":"error","v":"..."}  pesan error ramah
//   {"t":"done"}

import { NextRequest } from "next/server";
import { batasLaju, ipPemanggil } from "@/lib/rateLimit";
import { buildAdvisorSystemPrompt } from "@/lib/advisor/prompt";
import { streamCompletion, type ChatMessage } from "@/lib/advisor/llm";
import { openAiToolSpecs, runTool } from "@/lib/advisor/tools";
import { logAdvisorEvent, upsertAdvisorSession, UUID_RE } from "@/lib/advisor/leads";
import { WA_ADMIN_URL } from "@/lib/advisor/catalog";
import type { LearningPlan } from "@/lib/advisor/plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_TURNS = 30;
const MAX_CHARS = 1500;
const MAX_TOOL_ROUNDS = 4;

type InMsg = { role: "user" | "assistant"; content: string };

function parseBody(body: unknown): { sessionId: string; messages: InMsg[] } | string {
  if (!body || typeof body !== "object") return "Body tidak valid";
  const b = body as Record<string, unknown>;
  const sessionId = typeof b.sessionId === "string" ? b.sessionId : "";
  if (!UUID_RE.test(sessionId)) return "sessionId tidak valid";
  if (!Array.isArray(b.messages) || b.messages.length === 0) return "messages kosong";
  if (b.messages.length > MAX_TURNS * 2) return "Percakapan terlalu panjang — mulai sesi baru ya.";
  const messages: InMsg[] = [];
  for (const m of b.messages) {
    if (!m || typeof m !== "object") return "Format pesan tidak valid";
    const { role, content } = m as Record<string, unknown>;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return "Format pesan tidak valid";
    const c = content.trim();
    if (!c) continue;
    messages.push({ role, content: c.slice(0, role === "user" ? MAX_CHARS : 4000) });
  }
  if (messages[messages.length - 1]?.role !== "user") return "Pesan terakhir harus dari pengguna";
  return { sessionId, messages };
}

export async function POST(req: NextRequest) {
  const ip = ipPemanggil(req.headers);
  if (!(await batasLaju(`advisor:${ip}`, 600, 40))) {
    return Response.json({ error: "Terlalu banyak pesan. Coba lagi beberapa menit lagi." }, { status: 429 });
  }
  const parsed = parseBody(await req.json().catch(() => null));
  if (typeof parsed === "string") return Response.json({ error: parsed }, { status: 400 });
  const { sessionId, messages } = parsed;

  const userTurns = messages.filter((m) => m.role === "user").length;
  if (userTurns === 1) void logAdvisorEvent("advisor_started", "web", sessionId, { path: "/konsultasi" });

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (o: unknown) => controller.enqueue(enc.encode(JSON.stringify(o) + "\n"));
      const convo: ChatMessage[] = [{ role: "system", content: buildAdvisorSystemPrompt() }, ...messages];
      try {
        for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
          const last = round === MAX_TOOL_ROUNDS;
          const { text, toolCalls } = await streamCompletion({
            messages: convo,
            tools: last ? undefined : openAiToolSpecs("web"),
            onText: (v) => send({ t: "text", v }),
            signal: req.signal,
          });
          if (!toolCalls.length) break;
          convo.push({ role: "assistant", content: text || null, tool_calls: toolCalls });
          for (const tc of toolCalls) {
            let args: unknown = {};
            try {
              args = JSON.parse(tc.function.arguments || "{}");
            } catch {
              /* argumen rusak → tool menolak dengan pesan validasi */
            }
            const { result } = await runTool(tc.function.name, args, { channel: "web", sessionId, ip });
            if (tc.function.name === "estimate_learning_plan" && (result as LearningPlan)?.ok) {
              const plan = result as LearningPlan;
              send({ t: "plan", v: plan, input: args });
              void upsertAdvisorSession(sessionId, "web", { plan, answers: args as Record<string, unknown> });
              void logAdvisorEvent("advisor_plan_generated", "web", sessionId, {
                language: plan.language.name,
                target_level: plan.target_level,
                program: plan.program,
                total_sessions: plan.total_sessions,
                estimated_cost_idr: plan.estimated_cost_idr,
              });
            }
            convo.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result).slice(0, 12000) });
          }
        }
      } catch (e) {
        if (!req.signal.aborted) {
          console.error("[advisor] gagal:", e);
          send({
            t: "error",
            v: `Maaf, konsultan sedang gangguan. Kamu bisa langsung tanya admin di WhatsApp: ${WA_ADMIN_URL}`,
          });
        }
      }
      send({ t: "done" });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
