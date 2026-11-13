// [ai-funnel-v1] Penyimpanan lead & event Konsultan AI / MCP. SERVER ONLY.
//
// Lead masuk ke tabel `leads` yang sudah ada (halaman Leads admin + WA Inbox
// langsung bisa follow up), dengan source "web_advisor" atau "mcp".
// Rincian rencana + event metrik masuk ke advisor_sessions / advisor_events
// (supabase/sql/001_advisor_sessions.sql). Kedua tabel itu FAIL-OPEN: kalau
// SQL-nya belum dijalankan, lead tetap tersimpan di `leads`.

import type { LearningPlan } from "./plan";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export type AdvisorChannel = "web" | "mcp";
export const LEAD_SOURCE: Record<AdvisorChannel, string> = { web: "web_advisor", mcp: "mcp" };

export const ADVISOR_EVENTS = [
  "advisor_started",
  "advisor_plan_generated",
  "advisor_cta_clicked",
  "advisor_lead_saved",
  // [ai-kanal-v1] MCP: sesi tersambung (initialize) & tiap pemanggilan tool.
  "mcp_connected",
  "mcp_tool_called",
] as const;
export type AdvisorEvent = (typeof ADVISOR_EVENTS)[number];

async function rest(path: string, init: RequestInit & { prefer?: string } = {}) {
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("supabase env kosong");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(init.prefer ? { Prefer: init.prefer } : {}),
    },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`${path} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res;
}

/** 0812… / +62 812… / 812… → 62812…; null kalau tidak masuk akal. */
export function normWa(v: string | null | undefined): string | null {
  let d = String(v || "").replace(/\D/g, "");
  if (d.startsWith("0")) d = "62" + d.slice(1);
  else if (d.startsWith("8")) d = "62" + d;
  return d.length >= 10 && d.length <= 15 ? d : null;
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function logAdvisorEvent(
  event: AdvisorEvent,
  channel: AdvisorChannel,
  sessionId: string | null,
  meta: Record<string, unknown> = {},
): Promise<void> {
  try {
    await rest("advisor_events", {
      method: "POST",
      prefer: "return=minimal",
      body: JSON.stringify({
        session_id: sessionId && UUID_RE.test(sessionId) ? sessionId : null,
        channel,
        event,
        meta,
      }),
    });
  } catch (e) {
    console.warn("[advisor] event gagal disimpan:", (e as Error).message);
  }
}

/** Simpan/perbarui ringkasan sesi (dipanggil saat rencana jadi & saat lead tersimpan). */
export async function upsertAdvisorSession(
  sessionId: string,
  channel: AdvisorChannel,
  patch: { plan?: LearningPlan | null; answers?: Record<string, unknown>; lead_id?: string | null },
): Promise<void> {
  if (!UUID_RE.test(sessionId)) return;
  try {
    const plan = patch.plan ?? null;
    await rest("advisor_sessions?on_conflict=id", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      body: JSON.stringify({
        id: sessionId,
        channel,
        ...(plan
          ? {
              plan,
              language: plan.language.name,
              target_level: plan.target_level,
              program: plan.program,
              estimated_cost_idr: plan.estimated_cost_idr,
            }
          : {}),
        ...(patch.answers ? { answers: patch.answers } : {}),
        ...(patch.lead_id ? { lead_id: patch.lead_id } : {}),
        updated_at: new Date().toISOString(),
      }),
    });
  } catch (e) {
    console.warn("[advisor] sesi gagal disimpan:", (e as Error).message);
  }
}

export type LeadInput = {
  channel: AdvisorChannel;
  name: string;
  whatsapp: string;
  email?: string | null;
  language?: string | null;
  program?: string | null;
  level?: string | null;
  goal?: string | null;
  schedule?: string | null;
  notes?: string | null;
  sessionId?: string | null;
  plan?: LearningPlan | null;
  /** [ai-kanal-v1] Asal: klien MCP ("ChatGPT", "Claude") atau sumber AI pengunjung web. */
  via?: string | null;
};

export type LeadResult =
  | { ok: true; lead_id: string | null; duplicate: boolean }
  | { ok: false; error: string };

/**
 * Simpan lead. Anti-spam: nomor WA yang sama dari kanal AI dalam 24 jam
 * terakhir tidak dibuat baris baru (dianggap duplikat, tetap "ok").
 */
export async function saveLead(input: LeadInput): Promise<LeadResult> {
  const wa = normWa(input.whatsapp);
  const name = String(input.name || "").trim().slice(0, 80);
  if (!name || name.length < 2) return { ok: false, error: "Nama wajib diisi." };
  if (!wa) return { ok: false, error: "Nomor WhatsApp tidak valid." };
  const email = String(input.email || "").trim().toLowerCase().slice(0, 120);
  const emailOk = !email || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  if (!emailOk) return { ok: false, error: "Email tidak valid." };

  const source = LEAD_SOURCE[input.channel];
  try {
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const dup = await rest(
      `leads?select=id&wa_number=eq.${wa}&source=in.(web_advisor,mcp)&created_at=gte.${encodeURIComponent(since)}&limit=1`,
    ).then((r) => r.json() as Promise<{ id: string }[]>);
    if (dup.length) {
      if (input.sessionId) await upsertAdvisorSession(input.sessionId, input.channel, { lead_id: dup[0].id });
      return { ok: true, lead_id: dup[0].id, duplicate: true };
    }

    const plan = input.plan;
    const planSummary = plan
      ? `Rencana AI: ${plan.language.name} ${plan.start_from} → ${plan.target_level}` +
        `${plan.target_exam_equivalent ? ` (≈ ${plan.target_exam_equivalent})` : ""}, ${plan.program}, ` +
        `${plan.total_sessions} sesi, ±${plan.estimated_months} bulan @${plan.sessions_per_week} sesi/minggu` +
        (plan.estimated_cost_idr ? `, estimasi Rp ${plan.estimated_cost_idr.toLocaleString("id-ID")}` : "")
      : null;
    const viaLabel = input.via
      ? input.channel === "mcp"
        ? `Via: ${input.via} (MCP)`
        : `Asal pengunjung: ${input.via}`
      : null;
    const reason = [viaLabel, planSummary, input.notes ? `Catatan: ${String(input.notes).slice(0, 400)}` : null]
      .filter(Boolean)
      .join(" | ");

    const res = await rest("leads?select=id", {
      method: "POST",
      prefer: "return=representation",
      body: JSON.stringify({
        name,
        wa_number: wa,
        email: email || null,
        language: input.language ? String(input.language).slice(0, 60) : plan?.language.name ?? null,
        program: input.program ? String(input.program).slice(0, 60) : plan?.program ?? null,
        level: input.level ? String(input.level).slice(0, 10) : plan?.start_from ?? null,
        source,
        learning_goal: input.goal ? String(input.goal).slice(0, 200) : plan?.goal ?? null,
        schedule_preference: input.schedule ? String(input.schedule).slice(0, 200) : null,
        reason: reason || null,
      }),
    });
    const rows = (await res.json()) as { id: string }[];
    const leadId = rows[0]?.id ?? null;
    if (input.sessionId) await upsertAdvisorSession(input.sessionId, input.channel, { lead_id: leadId, plan: plan ?? null });
    await logAdvisorEvent("advisor_lead_saved", input.channel, input.sessionId ?? null, {
      lead_id: leadId,
      language: plan?.language.name ?? input.language ?? null,
      program: plan?.program ?? input.program ?? null,
      estimated_cost_idr: plan?.estimated_cost_idr ?? null,
      via: input.via ?? null,
    });
    return { ok: true, lead_id: leadId, duplicate: false };
  } catch (e) {
    console.error("[advisor] simpan lead gagal:", (e as Error).message);
    return { ok: false, error: "Gagal menyimpan data. Silakan hubungi admin via WhatsApp." };
  }
}
