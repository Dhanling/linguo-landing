// [b2b-pendataan-peserta-v1] Form pendataan peserta kelas B2B (korporat).
//
// Satu link per kontrak — corporate_leads.intake_token — dibagikan ke PIC
// perusahaan lalu diteruskan ke tiap peserta. Tiap kiriman = satu peserta.
// Semua lewat SERVICE ROLE dengan token sebagai satu-satunya kunci (pola sama
// dengan /api/pendataan).
//
//   GET  /api/pendataan-b2b?token=<uuid> -> nama perusahaan + bahasa kelas
//   POST /api/pendataan-b2b              -> RPC b2b_intake_submit: upsert
//        corporate_participants, buka e-book A1 gratis 6 bln, WA sambutan CS
//        (sql/20261103_b2b_pendataan_peserta.sql di repo dashboard)

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sb(path: string, init: RequestInit = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      ...(init.headers || {}),
    },
  });
}

const clean = (v: unknown, max = 300): string | null => {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s.slice(0, max) : null;
};

export async function GET(req: NextRequest) {
  const token = (req.nextUrl.searchParams.get("token") || "").trim();
  if (!UUID_RE.test(token)) {
    return NextResponse.json({ error: "Link tidak sah" }, { status: 404 });
  }
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json({ error: "Server belum dikonfigurasi" }, { status: 500 });
  }
  const res = await sb(
    `corporate_leads?intake_token=eq.${token}&archived_at=is.null&select=company_name,languages,level,logo_url`,
  );
  if (!res.ok) {
    console.error("Pendataan B2B GET error:", await res.text());
    return NextResponse.json({ error: "Gagal membaca form" }, { status: 500 });
  }
  const rows = await res.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const lead = rows[0] as { company_name: string; languages: string[] | null; level: string | null; logo_url: string | null };
  return NextResponse.json({
    company_name: lead.company_name,
    language: (lead.languages || [])[0] || null,
    level: lead.level,
    logo_url: lead.logo_url,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = (body?.token || "").trim();
    if (!UUID_RE.test(token)) {
      return NextResponse.json({ error: "Link tidak sah" }, { status: 404 });
    }

    const name = clean(body.name, 120);
    const nickname = clean(body.nickname, 60);
    const whatsapp = clean(body.whatsapp, 30);
    const email = clean(body.email, 160)?.toLowerCase() || null;
    const department = clean(body.department, 120);
    const jobTitle = clean(body.job_title, 120);
    const city = clean(body.city, 120);
    const priorExperience = clean(body.prior_experience, 300);
    const learningGoal = clean(body.learning_goal, 1000);
    const schedule = clean(body.preferred_schedule, 600);

    if (!name) return NextResponse.json({ error: "Nama lengkap wajib diisi" }, { status: 400 });
    if (!nickname) return NextResponse.json({ error: "Nama panggilan wajib diisi" }, { status: 400 });
    if (!whatsapp || whatsapp.replace(/\D/g, "").length < 9) {
      return NextResponse.json({ error: "Nomor WhatsApp wajib diisi dengan benar" }, { status: 400 });
    }
    if (!email) return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 });
    if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Format email belum benar" }, { status: 400 });
    if (!department) return NextResponse.json({ error: "Divisi / departemen wajib diisi" }, { status: 400 });
    if (!priorExperience) return NextResponse.json({ error: "Pengalaman belajar wajib dipilih" }, { status: 400 });
    if (!schedule) return NextResponse.json({ error: "Pilih minimal 1 hari dan 1 jam yang kamu bisa" }, { status: 400 });

    const res = await sb("rpc/b2b_intake_submit", {
      method: "POST",
      body: JSON.stringify({
        p_token: token,
        p: {
          name, nickname, whatsapp, email, department, job_title: jobTitle, city,
          prior_experience: priorExperience, learning_goal: learningGoal, preferred_schedule: schedule,
        },
      }),
    });
    if (!res.ok) {
      console.error("Pendataan B2B POST error:", await res.text());
      return NextResponse.json({ error: "Gagal menyimpan" }, { status: 500 });
    }
    const out = (await res.json()) as { ok?: boolean; error?: string; ebook?: string | null; expires_at?: string | null };
    if (out?.error === "not_found") return NextResponse.json({ error: "Link tidak sah" }, { status: 404 });
    if (!out?.ok) return NextResponse.json({ error: "Data belum lengkap" }, { status: 400 });
    return NextResponse.json({ success: true, ebook: out.ebook || null, expires_at: out.expires_at || null });
  } catch (err) {
    console.error("Pendataan B2B error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
