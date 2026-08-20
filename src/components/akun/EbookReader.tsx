"use client";

// [ebook-reader-v1] Pembaca e-book di dalam dashboard siswa.
//
// Sebelumnya modul cuma bisa DIUNDUH: siswa keluar dashboard, berkasnya
// mendarat di folder unduhan dan bebas diteruskan ke siapa pun, dan kita tidak
// pernah tahu ada yang membacanya atau tidak. Reader ini membalik semua itu —
// halaman dirender di sini, berkasnya tidak pernah jadi URL yang bisa disalin
// (lihat src/app/api/ebook/route.ts), dan tiap halaman diberi cap nama pembeli.
//
// Soal proteksi, jujur saja: ini friksi, bukan DRM. Tangkapan layar tetap bisa,
// dan byte PDF-nya ada di memori browser. Yang benar-benar menahan orang
// menyebarkan modul adalah CAP NAMA + EMAILNYA di tiap halaman, bukan tombol
// unduh yang disembunyikan.
//
// [ebook-zoom-cubit-v1] Zoom mengikuti gerakan: cubit trackpad Mac / dua jari
// di layar sentuh, Ctrl/⌘ + gulir, dan ⌘ +/-/0. Halaman diskalakan lewat CSS
// selama jari masih bergerak, lalu diraster ulang begitu gerakannya berhenti.
//
// [ebook-tts-ketuk-kata-v1] Ketuk kata bahasa target → pelafalannya berbunyi
// (Chirp 3 HD lewat /api/tts, bercache tiga lapis — lihat src/lib/ebookTts.ts).
// Teksnya TIDAK dipasang sebagai lapisan HTML seperti pdf.js biasanya: lapisan
// itu bisa diblok-salin, dan seluruh reader ini justru dibangun supaya isinya
// tidak gampang dipanen. Jadi ketukan diadu langsung dengan koordinat teks dari
// getTextContent(), sementara yang tampak tetap piksel canvas.
//
// [ebook-reader-spread-v2] Tampilannya sekarang seperti buku betulan: dua
// halaman bersebelahan (kiri–kanan) dengan animasi balik halaman 3D ala reader
// Issuu. Sampul (halaman 1) berdiri sendiri, sisanya berpasangan genap–ganjil.
// Layar sempit otomatis balik ke satu halaman.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { tr, useT } from "@/lib/uiLang"; // [ui-lang-switcher-v1]
import {
  ChevronLeft, ChevronRight, Loader2, Minus, Plus, X, BookOpen, AlertCircle,
  Columns2, Square, Maximize2, Minimize2, Volume2,
} from "lucide-react";
// [ebook-tts-ketuk-kata-v1]
import {
  bisaDibunyikan, kodeBahasaEbook, barisTerjemahan, ucapkanEbook,
  hentikanEbookTts, bukaKunciAudio,
} from "@/lib/ebookTts";
import { langLabel } from "@/lib/quiz/language";

/* eslint-disable @typescript-eslint/no-explicit-any */
type PdfDoc = any;

const ZOOM_MIN = 0.5;
// Batas atas dinaikkan dari 2.5: dengan cubitan, siswa yang membaca catatan kaki
// di HP wajar menarik halaman jauh lebih dekat daripada lewat tombol +.
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.2;
const jepitZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, +z.toFixed(3)));
/** Jeda tanpa gerakan sebelum halaman diraster ulang di zoom yang baru. */
const JEDA_KOMIT_ZOOM = 160;
/** Batas kerapatan render — 3x di layar HP modern bikin canvas boros memori. */
const DPR_MAX = 2;
/** Sisa ruang di sekeliling halaman (px) — dipakai menghitung skala muat-penuh. */
const PADDING_X = 36;
const PADDING_Y = 36;
/** Jarak antar dua halaman (punggung buku). */
const GAP = 2;
/** Lebar minimum wadah sebelum tampilan dua halaman masuk akal. */
const LEBAR_DUA_HALAMAN = 760;
/** Lama animasi balik halaman. Lebih dari ini terasa lambat, kurang jadi kedip. */
const DURASI_BALIK = 620;
/** Halaman yang bitmap-nya disimpan. 40 halaman sekaligus terlalu boros memori. */
const CACHE_MAX = 10;

const halamanKey = (purchaseId: string) => `ebook-hal:${purchaseId}`;

/* ── pemanasan pdf.js ──────────────────────────────────────────────────────
   Bundel pdf.js itu ratusan KB dan dulu baru mulai diunduh PADA DETIK reader
   dibuka — itulah sebagian besar isi layar "Menyiapkan modul…". Sekarang
   Perpustakaan memanggil prewarmEbookReader() waktu browser senggang, jadi
   begitu tombol Baca ditekan modulnya biasanya sudah siap di memori. */
let pdfjsPromise: Promise<any> | null = null;

function muatPdfjs(): Promise<any> {
  if (!pdfjsPromise) {
    // Build `legacy`: siswa banyak yang memakai browser bawaan HP lawas.
    pdfjsPromise = (import("pdfjs-dist/legacy/build/pdf.mjs") as Promise<any>)
      .then((m) => {
        // Worker disajikan dari domain sendiri (disalin saat postinstall).
        m.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
        return m;
      })
      .catch((e) => { pdfjsPromise = null; throw e; });
  }
  return pdfjsPromise;
}

/* ── layar penuh ───────────────────────────────────────────────────────────
   Reader ini menutupi halaman, tapi bilah tab & alamat browser tetap terlihat —
   di laptop 13" itu memakan tinggi yang justru dipakai menghitung skala "muat
   satu bentangan", jadi halamannya mengecil percuma.

   ⚠️ requestFullscreen HANYA boleh dipanggil dari gerakan pengguna. Effect
   mount reader masih di dalam jendela aktivasi di Chrome, tapi Safari lebih
   ketat — karena itu fungsinya diekspor: Perpustakaan memanggilnya langsung di
   handler klik "Baca", SEBELUM `await getSession()` yang bisa memutus aktivasi.
   Panggilan kedua dari reader jadi tak berefek kalau yang pertama sudah jalan.

   iOS Safari (iPhone) tidak punya Element.requestFullscreen sama sekali —
   di sana reader tetap seperti sebelumnya: menutup halaman, bukan browsernya. */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
type ElPenuh = Element & { webkitRequestFullscreen?: () => Promise<void> | void };

export function mintaLayarPenuh(): Promise<boolean> {
  if (typeof document === "undefined") return Promise.resolve(false);
  if (document.fullscreenElement) return Promise.resolve(true);
  const el = document.documentElement as ElPenuh;
  const minta = el.requestFullscreen?.bind(el) ?? el.webkitRequestFullscreen?.bind(el);
  if (!minta) return Promise.resolve(false);
  try {
    return Promise.resolve(minta()).then(() => true).catch(() => false);
  } catch {
    return Promise.resolve(false);
  }
}

function keluarLayarPenuh(): void {
  if (typeof document === "undefined" || !document.fullscreenElement) return;
  try {
    void (document.exitFullscreen?.() as Promise<void> | undefined)?.catch(() => {});
  } catch {
    /* browser lama — biarkan */
  }
}

/** Dipanggil dari Perpustakaan saat browser senggang. Gagal = diam saja. */
export function prewarmEbookReader() {
  if (typeof window === "undefined") return;
  const jalan = () => { void muatPdfjs().catch(() => {}); };
  const w = window as any;
  if (typeof w.requestIdleCallback === "function") w.requestIdleCallback(jalan, { timeout: 4000 });
  else setTimeout(jalan, 1200);
}

/* Byte modul yang terakhir dibaca ditahan di memori: buka–tutup–buka reader
   dalam satu sesi tidak perlu menunggu jaringan lagi. Cuma SATU entri — modul
   itu ~1 MB dan tak ada gunanya menimbun banyak. */
let bufCache: { id: string; buf: ArrayBuffer } | null = null;

async function ambilBerkas(purchaseId: string, accessToken: string): Promise<ArrayBuffer> {
  if (bufCache?.id === purchaseId) return bufCache.buf;
  const res = await fetch("/api/ebook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ purchaseId, accessToken }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || tr("Gagal memuat modul"));
  }
  const buf = await res.arrayBuffer();
  bufCache = { id: purchaseId, buf };
  return buf;
}

/* [ebook-tts-ketuk-kata-v1] Satu potong teks dari getTextContent(), koordinatnya
   dalam SATUAN HALAMAN (viewport skala 1) supaya tetap sahih waktu di-zoom. */
type ItemTeks = { str: string; x: number; y: number; w: number; h: number };

/** Huruf penyusun kata — dipakai memuaikan ketukan jadi satu kata utuh. */
const HURUF = /[\p{L}\p{M}\p{N}'\u2019\u02BC-]/u;

/* Kanvas tak tampak untuk mengukur lebar huruf. pdf.js melaporkan lebar SELURUH
   potongan teks, bukan per huruf, jadi batas antar kata dihitung dengan
   measureText lalu dinormalkan ke lebar itu. Fontnya beda dari font PDF-nya,
   tapi setelah dinormalkan selisihnya tinggal beberapa piksel — cukup untuk
   menentukan kata mana yang diketuk. */
let ukurCanvas: CanvasRenderingContext2D | null = null;
function ukurCtx(): CanvasRenderingContext2D | null {
  if (typeof document === "undefined") return null;
  if (!ukurCanvas) ukurCanvas = document.createElement("canvas").getContext("2d");
  return ukurCanvas;
}

type Bitmap = { canvas: HTMLCanvasElement; w: number; h: number };
type Bentangan = { kiri: number | null; kanan: number | null };

/**
 * Halaman yang tampak untuk sebuah posisi baca, mengikuti cara buku dijilid:
 * sampul (halaman 1) duduk SENDIRIAN DI KANAN, sisanya berpasangan genap-ganjil
 * (2–3, 4–5, …). Ini bukan kosmetik: dengan sampul di kanan, lebar bukunya tidak
 * pernah berubah dan lembar yang diputar selalu punya sisi yang benar — kalau
 * sampul ditaruh di tengah, animasi baliknya harus menggeser seluruh buku.
 */
function bentangan(p: number, total: number, dua: boolean): Bentangan {
  const hal = Math.min(Math.max(1, p), Math.max(1, total || 1));
  if (!dua) return { kiri: hal, kanan: null };
  if (hal <= 1) return { kiri: null, kanan: 1 };
  const kiri = hal % 2 === 0 ? hal : hal - 1;
  return { kiri, kanan: kiri + 1 <= total ? kiri + 1 : null };
}

/** Halaman pertama sebuah bentangan — dipakai sebagai nilai `page`. */
const awalBentangan = (b: Bentangan) => (b.kiri ?? b.kanan ?? 1);

export interface EbookReaderProps {
  purchaseId: string;
  title: string;
  /** Token sesi Supabase — dipakai route untuk memastikan modul ini memang miliknya. */
  accessToken: string;
  /** Teks cap air, mis. "Rina Dewi · rina@email.com". */
  watermark: string;
  /** [ebook-tts-ketuk-kata-v1] Bahasa modul (`digital_products.language`).
   *  Kosong pun tak apa — bahasanya ditebak dari judul. Kalau tetap tak
   *  terbaca, ketuk-untuk-mendengar tidak diaktifkan sama sekali. */
  language?: string | null;
  onClose: () => void;
}

export default function EbookReader({
  purchaseId, title, accessToken, watermark, language, onClose,
}: EbookReaderProps) {
  const [doc, setDoc] = useState<PdfDoc | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  /* [ebook-zoom-cubit-v1] `zoom` di atas adalah zoom yang SUDAH diraster;
     `zoomLive` yang berubah tiap frame cubitan. Selisih keduanya dipakai sebagai
     skala CSS sementara — merender ulang PDF tiap frame terlalu berat dan malah
     membuat cubitannya patah-patah. */
  const [zoomLive, setZoomLive] = useState(1);
  const zoomLiveRef = useRef(1);
  const komitRef = useRef<number | null>(null);
  /** Skala render yang sedang berlaku (px per satuan halaman) — dipakai
      menaruh sorotan kata di tempat yang benar. */
  const [skalaTampil, setSkalaTampil] = useState(0);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);
  /** null = ikut lebar layar; true/false = pilihan siswa dari bilah atas. */
  const [duaManual, setDuaManual] = useState<boolean | null>(null);
  const [muatDua, setMuatDua] = useState(false);
  /** Ukuran halaman terpasang (CSS px) — dipakai menata slot & flipper. */
  const [ukuran, setUkuran] = useState<{ w: number; h: number } | null>(null);
  /** Animasi balik halaman yang sedang jalan (null = tidak ada). */
  const [balik, setBalik] = useState<{ arah: 1 | -1; tujuan: Bentangan } | null>(null);

  /* [ebook-tts-ketuk-kata-v1] Kata yang barusan diketuk: dipakai menggambar
     sorotan + gelembung kecil di atasnya. Koordinatnya sudah dalam px layar
     relatif terhadap kotak buku. */
  const [ucap, setUcap] = useState<
    { hal: number; kata: string; kalimat: string; x: number; y: number; w: number; h: number; terjemahan: boolean }
    | null
  >(null);
  const [bunyi, setBunyi] = useState<"kata" | "kalimat" | null>(null);

  const [layarPenuh, setLayarPenuh] = useState(false);
  /** Kita yang menyalakan layar penuh? Kalau siswa sudah fullscreen dari sebelumnya,
      jangan dimatikan waktu reader ditutup — itu bukan milik kita. */
  const penuhOlehKitaRef = useRef(false);

  const wadahRef = useRef<HTMLDivElement | null>(null);
  const kiriRef = useRef<HTMLCanvasElement | null>(null);
  const kananRef = useRef<HTMLCanvasElement | null>(null);
  const depanRef = useRef<HTMLCanvasElement | null>(null);
  const belakangRef = useRef<HTMLCanvasElement | null>(null);
  const docRef = useRef<PdfDoc | null>(null);
  const pdfjsRef = useRef<any>(null);
  /** Isi teks per halaman (satuan halaman, skala 1) — dibaca sekali per halaman. */
  const teksRef = useRef<Map<number, ItemTeks[]>>(new Map());
  const capRef = useRef(watermark);
  capRef.current = watermark;

  /** Bitmap halaman siap pakai + tugas render yang sedang jalan, per generasi skala. */
  const bitmapRef = useRef<Map<number, Bitmap>>(new Map());
  const antreRef = useRef<Map<number, Promise<Bitmap | null>>>(new Map());
  const skalaRef = useRef(0);
  /** Naik tiap kali skala berubah — bitmap generasi lama dibuang. */
  const [generasi, setGenerasi] = useState(0);
  /** Salinan `generasi` yang bisa dibaca dari dalam render yang sudah jalan. */
  const generasiRef = useRef(0);
  generasiRef.current = generasi;
  const ukuranWadahRef = useRef({ w: 0, h: 0 });
  const balikRef = useRef(false);
  /** Satu permintaan balik yang datang saat animasi masih jalan — lihat balikKe. */
  const antreBalikRef = useRef<1 | -1 | null>(null);
  /** Halaman terkini yang bisa dibaca dari dalam callback tanpa ikut basi. */
  const pageRef = useRef(1);
  pageRef.current = page;

  const dua = muatDua && (duaManual ?? true);
  const tampil = useMemo(() => bentangan(page, total, dua), [page, total, dua]);

  /* ── muat dokumen ──────────────────────────────────────────────────────── */
  useEffect(() => {
    let hidup = true;
    (async () => {
      try {
        // [ebook-reader-paralel-v1] Bundel pdf.js dan berkas modulnya diminta
        // BARENGAN — dua penantian itu tidak saling bergantung, jadi waktu
        // tunggunya tinggal yang paling lama, bukan jumlah keduanya.
        const [pdfjs, buf] = await Promise.all([
          muatPdfjs(),
          ambilBerkas(purchaseId, accessToken),
        ]);
        if (!hidup) return;
        pdfjsRef.current = pdfjs; // dipakai Util.transform waktu menghitung letak teks

        // Salinan byte: pdf.js "memindahkan" buffer yang diberikan ke worker,
        // jadi kalau aslinya dipakai langsung, entri bufCache jadi kosong dan
        // buka-ulang reader malah gagal.
        const d = await pdfjs.getDocument({ data: new Uint8Array(buf.slice(0)) }).promise;
        if (!hidup) { d.destroy?.(); return; }

        docRef.current = d;
        setDoc(d);
        setTotal(d.numPages);
        // Lanjut dari halaman terakhir. Disimpan lokal dulu — menambah kolom di
        // digital_purchases perlu ubah skema, dan itu keputusan terpisah.
        const simpanan = Number(localStorage.getItem(halamanKey(purchaseId)) || "1");
        setPage(Number.isFinite(simpanan) ? Math.min(Math.max(1, simpanan), d.numPages) : 1);
      } catch (e: any) {
        if (hidup) setGalat(e?.message || tr("Gagal memuat modul"));
      } finally {
        if (hidup) setMemuat(false);
      }
    })();
    return () => {
      hidup = false;
      docRef.current?.destroy?.();
      docRef.current = null;
      bitmapRef.current.clear();
      antreRef.current.clear();
      teksRef.current.clear();
      hentikanEbookTts();
    };
  }, [purchaseId, accessToken]);

  /* ── skala: satu bentangan penuh harus MUAT di layar ───────────────────── */
  // [ebook-reader-fit-v1] Skala dasar = muat penuh (lebar DAN tinggi), bukan
  // cuma pas lebar. Dulu halaman selalu direntang selebar wadah, jadi di
  // desktop tiap halaman jadi jangkung dan wajib digulir untuk melihat bagian
  // bawahnya. Sekarang zoom 100% = satu bentangan utuh.
  const hitungSkala = useCallback(async () => {
    const d = docRef.current;
    const wadah = wadahRef.current;
    if (!d || !wadah) return;

    const p = await d.getPage(Math.min(page, d.numPages));
    const dasar = p.getViewport({ scale: 1 });
    const kolom = dua ? 2 : 1;

    const lebarTersedia = Math.max(240, wadah.clientWidth - PADDING_X) - (kolom - 1) * GAP;
    const tinggiTersedia = Math.max(240, wadah.clientHeight - PADDING_Y);
    const muat = Math.min(lebarTersedia / (dasar.width * kolom), tinggiTersedia / dasar.height);
    const skala = muat * zoom;

    const w = Math.floor(dasar.width * skala);
    const h = Math.floor(dasar.height * skala);
    // skalaRef mulai dari 0, bukan 1: kalau nilai awalnya 1 dan skala muatnya
    // kebetulan pas 1.000, penjagaan ini akan menolak perhitungan PERTAMA dan
    // reader tak pernah dapat ukuran halaman — layarnya kosong tanpa galat.
    if (Math.abs(skala - skalaRef.current) < 0.001) return;

    skalaRef.current = skala;
    bitmapRef.current.clear();
    antreRef.current.clear();
    setUkuran({ w, h });
    setSkalaTampil(skala);
    setGenerasi((g) => g + 1);
  }, [page, zoom, dua]);

  useEffect(() => { if (doc) void hitungSkala(); }, [doc, hitungSkala]);

  // Ukuran wadah berubah (putar HP / ubah ukuran jendela) → hitung ulang.
  // ⚠️ Wajib pakai rem: waktu zoom > 100% batang gulir muncul, itu MENGUBAH
  // clientWidth wadah → ResizeObserver menembak lagi → render tanpa henti.
  useEffect(() => {
    const w = wadahRef.current;
    if (!w) return;
    const ro = new ResizeObserver(() => {
      const el = wadahRef.current;
      if (!el) return;
      const { w: lw, h: lh } = ukuranWadahRef.current;
      if (Math.abs(el.clientWidth - lw) < 4 && Math.abs(el.clientHeight - lh) < 4) return;
      ukuranWadahRef.current = { w: el.clientWidth, h: el.clientHeight };
      setMuatDua(el.clientWidth >= LEBAR_DUA_HALAMAN && el.clientWidth > el.clientHeight);
      void hitungSkala();
    });
    ro.observe(w);
    // Pengukuran pertama: ResizeObserver baru menembak setelah frame berikutnya.
    ukuranWadahRef.current = { w: w.clientWidth, h: w.clientHeight };
    setMuatDua(w.clientWidth >= LEBAR_DUA_HALAMAN && w.clientWidth > w.clientHeight);
    return () => ro.disconnect();
  }, [hitungSkala]);

  /* ── zoom yang mengikuti gerakan ────────────────────────────────────────
     [ebook-zoom-cubit-v1] Dulu zoom cuma bisa lewat dua tombol ± di bilah atas,
     dan cubitan trackpad malah memperbesar SELURUH halaman browser (bilah alamat
     ikut membesar, modulnya tidak). */
  const aturZoom = useCallback((next: number, langsung = false) => {
    const z = jepitZoom(next);
    if (z === zoomLiveRef.current && !langsung) return;
    zoomLiveRef.current = z;
    setZoomLive(z);
    // Sorotan kata memakai koordinat piksel — begitu skalanya berubah, letaknya
    // tak lagi sahih.
    setUcap(null);
    if (komitRef.current) { window.clearTimeout(komitRef.current); komitRef.current = null; }
    if (langsung) { setZoom(z); return; }
    komitRef.current = window.setTimeout(() => {
      komitRef.current = null;
      setZoom(zoomLiveRef.current);
    }, JEDA_KOMIT_ZOOM);
  }, []);

  useEffect(() => () => { if (komitRef.current) window.clearTimeout(komitRef.current); }, []);

  useEffect(() => {
    const el = wadahRef.current;
    if (!el) return;
    // Cubitan trackpad Mac sampai ke browser sebagai `wheel` ber-ctrlKey. Tanpa
    // preventDefault, yang mengecil adalah seluruh halaman. Listener dipasang
    // manual — onWheel milik React terdaftar sebagai passive, dan di listener
    // passive preventDefault diabaikan diam-diam.
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      // Eksponensial, bukan penjumlahan: satu takaran cubitan terasa sama besar
      // di zoom 60% maupun di 300%.
      aturZoom(zoomLiveRef.current * Math.exp(-e.deltaY / 180));
    };

    let cubit: { jarak: number; zoom: number } | null = null;
    const jarak2 = (t: TouchList) =>
      Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const onStart = (e: TouchEvent) => {
      cubit = e.touches.length === 2 ? { jarak: jarak2(e.touches), zoom: zoomLiveRef.current } : null;
    };
    const onMove = (e: TouchEvent) => {
      if (!cubit || e.touches.length !== 2) return;
      e.preventDefault(); // jangan sampai jadi gulir/zoom bawaan halaman
      const j = jarak2(e.touches);
      if (cubit.jarak > 0) aturZoom(cubit.zoom * (j / cubit.jarak));
    };
    const onEnd = (e: TouchEvent) => { if (e.touches.length < 2) cubit = null; };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: true });
    el.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, [aturZoom]);

  /* ── render halaman ke bitmap (dengan cache) ───────────────────────────── */
  const gambarCap = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // Cap air dibakar ke dalam bitmap halaman, bukan ditempel sebagai lapisan
    // HTML: begitu halaman dibalik/di-flip, capnya ikut apa adanya — dan
    // "Simpan gambar" pun tetap membawa nama pembelinya.
    const teks = `${capRef.current}   ·   ${capRef.current}   ·   ${capRef.current}`;
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = "#0f172a";
    ctx.font = `bold ${Math.max(11, Math.round(h * 0.016))}px system-ui, sans-serif`;
    ctx.translate(w / 2, h / 2);
    ctx.rotate((-28 * Math.PI) / 180);
    const langkah = Math.max(28, Math.round(h * 0.11));
    for (let i = -4; i <= 4; i++) ctx.fillText(teks, -w * 0.7, i * langkah);
    ctx.restore();
  }, []);

  const siapkan = useCallback((n: number): Promise<Bitmap | null> => {
    const d = docRef.current;
    // skalaRef masih 0 = ukuran halaman belum dihitung. Merender di sini cuma
    // menghasilkan canvas 0x0 yang langsung dibuang begitu skalanya ketemu.
    if (!d || n < 1 || n > d.numPages || skalaRef.current <= 0) return Promise.resolve(null);
    const ada = bitmapRef.current.get(n);
    if (ada) return Promise.resolve(ada);
    const antre = antreRef.current.get(n);
    if (antre) return antre;

    const gen = generasi;
    const tugas = (async (): Promise<Bitmap | null> => {
      try {
        const p = await d.getPage(n);
        const viewport = p.getViewport({ scale: skalaRef.current });
        const dpr = Math.min(window.devicePixelRatio || 1, DPR_MAX);
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, viewport.width, viewport.height);
        // Tiap halaman punya canvas SENDIRI, jadi tak ada lagi "Cannot use the
        // same canvas during multiple render operations" seperti versi lama —
        // itu dulu memaksa semua render antre di satu rantai promise.
        await p.render({ canvasContext: ctx, viewport }).promise;
        gambarCap(ctx, viewport.width, viewport.height);
        const bm: Bitmap = { canvas, w: Math.floor(viewport.width), h: Math.floor(viewport.height) };
        // Hasil generasi lama (skala sudah berubah) dibuang, bukan disimpan —
        // dibandingkan lewat ref, karena `generasi` di closure ini nilainya
        // ikut membeku waktu render dimulai dan selalu sama dengan `gen`.
        if (gen !== generasiRef.current) return bm;
        bitmapRef.current.set(n, bm);
        if (bitmapRef.current.size > CACHE_MAX) {
          const kunciTerlama = bitmapRef.current.keys().next().value;
          if (kunciTerlama !== undefined) bitmapRef.current.delete(kunciTerlama);
        }
        return bm;
      } catch {
        return null;
      } finally {
        antreRef.current.delete(n);
      }
    })();
    antreRef.current.set(n, tugas);
    return tugas;
  }, [generasi, gambarCap]);

  /** Salin bitmap ke canvas yang tampak. drawImage = blit, jauh lebih murah dari render ulang. */
  const pasang = useCallback((target: HTMLCanvasElement | null, bm: Bitmap | null) => {
    if (!target) return;
    // Slot kosong (sisi kiri sampul) disembunyikan, bukan dikosongkan: canvas
    // 0x0 yang tetap dipaksa selebar halaman lewat CSS masih menggambar
    // bayangannya, jadi terlihat seperti halaman putih yang gagal dimuat.
    if (!bm) { target.style.visibility = "hidden"; return; }
    target.style.visibility = "visible";
    if (target.width !== bm.canvas.width || target.height !== bm.canvas.height) {
      target.width = bm.canvas.width;
      target.height = bm.canvas.height;
    }
    target.style.width = `${bm.w}px`;
    target.style.height = `${bm.h}px`;
    const ctx = target.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, target.width, target.height);
    ctx.drawImage(bm.canvas, 0, 0);
  }, []);

  /* Bentangan yang sedang tampak → slot kiri & kanan. Waktu animasi berjalan,
     slot diisi oleh rutin animasinya sendiri (isi lama vs baru beda sisi). */
  useEffect(() => {
    if (!doc || balik || !ukuran) return;
    let hidup = true;
    (async () => {
      const [bmKiri, bmKanan] = await Promise.all([
        tampil.kiri ? siapkan(tampil.kiri) : Promise.resolve(null),
        tampil.kanan ? siapkan(tampil.kanan) : Promise.resolve(null),
      ]);
      if (!hidup) return;
      pasang(kiriRef.current, bmKiri);
      pasang(kananRef.current, bmKanan);
    })();
    return () => { hidup = false; };
  }, [doc, tampil, siapkan, pasang, balik, generasi, ukuran]);

  /* Halaman berikut & sebelumnya digambar duluan waktu browser senggang —
     inilah yang bikin membalik halaman terasa instan, bukan menunggu render. */
  useEffect(() => {
    if (!doc || !ukuran) return;
    const akhir = tampil.kanan ?? tampil.kiri ?? 1;
    const awal = tampil.kiri ?? tampil.kanan ?? 1;
    const calon = dua
      ? [akhir + 1, akhir + 2, awal - 1, awal - 2]
      : [akhir + 1, awal - 1];
    let batal = false;
    const jalan = () => { if (!batal) calon.forEach((n) => { void siapkan(n); }); };
    const w = window as any;
    const idle = typeof w.requestIdleCallback === "function";
    const id = idle ? w.requestIdleCallback(jalan, { timeout: 1500 }) : w.setTimeout(jalan, 300);
    return () => {
      batal = true;
      if (idle) w.cancelIdleCallback?.(id);
      else clearTimeout(id);
    };
  }, [doc, tampil, dua, siapkan, ukuran, generasi]);

  useEffect(() => {
    if (doc) localStorage.setItem(halamanKey(purchaseId), String(page));
  }, [page, purchaseId, doc]);

  /* ── membalik halaman ──────────────────────────────────────────────────── */
  const kurangGerak = () =>
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const balikKeRef = useRef<(arah: 1 | -1) => void>(() => {});

  const balikKe = useCallback(async (arah: 1 | -1) => {
    // Siswa yang menahan tombol panah menekan jauh lebih cepat dari animasinya.
    // Permintaan yang datang di tengah animasi TIDAK dibuang begitu saja —
    // yang terakhir disimpan dan langsung dijalankan begitu lembar mendarat,
    // jadi membalik cepat-cepat terasa mengalir, bukan macet.
    if (balikRef.current) { antreBalikRef.current = arah; return; }
    if (!docRef.current || !total) return;
    const kini = bentangan(pageRef.current, total, dua);
    const akhir = kini.kanan ?? kini.kiri ?? 1;
    const awal = kini.kiri ?? kini.kanan ?? 1;
    const tujuan = arah > 0 ? akhir + 1 : awal - 1;
    if (tujuan < 1 || tujuan > total) return;
    const baru = bentangan(tujuan, total, dua);
    const halBaru = awalBentangan(baru);

    // Lembar yang diputar: sisi kanan kalau maju, sisi kiri kalau mundur.
    // Kalau sisi itu memang kosong (mis. mundur dari bentangan 2–3 ke sampul,
    // sisi kirinya tak ada halaman), tak ada kertas yang bisa dibalik.
    const halDaun = dua ? (arah > 0 ? kini.kanan : kini.kiri) : kini.kiri;
    if (kurangGerak() || halDaun == null) { setPage(halBaru); return; }

    balikRef.current = true;

    // Bitmap tujuan disiapkan DULU: menganimasikan halaman kosong lalu
    // mengisinya di tengah jalan justru terlihat seperti reader-nya nge-lag.
    const [bmDaun, bmKiriBaru, bmKananBaru] = await Promise.all([
      siapkan(halDaun),
      baru.kiri ? siapkan(baru.kiri) : Promise.resolve(null),
      baru.kanan ? siapkan(baru.kanan) : Promise.resolve(null),
    ]);

    // Punggung lembar = halaman baru di seberang punggung buku, persis kertas
    // yang dibalik: maju → yang muncul di kiri, mundur → yang muncul di kanan.
    const bmPunggung = dua
      ? (arah > 0 ? bmKiriBaru : bmKananBaru)
      : (bmKiriBaru ?? bmKananBaru);

    // Lembar baru dipasang SESUDAH bitmapnya siap: animasi CSS mulai berjalan
    // begitu elemennya muncul, jadi kalau dipasang duluan yang berputar adalah
    // kertas kosong.
    setBalik({ arah, tujuan: baru });

    // Satu frame supaya elemen flipper sudah terpasang sebelum canvasnya diisi.
    requestAnimationFrame(() => {
      pasang(depanRef.current, bmDaun);
      pasang(belakangRef.current, bmPunggung);
      // Sisi yang TERSINGKAP di balik lembar langsung diisi halaman baru; sisi
      // yang justru akan tertimpa lembar tetap memakai isi lama sampai selesai.
      if (dua) {
        if (arah > 0) pasang(kananRef.current, bmKananBaru);
        else pasang(kiriRef.current, bmKiriBaru);
      } else {
        pasang(kiriRef.current, bmPunggung);
      }
    });

    window.setTimeout(() => {
      balikRef.current = false;
      setBalik(null);
      setPage(halBaru);
      pageRef.current = halBaru;
      const lanjut = antreBalikRef.current;
      antreBalikRef.current = null;
      if (lanjut) requestAnimationFrame(() => balikKeRef.current(lanjut));
    }, DURASI_BALIK);
  }, [total, dua, siapkan, pasang]);

  balikKeRef.current = (arah: 1 | -1) => { void balikKe(arah); };

  const ke = useCallback((n: number) => {
    const hal = awalBentangan(bentangan(n, total, dua));
    setPage(hal);
    pageRef.current = hal;
  }, [total, dua]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Jangan bajak tombol panah waktu siswa sedang mengetik di suatu tempat.
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (e.key === "Escape") { onClose(); return; }
      // ⌘/Ctrl + = − 0 — pintasan zoom yang sudah jadi refleks semua orang.
      if ((e.ctrlKey || e.metaKey) && ["=", "+", "-", "_", "0"].includes(e.key)) {
        e.preventDefault();
        if (e.key === "0") aturZoom(1, true);
        else aturZoom(zoomLiveRef.current + (e.key === "-" || e.key === "_" ? -ZOOM_STEP : ZOOM_STEP), true);
        return;
      }
      // preventDefault: tanpa ini panah & spasi JUGA menggulir wadah halaman,
      // jadi terasa "pindah halamannya nyangkut" padahal cuma ikut tergulir.
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault(); void balikKe(1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp" || e.key === "Backspace") {
        e.preventDefault(); void balikKe(-1);
      } else if (e.key === "Home") {
        e.preventDefault(); ke(1);
      } else if (e.key === "End") {
        e.preventDefault(); ke(total || 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [balikKe, ke, total, onClose, aturZoom]);

  // Layar penuh: dicoba begitu reader terbuka, dilepas lagi saat ditutup.
  useEffect(() => {
    const sudah = !!document.fullscreenElement;
    if (!sudah) {
      void mintaLayarPenuh().then((ok) => { penuhOlehKitaRef.current = ok; });
    }
    const onUbah = () => setLayarPenuh(!!document.fullscreenElement);
    onUbah();
    document.addEventListener("fullscreenchange", onUbah);
    return () => {
      document.removeEventListener("fullscreenchange", onUbah);
      if (penuhOlehKitaRef.current) keluarLayarPenuh();
    };
  }, []);

  const alihLayarPenuh = useCallback(() => {
    if (document.fullscreenElement) { keluarLayarPenuh(); penuhOlehKitaRef.current = false; return; }
    void mintaLayarPenuh().then((ok) => { penuhOlehKitaRef.current = ok; });
  }, []);

  // Kunci gulir latar selama reader terbuka (di HP, halaman di belakang ikut
  // bergeser waktu siswa menggeser halaman modul).
  useEffect(() => {
    const asal = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = asal; };
  }, []);

  const sentuh = useRef<{ x: number; y: number } | null>(null);
  /* Geser jari untuk pindah halaman TETAP berakhir sebagai klik di browser.
     Tanpa penanda ini, tiap kali siswa membalik halaman dengan menggeser, kata
     yang kebetulan ada di bawah jarinya ikut dibunyikan. */
  const abaikanKlikRef = useRef(false);
  const onTouchStart = (e: React.TouchEvent) => {
    // Dua jari = cubitan zoom, bukan geser halaman.
    if (e.touches.length !== 1) { sentuh.current = null; return; }
    sentuh.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const a = sentuh.current;
    if (!a) return;
    if (e.touches.length > 0) { sentuh.current = null; return; }
    const dx = e.changedTouches[0].clientX - a.x;
    const dy = e.changedTouches[0].clientY - a.y;
    // Geser mendatar yang tegas saja — kalau tidak, gulir vertikal ikut
    // terbaca sebagai pindah halaman waktu membaca halaman yang di-zoom.
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      abaikanKlikRef.current = true;
      void balikKe(dx < 0 ? 1 : -1);
    }
    sentuh.current = null;
  };

  const t = useT(); // [ui-lang-switcher-v1]
  /** Selisih antara zoom yang dipegang jari dan zoom yang sudah diraster. */
  const faktorZoom = zoom > 0 ? +(zoomLive / zoom).toFixed(4) : 1;
  const pw = ukuran?.w ?? 0;
  const ph = ukuran?.h ?? 0;
  const lebarBuku = dua ? pw * 2 + GAP : pw;
  // Bentangan yang cuma berisi satu halaman (sampul, atau halaman terakhir yang
  // ganjil) digeser ke tengah layar — kalau tidak, halamannya duduk melenceng ke
  // kanan dengan lubang selebar satu halaman di sebelahnya. Lebar kotak bukunya
  // sendiri sengaja TIDAK diubah: geometri lembar yang berputar harus tetap.
  // Waktu membalik, geseran memakai bentangan TUJUAN supaya bukunya "membuka"
  // berbarengan dengan kertasnya, bukan menyentak setelah animasi selesai.
  const untukGeser = balik?.tujuan ?? tampil;
  const geser = !dua || (untukGeser.kiri && untukGeser.kanan)
    ? 0
    : (untukGeser.kiri ? 1 : -1) * ((pw + GAP) / 2);
  const halPertama = tampil.kiri ?? tampil.kanan ?? 1;
  const nomor = total
    ? (tampil.kiri && tampil.kanan ? `${tampil.kiri}–${tampil.kanan} / ${total}` : `${halPertama} / ${total}`)
    : "—";

  /* ── ketuk kata → pelafalannya ─────────────────────────────────────────
     [ebook-tts-ketuk-kata-v1] Bahasa modul: kolom `language` dulu, judul
     belakangan. Tak terbaca = fitur ini diam sepenuhnya — kata Spanyol yang
     dilafalkan dengan fonem bahasa lain lebih merusak daripada tak ada suara. */
  const kodeBahasa = useMemo(() => kodeBahasaEbook(language, title), [language, title]);
  const ttsAktif = bisaDibunyikan(kodeBahasa);

  const ambilTeks = useCallback(async (n: number): Promise<ItemTeks[]> => {
    const ada = teksRef.current.get(n);
    if (ada) return ada;
    const d = docRef.current;
    const pdfjs = pdfjsRef.current;
    if (!d || !pdfjs || n < 1 || n > d.numPages) return [];
    try {
      const hal = await d.getPage(n);
      // Skala 1: koordinatnya jadi satuan halaman, jadi tetap sahih waktu siswa
      // mencubit — tinggal dikalikan skala yang sedang berlaku.
      const vp = hal.getViewport({ scale: 1 });
      const tc = await hal.getTextContent();
      const items: ItemTeks[] = [];
      for (const it of tc.items as any[]) {
        const str = typeof it.str === "string" ? it.str : "";
        if (!str.trim() || !it.transform) continue;
        const tx = pdfjs.Util.transform(vp.transform, it.transform);
        const h = Math.hypot(tx[2], tx[3]);
        if (!h) continue;
        items.push({ str, x: tx[4], y: tx[5] - h, w: it.width || 0, h });
      }
      teksRef.current.set(n, items);
      return items;
    } catch {
      return []; // modul hasil pindaian (tanpa lapisan teks) — ketukan diabaikan
    }
  }, []);

  /** Kata pada posisi x (satuan halaman) di dalam satu potongan teks. */
  const kataDi = useCallback((it: ItemTeks, x: number) => {
    const ctx = ukurCtx();
    if (!ctx) return null;
    const huruf = Array.from(it.str);
    ctx.font = `${Math.max(4, it.h)}px sans-serif`;
    const lebarUkur = ctx.measureText(it.str).width;
    if (!lebarUkur) return null;
    const f = (it.w || lebarUkur) / lebarUkur;
    const batas = [0];
    let acc = 0;
    for (const ch of huruf) { acc += ctx.measureText(ch).width; batas.push(acc * f); }
    const lokal = x - it.x;
    let i = huruf.findIndex((_, k) => lokal >= batas[k] && lokal < batas[k + 1]);
    if (i < 0) i = lokal < 0 ? 0 : huruf.length - 1;
    if (!HURUF.test(huruf[i])) return null; // yang diketuk spasi/tanda baca
    let a = i;
    let b = i;
    while (a > 0 && HURUF.test(huruf[a - 1])) a--;
    while (b < huruf.length - 1 && HURUF.test(huruf[b + 1])) b++;
    return { kata: huruf.slice(a, b + 1).join(""), x: it.x + batas[a], w: batas[b + 1] - batas[a] };
  }, []);

  const onKlikTeks = useCallback(async (e: React.MouseEvent<HTMLDivElement>) => {
    if (abaikanKlikRef.current) { abaikanKlikRef.current = false; return; }
    if (!ttsAktif || !kodeBahasa || balik || !ukuran || skalaTampil <= 0) return;
    bukaKunciAudio(); // masih di dalam gerakan pengguna — lihat catatan di ebookTts
    const box = e.currentTarget.getBoundingClientRect();
    if (!box.height || !ph) return;
    // Kotak buku bisa sedang diskalakan CSS (cubitan belum diraster ulang), jadi
    // ketukan dinormalkan dulu ke ukuran halaman yang sebenarnya. Pembaginya
    // TINGGI, bukan lebar: tinggi tak pernah ikut digencet flex, jadi angkanya
    // sahih walau tata letaknya berubah.
    const tampak = box.height / ph;
    const fx = (e.clientX - box.left) / tampak;
    const fy = (e.clientY - box.top) / tampak;

    let hal = tampil.kiri ?? tampil.kanan;
    let xh = fx;
    if (dua) {
      if (fx > pw + GAP / 2) { hal = tampil.kanan; xh = fx - pw - GAP; }
      else hal = tampil.kiri;
    }
    if (!hal) return;

    const items = await ambilTeks(hal);
    const xp = xh / skalaTampil;
    const yp = fy / skalaTampil;
    const kena = items.find(
      (it) => xp >= it.x - 1 && xp <= it.x + it.w + 1 && yp >= it.y - 1 && yp <= it.y + it.h + 1
    );
    const kata = kena ? kataDi(kena, xp) : null;
    if (!kena || !kata) { setUcap(null); return; }

    const kalimat = kena.str.trim();
    // Baris terjemahan Indonesia duduk persis di bawah kalimat bahasa targetnya;
    // membunyikannya dengan suara Spanyol justru yang paling tidak boleh ditiru
    // siswa A1. Ketukannya tetap ditandai supaya tak terasa seperti tombol rusak.
    const terjemahan = barisTerjemahan(kalimat, kodeBahasa);
    const kiriSlot = dua && hal === tampil.kanan ? pw + GAP : 0;
    setUcap({
      hal,
      kata: kata.kata,
      kalimat,
      x: kiriSlot + kata.x * skalaTampil,
      y: kena.y * skalaTampil,
      w: Math.max(6, kata.w * skalaTampil),
      h: kena.h * skalaTampil,
      terjemahan,
    });
    if (terjemahan) return;
    setBunyi("kata");
    await ucapkanEbook(kata.kata, kodeBahasa);
    setBunyi(null);
  }, [ttsAktif, kodeBahasa, balik, ukuran, skalaTampil, lebarBuku, ph, pw, dua, tampil, ambilTeks, kataDi]);

  const ucapkanLagi = useCallback(async (teks: string, jenis: "kata" | "kalimat") => {
    if (!kodeBahasa) return;
    bukaKunciAudio();
    setBunyi(jenis);
    await ucapkanEbook(teks, kodeBahasa);
    setBunyi(null);
  }, [kodeBahasa]);

  // Pindah halaman / ganti tata letak → sorotan kata ikut hilang.
  useEffect(() => { setUcap(null); hentikanEbookTts(); }, [page, dua]);

  const isi = (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900/95 backdrop-blur-sm">
      {/* bilah atas */}
      <div className="flex shrink-0 items-center gap-3 border-b border-white/10 px-3 py-2.5 sm:px-5">
        <BookOpen className="h-5 w-5 shrink-0 text-[#3ED9C0]" />
        <h2 className="min-w-0 flex-1 truncate text-[14px] font-bold text-white sm:text-[15px]">{title}</h2>
        <div className="hidden items-center gap-1 sm:flex">
          {muatDua && (
            <button
              onClick={() => setDuaManual((v) => !(v ?? true))}
              className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label={dua ? t("Satu halaman") : t("Dua halaman")}
              title={dua ? t("Satu halaman") : t("Dua halaman")}
            >
              {dua ? <Square className="h-4 w-4" /> : <Columns2 className="h-4 w-4" />}
            </button>
          )}
          <button
            onClick={() => aturZoom(zoomLiveRef.current - ZOOM_STEP, true)}
            className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label={t("Perkecil")}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-12 text-center text-[12px] font-bold text-white/70">{Math.round(zoomLive * 100)}%</span>
          <button
            onClick={() => aturZoom(zoomLiveRef.current + ZOOM_STEP, true)}
            className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label={t("Perbesar")}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <button
          onClick={alihLayarPenuh}
          className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
          aria-label={layarPenuh ? t("Keluar layar penuh") : t("Layar penuh")}
          title={layarPenuh ? t("Keluar layar penuh") : t("Layar penuh")}
        >
          {layarPenuh ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
          aria-label={t("Tutup")}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* halaman */}
      <div
        ref={wadahRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="relative flex flex-1 overflow-auto p-4"
      >
        {memuat && (
          <div className="m-auto text-center">
            <Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin text-[#3ED9C0]" />
            <p className="text-[13px] font-semibold text-white/60">{t("Menyiapkan modul…")}</p>
          </div>
        )}

        {galat && !memuat && (
          <div className="m-auto max-w-sm px-6 text-center">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-amber-400" />
            <p className="text-[14px] font-bold text-white">{galat}</p>
            <button
              onClick={onClose}
              className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-[13px] font-bold text-white transition hover:bg-white/20"
            >
              {t("Tutup")}
            </button>
          </div>
        )}

        {/* m-auto (bukan justify-center): waktu bentangan lebih besar dari wadah
            — zoom > 100% — margin auto tetap menyisakan sisi kiri/atas yang
            bisa digulir, sementara justify-center memotongnya. */}
        {!galat && !memuat && ukuran && (
          <div
            /* shrink-0 itu WAJIB: kotak buku ini anak flex, dan waktu zoom > 100%
               lebarnya (mis. 2310px) digencet flex jadi selebar wadah (1408px).
               Dua akibatnya: halaman kanan yang menjulur TIDAK bisa digulir untuk
               dilihat, dan koordinat ketukan meleset sampai 1,6x — kata yang
               diketuk tak pernah ketemu, jadi pelafalannya terlihat "mati". */
            className="ebook-buku relative m-auto shrink-0"
            style={{
              width: lebarBuku,
              height: ph,
              // [ebook-zoom-cubit-v1] Selama cubitan berjalan, bukunya diskalakan
              // CSS dulu (faktor ≠ 1) supaya mengikuti jari; begitu gerakannya
              // berhenti halaman diraster ulang dan faktornya kembali 1.
              transform: `translateX(${geser}px) scale(${faktorZoom})`,
              // Transisi dimatikan selama cubitan: dengan transisi, skalanya
              // selalu tertinggal beberapa ratus milidetik di belakang jari.
              transition: faktorZoom === 1
                ? `transform ${DURASI_BALIK}ms cubic-bezier(0.42, 0.02, 0.32, 1)`
                : "none",
              cursor: ttsAktif ? "pointer" : undefined,
            }}
            onContextMenu={(e) => e.preventDefault()}
            onClick={(e) => void onKlikTeks(e)}
          >
            {/* Menu klik-kanan dimatikan: "Simpan gambar" di atas canvas adalah
                jalan pintas paling gampang untuk memanen halaman satu per satu. */}
            <canvas
              ref={kiriRef}
              className="ebook-hal absolute left-0 top-0 bg-white"
              style={{ width: pw, height: ph, borderRadius: dua ? "8px 2px 2px 8px" : 8 }}
            />
            {dua && (
              <canvas
                ref={kananRef}
                className="ebook-hal absolute top-0 bg-white"
                style={{ left: pw + GAP, width: pw, height: ph, borderRadius: "2px 8px 8px 2px" }}
              />
            )}
            {/* punggung buku */}
            {dua && (
              <div
                aria-hidden
                className="pointer-events-none absolute top-0 h-full"
                style={{
                  left: pw - 10,
                  width: 20 + GAP,
                  background:
                    "linear-gradient(90deg, rgba(15,23,42,0) 0%, rgba(15,23,42,0.16) 45%, rgba(15,23,42,0.22) 50%, rgba(15,23,42,0.16) 55%, rgba(15,23,42,0) 100%)",
                }}
              />
            )}

            {/* lembar yang sedang dibalik */}
            {balik && (
              <div
                className={`ebook-flipper ${balik.arah > 0 ? "maju" : "mundur"}`}
                style={{
                  left: dua && balik.arah > 0 ? pw + GAP : 0,
                  width: pw,
                  height: ph,
                  transformOrigin: balik.arah > 0 ? "left center" : "right center",
                  animationDuration: `${DURASI_BALIK}ms`,
                  "--ebook-durasi": `${DURASI_BALIK}ms`,
                } as React.CSSProperties}
              >
                <div className="ebook-muka">
                  <canvas ref={depanRef} className="ebook-hal bg-white" style={{ width: pw, height: ph }} />
                  <div className="ebook-bayang" />
                </div>
                <div className="ebook-muka ebook-punggung">
                  <canvas ref={belakangRef} className="ebook-hal bg-white" style={{ width: pw, height: ph }} />
                  <div className="ebook-bayang balik" />
                </div>
              </div>
            )}

            {/* [ebook-tts-ketuk-kata-v1] sorotan kata yang diketuk + gelembung
                pelafalan. Wadahnya pointer-events-none supaya ketukan berikutnya
                tetap mendarat di halaman, bukan tertahan lapisan ini. */}
            {ucap && !balik && (ucap.hal === tampil.kiri || ucap.hal === tampil.kanan) && (
              <div className="pointer-events-none absolute inset-0 z-10">
                <span
                  className="absolute rounded-[3px]"
                  style={{
                    left: ucap.x - 2,
                    top: ucap.y - 1,
                    width: ucap.w + 4,
                    height: ucap.h + 2,
                    background: ucap.terjemahan ? "rgba(148,163,184,0.30)" : "rgba(62,217,192,0.34)",
                    boxShadow: ucap.terjemahan ? "none" : "0 0 0 1px rgba(26,158,158,0.6)",
                  }}
                />
                <div
                  className="pointer-events-auto absolute flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-xl bg-slate-900/95 px-2 py-1.5 text-[12px] font-bold text-white shadow-xl ring-1 ring-white/15"
                  style={{
                    left: Math.min(Math.max(ucap.x + ucap.w / 2, 100), Math.max(100, lebarBuku - 100)),
                    // Kalau kata itu ada di baris paling atas halaman, gelembungnya
                    // ditaruh di BAWAH — di atas berarti keluar dari kertas.
                    top: ucap.y - ucap.h - 18 > 0 ? ucap.y - ucap.h - 18 : ucap.y + ucap.h + 8,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {ucap.terjemahan ? (
                    <span className="font-semibold text-white/70">
                      {t("Yang bisa dibunyikan hanya teks")} {langLabel(kodeBahasa)}
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => void ucapkanLagi(ucap.kata, "kata")}
                        className="flex items-center gap-1.5 rounded-lg px-1.5 py-0.5 transition hover:bg-white/10"
                      >
                        {bunyi === "kata"
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[#3ED9C0]" />
                          : <Volume2 className="h-3.5 w-3.5 text-[#3ED9C0]" />}
                        <span className="max-w-[180px] truncate">{ucap.kata}</span>
                      </button>
                      {ucap.kalimat && ucap.kalimat !== ucap.kata && (
                        <button
                          onClick={() => void ucapkanLagi(ucap.kalimat, "kalimat")}
                          className="flex items-center gap-1.5 rounded-lg border-l border-white/15 pl-2 pr-1.5 py-0.5 text-white/75 transition hover:bg-white/10 hover:text-white"
                        >
                          {bunyi === "kalimat"
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Volume2 className="h-3.5 w-3.5" />}
                          {t("Kalimat")}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* bilah bawah */}
      {!galat && (
        <div className="relative flex shrink-0 items-center justify-center gap-3 border-t border-white/10 px-4 py-2.5">
          <button
            onClick={() => void balikKe(-1)}
            disabled={halPertama <= 1}
            className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
            aria-label={t("Halaman sebelumnya")}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-[13px] font-bold text-white/80">{nomor}</span>
          {/* Petunjuk ditaruh absolut, bukan ikut arus: kalau ikut, nomor halaman
              & panahnya tergeser dari tengah. */}
          {ttsAktif && (
            <span className="absolute right-4 hidden items-center gap-1.5 text-[12px] font-semibold text-white/45 lg:flex">
              <Volume2 className="h-3.5 w-3.5" />
              {t("Ketuk kata untuk mendengar pelafalannya")}
            </span>
          )}
          <button
            onClick={() => void balikKe(1)}
            disabled={!total || (tampil.kanan ?? tampil.kiri ?? 1) >= total}
            className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
            aria-label={t("Halaman berikutnya")}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      <style jsx global>{`
        /* Perspektif dipasang di wadah bukunya, bukan di lembarnya: kalau di
           lembar, tiap halaman punya titik pandang sendiri dan putarannya
           terlihat datar seperti kartu, bukan seperti kertas dibuka. */
        .ebook-buku {
          perspective: 2400px;
          perspective-origin: center center;
        }
        .ebook-hal {
          display: block;
          box-shadow: 0 18px 40px -12px rgba(0, 0, 0, 0.55);
        }
        .ebook-flipper {
          position: absolute;
          top: 0;
          transform-style: preserve-3d;
          animation-timing-function: cubic-bezier(0.42, 0.02, 0.32, 1);
          animation-fill-mode: forwards;
          will-change: transform;
          z-index: 5;
        }
        .ebook-flipper.maju { animation-name: ebook-maju; }
        .ebook-flipper.mundur { animation-name: ebook-mundur; }
        .ebook-muka {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .ebook-punggung { transform: rotateY(180deg); }
        /* Bayangan yang menyapu permukaan kertas saat sudutnya berubah —
           tanpa ini putarannya terlihat seperti gambar yang diputar. */
        .ebook-bayang {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(90deg, rgba(15, 23, 42, 0.35) 0%, rgba(15, 23, 42, 0) 42%);
          opacity: 0;
          animation: ebook-bayang-sapu var(--ebook-durasi, 620ms) cubic-bezier(0.42, 0.02, 0.32, 1) forwards;
        }
        .ebook-bayang.balik {
          background: linear-gradient(270deg, rgba(15, 23, 42, 0.35) 0%, rgba(15, 23, 42, 0) 42%);
        }
        @keyframes ebook-maju {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(-180deg); }
        }
        @keyframes ebook-mundur {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(180deg); }
        }
        @keyframes ebook-bayang-sapu {
          0% { opacity: 0; }
          50% { opacity: 0.9; }
          100% { opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ebook-flipper, .ebook-bayang { animation: none !important; }
        }
      `}</style>
    </div>
  );

  // Portal ke body: kartu perpustakaan berada di dalam wadah ber-overflow,
  // reader fullscreen tidak boleh ikut terpotong olehnya.
  return typeof document !== "undefined" ? createPortal(isi, document.body) : null;
}
