// [pendataan-siswa-private-v1] Endpoint form pendataan siswa — pengganti Google Form.
//
// Semua akses lewat SERVICE ROLE dengan token sebagai satu-satunya kunci:
// tabel `student_intake_forms` sengaja tidak punya policy untuk `anon` (lihat
// migrasi 20260805120000). Pola yang sama dipakai schedule-public.
//
//   GET  /api/pendataan?token=<uuid>  -> konteks form + jawaban yang sudah ada
//   POST /api/pendataan               -> simpan jawaban, tandai submitted

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SELECT_COLS = [
  "id", "token", "status", "contact_name", "contact_whatsapp", "contact_email",
  "language", "program", "level",
  "full_name", "nickname", "whatsapp", "email", "preferred_schedule",
  "age", "birth_date", "institution", "learning_goal", "submitted_at",
  // [pendataan-siswa-private-v2] migrasi 20260807090000
  "hobby", "prior_experience",
  // [pendataan-domisili-referral-v1] migrasi pendataan_domisili_referral_20260813
  "province", "city", "referral_source",
].join(",");

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

/** Umur dihitung di server dari tanggal lahir, bukan dari yang dikirim browser:
 *  angka usia dan tanggal lahir yang saling bertentangan adalah bug administrasi
 *  yang baru ketahuan berbulan-bulan kemudian. */
function ageFromBirthDate(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - d.getUTCFullYear();
  const beforeBirthday =
    now.getUTCMonth() < d.getUTCMonth() ||
    (now.getUTCMonth() === d.getUTCMonth() && now.getUTCDate() < d.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age >= 1 && age <= 120 ? age : null;
}

const clean = (v: unknown, max = 300): string | null => {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s.slice(0, max) : null;
};

export async function GET(req: NextRequest) {
  const token = (req.nextUrl.searchParams.get("token") || "").trim();
  // Link yang kepotong waktu disalin dari WhatsApp harus terbaca sebagai
  // "link tidak sah", bukan sebagai galat server.
  if (!UUID_RE.test(token)) {
    return NextResponse.json({ error: "Link tidak sah" }, { status: 404 });
  }

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json({ error: "Server belum dikonfigurasi" }, { status: 500 });
  }

  const res = await sb(`student_intake_forms?token=eq.${token}&select=${SELECT_COLS}`);
  if (!res.ok) {
    console.error("Pendataan GET error:", await res.text());
    return NextResponse.json({ error: "Gagal membaca form" }, { status: 500 });
  }
  const rows = await res.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = (body?.token || "").trim();
    if (!UUID_RE.test(token)) {
      return NextResponse.json({ error: "Link tidak sah" }, { status: 404 });
    }

    const fullName = clean(body.full_name, 120);
    const whatsapp = clean(body.whatsapp, 30);
    const nickname = clean(body.nickname, 60);
    const email = clean(body.email, 160);
    const birthDate = clean(body.birth_date, 10);
    const institution = clean(body.institution, 160);
    const province = clean(body.province, 80);
    const city = clean(body.city, 120);
    const referralSource = clean(body.referral_source, 200);
    const hobby = clean(body.hobby, 300);
    const priorExperience = clean(body.prior_experience, 300);
    const learningGoal = clean(body.learning_goal, 1000);
    const schedule = clean(body.preferred_schedule, 4000);

    // [pendataan-semua-wajib-v1] Semua isian wajib — pagarnya ada di sini juga,
    // bukan cuma di formulirnya: yang menembak endpoint ini langsung tetap tidak
    // boleh menitipkan data setengah jadi yang nanti dikejar admin satu per satu.
    if (!fullName) return NextResponse.json({ error: "Nama lengkap wajib diisi" }, { status: 400 });
    if (!nickname) return NextResponse.json({ error: "Nama panggilan wajib diisi" }, { status: 400 });
    if (!birthDate) return NextResponse.json({ error: "Tanggal lahir wajib diisi" }, { status: 400 });
    if (!province) return NextResponse.json({ error: "Provinsi domisili wajib diisi" }, { status: 400 });
    if (!city) return NextResponse.json({ error: "Kota / kabupaten domisili wajib diisi" }, { status: 400 });
    if (!referralSource) return NextResponse.json({ error: "Pilih dari mana kamu tahu Linguo" }, { status: 400 });
    if (!institution) return NextResponse.json({ error: "Sekolah / instansi / perusahaan wajib diisi" }, { status: 400 });
    if (!hobby) return NextResponse.json({ error: "Hobi & minat wajib diisi" }, { status: 400 });
    if (!whatsapp) return NextResponse.json({ error: "Nomor WhatsApp wajib diisi" }, { status: 400 });
    if (!email) return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 });
    if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Format email belum benar" }, { status: 400 });
    if (!priorExperience) return NextResponse.json({ error: "Pengalaman belajar wajib diisi" }, { status: 400 });
    if (!learningGoal) return NextResponse.json({ error: "Tujuan belajar wajib diisi" }, { status: 400 });
    if (!schedule) return NextResponse.json({ error: "Pilih minimal 1 blok waktu yang kamu bisa" }, { status: 400 });

    const payload = {
      full_name: fullName,
      nickname,
      whatsapp,
      email,
      // [pendataan-wizard-v3] Kisi 30 menit: kotak berurutan digabung jadi satu
      // rentang, jadi normalnya pendek — tapi pilihan yang berselang-seling bisa
      // jadi puluhan rentang. Kolomnya `text`, batas di sini cuma pagar sanitasi;
      // dibuat longgar supaya pilihan terakhir tidak terpotong diam-diam.
      preferred_schedule: schedule,
      birth_date: birthDate,
      age: ageFromBirthDate(birthDate),
      institution,
      // [pendataan-domisili-referral-v1] Domisili & sumber tahu Linguo. Trigger
      // tg_intake_form_sync menyalinnya ke students.province/city/source.
      province,
      city,
      referral_source: referralSource,
      hobby,
      prior_experience: priorExperience,
      learning_goal: learningGoal,
      status: "submitted",
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // `status=eq.pending` di filter, bukan cuma di WHERE token: form yang sudah
    // dikirim tidak boleh ditimpa oleh siapa pun yang masih memegang linknya.
    const res = await sb(`student_intake_forms?token=eq.${token}&status=eq.pending`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error("Pendataan POST error:", await res.text());
      return NextResponse.json({ error: "Gagal menyimpan" }, { status: 500 });
    }

    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      // Token benar tapi tidak ada baris pending = sudah pernah dikirim.
      return NextResponse.json({ error: "Form ini sudah pernah dikirim", code: "already" }, { status: 409 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Pendataan error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
