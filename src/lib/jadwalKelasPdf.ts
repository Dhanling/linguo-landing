// [ling-chat-jadwal-pdf-v1] PDF jadwal Kelas Reguler & English Test Preparation
// (TOEFL/IELTS) yang dibuat DI SERVER, dilayani /api/jadwal-kelas/pdf.
//
// Dipakai chat web "Ling": pertanyaan jadwal Reguler/ETP dijawab dengan berkas
// ini (bukan daftar teks panjang), baik oleh bot otomatis maupun admin dari
// dashboard (Chat Minling). Datanya ditarik live tiap kali dibuka, jadi link
// lama di riwayat chat selalu menampilkan jadwal terbaru.
//
// ⚠️ Tata letak & saringannya SALINAN dari dashboard admin
// (linguo-admin-dashboard/src/lib/regulerSchedulePdf.ts + upcomingRegulerBatches/
// upcomingEtpBatches di src/components/wainbox/batchSchedule.ts), yang dikirim
// WA Inbox. Kalau salah satunya diubah, samakan yang lain.
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { createClient } from "@supabase/supabase-js";
import { resolveEtpBatches, todayWIBISO, type EtpBatchRow } from "@/lib/etpBatches";
import { LINGUO_LOGO_WHITE_PNG, LINGUO_LOGO_W, LINGUO_LOGO_H } from "@/lib/linguoLogoPdf";

export interface RegulerBatchRow {
  id: string;
  language: string | null;
  level: string | null;
  session_day: string | null;
  session_start_time: string | null;
  session_end_time: string | null;
  session_duration_min: number | null;
  total_sessions: number | null;
  start_date: string | null;
  price_regular: number | null;
  min_capacity: number | null;
  max_capacity: number | null;
  actual_enrolled: number | null;
  closes_at: string | null;
}

export interface JadwalKelasData {
  reguler: RegulerBatchRow[];
  etp: EtpBatchRow[];
}

const CONTACT_WA = "+62 821-1685-9493";
const JADWAL_URL = "linguo.id/jadwal-kelas-reguler";

const TEAL: [number, number, number] = [13, 148, 136];
const DARK: [number, number, number] = [33, 37, 41];
const MUTED: [number, number, number] = [110, 116, 124];
const LINE: [number, number, number] = [222, 226, 230];
const SOFT: [number, number, number] = [240, 253, 250];
const ZEBRA: [number, number, number] = [248, 250, 252];

// Nama bahasa Indonesia untuk kelas batch (subset ID_NAME quickReplyData dashboard).
const ID_NAME: Record<string, string> = {
  English: "Inggris", Japanese: "Jepang", Korean: "Korea", Mandarin: "Mandarin",
  French: "Prancis", Spanish: "Spanyol", German: "Jerman", Arabic: "Arab",
  Italian: "Italia", Russian: "Rusia", Thai: "Thailand", Turkish: "Turki",
  Portuguese: "Portugis", Hindi: "Hindi", Vietnamese: "Vietnam", Dutch: "Belanda",
  Tagalog: "Tagalog", "Sign Language": "Bahasa Isyarat", Polish: "Polandia",
  Swedish: "Swedia", Norwegian: "Norwegia", Danish: "Denmark", Greek: "Yunani",
  "Traditional Chinese": "Mandarin Tradisional", Cantonese: "Kanton",
};

/** "English - Conversation" → "Inggris (Conversation)". */
function langIdName(raw: string | null | undefined): string {
  const s = String(raw || "").trim();
  if (!s) return "";
  const parts = s.split(" - ");
  const base = (parts.shift() || "").trim();
  const rest = parts.join(" - ").trim();
  const id = ID_NAME[base] || base;
  return rest ? `${id} (${rest})` : id;
}

// Helvetica bawaan jsPDF cuma tahu WinAnsi — emoji jadi kotak, en dash diturunkan.
const clean = (s: unknown) =>
  String(s ?? "")
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}️]/gu, "")
    .replace(/[–—]/g, "-")
    .replace(/\s{2,}/g, " ")
    .trim();

const jamID = (t: string | null | undefined) => {
  const v = String(t || "").slice(0, 5);
  return v ? v.replace(":", ".") : "";
};

const fmtRp = (n: unknown) => `Rp ${Math.round(Number(n) || 0).toLocaleString("id-ID")}`;

const FMT_TGL = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const FMT_BLN = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" });

/** "2026-10-12" → "12 Okt 2026" (tanggal polos, tanpa geser zona waktu). */
function fmtTanggal(iso: string | null | undefined, fmt = FMT_TGL): string {
  const s = String(iso || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return "-";
  return fmt.format(new Date(s + "T00:00:00Z"));
}

/** Tanggal (WIB) dari timestamp → "11 Okt 2026". */
function fmtTanggalWIB(ts: string | number | Date): string {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return "-";
  return fmtTanggal(new Date(d.getTime() + 7 * 3600 * 1000).toISOString());
}

function batasDaftar(b: RegulerBatchRow): string {
  if (b.closes_at) {
    const v = fmtTanggalWIB(b.closes_at);
    if (v !== "-") return v;
  }
  const s = String(b.start_date || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return "-";
  const d = new Date(s + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return fmtTanggal(d.toISOString());
}

function sisaKursi(b: RegulerBatchRow): string {
  const max = Number(b.max_capacity ?? 0) || 0;
  if (max <= 0) return "-";
  return `${Math.max(0, max - (Number(b.actual_enrolled ?? 0) || 0))} kursi`;
}

function seragam<T>(rows: RegulerBatchRow[], pick: (b: RegulerBatchRow) => T): T | null {
  if (!rows.length) return null;
  const first = pick(rows[0]);
  return rows.every((b) => pick(b) === first) ? first : null;
}

const isFull = (enrolled: unknown, max: unknown) => {
  const m = Number(max ?? 0) || 0;
  return m > 0 && (Number(enrolled ?? 0) || 0) >= m;
};

/** "Oktober 2026" dari tanggal mulai paling awal. */
export function jadwalGelombang(rows: Array<{ start_date?: string | null }>): string {
  const first = rows.map((b) => String(b.start_date || "").slice(0, 10)).filter(Boolean).sort()[0];
  return first ? fmtTanggal(first, FMT_BLN) : "";
}

export function jadwalPdfFileName(data: JadwalKelasData): string {
  const gel = jadwalGelombang([...data.reguler, ...data.etp]).replace(/\s+/g, "-");
  return `Jadwal-Kelas-Linguo${gel ? `-${gel}` : ""}.pdf`;
}

// Cache modul 5 menit — PDF & intent chat memakai data yang sama.
let cache: { at: number; data: JadwalKelasData | null } = { at: 0, data: null };

/**
 * Batch yang masih bisa dijual: belum penuh + belum mulai — saringan yang sama
 * dengan upcomingRegulerBatches/upcomingEtpBatches di dashboard.
 */
export async function fetchJadwalKelas(): Promise<JadwalKelasData> {
  if (cache.data && Date.now() - cache.at < 5 * 60_000) return cache.data;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { reguler: [], etp: [] };
  const db = createClient(url, key, { auth: { persistSession: false } });
  const today = todayWIBISO();
  const [reg, etp] = await Promise.all([
    db
      .from("v_regular_batches_summary")
      .select(
        "id, language, level, session_day, session_start_time, session_end_time, session_duration_min, total_sessions, start_date, price_regular, min_capacity, max_capacity, actual_enrolled, closes_at",
      )
      .eq("is_published", true)
      .in("status", ["Open", "Confirmed"])
      .order("start_date", { ascending: true }),
    db.from("etp_batches").select("*").eq("is_active", true).order("start_date", { ascending: true }),
  ]);
  if (reg.error || etp.error) {
    console.error("[jadwal-kelas-pdf] gagal ambil batch:", reg.error || etp.error);
    if (cache.data) return cache.data;
  }
  const belumMulai = (d: string | null | undefined) => {
    const s = String(d || "").slice(0, 10);
    return !s || s >= today;
  };
  const reguler = ((reg.data || []) as RegulerBatchRow[])
    .filter((b) => !isFull(b.actual_enrolled, b.max_capacity) && belumMulai(b.start_date))
    .sort(
      (a, b) =>
        String(a.start_date || "").localeCompare(String(b.start_date || "")) ||
        String(a.session_start_time || "").localeCompare(String(b.session_start_time || "")) ||
        String(a.language || "").localeCompare(String(b.language || "")),
    );
  const etpRows = resolveEtpBatches((etp.data || []) as EtpBatchRow[], today)
    .filter((b) => !isFull(b.current_enrolled, b.max_capacity) && belumMulai(b.start_date))
    .sort((a, b) => String(a.start_date || "").localeCompare(String(b.start_date || "")));
  const data = { reguler, etp: etpRows };
  cache = { at: Date.now(), data };
  return data;
}

function drawHeader(doc: jsPDF, subtitle: string, rightLines: string[]): number {
  const W = doc.internal.pageSize.getWidth();
  const band = 30;
  doc.setFillColor(...TEAL);
  doc.rect(0, 0, W, band, "F");
  doc.addImage(LINGUO_LOGO_WHITE_PNG, "PNG", 15, 7, 9 * (LINGUO_LOGO_W / LINGUO_LOGO_H), 9);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("PT. Linguo Edu Indonesia · Online Language School", 15, 21);
  doc.text(subtitle, 15, 25.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("JADWAL KELAS", W - 15, 13, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  rightLines.slice(0, 2).forEach((line, i) => doc.text(line, W - 15, 19 + i * 5, { align: "right" }));
  return band + 10;
}

const headStyles = {
  fillColor: TEAL,
  textColor: 255,
  fontSize: 8.5,
  fontStyle: "bold" as const,
  halign: "center" as const,
  valign: "middle" as const,
  cellPadding: 2.6,
};
const tableStyles = { fontSize: 8.5, cellPadding: 2.4, textColor: DARK, lineColor: LINE, valign: "middle" as const };

export function buildJadwalKelasPdf({ reguler: rows, etp }: JadwalKelasData): ArrayBuffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const gel = jadwalGelombang([...rows, ...etp]);

  const drawFooter = () => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(`PT. Linguo Edu Indonesia - ${JADWAL_URL} - WhatsApp ${CONTACT_WA}`, 15, H - 10);
    doc.text(`Halaman ${doc.getNumberOfPages()}`, W - 15, H - 10, { align: "right" });
  };

  let y = drawHeader(
    doc,
    etp.length
      ? "Jadwal Kelas Reguler & English Test Preparation - kelas grup online"
      : "Jadwal Kelas Reguler - kelas grup online",
    [gel ? `Gelombang ${gel}` : "Batch terdekat", `Diperbarui ${fmtTanggalWIB(Date.now())}`],
  );
  y -= 6;

  if (!rows.length && !etp.length) {
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    doc.text("Belum ada batch yang sedang dibuka.", 15, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Cek ${JADWAL_URL} atau hubungi WhatsApp ${CONTACT_WA} untuk info batch berikutnya.`, 15, y + 6);
    drawFooter();
    return doc.output("arraybuffer");
  }

  if (rows.length) {
    if (etp.length) {
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...TEAL);
      doc.text("KELAS REGULER - KELAS BAHASA (8 SESI, 1X SEMINGGU)", 15, y);
      y += 4.5;
    }

    const level = seragam(rows, (b) => b.level);
    const sesi = seragam(rows, (b) => b.total_sessions);
    const durasi = seragam(rows, (b) => b.session_duration_min);
    const harga = seragam(rows, (b) => b.price_regular);
    const minCap = seragam(rows, (b) => b.min_capacity);
    const maxCap = seragam(rows, (b) => b.max_capacity);
    const ringkas: Array<[string, string]> = [
      ["Bahasa dibuka", `${rows.length} kelas`],
      ["Level", level ? `${level}` : "lihat tabel"],
      ["Paket", sesi && durasi ? `${sesi} sesi @${durasi} menit` : "lihat tabel"],
      ["Biaya", harga ? `${fmtRp(harga)} / siswa` : "lihat tabel"],
      ["Isi kelas", minCap && maxCap ? `${minCap}-${maxCap} siswa` : "-"],
    ];
    const boxH = 16;
    doc.setFillColor(...SOFT);
    doc.setDrawColor(...LINE);
    doc.roundedRect(15, y, W - 30, boxH, 2, 2, "FD");
    const colW = (W - 30) / ringkas.length;
    ringkas.forEach(([label, val], i) => {
      const cx = 15 + colW * i + colW / 2;
      if (i > 0) {
        doc.setDrawColor(...LINE);
        doc.line(15 + colW * i, y + 3, 15 + colW * i, y + boxH - 3);
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...MUTED);
      doc.text(clean(label).toUpperCase(), cx, y + 6, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...DARK);
      doc.text(clean(val), cx, y + 11.8, { align: "center" });
    });
    y += boxH + 7;

    autoTable(doc, {
      startY: y,
      head: [["No", "Bahasa", "Hari", "Jam (WIB)", "Mulai", "Sesi", "Batas daftar", "Sisa kuota"]],
      body: rows.map((b, i) => {
        const t1 = jamID(b.session_start_time);
        const t2 = jamID(b.session_end_time);
        return [
          String(i + 1),
          clean(langIdName(b.language)),
          clean(b.session_day || "-"),
          t1 && t2 ? `${t1} - ${t2}` : t1 || "-",
          fmtTanggal(b.start_date),
          b.total_sessions ? `${b.total_sessions}x` : "-",
          batasDaftar(b),
          sisaKursi(b),
        ];
      }),
      theme: "grid",
      headStyles,
      styles: tableStyles,
      alternateRowStyles: { fillColor: ZEBRA },
      columnStyles: {
        0: { halign: "center", cellWidth: 9 },
        1: { cellWidth: 40, fontStyle: "bold" },
        2: { halign: "center", cellWidth: 18 },
        3: { halign: "center", cellWidth: 26 },
        4: { halign: "center", cellWidth: 24 },
        5: { halign: "center", cellWidth: 12 },
        6: { halign: "center", cellWidth: 26 },
        7: { halign: "center", cellWidth: 25 },
      },
      margin: { left: 15, right: 15, bottom: 26 },
      didDrawPage: drawFooter,
    });
    y = ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? y) + 7;
  }

  if (etp.length) {
    if (y + 30 > H - 30) {
      doc.addPage();
      drawFooter();
      y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...TEAL);
    doc.text("ENGLISH TEST PREPARATION - KELAS GRUP (16 SESI, 2X SEMINGGU)", 15, y);
    y += 4.5;

    autoTable(doc, {
      startY: y,
      head: [["Program", "Hari", "Jam (WIB)", "Mulai", "Sesi", "Biaya", "Sisa kuota"]],
      body: etp.map((b) => [
        clean(b.title || b.badge),
        clean(b.days || "-"),
        clean(String(b.time || "").replace(/\s*WIB\s*$/i, "")) || "-",
        fmtTanggal(b.start_date),
        b.total_sessions ? `${b.total_sessions}x` : "-",
        b.price ? fmtRp(b.price) : "-",
        Number(b.max_capacity ?? 0) > 0
          ? `${Math.max(0, Number(b.max_capacity) - (Number(b.current_enrolled ?? 0) || 0))} kursi`
          : "-",
      ]),
      theme: "grid",
      headStyles,
      styles: tableStyles,
      alternateRowStyles: { fillColor: ZEBRA },
      columnStyles: {
        0: { cellWidth: 38, fontStyle: "bold" },
        1: { halign: "center", cellWidth: 32 },
        2: { halign: "center", cellWidth: 28 },
        3: { halign: "center", cellWidth: 24 },
        4: { halign: "center", cellWidth: 12 },
        5: { halign: "right", cellWidth: 21 },
        6: { halign: "center", cellWidth: 25 },
      },
      margin: { left: 15, right: 15, bottom: 26 },
      // Tanpa tabel Reguler, kaki halaman dipasang dari sini.
      didDrawPage: rows.length ? undefined : drawFooter,
    });
    y = ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? y) + 7;
  }

  const catatan = [
    ...(etp.length && rows.length
      ? ["Reguler dan Test Preparation itu dua paket berbeda: 8 sesi 1x seminggu vs 16 sesi 2x seminggu, harganya pun beda."]
      : []),
    "Kelas berjalan kalau peserta minimal terpenuhi; kalau belum, kakak ditawari pindah batch atau refund penuh.",
    "Satu jadwal per bahasa dan tidak bisa request hari/jam. Mau jadwal sendiri? Ambil Kelas Private/Semi-Private.",
    `Kuota & jadwal terbaru selalu ada di ${JADWAL_URL}.`,
  ];
  const daftar = [
    "1. Pilih bahasa & jadwalnya dari tabel di atas.",
    `2. Daftar langsung di ${JADWAL_URL}, atau balas chat ini dengan bahasa pilihan kakak.`,
    "3. Bayar sebelum batas daftar, lalu kakak dimasukkan ke grup kelas.",
  ];

  const lineH = 4.6;
  const noteH = 9 + catatan.length * lineH;
  const stepH = 9 + daftar.length * lineH;
  if (y + noteH + stepH + 6 > H - 12) {
    doc.addPage();
    drawFooter();
    y = 20;
  }

  doc.setFillColor(...SOFT);
  doc.setDrawColor(...LINE);
  doc.roundedRect(15, y, W - 30, stepH, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...TEAL);
  doc.text("CARA DAFTAR", 19, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...DARK);
  daftar.forEach((t, i) => doc.text(clean(t), 19, y + 11.5 + i * lineH));
  y += stepH + 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text("PERLU DIKETAHUI", 15, y + 4);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK);
  catatan.forEach((t, i) => {
    doc.text("•", 15, y + 9.5 + i * lineH);
    doc.text(clean(t), 19, y + 9.5 + i * lineH, { maxWidth: W - 34 });
  });

  return doc.output("arraybuffer");
}
