// =============================================================================
// src/lib/slipGajiEmail.ts
// [slip-gaji-email-v1]
//
// Email slip gaji ke karyawan begitu Xendit mengonfirmasi transfer gajinya
// SUKSES (webhook /api/affiliate/payout-webhook, prefix SAL-). Isi email =
// rincian slip (pendapatan, potongan, gaji bersih, rekening tujuan) + lampiran
// PDF. Struk resmi Xendit tetap terkirim terpisah dari edge fn salary-disburse.
//
// Hanya EMAIL ke employees.email — sengaja tanpa WA: nomor bot dipantau staf
// lain di WA Inbox, gaji orang tidak boleh ikut terbaca.
//
// Tidak pernah melempar: gagal kirim slip tidak boleh membuat webhook membalas
// non-200 (Xendit akan mengulang callback padahal gajinya sudah 'paid').
// =============================================================================

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { bungkusEmailLinguo } from "@/lib/emailChrome";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "Linguo <noreply@linguo.id>";

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli",
  "Agustus", "September", "Oktober", "November", "Desember"];

const rupiah = (n: unknown) => "Rp" + Math.round(Number(n) || 0).toLocaleString("id-ID");
const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** "2026-10" → "Oktober 2026" */
function periodLabel(p: unknown): string {
  const [y, m] = String(p || "").split("-").map(Number);
  return y && m ? `${MONTHS[m - 1]} ${y}` : String(p || "");
}

type Slip = {
  nama: string; jabatan: string; periode: string; dibayar: string;
  pendapatan: [string, number][]; potongan: [string, number][];
  bruto: number; totalPotongan: number; bersih: number;
  rekening: string; referensi: string;
};

function susunSlip(row: any, emp: any, xenditId: string | null): Slip {
  const angka = (v: unknown) => Math.round(Number(v) || 0);
  const pendapatan: [string, number][] = [
    ["Gaji pokok", angka(row.base_salary)],
    ["Tunjangan transport", angka(row.transport_allowance)],
    ["Tunjangan makan", angka(row.meal_allowance)],
  ];
  const potonganRinci: [string, number][] = [
    ["BPJS Kesehatan", angka(row.bpjs_kes)],
    ["BPJS Ketenagakerjaan", angka(row.bpjs_tk)],
    ["PPh 21", angka(row.pph21)],
  ];
  const totalPotongan = angka(row.deductions) || potonganRinci.reduce((s, [, v]) => s + v, 0);
  const lain = totalPotongan - potonganRinci.reduce((s, [, v]) => s + v, 0);
  if (lain > 0) potonganRinci.push(["Potongan lain", lain]);

  const bank = row.bank_name || emp.bank_name || String(row.bank_code || emp.bank_code || "").replace(/^ID_/, "");
  const noRek = String(row.account_number || emp.account_number || "");
  const rekening = [bank, noRek ? `···${noRek.slice(-4)}` : "", `a.n. ${row.account_holder || emp.account_holder || "-"}`]
    .filter(Boolean).join(" ");

  return {
    nama: String(row.employee_name || emp.name || "Karyawan"),
    jabatan: String(emp.position || ""),
    periode: periodLabel(row.period),
    dibayar: new Date(row.paid_at || Date.now()).toLocaleString("id-ID", {
      day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta",
    }).replace(/\./g, ":") + " WIB",
    pendapatan: pendapatan.filter(([, v]) => v > 0),
    potongan: potonganRinci.filter(([, v]) => v > 0),
    bruto: angka(row.gross) || pendapatan.reduce((s, [, v]) => s + v, 0),
    totalPotongan,
    bersih: angka(row.net),
    rekening,
    referensi: xenditId || row.xendit_payout_id || "",
  };
}

function htmlSlip(s: Slip): string {
  const baris = (label: string, nilai: string, tebal = false) =>
    `<tr><td style="padding:6px 0;color:#4B6462;${tebal ? "font-weight:700;color:#0F2D2C;" : ""}">${esc(label)}</td>` +
    `<td align="right" style="padding:6px 0;white-space:nowrap;${tebal ? "font-weight:700;color:#0F2D2C;" : ""}">${esc(nilai)}</td></tr>`;
  const judul = (t: string) =>
    `<tr><td colspan="2" style="padding:14px 0 4px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#1A9E9E;font-weight:700;border-top:1px solid #E3ECEB;">${t}</td></tr>`;

  return (
    `<p style="margin:0 0 6px;">Halo ${esc(s.nama.trim().split(/\s+/)[0])},</p>` +
    `<p style="margin:0 0 18px;">Gaji periode <strong>${esc(s.periode)}</strong> sudah ditransfer ke rekeningmu. Berikut slip gajinya — versi PDF terlampir.</p>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;background:#F3FAF9;border-radius:12px;">` +
    `<tr><td style="padding:16px 18px;">` +
    `<div style="font-size:12px;color:#4B6462;">Gaji bersih diterima</div>` +
    `<div style="font-size:26px;line-height:34px;font-weight:800;color:#0F2D2C;">${rupiah(s.bersih)}</div>` +
    `<div style="font-size:13px;color:#4B6462;">ke ${esc(s.rekening)}</div>` +
    `</td></tr></table>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-top:16px;font-size:14px;">` +
    baris("Nama", s.nama) +
    (s.jabatan ? baris("Jabatan", s.jabatan) : "") +
    baris("Periode", s.periode) +
    baris("Dibayar", s.dibayar) +
    judul("Pendapatan") +
    s.pendapatan.map(([l, v]) => baris(l, rupiah(v))).join("") +
    baris("Total pendapatan", rupiah(s.bruto), true) +
    (s.totalPotongan > 0
      ? judul("Potongan") +
        s.potongan.map(([l, v]) => baris(l, "-" + rupiah(v))).join("") +
        baris("Total potongan", "-" + rupiah(s.totalPotongan), true)
      : "") +
    judul("Diterima") +
    baris("Gaji bersih", rupiah(s.bersih), true) +
    (s.referensi ? baris("No. referensi transfer", s.referensi) : "") +
    `</table>` +
    `<p style="margin:18px 0 0;font-size:13px;color:#4B6462;">Dana biasanya masuk dalam beberapa menit, tergantung bank tujuan. Kalau ada angka yang tidak sesuai, balas ke owner langsung ya. Slip ini bersifat pribadi — mohon tidak diteruskan.</p>`
  );
}

/** pdf-lib font standar cuma WinAnsi — karakter di luar itu diganti supaya tidak melempar. */
const latin = (s: unknown) => String(s ?? "").replace(/[^\x20-\x7E -ÿ]/g, "?");

async function pdfSlip(s: Slip): Promise<string> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const teal = rgb(0.102, 0.62, 0.62);
  const gelap = rgb(0.059, 0.176, 0.173);
  const abu = rgb(0.38, 0.45, 0.45);
  const KIRI = 50, KANAN = 545;
  let y = 841.89;

  page.drawRectangle({ x: 0, y: y - 90, width: 595.28, height: 90, color: teal });
  page.drawText("Linguo.id", { x: KIRI, y: y - 48, size: 22, font: bold, color: rgb(1, 1, 1) });
  page.drawText("PT Linguo Edu Indonesia", { x: KIRI, y: y - 66, size: 9, font, color: rgb(1, 1, 1) });
  const jdl = "SLIP GAJI";
  page.drawText(jdl, { x: KANAN - bold.widthOfTextAtSize(jdl, 18), y: y - 46, size: 18, font: bold, color: rgb(1, 1, 1) });
  const per = latin(s.periode);
  page.drawText(per, { x: KANAN - font.widthOfTextAtSize(per, 10), y: y - 64, size: 10, font, color: rgb(1, 1, 1) });
  y -= 120;

  const baris = (label: string, nilai: string, tebal = false) => {
    const f = tebal ? bold : font;
    page.drawText(latin(label), { x: KIRI, y, size: 10.5, font: f, color: tebal ? gelap : abu });
    const v = latin(nilai);
    page.drawText(v, { x: KANAN - f.widthOfTextAtSize(v, 10.5), y, size: 10.5, font: f, color: gelap });
    y -= 19;
  };
  const judul = (t: string) => {
    y -= 8;
    page.drawLine({ start: { x: KIRI, y: y + 12 }, end: { x: KANAN, y: y + 12 }, thickness: 0.6, color: rgb(0.89, 0.93, 0.92) });
    page.drawText(t.toUpperCase(), { x: KIRI, y: y - 6, size: 9, font: bold, color: teal });
    y -= 26;
  };

  baris("Nama", s.nama);
  if (s.jabatan) baris("Jabatan", s.jabatan);
  baris("Periode", s.periode);
  baris("Dibayar", s.dibayar);
  judul("Pendapatan");
  for (const [l, v] of s.pendapatan) baris(l, rupiah(v));
  baris("Total pendapatan", rupiah(s.bruto), true);
  if (s.totalPotongan > 0) {
    judul("Potongan");
    for (const [l, v] of s.potongan) baris(l, "-" + rupiah(v));
    baris("Total potongan", "-" + rupiah(s.totalPotongan), true);
  }
  y -= 12;
  page.drawRectangle({ x: KIRI - 10, y: y - 22, width: KANAN - KIRI + 20, height: 44, color: rgb(0.953, 0.98, 0.976) });
  page.drawText("GAJI BERSIH DITERIMA", { x: KIRI, y: y - 5, size: 10, font: bold, color: gelap });
  const net = rupiah(s.bersih);
  page.drawText(net, { x: KANAN - bold.widthOfTextAtSize(net, 15), y: y - 7, size: 15, font: bold, color: teal });
  y -= 52;
  baris("Ditransfer ke", s.rekening);
  if (s.referensi) baris("No. referensi transfer", s.referensi);

  page.drawText("Slip ini dibuat otomatis oleh sistem Linguo dan sah tanpa tanda tangan.", {
    x: KIRI, y: 50, size: 8.5, font, color: abu,
  });
  return Buffer.from(await doc.save()).toString("base64");
}

/**
 * Kirim slip gaji baris payroll `payrollId` ke email karyawannya.
 * Dipanggil webhook HANYA saat baris baru saja berpindah ke 'paid', jadi
 * callback Xendit yang terulang tidak mengirim slip dua kali.
 */
export async function kirimSlipGaji(
  admin: any,
  payrollId: string,
  xenditId: string | null,
): Promise<"terkirim" | "tanpa-email" | "gagal"> {
  try {
    const { data: row } = await admin.from("payroll").select("*").eq("id", payrollId).maybeSingle();
    if (!row) return "gagal";
    const { data: emp } = row.employee_id
      ? await admin.from("employees").select("*").eq("id", row.employee_id).maybeSingle()
      : { data: null };
    const to = String(emp?.email || "").trim();
    if (!to.includes("@")) {
      console.warn("[slip-gaji] email karyawan kosong, slip tidak dikirim:", payrollId);
      return "tanpa-email";
    }
    if (!RESEND_API_KEY) return "gagal";

    const slip = susunSlip(row, emp || {}, xenditId);
    let attachments: { filename: string; content: string }[] = [];
    try {
      attachments = [{
        filename: `Slip-Gaji-${slip.periode.replace(/\s+/g, "-")}-${slip.nama.trim().split(/\s+/)[0]}.pdf`.replace(/[^\w.\-]/g, ""),
        content: await pdfSlip(slip),
      }];
    } catch (err) {
      console.error("[slip-gaji] PDF gagal dibuat, email tetap dikirim tanpa lampiran:", err);
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [to],
        subject: `Slip Gaji ${slip.periode} — Linguo`,
        html: bungkusEmailLinguo(htmlSlip(slip), {
          alasanKirim: "Kamu menerima email ini karena terdaftar sebagai karyawan Linguo.",
          catatan: "Email otomatis — slip gaji bersifat pribadi.",
        }),
        ...(attachments.length ? { attachments } : {}),
      }),
    });
    if (!res.ok) {
      console.error("[slip-gaji] email gagal:", res.status, await res.text());
      return "gagal";
    }
    return "terkirim";
  } catch (err) {
    console.error("[slip-gaji] error (tidak fatal):", err);
    return "gagal";
  }
}
