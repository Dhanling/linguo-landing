"use client";

/* [kuis-rapor-grafik-v1] Layar hasil kuis siswa — /kuis/isi/<token>.
 *
 * Menggantikan blok hasil yang dulu menempel di dalam halaman: skor, kartu rapor
 * AI, lalu daftar soal yang isinya cuma prompt + feedback satu kalimat. Yang
 * hilang di sana justru tiga hal yang paling dicari siswa sesudah nilainya keluar:
 * jawaban benarnya apa, materi mana yang jeblok, dan bukti yang bisa disimpan.
 *
 * Halaman ini dibuka TANPA login, dari HP, dan bagi siswa yang belum punya akun
 * inilah satu-satunya kali rapornya bisa dibaca — makanya ada tombol simpan PDF,
 * bukan sekadar "buka lagi linknya nanti". Link kuisnya sendiri tetap hidup, tapi
 * membukanya lagi cuma memberi soalnya, bukan hasil pengerjaan yang ini.
 *
 * Warna ditulis EKSPLISIT (bukan token tema): halaman publik ini sengaja selalu
 * terang, dan staf yang membukanya dengan tema gelap tidak boleh melihat kartu
 * putih berteks putih ([[halaman-publik-paksa-light]]).
 *
 * Aturan grafik yang dipatuhi di sini:
 *   - Grafik materi = SATU warna (teal), panjang batang yang membawa besarannya.
 *   - Benar/salah = warna status hijau/amber, dan SELALU berpasangan dengan ikon
 *     + kata. Hijau-vs-amber lolos ambang keterbedaan mata normal, tapi di mata
 *     buta warna jaraknya tipis — jadi warnanya tidak pernah menjadi satu-satunya
 *     pembeda. Merah sengaja TIDAK dipakai: merah-vs-amber gagal ambang itu,
 *     dan "salah" di kuis harian bukan keadaan gawat.
 */

import { useMemo, useRef, useState } from "react";
import {
  CheckCircle2, XCircle, Download, Loader2, ChevronDown,
  Target, Lightbulb, RotateCcw, ThumbsUp, ImageIcon, Sparkles,
} from "lucide-react";
import type {
  PublicQuiz, PublicQuizQuestion, GradeResult, QuizAnalysis, EssayResponse,
} from "@/lib/quizPublic";

const BRAND = "#1A9E9E";
const BRAND_DEEP = "#0F766E";
const OK = "#059669";       // status: benar
const WARN = "#D97706";     // status: belum tepat
const TRACK = "#E2E8F0";    // jalur kosong batang

// ── PDF: dua pustaka dari CDN, dimuat saat tombolnya ditekan ────────────────
// Pola yang sama dengan SertifikatTab: nol dependensi npm, dan halaman kuis yang
// dibuka dari HP dengan sinyal seadanya tidak ikut menanggung ~500 KB bundel
// untuk tombol yang mungkin tidak pernah disentuh.
const H2C_URL = "https://cdn.jsdelivr.net/npm/html2canvas-pro@2.0.4/dist/html2canvas-pro.min.js";
const JSPDF_URL = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") return reject(new Error("no document"));
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === "1") return resolve();
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error(`gagal load ${src}`)));
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => { s.dataset.loaded = "1"; resolve(); };
    s.onerror = () => reject(new Error(`gagal load ${src}`));
    document.head.appendChild(s);
  });
}

type Html2Canvas = (el: HTMLElement, opt?: Record<string, unknown>) => Promise<HTMLCanvasElement>;
type JsPdfDoc = {
  addImage: (data: string, fmt: string, x: number, y: number, w: number, h: number) => void;
  addPage: () => void;
  save: (name: string) => void;
  internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
};
type JsPdfCtor = new (o?: Record<string, unknown>) => JsPdfDoc;

// ── Bantu-bantu kecil ───────────────────────────────────────────────────────

/** Ringkas, karena ini isi kotak selebar sepertiga layar HP: "12 mnt 22 dtk". */
function lamaRingkas(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  return m > 0 ? `${m} mnt ${s % 60} dtk` : `${s} dtk`;
}

function isMC(q: { type: string; options?: unknown[] }): boolean {
  return q.type === "multiple_choice" || (q.type === "hots" && Array.isArray(q.options) && q.options.length >= 2);
}

/** Nama materi cadangan kalau rapor AI-nya absen — jujur menyebut JENIS soal,
 *  bukan mengaku-ngaku tahu materinya. Judul grafiknya ikut menyesuaikan. */
function jenisSoal(q: PublicQuizQuestion): string {
  if (isMC(q)) return "Pilihan ganda";
  if (q.type === "fill_blank") return "Melengkapi kalimat";
  if (q.type === "translation") return "Terjemahan";
  return "Menulis / uraian";
}

/* Feedback bawaan pengoreksi yang isinya nol informasi. Kalimat-kalimat ini
   dibuat waktu halaman hasil belum menampilkan kunci jawaban; sekarang kuncinya
   tampil utuh di kartunya sendiri, dan "Jawaban benar: opsi 3" di bawahnya cuma
   menyuruh siswa menghitung opsi ke-3 itu yang mana. */
const FEEDBACK_HAMPA = [
  /^benar\.?$/i,
  /^sudah dinilai\.?$/i,
  /^kurang tepat\.\s*jawaban benar:\s*opsi\s*\S+\.?$/i,
];
function feedbackBerguna(s: string | undefined): string {
  const t = (s ?? "").trim();
  return t && !FEEDBACK_HAMPA.some((re) => re.test(t)) ? t : "";
}

/* Jawaban siswa dibaca dari state halaman, BUKAN dari balasan server: yang
   dikirim ke server untuk pilihan ganda cuma nomor opsinya, dan "2" bukan
   jawaban yang bisa dibaca siapa pun di halaman yang sudah tidak menampilkan
   daftar pilihannya lagi. */
function jawabanSiswa(q: PublicQuizQuestion, v: unknown): string {
  if (v === undefined || v === null) return "";
  if (typeof v === "object") {
    const e = v as EssayResponse;
    if (e.tidak_tahu) return "Tidak tahu";
    const t = String(e.text ?? "").trim();
    if (t) return t;
    if (e.image_url) return "(dijawab lewat foto tulisan tangan)";
    return "";
  }
  const s = String(v).trim();
  if (!s) return "";
  if (s.toUpperCase() === "TIDAK TAHU") return "Tidak tahu";
  if (isMC(q)) {
    const idx = Number(s);
    return Number.isInteger(idx) && q.options?.[idx] !== undefined ? String(q.options[idx]) : "";
  }
  return s;
}

interface Materi {
  nama: string;
  dapat: number;
  maks: number;
  benar: number;
  soal: number;
  nomor: number[];
}

export interface HasilKuisProps {
  quiz: PublicQuiz;
  name: string;
  total: number;
  max: number;
  results: GradeResult[];
  analysis: QuizAnalysis | null;
  durationSec: number | null;
  showTranslit: boolean;
  /** Jawaban siswa apa adanya dari state halaman (indeks soal → nilai). */
  responses: Record<number, unknown>;
}

export default function HasilKuis({
  quiz, name, total, max, results, analysis, durationSec, showTranslit, responses,
}: HasilKuisProps) {
  const paperRef = useRef<HTMLDivElement>(null);
  const [pdfState, setPdfState] = useState<"idle" | "kerja">("idle");
  const [pdfErr, setPdfErr] = useState("");

  const byIndex = useMemo(() => {
    const m = new Map<number, GradeResult>();
    results.forEach((r) => m.set(r.index, r));
    return m;
  }, [results]);

  const pct = max ? Math.round((total / max) * 100) : 0;
  const benarCount = quiz.questions.filter((_, i) => byIndex.get(i)?.is_correct).length;
  const poinMaks = Math.max(1, ...quiz.questions.map((q) => (Number(q.points) > 0 ? Number(q.points) : 1)));

  /* Materi diambil dari rapor AI; kalau satu soal pun tidak dapat label, seluruh
     grafik turun ke pengelompokan jenis soal. Dicampur setengah-setengah justru
     yang paling menyesatkan: "Pilihan ganda" akan berdiri sejajar dengan
     "Partikel wa/ga" seolah keduanya sama-sama materi. */
  const adaTopik = useMemo(
    () => quiz.questions.some((_, i) => (byIndex.get(i)?.topic ?? "").trim().length > 0),
    [quiz.questions, byIndex]
  );

  const materi = useMemo<Materi[]>(() => {
    const map = new Map<string, Materi>();
    quiz.questions.forEach((q, i) => {
      const r = byIndex.get(i);
      const nama = adaTopik ? ((r?.topic ?? "").trim() || "Lain-lain") : jenisSoal(q);
      const poin = Number(q.points) > 0 ? Number(q.points) : 1;
      const cur = map.get(nama) ?? { nama, dapat: 0, maks: 0, benar: 0, soal: 0, nomor: [] };
      cur.dapat += Number(r?.score) || 0;
      cur.maks += poin;
      cur.benar += r?.is_correct ? 1 : 0;
      cur.soal += 1;
      cur.nomor.push(i + 1);
      map.set(nama, cur);
    });
    // Terlemah di atas — daftar ini dibaca sebagai "kerjakan yang mana dulu",
    // bukan sebagai daftar isi kuisnya.
    return [...map.values()].sort((a, b) => (a.dapat / a.maks) - (b.dapat / b.maks));
  }, [quiz.questions, byIndex, adaTopik]);

  const perluDiulang = materi.filter((m) => m.maks > 0 && m.dapat / m.maks < 0.7);

  const [terbuka, setTerbuka] = useState<Set<number>>(() => {
    // Soal yang salah terbuka duluan; yang benar dilipat. Dua puluh kartu terbuka
    // di layar HP membuat bagian yang perlu dibaca justru paling sulit dicari.
    const s = new Set<number>();
    results.forEach((r) => { if (!r.is_correct) s.add(r.index); });
    return s;
  });
  const [paksaBuka, setPaksaBuka] = useState(false);
  const isOpen = (i: number) => paksaBuka || terbuka.has(i);
  const toggle = (i: number) =>
    setTerbuka((prev) => {
      const n = new Set(prev);
      if (n.has(i)) n.delete(i); else n.add(i);
      return n;
    });

  const lompatKeSoal = (i: number) => {
    setTerbuka((prev) => new Set(prev).add(i));
    // Kartunya baru dibuka di render berikutnya; scroll menunggu satu frame.
    requestAnimationFrame(() => {
      document.getElementById(`hasil-soal-${i}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  /* ── Simpan PDF ────────────────────────────────────────────────────────────
     Ditangkap PER BLOK, bukan satu gambar panjang yang lalu dipotong sepanjang
     tinggi A4: potongan buta itu membelah kartu soal persis di tengah kalimat
     penjelasannya. Di sini tiap blok diukur dulu, dan blok yang tidak muat di
     sisa halaman pindah ke halaman berikutnya utuh-utuh. */
  const simpanPdf = async () => {
    const root = paperRef.current;
    if (!root || pdfState === "kerja") return;
    setPdfState("kerja");
    setPdfErr("");
    // Semua kartu dibuka dulu — PDF yang isinya kartu terlipat tidak ada gunanya.
    setPaksaBuka(true);
    try {
      await loadScript(H2C_URL);
      await loadScript(JSPDF_URL);
      try {
        await (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready;
      } catch { /* font tidak wajib siap */ }
      // Beri React satu putaran untuk benar-benar membuka kartunya.
      await new Promise((r) => setTimeout(r, 120));

      const w = window as typeof window & { html2canvas?: Html2Canvas; jspdf?: { jsPDF: JsPdfCtor } };
      const h2c = w.html2canvas;
      const JsPDF = w.jspdf?.jsPDF;
      if (!h2c || !JsPDF) throw new Error("pustaka PDF belum siap");

      /* Yang dipotret SALINAN selebar 720px di luar layar, bukan kartu yang
         sedang dilihat siswa. Halaman ini hampir selalu dibuka dari HP: kartu
         selebar 390px itu tinggi-kurus, dan waktu dilebarkan ke A4 satu kartu
         saja memakan hampir satu halaman penuh — hasil kuis 10 soal keluar jadi
         13 halaman. Dilebarkan dulu, tata letaknya mengalir seperti di desktop.
         Pakai salinan supaya layar yang sedang dilihat tidak ikut melar. */
      const holder = document.createElement("div");
      holder.style.cssText =
        "position:fixed;left:-10000px;top:0;width:720px;background:#ffffff;padding:8px;z-index:-1";
      const clone = root.cloneNode(true) as HTMLElement;
      clone.style.width = "720px";
      clone.style.maxWidth = "none";
      // Ajakan menyentuh layar & panah lipat kartu tidak punya arti di atas kertas.
      clone.querySelectorAll("[data-pdf-hide]").forEach((el) => el.remove());
      holder.appendChild(clone);
      document.body.appendChild(holder);

      const blocks = Array.from(clone.querySelectorAll<HTMLElement>("[data-pdf-block]"));
      if (!blocks.length) {
        holder.remove();
        throw new Error("tidak ada yang bisa dicetak");
      }

      const pdf = new JsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const margin = 28;
      const lebar = pw - margin * 2;
      let y = margin;

      try {
        for (const el of blocks) {
          const canvas = await h2c(el, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false });
          if (!canvas.width || !canvas.height) continue;
          let h = (canvas.height * lebar) / canvas.width;
          // Blok yang sendirian saja lebih tinggi dari satu halaman (kartu soal
          // uraian yang panjang) dikecilkan supaya tetap utuh — dipotong dua akan
          // membelah penjelasan yang justru inti halamannya.
          const maxH = ph - margin * 2;
          let lebarPakai = lebar;
          if (h > maxH) { lebarPakai = (lebar * maxH) / h; h = maxH; }
          if (y + h > ph - margin) { pdf.addPage(); y = margin; }
          pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", margin, y, lebarPakai, h);
          y += h + 10;
        }
      } finally {
        holder.remove();
      }

      const aman = (name || "Siswa").replace(/[^\p{L}\p{N} _-]/gu, "").trim().replace(/\s+/g, "-") || "Siswa";
      pdf.save(`Hasil-Kuis-Linguo-${aman}.pdf`);
    } catch (e) {
      console.error("[HasilKuis] gagal membuat PDF:", e);
      setPdfErr("PDF gagal dibuat. Cek koneksi lalu coba lagi ya.");
    } finally {
      setPaksaBuka(false);
      setPdfState("idle");
    }
  };

  const tanggal = new Date().toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta",
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div ref={paperRef} className="space-y-3">
        {/* ── Kepala rapor + skor ──────────────────────────────────────────── */}
        <section data-pdf-block className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: BRAND }}>
                Hasil Kuis
              </p>
              <h1 className="mt-0.5 truncate text-lg font-extrabold text-slate-800">{name || "Siswa"}</h1>
              <p className="mt-0.5 text-[12px] text-slate-500">
                {[quiz.title, quiz.session_label].filter(Boolean).join(" · ")}
              </p>
              <p className="text-[11px] text-slate-400">{tanggal}</p>
            </div>
            <SkorCincin pct={pct} />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <Tile label="Soal benar" nilai={`${benarCount}/${quiz.questions.length}`} />
            <Tile label="Poin" nilai={`${bulat(total)}/${bulat(max)}`} />
            {/* Lama pengerjaan ditampilkan ke siswa juga, bukan cuma dikirim ke
                pengajar — angka yang diam-diam direkam terasa seperti diawasi. */}
            {/* Tanpa ikon jam: labelnya sudah menyebut "Waktu", dan di kotak
                selebar sepertiga layar HP ikonnya cuma mendorong angkanya turun
                ke baris kedua. */}
            <Tile label="Waktu" nilai={durationSec ? lamaRingkas(durationSec) : "—"} />
          </div>
        </section>

        {/* ── Grafik 1: penguasaan per materi ──────────────────────────────── */}
        {materi.length > 0 && (
          <section data-pdf-block className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800">
              {adaTopik ? "Penguasaan per materi" : "Penguasaan per jenis soal"}
            </h2>
            <p className="mt-0.5 text-[11.5px] text-slate-500">
              Urut dari yang paling perlu diulang. Angkanya poin yang kamu dapat dari poin yang tersedia.
            </p>
            <div className="mt-3.5 space-y-3">
              {materi.map((m) => {
                const p = m.maks > 0 ? Math.round((m.dapat / m.maks) * 100) : 0;
                const lemah = p < 70;
                return (
                  <div key={m.nama}>
                    <div className="mb-1 flex items-baseline justify-between gap-2">
                      <span className="truncate text-[13px] font-semibold text-slate-700">{m.nama}</span>
                      <span className="shrink-0 text-[12px] font-bold text-slate-500 tabular-nums">
                        {bulat(m.dapat)}/{bulat(m.maks)} poin · {p}%
                      </span>
                    </div>
                    {/* Satu warna saja: yang membawa besarannya panjang batangnya,
                        bukan hue-nya. Status "perlu diulang" jalan lewat chip
                        berikon di sebelahnya. */}
                    <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ background: TRACK }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.max(p === 0 ? 0 : 4, p)}%`, background: BRAND }}
                      />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <Chip
                        warna={lemah ? WARN : OK}
                        icon={lemah ? <RotateCcw className="h-3 w-3" /> : <ThumbsUp className="h-3 w-3" />}
                        teks={lemah ? "Perlu diulang" : "Sudah oke"}
                      />
                      <span className="text-[11px] text-slate-400">
                        Soal no. {m.nomor.join(", ")} · {m.benar}/{m.soal} benar
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Grafik 2: poin per soal ──────────────────────────────────────── */}
        <section data-pdf-block className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800">Poin per soal</h2>
          <p className="mt-0.5 text-[11.5px] text-slate-500">
            Kotak abu-abu = poin yang tersedia, bagian berwarna = poin yang kamu dapat.
            <span data-pdf-hide> Ketuk batangnya untuk lompat ke soalnya.</span>
          </p>

          {/* Legenda wajib ada: hijau & amber tidak boleh jadi satu-satunya pembeda. */}
          <div className="mt-2 flex items-center gap-3">
            <Legenda warna={OK} icon={<CheckCircle2 className="h-3 w-3" />} teks="Benar" />
            <Legenda warna={WARN} icon={<XCircle className="h-3 w-3" />} teks="Belum tepat" />
          </div>

          {/* Tinggi jalur abu-abunya ikut BOBOT soalnya, bukan sama rata: soal
              uraian 3 poin dan pilihan ganda 1 poin yang digambar sama tinggi
              membuat kehilangan 3 poin terlihat sekecil kehilangan 1 poin. */}
          <div className="mt-3 flex items-end gap-[3px] overflow-x-auto pb-1">
            {quiz.questions.map((q, i) => {
              const r = byIndex.get(i);
              const poin = Number(q.points) > 0 ? Number(q.points) : 1;
              const dapat = Math.max(0, Math.min(poin, Number(r?.score) || 0));
              const rasio = poin > 0 ? dapat / poin : 0;
              const ok = !!r?.is_correct;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => lompatKeSoal(i)}
                  title={`Soal ${i + 1} — ${bulat(dapat)}/${bulat(poin)} poin · ${ok ? "benar" : "belum tepat"}`}
                  className="group flex min-w-[18px] flex-1 flex-col items-center gap-1"
                >
                  <div
                    className="flex w-full items-end justify-center rounded-[3px]"
                    style={{ height: Math.round((poin / poinMaks) * 76) || 8, background: TRACK }}
                  >
                    <div
                      className="w-full rounded-[3px] transition-opacity group-hover:opacity-80"
                      style={{
                        // Nol poin tetap menyisakan garis tipis — batang yang benar-benar
                        // hilang terbaca sebagai soal yang tidak ada, bukan sebagai nol.
                        height: rasio === 0 ? 3 : `${Math.max(10, rasio * 100)}%`,
                        background: ok ? OK : WARN,
                      }}
                    />
                  </div>
                  <span className="text-[9.5px] font-semibold text-slate-400 tabular-nums">{i + 1}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Rapor AI ─────────────────────────────────────────────────────── */}
        <RaporAi analysis={analysis} perluDiulang={perluDiulang.map((m) => m.nama)} />

        {/* ── Daftar soal ──────────────────────────────────────────────────── */}
        <section data-pdf-block className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800">Pembahasan tiap soal</h2>
          <p className="mt-0.5 text-[11.5px] text-slate-500" data-pdf-hide>
            Soal yang belum tepat sudah terbuka. Ketuk soal lain untuk membaca pembahasannya.
          </p>
        </section>

        {quiz.questions.map((q, i) => (
          <KartuSoal
            key={i}
            no={i + 1}
            q={q}
            r={byIndex.get(i)}
            jawabanmu={jawabanSiswa(q, responses[i])}
            open={isOpen(i)}
            onToggle={() => toggle(i)}
            showTranslit={showTranslit}
            adaTopik={adaTopik}
          />
        ))}
      </div>

      {/* ── Aksi (di luar area cetak) ──────────────────────────────────────── */}
      <div className="mt-4">
        <button
          type="button"
          onClick={simpanPdf}
          disabled={pdfState === "kerja"}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-sm disabled:opacity-60"
          style={{ background: BRAND_DEEP }}
        >
          {pdfState === "kerja"
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyiapkan PDF…</>
            : <><Download className="h-4 w-4" /> Simpan hasil ini jadi PDF</>}
        </button>
        {pdfErr && <p className="mt-2 text-center text-[12px] font-medium" style={{ color: WARN }}>{pdfErr}</p>}
        <p className="mt-2 text-center text-[11px] text-slate-400">
          Halaman ini tidak bisa dibuka ulang setelah ditutup — simpan dulu kalau mau dibaca lagi nanti.
        </p>
      </div>
    </div>
  );
}

/** Poin boleh desimal (jawaban separuh benar); "7.5" berguna, "7.500000001" tidak. */
function bulat(n: number): string {
  const v = Math.round((Number(n) || 0) * 10) / 10;
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

/** Cincin skor — SVG, karena inilah yang paling andal ikut terpotret html2canvas. */
function SkorCincin({ pct }: { pct: number }) {
  const R = 30;
  const keliling = 2 * Math.PI * R;
  const isi = (Math.max(0, Math.min(100, pct)) / 100) * keliling;
  return (
    <div className="relative shrink-0">
      <svg width="76" height="76" viewBox="0 0 76 76">
        <circle cx="38" cy="38" r={R} fill="none" stroke={TRACK} strokeWidth="8" />
        <circle
          cx="38" cy="38" r={R} fill="none" stroke={BRAND} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${isi} ${keliling}`} transform="rotate(-90 38 38)"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-lg font-extrabold text-slate-800 tabular-nums">{pct}%</span>
      </div>
    </div>
  );
}

function Tile({ label, nilai, icon }: { label: string; nilai: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 flex items-center gap-1 text-[13px] font-bold text-slate-700">{icon}{nilai}</p>
    </div>
  );
}

function Chip({ warna, icon, teks }: { warna: string; icon: React.ReactNode; teks: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold"
      style={{ color: warna, background: `${warna}14` }}
    >
      {icon}{teks}
    </span>
  );
}

function Legenda({ warna, icon, teks }: { warna: string; icon: React.ReactNode; teks: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
      <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: warna }} />
      <span style={{ color: warna }}>{icon}</span>
      {teks}
    </span>
  );
}

/* Rapor AI. Isinya sama persis dengan yang tersimpan di quiz_submissions.analysis
   dan muncul lagi di dashboard siswa — ini cuma penayangan pertamanya. Tidak
   memakai QuizAnalysisCard milik dashboard: komponen itu memakai token tema yang
   ikut gelap kalau staf membuka link ini dengan tema gelap. */
function RaporAi({ analysis, perluDiulang }: { analysis: QuizAnalysis | null; perluDiulang: string[] }) {
  if (!analysis) return null;
  const list = (v: unknown): string[] =>
    Array.isArray(v) ? v.map((x) => String(x ?? "").trim()).filter(Boolean) : [];

  const summary = String(analysis.summary ?? "").trim();
  const blocks = [
    { title: "Sudah bagus", items: list(analysis.strengths), icon: <ThumbsUp className="h-3.5 w-3.5" />, fg: OK, bg: "#f0fdf4", border: "#a7f3d0" },
    { title: "Masih kurang", items: list(analysis.weaknesses), icon: <Target className="h-3.5 w-3.5" />, fg: WARN, bg: "#fffbeb", border: "#fde68a" },
    { title: "Perbaikannya", items: list(analysis.improvements), icon: <Lightbulb className="h-3.5 w-3.5" />, fg: BRAND_DEEP, bg: "#f0fdfa", border: "#99f6e4" },
  ].filter((b) => b.items.length > 0);

  // Chip "ulang lagi" diambil dari grafik materi kalau ada — angkanya nyata dari
  // hasil koreksi, bukan daftar topik yang dikarang ulang oleh model.
  const topics = perluDiulang.length ? perluDiulang : list(analysis.topics);

  if (!summary && !blocks.length) return null;

  return (
    <section data-pdf-block className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
        <Sparkles className="h-4 w-4" style={{ color: BRAND }} /> Catatan buat kamu
      </h2>
      {summary && <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600">{summary}</p>}
      <div className="mt-3 space-y-2.5">
        {blocks.map((b) => (
          <div key={b.title} className="rounded-xl border p-3" style={{ borderColor: b.border, background: b.bg }}>
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: b.fg }}>
              {b.icon}{b.title}
            </p>
            <ul className="space-y-1">
              {b.items.map((t, i) => (
                <li key={i} className="flex gap-2 text-[13px] leading-snug text-slate-700">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: b.fg }} />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {topics.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500">Ulang lagi:</span>
          {topics.map((t, i) => (
            <span key={i} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{t}</span>
          ))}
        </div>
      )}
    </section>
  );
}

function KartuSoal({
  no, q, r, jawabanmu, open, onToggle, showTranslit, adaTopik,
}: {
  no: number;
  q: PublicQuizQuestion;
  r: GradeResult | undefined;
  jawabanmu: string;
  open: boolean;
  onToggle: () => void;
  showTranslit: boolean;
  adaTopik: boolean;
}) {
  const ok = !!r?.is_correct;
  const poin = Number(q.points) > 0 ? Number(q.points) : 1;
  const dapat = Math.max(0, Math.min(poin, Number(r?.score) || 0));
  const warna = ok ? OK : WARN;

  const kunci = (r?.correct_answer_text ?? "").trim();
  const kunciTranslit = (r?.correct_answer_translit ?? "").trim();
  /* Kunci ditampilkan untuk soal yang SALAH, dan untuk soal uraian/terjemahan
     tetap ditampilkan meski benar — di sana "jawaban ideal" itu pembanding yang
     berguna, sementara di pilihan ganda yang sudah benar ia cuma mengulang apa
     yang barusan dipilih siswa. */
  const tampilkanKunci = !!kunci && (!ok || !isMC(q));
  const labelKunci = q.type === "essay" ? "Contoh jawaban ideal" : "Jawaban benar";

  const why = (r?.why ?? "").trim();
  const fb = feedbackBerguna(r?.feedback);
  // `why` = kenapa benarnya benar (selalu ada kalau rapor AI jalan); `feedback` =
  // penilaian jawaban siswa. Keduanya ditampilkan kalau isinya memang berbeda.
  const catatan = [why, fb && fb !== why ? fb : ""].filter(Boolean);

  return (
    <section
      id={`hasil-soal-${no - 1}`}
      data-pdf-block
      className="overflow-hidden rounded-2xl border bg-white shadow-sm"
      style={{ borderColor: ok ? "#bbf7d0" : "#fde68a" }}
    >
      <button type="button" onClick={onToggle} className="flex w-full items-start gap-2.5 px-4 py-3 text-left">
        <span
          className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-extrabold text-white"
          style={{ background: warna }}
        >
          {no}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <Chip
              warna={warna}
              icon={ok ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              teks={ok ? "Benar" : dapat > 0 ? "Separuh benar" : "Belum tepat"}
            />
            {adaTopik && r?.topic
              ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-semibold text-slate-600">{r.topic}</span>
              : null}
            <span className="text-[10.5px] font-bold text-slate-400 tabular-nums">{bulat(dapat)}/{bulat(poin)} poin</span>
          </span>
          <span className="mt-1 block text-[13.5px] font-semibold leading-snug text-slate-800">{q.prompt}</span>
          {showTranslit && q.prompt_translit
            ? <span className="mt-0.5 block text-[11.5px] italic text-slate-400">{q.prompt_translit}</span>
            : null}
        </span>
        <ChevronDown
          data-pdf-hide
          className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : undefined }}
        />
      </button>

      {open && (
        <div className="space-y-2 px-4 pb-4">
          <Baris label="Jawabanmu" nilai={jawabanmu || "(tidak dijawab)"} warna={warna} />

          {r?.transcript ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
              <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                <ImageIcon className="h-3 w-3" /> Terbaca dari fotomu
              </p>
              <p className="mt-0.5 text-[12.5px] italic text-slate-600">{r.transcript}</p>
            </div>
          ) : null}

          {tampilkanKunci && (
            <div className="rounded-lg border p-2.5" style={{ borderColor: "#a7f3d0", background: "#f0fdf4" }}>
              <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: OK }}>{labelKunci}</p>
              <p className="mt-0.5 text-[13px] font-semibold text-slate-700">{kunci}</p>
              {kunciTranslit && <p className="text-[11.5px] italic text-slate-400">{kunciTranslit}</p>}
            </div>
          )}

          {catatan.length > 0 && (
            <div className="rounded-lg border p-2.5" style={{ borderColor: "#99f6e4", background: "#f0fdfa" }}>
              <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: BRAND_DEEP }}>
                <Lightbulb className="h-3 w-3" /> {ok ? "Kenapa ini benar" : "Kenapa jawabanmu belum tepat"}
              </p>
              {catatan.map((c, i) => (
                <p key={i} className="mt-0.5 text-[12.5px] leading-relaxed text-slate-600">{c}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Baris({ label, nilai, warna }: { label: string; nilai: string; warna: string }) {
  return (
    <div className="rounded-lg border p-2.5" style={{ borderColor: `${warna}33`, background: `${warna}0d` }}>
      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: warna }}>{label}</p>
      <p className="mt-0.5 whitespace-pre-wrap text-[13px] font-semibold text-slate-700">{nilai}</p>
    </div>
  );
}
