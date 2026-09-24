// =============================================================================
// src/lib/placementNotify.ts
// [placement-notif-v1]
//
// Begitu hasil placement test punya kontak, kabari calon siswa:
//   1. WhatsApp — diantrikan ke `wa_outbound` (sender null = bot CS), jadi
//      pesannya muncul di WA Inbox admin & balasan siswa masuk ke sana juga.
//   2. Email — lewat Resend. (Belum dibungkus `bungkusEmailLinguo`: emailChrome.ts
//      belum ada di main — pasang begitu berkas itu ter-commit.)
// Isinya: hasil tes (level, skor, waktu) + tawaran mendaftar kelas.
//
// Tiap baris `placement_results` dikabari SEKALI: kolom `notified_at` diklaim
// atomik (PATCH …&notified_at=is.null). Tes ulang oleh nomor/email yang sama
// dalam JEDA_ULANG_JAM tidak dikabari lagi supaya siswa tak kebanjiran pesan.
//
// Best-effort: gagal kirim tak boleh menggagalkan penyimpanan hasil tes.
// =============================================================================

import { daftarSlugFromLanguageSlug } from "@/lib/funnelRouting";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "Linguo <noreply@linguo.id>";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://linguo.id";
const JEDA_ULANG_JAM = 12;

// Salinan ringkas dari CefrLevelMap.tsx — ubah bareng kalau level berubah.
const LEVEL_INFO: Record<string, { name: string; en: string; blurb: string }> = {
  A1: { name: "Pemula", en: "Beginner", blurb: "perkenalan diri, angka, dan kalimat sehari-hari yang sangat dasar" },
  A2: { name: "Dasar", en: "Elementary", blurb: "ngobrol topik rutin seperti keluarga, belanja, pekerjaan, dan arah jalan" },
  B1: { name: "Menengah", en: "Intermediate", blurb: "cerita pengalaman & rencana, dan cukup mandiri saat traveling" },
  B2: { name: "Mahir", en: "Upper Intermediate", blurb: "diskusi topik abstrak, debat, dan presentasi" },
};

type Row = {
  id: string;
  name: string | null;
  email: string | null;
  whatsapp: string | null;
  language: string | null;
  level: string | null;
  score: number | null;
  time_elapsed_sec: number | null;
  source: string | null;
  student_id: string | null;
  created_at: string;
};

function normalizePhone(raw: string | null | undefined): string | null {
  const d = String(raw || "").replace(/\D/g, "");
  if (d.length < 9) return null;
  if (d.startsWith("62")) return d;
  if (d.startsWith("0")) return "62" + d.slice(1);
  if (d.startsWith("8")) return "62" + d;
  return d;
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function namaBahasa(language: string | null) {
  const l = (language || "").trim();
  if (!l) return "bahasa";
  return /ielts|toefl|toeic/i.test(l) ? l : `Bahasa ${l}`;
}

function tglIndo(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta",
  });
}

function durasi(sec: number | null) {
  if (!sec || sec <= 0) return null;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m ? `${m} menit ${s} detik` : `${s} detik`;
}

/** Link pendaftaran — slug bahasa diambil dari `source` ("placement-test-english-unlocked"). */
function linkDaftar(row: Row) {
  const slug = (row.source || "").match(/^placement-test-(.+?)(?:-unlocked)?$/)?.[1] || "";
  if (slug === "ielts" || slug === "toefl-itp") return `${BASE_URL}/daftar/inggris/ielts-toefl`;
  const daftarSlug = slug ? daftarSlugFromLanguageSlug(slug) : null;
  const band = (row.level || "").slice(0, 2).toUpperCase();
  const q = LEVEL_INFO[band] ? `?level=${band}` : "";
  return daftarSlug ? `${BASE_URL}/daftar/${daftarSlug}${q}` : `${BASE_URL}/daftar`;
}

function susunIsi(row: Row, maxScore?: number) {
  const nama = (row.name || "").trim().split(/\s+/)[0] || "";
  const band = (row.level || "").slice(0, 2).toUpperCase();
  const info = LEVEL_INFO[band];
  const level = row.level || "-";
  const levelLabel = info ? `${level} — ${info.name} (${info.en})` : level;
  const skor = row.score == null ? null : maxScore ? `${row.score}/${maxScore}` : String(row.score);
  return {
    nama,
    bahasa: namaBahasa(row.language),
    tanggal: tglIndo(row.created_at),
    level,
    levelLabel,
    blurb: info?.blurb || null,
    skor,
    waktu: durasi(row.time_elapsed_sec),
    daftar: linkDaftar(row),
  };
}

function pesanWa(row: Row, maxScore?: number) {
  const x = susunIsi(row, maxScore);
  return [
    `Halo kak${x.nama ? ` ${x.nama}` : ""} 👋`,
    ``,
    `Terima kasih sudah mengikuti *Placement Test ${x.bahasa}* di Linguo.id pada ${x.tanggal} 🙏`,
    ``,
    `Berikut hasilnya ya kak:`,
    `📊 Level: *${x.levelLabel}*`,
    ...(x.skor ? [`✅ Skor: ${x.skor}`] : []),
    ...(x.waktu ? [`⏱️ Waktu pengerjaan: ${x.waktu}`] : []),
    ``,
    ...(x.blurb ? [`Artinya kakak sudah siap belajar di tahap ${x.blurb} 💪`, ``] : []),
    `Supaya belajarnya pas dengan kemampuan kakak, Minling rekomendasikan mulai dari kelas ${x.bahasa} level *${x.level}*.`,
    ``,
    `Apakah kakak berminat untuk mendaftar kelasnya? 😊 Minling siap bantu info jadwal, pilihan kelas (Reguler / Private), dan harganya ya kak.`,
    ``,
    `Daftar langsung di sini: ${x.daftar}`,
    `Atau balas chat ini aja kak, nanti Minling bantu 🙏`,
  ].join("\n");
}

function htmlEmail(row: Row, maxScore?: number) {
  const x = susunIsi(row, maxScore);
  const baris = (label: string, nilai: string) =>
    `<tr><td style="padding:6px 0;color:#5B6478;font-size:13px">${label}</td>` +
    `<td style="padding:6px 0;text-align:right;font-weight:700;font-size:14px;color:#12172B">${esc(nilai)}</td></tr>`;
  return `
  <div style="margin:0;padding:24px;background:#F5F6F8;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
    <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden">
      <div style="background:#1A9E9E;padding:22px 26px;color:#fff">
        <div style="font-size:13px;opacity:.85">Hasil Placement Test ${esc(x.bahasa)}</div>
        <div style="font-size:26px;font-weight:800;margin-top:4px">${esc(x.level)}</div>
      </div>
      <div style="padding:24px 26px;color:#12172B">
        <p style="margin:0 0 14px;font-size:15px;line-height:1.6">
          Halo kak${x.nama ? ` <b>${esc(x.nama)}</b>` : ""}, terima kasih sudah mengikuti Placement Test
          ${esc(x.bahasa)} di Linguo.id pada ${esc(x.tanggal)}. Berikut hasilnya:
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E6E8EC;border-radius:14px;padding:10px 16px;margin:0 0 16px">
          ${baris("Level", x.levelLabel)}
          ${x.skor ? baris("Skor", x.skor) : ""}
          ${x.waktu ? baris("Waktu pengerjaan", x.waktu) : ""}
        </table>
        ${x.blurb ? `<p style="margin:0 0 14px;font-size:14px;line-height:1.6">Artinya kakak sudah siap belajar di tahap <b>${esc(x.blurb)}</b>.</p>` : ""}
        <p style="margin:0 0 18px;font-size:14px;line-height:1.6">
          Supaya belajarnya pas dengan kemampuan kakak, kami rekomendasikan mulai dari kelas
          ${esc(x.bahasa)} level <b>${esc(x.level)}</b>. Apakah kakak berminat untuk mendaftar kelasnya?
        </p>
        <a href="${esc(x.daftar)}"
           style="display:inline-block;background:#1A9E9E;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:12px">
          Daftar Kelas Sekarang
        </a>
        <p style="margin:18px 0 0;font-size:12.5px;line-height:1.6;color:#7A8496">
          Mau tanya jadwal, pilihan kelas (Reguler / Private), atau harga dulu? Balas email ini
          atau chat CS Linguo di WhatsApp ya kak.
        </p>
        <p style="margin:14px 0 0;font-size:11.5px;line-height:1.6;color:#9AA3B2">
          Kamu menerima email ini karena mengikuti placement test di Linguo.id.
        </p>
      </div>
    </div>
  </div>`;
}

async function kirimEmail(row: Row, to: string, maxScore?: number) {
  if (!RESEND_API_KEY) return;
  const x = susunIsi(row, maxScore);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [to],
        subject: `Hasil Placement Test ${x.bahasa} kamu: level ${x.level}`,
        html: htmlEmail(row, maxScore),
      }),
    });
    if (!res.ok) console.error("[placement-notif] email gagal:", res.status, await res.text());
  } catch (err) {
    console.error("[placement-notif] email error (tidak fatal):", err);
  }
}

/**
 * Kabari pemilik hasil tes `id` lewat WA (bot CS) + email. Aman dipanggil
 * berulang — baris yang sudah `notified_at` dilewati.
 */
export async function notifyPlacementResult(opts: {
  url: string;
  key: string;
  id: string;
  maxScore?: number;
}) {
  const { url, key, id } = opts;
  const maxScore = Number(opts.maxScore) > 0 ? Number(opts.maxScore) : undefined;
  const headers: Record<string, string> = {
    apikey: key,
    Authorization: "Bearer " + key,
    "Content-Type": "application/json",
  };
  try {
    // Klaim atomik: cuma satu pemanggil yang dapat barisnya.
    const klaim = await fetch(
      `${url}/rest/v1/placement_results?id=eq.${encodeURIComponent(id)}&notified_at=is.null`,
      {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({ notified_at: new Date().toISOString() }),
      },
    );
    if (!klaim.ok) {
      console.error("[placement-notif] klaim gagal:", klaim.status, await klaim.text());
      return;
    }
    const row: Row | undefined = (await klaim.json().catch(() => []))?.[0];
    if (!row) return;

    // Siswa dari /akun belum tentu mengisi form kontak — ambil email akunnya.
    let email = (row.email || "").trim();
    if (!email && row.student_id) {
      const r = await fetch(
        `${url}/rest/v1/students?id=eq.${encodeURIComponent(row.student_id)}&select=name,email&limit=1`,
        { headers },
      );
      const s = r.ok ? (await r.json().catch(() => []))?.[0] : null;
      email = String(s?.email || "").trim();
      if (!row.name && s?.name) row.name = s.name;
    }
    const phone = normalizePhone(row.whatsapp);
    if (!email && !phone) return;

    // Tes ulang dalam jeda singkat → sudah dikabari hasil sebelumnya, jangan spam.
    const sejak = new Date(Date.now() - JEDA_ULANG_JAM * 3600_000).toISOString();
    const siapa = [
      row.whatsapp ? `whatsapp.eq."${row.whatsapp}"` : null,
      email ? `email.eq."${email.replace(/"/g, "")}"` : null,
    ].filter(Boolean).join(",");
    const dup = await fetch(
      `${url}/rest/v1/placement_results?select=id&id=neq.${encodeURIComponent(id)}` +
        `&notified_at=gte.${encodeURIComponent(sejak)}&or=(${encodeURIComponent(siapa)})&limit=1`,
      { headers },
    );
    if (dup.ok && ((await dup.json().catch(() => [])) as unknown[]).length > 0) return;

    await Promise.all([
      phone
        ? fetch(`${url}/rest/v1/wa_outbound`, {
            method: "POST",
            headers: { ...headers, Prefer: "return=minimal" },
            body: JSON.stringify({
              phone,
              body: pesanWa(row, maxScore),
              sender: null,
            }),
          }).then(async (r) => {
            if (!r.ok) console.error("[placement-notif] antre WA gagal:", r.status, await r.text());
          })
        : null,
      email ? kirimEmail(row, email, maxScore) : null,
    ]);
  } catch (err) {
    console.error("[placement-notif] error (tidak fatal):", err);
  }
}
