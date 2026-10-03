import { NextRequest, NextResponse } from "next/server";
import { CEFR_QUESTIONS } from "@/app/silabus/[lang]/coba/cefrQuestions";
import { susunSoal, type BarisBank } from "@/lib/placementBank";

/*
 * /api/placement-questions  [placement-bank-acak-v1]
 * ------------------------------------------------------------------
 * POST { slug, sid?, email?, whatsapp? } → { questions: Question[] | null }
 *
 * Satu set soal placement test yang diambil acak dari bank soal
 * (placement_question_bank), mengutamakan soal yang belum pernah dikerjakan
 * orang itu. `questions: null` = bahasa ini belum punya bank soal / bank tak
 * terbaca → klien memakai soal tetap yang sudah dibawanya.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const kosong = () => NextResponse.json({ questions: null });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const slug = typeof body.slug === "string" ? body.slug : "";
    const statik = CEFR_QUESTIONS[slug];
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!statik || !url || !key) return kosong();

    const res = await fetch(url + "/rest/v1/rpc/placement_bank_for", {
      method: "POST",
      headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({
        p_slug: slug,
        p_student_id: typeof body.sid === "string" && UUID.test(body.sid) ? body.sid : null,
        p_email: typeof body.email === "string" ? body.email.slice(0, 200) : null,
        p_whatsapp: typeof body.whatsapp === "string" ? body.whatsapp.slice(0, 30) : null,
      }),
      cache: "no-store",
    });
    if (!res.ok) return kosong();
    const bank = (await res.json()) as BarisBank[];
    if (!Array.isArray(bank) || bank.length === 0) return kosong();

    return NextResponse.json({ questions: susunSoal(statik, bank) });
  } catch {
    return kosong();
  }
}
