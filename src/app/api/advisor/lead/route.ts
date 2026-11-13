// [ai-funnel-v1] Simpan lead dari form di akhir sesi Konsultan Linguo.
// Rencana DIHITUNG ULANG di server dari input-nya (bukan dipercaya dari klien),
// supaya angka di lead = angka resmi.

import { NextRequest } from "next/server";
import { batasLaju, ipPemanggil } from "@/lib/rateLimit";
import { saveLead, UUID_RE } from "@/lib/advisor/leads";
import { estimateLearningPlan, type LearningPlan } from "@/lib/advisor/plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const s = (v: unknown, max: number) => (typeof v === "string" || typeof v === "number" ? String(v).trim().slice(0, max) : "");

export async function POST(req: NextRequest) {
  const ip = ipPemanggil(req.headers);
  if (!(await batasLaju(`advisor-lead:${ip}`, 3600, 5))) {
    return Response.json({ ok: false, error: "Terlalu banyak percobaan. Coba lagi nanti." }, { status: 429 });
  }
  const b = ((await req.json().catch(() => null)) || {}) as Record<string, unknown>;
  // Honeypot: field tersembunyi yang diisi bot.
  if (s(b.website, 100)) return Response.json({ ok: true });

  const sessionId = s(b.sessionId, 40);
  let plan: LearningPlan | null = null;
  const pi = b.planInput && typeof b.planInput === "object" ? (b.planInput as Record<string, unknown>) : null;
  if (pi) {
    const r = estimateLearningPlan({
      language: s(pi.language, 60),
      current_level: s(pi.current_level, 10) || null,
      target_level: s(pi.target_level, 10),
      hours_per_week: Number(pi.hours_per_week),
      goal: s(pi.goal, 200) || null,
      format: s(pi.format, 20) || null,
    });
    if (r.ok) plan = r;
  }

  const r = await saveLead({
    channel: "web",
    name: s(b.name, 80),
    whatsapp: s(b.whatsapp, 25),
    email: s(b.email, 120) || null,
    schedule: s(b.schedule, 200) || null,
    sessionId: UUID_RE.test(sessionId) ? sessionId : null,
    plan,
  });
  return Response.json(r, { status: r.ok ? 200 : 400 });
}
