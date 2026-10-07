// =============================================================================
// src/lib/emailChrome.ts
// [email-chrome-v1]
//
// Kop (banner) + kaki (footer) BAKU untuk semua email yang keluar dari
// linguo.id — transaksional, notifikasi, maupun cron/laporan.
//
// Kenapa ada: tiap route & edge function dulu merakit HTML email sendiri, jadi
// tak satu pun email terlihat berasal dari brand yang sama. Xendit sempat
// menahan aktivasi ID Cards karena identitas & info kontak kami tidak lengkap
// di kanal resmi — kaki email ini yang menutup celah itu (alamat, kontak,
// syarat & ketentuan, kebijakan privasi ikut di setiap email).
//
// CARA PAKAI (satu baris di tiap tempat kirim):
//   import { bungkusEmailLinguo } from "@/lib/emailChrome";
//   ... resend.emails.send({ ..., html: bungkusEmailLinguo(html) })
//
// `bungkusEmailLinguo` menerima dokumen HTML utuh MAUPUN potongan HTML:
//  - ada <body>  → banner disisipkan tepat setelah <body>, footer sebelum </body>
//  - tanpa <body>→ dibungkus jadi dokumen email lengkap
// Aman dipanggil dua kali: ada penanda anti-dobel di dalam banner.
//
// ⚠️ TIGA SALINAN — berkas ini dikembar di dua repo lain karena Edge Function
// (Deno) tak bisa mengimpor dari repo landing. Ubah satu, ubah semuanya:
//   1. linguo-landing/src/lib/emailChrome.ts              ← sumber kebenaran
//   2. linguo-app/supabase/functions/_shared/emailChrome.ts
//   3. linguo-admin-dashboard/supabase/functions/_shared/emailChrome.ts
// =============================================================================

import { BRAND_FACTS } from "./brand-facts";

/** Aset di /public — dilayani dari domain produksi supaya bisa dimuat klien email. */
export const EMAIL_BANNER_URL = "https://linguo.id/email/banner-linguo.jpg";
export const EMAIL_LOGO_PUTIH_URL = "https://linguo.id/email/logo-linguo-putih.png";

/** Penanda anti-dobel: kalau sudah ada di HTML, jangan bungkus lagi. */
const PENANDA = "<!--linguo-email-chrome-->";

const HIJAU_GELAP = "#0F2D2C";

export type OpsiKaki = {
  /** Alasan penerima dapat email ini (mis. "Kamu terdaftar sebagai siswa Linguo"). */
  alasanKirim?: string;
  /** Catatan tambahan kecil di bawah, mis. keterangan email otomatis. */
  catatan?: string;
};

/** Banner atas: ilustrasi brand Linguo, lebar 600px, tertaut ke linguo.id. */
export function kopEmailLinguo(): string {
  return (
    PENANDA +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">' +
    '<tr><td align="center" style="padding:20px 12px 4px;">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;border-collapse:collapse;">' +
    '<tr><td style="line-height:0;font-size:0;">' +
    `<a href="https://linguo.id?utm_source=email&utm_medium=banner" target="_blank" style="text-decoration:none;">` +
    `<img src="${EMAIL_BANNER_URL}" width="600" alt="Linguo.id — kursus bahasa online, ${BRAND_FACTS.languageCountLabel}" ` +
    'style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;border-radius:16px;"></a>' +
    "</td></tr></table></td></tr></table>"
  );
}

/** URL ikon sosial (PNG putih transparan, 60px, dipakai 20px di email). */
const IKON_SOSIAL: [string, string, string][] = [
  ["Instagram", "https://instagram.com/linguo.id", "ic-instagram.png"],
  ["TikTok", "https://tiktok.com/@linguo.id", "ic-tiktok.png"],
  ["YouTube", "https://youtube.com/@linguo.id", "ic-youtube.png"],
  ["LinkedIn", "https://linkedin.com/company/linguo-id", "ic-linkedin.png"],
  ["Facebook", "https://facebook.com/linguo.id", "ic-facebook.png"],
];

/**
 * Kaki email: ramping, dua kolom — kiri logo + ikon sosial, kanan alamat &
 * kontak. Baris bawah memuat tautan kebijakan dan copyright.
 *
 * Sengaja TANPA tagline marketing: kaki ini ikut di SETIAP email, jadi tiap
 * baris ekstra terbayar berkali-kali. Yang tersisa cuma yang memang harus ada
 * demi kepatuhan (identitas legal, alamat, kontak, S&K, privasi).
 */
export function kakiEmailLinguo(opsi: OpsiKaki = {}): string {
  const tahun = new Date().getFullYear();

  const sosial = IKON_SOSIAL.map(
    ([label, url, berkas]) =>
      `<td style="padding:0 12px 0 0;"><a href="${url}" target="_blank">` +
      `<img src="https://linguo.id/email/${berkas}" width="20" height="20" alt="${label}" ` +
      'style="display:block;width:20px;height:20px;border:0;outline:none;"></a></td>',
  ).join("");

  const kebijakan = [
    ["Syarat &amp; Ketentuan", "https://linguo.id/syarat-ketentuan"],
    ["Pengembalian Dana", "https://linguo.id/pengembalian-dana"],
    ["Kebijakan Privasi", "https://linguo.id/privacy"],
    ["Hubungi Kami", BRAND_FACTS.contact.whatsappUrl],
  ]
    .map(
      ([label, url]) =>
        `<a href="${url}" target="_blank" style="color:#8FB6B3;text-decoration:underline;">${label}</a>`,
    )
    .join('<span style="color:#3F625F;"> &nbsp;·&nbsp; </span>');

  const catatanKecil = [opsi.alasanKirim, opsi.catatan].filter(Boolean).join(" ");

  const font =
    "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;";

  return (
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">' +
    '<tr><td align="center" style="padding:8px 12px 28px;">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" ' +
    `style="max-width:600px;width:100%;border-collapse:collapse;background:${HIJAU_GELAP};border-radius:16px;">` +
    `<tr><td style="padding:20px 24px 18px;${font}">` +
    // ── Baris atas: kiri logo + ikon, kanan alamat & kontak ──────────────
    // Dua tabel ber-`align` (pola fluid-hybrid), BUKAN dua sel: di layar sempit
    // kolom kanan tak muat di samping kolom kiri, jadi turun ke bawah dengan
    // lebar penuh. Kalau pakai dua <td>, alamatnya terjepit jadi 4-5 baris.
    '<table role="presentation" align="left" cellpadding="0" cellspacing="0" border="0" ' +
    'style="border-collapse:collapse;width:100%;max-width:160px;">' +
    '<tr><td valign="top">' +
    `<img src="${EMAIL_LOGO_PUTIH_URL}" width="96" alt="Linguo.id" ` +
    'style="display:block;width:96px;max-width:96px;height:auto;border:0;outline:none;margin:0 0 12px;">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">' +
    `<tr>${sosial}</tr></table>` +
    "</td></tr></table>" +
    '<table role="presentation" align="right" cellpadding="0" cellspacing="0" border="0" ' +
    'style="border-collapse:collapse;width:100%;max-width:380px;">' +
    `<tr><td valign="top" align="right" style="padding-top:8px;color:#8FB6B3;font-size:11px;line-height:18px;${font}">` +
    `${BRAND_FACTS.address.oneLine}, Indonesia<br>` +
    `${BRAND_FACTS.contact.phone} &nbsp;·&nbsp; WhatsApp ` +
    `<a href="${BRAND_FACTS.contact.whatsappUrl}" target="_blank" style="color:#8FB6B3;text-decoration:none;">+62 821-1685-9493</a><br>` +
    `<a href="mailto:${BRAND_FACTS.contact.email}" style="color:#8FB6B3;text-decoration:none;">${BRAND_FACTS.contact.email}</a>` +
    ' &nbsp;·&nbsp; <a href="https://linguo.id" target="_blank" style="color:#8FB6B3;text-decoration:none;">linguo.id</a>' +
    "</td></tr></table>" +
    '<div style="clear:both;font-size:0;line-height:0;">&nbsp;</div>' +
    // ── Pemisah ──────────────────────────────────────────────────────────
    '<div style="height:1px;background:#24504D;margin:14px 0 10px;font-size:0;line-height:0;">&nbsp;</div>' +
    // ── Baris bawah: kiri kebijakan, kanan copyright ──────────────────────
    '<table role="presentation" align="left" cellpadding="0" cellspacing="0" border="0" ' +
    'style="border-collapse:collapse;width:100%;max-width:330px;">' +
    `<tr><td valign="top" style="font-size:11px;line-height:18px;${font}">${kebijakan}</td></tr></table>` +
    '<table role="presentation" align="right" cellpadding="0" cellspacing="0" border="0" ' +
    'style="border-collapse:collapse;width:100%;max-width:210px;">' +
    `<tr><td valign="top" align="right" style="color:#6E918F;font-size:11px;line-height:18px;${font}">` +
    `© ${tahun} ${BRAND_FACTS.legalName}</td></tr></table>` +
    '<div style="clear:both;font-size:0;line-height:0;">&nbsp;</div>' +
    (catatanKecil
      ? `<div style="color:#5A7B79;font-size:10px;line-height:16px;margin:6px 0 0;">${catatanKecil}</div>`
      : "") +
    "</td></tr></table></td></tr></table>"
  );
}

/** Dokumen email lengkap untuk potongan HTML yang belum punya <body>. */
function dokumenEmail(isi: string): string {
  return (
    '<!doctype html><html lang="id"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
    '<body style="margin:0;padding:0;background:#EAF2F2;' +
    "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;\">" +
    isi +
    "</body></html>"
  );
}

/**
 * Tempelkan banner + footer Linguo ke sebuah email.
 * Idempoten: HTML yang sudah punya kop Linguo dikembalikan apa adanya.
 */
export function bungkusEmailLinguo(html: string, opsi: OpsiKaki = {}): string {
  if (!html) return html;
  if (html.includes(PENANDA)) return html;

  const kop = kopEmailLinguo();
  const kaki = kakiEmailLinguo(opsi);

  const cocok = /<body[^>]*>/i.exec(html);
  if (cocok && typeof cocok.index === "number") {
    const mulai = cocok.index + cocok[0].length;
    const tutup = html.toLowerCase().lastIndexOf("</body>");
    if (tutup > mulai) {
      return html.slice(0, mulai) + kop + html.slice(mulai, tutup) + kaki + html.slice(tutup);
    }
    return html.slice(0, mulai) + kop + html.slice(mulai) + kaki;
  }

  // Potongan HTML yang SUDAH melukis latarnya sendiri (mis. <div style="…
  // background:#F5F6F8;padding:24px"> milik template lama) cukup ditempel apa
  // adanya — kalau dibungkus kartu putih lagi, hasilnya kartu di dalam kartu.
  const sudahBerkartu = /^\s*<(div|table)[^>]*style="[^"]*background/i.test(html);
  if (sudahBerkartu) return dokumenEmail(kop + html + kaki);

  // Potongan HTML polos → bungkus di kartu putih 600px di antara kop & kaki.
  const kartu =
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">' +
    '<tr><td align="center" style="padding:12px;">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" ' +
    'style="max-width:600px;width:100%;border-collapse:collapse;background:#ffffff;border-radius:16px;">' +
    '<tr><td style="padding:28px;color:#1F3534;font-size:15px;line-height:24px;">' +
    html +
    "</td></tr></table></td></tr></table>";

  return dokumenEmail(kop + kartu + kaki);
}

/**
 * Ubah email teks polos jadi HTML berkop-berkaki. Dipakai oleh pengirim yang
 * selama ini cuma mengisi `text` (mis. pengingat masa berlaku afiliator):
 * `text` tetap dikirim sebagai versi plain, `html` hasil fungsi ini jadi
 * versi bermerek.
 */
export function htmlDariTeks(teks: string, opsi: OpsiKaki = {}): string {
  const aman = teks
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /(https?:\/\/[^\s<]+)/g,
      '<a href="$1" style="color:#136666;font-weight:600;">$1</a>',
    )
    .replace(/\n/g, "<br>");
  return bungkusEmailLinguo(aman, opsi);
}
