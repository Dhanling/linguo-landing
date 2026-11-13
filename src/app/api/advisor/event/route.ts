// [ai-funnel-v1] Event metrik dari klien Konsultan (saat ini: klik CTA).
// Event lain (started / plan_generated / lead_saved) dicatat di server.

import { NextRequest } from "next/server";
import { batasLaju, ipPemanggil } from "@/lib/rateLimit";
import { logAdvisorEvent } from "@/lib/advisor/leads";
import { readAdAttribution } from "@/lib/adAttributionServer";
import { aiSourceFromVisit } from "@/lib/advisor/aiSource";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = ipPemanggil(req.headers);
  if (!(await batasLaju(`advisor-ev:${ip}`, 600, 60))) return new Response(null, { status: 204 });
  const b = ((await req.json().catch(() => null)) || {}) as Record<string, unknown>;
  if (b.event !== "advisor_cta_clicked") return new Response(null, { status: 204 });
  const str = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : null);
  await logAdvisorEvent("advisor_cta_clicked", "web", str(b.sessionId, 40), {
    label: str(b.label, 80),
    url: str(b.url, 300),
    ai_source: (() => {
      const a = readAdAttribution(req);
      return aiSourceFromVisit(a.utm_source, a.referrer);
    })(),
  });
  return new Response(null, { status: 204 });
}
