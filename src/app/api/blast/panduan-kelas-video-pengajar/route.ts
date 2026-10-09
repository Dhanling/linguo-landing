// [panduan-kelas-video-pengajar-v1] Kirim email "Panduan mengajar di Kelas Video
// diperbarui" ke pengajar aktif yang sedang punya kelas. Pasangan blast WA dari
// nomor Kurikulum (linguo-admin-dashboard/sql/20261009_blast_panduan_kelas_video.sql),
// lanjutan laporan Rini b45b20d2.
//
// Kenapa lewat route, bukan skrip lokal: kunci Resend hanya ada di env Vercel.
// Route ini BUKAN cron — dipanggil manual, sekali, dengan
// `Authorization: Bearer $CRON_SECRET`. Polanya sama dengan
// ../panduan-dashboard-siswa.
//
// Penerima disamakan dengan blast WA-nya: teachers.status = 'Aktif' yang punya
// registrasi Aktif berstatus Lunas/Cicilan ATAU sesi terjadwal mendatang.
// Tanpa lampiran: panduan & PDF terbaru selalu ada di dashboard pengajar, jadi
// emailnya tidak pernah membawa versi yang basi.
//
// Body JSON:
//   {}                       → hitung penerima saja, TIDAK mengirim apa pun
//   { "uji": "a@b.com" }     → kirim satu email contoh ke alamat itu
//   { "kirim": true }        → kirim ke semua pengajar tersebut
//
// Aman diulang: tiap email membawa Idempotency-Key Resend per alamat, jadi
// panggilan kedua (mis. setelah timeout) tidak mengirim dobel dalam 24 jam.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { bungkusEmailLinguo } from "@/lib/emailChrome";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "Linguo <noreply@linguo.id>";
const CRON_SECRET = process.env.CRON_SECRET || "";

const DASHBOARD_URL = "https://teach.linguo.id";
const BALAS_KE = "curriculum@linguo.id";
const KUNCI = "panduan-kelas-video-pengajar-v1";
/** Akun contoh untuk memotret layar panduan — bukan pengajar sungguhan. */
const PENGAJAR_DUMMY = "d0d00000-0000-4000-8000-000000000201";
/** Resend membatasi 2 permintaan/detik — jeda ini menjaga tetap di bawahnya. */
const JEDA_MS = 600;

type Penerima = { email: string; sapaan: string };

function sapaanDari(nama: string | null): string {
  const depan = (nama || "").trim().split(",")[0].trim().split(/\s+/)[0] || "";
  const huruf = depan.replace(/[^\p{L}]/gu, "");
  if (huruf.length < 3) return "Kak";
  return "Kak " + depan.charAt(0).toUpperCase() + depan.slice(1).toLowerCase();
}

async function ambilPenerima(): Promise<Penerima[]> {
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
  const punyaKelas = new Set<string>();
  // PostgREST memotong di 1.000 baris — tarik per halaman sampai habis.
  for (let dari = 0; ; dari += 1000) {
    const { data, error } = await sb
      .from("registrations")
      .select("id, teacher_id")
      .eq("status", "Aktif")
      .in("payment_status", ["Lunas", "Cicilan"])
      .is("archived_at", null)
      .not("teacher_id", "is", null)
      .order("id")
      .range(dari, dari + 999);
    if (error) throw new Error(error.message);
    for (const r of data || []) if (r.teacher_id) punyaKelas.add(r.teacher_id as string);
    if (!data || data.length < 1000) break;
  }
  for (let dari = 0; ; dari += 1000) {
    const { data, error } = await sb
      .from("schedules")
      .select("id, teacher_id")
      .eq("status", "scheduled")
      .gt("scheduled_at", new Date().toISOString())
      .not("teacher_id", "is", null)
      .order("id")
      .range(dari, dari + 999);
    if (error) throw new Error(error.message);
    for (const r of data || []) if (r.teacher_id) punyaKelas.add(r.teacher_id as string);
    if (!data || data.length < 1000) break;
  }
  punyaKelas.delete(PENGAJAR_DUMMY);

  const { data: guru, error } = await sb
    .from("teachers")
    .select("id, name, email")
    .eq("status", "Aktif")
    .order("id")
    .range(0, 999);
  if (error) throw new Error(error.message);

  const peta = new Map<string, Penerima>();
  for (const t of guru || []) {
    if (!punyaKelas.has(t.id as string)) continue;
    const email = ((t.email as string | null) || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;
    if (!peta.has(email)) peta.set(email, { email, sapaan: sapaanDari(t.name as string | null) });
  }
  return [...peta.values()];
}

function isiEmail(sapaan: string): string {
  const langkah = (no: number, isi: string) =>
    `<tr>
      <td width="30" valign="top" style="padding:0 0 10px"><div style="width:22px;height:22px;border-radius:11px;background:#E3F4F2;color:#0C7D6C;font-size:12px;font-weight:800;line-height:22px;text-align:center">${no}</div></td>
      <td valign="top" style="padding:1px 0 10px;font-size:14px;line-height:1.55;color:#12172B">${isi}</td>
    </tr>`;
  return `
  <div style="margin:0;padding:24px;background:#F5F6F8;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
    <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden">
      <div style="background:#1A9E9E;padding:22px 26px;color:#fff">
        <div style="font-size:19px;font-weight:800">Panduan Kelas Video sudah diperbarui</div>
      </div>
      <div style="padding:24px 26px;color:#12172B">
        <p style="margin:0 0 14px;font-size:15px;line-height:1.6">Halo ${sapaan},</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6">
          Mindev dari tim Kurikulum Linguo di sini. Panduan mengajar di <b>Kelas Video</b> sudah
          diperbarui mengikuti tampilan dashboard yang sekarang, dan tiap langkahnya kini ada gambarnya.
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #E6E8EC;border-radius:14px;margin:0 0 16px">
          <tr><td style="padding:16px 18px 6px">
            <div style="font-size:13px;font-weight:800;color:#0C7D6C;margin:0 0 10px">Cara masuk kelas</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              ${langkah(1, "Buka <b>teach.linguo.id</b>")}
              ${langkah(2, "Klik <b>Kelas</b> di menu kiri, lalu <b>Jadwal</b>")}
              ${langkah(3, "Klik blok sesinya di kalender")}
              ${langkah(4, "Tekan tombol hijau <b>Kelas Video</b>")}
            </table>
          </td></tr>
        </table>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#5B6478">
          Sesinya harus sudah dijadwalkan dulu. Kalau kalender masih kosong, tombolnya memang belum muncul.
          Tombol <b>Link siswa</b> di sebelahnya untuk dibagikan ke siswa, bukan untuk pengajar masuk.
        </p>
        <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#12172B">
          Panduan lengkap bergambar ada di menu <b>Panduan → Panduan Fitur → Mengajar di Kelas Video</b>.
          Di sana juga ada tombol <b>Unduh PDF</b> kalau mau disimpan.
        </p>
        <a href="${DASHBOARD_URL}"
           style="display:inline-block;background:#1A9E9E;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:12px">
          Buka Dashboard Pengajar
        </a>
        <p style="margin:18px 0 0;font-size:12.5px;line-height:1.6;color:#7A8496">
          Ada langkah yang masih membingungkan? Balas email ini, atau kabari tim Kurikulum lewat WhatsApp.
        </p>
      </div>
    </div>
  </div>`;
}

async function kirim(p: Penerima, kunci: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": kunci,
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [p.email],
      reply_to: BALAS_KE,
      subject: "Panduan mengajar di Kelas Video sudah diperbarui",
      html: bungkusEmailLinguo(isiEmail(p.sapaan), {
        alasanKirim: "Kamu menerima email ini karena terdaftar sebagai pengajar aktif di Linguo.id.",
      }),
    }),
  });
  if (!res.ok) return { ok: false as const, status: res.status, pesan: (await res.text()).slice(0, 200) };
  return { ok: true as const };
}

const jeda = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: NextRequest) {
  if (!CRON_SECRET || req.headers.get("authorization") !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as { uji?: string; kirim?: boolean };

  try {
    const penerima = await ambilPenerima();
    if (!body.uji && body.kirim !== true) {
      return NextResponse.json({ mode: "hitung", jumlah: penerima.length, resendSiap: !!RESEND_API_KEY });
    }
    if (!RESEND_API_KEY) return NextResponse.json({ error: "RESEND_API_KEY belum di-set" }, { status: 500 });

    if (body.uji) {
      const hasil = await kirim({ email: body.uji.trim().toLowerCase(), sapaan: "Kak" }, `${KUNCI}/uji/${Date.now()}`);
      return NextResponse.json({ mode: "uji", jumlahPengajar: penerima.length, hasil });
    }

    const gagal: { status: number; pesan: string }[] = [];
    let terkirim = 0;
    for (const p of penerima) {
      const hasil = await kirim(p, `${KUNCI}/${p.email}`);
      if (hasil.ok) terkirim++;
      else gagal.push({ status: hasil.status, pesan: hasil.pesan });
      await jeda(JEDA_MS);
    }
    return NextResponse.json({ mode: "kirim", jumlah: penerima.length, terkirim, gagal });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
