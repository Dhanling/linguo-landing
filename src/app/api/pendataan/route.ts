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
  // [pendataan-negara-v1] migrasi 20260907120000
  "country",
  // [pendataan-alamat-offline-v1] migrasi 20260820120000
  "address", "district", "postal_code",
  // [teacher-gender-pref-v1] sql/teacher_gender_pref_20260930.sql (repo dashboard)
  "teacher_gender_pref",
  // [pendataan-peserta-semi-v1] sql/20261007_pendataan_peserta_semi_private.sql (repo dashboard)
  "additional_participants",
].join(",");

// Mode kelas dibaca hidup-hidup dari registrasi/tagihannya, bukan disalin ke
// baris form: admin kadang mengubah online→offline setelah link dibagikan, dan
// salinan yang basi berarti siswa offline tidak pernah ditanyai alamatnya.
const MODE_EMBED = "registrations(class_mode,semi_private_size),manual_invoices(class_mode,split_total)";

type ModeRow = {
  program?: string | null;
  registrations?: { class_mode?: string | null; semi_private_size?: number | null } | null;
  manual_invoices?: { class_mode?: string | null; split_total?: number | null } | null;
};

// [pendataan-peserta-semi-v1] Kelas Semi-Private diisi satu orang untuk
// seluruh grup: siswa pertama lengkap, peserta lain versi ringkas. Jumlah
// bloknya ikut ukuran grup di registrasi/tagihan (dasar harganya), jadi siswa
// tidak bisa "lupa" satu teman. Ukuran yang belum tercatat (baris lama) =
// minimal 1 peserta lain, boleh ditambah sendiri.
const MAX_PEERS = 5;

function peersOf(row: ModeRow): { count: number; fixed: boolean } {
  if (!/semi/i.test(row?.program || "")) return { count: 0, fixed: true };
  const size = Number(row?.registrations?.semi_private_size || row?.manual_invoices?.split_total || 0);
  if (size >= 2) return { count: Math.min(size - 1, MAX_PEERS), fixed: true };
  return { count: 1, fixed: false };
}

type Participant = {
  name: string;
  nickname: string;
  wa: string;
  email: string;
  age: number;
  prior_experience: string;
};

/** Rapikan & periksa peserta lain. Mengembalikan teks galat kalau ada yang
 *  kurang — pesannya menyebut peserta ke berapa supaya siswa tahu blok mana. */
function parseParticipants(raw: unknown, rule: { count: number; fixed: boolean }): Participant[] | string {
  const list = Array.isArray(raw) ? raw.slice(0, MAX_PEERS) : [];
  if (rule.fixed ? list.length !== rule.count : list.length < rule.count) {
    return `Lengkapi data ${rule.count} peserta lain di kelasmu`;
  }
  const out: Participant[] = [];
  for (let i = 0; i < list.length; i++) {
    const p = (list[i] || {}) as Record<string, unknown>;
    const who = `Peserta ${i + 2}`;
    const name = clean(p.name, 120);
    const nickname = clean(p.nickname, 60);
    const wa = clean(p.wa, 30);
    const email = clean(p.email, 160)?.toLowerCase() || null;
    const age = Math.floor(Number(p.age));
    const experience = clean(p.prior_experience, 300);
    if (!name) return `${who}: nama lengkap wajib diisi`;
    if (!nickname) return `${who}: nama panggilan wajib diisi`;
    if (!wa) return `${who}: nomor WhatsApp wajib diisi`;
    if (!email) return `${who}: email wajib diisi`;
    if (!/^\S+@\S+\.\S+$/.test(email)) return `${who}: format email belum benar`;
    if (!(age >= 1 && age <= 120)) return `${who}: usia wajib diisi`;
    if (!experience) return `${who}: pengalaman belajar wajib dipilih`;
    out.push({ name, nickname, wa, email, age, prior_experience: experience });
  }
  return out;
}

function classModeOf(row: ModeRow): "online" | "offline" {
  const mode = row?.registrations?.class_mode || row?.manual_invoices?.class_mode || "";
  // Baris lama tanpa class_mode dianggap ONLINE — dulu semua kelas memang online.
  return mode.toLowerCase() === "offline" ? "offline" : "online";
}

// [teacher-gender-stock-v1] Preferensi gender pengajar cuma ditanyakan kalau
// pengajar AKTIF bahasa itu memang ada yang pria DAN ada yang wanita — kalau
// stoknya cuma satu gender (atau gendernya belum didata), pilihannya janji
// kosong. Pencocokan bahasanya sama dengan job_private_teacher_search
// (sql/teacher_search_gender_20261002.sql di repo dashboard).
const langKey = (raw: unknown): string => {
  const k = String(raw || "").split(" - ")[0].trim().toLowerCase();
  return k === "chinese" ? "mandarin" : k;
};

async function teacherGenderChoice(language: unknown): Promise<boolean> {
  const key = langKey(language);
  if (!key) return false;
  try {
    const res = await sb("teachers?status=eq.Aktif&gender=in.(pria,wanita)&select=languages,gender&limit=2000");
    if (!res.ok) {
      console.error("Pendataan teacher gender error:", await res.text());
      return false;
    }
    const rows = (await res.json()) as { languages?: string[] | null; gender?: string | null }[];
    const found = new Set<string>();
    for (const t of Array.isArray(rows) ? rows : []) {
      if (t.gender && (t.languages || []).some((l) => langKey(l) === key)) found.add(t.gender);
    }
    return found.has("pria") && found.has("wanita");
  } catch (e) {
    console.error("Pendataan teacher gender error:", e);
    return false;
  }
}

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

  const res = await sb(`student_intake_forms?token=eq.${token}&select=${SELECT_COLS},${MODE_EMBED}`);
  if (!res.ok) {
    console.error("Pendataan GET error:", await res.text());
    return NextResponse.json({ error: "Gagal membaca form" }, { status: 500 });
  }
  const rows = await res.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // Yang dikirim ke formulir cuma satu kolom datar `class_mode`; sisa hasil
  // embed tidak perlu bocor ke halaman publik.
  const { registrations, manual_invoices, ...form } = rows[0] as ModeRow & Record<string, unknown>;
  const peers = peersOf(rows[0]);
  return NextResponse.json({
    ...form,
    class_mode: classModeOf(rows[0]),
    peer_count: peers.count,
    peer_fixed: peers.fixed,
    teacher_gender_choice: await teacherGenderChoice(form.language),
  });
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
    // [pendataan-negara-v1] Negara kosong dianggap Indonesia — sama seperti
    // baris lama yang dibuat waktu formulirnya belum menanyakan negara.
    const country = clean(body.country, 80) || "Indonesia";
    const luarNegeri = country.trim().toLowerCase() !== "indonesia";
    const province = clean(body.province, 80);
    const city = clean(body.city, 120);
    // [pendataan-alamat-offline-v1] Hanya dipakai kalau kelasnya offline.
    const address = clean(body.address, 400);
    const district = clean(body.district, 120);
    const postalCode = clean(body.postal_code, 10);
    const referralSource = clean(body.referral_source, 200);
    const hobby = clean(body.hobby, 300);
    const priorExperience = clean(body.prior_experience, 300);
    const learningGoal = clean(body.learning_goal, 1000);
    const schedule = clean(body.preferred_schedule, 4000);
    const teacherPref = clean(body.teacher_gender_pref, 10);

    // [pendataan-semua-wajib-v1] Semua isian wajib — pagarnya ada di sini juga,
    // bukan cuma di formulirnya: yang menembak endpoint ini langsung tetap tidak
    // boleh menitipkan data setengah jadi yang nanti dikejar admin satu per satu.
    if (!fullName) return NextResponse.json({ error: "Nama lengkap wajib diisi" }, { status: 400 });
    if (!nickname) return NextResponse.json({ error: "Nama panggilan wajib diisi" }, { status: 400 });
    if (!birthDate) return NextResponse.json({ error: "Tanggal lahir wajib diisi" }, { status: 400 });
    if (!province) return NextResponse.json({ error: luarNegeri ? "Negara bagian / provinsi / wilayah wajib diisi" : "Provinsi domisili wajib diisi" }, { status: 400 });
    if (!city) return NextResponse.json({ error: luarNegeri ? "Kota domisili wajib diisi" : "Kota / kabupaten domisili wajib diisi" }, { status: 400 });
    if (!referralSource) return NextResponse.json({ error: "Pilih dari mana kamu tahu Linguo" }, { status: 400 });
    if (!institution) return NextResponse.json({ error: "Sekolah / instansi / perusahaan wajib diisi" }, { status: 400 });
    if (!hobby) return NextResponse.json({ error: "Hobi & minat wajib diisi" }, { status: 400 });
    if (!whatsapp) return NextResponse.json({ error: "Nomor WhatsApp wajib diisi" }, { status: 400 });
    if (!email) return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 });
    if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Format email belum benar" }, { status: 400 });
    if (!priorExperience) return NextResponse.json({ error: "Pengalaman belajar wajib diisi" }, { status: 400 });
    if (!learningGoal) return NextResponse.json({ error: "Tujuan belajar wajib diisi" }, { status: 400 });
    if (!schedule) return NextResponse.json({ error: "Pilih minimal 1 blok waktu yang kamu bisa" }, { status: 400 });

    // [pendataan-alamat-offline-v1] Kelas offline butuh alamat yang bisa
    // didatangi. Modenya ditanyakan ke database, bukan dipercaya dari body:
    // yang menembak endpoint ini langsung tidak boleh melewati pertanyaannya
    // cuma dengan mengaku kelasnya online.
    const modeRes = await sb(
      `student_intake_forms?token=eq.${token}&select=id,language,program,${MODE_EMBED}`,
    );
    if (!modeRes.ok) {
      console.error("Pendataan mode error:", await modeRes.text());
      return NextResponse.json({ error: "Gagal membaca form" }, { status: 500 });
    }
    const modeRows = await modeRes.json();
    if (!Array.isArray(modeRows) || modeRows.length === 0) {
      return NextResponse.json({ error: "Link tidak sah" }, { status: 404 });
    }
    // Kelas offline di luar negeri tidak dilayani — pengajarnya tidak bisa
    // datang — jadi alamat detailnya tidak dipaksakan ke siswa luar Indonesia.
    const isOffline = classModeOf(modeRows[0]) === "offline" && !luarNegeri;

    // [teacher-gender-stock-v1] Pertanyaannya tidak tampil kalau stok pengajar
    // bahasa ini tidak punya dua gender — jawabannya dikosongkan, bukan "bebas",
    // supaya di dashboard terbaca "tidak ditanya", bukan "siswa memilih bebas".
    const genderChoice = await teacherGenderChoice(modeRows[0].language);
    if (genderChoice && (!teacherPref || !["pria", "wanita", "bebas"].includes(teacherPref))) {
      return NextResponse.json({ error: "Pilih preferensi pengajarmu" }, { status: 400 });
    }
    // [pendataan-peserta-semi-v1] Jumlah peserta ditentukan dari DB, sama
    // seperti mode kelas — bukan dari body.
    const peerRule = peersOf(modeRows[0]);
    const participants = peerRule.count > 0 ? parseParticipants(body.additional_participants, peerRule) : [];
    if (typeof participants === "string") {
      return NextResponse.json({ error: participants }, { status: 400 });
    }
    if (isOffline) {
      if (!district) return NextResponse.json({ error: "Kecamatan wajib diisi untuk kelas offline" }, { status: 400 });
      if (!address) return NextResponse.json({ error: "Alamat lengkap wajib diisi untuk kelas offline" }, { status: 400 });
      if (address.length < 10) return NextResponse.json({ error: "Alamat lengkap kurang detail — tulis nama jalan, nomor rumah, dan patokannya" }, { status: 400 });
      if (postalCode && !/^\d{5}$/.test(postalCode)) {
        return NextResponse.json({ error: "Kode pos harus 5 angka" }, { status: 400 });
      }
    }

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
      // tg_intake_form_sync menyalinnya ke students.country/province/city/source.
      country,
      province,
      city,
      referral_source: referralSource,
      // Alamat detail cuma disimpan untuk kelas offline; kelas online tidak
      // menampilkan kolomnya, jadi apa pun yang terkirim di sana diabaikan.
      address: isOffline ? address : null,
      district: isOffline ? district : null,
      postal_code: isOffline ? postalCode : null,
      hobby,
      prior_experience: priorExperience,
      learning_goal: learningGoal,
      teacher_gender_pref: genderChoice ? teacherPref : null,
      additional_participants: participants.length > 0 ? participants : null,
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
