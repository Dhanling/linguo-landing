// ============================================================================
// API: /api/cron/daily-report
// Laporan Harian Linguo — dikirim tiap pagi via email (Vercel Cron + Resend)
// ----------------------------------------------------------------------------
// Dipanggil otomatis oleh Vercel Cron (lihat vercel.json) tiap 00:00 UTC =
// 07:00 WIB. Merekap aktivitas KEMARIN (revenue, registrasi, leads WA) +
// snapshot HARI INI (kelas terjadwal, cicilan jatuh tempo), lalu kirim email
// HTML ke founder.
//
// SECURITY:
//   - Vercel otomatis ngirim header `Authorization: Bearer ${CRON_SECRET}`
//     pas manggil cron. Route nolak request yang headernya ga cocok (401),
//     jadi URL-nya ga bisa di-trigger sembarang orang.
//
// SUMBER DATA (basis kas, zona waktu WIB):
//   - Revenue Kelas    : registrations (payment_status='Lunas', by payment_date)
//   - Revenue E-learn  : digital_purchases (by xendit_paid_at)
//     (NB: tabel `payments` SENGAJA tidak dipakai — itu ledger manual/legacy
//      yang TIDAK mencakup pembayaran Xendit online, jadi under-count ~40%.)
//   - Registrasi baru  : registrations.registration_date = kemarin
//   - Leads WA         : whatsapp_inbox_logs.logged_at = kemarin
//   - Kelas hari ini   : schedules.scheduled_at = hari ini, belum dibatalkan
//   - Cicilan tempo    : registrations payment_status='Cicilan', payment_due_date=hari ini
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CRON_SECRET = process.env.CRON_SECRET || "";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const REPORT_TO = process.env.REPORT_TO || "ramadhanimuhamadlutfi@gmail.com";
const REPORT_FROM =
  process.env.REPORT_FROM || "Linguo Report <onboarding@resend.dev>";

const TEAL = "#1A9E9E";

// ── WIB helpers (WIB = UTC+7) ────────────────────────────────────────────────
// Geser instant +7 jam lalu ambil bagian tanggal ISO → tanggal kalender WIB.
function wibDateStr(d: Date): string {
  return new Date(d.getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10);
}
// UTC ISO instant dari 00:00 WIB pada tanggal WIB tertentu.
function wibMidnightUtc(wibDate: string): string {
  return new Date(wibDate + "T00:00:00+07:00").toISOString();
}
function addDaysStr(wibDate: string, n: number): string {
  const base = new Date(wibDate + "T00:00:00+07:00");
  return wibDateStr(new Date(base.getTime() + n * 86400000));
}
function rupiah(n: number): string {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(req: NextRequest) {
  // ── Guard: cuma Vercel Cron (atau yang pegang secret) yang boleh ─────────
  const authHeader = req.headers.get("authorization") || "";
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ── Rentang tanggal (WIB) ────────────────────────────────────────────
    const todayWib = wibDateStr(new Date()); // hari ini
    const yWib = addDaysStr(todayWib, -1); // kemarin
    const tomorrowWib = addDaysStr(todayWib, 1);
    const monthStartWib = todayWib.slice(0, 7) + "-01";

    const yStart = wibMidnightUtc(yWib); // [kemarin 00:00 WIB
    const yEnd = wibMidnightUtc(todayWib); //  s/d hari ini 00:00 WIB)
    const todayStart = wibMidnightUtc(todayWib); // [hari ini 00:00 WIB
    const todayEnd = wibMidnightUtc(tomorrowWib); //  s/d besok 00:00 WIB)
    const monthStart = wibMidnightUtc(monthStartWib);
    // Batas bawah query revenue = paling awal antara awal-bulan vs kemarin
    // (handle kasus tanggal 1: kemarin masih bulan lalu).
    const revStart = monthStart < yStart ? monthStart : yStart;

    // ── Query paralel (semua ringan, aman utk limit 10s Hobby) ───────────
    const [liveRes, elRes, regRes, waRes, kelasRes, cicilanRes] =
      await Promise.all([
        // 1a. Revenue kelas live (Lunas, by payment_date) — window MTD/kemarin
        admin
          .from("registrations")
          .select("total_amount, product, payment_date")
          .eq("payment_status", "Lunas")
          .is("archived_at", null)
          .gte("payment_date", revStart),
        // 1b. Revenue e-learning (by xendit_paid_at)
        admin
          .from("digital_purchases")
          .select("amount, xendit_paid_at")
          .is("archived_at", null)
          .gte("xendit_paid_at", revStart),
        // 2. Registrasi baru kemarin
        admin
          .from("registrations")
          .select("product, language, payment_status, status")
          .eq("registration_date", yWib)
          .is("archived_at", null),
        // 3. Leads WA baru kemarin
        admin
          .from("whatsapp_inbox_logs")
          .select("is_existing_customer, inquiry_type")
          .gte("logged_at", yStart)
          .lt("logged_at", yEnd),
        // 4. Kelas terjadwal hari ini (belum dibatalkan)
        admin
          .from("schedules")
          .select("id", { count: "exact", head: true })
          .is("cancelled_at", null)
          .gte("scheduled_at", todayStart)
          .lt("scheduled_at", todayEnd),
        // 5. Cicilan jatuh tempo hari ini
        admin
          .from("registrations")
          .select("total_amount, installment_paid")
          .eq("payment_status", "Cicilan")
          .eq("payment_due_date", todayWib)
          .is("archived_at", null),
      ]);

    // ── Olah Revenue ─────────────────────────────────────────────────────
    const inRange = (ts: string | null, a: string, b: string) =>
      !!ts && ts >= a && ts < b;
    const gteMonth = (ts: string | null) => !!ts && ts >= monthStart;

    const liveRows = liveRes.data || [];
    let kelasYesterday = 0;
    let kelasMtd = 0;
    for (const r of liveRows) {
      const amt = Number(r.total_amount || 0);
      if (inRange(r.payment_date as string, yStart, yEnd)) kelasYesterday += amt;
      if (gteMonth(r.payment_date as string)) kelasMtd += amt;
    }

    const elRows = elRes.data || [];
    let elYesterday = 0;
    let elMtd = 0;
    for (const r of elRows) {
      const amt = Number(r.amount || 0);
      if (inRange(r.xendit_paid_at as string, yStart, yEnd)) elYesterday += amt;
      if (gteMonth(r.xendit_paid_at as string)) elMtd += amt;
    }

    const revYesterday = kelasYesterday + elYesterday;
    const revMtd = kelasMtd + elMtd;

    // ── Olah Registrasi baru ─────────────────────────────────────────────
    const regRows = (regRes.data || []).filter(
      (r) => (r.status as string) !== "Batal"
    );
    const regCount = regRows.length;
    const regByProduct: Record<string, number> = {};
    let regPaid = 0;
    for (const r of regRows) {
      const p = (r.product as string) || "Lainnya";
      regByProduct[p] = (regByProduct[p] || 0) + 1;
      if (r.payment_status === "Lunas" || r.payment_status === "Cicilan")
        regPaid += 1;
    }

    // ── Olah Leads WA ────────────────────────────────────────────────────
    const waRows = waRes.data || [];
    const waCount = waRows.length;
    const waNew = waRows.filter((r) => r.is_existing_customer === false).length;

    // ── Kelas hari ini ───────────────────────────────────────────────────
    const kelasHariIni = kelasRes.count || 0;

    // ── Cicilan jatuh tempo ──────────────────────────────────────────────
    const cicilanRows = cicilanRes.data || [];
    const cicilanCount = cicilanRows.length;
    const cicilanRemaining = cicilanRows.reduce(
      (t, r) =>
        t + (Number(r.total_amount || 0) - Number(r.installment_paid || 0)),
      0
    );

    // ── Render email ─────────────────────────────────────────────────────
    const dateLabel = new Date(yWib + "T12:00:00+07:00").toLocaleDateString(
      "id-ID",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Jakarta",
      }
    );

    const html = buildEmail({
      dateLabel,
      revYesterday,
      kelasYesterday,
      elYesterday,
      revMtd,
      regCount,
      regPaid,
      regByProduct,
      waCount,
      waNew,
      kelasHariIni,
      cicilanCount,
      cicilanRemaining,
    });

    // ── Kirim via Resend ─────────────────────────────────────────────────
    if (!RESEND_API_KEY) {
      return NextResponse.json(
        { error: "RESEND_API_KEY belum di-set" },
        { status: 500 }
      );
    }
    const resend = new Resend(RESEND_API_KEY);
    const { error: sendErr } = await resend.emails.send({
      from: REPORT_FROM,
      to: REPORT_TO,
      subject: `Laporan Harian Linguo - ${dateLabel}`,
      html,
    });
    if (sendErr) {
      console.error("resend send error:", sendErr);
      return NextResponse.json(
        { error: "Gagal kirim email", detail: sendErr },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      sent_to: REPORT_TO,
      summary: {
        revenue_kemarin: revYesterday,
        revenue_mtd: revMtd,
        registrasi_baru: regCount,
        leads_wa: waCount,
        kelas_hari_ini: kelasHariIni,
        cicilan_jatuh_tempo: cicilanCount,
      },
    });
  } catch (err) {
    console.error("daily-report error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ── Email builder ─────────────────────────────────────────────────────────
type EmailData = {
  dateLabel: string;
  revYesterday: number;
  kelasYesterday: number;
  elYesterday: number;
  revMtd: number;
  regCount: number;
  regPaid: number;
  regByProduct: Record<string, number>;
  waCount: number;
  waNew: number;
  kelasHariIni: number;
  cicilanCount: number;
  cicilanRemaining: number;
};

function statCard(label: string, value: string, sub: string): string {
  return (
    '<td width="50%" valign="top" style="padding:6px;">' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">' +
    '<tr><td style="padding:16px;">' +
    '<div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.4px;font-weight:700;">' +
    label +
    "</div>" +
    '<div style="font-size:26px;color:#0f172a;font-weight:800;margin:6px 0 2px;">' +
    value +
    "</div>" +
    '<div style="font-size:13px;color:#64748b;">' +
    sub +
    "</div>" +
    "</td></tr></table></td>"
  );
}

function buildEmail(d: EmailData): string {
  const entries = Object.entries(d.regByProduct).sort((a, b) => b[1] - a[1]);
  const productRows =
    entries.length === 0
      ? '<tr><td style="padding:6px 0;color:#94a3b8;font-size:14px;">Belum ada registrasi baru kemarin.</td></tr>'
      : entries
          .map(
            ([p, n]) =>
              '<tr><td style="padding:6px 0;border-bottom:1px solid #f1f5f9;color:#334155;font-size:14px;">' +
              escapeHtml(p) +
              '</td><td style="padding:6px 0;border-bottom:1px solid #f1f5f9;text-align:right;color:#0f172a;font-size:14px;font-weight:700;">' +
              n +
              "</td></tr>"
          )
          .join("");

  const cicilanSub =
    d.cicilanCount > 0
      ? rupiah(d.cicilanRemaining) + " sisa tagihan"
      : "Tidak ada hari ini";

  return (
    '<!doctype html><html lang="id"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
    "<body style=\"margin:0;padding:0;background:#eef2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;\">" +
    '<table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f5;padding:24px 12px;"><tr><td align="center">' +
    '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.06);">' +
    // Header
    '<tr><td style="background:' +
    TEAL +
    ';padding:28px 28px 24px;">' +
    '<div style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-.3px;">Linguo</div>' +
    '<div style="color:rgba(255,255,255,.92);font-size:16px;font-weight:700;margin-top:10px;">Laporan Harian</div>' +
    '<div style="color:rgba(255,255,255,.78);font-size:13px;margin-top:2px;">Rekap ' +
    d.dateLabel +
    "</div></td></tr>" +
    // Revenue hero
    '<tr><td style="padding:24px 28px 8px;">' +
    '<div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.4px;font-weight:700;">Pemasukan Kemarin</div>' +
    '<div style="font-size:38px;color:' +
    TEAL +
    ';font-weight:800;margin:6px 0 8px;letter-spacing:-1px;">' +
    rupiah(d.revYesterday) +
    "</div>" +
    '<div style="font-size:14px;color:#475569;">Kelas <b style="color:#0f172a;">' +
    rupiah(d.kelasYesterday) +
    '</b> &nbsp;&middot;&nbsp; E-learning <b style="color:#0f172a;">' +
    rupiah(d.elYesterday) +
    "</b></div>" +
    '<div style="margin-top:14px;padding:12px 14px;background:#f0fdfa;border:1px solid #ccfbf1;border-radius:10px;font-size:14px;color:#0f766e;">Total bulan ini (MTD): <b>' +
    rupiah(d.revMtd) +
    "</b></div></td></tr>" +
    // Stat grid
    '<tr><td style="padding:14px 22px 4px;"><table width="100%" cellpadding="0" cellspacing="0"><tr>' +
    statCard("Registrasi Baru", String(d.regCount), d.regPaid + " sudah bayar") +
    statCard("Leads WA", String(d.waCount), d.waNew + " prospek baru") +
    "</tr><tr>" +
    statCard("Kelas Hari Ini", String(d.kelasHariIni), "sesi terjadwal") +
    statCard("Cicilan Tempo", String(d.cicilanCount), cicilanSub) +
    "</tr></table></td></tr>" +
    // Per-product
    '<tr><td style="padding:18px 28px 8px;">' +
    '<div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.4px;font-weight:700;margin-bottom:6px;">Registrasi Baru per Produk</div>' +
    '<table width="100%" cellpadding="0" cellspacing="0">' +
    productRows +
    "</table></td></tr>" +
    // Footer
    '<tr><td style="padding:20px 28px 26px;">' +
    '<div style="border-top:1px solid #e2e8f0;padding-top:14px;font-size:12px;color:#94a3b8;line-height:1.5;">' +
    "Laporan otomatis dari dashboard Linguo, dikirim tiap pagi 07:00 WIB.<br>" +
    "Pemasukan = pembayaran lunas (kelas) + e-learning, basis kas, zona waktu WIB." +
    "</div></td></tr>" +
    "</table></td></tr></table></body></html>"
  );
}
