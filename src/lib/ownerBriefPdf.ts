// [owner-brief-v1] PDF "Brief Harian Owner": laporan harian Linguo (data yang
// sama dengan email /api/cron/daily-report) + penutupan pasar + berita pilihan
// bernilai tinggi. Dikirim ke grup WA owner oleh /api/cron/owner-brief.
// Gaya menyusul src/lib/jadwalKelasPdf.ts (pita teal berlogo, tabel autotable).
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { LINGUO_LOGO_WHITE_PNG, LINGUO_LOGO_W, LINGUO_LOGO_H } from "@/lib/linguoLogoPdf";
import { htmlKeTeks, type HasilTopik, type Pasar } from "@/lib/ownerBriefNews";

// Cermin `EmailData` di /api/cron/daily-report/route.ts (berkas rute Next tak
// boleh mengekspor tipe sembarang). Field baru di sana = tambah di sini.
type Kelompok = { label: string; jumlah: number; n: number };
type Trx = { nama: string; produk: string; detail: string; jumlah: number; jalur: string; metode: string; catatan?: string };
type Aksi = { area: string; prioritas: 1 | 2 | 3; judul: string; rincian?: string; saran: string };
export type LaporanHarian = {
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

export type BriefData = {
  tanggalLabel: string; // hari brief dikirim, mis. "Minggu, 4 Oktober 2026"
  laporan: LaporanHarian | null;
  laporanGalat?: string;
  pasar: Pasar[];
  berita: HasilTopik[];
  ambang: number;
};

type RGB = [number, number, number];
const TEAL: RGB = [13, 148, 136];
const DARK: RGB = [33, 37, 41];
const MUTED: RGB = [110, 116, 124];
const LINE: RGB = [222, 226, 230];
const SOFT: RGB = [240, 253, 250];
const ZEBRA: RGB = [248, 250, 252];
const MERAH: RGB = [185, 28, 28];
const HIJAU: RGB = [21, 128, 61];
const AMBER: RGB = [180, 83, 9];

const M = 15; // margin kiri/kanan

// Helvetica bawaan jsPDF cuma tahu WinAnsi: kutip miring & tanda pisah
// diturunkan, sisanya (emoji, aksara non-Latin) dibuang supaya tak jadi kotak.
const clean = (s: unknown) =>
  String(s ?? "")
    .replace(/[\u2018\u2019\u201A\u2032]/g, "'")
    .replace(/[\u201C\u201D\u201E\u2033]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u2192/g, "->")
    .replace(/\u00A0/g, " ")
    .replace(/[^\x20-\x7E\xA1-\xFF\u2022]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

const rp = (n: unknown) => `Rp ${Math.round(Number(n) || 0).toLocaleString("id-ID")}`;
const rpRingkas = (n: number) =>
  n >= 1e9
    ? `Rp ${(n / 1e9).toFixed(2).replace(".", ",")} M`
    : n >= 1e6
      ? `Rp ${(n / 1e6).toFixed(1).replace(".", ",").replace(",0", "")} jt`
      : rp(n);

const AREA: Array<{ key: string; label: string }> = [
  { key: "sales", label: "Sales & CS" },
  { key: "keuangan", label: "Keuangan" },
  { key: "akademik", label: "Akademik" },
  { key: "ops", label: "Tim & Operasional" },
];
const PRIORITAS: Record<number, { label: string; warna: RGB }> = {
  1: { label: "Segera", warna: MERAH },
  2: { label: "Hari ini", warna: AMBER },
  3: { label: "Pantau", warna: MUTED },
};

function jamLalu(waktu: number, now: number): string {
  if (!waktu) return "";
  const jam = Math.max(0, Math.round((now - waktu) / 3600_000));
  if (jam < 1) return "baru saja";
  if (jam < 24) return `${jam} jam lalu`;
  return `${Math.round(jam / 24)} hari lalu`;
}

export function buildOwnerBriefPdf(d: BriefData, now = Date.now()): ArrayBuffer {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const LEBAR = W - 2 * M;
  const BAWAH = H - 16; // batas isi; di bawahnya kaki halaman
  let y = 0;

  const butuh = (tinggi: number) => {
    if (y + tinggi > BAWAH) {
      doc.addPage();
      y = 18;
    }
  };
  const lastY = () => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  /** Paragraf terlipat; pindah halaman per baris bila perlu. */
  const paragraf = (
    teks: string,
    o: { x?: number; lebar?: number; ukuran?: number; warna?: RGB; gaya?: "normal" | "bold" | "italic"; jarak?: number } = {},
  ) => {
    const x = o.x ?? M;
    const ukuran = o.ukuran ?? 9;
    const lineH = ukuran * 0.45;
    doc.setFont("helvetica", o.gaya ?? "normal");
    doc.setFontSize(ukuran);
    doc.setTextColor(...(o.warna ?? DARK));
    const baris = doc.splitTextToSize(clean(teks), o.lebar ?? W - M - x - 2) as string[];
    for (const b of baris) {
      butuh(lineH);
      doc.text(b, x, y + lineH * 0.75);
      y += lineH;
    }
    y += o.jarak ?? 1.5;
  };

  const judulBagian = (teks: string, kanan?: string) => {
    butuh(16);
    y += 3;
    doc.setFillColor(...TEAL);
    doc.rect(M, y, 1.4, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(...DARK);
    doc.text(clean(teks), M + 4, y + 4.6);
    if (kanan) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text(clean(kanan), W - M, y + 4.6, { align: "right" });
    }
    y += 10;
  };

  const subJudul = (teks: string) => {
    butuh(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(clean(teks).toUpperCase(), M, y + 3);
    y += 5.5;
  };

  // ── Kepala ────────────────────────────────────────────────────────────────
  doc.setFillColor(...TEAL);
  doc.rect(0, 0, W, 30, "F");
  doc.addImage(LINGUO_LOGO_WHITE_PNG, "PNG", M, 7, 9 * (LINGUO_LOGO_W / LINGUO_LOGO_H), 9);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("PT. Linguo Edu Indonesia · Internal, hanya untuk owner", M, 21);
  doc.text("Laporan harian Linguo + berita pilihan", M, 25.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("BRIEF HARIAN OWNER", W - M, 13, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(clean(d.tanggalLabel), W - M, 19, { align: "right" });
  y = 36;

  // ── 1. Linguo kemarin ─────────────────────────────────────────────────────
  const L = d.laporan;
  judulBagian("Linguo kemarin", L ? `Rekap ${L.dateLabel}` : undefined);
  if (!L) {
    paragraf(
      `Laporan Linguo gagal dimuat${d.laporanGalat ? ` (${d.laporanGalat})` : ""}. Angkanya tetap ada di email Laporan Harian dan di Overview dashboard.`,
      { warna: MERAH },
    );
  } else {
    // Empat kotak angka.
    const pct = L.target ? Math.round((L.revMtd / L.target) * 100) : null;
    const kotak: Array<[string, string, string]> = [
      ["PEMASUKAN KEMARIN", rpRingkas(L.revYesterday), `${L.trxKemarin.length} transaksi`],
      [
        `${L.namaBulan.toUpperCase()} S.D. TGL ${L.tglLaporan}`,
        rpRingkas(L.revMtd),
        pct !== null && L.target ? `${pct}% dari target ${rpRingkas(L.target)}` : "tanpa target",
      ],
      ["REGISTRASI BARU", String(L.regCount), `${L.regPaid} sudah bayar`],
      ["CHAT WA BARU", String(L.waCount), `${L.waClosing} closing`],
    ];
    const gap = 3;
    const kw = (LEBAR - gap * 3) / 4;
    kotak.forEach(([label, nilai, sub], i) => {
      const x = M + i * (kw + gap);
      doc.setFillColor(...(i === 0 ? SOFT : ZEBRA));
      doc.setDrawColor(...LINE);
      doc.roundedRect(x, y, kw, 21, 1.8, 1.8, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.3);
      doc.setTextColor(...MUTED);
      doc.text(clean(label), x + 3, y + 5.2);
      doc.setFontSize(13);
      doc.setTextColor(...(i === 0 ? TEAL : DARK));
      doc.text(clean(nilai), x + 3, y + 12.5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.3);
      doc.setTextColor(...MUTED);
      doc.text(clean(sub), x + 3, y + 17.5);
    });
    y += 21;
    // Batang progres target bulan.
    if (pct !== null) {
      y += 2.5;
      doc.setFillColor(204, 251, 241);
      doc.roundedRect(M, y, LEBAR, 1.8, 0.9, 0.9, "F");
      if (pct > 0) {
        doc.setFillColor(...TEAL);
        doc.roundedRect(M, y, Math.max(1.8, (LEBAR * Math.min(100, pct)) / 100), 1.8, 0.9, 0.9, "F");
      }
      y += 1.8;
    }
    y += 4;
    paragraf(
      `Kelas hari ini: ${L.kelasHariIni} sesi terjadwal  ·  Perlu ditindak: ${L.aksi.length} hal` +
        (L.nSegera > 0 ? ` (${L.nSegera} harus segera)` : "") +
        (L.b2bMtd > 0 ? `  ·  Total bulan ini termasuk B2B ${rp(L.b2bMtd)}` : ""),
      { ukuran: 8.5, warna: MUTED },
    );
    if (L.pelunasanCount > 0)
      paragraf(
        `Kas masuk lain: ${rp(L.pelunasanTotal)} dari ${L.pelunasanCount} pelunasan sisa tagihan (tidak menambah omzet - kelasnya sudah dibukukan saat daftar).`,
        { ukuran: 8.5, warna: MUTED },
      );
    if (L.refundCount > 0)
      paragraf(`Kas keluar: ${rp(L.refundTotal)} untuk ${L.refundCount} refund.`, { ukuran: 8.5, warna: MERAH });

    // Dari mana pemasukannya.
    const kelompok: Array<[string, Kelompok[]]> = [
      ["Dari produk apa", L.perProduk],
      ["Masuk lewat jalur apa", L.perJalur],
      ["Kelas per bahasa", L.perBahasa],
      ["Metode bayar", L.perMetode],
    ];
    const isiKelompok = kelompok.filter(([, rows]) => rows.length > 0);
    if (isiKelompok.length) {
      y += 1;
      const body: unknown[][] = [];
      for (const [judul, rows] of isiKelompok) {
        body.push([
          { content: judul, colSpan: 4, styles: { fontStyle: "bold", fillColor: ZEBRA, textColor: MUTED, fontSize: 7.5 } },
        ]);
        for (const r of rows.slice(0, 8))
          body.push([
            clean(r.label),
            String(r.n),
            L.revYesterday > 0 ? `${Math.round((r.jumlah / L.revYesterday) * 100)}%` : "-",
            rp(r.jumlah),
          ]);
      }
      autoTable(doc, {
        startY: y,
        margin: { left: M, right: M, bottom: 18 },
        head: [[
          "Sumber pemasukan",
          ...["Trx", "Porsi", "Nominal"].map((content) => ({ content, styles: { halign: "right" as const } })),
        ]],
        body: body as never,
        theme: "plain",
        styles: { fontSize: 8.5, cellPadding: 1.7, textColor: DARK, lineColor: LINE, lineWidth: { bottom: 0.1 } as never },
        headStyles: { fillColor: TEAL, textColor: 255, fontStyle: "bold", fontSize: 8 },
        columnStyles: {
          0: { cellWidth: LEBAR - 20 - 20 - 40 },
          1: { cellWidth: 20, halign: "right" },
          2: { cellWidth: 20, halign: "right" },
          3: { cellWidth: 40, halign: "right", fontStyle: "bold" },
        },
      });
      y = lastY() + 3;
    }
    if (L.perAsal.length)
      paragraf(`Siswa tahu Linguo dari: ${L.perAsal.map((r) => `${r.label} ${r.n}`).join("  ·  ")}`, {
        ukuran: 8.5,
        warna: MUTED,
      });

    // Rincian transaksi.
    y += 2;
    subJudul("Rincian transaksi");
    if (L.trxKemarin.length === 0) {
      paragraf("Tidak ada pemasukan tercatat kemarin.", { warna: MUTED });
    } else {
      const MAKS = 25;
      autoTable(doc, {
        startY: y,
        margin: { left: M, right: M, bottom: 18 },
        body: L.trxKemarin.slice(0, MAKS).map((t) => [
          clean(t.nama),
          clean([t.produk, t.detail, t.jalur, t.metode].filter(Boolean).join(" · ") + (t.catatan ? ` (${t.catatan})` : "")),
          rp(t.jumlah),
        ]),
        theme: "plain",
        styles: { fontSize: 8.3, cellPadding: 1.6, textColor: DARK, lineColor: LINE, lineWidth: { bottom: 0.1 } as never, valign: "top" },
        columnStyles: {
          0: { cellWidth: 48, fontStyle: "bold" },
          1: { cellWidth: LEBAR - 48 - 32, textColor: MUTED },
          2: { cellWidth: 32, halign: "right", fontStyle: "bold" },
        },
      });
      y = lastY() + 2;
      if (L.trxKemarin.length > MAKS)
        paragraf(`+${L.trxKemarin.length - MAKS} transaksi lainnya - lihat di dashboard.`, { ukuran: 8, warna: MUTED });
    }

    // Yang perlu dikerjakan.
    y += 3;
    subJudul(`Yang perlu dikerjakan hari ini (${L.aksi.length})`);
    if (L.aksi.length === 0) {
      paragraf("Tidak ada yang menggantung hari ini.", { warna: HIJAU });
    } else {
      const body: unknown[][] = [];
      for (const { key, label } of AREA) {
        const items = L.aksi.filter((a) => a.area === key).sort((a, b) => a.prioritas - b.prioritas);
        if (!items.length) continue;
        body.push([
          { content: `${label} · ${items.length}`, colSpan: 3, styles: { fontStyle: "bold", fillColor: ZEBRA, fontSize: 8.3 } },
        ]);
        for (const a of items) {
          const p = PRIORITAS[a.prioritas] || PRIORITAS[3];
          const rincian = a.rincian ? clean(htmlKeTeks(a.rincian)) : "";
          body.push([
            { content: p.label, styles: { textColor: p.warna, fontStyle: "bold", fontSize: 7.5 } },
            clean(a.judul) + (rincian ? `\n${rincian.length > 420 ? rincian.slice(0, 420) + "..." : rincian}` : ""),
            { content: clean(a.saran), styles: { textColor: [15, 118, 110] } },
          ]);
        }
      }
      autoTable(doc, {
        startY: y,
        margin: { left: M, right: M, bottom: 18 },
        head: [["Prioritas", "Hal", "Saran tindakan"]],
        body: body as never,
        theme: "plain",
        styles: { fontSize: 8.2, cellPadding: 1.8, textColor: DARK, lineColor: LINE, lineWidth: { bottom: 0.1 } as never, valign: "top" },
        headStyles: { fillColor: TEAL, textColor: 255, fontStyle: "bold", fontSize: 8 },
        columnStyles: { 0: { cellWidth: 19 }, 1: { cellWidth: LEBAR - 19 - 62 }, 2: { cellWidth: 62 } },
      });
      y = lastY() + 3;
    }

    // Saran.
    if (L.saran.length) {
      y += 2;
      subJudul("Bacaan atas angkanya");
      for (const s of L.saran) {
        butuh(6);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...TEAL);
        doc.text("\u2022", M + 1, y + 3.1);
        paragraf(htmlKeTeks(s), { x: M + 5, ukuran: 9, jarak: 1.2 });
      }
    }
    if (L.gagal.length)
      paragraf(`Data yang gagal dimuat (angkanya bisa kurang): ${L.gagal.join(", ")}.`, { ukuran: 8, warna: MERAH });
  }

  // ── 2. Pasar ──────────────────────────────────────────────────────────────
  if (d.pasar.length) {
    y += 2;
    judulBagian("Pasar", "penutupan terakhir");
    const gap = 3;
    const kw = (LEBAR - gap * (d.pasar.length - 1)) / d.pasar.length;
    butuh(18);
    d.pasar.forEach((p, i) => {
      const x = M + i * (kw + gap);
      doc.setFillColor(...ZEBRA);
      doc.setDrawColor(...LINE);
      doc.roundedRect(x, y, kw, 16, 1.8, 1.8, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...MUTED);
      doc.text(clean(`${p.nama} · ${p.tanggal}`), x + 3, y + 5);
      doc.setFontSize(11);
      doc.setTextColor(...DARK);
      doc.text(p.harga.toLocaleString("id-ID", { maximumFractionDigits: p.harga > 1000 ? 0 : 2 }), x + 3, y + 11.5);
      if (p.ubahPct !== null) {
        doc.setFontSize(8);
        doc.setTextColor(...(p.ubahPct >= 0 ? HIJAU : MERAH));
        doc.text(`${p.ubahPct >= 0 ? "+" : ""}${p.ubahPct.toFixed(2).replace(".", ",")}%`, x + kw - 3, y + 11.5, { align: "right" });
      }
    });
    y += 19;
  }

  // ── 3. Berita pilihan ─────────────────────────────────────────────────────
  const nPilih = d.berita.reduce((s, t) => s + t.terpilih.length, 0);
  const nNilai = d.berita.reduce((s, t) => s + t.dinilai, 0);
  y += 2;
  judulBagian(`Berita pilihan - skor ${d.ambang}/10 ke atas`, `${nPilih} lolos dari ${nNilai} berita dinilai`);

  // AI tumbang di semua topik = satu catatan, bukan delapan catatan kembar.
  const aiMati = d.berita.length > 0 && d.berita.every((t) => t.galat?.startsWith("penilaian AI gagal"));
  if (aiMati)
    paragraf(
      `Berita hari ini tidak bisa dinilai: ${d.berita[0].galat}. Kemungkinan saldo/kunci penyedia AI habis - laporan Linguo di atas tidak terpengaruh.`,
      { ukuran: 8.5, warna: AMBER },
    );

  for (const t of aiMati ? [] : d.berita) {
    butuh(t.terpilih.length ? 26 : 12);
    doc.setFillColor(...SOFT);
    doc.roundedRect(M, y, LEBAR, 6.2, 1.2, 1.2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...TEAL);
    doc.text(clean(t.label).toUpperCase(), M + 2.5, y + 4.3);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(`${t.terpilih.length} dari ${t.dinilai} dinilai`, W - M - 2.5, y + 4.3, { align: "right" });
    y += 8.5;

    if (t.galat) paragraf(`Catatan: ${t.galat}.`, { ukuran: 8, warna: AMBER });
    if (t.terpilih.length === 0) {
      if (!t.galat || t.dinilai > 0)
        paragraf(
          t.dinilai > 0
            ? `Tidak ada berita yang lolos skor ${d.ambang} hari ini.`
            : "Tidak ada berita baru di sumber yang dipantau.",
          { ukuran: 8.5, warna: MUTED, gaya: "italic" },
        );
      y += 1.5;
      continue;
    }

    for (const b of t.terpilih) {
      const xTeks = M + 14;
      const lebarTeks = W - M - xTeks;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      const barisJudul = doc.splitTextToSize(clean(b.judul), lebarTeks) as string[];
      butuh(barisJudul.length * 4.3 + 10); // judul + meta jangan terpisah halaman
      // Lencana skor.
      doc.setFillColor(...(b.skor >= 9 ? TEAL : ([94, 174, 166] as RGB)));
      doc.roundedRect(M, y, 11, 6, 1.4, 1.4, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text(`${b.skor}/10`, M + 5.5, y + 4.1, { align: "center" });
      // Judul (bisa diklik).
      doc.setFontSize(9.5);
      doc.setTextColor(...DARK);
      const yAwal = y;
      barisJudul.forEach((br, i) => doc.text(br, xTeks, y + 3.6 + i * 4.3));
      y += barisJudul.length * 4.3 + 0.6;
      doc.link(xTeks, yAwal, lebarTeks, y - yAwal, { url: b.link });
      paragraf([b.sumber, jamLalu(b.waktu, now)].filter(Boolean).join(" · "), {
        x: xTeks, ukuran: 7.5, warna: MUTED, jarak: 0.8,
      });
      if (b.ringkas) paragraf(b.ringkas, { x: xTeks, ukuran: 8.8, jarak: 0.8 });
      if (b.penting) paragraf(`Kenapa penting: ${b.penting}`, { x: xTeks, ukuran: 8.5, warna: [15, 118, 110], gaya: "italic", jarak: 0.8 });
      y += 3;
    }
  }

  y += 2;
  paragraf(
    "Berita dipilih, dinilai, dan dirangkum AI dari judul + cuplikan RSS; artikelnya sendiri tidak dibaca. Ketuk judul untuk membuka sumbernya sebelum mengambil keputusan. Bagian saham bukan saran investasi.",
    { ukuran: 7.5, warna: MUTED },
  );

  // ── Kaki halaman ──────────────────────────────────────────────────────────
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(clean(`Brief Harian Owner Linguo · ${d.tanggalLabel} · dashboard.linguo.id`), M, H - 9);
    doc.text(`Halaman ${i} dari ${total}`, W - M, H - 9, { align: "right" });
  }
  return doc.output("arraybuffer");
}
