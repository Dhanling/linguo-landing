// [panduan-dashboard-siswa-v1] Kirim email "Panduan Singkat Dashboard Siswa"
// (PDF 2 halaman, terlampir + tautan) ke siswa kelas Aktif.
//
// Kenapa lewat route, bukan skrip lokal: kunci Resend hanya ada di env Vercel.
// Route ini BUKAN cron — dipanggil manual, sekali, dengan
// `Authorization: Bearer $CRON_SECRET`.
//
// "Siswa aktif" disamakan dengan blast WA 2 Okt 2026
// (linguo-admin-dashboard/sql/wa_blast_siswa_belum_login_20261002.sql):
// bukan akun tes/arsip, punya email, dan punya pendaftaran berstatus Aktif
// yang tidak diarsipkan dan bukan produk digital.
//
// Body JSON:
//   {}                       → hitung penerima saja, TIDAK mengirim apa pun
//   { "uji": "a@b.com" }     → kirim satu email contoh ke alamat itu
//   { "kirim": true }        → kirim ke semua siswa aktif
//
// Aman diulang: tiap email membawa Idempotency-Key Resend per alamat, jadi
// panggilan kedua (mis. setelah timeout) tidak mengirim dobel dalam 24 jam.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { bungkusEmailLinguo } from "@/lib/emailChrome";
import { BRAND_FACTS } from "@/lib/brand-facts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "Linguo <noreply@linguo.id>";
const CRON_SECRET = process.env.CRON_SECRET || "";

const PDF_URL = "https://linguo.id/panduan/panduan-dashboard-siswa.pdf";
const PDF_NAMA = "Panduan-Dashboard-Siswa-Linguo.pdf";
const KUNCI = "panduan-dashboard-siswa-v1";
/** Resend membatasi 2 permintaan/detik — jeda ini menjaga tetap di bawahnya. */
const JEDA_MS = 600;

type Penerima = { email: string; sapaan: string };

/** Nama depan; nama yang bukan nama ("Siswa", inisial) → cukup "Kak". */
function sapaanDari(nama: string | null): string {
  const depan = (nama || "").trim().split(",")[0].trim().split(/\s+/)[0] || "";
  const huruf = depan.replace(/[^\p{L}]/gu, "");
  if (huruf.length < 3 || huruf.toLowerCase() === "siswa") return "Kak";
  return "Kak " + depan.charAt(0).toUpperCase() + depan.slice(1).toLowerCase();
}

async function ambilPenerima(): Promise<Penerima[]> {
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
  const peta = new Map<string, Penerima>();
  // PostgREST memotong di 1.000 baris — tarik per halaman sampai habis.
  for (let dari = 0; ; dari += 1000) {
    const { data, error } = await sb
      .from("registrations")
      .select("id, product, product_type, students!inner(name, email, is_test, is_test_account, is_archived)")
      .eq("status", "Aktif")
      .is("archived_at", null)
      .order("id")
      .range(dari, dari + 999);
    if (error) throw new Error(error.message);
    for (const r of data || []) {
      if ((r.product_type ?? r.product) === "digital") continue;
      const s = (Array.isArray(r.students) ? r.students[0] : r.students) as {
        name: string | null; email: string | null;
        is_test: boolean | null; is_test_account: boolean | null; is_archived: boolean | null;
      } | null;
      if (!s || s.is_test || s.is_test_account || s.is_archived) continue;
      const email = (s.email || "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;
      if (!peta.has(email)) peta.set(email, { email, sapaan: sapaanDari(s.name) });
    }
    if (!data || data.length < 1000) break;
  }
  return [...peta.values()];
}

function isiEmail(sapaan: string): string {
  const butir = (judul: string, isi: string) =>
    `<tr><td style="padding:0 0 10px;font-size:14px;line-height:1.55;color:#12172B"><b>${judul}</b><br><span style="color:#5B6478">${isi}</span></td></tr>`;
  return `
  <div style="margin:0;padding:24px;background:#F5F6F8;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
    <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden">
      <div style="background:#1A9E9E;padding:22px 26px;color:#fff">
        <div style="font-size:19px;font-weight:800">Panduan Singkat Dashboard Siswa</div>
      </div>
      <div style="padding:24px 26px;color:#12172B">
        <p style="margin:0 0 14px;font-size:15px;line-height:1.6">Halo ${sapaan},</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6">
          Supaya belajarmu makin lancar, kami rangkum cara memakai <b>Dashboard Siswa Linguo</b>
          dalam panduan 2 halaman. PDF-nya terlampir di email ini.
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #E6E8EC;border-radius:14px;margin:0 0 18px">
          <tr><td style="padding:16px 18px 6px">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              ${butir("Cara masuk", "Buka linguo.id/akun, lalu masuk dengan email yang kamu daftarkan ke Linguo.")}
              ${butir("Kelas live dan jadwal", "Tombol Join kelas live ada di kartu Sesi Mendatang, aktif 10 menit sebelum kelas.")}
              ${butir("Rekaman, materi, kuis, rapor", "Semuanya ada di menu Kelas &amp; Materi.")}
            </table>
          </td></tr>
        </table>
        <a href="${PDF_URL}"
           style="display:inline-block;background:#1A9E9E;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:12px">
          Buka Panduan (PDF)
        </a>
        <a href="https://linguo.id/akun"
           style="display:inline-block;color:#1A9E9E;text-decoration:none;font-weight:700;font-size:14px;padding:12px 14px">
          Buka Dashboard
        </a>
        <p style="margin:18px 0 0;font-size:12.5px;line-height:1.6;color:#7A8496">
          Ada kendala? Hubungi CS Linguo lewat
          <a href="${BRAND_FACTS.contact.whatsappUrl}" style="color:#1A9E9E">WhatsApp</a>
          atau tanyakan ke pengajarmu di Grup Kelas.
        </p>
      </div>
    </div>
  </div>`;
}

async function kirim(p: Penerima, lampiran: string, kunci: string) {
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
      reply_to: BRAND_FACTS.contact.email,
      subject: "Panduan singkat Dashboard Siswa Linguo (PDF 2 halaman)",
      html: bungkusEmailLinguo(isiEmail(p.sapaan), {
        alasanKirim: "Kamu menerima email ini karena terdaftar sebagai siswa aktif di Linguo.id.",
      }),
      attachments: [{ filename: PDF_NAMA, content: lampiran }],
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

    const pdf = await fetch(PDF_URL, { cache: "no-store" });
    if (!pdf.ok) return NextResponse.json({ error: `PDF tidak terambil (${pdf.status})` }, { status: 500 });
    const lampiran = Buffer.from(await pdf.arrayBuffer()).toString("base64");

    if (body.uji) {
      const hasil = await kirim({ email: body.uji.trim().toLowerCase(), sapaan: "Kak" }, lampiran, `${KUNCI}/uji/${Date.now()}`);
      return NextResponse.json({ mode: "uji", jumlahSiswaAktif: penerima.length, hasil });
    }

    const gagal: { email: string; status: number; pesan: string }[] = [];
    let terkirim = 0;
    for (const p of penerima) {
      const hasil = await kirim(p, lampiran, `${KUNCI}/${p.email}`);
      if (hasil.ok) terkirim++;
      else gagal.push({ email: p.email, status: hasil.status, pesan: hasil.pesan });
      await jeda(JEDA_MS);
    }
    return NextResponse.json({ mode: "kirim", jumlah: penerima.length, terkirim, gagal });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
