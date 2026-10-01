// ============================================================================
// API: /api/cron/daily-report
// Laporan Harian Linguo — dikirim tiap pagi via email (Vercel Cron + Resend)
// ----------------------------------------------------------------------------
// Dipanggil otomatis oleh Vercel Cron (lihat vercel.json) tiap 00:00 UTC =
// 07:00 WIB. Isinya tiga bagian [daily-report-v2]:
//   1. PEMASUKAN KEMARIN — dirinci per produk, per jalur masuk, per metode
//      bayar, plus daftar transaksinya satu per satu.
//   2. YANG PERLU DIKERJAKAN — semua hal yang masih menggantung, dikelompokkan
//      per bidang (Sales & CS, Keuangan, Akademik, Tim & Operasional).
//   3. SARAN — bacaan singkat atas angka-angkanya (laju ke target, dsb.).
//
// SECURITY:
//   - Vercel otomatis ngirim header `Authorization: Bearer ${CRON_SECRET}`
//     pas manggil cron. Route nolak request yang headernya ga cocok (401),
//     jadi URL-nya ga bisa di-trigger sembarang orang.
//
// PARAMETER UJI (tetap butuh CRON_SECRET):
//   ?dry=1            → kembalikan HTML-nya, TIDAK mengirim email
//   ?date=YYYY-MM-DD  → anggap tanggal itu "hari ini" (laporan = H-1-nya)
//
// SUMBER PEMASUKAN — SENGAJA disamakan dengan `liveRegs` di Overview dashboard
// (linguo-admin-dashboard/src/pages/Overview.tsx) supaya angka email = angka
// dashboard. Kalau Overview berubah, ubah juga di sini:
//   - registrations        : total_amount, di tanggal bayar. Tanggal bayar =
//                            manual_invoices.paid_at PALING AWAL kalau ada,
//                            lalu payment_date, lalu registration_date.
//   - registration_addons  : add-on (e-book / recording / modul)
//   - digital_purchases    : Lunas, belum dimigrasi & tanpa registration_id
//   - leads program=simulasi (paywall simulasi tes)
//   - corporate_invoices   : invoice B2B lunas (paid_at)
//   (NB: tabel `payments` SENGAJA tidak dipakai — itu ledger manual/legacy
//    yang TIDAK mencakup pembayaran Xendit online.)
// Semua tanggal dibaca dalam zona waktu WIB.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CRON_SECRET = process.env.CRON_SECRET || "";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const REPORT_TO = process.env.REPORT_TO || "ramadhanimuhamadlutfi@gmail.com";
const REPORT_FROM =
  process.env.REPORT_FROM || "Linguo Report <onboarding@resend.dev>";

const TEAL = "#1A9E9E";
const DASH = "https://dashboard.linguo.id";

// Target omzet per bulan — CERMIN `OMZET_TARGET_BY_MONTH` di Overview dashboard
// (linguo-patch:omzet-vs-target-v1). Ubah di sana → ubah di sini.
const OMZET_TARGET_YEAR = 2026;
const OMZET_TARGET_BY_MONTH = [60, 60, 60, 75, 75, 75, 90, 90, 90, 100, 100, 100].map(
  (j) => j * 1_000_000
);

// Produk kelas yang butuh pengajar & jadwal sendiri (bukan batch).
const PRODUK_PRIVAT = [
  "Kelas Private",
  "Kelas Semi Private",
  "Kelas Kids",
  "English Test Prep Private",
];
const PRODUK_BATCH = ["Kelas Reguler", "English Test Preparation (IELTS/TOEFL)"];

const JALUR_LABEL: Record<string, string> = {
  funnel_lead: "Website (checkout sendiri)",
  manual_invoice: "Tagihan dari WA Inbox",
  self_service: "Akun siswa (/akun)",
  manual: "Input admin",
  trial_landing: "Trial (website)",
  free_class: "Kelas gratis",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

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
// Tanggal WIB dari timestamp ATAU tanggal murni ("2026-09-30" = tengah malam
// UTC = 07:00 WIB hari yang sama, jadi aman lewat jalur yang sama).
function wibDay(ts: string | null | undefined): string | null {
  if (!ts) return null;
  const d = new Date(String(ts).replace(" ", "T"));
  return isNaN(d.getTime()) ? null : wibDateStr(d);
}
function rupiah(n: number): string {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}
function rupiahRingkas(n: number): string {
  const v = Math.round(n);
  if (Math.abs(v) >= 1_000_000)
    return "Rp " + (v / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " jt";
  if (Math.abs(v) >= 1_000) return "Rp " + Math.round(v / 1_000) + " rb";
  return "Rp " + v;
}
function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
// "30 Sep" dari tanggal/timestamp.
function tglPendek(ts: string | null | undefined): string {
  const day = wibDay(ts);
  if (!day) return "-";
  return new Date(day + "T12:00:00+07:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Jakarta",
  });
}
// "30 Sep 21.40" dari timestamp.
function tglJam(ts: string): string {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return "-";
  const jam = d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
  return tglPendek(ts) + " " + jam;
}
function produkLabel(p: string | null | undefined): string {
  const s = String(p || "").trim();
  if (s === "English Test Preparation (IELTS/TOEFL)") return "Test Prep (IELTS/TOEFL)";
  if (s === "English Test Prep Private") return "Test Prep Private";
  return s || "Lainnya";
}
function metodeLabel(m: string | null | undefined): string {
  const s = String(m || "").trim();
  if (!s) return "Tanpa catatan metode";
  const [jenis, kanal] = s.split(" - ").map((x) => x.trim());
  if (jenis === "QR_CODE") return "QRIS";
  if (jenis === "BANK_TRANSFER") return kanal ? "Transfer " + kanal : "Transfer bank";
  if (jenis === "CREDIT_CARD") return "Kartu kredit";
  if (jenis === "EWALLET") return kanal ? "E-wallet " + kanal : "E-wallet";
  if (jenis === "PAYLATER") return kanal ? "Paylater " + kanal : "Paylater";
  if (jenis === "RETAIL_OUTLET") return kanal ? "Gerai " + kanal : "Gerai retail";
  return s;
}
// "A, B, C +2 lainnya" (sudah di-escape).
function daftar(items: string[], maks = 5, pemisah = ", "): string {
  const bersih = items.map((s) => String(s || "").trim()).filter(Boolean);
  const tampil = bersih.slice(0, maks).map(escapeHtml).join(pemisah);
  const sisa = bersih.length - maks;
  return sisa > 0 ? tampil + " +" + sisa + " lainnya" : tampil;
}
// Nama kontak WA sering cuma "." atau emoji — pakai nomornya kalau begitu.
function namaKontak(nama: string | null | undefined, phone: string | null | undefined): string {
  const n = String(nama || "").trim();
  if (/[\p{L}\p{N}]/u.test(n)) return n;
  const p = String(phone || "").replace(/@.*$/, "");
  return p ? "+" + p : n || "—";
}
// Pesan penutup percakapan ("ok makasih", "baik kak") tidak butuh balasan —
// tanpa saringan ini daftar "belum dibalas" penuh ucapan terima kasih.
function cumaBasaBasi(body: string | null | undefined): boolean {
  const t = String(body || "").trim().toLowerCase();
  if (!t) return true;
  if (t.includes("?") || t.length > 45) return false;
  if (/(mau|daftar|bayar|transfer|jadwal|kapan|berapa|gimana|bagaimana|bisa|tolong|minta)/.test(t))
    return false;
  return /^(ok|oke+|okay|okey|baik|siap|sip|noted|iya+|ya+|oh|wah+|hehe+|mantap|makasi|makasih|terima ?kasih|trims|thanks?|thank you|thx|sama[- ]?sama|sama2|👍|🙏)/.test(
    t
  );
}

// ── Tipe data email ──────────────────────────────────────────────────────────
type Trx = {
  day: string; // tanggal uang masuk (WIB)
  nama: string;
  produk: string;
  detail: string; // bahasa · level / judul
  bahasa?: string; // hanya kelas — untuk rincian per bahasa
  jumlah: number;
  jalur: string;
  metode: string;
  asal?: string; // students.source — tahu Linguo dari mana
  catatan?: string;
  b2b?: boolean;
};
type Area = "sales" | "keuangan" | "akademik" | "ops";
type Aksi = {
  area: Area;
  prioritas: 1 | 2 | 3; // 1 = segera, 2 = hari ini, 3 = pantau
  judul: string;
  rincian?: string; // HTML aman (sudah di-escape)
  saran: string;
  link?: string;
};

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
    const dry = req.nextUrl.searchParams.get("dry") === "1";
    const dateParam = req.nextUrl.searchParams.get("date") || "";

    // Query yang gagal TIDAK boleh diam-diam jadi angka nol: labelnya dicatat
    // dan ditulis di kaki email. Tiap select dipaginasi — PostgREST memotong
    // respons di 1000 baris tanpa error.
    const gagal: string[] = [];
    async function ambil(
      label: string,
      buat: (
        dari: number,
        sampai: number
      ) => PromiseLike<{ data: unknown; error: { message?: string } | null }>,
      maks = 5000
    ): Promise<Row[]> {
      const out: Row[] = [];
      try {
        for (let dari = 0; dari < maks; dari += 1000) {
          const { data, error } = await buat(dari, dari + 999);
          if (error) throw new Error(error.message || "query gagal");
          const rows = (data as Row[]) || [];
          out.push(...rows);
          if (rows.length < 1000) break;
        }
      } catch (e) {
        console.error(`daily-report [${label}]`, e);
        gagal.push(label);
      }
      return out;
    }

    // ── Rentang tanggal (WIB) ────────────────────────────────────────────
    const now = Date.now();
    const todayWib = /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? dateParam
      : wibDateStr(new Date()); // hari ini
    const yWib = addDaysStr(todayWib, -1); // kemarin = hari yang dilaporkan
    const tomorrowWib = addDaysStr(todayWib, 1);
    // [daily-report-mtd-bulan-laporan-v1] MTD = bulan dari HARI YANG DILAPORKAN.
    // Dulu dihitung dari bulan "hari ini", jadi email tanggal 1 selalu menulis
    // "Total bulan ini: Rp 0" padahal yang dilaporkan hari terakhir bulan lalu.
    const monthStartWib = yWib.slice(0, 7) + "-01";
    const avgStartWib = addDaysStr(yWib, -7);
    const windowStartWib = monthStartWib < avgStartWib ? monthStartWib : avgStartWib;
    // Jendela tarik data dilebihkan 35 hari: tanggal bayar registrasi bisa
    // ditimpa paid_at tagihan manual yang jatuh di hari lain.
    const fetchFromWib = addDaysStr(windowStartWib, -35);
    const fetchFrom = wibMidnightUtc(fetchFromWib);

    const yStart = wibMidnightUtc(yWib); // [kemarin 00:00 WIB
    const yEnd = wibMidnightUtc(todayWib); //  s/d hari ini 00:00 WIB)
    const todayStart = wibMidnightUtc(todayWib);
    const todayEnd = wibMidnightUtc(tomorrowWib);
    const isoAgo = (hari: number) => new Date(now - hari * 86400000).toISOString();
    const isoAhead = (hari: number) => new Date(now + hari * 86400000).toISOString();

    const REG_COLS =
      "id, student_id, product, language, level, total_amount, payment_status, status, payment_date, registration_date, refunded_at, enrollment_source, xendit_payment_method, installment_paid, students(name, source, is_test, is_test_account)";

    // ── Query paralel ────────────────────────────────────────────────────
    const [
      regsByPay,
      regsNoPayDate,
      minvPaid,
      addons,
      digital,
      simulasi,
      b2bInv,
      pelunasan,
      refundsDone,
      regBaru,
      waBaru,
      kelasRes,
      csMsgs,
      reminders,
      awaiting,
      minvPending,
      regPending,
      leadPending,
      trials,
      placements,
      interp,
      b2bUnpaid,
      cicilan,
      payoutReq,
      refundPending,
      noTeacher,
      noBatch,
      privatAktif,
      churnFu,
      batches,
      addonEbookPaid,
      dormanBaru,
      tasks,
      notifFu,
      bugs,
      senders,
      tApps,
      bundleRegs,
    ] = await Promise.all([
      // ── Pemasukan ──
      ambil("registrasi (tanggal bayar)", (a, b) =>
        admin
          .from("registrations")
          .select(REG_COLS)
          .is("archived_at", null)
          .gte("payment_date", fetchFrom)
          .order("id")
          .range(a, b)
      ),
      // Lunas/Cicilan tanpa payment_date → dianggap dibayar di tanggal daftar.
      ambil("registrasi (tanpa tanggal bayar)", (a, b) =>
        admin
          .from("registrations")
          .select(REG_COLS)
          .is("archived_at", null)
          .is("payment_date", null)
          .in("payment_status", ["Lunas", "Cicilan"])
          .gte("registration_date", fetchFromWib)
          .order("id")
          .range(a, b)
      ),
      ambil("tagihan manual lunas", (a, b) =>
        admin
          .from("manual_invoices")
          .select("id, converted_registration_id, paid_at")
          .eq("status", "paid")
          .not("converted_registration_id", "is", null)
          .not("paid_at", "is", null)
          .order("id")
          .range(a, b)
      ),
      ambil("add-on", (a, b) =>
        admin
          .from("registration_addons")
          .select(
            "id, addon_type, description, total_amount, payment_status, payment_date, purchase_date, registrations(language, enrollment_source, xendit_payment_method, students(name, is_test, is_test_account))"
          )
          .or(`payment_date.gte.${fetchFromWib},purchase_date.gte.${fetchFromWib}`)
          .order("id")
          .range(a, b)
      ),
      ambil("penjualan digital", (a, b) =>
        admin
          .from("digital_purchases")
          .select(
            "id, buyer_name, buyer_email, amount, source, xendit_paid_at, created_at, xendit_payment_method, digital_products(type, language, title)"
          )
          .eq("payment_status", "Lunas")
          .is("migrated_to_reg_id", null)
          .is("archived_at", null)
          .is("registration_id", null)
          .gte("created_at", fetchFrom)
          .order("id")
          .range(a, b)
      ),
      ambil("simulasi tes", (a, b) =>
        admin
          .from("leads")
          .select("id, name, email, level, amount, paid_amount, paid_at, created_at, payment_method")
          .eq("program", "simulasi")
          .in("payment_status", ["PAID", "CONVERTED"])
          .is("archived_at", null)
          .gte("created_at", fetchFrom)
          .order("id")
          .range(a, b)
      ),
      ambil("invoice B2B lunas", (a, b) =>
        admin
          .from("corporate_invoices")
          .select("id, amount, paid_at, invoice_number, payment_method, corporate_leads(company_name)")
          .gte("paid_at", wibMidnightUtc(windowStartWib))
          .order("id")
          .range(a, b)
      ),
      // Pelunasan / kekurangan: uang masuk kemarin yang TIDAK menambah omzet
      // (nilainya sudah dibukukan di registrasi kelasnya).
      ambil("pelunasan", (a, b) =>
        admin
          .from("manual_invoices")
          .select("id, student_name, program, amount, addons_amount, paid_at")
          .eq("status", "paid")
          .is("converted_registration_id", null)
          .is("split_group_id", null)
          .gte("paid_at", yStart)
          .lt("paid_at", yEnd)
          .order("id")
          .range(a, b)
      ),
      ambil("refund cair", (a, b) =>
        admin
          .from("refunds")
          .select("id, student_name, refund_amount, paid_out_at, disbursed_at")
          .eq("status", "completed")
          .gte("updated_at", yStart)
          .order("id")
          .range(a, b)
      ),
      // ── Aktivitas kemarin ──
      ambil("registrasi baru", (a, b) =>
        admin
          .from("registrations")
          .select("id, student_id, product, payment_status, status, total_amount")
          .eq("registration_date", yWib)
          .is("archived_at", null)
          .order("id")
          .range(a, b)
      ),
      ambil("chat WA baru", (a, b) =>
        admin
          .from("whatsapp_inbox_logs")
          .select("id, status, inquiry_type, is_existing_customer")
          .gte("logged_at", yStart)
          .lt("logged_at", yEnd)
          .order("id")
          .range(a, b)
      ),
      admin
        .from("schedules")
        .select("id", { count: "exact", head: true })
        .is("cancelled_at", null)
        .gte("scheduled_at", todayStart)
        .lt("scheduled_at", todayEnd),
      // ── Sales & CS ──
      // Pesan nomor CS (sender NULL), bukan grup, 3 hari terakhir.
      ambil("pesan WA CS", (a, b) =>
        admin
          .from("wa_messages")
          .select("id, phone, direction, created_at, contact_name, body")
          .is("sender", null)
          .not("phone", "like", "%@g.us")
          .is("deleted_at", null)
          .gte("created_at", isoAgo(3))
          .order("created_at", { ascending: false })
          .order("id")
          .range(a, b)
      ),
      ambil("pengingat follow-up", (a, b) =>
        admin
          .from("whatsapp_inbox_logs")
          .select("id, contact_name, phone, reminder_at, status")
          .lte("reminder_at", todayWib)
          .not("status", "in", "(closed_won,closed_lost,resolved)")
          .order("reminder_at", { ascending: false })
          .order("id")
          .range(a, b)
      ),
      ambil("menunggu pembayaran", (a, b) =>
        admin
          .from("whatsapp_inbox_logs")
          .select("id, contact_name, phone, product, language, logged_at, updated_at")
          .eq("status", "awaiting_payment")
          .order("logged_at", { ascending: false })
          .order("id")
          .range(a, b)
      ),
      ambil("tagihan manual pending", (a, b) =>
        admin
          .from("manual_invoices")
          .select("id, student_name, program, language, amount, addons_amount, created_at")
          .eq("status", "pending")
          .order("id")
          .range(a, b)
      ),
      ambil("registrasi belum bayar", (a, b) =>
        admin
          .from("registrations")
          .select("id, product, language, total_amount, registration_date, students(name, is_test, is_test_account)")
          .eq("status", "Menunggu Pembayaran")
          .eq("payment_status", "Belum Bayar")
          .gt("total_amount", 0)
          .gte("registration_date", addDaysStr(todayWib, -14))
          .is("archived_at", null)
          .order("id")
          .range(a, b)
      ),
      ambil("lead belum bayar", (a, b) =>
        admin
          .from("leads")
          .select("id, name, email, program, language, amount, created_at")
          .eq("payment_status", "PENDING")
          .is("archived_at", null)
          .gte("created_at", isoAgo(7))
          .order("id")
          .range(a, b)
      ),
      ambil("trial", (a, b) =>
        admin
          .from("trial_registrations")
          .select("id, name, language, status, payment_status, amount, trial_scheduled_at, created_at")
          .is("archived_at", null)
          .neq("status", "converted")
          .order("id")
          .range(a, b)
      ),
      ambil("placement test", (a, b) =>
        admin
          .from("placement_results")
          .select("id, name, language, level, whatsapp, email, created_at")
          .is("followup_status", null)
          .gte("created_at", isoAgo(14))
          .order("created_at", { ascending: false })
          .order("id")
          .range(a, b)
      ),
      ambil("permintaan juru bahasa", (a, b) =>
        admin
          .from("interpreter_requests")
          .select("id, company_name, contact_name, event_title, event_date")
          .eq("status", "new")
          .is("archived_at", null)
          .order("id")
          .range(a, b)
      ),
      ambil("invoice B2B belum lunas", (a, b) =>
        admin
          .from("corporate_invoices")
          .select("id, amount, due_date, invoice_number, corporate_leads(company_name)")
          .is("paid_at", null)
          .order("id")
          .range(a, b)
      ),
      // ── Keuangan ──
      ambil("cicilan", (a, b) =>
        admin
          .from("registrations")
          .select("id, product, language, total_amount, installment_paid, payment_due_date, students(name, is_test, is_test_account)")
          .eq("payment_status", "Cicilan")
          .in("status", ["Aktif", "Dorman"])
          .is("archived_at", null)
          .order("id")
          .range(a, b)
      ),
      ambil("ajuan fee pengajar", (a, b) =>
        admin
          .from("teacher_payouts")
          .select("id, month, year, total_fee, claim_amount, requested_at, source, teachers(name)")
          .eq("status", "requested")
          .order("id")
          .range(a, b)
      ),
      ambil("refund pending", (a, b) =>
        admin
          .from("refunds")
          .select("id, student_name, refund_amount, created_at")
          .eq("status", "pending")
          .order("id")
          .range(a, b)
      ),
      // ── Akademik ──
      ambil("lunas tanpa pengajar", (a, b) =>
        admin
          .from("registrations")
          .select("id, product, language, payment_date, is_trial, students(name, is_test, is_test_account)")
          .eq("status", "Aktif")
          .in("payment_status", ["Lunas", "Cicilan"])
          .in("product", PRODUK_PRIVAT)
          .is("teacher_id", null)
          .is("archived_at", null)
          .order("id")
          .range(a, b)
      ),
      ambil("lunas tanpa batch", (a, b) =>
        admin
          .from("registrations")
          .select("id, product, language, level, payment_date, students(name, is_test, is_test_account)")
          .eq("status", "Aktif")
          .eq("payment_status", "Lunas")
          .in("product", PRODUK_BATCH)
          .is("batch_id", null)
          .is("test_prep_batch_id", null)
          .is("archived_at", null)
          .order("id")
          .range(a, b)
      ),
      ambil("kelas privat aktif", (a, b) =>
        admin
          .from("registrations")
          .select(
            "id, student_id, teacher_id, product, language, sessions_total, sessions_used, expiry_date, payment_date, created_at, is_trial, students(name, is_test, is_test_account)"
          )
          .eq("status", "Aktif")
          .in("payment_status", ["Lunas", "Cicilan"])
          .in("product", PRODUK_PRIVAT)
          .is("archived_at", null)
          .order("id")
          .range(a, b)
      ),
      ambil("status follow-up retensi", (a, b) =>
        admin.from("churn_followups").select("registration_id").order("registration_id").range(a, b)
      ),
      ambil("batch reguler", (a, b) =>
        admin
          .from("v_regular_batches_summary")
          .select("id, batch_code, language, level, start_date, closes_at, actual_paid, min_capacity, status")
          .in("status", ["Open", "Confirmed"])
          .gte("closes_at", new Date(now).toISOString())
          .lte("closes_at", isoAhead(14))
          .order("closes_at")
          .order("id")
          .range(a, b)
      ),
      // Add-on e-book lunas (pintu 1: baris registration_addons). View
      // `addon_ebook_tanpa_akses` SENGAJA tidak dipakai: ia butuh ±47 detik
      // (memanggil ebook_product_for_language per pasangan baris) dan selalu
      // kena statement timeout lewat REST. Di bawah dihitung ulang versi
      // ringannya untuk sebab yang nyaris selalu terjadi: email siswa kosong.
      ambil("add-on e-book lunas", (a, b) =>
        admin
          .from("registration_addons")
          .select(
            "id, registration_id, registrations(id, language, status, archived_at, refunded_at, students(name, email, is_test, is_test_account))"
          )
          .in("addon_type", ["ebook", "modul"])
          .in("payment_status", ["Lunas", "Cicilan"])
          .order("id")
          .range(a, b)
      ),
      ambil("kelas dorman baru", (a, b) =>
        admin
          .from("registrations")
          .select("id")
          .eq("status", "Dorman")
          .is("archived_at", null)
          .gte("dormant_flagged_at", isoAgo(7))
          .order("id")
          .range(a, b)
      ),
      // ── Tim & operasional ──
      ambil("tugas tim", (a, b) =>
        admin
          .from("staff_tasks")
          .select("id, title, status, due_date, assignee_id")
          .is("archived_at", null)
          .in("status", ["todo", "in_progress"])
          .lte("due_date", todayWib)
          .order("due_date")
          .order("id")
          .range(a, b)
      ),
      ambil("follow-up notifikasi", (a, b) =>
        admin
          .from("notification_followups")
          .select("notif_id, title, status, updated_at, updated_by_name")
          .in("status", ["belum", "proses"])
          .lt("updated_at", isoAgo(3))
          .order("notif_id")
          .range(a, b)
      ),
      ambil("laporan bug", (a, b) =>
        admin
          .from("bug_reports")
          .select("id, title, status, severity, created_at")
          .is("archived_at", null)
          .is("deleted_at", null)
          .in("status", ["new", "acknowledged", "in_progress"])
          .order("id")
          .range(a, b)
      ),
      ambil("nomor WA", (a, b) =>
        admin.from("wa_senders").select("id, label, status, updated_at").order("id").range(a, b)
      ),
      ambil("lamaran pengajar", (a, b) =>
        admin
          .from("teacher_applications")
          .select("id, created_at")
          .eq("status", "submitted")
          .is("archived_at", null)
          .order("created_at")
          .order("id")
          .range(a, b)
      ),
      // Add-on e-book lunas (pintu 2: bundel dari kuotasi WA Inbox).
      ambil("bundel e-book WA", (a, b) =>
        admin
          .from("registrations")
          .select("id, language, status, addons, addon_type, students(name, email, is_test, is_test_account)")
          .is("addon_ebook_recording", true)
          .in("payment_status", ["Lunas", "Cicilan"])
          .is("archived_at", null)
          .is("refunded_at", null)
          .order("id")
          .range(a, b)
      ),
    ]);

    const bukanTes = (s: Row | null | undefined) => !s?.is_test && !s?.is_test_account;

    // ════════════════════════════════════════════════════════════════════
    // 1. PEMASUKAN
    // ════════════════════════════════════════════════════════════════════
    // registration_id → paid_at PALING AWAL dari Tagihan Manual (sumber
    // kebenaran tanggal kas, sama dengan `withPaidDate` di Overview).
    const invAt = new Map<string, number>();
    for (const m of minvPaid) {
      const at = new Date(m.paid_at).getTime();
      if (!m.converted_registration_id || isNaN(at)) continue;
      const prev = invAt.get(m.converted_registration_id);
      if (prev === undefined || at < prev) invAt.set(m.converted_registration_id, at);
    }

    const trx: Trx[] = [];
    const seenReg = new Set<string>();
    for (const r of [...regsByPay, ...regsNoPayDate]) {
      if (seenReg.has(r.id)) continue;
      seenReg.add(r.id);
      if (!bukanTes(r.students)) continue;
      if (r.status === "Batal" && r.refunded_at) continue; // gugur karena refund penuh
      const inv = invAt.get(r.id);
      const day =
        inv !== undefined
          ? wibDateStr(new Date(inv))
          : wibDay(r.payment_date) ||
            (r.payment_status === "Lunas" || r.payment_status === "Cicilan"
              ? wibDay(r.registration_date)
              : null);
      if (!day) continue;
      const sudahMasuk = Number(r.installment_paid || 0);
      trx.push({
        day,
        nama: r.students?.name || "—",
        produk: produkLabel(r.product),
        detail: [r.language, r.level].filter(Boolean).join(" "),
        bahasa: r.language || undefined,
        jumlah: Number(r.total_amount || 0),
        jalur: JALUR_LABEL[r.enrollment_source] || "Input admin",
        metode: metodeLabel(r.xendit_payment_method),
        asal: r.students?.source || "",
        catatan:
          r.payment_status === "Cicilan"
            ? "cicilan — baru masuk " + rupiah(sudahMasuk)
            : undefined,
      });
    }
    const ADDON_LABEL: Record<string, string> = {
      ebook: "Add-on E-Book",
      recording: "Add-on Recording",
      modul: "Add-on Modul",
      other: "Add-on lain",
    };
    for (const a of addons) {
      const reg = a.registrations;
      if (reg && !bukanTes(reg.students)) continue;
      // E-book: tanggal = payment_date. Lainnya: hanya Lunas, fallback purchase_date.
      const day =
        a.addon_type === "ebook"
          ? wibDay(a.payment_date)
          : a.payment_status === "Lunas"
            ? wibDay(a.payment_date) || wibDay(a.purchase_date)
            : null;
      if (!day) continue;
      trx.push({
        day,
        nama: reg?.students?.name || "—",
        produk: ADDON_LABEL[a.addon_type] || "Add-on lain",
        detail: a.description || reg?.language || "",
        jumlah: Number(a.total_amount || 0),
        jalur: JALUR_LABEL[reg?.enrollment_source] || "Input admin",
        metode: metodeLabel(reg?.xendit_payment_method),
      });
    }
    for (const p of digital) {
      const day = wibDay(p.xendit_paid_at) || wibDay(p.created_at);
      if (!day) continue;
      const ebook = p.digital_products?.type === "ebook";
      trx.push({
        day,
        nama: p.buyer_name || (p.buyer_email ? String(p.buyer_email).split("@")[0] : "—"),
        produk: ebook ? "E-Book" : "E-Learning",
        detail: p.digital_products?.title || p.digital_products?.language || "",
        jumlah: Number(p.amount || 0),
        jalur: "Toko digital (website)",
        metode: metodeLabel(p.xendit_payment_method),
      });
    }
    for (const l of simulasi) {
      const day = wibDay(l.paid_at) || wibDay(l.created_at);
      if (!day) continue;
      trx.push({
        day,
        nama: l.name || (l.email ? String(l.email).split("@")[0] : "—"),
        produk: "Simulasi Tes",
        detail: String(l.level || "").toUpperCase(),
        jumlah: Number(l.paid_amount ?? l.amount ?? 0),
        jalur: "Website (checkout sendiri)",
        metode: metodeLabel(l.payment_method),
      });
    }
    for (const c of b2bInv) {
      const day = wibDay(c.paid_at);
      if (!day) continue;
      trx.push({
        day,
        nama: c.corporate_leads?.company_name || "Klien B2B",
        produk: "B2B / Corporate",
        detail: c.invoice_number || "",
        jumlah: Number(c.amount || 0),
        jalur: "B2B",
        metode: c.payment_method || "Tanpa catatan metode",
        b2b: true,
      });
    }

    const sum = (rows: Trx[]) => rows.reduce((t, r) => t + r.jumlah, 0);
    const trxKemarin = trx.filter((t) => t.day === yWib && t.jumlah > 0).sort((a, b) => b.jumlah - a.jumlah);
    const revYesterday = sum(trxKemarin);
    const trxMtd = trx.filter((t) => t.day >= monthStartWib && t.day <= yWib);
    const revMtd = sum(trxMtd);
    const b2bMtd = sum(trxMtd.filter((t) => t.b2b));
    // Rata-rata 7 hari sebelum kemarin, tanpa B2B (invoice B2B datang
    // bergumpal — bikin pembanding harian tidak adil).
    const avg7 =
      sum(trx.filter((t) => !t.b2b && t.day >= avgStartWib && t.day < yWib)) / 7;

    const kelompok = (rows: Trx[], kunci: (t: Trx) => string) => {
      const m = new Map<string, { jumlah: number; n: number }>();
      for (const t of rows) {
        const k = kunci(t) || "Lainnya";
        const cur = m.get(k) || { jumlah: 0, n: 0 };
        cur.jumlah += t.jumlah;
        cur.n += 1;
        m.set(k, cur);
      }
      return [...m.entries()]
        .map(([label, v]) => ({ label, ...v }))
        .sort((a, b) => b.jumlah - a.jumlah);
    };
    const perProduk = kelompok(trxKemarin, (t) => t.produk);
    const perJalur = kelompok(trxKemarin, (t) => t.jalur);
    const perMetode = kelompok(trxKemarin, (t) => t.metode);
    const perBahasa = kelompok(
      trxKemarin.filter((t) => t.bahasa && (t.produk.startsWith("Kelas") || t.produk.startsWith("Test Prep"))),
      (t) => t.bahasa || ""
    );
    const perAsal = kelompok(
      trxKemarin.filter((t) => t.asal !== undefined),
      (t) => t.asal || "Belum diisi"
    );

    const pelunasanTotal = pelunasan.reduce(
      (t, r) => t + Number(r.amount || 0) + Number(r.addons_amount || 0),
      0
    );
    const refundKemarin = refundsDone.filter((r) => {
      const d = wibDay(r.disbursed_at || r.paid_out_at);
      return d === yWib;
    });
    const refundTotal = refundKemarin.reduce((t, r) => t + Number(r.refund_amount || 0), 0);

    // ── Target bulan ─────────────────────────────────────────────────────
    const [yy, mm, dd] = yWib.split("-").map(Number);
    const target = yy === OMZET_TARGET_YEAR ? OMZET_TARGET_BY_MONTH[mm - 1] : null;
    const hariDalamBulan = new Date(Date.UTC(yy, mm, 0)).getUTCDate();
    const sisaHari = hariDalamBulan - dd;
    const namaBulan = new Date(yWib + "T12:00:00+07:00").toLocaleDateString("id-ID", {
      month: "long",
      timeZone: "Asia/Jakarta",
    });

    // ── Registrasi baru & chat WA kemarin ────────────────────────────────
    // Draf wizard Rp 0 milik siswa yang di hari yang sama sudah bayar lewat
    // jalur lain bukan "registrasi belum bayar" — dibuang supaya tak dobel.
    const sudahBayar = (r: Row) => r.payment_status === "Lunas" || r.payment_status === "Cicilan";
    const siswaBayar = new Set(regBaru.filter(sudahBayar).map((r) => r.student_id));
    const regRows = regBaru.filter(
      (r) => r.status !== "Batal" && (sudahBayar(r) || !siswaBayar.has(r.student_id))
    );
    const regCount = regRows.length;
    const regPaid = regRows.filter(sudahBayar).length;

    const waCount = waBaru.length;
    const waClosing = waBaru.filter((r) => r.status === "closed_won").length;
    const waOpen = waBaru.filter((r) => ["open", "in_progress", "awaiting_payment", "thinking"].includes(r.status)).length;
    const kelasHariIni = kelasRes.count || 0;
    if (kelasRes.error) gagal.push("kelas hari ini");

    // ════════════════════════════════════════════════════════════════════
    // 2. YANG PERLU DIKERJAKAN
    // ════════════════════════════════════════════════════════════════════
    const aksi: Aksi[] = [];

    // ── Sales & CS ───────────────────────────────────────────────────────
    // Chat CS yang pesan TERAKHIR-nya dari pelanggan & sudah > 3 jam.
    const terakhir = new Map<string, Row>();
    for (const m of csMsgs) if (!terakhir.has(m.phone)) terakhir.set(m.phone, m); // sudah urut terbaru
    let belumDibalas = [...terakhir.values()].filter(
      (m) =>
        m.direction === "in" &&
        now - new Date(m.created_at).getTime() > 3 * 3600 * 1000 &&
        !cumaBasaBasi(m.body)
    );
    if (belumDibalas.length > 0) {
      const logs = await ambil("status chat", (a, b) =>
        admin
          .from("whatsapp_inbox_logs")
          .select("id, phone, status, contact_name, logged_at")
          .in("phone", belumDibalas.slice(0, 150).map((m) => m.phone))
          .order("logged_at", { ascending: false })
          .order("id")
          .range(a, b)
      );
      const statusByPhone = new Map<string, Row>();
      for (const l of logs) if (!statusByPhone.has(l.phone)) statusByPhone.set(l.phone, l);
      belumDibalas = belumDibalas.filter(
        (m) => !["closed_lost", "resolved", "ghosting"].includes(statusByPhone.get(m.phone)?.status)
      );
      belumDibalas.sort((a, b) => a.created_at.localeCompare(b.created_at));
      if (belumDibalas.length > 0)
        aksi.push({
          area: "sales",
          prioritas: 1,
          judul: `${belumDibalas.length} chat pelanggan menunggu balasan`,
          rincian: daftar(
            belumDibalas.map(
              (m) =>
                `${namaKontak(statusByPhone.get(m.phone)?.contact_name || m.contact_name, m.phone)} (sejak ${tglJam(m.created_at)})`
            ),
            6
          ),
          saran: "Balas dulu sebelum mengerjakan yang lain — pesan terakhir dari mereka belum dijawab lebih dari 3 jam.",
          link: DASH + "/crm/wa-inbox",
        });
    }

    if (reminders.length > 0) {
      const hariIni = reminders.filter((r) => r.reminder_at === todayWib);
      const lewat = reminders.filter((r) => r.reminder_at < todayWib);
      const tertua = lewat.length ? lewat[lewat.length - 1].reminder_at : null;
      aksi.push({
        area: "sales",
        prioritas: hariIni.length > 0 ? 2 : 3,
        judul: `${reminders.length} pengingat follow-up jatuh tempo (${hariIni.length} hari ini, ${lewat.length} terlewat)`,
        rincian:
          daftar([...hariIni, ...lewat].map((r) => namaKontak(r.contact_name, r.phone)), 6) +
          (tertua ? ` — terlewat paling lama sejak ${tglPendek(tertua)}` : ""),
        saran:
          lewat.length > 10
            ? "Hubungi yang jatuh tempo hari ini; pengingat lama yang sudah tidak relevan sebaiknya ditutup (Tidak Jadi) supaya daftarnya bersih."
            : "Hubungi lagi sesuai catatan pengingatnya.",
        link: DASH + "/crm/wa-inbox",
      });
    }

    if (awaiting.length > 0) {
      const basi = awaiting.filter((r) => new Date(r.updated_at).getTime() < now - 3 * 86400000);
      aksi.push({
        area: "sales",
        prioritas: basi.length > 0 ? 2 : 3,
        judul: `${awaiting.length} calon siswa berstatus Menunggu Pembayaran` +
          (basi.length ? ` — ${basi.length} tidak disentuh ≥ 3 hari` : ""),
        rincian: daftar(
          (basi.length ? basi : awaiting).map(
            (r) => `${namaKontak(r.contact_name, r.phone)}${r.language ? " (" + r.language + ")" : ""}`
          ),
          6
        ),
        saran: "Tanyakan kendalanya, kirim ulang link bayar, atau tawarkan cicilan 2×. Yang jelas batal → tandai Tidak Jadi.",
        link: DASH + "/crm/wa-inbox",
      });
    }

    const tagihan: { nama: string; jumlah: number }[] = [
      ...minvPending.map((m) => ({
        nama: m.student_name || "—",
        jumlah: Number(m.amount || 0) + Number(m.addons_amount || 0),
      })),
      ...regPending
        .filter((r) => bukanTes(r.students))
        .map((r) => ({ nama: r.students?.name || "—", jumlah: Number(r.total_amount || 0) })),
      ...leadPending.map((l) => ({ nama: l.name || l.email || "—", jumlah: Number(l.amount || 0) })),
      ...trials
        .filter((t) => t.payment_status === "PENDING" && new Date(t.created_at).getTime() > now - 7 * 86400000)
        .map((t) => ({ nama: t.name || "—", jumlah: Number(t.amount || 0) })),
    ];
    const tagihanTotal = tagihan.reduce((t, r) => t + r.jumlah, 0);
    if (tagihan.length > 0)
      aksi.push({
        area: "sales",
        prioritas: 2,
        judul: `${tagihan.length} tagihan sudah dibuat tapi belum dibayar — potensi ${rupiah(tagihanTotal)}`,
        rincian: daftar(tagihan.map((t) => `${t.nama} (${rupiahRingkas(t.jumlah)})`), 6),
        saran: "Ingatkan lewat WA. Link yang sudah kedaluwarsa perlu dibuatkan ulang.",
        link: DASH + "/leads",
      });

    if (placements.length > 0)
      aksi.push({
        area: "sales",
        prioritas: 2,
        judul: `${placements.length} hasil placement test belum di-follow-up`,
        rincian: daftar(
          placements.map((p) => `${p.name || "tanpa nama"} (${p.language} ${p.level}, ${tglPendek(p.created_at)})`),
          6
        ),
        saran: "Mereka sudah meluangkan waktu untuk tes = minat tinggi. Tawarkan kelas sesuai levelnya.",
        link: DASH + "/leads",
      });

    const trialBelumJadwal = trials.filter(
      (t) => t.payment_status === "PAID" && !t.trial_scheduled_at
    );
    if (trialBelumJadwal.length > 0)
      aksi.push({
        area: "sales",
        prioritas: 1,
        judul: `${trialBelumJadwal.length} trial sudah dibayar tapi belum dijadwalkan`,
        rincian: daftar(trialBelumJadwal.map((t) => `${t.name} (${t.language || "-"})`), 6),
        saran: "Tentukan pengajar & jadwal trial-nya, lalu kabari siswanya.",
        link: DASH + "/trial-class",
      });

    if (interp.length > 0) {
      const dekat = interp.some(
        (i) => i.event_date && new Date(i.event_date).getTime() < now + 45 * 86400000
      );
      aksi.push({
        area: "sales",
        prioritas: dekat ? 1 : 2,
        judul: `${interp.length} permintaan juru bahasa belum ditangani`,
        rincian: daftar(
          interp.map(
            (i) =>
              `${i.company_name || i.contact_name || "—"}${i.event_date ? " (acara " + tglPendek(i.event_date) + ")" : ""}`
          ),
          5
        ),
        saran: "Kirim penawaran harga & pastikan ketersediaan juru bahasa sebelum tanggal acaranya makin dekat.",
        link: DASH + "/interpreter",
      });
    }

    const b2bJatuhTempo = b2bUnpaid.filter(
      (c) => c.due_date && c.due_date <= addDaysStr(todayWib, 3)
    );
    if (b2bJatuhTempo.length > 0)
      aksi.push({
        area: "keuangan",
        prioritas: 1,
        judul: `${b2bJatuhTempo.length} invoice B2B jatuh tempo — ${rupiah(
          b2bJatuhTempo.reduce((t, c) => t + Number(c.amount || 0), 0)
        )}`,
        rincian: daftar(
          b2bJatuhTempo.map(
            (c) => `${c.corporate_leads?.company_name || c.invoice_number || "—"} (tempo ${tglPendek(c.due_date)})`
          ),
          5
        ),
        saran: "Tagih ke PIC perusahaan.",
        link: DASH + "/sales-b2b",
      });

    // ── Keuangan ─────────────────────────────────────────────────────────
    const cicilanRows = cicilan
      .filter((r) => bukanTes(r.students))
      .map((r) => ({
        nama: r.students?.name || "—",
        sisa: Number(r.total_amount || 0) - Number(r.installment_paid || 0),
        tempo: r.payment_due_date as string | null,
      }))
      .filter((r) => r.sisa > 0);
    if (cicilanRows.length > 0) {
      const telat = cicilanRows.filter((r) => r.tempo && r.tempo <= todayWib);
      const tanpaTempo = cicilanRows.filter((r) => !r.tempo).length;
      aksi.push({
        area: "keuangan",
        prioritas: telat.length > 0 ? 1 : 2,
        judul:
          `${cicilanRows.length} kelas cicilan belum lunas — sisa ${rupiah(
            cicilanRows.reduce((t, r) => t + r.sisa, 0)
          )}` + (telat.length ? ` (${telat.length} sudah jatuh tempo)` : ""),
        rincian: daftar(
          [...telat, ...cicilanRows.filter((r) => !telat.includes(r))].map(
            (r) => `${r.nama} (${rupiahRingkas(r.sisa)}${r.tempo ? ", tempo " + tglPendek(r.tempo) : ""})`
          ),
          6
        ),
        saran:
          tanpaTempo > 0
            ? `Tagih pelunasannya. ${tanpaTempo} di antaranya belum punya tanggal jatuh tempo — isi di menu Registrasi supaya bisa diingatkan otomatis.`
            : "Tagih pelunasannya sebelum sesi berikutnya berjalan.",
        link: DASH + "/registrations",
      });
    }

    const ajuanBaru = payoutReq.filter((p) => p.source !== "import");
    const ajuanImpor = payoutReq.length - ajuanBaru.length;
    if (payoutReq.length > 0)
      aksi.push({
        area: "keuangan",
        prioritas: ajuanBaru.length > 0 ? 2 : 3,
        judul:
          ajuanBaru.length > 0
            ? `${ajuanBaru.length} ajuan fee pengajar menunggu ACC — ${rupiah(
                ajuanBaru.reduce((t, p) => t + Number(p.claim_amount ?? p.total_fee ?? 0), 0)
              )}`
            : `${ajuanImpor} ajuan fee impor lama masih berstatus "diajukan"`,
        rincian:
          daftar(
            ajuanBaru.map(
              (p) => `${p.teachers?.name || "—"} (${rupiahRingkas(Number(p.claim_amount ?? p.total_fee ?? 0))})`
            ),
            6
          ) +
          (ajuanBaru.length > 0 && ajuanImpor > 0
            ? ` — plus ${ajuanImpor} ajuan impor lama yang masih berstatus "diajukan"`
            : ""),
        saran: "Periksa bukti presensinya lalu ACC / minta revisi, supaya pencairan tidak menumpuk di akhir bulan.",
        link: DASH + "/pencairan-pengajar",
      });

    if (refundPending.length > 0)
      aksi.push({
        area: "keuangan",
        prioritas: 1,
        judul: `${refundPending.length} refund belum dicairkan — ${rupiah(
          refundPending.reduce((t, r) => t + Number(r.refund_amount || 0), 0)
        )}`,
        rincian: daftar(
          refundPending.map((r) => `${r.student_name || "—"} (diajukan ${tglPendek(r.created_at)})`),
          5
        ),
        saran: "Cairkan — refund yang lama tertahan cepat berubah jadi komplain.",
        link: DASH + "/pencairan-refund",
      });

    // ── Akademik ─────────────────────────────────────────────────────────
    const tanpaPengajar = noTeacher.filter((r) => bukanTes(r.students) && !r.is_trial);
    if (tanpaPengajar.length > 0)
      aksi.push({
        area: "akademik",
        prioritas: 1,
        judul: `${tanpaPengajar.length} kelas sudah lunas tapi belum punya pengajar`,
        rincian: daftar(
          tanpaPengajar.map(
            (r) => `${r.students?.name || "—"} (${r.language || "-"}, bayar ${tglPendek(r.payment_date)})`
          ),
          6
        ),
        saran: "Assign pengajar hari ini — siswa yang sudah bayar menunggu kabar jadwal.",
        link: DASH + "/registrations",
      });

    const tanpaBatch = noBatch.filter((r) => bukanTes(r.students));
    if (tanpaBatch.length > 0)
      aksi.push({
        area: "akademik",
        prioritas: 2,
        judul: `${tanpaBatch.length} siswa Reguler / Test Prep lunas tanpa batch`,
        rincian: daftar(
          tanpaBatch.map((r) => `${r.students?.name || "—"} (${[r.language, r.level].filter(Boolean).join(" ")})`),
          6
        ),
        saran: "Masukkan ke batch yang sesuai, atau tawarkan pindah kelas / refund kalau batch-nya tidak jadi dibuka.",
        link: DASH + "/kelas",
      });

    const privat = privatAktif.filter((r) => bukanTes(r.students) && !r.is_trial);
    // Siswa baru: lunas 2–21 hari lalu, sudah ada pengajar, belum ada sesi & jadwal.
    const baruTanpaSesi = privat.filter((r) => {
      const t = new Date(r.payment_date || 0).getTime();
      return (
        r.teacher_id &&
        Number(r.sessions_used || 0) === 0 &&
        t > now - 21 * 86400000 &&
        t < now - 2 * 86400000
      );
    });
    if (baruTanpaSesi.length > 0) {
      const sch = await ambil("jadwal siswa baru", (a, b) =>
        admin
          .from("schedules")
          .select("id, registration_id")
          .in("registration_id", baruTanpaSesi.slice(0, 150).map((r) => r.id))
          .is("cancelled_at", null)
          .order("id")
          .range(a, b)
      );
      const punyaJadwal = new Set(sch.map((s) => s.registration_id));
      const belumJadwal = baruTanpaSesi.filter((r) => !punyaJadwal.has(r.id));
      if (belumJadwal.length > 0)
        aksi.push({
          area: "akademik",
          prioritas: 2,
          judul: `${belumJadwal.length} siswa baru belum punya jadwal pertama`,
          rincian: daftar(
            belumJadwal.map(
              (r) => `${r.students?.name || "—"} (${r.language || "-"}, bayar ${tglPendek(r.payment_date)})`
            ),
            6
          ),
          saran: "Tanyakan ke pengajarnya kenapa belum mulai — makin lama jeda bayar→kelas pertama, makin besar risiko minta refund.",
          link: DASH + "/registrations",
        });
    }

    // Hampir habis: sisa ≤ 2 sesi atau masa aktif ≤ 7 hari, belum pernah
    // ditandai follow-up retensi, dan siswanya belum ambil paket baru.
    const sudahFu = new Set(churnFu.map((c) => c.registration_id));
    const hampirHabis = privat.filter((r) => {
      if (sudahFu.has(r.id)) return false;
      const total = Number(r.sessions_total || 0);
      const sisa = total > 0 ? total - Number(r.sessions_used || 0) : null;
      const exp = r.expiry_date ? new Date(r.expiry_date + "T23:59:59+07:00").getTime() : null;
      const sesiTipis = sisa !== null && sisa <= 2;
      const masaTipis = exp !== null && exp < now + 7 * 86400000;
      if (!sesiTipis && !masaTipis) return false;
      // Punya registrasi privat aktif lain yang lebih baru = sudah perpanjang.
      return !privat.some(
        (o) => o.student_id === r.student_id && o.id !== r.id && o.created_at > r.created_at
      );
    });
    if (hampirHabis.length > 0)
      aksi.push({
        area: "akademik",
        prioritas: 2,
        judul: `${hampirHabis.length} siswa hampir habis paketnya — belum ditawari perpanjangan`,
        rincian: daftar(
          hampirHabis.map((r) => {
            const total = Number(r.sessions_total || 0);
            return `${r.students?.name || "—"} (${r.language || "-"}${
              total > 0 ? ", " + Number(r.sessions_used || 0) + "/" + total + " sesi" : ""
            })`;
          }),
          6
        ),
        saran: "Tawarkan paket lanjutan SEKARANG, sebelum sesi terakhir — lalu tandai statusnya di kartu Retensi Siswa (Overview).",
        link: DASH + "/",
      });

    const batchSepi = batches.filter(
      (b) => Number(b.actual_paid || 0) < Number(b.min_capacity || 0)
    );
    if (batchSepi.length > 0)
      aksi.push({
        area: "akademik",
        prioritas: 2,
        judul: `${batchSepi.length} dari ${batches.length} batch Reguler yang tutup ≤ 14 hari masih di bawah kuota minimum`,
        rincian: daftar(
          batchSepi.map(
            (b) =>
              `${b.language} ${b.level} (${Number(b.actual_paid || 0)}/${b.min_capacity} lunas, tutup ${tglPendek(b.closes_at)})`
          ),
          6
        ),
        saran: "Dorong promosi untuk bahasa yang sudah ada pendaftarnya; putuskan lebih awal mana yang digabung/ditunda supaya siswa tidak menunggu tanpa kepastian.",
        link: DASH + "/kelas",
      });

    // Sudah bayar add-on e-book tapi email siswanya kosong → trigger pemberi
    // akses tidak punya kunci kepemilikan, raknya kosong.
    const batal = (st: string | null) =>
      ["batal", "dibatalkan", "refund", "refunded"].includes(String(st || "").toLowerCase());
    const emailKosong = (st: Row | null | undefined) => !String(st?.email || "").trim();
    const kandidatEbook = new Map<string, { nama: string; bahasa: string; bundel: boolean }>();
    for (const a of addonEbookPaid) {
      const reg = a.registrations;
      if (!reg || reg.archived_at || reg.refunded_at || batal(reg.status)) continue;
      if (!bukanTes(reg.students) || !emailKosong(reg.students)) continue;
      kandidatEbook.set(reg.id, { nama: reg.students?.name || "—", bahasa: reg.language || "-", bundel: false });
    }
    for (const r of bundleRegs) {
      if (batal(r.status) || !bukanTes(r.students) || !emailKosong(r.students)) continue;
      // Cermin fungsi DB bundle_includes_ebook(): isi paket dibaca dari labelnya.
      if (!/(e-?book|modul|bundle)/i.test(JSON.stringify(r.addons ?? "") + " " + (r.addon_type || ""))) continue;
      if (!kandidatEbook.has(r.id))
        kandidatEbook.set(r.id, { nama: r.students?.name || "—", bahasa: r.language || "-", bundel: true });
    }
    if (kandidatEbook.size > 0) {
      const ids = [...kandidatEbook.keys()].slice(0, 150);
      const [adaAddon, adaAkses] = await Promise.all([
        ambil("add-on per registrasi", (a, b) =>
          admin.from("registration_addons").select("id, registration_id").in("registration_id", ids).order("id").range(a, b)
        ),
        ambil("akses e-book", (a, b) =>
          admin
            .from("digital_purchases")
            .select("id, registration_id")
            .in("registration_id", ids)
            .is("archived_at", null)
            .order("id")
            .range(a, b)
        ),
      ]);
      const punyaAddon = new Set(adaAddon.map((x) => x.registration_id));
      const punyaAkses = new Set(adaAkses.map((x) => x.registration_id));
      const tanpaAkses = ids
        .filter((id) => !punyaAkses.has(id) && !(kandidatEbook.get(id)!.bundel && punyaAddon.has(id)))
        .map((id) => kandidatEbook.get(id)!);
      if (tanpaAkses.length > 0)
        aksi.push({
          area: "akademik",
          prioritas: 1,
          judul: `${tanpaAkses.length} siswa sudah bayar add-on e-book tapi aksesnya belum terbit`,
          rincian: daftar(tanpaAkses.map((t) => `${t.nama} (${t.bahasa})`), 6) + " — email siswanya masih kosong",
          saran: "Lengkapi email siswanya di menu Registrasi, lalu simpan ulang add-on-nya — aksesnya terbit otomatis.",
          link: DASH + "/registrations",
        });
    }

    if (dormanBaru.length > 0)
      aksi.push({
        area: "akademik",
        prioritas: 3,
        judul: `${dormanBaru.length} kelas baru jadi dorman dalam 7 hari terakhir`,
        saran: "Cek ke pengajar & siswanya kenapa kelasnya berhenti jalan, lalu jadwalkan ulang.",
        link: DASH + "/registrations",
      });

    // ── Tim & operasional ────────────────────────────────────────────────
    if (tasks.length > 0) {
      const ids = [...new Set(tasks.map((t) => t.assignee_id).filter(Boolean))];
      const prof = ids.length
        ? await ambil("nama staf", (a, b) =>
            admin.from("profiles").select("id, full_name").in("id", ids).order("id").range(a, b)
          )
        : [];
      const namaStaf = new Map(prof.map((p) => [p.id, String(p.full_name || "").split(" ")[0]]));
      const telat = tasks.filter((t) => t.due_date < todayWib).length;
      aksi.push({
        area: "ops",
        prioritas: telat > 0 ? 1 : 2,
        judul: `${tasks.length} tugas tim jatuh tempo (${telat} sudah telat)`,
        rincian: daftar(
          tasks.map(
            (t) => `• ${t.title} — ${namaStaf.get(t.assignee_id) || "?"}, tenggat ${tglPendek(t.due_date)}`
          ),
          5,
          "<br>"
        ),
        saran: "Tanyakan progresnya ke penanggung jawab, atau mundurkan tenggatnya kalau memang belum realistis.",
        link: DASH + "/tugas",
      });
    }

    const waMati = senders.filter(
      (s) => s.status !== "connected" && new Date(s.updated_at).getTime() > now - 30 * 86400000
    );
    if (waMati.length > 0)
      aksi.push({
        area: "ops",
        prioritas: 1,
        judul: `${waMati.length} nomor WA terputus dari dashboard`,
        rincian: daftar(
          waMati.map((s) => `${s.label || s.id} (sejak ${tglPendek(s.updated_at)})`),
          5
        ),
        saran: "Scan ulang QR-nya — selama terputus, pesan masuk ke nomor itu tidak tercatat di Inbox.",
        link: DASH + "/inbox-tim",
      });

    if (bugs.length > 0)
      aksi.push({
        area: "ops",
        prioritas: 2,
        judul: `${bugs.length} laporan bug masih terbuka`,
        rincian: daftar(bugs.map((b) => "• " + b.title), 5, "<br>"),
        saran: "Tinjau & jadwalkan perbaikannya.",
        link: DASH + "/bugs",
      });

    if (notifFu.length > 0)
      aksi.push({
        area: "ops",
        prioritas: 3,
        judul: `${notifFu.length} notifikasi berstatus Belum/Proses lebih dari 3 hari`,
        rincian: daftar(
          Object.entries(
            notifFu.reduce<Record<string, number>>((m, n) => {
              const k = `${n.title || n.notif_id}${n.updated_by_name ? " — " + String(n.updated_by_name).split(" ")[0] : ""}`;
              m[k] = (m[k] || 0) + 1;
              return m;
            }, {})
          ).map(([k, n]) => (n > 1 ? `${k} ×${n}` : k)),
          5
        ),
        saran: "Pastikan tindak lanjutnya dituntaskan lalu tandai Selesai.",
        link: DASH + "/notifikasi",
      });

    if (tApps.length > 0)
      aksi.push({
        area: "ops",
        prioritas: 3,
        judul: `${tApps.length} lamaran pengajar belum direview`,
        rincian: `paling lama masuk ${tglPendek(tApps[0].created_at)}`,
        saran: "Sisihkan waktu review — terutama untuk bahasa yang pengajarnya masih kurang.",
        link: DASH + "/teachers",
      });

    aksi.sort((a, b) => a.prioritas - b.prioritas);
    const nSegera = aksi.filter((a) => a.prioritas === 1).length;

    // ════════════════════════════════════════════════════════════════════
    // 3. SARAN
    // ════════════════════════════════════════════════════════════════════
    const saran: string[] = [];
    if (target) {
      const pct = Math.round((revMtd / target) * 100);
      if (sisaHari === 0) {
        saran.push(
          revMtd >= target
            ? `<b>${namaBulan} ditutup di ${rupiah(revMtd)}</b> — ${pct}% dari target ${rupiahRingkas(target)}. Target tercapai.`
            : `<b>${namaBulan} ditutup di ${rupiah(revMtd)}</b> — ${pct}% dari target ${rupiahRingkas(target)}, kurang ${rupiah(target - revMtd)}. Bulan baru mulai dari nol: amankan dulu yang paling dekat jadi uang (tagihan belum dibayar & siswa berstatus Menunggu Pembayaran).`
        );
      } else if (revMtd >= target) {
        saran.push(
          `<b>Target ${namaBulan} sudah lewat</b>: ${rupiah(revMtd)} dari ${rupiahRingkas(target)} (${pct}%), masih ${sisaHari} hari tersisa.`
        );
      } else {
        const perHari = (target - revMtd) / sisaHari;
        const laju = revMtd / dd;
        saran.push(
          `<b>Laju ke target ${namaBulan}</b>: ${pct}% (${rupiah(revMtd)} dari ${rupiahRingkas(target)}). Butuh rata-rata ${rupiah(perHari)}/hari selama ${sisaHari} hari tersisa; laju sejauh ini ${rupiah(laju)}/hari` +
            (laju >= perHari ? " — masih di jalur." : " — perlu dikejar.")
        );
      }
    }
    if (avg7 > 0 && revYesterday > 0) {
      const beda = Math.round(((revYesterday - avg7) / avg7) * 100);
      saran.push(
        `Pemasukan kemarin <b>${beda >= 0 ? "+" + beda : beda}%</b> dibanding rata-rata 7 hari sebelumnya (${rupiah(avg7)}/hari, di luar B2B).`
      );
    } else if (revYesterday === 0) {
      saran.push(
        `Kemarin <b>tidak ada pemasukan</b>` +
          (avg7 > 0 ? ` (rata-rata 7 hari sebelumnya ${rupiah(avg7)}/hari)` : "") +
          `. Cek apakah ada pembayaran yang belum tercatat, lalu kejar tagihan yang menggantung.`
      );
    }
    if (perProduk.length > 0 && revYesterday > 0) {
      const top = perProduk[0];
      const topJalur = perJalur[0];
      saran.push(
        `Penyumbang terbesar kemarin: <b>${escapeHtml(top.label)}</b> (${Math.round((top.jumlah / revYesterday) * 100)}% pemasukan)` +
          (topJalur ? `, paling banyak masuk lewat <b>${escapeHtml(topJalur.label)}</b>.` : ".")
      );
    }
    if (waCount > 0)
      saran.push(
        `Dari ${waCount} chat WA baru kemarin, <b>${waClosing} closing</b> dan ${waOpen} masih terbuka` +
          (waOpen > 0 ? " — follow-up yang terbuka selagi masih hangat (idealnya kurang dari 24 jam)." : ".")
      );
    const potensi = tagihanTotal;
    if (potensi > 0 || awaiting.length > 0)
      saran.push(
        `Uang terdekat yang bisa dikejar: <b>${rupiah(potensi)}</b> dari ${tagihan.length} tagihan belum dibayar` +
          (awaiting.length ? `, plus ${awaiting.length} calon siswa yang tinggal bayar.` : ".")
      );
    if (hampirHabis.length > 0)
      saran.push(
        `Perpanjangan lebih murah daripada cari siswa baru: ada <b>${hampirHabis.length} siswa</b> yang paketnya hampir habis dan belum ditawari lanjut.`
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
      namaBulan,
      revYesterday,
      trxKemarin,
      perProduk,
      perJalur,
      perMetode,
      perBahasa,
      perAsal,
      pelunasanTotal,
      pelunasanCount: pelunasan.length,
      refundTotal,
      refundCount: refundKemarin.length,
      revMtd,
      b2bMtd,
      target,
      tglLaporan: dd,
      regCount,
      regPaid,
      waCount,
      waClosing,
      kelasHariIni,
      aksi,
      nSegera,
      saran,
      gagal,
    });

    const summary = {
      revenue_kemarin: revYesterday,
      transaksi_kemarin: trxKemarin.length,
      revenue_mtd: revMtd,
      registrasi_baru: regCount,
      leads_wa: waCount,
      kelas_hari_ini: kelasHariIni,
      perlu_ditindak: aksi.length,
      segera: nSegera,
      query_gagal: gagal,
    };

    if (dry) {
      return new NextResponse(html, {
        headers: { "content-type": "text/html; charset=utf-8", "x-report-summary": JSON.stringify(summary) },
      });
    }

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
      subject:
        `Laporan Harian Linguo - ${dateLabel} — ${rupiah(revYesterday)}` +
        (aksi.length ? `, ${aksi.length} hal perlu ditindak` : ""),
      html,
    });
    if (sendErr) {
      console.error("resend send error:", sendErr);
      return NextResponse.json(
        { error: "Gagal kirim email", detail: sendErr },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, sent_to: REPORT_TO, summary });
  } catch (err) {
    console.error("daily-report error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ── Email builder ─────────────────────────────────────────────────────────
type Kelompok = { label: string; jumlah: number; n: number };
type EmailData = {
  dateLabel: string;
  namaBulan: string;
  revYesterday: number;
  trxKemarin: Trx[];
  perProduk: Kelompok[];
  perJalur: Kelompok[];
  perMetode: Kelompok[];
  perBahasa: Kelompok[];
  perAsal: Kelompok[];
  pelunasanTotal: number;
  pelunasanCount: number;
  refundTotal: number;
  refundCount: number;
  revMtd: number;
  b2bMtd: number;
  target: number | null;
  tglLaporan: number;
  regCount: number;
  regPaid: number;
  waCount: number;
  waClosing: number;
  kelasHariIni: number;
  aksi: Aksi[];
  nSegera: number;
  saran: string[];
  gagal: string[];
};

const LABEL_STYLE =
  "font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.4px;font-weight:700;";

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

// Tabel rincian: label · jumlah transaksi · porsi · nominal.
function tabelKelompok(judul: string, rows: Kelompok[], total: number): string {
  if (rows.length === 0) return "";
  return (
    '<div style="' +
    LABEL_STYLE +
    'margin:18px 0 6px;">' +
    judul +
    "</div>" +
    '<table width="100%" cellpadding="0" cellspacing="0">' +
    rows
      .map(
        (r) =>
          '<tr><td style="padding:7px 0;border-bottom:1px solid #f1f5f9;color:#334155;font-size:14px;">' +
          escapeHtml(r.label) +
          ' <span style="color:#94a3b8;font-size:12px;">· ' +
          r.n +
          " trx" +
          (total > 0 ? " · " + Math.round((r.jumlah / total) * 100) + "%" : "") +
          "</span></td>" +
          '<td style="padding:7px 0;border-bottom:1px solid #f1f5f9;text-align:right;color:#0f172a;font-size:14px;font-weight:700;white-space:nowrap;">' +
          rupiah(r.jumlah) +
          "</td></tr>"
      )
      .join("") +
    "</table>"
  );
}

const PRIORITAS: Record<number, { label: string; fg: string; bg: string }> = {
  1: { label: "Segera", fg: "#b91c1c", bg: "#fee2e2" },
  2: { label: "Hari ini", fg: "#b45309", bg: "#fef3c7" },
  3: { label: "Pantau", fg: "#475569", bg: "#e2e8f0" },
};
const AREA: { key: Area; label: string }[] = [
  { key: "sales", label: "Sales & CS" },
  { key: "keuangan", label: "Keuangan" },
  { key: "akademik", label: "Akademik" },
  { key: "ops", label: "Tim & Operasional" },
];

function kartuAksi(a: Aksi): string {
  const p = PRIORITAS[a.prioritas];
  return (
    '<tr><td style="padding:12px 0;border-bottom:1px solid #f1f5f9;">' +
    '<span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;color:' +
    p.fg +
    ";background:" +
    p.bg +
    ';">' +
    p.label +
    "</span>" +
    '<div style="font-size:14px;color:#0f172a;font-weight:700;margin-top:6px;line-height:1.4;">' +
    escapeHtml(a.judul) +
    "</div>" +
    (a.rincian
      ? '<div style="font-size:13px;color:#475569;margin-top:3px;line-height:1.5;">' + a.rincian + "</div>"
      : "") +
    '<div style="font-size:13px;color:#0f766e;margin-top:4px;line-height:1.5;">&rarr; ' +
    escapeHtml(a.saran) +
    (a.link
      ? ' <a href="' + a.link + '" style="color:' + TEAL + ';font-weight:700;text-decoration:none;white-space:nowrap;">Buka</a>'
      : "") +
    "</div></td></tr>"
  );
}

function buildEmail(d: EmailData): string {
  // ── Rincian transaksi (maks 30 baris) ──
  const MAKS_TRX = 30;
  const trxRows =
    d.trxKemarin.length === 0
      ? '<tr><td style="padding:6px 0;color:#94a3b8;font-size:14px;">Tidak ada pemasukan tercatat kemarin.</td></tr>'
      : d.trxKemarin
          .slice(0, MAKS_TRX)
          .map(
            (t) =>
              '<tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;">' +
              '<div style="font-size:14px;color:#0f172a;font-weight:600;">' +
              escapeHtml(t.nama) +
              "</div>" +
              '<div style="font-size:12px;color:#64748b;margin-top:1px;line-height:1.5;">' +
              escapeHtml([t.produk, t.detail, t.jalur, t.metode].filter(Boolean).join(" · ")) +
              (t.catatan ? ' <span style="color:#b45309;">(' + escapeHtml(t.catatan) + ")</span>" : "") +
              "</div></td>" +
              '<td valign="top" style="padding:8px 0;border-bottom:1px solid #f1f5f9;text-align:right;color:#0f172a;font-size:14px;font-weight:700;white-space:nowrap;">' +
              rupiah(t.jumlah) +
              "</td></tr>"
          )
          .join("") +
        (d.trxKemarin.length > MAKS_TRX
          ? '<tr><td colspan="2" style="padding:8px 0;color:#94a3b8;font-size:13px;">+' +
            (d.trxKemarin.length - MAKS_TRX) +
            " transaksi lainnya — lihat di dashboard.</td></tr>"
          : "");

  const ringkasInline = (rows: Kelompok[]) =>
    rows
      .map((r) => escapeHtml(r.label) + " <b style=\"color:#0f172a;\">" + rupiah(r.jumlah) + "</b>")
      .join(" &nbsp;&middot;&nbsp; ");

  // ── Kotak total bulan + progres target ──
  const pct = d.target ? Math.min(100, Math.round((d.revMtd / d.target) * 100)) : null;
  const kotakBulan =
    '<div style="margin-top:14px;padding:12px 14px;background:#f0fdfa;border:1px solid #ccfbf1;border-radius:10px;font-size:14px;color:#0f766e;">' +
    "Total " +
    d.namaBulan +
    " s.d. tgl " +
    d.tglLaporan +
    ": <b>" +
    rupiah(d.revMtd) +
    "</b>" +
    (d.target
      ? " &nbsp;&middot;&nbsp; " + Math.round((d.revMtd / d.target) * 100) + "% dari target " + rupiahRingkas(d.target)
      : "") +
    (d.b2bMtd > 0
      ? '<div style="font-size:12px;color:#0f766e;opacity:.8;margin-top:2px;">termasuk B2B ' + rupiah(d.b2bMtd) + "</div>"
      : "") +
    (pct !== null
      ? '<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;"><tr>' +
        (pct > 0
          ? '<td width="' + pct + '%" style="height:6px;background:' + TEAL + ';border-radius:3px;font-size:0;line-height:0;">&nbsp;</td>'
          : "") +
        (pct < 100
          ? '<td style="height:6px;background:#ccfbf1;border-radius:3px;font-size:0;line-height:0;">&nbsp;</td>'
          : "") +
        "</tr></table>"
      : "") +
    "</div>";

  const kasLain =
    d.pelunasanCount > 0 || d.refundCount > 0
      ? '<div style="margin-top:10px;font-size:13px;color:#64748b;line-height:1.6;">' +
        (d.pelunasanCount > 0
          ? "Kas masuk lain: <b style=\"color:#0f172a;\">" +
            rupiah(d.pelunasanTotal) +
            "</b> dari " +
            d.pelunasanCount +
            " pelunasan sisa tagihan (tidak menambah omzet — kelasnya sudah dibukukan saat daftar).<br>"
          : "") +
        (d.refundCount > 0
          ? "Kas keluar: <b style=\"color:#b91c1c;\">" + rupiah(d.refundTotal) + "</b> untuk " + d.refundCount + " refund."
          : "") +
        "</div>"
      : "";

  // ── Yang perlu dikerjakan, per bidang ──
  const aksiHtml =
    d.aksi.length === 0
      ? '<div style="padding:14px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;font-size:14px;color:#166534;">Tidak ada yang menggantung hari ini.</div>'
      : AREA.map(({ key, label }) => {
          const items = d.aksi.filter((a) => a.area === key);
          if (items.length === 0) return "";
          return (
            '<div style="font-size:13px;color:#0f172a;font-weight:800;margin:16px 0 0;padding:6px 10px;background:#f1f5f9;border-radius:8px;">' +
            label +
            ' <span style="color:#64748b;font-weight:600;">· ' +
            items.length +
            "</span></div>" +
            '<table width="100%" cellpadding="0" cellspacing="0">' +
            items.map(kartuAksi).join("") +
            "</table>"
          );
        }).join("");

  const saranHtml =
    d.saran.length === 0
      ? ""
      : '<tr><td style="padding:22px 28px 4px;">' +
        '<div style="' +
        LABEL_STYLE +
        'margin-bottom:8px;">Saran</div>' +
        '<table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;"><tr><td style="padding:6px 16px;">' +
        d.saran
          .map(
            (s, i) =>
              '<div style="font-size:14px;color:#334155;line-height:1.55;padding:8px 0;' +
              (i > 0 ? "border-top:1px solid #fde68a;" : "") +
              '">' +
              s +
              "</div>"
          )
          .join("") +
        "</td></tr></table></td></tr>";

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
    '<div style="' +
    LABEL_STYLE +
    '">Pemasukan Kemarin</div>' +
    '<div style="font-size:38px;color:' +
    TEAL +
    ';font-weight:800;margin:6px 0 4px;letter-spacing:-1px;">' +
    rupiah(d.revYesterday) +
    "</div>" +
    '<div style="font-size:14px;color:#475569;">' +
    d.trxKemarin.length +
    " transaksi" +
    (d.regCount > 0 ? " &nbsp;&middot;&nbsp; " + d.regCount + " registrasi baru (" + d.regPaid + " sudah bayar)" : "") +
    "</div>" +
    kotakBulan +
    kasLain +
    // Rincian sumber pemasukan
    tabelKelompok("Dari produk apa", d.perProduk, d.revYesterday) +
    tabelKelompok("Masuk lewat jalur apa", d.perJalur, d.revYesterday) +
    (d.perBahasa.length > 0
      ? '<div style="margin-top:12px;font-size:13px;color:#475569;line-height:1.7;"><b style="color:#64748b;">Kelas per bahasa:</b> ' +
        ringkasInline(d.perBahasa) +
        "</div>"
      : "") +
    (d.perMetode.length > 0
      ? '<div style="margin-top:4px;font-size:13px;color:#475569;line-height:1.7;"><b style="color:#64748b;">Metode bayar:</b> ' +
        ringkasInline(d.perMetode) +
        "</div>"
      : "") +
    (d.perAsal.length > 0
      ? '<div style="margin-top:4px;font-size:13px;color:#475569;line-height:1.7;"><b style="color:#64748b;">Siswa tahu Linguo dari:</b> ' +
        d.perAsal.map((r) => escapeHtml(r.label) + " <b style=\"color:#0f172a;\">" + r.n + "</b>").join(" &nbsp;&middot;&nbsp; ") +
        "</div>"
      : "") +
    '<div style="' +
    LABEL_STYLE +
    'margin:18px 0 6px;">Rincian transaksi</div>' +
    '<table width="100%" cellpadding="0" cellspacing="0">' +
    trxRows +
    "</table></td></tr>" +
    // Stat grid
    '<tr><td style="padding:14px 22px 4px;"><table width="100%" cellpadding="0" cellspacing="0"><tr>' +
    statCard("Registrasi Baru", String(d.regCount), d.regPaid + " sudah bayar") +
    statCard("Chat WA Baru", String(d.waCount), d.waClosing + " closing") +
    "</tr><tr>" +
    statCard("Kelas Hari Ini", String(d.kelasHariIni), "sesi terjadwal") +
    statCard(
      "Perlu Ditindak",
      String(d.aksi.length),
      d.nSegera > 0 ? d.nSegera + " harus segera" : "tidak ada yang mendesak"
    ) +
    "</tr></table></td></tr>" +
    // Yang perlu dikerjakan
    '<tr><td style="padding:18px 28px 4px;">' +
    '<div style="' +
    LABEL_STYLE +
    'margin-bottom:4px;">Yang perlu dikerjakan hari ini</div>' +
    aksiHtml +
    "</td></tr>" +
    saranHtml +
    // Footer
    '<tr><td style="padding:20px 28px 26px;">' +
    '<div style="border-top:1px solid #e2e8f0;padding-top:14px;font-size:12px;color:#94a3b8;line-height:1.5;">' +
    "Laporan otomatis dari dashboard Linguo, dikirim tiap pagi 07:00 WIB.<br>" +
    "Pemasukan dihitung sama dengan Overview dashboard: nilai kelas dibukukan di tanggal bayar pertama (WIB), plus add-on, produk digital, simulasi, dan invoice B2B." +
    (d.gagal.length > 0
      ? '<br><span style="color:#b91c1c;">Data yang gagal dimuat (angkanya bisa kurang): ' +
        escapeHtml(d.gagal.join(", ")) +
        ".</span>"
      : "") +
    "</div></td></tr>" +
    "</table></td></tr></table></body></html>"
  );
}
