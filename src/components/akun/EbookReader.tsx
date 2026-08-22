"use client";

// [ebook-reader-v1] Pembaca e-book di dalam dashboard siswa.
//
// Sebelumnya modul cuma bisa DIUNDUH: siswa keluar dashboard, berkasnya
// mendarat di folder unduhan dan bebas diteruskan ke siapa pun, dan kita tidak
// pernah tahu ada yang membacanya atau tidak. Reader ini membalik semua itu —
// halaman dirender di sini dan berkasnya tidak pernah jadi URL yang bisa
// disalin (lihat src/app/api/ebook/route.ts).
//
// Soal proteksi, jujur saja: ini friksi, bukan DRM. Tangkapan layar tetap bisa
// dan byte PDF-nya ada di memori browser. Cap nama+email yang dulu dibakar ke
// tiap halaman DICABUT 20 Agu 2026: yang paling terganggu justru pembeli
// sahnya — capnya melintang persis di atas kalimat yang sedang dibaca —
// sementara yang berniat menyebarkan modul toh tinggal memotretnya.
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

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { tr, useT } from "@/lib/uiLang"; // [ui-lang-switcher-v1]
import {
  ChevronLeft, ChevronRight, Loader2, Minus, Plus, X, BookOpen, AlertCircle,
  Columns2, Square, Maximize2, Minimize2, Volume2, List, Play, CornerDownLeft, Scan,
  ChevronDown, Eye, EyeOff, PenLine, HelpCircle,
} from "lucide-react";
import EbookLatihan, { type BerkasLatihan, type UnitLatihan } from "./EbookLatihan";
// [ebook-panduan-tour-v1]
import EbookPanduan, { type LangkahPanduan } from "./EbookPanduan";
// [ebook-tts-ketuk-kata-v1]
import {
  bisaDibunyikan, kodeBahasaEbook, kataIndonesia, kalimatTarget, ucapkanEbook,
  hentikanEbookTts, bukaKunciAudio, siapkanEbook,
} from "@/lib/ebookTts";
// [ebook-popup-kata-v1]
import { artiKataEbook, artiTersimpan, type HasilArti } from "@/lib/ebookKata";
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
const GAP = 0; // bentangan menempel — celah apa pun tampak sebagai garis hitam di tengah buku
/** Lebar minimum wadah sebelum tampilan dua halaman masuk akal. */
const LEBAR_DUA_HALAMAN = 760;
/** Lama animasi balik halaman. Lebih dari ini terasa lambat, kurang jadi kedip. */
const DURASI_BALIK = 620;
/** Halaman yang bitmap-nya disimpan. 40 halaman sekaligus terlalu boros memori. */
const CACHE_MAX = 10;

/* [ebook-swipe-halaman-v1] Seberapa jauh geseran mendatar dianggap perintah
   pindah halaman. Roda/trackpad memakai jumlah deltaX satu ayunan; seretan
   tetikus memakai jarak kursor. */
const SWIPE_RODA = 90;
const SWIPE_SERET = 70;
/** Jeda tanpa gerakan yang menandai satu ayunan trackpad sudah selesai —
    momentum trackpad Mac masih menembakkan puluhan `wheel` setelah jarinya
    diangkat, dan tanpa kunci ini satu ayunan bisa melompat 5 halaman. */
const SWIPE_RESET = 320;

const halamanKey = (purchaseId: string) => `ebook-hal:${purchaseId}`;

/* [ebook-panduan-tour-v1] Panduan itu milik ORANGNYA, bukan milik modulnya:
   siswa yang sudah paham cara pakai reader tidak perlu diajari lagi waktu
   membuka e-book kedua. Karena itu kuncinya tanpa purchaseId. */
const PANDUAN_KEY = "ebook-panduan-v1";
const TUR_LATIHAN_KEY = "ebook-panduan-latihan-v1";

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

/* [ebook-layar-penuh-milik-kita-v1] Penanda tingkat MODUL, bukan state reader:
   layar penuh yang menyala itu KITA yang minta?

   Kenapa tidak cukup ref di dalam reader: permintaannya lahir di handler klik
   "Baca" (izin fullscreen menempel pada gerakan pengguna), lalu reader baru
   dipasang beberapa ratus milidetik kemudian. Waktu effect mount-nya jalan,
   layar SUDAH penuh — reader lama menyimpulkan "berarti ini punya siswa, jangan
   diutak-atik", jadi menutup reader tidak melepas layar penuh dan siswa
   mendarat di dashboard tanpa bilah tab & alamat browser. Penanda modul ini
   dipegang bersama oleh keduanya, jadi urutan siapa duluan tak lagi penting.

   Tetap false kalau siswa yang menyalakan sendiri lewat F11 — itu di luar
   Fullscreen API dan memang bukan milik kita. */
let layarPenuhMilikKita = false;

export function mintaLayarPenuh(): Promise<boolean> {
  if (typeof document === "undefined") return Promise.resolve(false);
  if (document.fullscreenElement) return Promise.resolve(layarPenuhMilikKita);
  const el = document.documentElement as ElPenuh;
  const minta = el.requestFullscreen?.bind(el) ?? el.webkitRequestFullscreen?.bind(el);
  if (!minta) return Promise.resolve(false);
  try {
    return Promise.resolve(minta())
      .then(() => { layarPenuhMilikKita = true; return true; })
      .catch(() => false);
  } catch {
    return Promise.resolve(false);
  }
}

function keluarLayarPenuh(): void {
  layarPenuhMilikKita = false;
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
   dalam satu sesi tidak perlu menunggu jaringan lagi. Cuma DUA entri — satu
   modul ~1 MB dan tak ada gunanya menimbun banyak. */
const bufCache = new Map<string, ArrayBuffer>();
/* [ebook-buka-instan-v1] Permintaan yang SEDANG jalan, supaya prefetch (waktu
   kursor menyentuh kartu) dan pembukaan reader beberapa ratus milidetik
   kemudian memakai satu unduhan yang sama, bukan dua. */
const bufAntre = new Map<string, Promise<ArrayBuffer>>();

const simpanBuf = (id: string, buf: ArrayBuffer) => {
  bufCache.set(id, buf);
  while (bufCache.size > 2) {
    const tertua = bufCache.keys().next().value as string | undefined;
    if (tertua === undefined) break;
    bufCache.delete(tertua);
  }
};

/* ── simpanan modul di perangkat ───────────────────────────────────────────
   [ebook-buka-cepat-v3] Modul 3,5–5,5 MB dulu diunduh ULANG tiap kali tab
   dimuat: simpanannya cuma di memori halaman, jadi refresh sekali saja sudah
   membuang semuanya. Sekarang bytenya dititipkan ke Cache Storage — buka modul
   yang sama besok pagi tidak menyentuh jaringan sama sekali, bahkan tidak
   membangunkan fungsi serverless kita.

   Kenapa aman-aman saja: bytenya cuma mendarat di perangkat siswa yang MEMANG
   berhak (pemeriksaan hak tetap di server, sebelum alamatnya diberikan), dan
   isinya sama persis dengan berkas yang boleh dia unduh. */
const CACHE_MODUL = "ebook-modul-v1";
/** Berapa modul yang boleh menumpuk di perangkat. */
const CACHE_MODUL_MAX = 3;
/** Selang pemeriksaan "modulnya sudah terbit ulang belum?" */
const CACHE_SEGAR_MS = 12 * 60 * 60 * 1000;

const kunciModul = (id: string) => `https://ebook.linguo.id/modul/${encodeURIComponent(id)}`;

async function laciModul(): Promise<Cache | null> {
  // Safari mode pribadi & halaman non-HTTPS tak punya Cache Storage — di situ
  // readernya cuma kembali ke perilaku lama, bukan gagal.
  if (typeof caches === "undefined") return null;
  try { return await caches.open(CACHE_MODUL); } catch { return null; }
}

type SimpananModul = { buf: ArrayBuffer; versi: string | null; waktu: number };

async function dariLaci(id: string): Promise<SimpananModul | null> {
  const laci = await laciModul();
  if (!laci) return null;
  try {
    const res = await laci.match(kunciModul(id));
    if (!res) return null;
    const buf = await res.arrayBuffer();
    if (!buf.byteLength) return null;
    return { buf, versi: res.headers.get("x-versi") || null, waktu: Number(res.headers.get("x-waktu")) || 0 };
  } catch { return null; }
}

async function keLaci(id: string, buf: ArrayBuffer, versi: string | null) {
  const laci = await laciModul();
  if (!laci) return;
  try {
    await laci.put(
      kunciModul(id),
      new Response(buf.slice(0), {
        headers: {
          "Content-Type": "application/pdf",
          "X-Versi": versi ?? "",
          "X-Waktu": String(Date.now()),
        },
      }),
    );
    // Sisakan yang terbaru saja: satu siswa bisa punya belasan modul dan kuota
    // penyimpanan browser bukan milik kita sendiri.
    const kunci = await laci.keys();
    if (kunci.length <= CACHE_MODUL_MAX) return;
    const umur = await Promise.all(
      kunci.map(async (k) => ({ k, w: Number((await laci.match(k))?.headers.get("x-waktu")) || 0 })),
    );
    umur.sort((a, b) => b.w - a.w);
    await Promise.all(umur.slice(CACHE_MODUL_MAX).map(({ k }) => laci.delete(k)));
  } catch { /* kuota penuh / mode pribadi — simpanan memang cuma bonus */ }
}

/* [ebook-buka-cepat-v3] Alamat bertanda tangan + versi berkasnya. Satu
   permintaan ini melayani PDF sekaligus berkas soal, dan hasilnya dipakai ulang
   selama tanda tangannya belum kedaluwarsa — prefetch waktu kursor menyentuh
   kartu dan pembukaan reader beberapa detik kemudian cukup sekali membangunkan
   fungsi serverless. */
type MetaModul = {
  /** Alamat CDN Supabase — untuk menarik berkas UTUH ke simpanan perangkat. */
  url: string;
  /** Alamat di domain sendiri — untuk pdf.js, yang menariknya potong demi potong. */
  urlPotong: string | null;
  urlSoal: string | null;
  versi: string | null;
  kedaluwarsa: number;
};
const metaCache = new Map<string, MetaModul>();
const metaAntre = new Map<string, Promise<MetaModul>>();

function ambilMeta(purchaseId: string, accessToken: string): Promise<MetaModul> {
  const ada = metaCache.get(purchaseId);
  // Sisa 30 detik: cukup untuk menyelesaikan unduhan yang baru mau berangkat.
  if (ada && ada.kedaluwarsa - 30_000 > Date.now()) return Promise.resolve(ada);
  const jalan = metaAntre.get(purchaseId);
  if (jalan) return jalan;
  const janji = (async () => {
    const res = await fetch("/api/ebook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purchaseId, accessToken, bagian: "url" }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || tr("Gagal memuat modul"));
    }
    const j = await res.json();
    if (!j?.url) throw new Error(tr("Gagal memuat modul"));
    const meta: MetaModul = {
      url: String(j.url),
      urlPotong: j.urlPotong ? String(j.urlPotong) : null,
      urlSoal: j.urlSoal ? String(j.urlSoal) : null,
      versi: j.versi ? String(j.versi) : null,
      kedaluwarsa: Date.now() + (Number(j.umur) || 300) * 1000,
    };
    metaCache.set(purchaseId, meta);
    return meta;
  })().finally(() => { metaAntre.delete(purchaseId); });
  metaAntre.set(purchaseId, janji);
  return janji;
}

/** Unduh bytenya: langsung dari CDN dulu, jalur proksi sebagai cadangan. */
async function unduhModul(purchaseId: string, accessToken: string): Promise<ArrayBuffer> {
  try {
    const meta = await ambilMeta(purchaseId, accessToken);
    const res = await fetch(meta.url, { cache: "no-store" });
    if (res.ok) {
      const buf = await res.arrayBuffer();
      if (buf.byteLength) {
        void keLaci(purchaseId, buf, meta.versi);
        return buf;
      }
    }
  } catch {
    /* Tanda tangan ditolak, CORS diblokir proxy kantor, atau haknya memang
       tidak ada — jalur proksi di bawah yang memutuskan, sekalian supaya pesan
       galatnya (kedaluwarsa/bukan milikmu) tetap sampai apa adanya. */
  }
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
  void keLaci(purchaseId, buf, null);
  return buf;
}

/** Modul di laci sudah lama → cek diam-diam apakah edisinya sudah diganti.
 *  Yang sedang dibaca TIDAK diusik; salinan barunya dipakai pembukaan berikut. */
async function segarkanLaci(purchaseId: string, accessToken: string, simpanan: SimpananModul) {
  if (Date.now() - simpanan.waktu < CACHE_SEGAR_MS) return;
  try {
    const meta = await ambilMeta(purchaseId, accessToken);
    if (!meta.versi || meta.versi === simpanan.versi) {
      // Isinya masih sama — cap waktunya saja yang disegarkan supaya
      // pemeriksaan ini tidak terulang tiap kali reader dibuka.
      await keLaci(purchaseId, simpanan.buf, simpanan.versi);
      return;
    }
    const res = await fetch(meta.url, { cache: "no-store" });
    if (!res.ok) return;
    const buf = await res.arrayBuffer();
    if (buf.byteLength) await keLaci(purchaseId, buf, meta.versi);
  } catch { /* diam: ini kerja latar, bukan kerja siswa */ }
}

/** Byte yang SUDAH ada di perangkat (memori atau laci) — tanpa jaringan sama
 *  sekali. Dipakai reader untuk memutuskan: buka dari berkas utuh, atau buka
 *  dari potongan sambil berkas utuhnya menyusul. */
async function bufLokal(purchaseId: string): Promise<SimpananModul | null> {
  const ada = bufCache.get(purchaseId);
  if (ada) return { buf: ada, versi: null, waktu: Date.now() };
  return dariLaci(purchaseId);
}

function ambilBerkas(purchaseId: string, accessToken: string): Promise<ArrayBuffer> {
  const ada = bufCache.get(purchaseId);
  if (ada) return Promise.resolve(ada);
  const jalan = bufAntre.get(purchaseId);
  if (jalan) return jalan;
  const janji = (async () => {
    const simpanan = await dariLaci(purchaseId);
    if (simpanan) {
      simpanBuf(purchaseId, simpanan.buf);
      void segarkanLaci(purchaseId, accessToken, simpanan);
      return simpanan.buf;
    }
    const buf = await unduhModul(purchaseId, accessToken);
    simpanBuf(purchaseId, buf);
    return buf;
  })().finally(() => { bufAntre.delete(purchaseId); });
  bufAntre.set(purchaseId, janji);
  return janji;
}

/* [ebook-latihan-interaktif-v1] Berkas soal pendamping modul. Kecil (puluhan
   KB) dan tak berubah selama modulnya tak dirakit ulang, jadi cukup diambil
   sekali per sesi. Gagal = diam: modul pihak ketiga memang tak punya soal. */
const soalCache = new Map<string, BerkasLatihan>();

async function ambilSoal(purchaseId: string, accessToken: string): Promise<BerkasLatihan | null> {
  const ada = soalCache.get(purchaseId);
  if (ada) return ada;
  const simpan = (j: BerkasLatihan | null) => {
    if (!Array.isArray(j?.unit)) return null;
    soalCache.set(purchaseId, j!);
    return j;
  };
  // [ebook-buka-cepat-v3] Alamatnya menumpang permintaan yang sama dengan PDF —
  // tak ada bangun fungsi serverless kedua cuma untuk berkas puluhan KB ini.
  try {
    const meta = await ambilMeta(purchaseId, accessToken);
    if (meta.urlSoal) {
      const res = await fetch(meta.urlSoal, { cache: "no-store" });
      if (res.ok) return simpan((await res.json()) as BerkasLatihan);
    }
  } catch { /* jatuh ke jalur proksi */ }
  try {
    const res = await fetch("/api/ebook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purchaseId, accessToken, bagian: "latihan" }),
    });
    if (!res.ok) return null;
    return simpan((await res.json()) as BerkasLatihan);
  } catch {
    return null;
  }
}

/* [ebook-buka-instan-v1] Dokumen pdf.js yang terakhir dibuka ditahan hidup.
   Mengurai ulang 40 halaman PDF makan ratusan milidetik — itu yang dulu
   membuat layar "Menyiapkan modul…" tetap muncul walau bytenya sudah ada di
   memori. Dengan simpanan ini, membuka modul yang sama = langsung terbaca. */
let docCache: { id: string; doc: PdfDoc } | null = null;

/** Dipanggil Perpustakaan saat kursor/jari menyentuh kartu e-book — begitu
 *  tombolnya benar-benar ditekan, byte modulnya biasanya sudah utuh di memori
 *  sehingga readernya terbuka tanpa layar tunggu. Gagal = diam saja. */
export function prewarmEbookModul(purchaseId: string, accessToken: string) {
  if (typeof window === "undefined" || !purchaseId || !accessToken) return;
  if (docCache?.id === purchaseId || bufCache.has(purchaseId)) return;
  void muatPdfjs().catch(() => {});
  void ambilBerkas(purchaseId, accessToken).catch(() => {});
}

/* [ebook-tts-ketuk-kata-v1] Satu potong teks dari getTextContent(), koordinatnya
   dalam SATUAN HALAMAN (viewport skala 1) supaya tetap sahih waktu di-zoom. */
type ItemTeks = { str: string; x: number; y: number; w: number; h: number };

/* [ebook-tts-kalimat-v1] Satu BARIS halaman: kumpulan potongan yang duduk di
   ketinggian yang sama, diurutkan kiri→kanan.

   Kenapa perlu: pdf.js memecah satu baris jadi beberapa potongan tiap kali
   fontnya berubah — di baris tabel "casa (KA-sa) = rumah", "casa" yang miring
   adalah potongan tersendiri. Tombol "Putar kalimat" yang cuma membunyikan satu
   potongan jadi terdengar seperti mengulang kata yang barusan diketuk. */
type Baris = { teks: string; y: number; h: number; segmen: Segmen[]; fam?: string };

/* Satu "sel" dalam sebuah baris. Baris tabel modul memuat tiga kolom sekaligus
   ("casa | KA-sa | rumah") dan pdf.js melaporkannya sebagai satu baris; tanpa
   pemisahan ini, tombol Putar kalimat membacakan seluruh barisnya — bahasa
   target dan terjemahannya sekalian. Batas kolom dikenali dari JARAK MENDATAR
   antar potongan, bukan dari garis tabelnya (garis tabel bukan teks). */
type Segmen = { teks: string; x0: number; x1: number };
type HalTeks = { items: ItemTeks[]; baris: Baris[] };

/* [ebook-tts-kalimat-v1] Layakkah barisnya dibunyikan sebagai KALIMAT, terpisah
   dari kata yang diketuk? Baris "¿cómo?" cuma katanya sendiri berpakaian tanda
   baca: tombol "Putar kalimat" di situ mengeluarkan bunyi yang sama persis
   dengan tombol katanya, jadi cuma menawarkan pilihan palsu.

   Pembandingnya jumlah KATA sesudah tanda baca dibuang, bukan panjang teks
   mentahnya — sebelumnya cukup "beda dari katanya", dan tanda tanya terbalik
   di depan sudah membuat "¿cómo?" lolos sebagai kalimat. */
const KATA_SAJA = /[^\p{L}\p{N}]+/gu;
function kalimatLayakDibunyikan(kata: string, kalimat: string) {
  const bersih = (s: string) => s.replace(KATA_SAJA, " ").trim().toLowerCase();
  const k = bersih(kalimat);
  if (!k || k === bersih(kata)) return false;
  return k.split(" ").length > 1;
}

/* [ebook-tts-frasa-v1] Sebagian entri modul memang satu SATUAN makna yang
   kebetulan ditulis dua kata: "buenos días", "me llamo", "mucho gusto". Mengetuk
   "buenos" saja mengeluarkan bunyi yang tak pernah dipakai siapa pun — di
   percakapan betulan kata itu tak pernah berdiri sendiri, dan pemenggalannya
   justru mengajarkan jeda yang salah. Jadi sel pendek dibunyikan UTUH.

   Yang dipakai adalah SEL (kolom tabel kosakata), bukan barisnya: kalimat
   dialog delapan kata tetap dibunyikan per kata seperti dulu — di sana justru
   kata tunggal yang dicari siswa.

   Kembalinya "" = tak ada frasa, pakai katanya sendiri. */
const FRASA_MAKS_KATA = 4;
const FRASA_MAKS_HURUF = 34;
/* Kolom "cara baca" ("BUE-nos DI-as") bukan bahasa target — membunyikannya
   utuh cuma menghasilkan ejaan Indonesia berlogat aneh. */
const POLA_CARA_BACA = /\p{Lu}+[-‑]\p{Ll}/u;
function frasaSel(selTeks: string, kata: string): string {
  let s = String(selTeks || "")
    .replace(/\([^)]*\)/g, " ")     // "(KA-sa)" — petunjuk cara baca
    .replace(/[…]+/g, " ")           // "me llamo…" → "me llamo"
    .replace(/^\s*(?:\d{1,3}[.):]|[-–—•·*])\s*/u, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (!s || POLA_CARA_BACA.test(s)) return "";
  // "encantado / encantada" & "él / ella es" itu dua pilihan, bukan satu frasa:
  // yang dibunyikan sisi tempat kata yang diketuk duduk.
  if (s.includes("/")) {
    const sisi = s.split("/").map((x) => x.trim()).filter(Boolean);
    const pilih = sisi.find((x) => new RegExp(`(^|\\P{L})${kata.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|\\P{L})`, "iu").test(x));
    s = pilih || "";
  }
  s = s.replace(/^[^\p{L}\p{N}¿¡]+|[^\p{L}\p{N}?!.]+$/gu, "").trim();
  if (!s || s.length > FRASA_MAKS_HURUF) return "";
  // Kalimat berakhiran titik tetap kalimat — biar tombol "Putar kalimat" yang
  // mengurusnya, jangan diserap jadi "kata".
  if (/[.]$/.test(s)) return "";
  const kataan = s.split(/[^\p{L}\p{N}'’-]+/u).filter(Boolean);
  if (kataan.length < 2 || kataan.length > FRASA_MAKS_KATA) return "";
  // Frasanya wajib memuat kata yang diketuk — kalau tidak, pemenggalan selnya
  // meleset dan siswa akan mendengar sesuatu yang tak ia tunjuk.
  if (!kataan.some((k) => k.toLowerCase() === kata.toLowerCase())) return "";
  return s;
}

/* [ebook-daftar-isi-subunit-v1] Satu bagian DI DALAM bab — "Kosakata unit ini",
   "Catatan", "Latihan", judul kotak tata bahasa. Dipisah dari Bab karena
   pertanyaannya beda: bab menjawab "unit ini di halaman berapa", sub-bagian
   menjawab "kosakata unit 6 ada di sebelah mana". */
type SubBab = { hal: number; judul: string };

/** Kotak di halaman PDF, satuan halaman (skala 1). */
type Kotak = { x: number; y: number; w: number; h: number };
/** Sudut kartu kunci jawaban di cetakan: 3mm, dalam satuan titik PDF. */
const SUDUT_KARTU = (3 * 72) / 25.4;
/** Kotak kunci jawaban; `pas` menandai kotak yang datang dari gambar halaman. */
type KotakKunci = Kotak & { pas: boolean };

/* [ebook-kunci-tirai-presisi-v1] Kotak kunci jawaban diambil dari BIDANG YANG
   DIGAMBAR di halaman, bukan ditebak dari batas tulisannya.

   Dulu tirainya disusun dari kotak teks + 12pt jarak napas, lalu lebarnya
   dipaksa simetris dengan menyalin marjin kiri ke kanan. Hasilnya selalu meleset
   beberapa milimeter: baris terpanjang di dalam kotak tak pernah persis
   selebar kotaknya, dan padding cetak (4mm atas-bawah, 5mm kiri-kanan) tak sama
   dengan 12pt. Yang tampak: tirai krem melayang tidak sebidang dengan kartu
   yang ditutupinya.

   pdf.js menyimpan kotak batas tiap lintasan gambar di argumen ketiga
   `constructPath` — sudah dalam koordinat lintasan, tinggal dikalikan matriks
   yang sedang berlaku. Kartu kunci jawaban = bidang terisi TERKECIL yang
   memuat seluruh tulisan kunci jawabannya, jadi pilihannya tak bergantung pada
   warna dan tetap benar walau palet modulnya diganti. */
async function kotakKunciGambar(hal: any, pdfjs: any, isi: Kotak): Promise<Kotak | null> {
  const OPS = pdfjs?.OPS;
  if (!OPS) return null;
  // Lintasan yang cuma digaris (stroke) tanpa isi bukan kartu — itu garis
  // bawah tabel dan pemisah bagian.
  const TERISI = new Set<number>([
    OPS.fill, OPS.eoFill, OPS.fillStroke, OPS.eoFillStroke,
    OPS.closeFillStroke, OPS.closeEOFillStroke,
  ]);
  let daftar: { fnArray: number[]; argsArray: any[] };
  try {
    daftar = await hal.getOperatorList();
  } catch {
    return null;
  }
  const vp = hal.getViewport({ scale: 1 });
  let ctm: number[] = [1, 0, 0, 1, 0, 0];
  const tumpuk: number[][] = [];
  let pilih: Kotak | null = null;
  for (let i = 0; i < daftar.fnArray.length; i++) {
    const fn = daftar.fnArray[i];
    const arg = daftar.argsArray[i];
    if (fn === OPS.save) tumpuk.push(ctm);
    else if (fn === OPS.restore) ctm = tumpuk.pop() ?? ctm;
    else if (fn === OPS.transform) ctm = pdfjs.Util.transform(ctm, arg);
    else if (fn === OPS.constructPath) {
      const jenis = arg?.[0];
      const mm = arg?.[2];
      if (!TERISI.has(jenis) || !mm || mm.length < 4) continue;
      const m = pdfjs.Util.transform(vp.transform, ctm);
      const xs: number[] = [];
      const ys: number[] = [];
      for (const [px, py] of [[mm[0], mm[1]], [mm[2], mm[1]], [mm[2], mm[3]], [mm[0], mm[3]]]) {
        xs.push(m[0] * px + m[2] * py + m[4]);
        ys.push(m[1] * px + m[3] * py + m[5]);
      }
      const x = Math.min(...xs);
      const y = Math.min(...ys);
      const k: Kotak = { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
      // Harus memuat SELURUH blok kunci jawaban — bukan cuma judulnya — supaya
      // sorotan latar satu baris tidak ikut terpilih.
      const memuat =
        k.x <= isi.x + 2 && k.x + k.w >= isi.x + isi.w - 2 &&
        k.y <= isi.y + 2 && k.y + k.h >= isi.y + isi.h - 2;
      // Latar halaman ikut memuat semuanya; batas 99% membuangnya.
      if (!memuat || k.w > vp.width * 0.99 || k.h > vp.height * 0.9) continue;
      if (!pilih || k.w * k.h < pilih.w * pilih.h) pilih = k;
    }
  }
  return pilih;
}

/** Satu entri daftar isi. */
type Bab = { hal: number; judul: string; label?: string; utama: boolean; anak: SubBab[] };

/* [ebook-daftar-isi-timeline-v1] Entri daftar isi + rentang halamannya. `sampai`
   dihitung dari awal bab BERIKUTNYA, bukan dibaca dari PDF: modulnya tak
   menuliskan "unit ini 3 halaman" di mana pun. */
type BabRentang = Bab & { sampai: number };

/* [ebook-isi-lompat-v1] Satu baris pada halaman "Daftar isi" CETAK (halaman di
   dalam PDF-nya, bukan panel di tepi kiri) beserta kotak ketuknya dalam satuan
   halaman. Kotaknya sengaja selebar tabel dan setinggi seluruh baris — yang
   diketuk siswa biasanya judulnya atau ruang kosong di antara judul dan
   nomornya, hampir tak pernah angkanya sendiri. */
type BarisIsi = { hal: number; judul: string; x0: number; x1: number; y0: number; y1: number };

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
  /* Dulu dibakar ke tiap halaman sebagai cap air. Dicabut 20 Agu 2026: yang
     paling terganggu justru pembeli sahnya — capnya melintang persis di atas
     kalimat yang sedang dibaca. Propnya dibiarkan hidup supaya pemanggilnya tak
     perlu diubah kalau suatu saat capnya dipasang lagi (mis. cuma di kaki
     halaman). */
  watermark?: string;
  /** [ebook-tts-ketuk-kata-v1] Bahasa modul (`digital_products.language`).
   *  Kosong pun tak apa — bahasanya ditebak dari judul. Kalau tetap tak
   *  terbaca, ketuk-untuk-mendengar tidak diaktifkan sama sekali. */
  language?: string | null;
  onClose: () => void;
}

export default function EbookReader({
  purchaseId, title, accessToken, language, onClose,
}: EbookReaderProps) {
  /* [ebook-buka-instan-v1] Modul yang barusan dibaca masih hidup di memori →
     dipasang sebagai nilai AWAL, jadi rendernya yang pertama pun sudah berisi
     halaman; tak ada "Menyiapkan modul…" yang berkelip. */
  const awalDoc = docCache?.id === purchaseId ? docCache.doc : null;
  const [doc, setDoc] = useState<PdfDoc | null>(awalDoc);
  const [total, setTotal] = useState(awalDoc?.numPages ?? 0);
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
  const [memuat, setMemuat] = useState(!awalDoc);
  /* Layar tunggu baru DIGAMBAR kalau pemuatannya benar-benar lama. Kalau
     bytenya sudah dipanaskan, urusannya kelar dalam ~150 ms dan spinner yang
     berkelip sekejap justru terasa lebih lambat daripada tanpa spinner. */
  const [tundaMemuat, setTundaMemuat] = useState(false);
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
  /* [ebook-popup-kata-v1] Arti kata yang sedang tampil di popup.
     undefined = masih dicari, null = tak terbaca (popup tetap tampil). */
  const [arti, setArti] = useState<HasilArti | undefined>(undefined);

  /* [ebook-daftar-isi-v1] Daftar isi + lompat halaman. */
  const [daftarBuka, setDaftarBuka] = useState(false);
  /* [ebook-daftar-isi-tepi-v1] Tombol daftar isi di bilah atas berjarak satu
     layar penuh dari mata yang sedang membaca — tiap kali siswa mau melompat
     unit, kursornya harus menyeberang seluruh halaman. Sekarang cukup menempel
     ke tepi KIRI layar: tombolnya menyongsong sendiri. Tepi layar itu sasaran
     tak berhingga (hukum Fitts) — tak perlu dibidik, tinggal didorong.

     Cuma untuk tetikus: di layar sentuh tak ada "menempel", dan zona tepi malah
     mencegat gerakan menggeser halaman. */
  const [tepiSiap, setTepiSiap] = useState(false);
  const [tepiHover, setTepiHover] = useState(false);
  /* Bab mana yang isinya sedang dibentangkan. `undefined` = panel baru dibuka
     dan belum diputuskan — dipakai supaya bab yang sedang dibaca membentang
     sendiri sekali saja; kalau siswa menutupnya, ia tetap tertutup. */
  const [babBuka, setBabBuka] = useState<number | null | undefined>(undefined);
  const [bab, setBab] = useState<Bab[] | null>(null);
  const [memindai, setMemindai] = useState(false);
  /** Halaman terakhir yang sedang dipindai — dipakai bilah progres "Menyusun daftar isi". */
  const [pindaiHal, setPindaiHal] = useState(0);
  /** Nomor halaman yang sedang ditarik di penggeser (belum dilepas). */
  const [tarik, setTarik] = useState<number | null>(null);
  /** Kotak "lompat ke halaman" di bilah bawah sedang terbuka? */
  const [lompat, setLompat] = useState<string | null>(null);
  /* [ebook-zoom-kotak-v1] Angka persen di bilah atas bisa diketik: null =
     sedang menampilkan angka, string = sedang diisi siswa. */
  const [ketikZoom, setKetikZoom] = useState<string | null>(null);

  const [layarPenuh, setLayarPenuh] = useState(false);

  const wadahRef = useRef<HTMLDivElement | null>(null);
  const kiriRef = useRef<HTMLCanvasElement | null>(null);
  const kananRef = useRef<HTMLCanvasElement | null>(null);
  const depanRef = useRef<HTMLCanvasElement | null>(null);
  const belakangRef = useRef<HTMLCanvasElement | null>(null);
  const docRef = useRef<PdfDoc | null>(null);
  const pdfjsRef = useRef<any>(null);
  /** Isi teks per halaman (satuan halaman, skala 1) — dibaca sekali per halaman. */
  const teksRef = useRef<Map<number, HalTeks>>(new Map());

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
  /* [ebook-balik-tanpa-kedip-v1] Bitmap lembar yang sedang dibalik. Disimpan di
     ref, bukan di state: canvas-nya harus sudah terisi SEBELUM browser
     menggambar frame pertama animasinya (lihat useLayoutEffect di bawah),
     sementara state baru sampai ke DOM satu commit kemudian. */
  const daunRef = useRef<{
    depan: Bitmap | null;
    punggung: Bitmap | null;
    kiri: Bitmap | null;
    kanan: Bitmap | null;
  } | null>(null);
  /** Penutup animasi balik — dipanggil animationend ATAU jam cadangan, sekali saja. */
  const selesaiBalikRef = useRef<(() => void) | null>(null);
  /** Halaman terkini yang bisa dibaca dari dalam callback tanpa ikut basi. */
  const pageRef = useRef(1);
  pageRef.current = page;
  /** Kata+kalimat yang artinya sedang ditunggu — penjaga hasil AI yang basi. */
  const ucapKunciRef = useRef("");
  /** Ada popup kata terbuka? — dibaca dari penangan tombol tanpa ikut basi. */
  const ucapRef = useRef(false);

  /* [ebook-latihan-interaktif-v1] Soal modul + unit yang latihannya sedang
     dikerjakan. Keduanya pelengkap: modul tanpa berkas soal jalan seperti biasa. */
  const [soal, setSoal] = useState<BerkasLatihan | null>(null);
  const [kerjakan, setKerjakan] = useState<UnitLatihan | null>(null);
  /* [ebook-panduan-tour-v1] Tur yang sedang berjalan. "penuh" = panduan
     pemakaian dari tombol tanda tanya; "latihan" = sorotan sekali jalan yang
     memperkenalkan tombol Kerjakan latihan waktu siswa pertama kali sampai di
     halaman yang ada soalnya. */
  const [tur, setTur] = useState<"penuh" | "latihan" | null>(null);
  /* [ebook-kunci-tertutup-v1] Halaman yang kunci jawabannya sudah dibuka siswa. */
  const [kunciBuka, setKunciBuka] = useState<Set<number>>(new Set());
  /** Letak kotak "Kunci jawaban" per halaman (satuan halaman PDF, skala 1).
      `pas` = kotaknya diambil dari bidang yang benar-benar digambar, jadi boleh
      dipakai apa adanya; false = tebakan dari batas tulisan. */
  const [kunciKotak, setKunciKotak] = useState<Map<number, KotakKunci>>(new Map());

  const dua = muatDua && (duaManual ?? true);
  const tampil = useMemo(() => bentangan(page, total, dua), [page, total, dua]);

  /* ── muat dokumen ──────────────────────────────────────────────────────── */
  useEffect(() => {
    let hidup = true;
    // [ebook-buka-instan-v1] Dokumen yang sama masih hidup dari pembukaan
    // sebelumnya → tak ada yang perlu diunduh maupun diurai lagi.
    const simpananDoc = docCache?.id === purchaseId ? docCache.doc : null;
    // Layar tunggu baru muncul kalau pemuatannya lewat dari sekejap.
    const jedaTunggu = simpananDoc
      ? null
      : window.setTimeout(() => { if (hidup) setTundaMemuat(true); }, 220);
    /* [ebook-buka-cepat-v3] Dokumen yang dibuka dari POTONGAN masih bergantung
       pada jaringan tiap kali halaman baru diminta. Begitu berkas utuhnya
       mendarat di perangkat, dokumennya ditukar diam-diam: halaman yang sudah
       tergambar tetap di layar (bitmapnya disimpan per nomor halaman), yang
       berubah cuma dari mana halaman BERIKUTNYA dibaca. */
    let jamUtuh: number | null = null;
    /** Koneksi hemat/lambat: jangan menyeret 3,5 MB di latar cuma untuk
        simpanan besok. Membaca hari ini tetap jalan lewat potongan. */
    const koneksiIrit = () => {
      const c = (navigator as any)?.connection;
      if (!c) return false;
      return !!c.saveData || /(^|-)2g$/.test(String(c.effectiveType || ""));
    };
    const gantiKeUtuh = async () => {
      if (koneksiIrit()) return;
      try {
        const buf = await ambilBerkas(purchaseId, accessToken);
        const pdfjs = pdfjsRef.current;
        const lama = docRef.current;
        if (!hidup || !pdfjs || !lama) return;
        const baru = await pdfjs.getDocument({ data: new Uint8Array(buf.slice(0)) }).promise;
        if (!hidup) { baru.destroy?.(); return; }
        docRef.current = baru;
        setDoc(baru);
        if (docCache && docCache.id !== purchaseId) docCache.doc.destroy?.();
        docCache = { id: purchaseId, doc: baru };
        // Render yang masih jalan memegang dokumen lama — ditunggu rampung dulu,
        // kalau tidak halamannya gagal di tengah jalan dan slotnya jadi kosong.
        await Promise.allSettled([...antreRef.current.values()]);
        lama.destroy?.();
      } catch { /* gagal = tetap pakai dokumen potongan, bukan kiamat */ }
    };

    (async () => {
      try {
        // [ebook-reader-paralel-v1] Bundel pdf.js, byte yang mungkin sudah
        // tersimpan, dan alamat berkasnya diminta BARENGAN — tiga penantian itu
        // tidak saling bergantung, jadi waktu tunggunya tinggal yang paling
        // lama, bukan jumlah ketiganya.
        const pdfjsJanji = muatPdfjs();
        const lokalJanji = simpananDoc ? Promise.resolve(null) : bufLokal(purchaseId);
        const metaJanji = simpananDoc ? null : ambilMeta(purchaseId, accessToken).catch(() => null);
        const pdfjs = await pdfjsJanji;
        if (!hidup) return;
        pdfjsRef.current = pdfjs; // dipakai Util.transform waktu menghitung letak teks

        let d = simpananDoc;
        let dariPotongan = false;
        if (!d) {
          const lokal = await lokalJanji;
          if (!hidup) return;
          if (lokal) {
            // Berkasnya sudah ada di perangkat: tak ada jaringan yang ditunggu.
            simpanBuf(purchaseId, lokal.buf);
            void segarkanLaci(purchaseId, accessToken, lokal);
            // Salinan byte: pdf.js "memindahkan" buffer yang diberikan ke worker,
            // jadi kalau aslinya dipakai langsung, entri bufCache jadi kosong dan
            // buka-ulang reader malah gagal.
            d = await pdfjs.getDocument({ data: new Uint8Array(lokal.buf.slice(0)) }).promise;
          } else {
            const meta = await metaJanji;
            if (!hidup) return;
            if (meta?.urlPotong) {
              /* Modul 3,5 MB di koneksi rumahan = 5–17 detik menatap
                 "Menyiapkan modul…". pdf.js cuma butuh beberapa ratus KB untuk
                 bentangan pertama, jadi biarkan ia meminta seperlunya:
                 - disableAutoFetch: jangan menyedot sisa berkas di latar,
                 - disableStream: jangan menunggu badan respons yang panjang. */
              d = await pdfjs.getDocument({
                url: meta.urlPotong,
                rangeChunkSize: 1 << 18, // 256 KB — cukup besar supaya jumlah
                                         // permintaannya sedikit, cukup kecil
                                         // supaya halaman pertama tak menunggu.
                disableAutoFetch: true,
                disableStream: true,
              }).promise;
              dariPotongan = true;
            } else {
              // Tak dapat alamat (jaringan/hak) — jalur lama yang menentukan,
              // sekalian supaya pesan galatnya sampai apa adanya.
              const buf = await ambilBerkas(purchaseId, accessToken);
              if (!hidup) return;
              d = await pdfjs.getDocument({ data: new Uint8Array(buf.slice(0)) }).promise;
            }
          }
          if (!hidup) { d.destroy?.(); return; }
          // Modul lain yang tersimpan dilepas — dua dokumen pdf.js hidup
          // barengan artinya dua worker penuh isi halaman di memori.
          if (docCache && docCache.id !== purchaseId) docCache.doc.destroy?.();
          // Dokumen potongan TIDAK disimpan sebagai dokumen siap pakai: ia masih
          // menggantung pada jaringan. Simpanannya diisi gantiKeUtuh.
          docCache = dariPotongan ? null : { id: purchaseId, doc: d };
          // Berkas utuh ditarik BELAKANGAN — kalau berbarengan, unduhan 3,5 MB
          // itu merebut jalur dari potongan yang sedang ditunggu mata siswa.
          if (dariPotongan) jamUtuh = window.setTimeout(() => { void gantiKeUtuh(); }, 2500);
        }

        docRef.current = d;
        setDoc(d);
        setTotal(d.numPages);
        // Lanjut dari halaman terakhir. Disimpan lokal dulu — menambah kolom di
        // digital_purchases perlu ubah skema, dan itu keputusan terpisah.
        // Simpanannya berbentuk "halaman/jumlahHalaman". Kalau jumlahnya beda,
        // modulnya sudah diterbitkan ulang dengan isi baru — nomor halaman lama
        // menunjuk ke tempat yang salah, jadi bacanya dimulai dari sampul lagi.
        const mentah = localStorage.getItem(halamanKey(purchaseId)) || "";
        const [halTeks, totalTeks] = mentah.split("/");
        const simpanan = Number(halTeks);
        const totalLama = Number(totalTeks);
        const sahih =
          Number.isFinite(simpanan) && simpanan >= 1 && totalLama === d.numPages;
        setPage(sahih ? Math.min(simpanan, d.numPages) : 1);
      } catch (e: any) {
        if (hidup) setGalat(e?.message || tr("Gagal memuat modul"));
      } finally {
        if (jedaTunggu) window.clearTimeout(jedaTunggu);
        if (hidup) { setMemuat(false); setTundaMemuat(false); }
      }
    })();
    return () => {
      hidup = false;
      if (jedaTunggu) window.clearTimeout(jedaTunggu);
      if (jamUtuh) window.clearTimeout(jamUtuh);
      // ⚠️ Dokumen TIDAK dimusnahkan kalau ia yang sedang disimpan: itulah
      // yang membuat buka-ulang modul yang sama terbuka seketika. Yang lama
      // dimusnahkan waktu modul LAIN menggantikannya di simpanan.
      if (docRef.current && docCache?.doc !== docRef.current) docRef.current.destroy?.();
      docRef.current = null;
      bitmapRef.current.clear();
      antreRef.current.clear();
      teksRef.current.clear();
      hentikanEbookTts();
    };
  }, [purchaseId, accessToken]);

  /* Berkas soal diminta terpisah dari PDF-nya dan TIDAK ditunggu: modulnya
     harus sudah bisa dibaca walau soalnya belum sampai (atau tak ada). */
  useEffect(() => {
    let hidup = true;
    void ambilSoal(purchaseId, accessToken).then((j) => { if (hidup) setSoal(j); });
    return () => { hidup = false; };
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
    /* [ebook-swipe-halaman-v1] Satu ayunan mendatar di trackpad = satu
       halaman. `akum` dikumpulkan sampai melewati ambang, lalu dikunci sampai
       rodanya benar-benar diam supaya momentumnya tak jadi lompatan beruntun. */
    let akum = 0;
    let kunci = false;
    let jedaRoda: number | null = null;

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) {
        // Halaman yang di-zoom memang bisa digulir mendatar — di situ geseran
        // mendatar adalah gulir, bukan pindah halaman.
        const bisaGulirX = el.scrollWidth - el.clientWidth > 4;
        if (bisaGulirX || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
        e.preventDefault();
        if (jedaRoda) window.clearTimeout(jedaRoda);
        jedaRoda = window.setTimeout(() => { akum = 0; kunci = false; jedaRoda = null; }, SWIPE_RESET);
        if (kunci) return;
        akum += e.deltaX;
        if (Math.abs(akum) < SWIPE_RODA) return;
        kunci = true;
        balikKeRef.current(akum > 0 ? 1 : -1);
        akum = 0;
        return;
      }
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

    /* Seret tetikus kiri/kanan juga membalik halaman — di desktop tanpa
       trackpad itu gerakan paling dekat dengan "menggeser kertas". */
    let seret: { x: number; y: number; id: number } | null = null;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      if (el.scrollWidth - el.clientWidth > 4) return; // sedang di-zoom: itu gulir
      seret = { x: e.clientX, y: e.clientY, id: e.pointerId };
    };
    const onUp = (e: PointerEvent) => {
      const a = seret;
      seret = null;
      if (!a || e.pointerId !== a.id) return;
      const dx = e.clientX - a.x;
      const dy = e.clientY - a.y;
      if (Math.abs(dx) < SWIPE_SERET || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      // Seretan tetap berakhir sebagai klik; tanpa penanda ini kata di bawah
      // kursor ikut dibunyikan tiap kali halaman digeser.
      abaikanKlikRef.current = true;
      balikKeRef.current(dx < 0 ? 1 : -1);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onDown, { passive: true });
    el.addEventListener("pointerup", onUp, { passive: true });
    const onBatalSeret = () => { seret = null; };
    el.addEventListener("pointercancel", onBatalSeret, { passive: true });
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: true });
    el.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      if (jedaRoda) window.clearTimeout(jedaRoda);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onBatalSeret);
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, [aturZoom]);

  /* ── render halaman ke bitmap (dengan cache) ───────────────────────────── */
  /* [ebook-nomor-halaman-v1] Nomor halaman dicetak di kaki kertas.
     PDF-nya dicetak Chromium dengan --no-pdf-header-footer, jadi halamannya
     memang polos tanpa nomor: siswa yang diberi tahu "buka halaman 12" tak
     punya apa pun untuk dicocokkan selain menghitung sendiri dari bilah bawah.
     Sama seperti cap air, nomornya DIBAKAR ke bitmap supaya ikut berputar
     bersama kertas waktu halaman dibalik.
     Sampul dilewati — buku betulan juga tidak menomori sampulnya. */
  const gambarNomor = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, n: number) => {
    if (n <= 1) return;
    ctx.save();
    ctx.fillStyle = "rgba(90,100,120,0.72)";
    ctx.font = `600 ${Math.max(9, Math.round(h * 0.0115))}px "Helvetica Neue", Arial, sans-serif`;
    ctx.textAlign = "center";
    // Ditaruh di dalam margin bawah (A4 margin 16mm ≈ 5,4% tinggi), jadi tidak
    // pernah menimpa teks isi.
    ctx.fillText(String(n), w / 2, h - h * 0.022);
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
        gambarNomor(ctx, viewport.width, viewport.height, n);
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
  }, [generasi, gambarNomor]);

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
    if (doc) localStorage.setItem(halamanKey(purchaseId), `${page}/${doc.numPages}`);
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
    // kertas kosong. Bitmapnya dititipkan ke ref supaya useLayoutEffect bisa
    // mengisinya di commit yang SAMA — versi lama mengisi lewat
    // requestAnimationFrame, dan satu frame di antaranya terlihat sebagai
    // kedipan kertas putih kosong tepat saat halaman mulai berputar.
    daunRef.current = { depan: bmDaun, punggung: bmPunggung, kiri: bmKiriBaru, kanan: bmKananBaru };
    setBalik({ arah, tujuan: baru });

    // Penutup animasi. Dipanggil oleh animationend (paling presisi) atau jam
    // cadangan kalau eventnya tak datang — mis. tab disembunyikan di tengah
    // jalan. Dijaga sekali pakai lewat selesaiBalikRef.
    let sudah = false;
    const selesai = () => {
      if (sudah) return;
      sudah = true;
      selesaiBalikRef.current = null;
      window.clearTimeout(jamCadangan);
      // Sisi yang tadi TERTIMPA lembar masih memegang halaman lama. Diisi di
      // sini — sinkron, sebelum flipper-nya dicabut — karena efek yang biasa
      // mengisi slot baru berjalan satu frame kemudian: jeda itulah yang dulu
      // terbaca sebagai kedipan halaman lama sesaat setelah kertas mendarat.
      if (dua) {
        if (arah > 0) pasang(kiriRef.current, bmKiriBaru);
        else pasang(kananRef.current, bmKananBaru);
      }
      balikRef.current = false;
      daunRef.current = null;
      setBalik(null);
      setPage(halBaru);
      pageRef.current = halBaru;
      const lanjut = antreBalikRef.current;
      antreBalikRef.current = null;
      if (lanjut) requestAnimationFrame(() => balikKeRef.current(lanjut));
    };
    selesaiBalikRef.current = selesai;
    const jamCadangan = window.setTimeout(selesai, DURASI_BALIK + 160);
  }, [total, dua, siapkan, pasang]);

  /* [ebook-balik-tanpa-kedip-v1] Isi canvas lembar yang berputar di commit yang
     sama dengan pemasangannya. useLayoutEffect jalan SEBELUM browser menggambar,
     jadi frame pertama animasi sudah berisi kertas bergambar. */
  useLayoutEffect(() => {
    const bm = daunRef.current;
    if (!balik || !bm) return;
    pasang(depanRef.current, bm.depan);
    pasang(belakangRef.current, bm.punggung);
    // Sisi yang TERSINGKAP di balik lembar langsung diisi halaman baru; sisi
    // yang justru akan tertimpa lembar tetap memakai isi lama sampai selesai.
    if (dua) {
      if (balik.arah > 0) pasang(kananRef.current, bm.kanan);
      else pasang(kiriRef.current, bm.kiri);
    } else {
      pasang(kiriRef.current, bm.punggung);
    }
  }, [balik, dua, pasang]);

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
      // Esc menutup lapisan yang PALING atas dulu — daftar isi, lalu popup kata,
      // baru readernya. Tanpa urutan ini, membuka daftar isi jadi jebakan:
      // refleks menekan Esc justru menutup modulnya.
      if (e.key === "Escape") {
        if (daftarBuka) { setDaftarBuka(false); return; }
        if (ucapRef.current) { setUcap(null); return; }
        onClose();
        return;
      }
      if (daftarBuka) return;
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
  }, [balikKe, ke, total, onClose, aturZoom, daftarBuka]);

  // Layar penuh: dicoba begitu reader terbuka, dilepas lagi saat ditutup.
  useEffect(() => {
    // Kalau klik "Baca" di Perpustakaan sudah menyalakannya, panggilan ini
    // langsung balik tanpa efek — penandanya yang menentukan kepemilikan.
    void mintaLayarPenuh();
    const onUbah = () => {
      const penuh = !!document.fullscreenElement;
      setLayarPenuh(penuh);
      // Siswa keluar sendiri (Esc / tombol browser) → sejak itu bukan milik kita.
      if (!penuh) layarPenuhMilikKita = false;
    };
    onUbah();
    document.addEventListener("fullscreenchange", onUbah);
    return () => {
      document.removeEventListener("fullscreenchange", onUbah);
      if (layarPenuhMilikKita) keluarLayarPenuh();
    };
  }, []);

  const alihLayarPenuh = useCallback(() => {
    if (document.fullscreenElement) { keluarLayarPenuh(); return; }
    void mintaLayarPenuh();
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
  /** Sudut lembar yang sedang berputar — ikut slot asalnya, lihat pemakaiannya. */
  const sudutDaun = !dua ? 8 : (balik && balik.arah > 0 ? "2px 8px 8px 2px" : "8px 2px 2px 8px");
  const geser = !dua || (untukGeser.kiri && untukGeser.kanan)
    ? 0
    : (untukGeser.kiri ? 1 : -1) * ((pw + GAP) / 2);
  const halPertama = tampil.kiri ?? tampil.kanan ?? 1;

  /** Penggeser dilepas → baru halamannya benar-benar pindah. */
  const komitTarik = useCallback(() => {
    setTarik((v) => { if (v != null) ke(v); return null; });
  }, [ke]);

  /** [ebook-zoom-kotak-v1] Isi kotak persen → pakai zoom itu. */
  const terapkanKetikZoom = useCallback(() => {
    const n = parseInt(ketikZoom || "", 10);
    if (Number.isFinite(n) && n > 0) aturZoom(n / 100, true);
    setKetikZoom(null);
  }, [ketikZoom, aturZoom]);

  /** Isi kotak "lompat ke halaman" → buka halamannya. */
  const lompatKe = useCallback(() => {
    const n = parseInt(lompat || "", 10);
    if (Number.isFinite(n) && total) ke(Math.min(Math.max(1, n), total));
    setLompat(null);
  }, [lompat, total, ke]);

  const nomor = total
    ? (tampil.kiri && tampil.kanan ? `${tampil.kiri}–${tampil.kanan} / ${total}` : `${halPertama} / ${total}`)
    : "—";

  /* ── ketuk kata → pelafalannya ─────────────────────────────────────────
     [ebook-tts-ketuk-kata-v1] Bahasa modul: kolom `language` dulu, judul
     belakangan. Tak terbaca = fitur ini diam sepenuhnya — kata Spanyol yang
     dilafalkan dengan fonem bahasa lain lebih merusak daripada tak ada suara. */
  const kodeBahasa = useMemo(() => kodeBahasaEbook(language, title), [language, title]);
  const ttsAktif = bisaDibunyikan(kodeBahasa);

  const KOSONG: HalTeks = useMemo(() => ({ items: [], baris: [] }), []);

  /* [ebook-teks-safari-v1] Ini yang membuat ketuk-kata DIAM TOTAL di Safari —
     bukan audionya.

     `page.getTextContent()` milik pdf.js 5 mengurai isi halaman dengan
     `for await (const value of readableStream)`, dan WebKit sampai hari ini
     belum memasang `Symbol.asyncIterator` di ReadableStream. Jadi di Safari
     panggilan itu melempar "undefined is not a function (near '...value of
     readableStream...')" — bukan galat jaringan, bukan galat audio: halamannya
     tergambar sempurna, teksnya saja yang tak pernah terbaca. Karena
     pengambilan teks dibungkus try/catch (modul hasil pindaian memang tak punya
     lapisan teks), kegagalannya lolos tanpa suara: ketukan tak menemukan kata
     apa pun, popup tak muncul, dan daftar isi ikut keluar kosong.

     Aliran yang sama dibaca manual lewat getReader() — API yang ada di semua
     browser. ⚠️ Jangan kembalikan ke getTextContent() "supaya ringkas". */
  /* `gaya` dibawa serta karena daftar isi memakainya: pdf.js melaporkan
     keluarga huruf tiap potongan ("serif" / "sans-serif"), dan di modul Linguo
     SEMUA judul dicetak sans-serif di atas badan teks serif — itu penanda
     paling murah untuk mengenali judul kotak tata bahasa yang ukurannya sama
     persis dengan badan teks. */
  const potonganTeks = useCallback(async (hal: any): Promise<{ potongan: any[]; gaya: Record<string, any> }> => {
    const gaya: Record<string, any> = {};
    if (typeof hal?.streamTextContent === "function") {
      const pembaca = hal.streamTextContent().getReader();
      const kumpul: any[] = [];
      for (;;) {
        const { value, done } = await pembaca.read();
        if (done) break;
        if (value?.items?.length) kumpul.push(...value.items);
        if (value?.styles) Object.assign(gaya, value.styles);
      }
      return { potongan: kumpul, gaya };
    }
    // pdf.js versi lama tanpa streamTextContent — jalur lama masih benar di sana.
    const isi = await hal.getTextContent();
    return { potongan: isi.items ?? [], gaya: isi.styles ?? {} };
  }, []);

  const ambilTeks = useCallback(async (n: number): Promise<HalTeks> => {
    const ada = teksRef.current.get(n);
    if (ada) return ada;
    const d = docRef.current;
    const pdfjs = pdfjsRef.current;
    if (!d || !pdfjs || n < 1 || n > d.numPages) return KOSONG;
    try {
      const hal = await d.getPage(n);
      // Skala 1: koordinatnya jadi satuan halaman, jadi tetap sahih waktu siswa
      // mencubit — tinggal dikalikan skala yang sedang berlaku.
      const vp = hal.getViewport({ scale: 1 });
      const { potongan, gaya } = await potonganTeks(hal);
      // Potongan yang isinya HANYA spasi ikut dikumpulkan (kosong: true). Bukan
      // sampah: di PDF cetakan Chromium, jarak antar kolom tabel justru muncul
      // sebagai satu potongan spasi lebar, dan spasi antar kata di ujung
      // pergantian font juga hidup di potongan tersendiri. Dulu semuanya
      // dibuang, jadi "casa (KA-sa)" terbaca "casa(KA-sa)".
      const semua: (ItemTeks & { kosong: boolean; fam: string })[] = [];
      for (const it of potongan) {
        const str = typeof it.str === "string" ? it.str : "";
        if (!str || !it.transform) continue;
        const tx = pdfjs.Util.transform(vp.transform, it.transform);
        const h = Math.hypot(tx[2], tx[3]);
        if (!h) continue;
        const fam = String(gaya[it.fontName]?.fontFamily ?? "").toLowerCase();
        semua.push({ str, x: tx[4], y: tx[5] - h, w: it.width || 0, h, kosong: !str.trim(), fam });
      }
      // Ketukan diadu hanya dengan potongan yang benar-benar berisi huruf.
      const items: ItemTeks[] = semua
        .filter((i) => !i.kosong)
        .map(({ str, x, y, w, h }) => ({ str, x, y, w, h }));

      // Potongan → baris. Toleransi 0,6 tinggi huruf: cukup longgar untuk
      // superskrip & campuran ukuran font dalam satu baris, cukup ketat supaya
      // dua baris paragraf yang rapat tidak menyatu.
      const urut = [...semua].sort((a, b) => (a.y - b.y) || (a.x - b.x));
      const baris: Baris[] = [];
      let kump: typeof semua = [];
      const tutup = () => {
        if (!kump.length) return;
        const rapi = [...kump].sort((a, b) => a.x - b.x);
        const segmen: Segmen[] = [];
        let sel: typeof semua = [];
        const tutupSel = () => {
          const isi = sel.filter((i) => !i.kosong);
          const teks = sel.map((i) => i.str).join("").replace(/\s{2,}/g, " ").trim();
          if (teks && isi.length) {
            segmen.push({ teks, x0: isi[0].x, x1: isi[isi.length - 1].x + isi[isi.length - 1].w });
          }
          sel = [];
        };
        for (const it of rapi) {
          const sblm = sel[sel.length - 1];
          // Dua penanda batas kolom: jarak mendatar yang menganga, dan potongan
          // spasi yang lebarnya sendiri lebih dari satu setengah tinggi huruf
          // (di dalam satu kalimat, spasi tak pernah selebar itu). Ambang 1,2
          // dipilih dari kolom nomor baris dialog yang lebarnya cuma 6 mm.
          if (sblm && it.x - (sblm.x + sblm.w) > Math.max(sblm.h, it.h) * 1.2) tutupSel();
          if (it.kosong && it.w > it.h * 1.5) { tutupSel(); continue; }
          sel.push(it);
        }
        tutupSel();
        const isiBaris = rapi.filter((i) => !i.kosong);
        const teks = segmen.map((g) => g.teks).join(" ").trim();
        if (teks && isiBaris.length) {
          // Keluarga huruf baris cuma diisi kalau SELURUH barisnya seragam:
          // kata tebal/miring di tengah paragraf tak boleh menyulap baris biasa
          // jadi judul.
          const keluarga = new Set(isiBaris.map((i) => i.fam).filter(Boolean));
          baris.push({
            teks,
            y: Math.min(...isiBaris.map((i) => i.y)),
            h: Math.max(...isiBaris.map((i) => i.h)),
            segmen,
            fam: keluarga.size === 1 ? [...keluarga][0] : undefined,
          });
        }
        kump = [];
      };
      for (const it of urut) {
        const acuan = kump[0];
        if (acuan && Math.abs(it.y - acuan.y) > Math.max(acuan.h, it.h) * 0.6) tutup();
        kump.push(it);
      }
      tutup();

      const hasil: HalTeks = { items, baris };
      teksRef.current.set(n, hasil);
      return hasil;
    } catch {
      return KOSONG; // modul hasil pindaian (tanpa lapisan teks) — ketukan diabaikan
    }
  }, [KOSONG, potonganTeks]);

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

  /* ── kunci jawaban tertutup ────────────────────────────────────────────
     [ebook-kunci-tertutup-v1] Kunci jawaban tercetak dua sentimeter di bawah
     soalnya, jadi mata sudah menangkap jawabannya sebelum sempat mencoba —
     latihannya jadi bacaan, bukan latihan. Kotaknya ditutup tirai sampai siswa
     sendiri yang mengetuk mata.

     Yang ditutup itu LAPISAN HTML di atas kanvas, bukan bitmapnya: jawabannya
     tetap ada di piksel halaman. Ini pagar niat, bukan pagar keamanan — sama
     seperti kunci jawaban buku betulan yang tinggal dibalik. */
  /* Cocok PERSIS satu baris, bukan awalan: halaman "Cara memakai modul ini"
     memuat butir "Kunci jawaban — baru dibuka setelah kamu benar-benar
     mencoba", dan pencocokan awalan menutupinya dengan tirai. */
  const KUNCI_JUDUL = useMemo(() => /^(kunci\s*jawaban|jawaban|answer\s*key)$/i, []);
  const kunciRef = useRef<Map<number, KotakKunci | null>>(new Map());

  useEffect(() => {
    const kini = [tampil.kiri, tampil.kanan].filter((n): n is number => !!n);
    /* Bentangan TETANGGA ikut dicari di muka. Pencarian tirai ini asinkron
       (teks halaman + daftar operator gambar), dan dulu cuma dijalankan untuk
       halaman yang sedang tampil — jadi begitu lembar mendarat, kunci jawaban
       halaman baru sempat terbaca beberapa frame sebelum tirainya terpasang. */
    const tepi = kini.length ? [kini[0] - 2, kini[0] - 1, kini[kini.length - 1] + 1, kini[kini.length - 1] + 2] : [];
    const halaman = [...kini, ...tepi.filter((n) => n >= 1 && (!total || n <= total))];
    let hidup = true;
    (async () => {
      let berubah = false;
      for (const n of halaman) {
        if (kunciRef.current.has(n)) continue;
        const { baris } = await ambilTeks(n);
        if (!hidup) return;
        berubah = true;
        const i = baris.findIndex((b) => KUNCI_JUDUL.test(b.teks.replace(/\s+/g, " ").trim()));
        if (i < 0) { kunciRef.current.set(n, null); continue; }
        // Kotak berakhir waktu jaraknya menganga: di dalam kotak jarak antar
        // baris rapat, sedangkan blok sesudahnya dipisah marjin beberapa
        // milimeter. Tanpa penjaga ini, tirainya ikut menutup paragraf
        // "Ulangan berjenjang" yang duduk persis di bawah kotak.
        const isi = [baris[i]];
        for (let k = i + 1; k < baris.length; k++) {
          const sblm = isi[isi.length - 1];
          if (baris[k].y - (sblm.y + sblm.h) > Math.max(sblm.h, baris[k].h) * 1.6) break;
          isi.push(baris[k]);
        }
        // Judul tanpa isi apa pun di bawahnya = bukan kotak kunci jawaban.
        if (isi.length < 2) { kunciRef.current.set(n, null); continue; }
        const x0 = Math.min(...isi.flatMap((b) => b.segmen.map((g) => g.x0)));
        const x1 = Math.max(...isi.flatMap((b) => b.segmen.map((g) => g.x1)));
        const y0 = isi[0].y;
        const y1 = Math.max(...isi.map((b) => b.y + b.h));
        const tulisan: Kotak = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
        // [ebook-kunci-tirai-presisi-v1] Kartu yang tercetak lebih dulu dicari;
        // kotak dari tulisan cuma jaring pengaman untuk modul yang kunci
        // jawabannya dicetak tanpa latar berwarna.
        let kotak: KotakKunci = {
          x: tulisan.x - 12, y: tulisan.y - 12, w: tulisan.w + 24, h: tulisan.h + 24, pas: false,
        };
        try {
          const d = docRef.current;
          const pdfjs = pdfjsRef.current;
          const halObj = d ? await d.getPage(n) : null;
          if (!hidup) return;
          const gambar = halObj ? await kotakKunciGambar(halObj, pdfjs, tulisan) : null;
          if (!hidup) return;
          if (gambar) kotak = { ...gambar, pas: true };
        } catch { /* daftar operator gagal dibaca → pakai kotak dari tulisan */ }
        kunciRef.current.set(n, kotak);
      }
      if (hidup && berubah) {
        const rapi = new Map<number, KotakKunci>();
        kunciRef.current.forEach((v, k) => { if (v) rapi.set(k, v); });
        setKunciKotak(rapi);
      }
    })();
    return () => { hidup = false; };
  }, [tampil.kiri, tampil.kanan, total, doc, ambilTeks, KUNCI_JUDUL]);

  /* Pindah bentangan = tirainya tertutup lagi. Kunci jawaban yang sudah dibuka
     tidak boleh "menempel" pada nomor halamannya: siswa yang kembali ke unit
     itu besok pagi harus mengerjakan soalnya dulu, bukan disambut jawabannya. */
  useEffect(() => {
    setKunciBuka((s) => (s.size ? new Set() : s));
  }, [tampil.kiri, tampil.kanan]);

  /* Satu tirai kunci jawaban di atas satu halaman. `kiriSlot` = pergeseran
     mendatar slot halamannya (0 untuk muka lembar yang berputar), `beku` =
     lembar sedang berputar sehingga tirainya cuma gambar, tak bisa diketuk.

     [ebook-kunci-tirai-saat-balik-v1] Waktu lembar berputar tirainya TETAP
     digambar — termasuk di kedua muka lembar itu sendiri. Dulu seluruh lapisan
     ini dicabut selama animasi (`!balik`), jadi kunci jawaban halaman yang
     sedang dibalik terbaca utuh selama setengah detik: bocor persis di gerakan
     yang paling sering dipakai siswa. */
  const gambarTirai = useCallback((n: number | null | undefined, kiriSlot: number, beku: boolean) => {
    if (!n) return null;
    const kotak = kunciKotak.get(n);
    if (!kotak) return null;
    /* [ebook-kunci-tirai-presisi-v1] Kotak yang datang dari bidang gambar
       halaman sudah persis sebesar kartunya — dipakai apa adanya. Yang ditebak
       dari tulisan tetap dibentangkan simetris (marjin kiri disalin ke kanan),
       kalau tidak tirainya duduk melenceng ke kiri karena baris terpanjang di
       dalam kartu tak pernah persis selebar kartunya. */
    const halW = skalaTampil > 0 ? pw / skalaTampil : 0;
    const marjin = kotak.pas ? kotak.x : Math.max(0, Math.min(kotak.x, halW / 2 - 24));
    const lebar = kotak.pas ? kotak.w : (halW > 0 ? halW - marjin * 2 : kotak.w);
    const gaya = {
      left: kiriSlot + marjin * skalaTampil,
      top: kotak.y * skalaTampil,
      width: lebar * skalaTampil,
      height: kotak.h * skalaTampil,
      // Sudut kartu cetaknya 3mm; tirai bersudut lain langsung terlihat sebagai
      // lapisan yang menempel di atasnya.
      borderRadius: kotak.pas ? SUDUT_KARTU * skalaTampil : undefined,
    };
    const isi = (
      <>
        <Eye className="h-5 w-5" />
        <span className="px-3 text-center text-[12px] font-extrabold leading-tight">
          {t("Lihat kunci jawaban")}
        </span>
        <span className="px-4 text-center text-[10.5px] font-semibold leading-snug text-[#12776F]/70">
          {t("Coba dulu, baru cocokkan")}
        </span>
      </>
    );
    if (kunciBuka.has(n)) {
      // Halaman yang tirainya memang sudah dibuka siswa tetap terbuka selama
      // lembarnya berputar — tombol "Tutup lagi" saja yang disembunyikan.
      if (beku) return null;
      return (
        <button
          key={`kunci-${n}`}
          onClick={(e) => {
            e.stopPropagation();
            setKunciBuka((v) => { const x = new Set(v); x.delete(n); return x; });
          }}
          title={t("Sembunyikan kunci jawaban")}
          className="absolute z-10 flex items-center gap-1 rounded-lg bg-[#0F172A]/80 px-2 py-1 text-[10.5px] font-bold text-white/80 backdrop-blur-sm transition hover:bg-[#0F172A]"
          style={{ left: gaya.left + gaya.width - 92, top: gaya.top - 6 }}
        >
          <EyeOff className="h-3.5 w-3.5" />
          {t("Tutup lagi")}
        </button>
      );
    }
    if (beku) {
      return (
        <div
          key={`kunci-${n}`}
          aria-hidden
          className={`ebook-kunci pointer-events-none absolute z-10 flex flex-col items-center justify-center gap-1.5 text-[#12776F] ${kotak.pas ? "" : "rounded-xl"}`}
          style={gaya}
        >
          {isi}
        </div>
      );
    }
    return (
      <button
        key={`kunci-${n}`}
        onClick={(e) => { e.stopPropagation(); setKunciBuka((v) => new Set(v).add(n)); }}
        className={`ebook-kunci absolute z-10 flex flex-col items-center justify-center gap-1.5 text-[#12776F] transition ${kotak.pas ? "" : "rounded-xl"}`}
        style={gaya}
      >
        {isi}
      </button>
    );
  }, [kunciKotak, kunciBuka, skalaTampil, pw, t]);

  /* [ebook-latihan-interaktif-v1] Unit yang halamannya sedang terbuka — dasar
     tombol "Kerjakan latihan". Rentang halamannya dihitung waktu modul dirakit,
     bukan di sini: paginasi PDF ditentukan mesin cetak, dan menebaknya dari
     teks halaman tiap kali reader dibuka cuma menambah kerja.

     [ebook-panduan-tour-v1] Dulu tombolnya menyala di SELURUH rentang unit —
     termasuk halaman penjelasan yang belum ada soalnya, jadi bacaan pertama
     unit pun sudah ditawari "kerjakan latihan" yang belum dibaca soalnya.
     Sekarang batasnya `halLatihan` (halaman tempat blok LATIHAN dicetak)
     sampai akhir unit, yaitu halaman latihan berikut halaman kunci
     jawabannya. */
  const unitKini = useMemo<UnitLatihan | null>(() => {
    if (!soal?.unit?.length) return null;
    const halaman = [tampil.kiri, tampil.kanan].filter((n): n is number => !!n);
    return (
      soal.unit.find((u) => {
        if (!u.latihan.length) return false;
        // Modul lama dirakit sebelum `halLatihan` ada — di situ rentang unit
        // tetap dipakai supaya tombolnya tidak hilang sama sekali.
        const mulai = u.halLatihan ?? u.hal;
        const habis = u.sampai ?? u.halLatihan ?? u.hal;
        if (!mulai || !habis) return false;
        return halaman.some((n) => n >= mulai && n <= habis);
      }) ?? null
    );
  }, [soal, tampil.kiri, tampil.kanan]);

  /* ── panduan berpandu ──────────────────────────────────────────────────
     [ebook-panduan-tour-v1] Isi langkahnya ditulis di sini, bukan di dalam
     EbookPanduan: yang tahu tombol mana yang sedang ada di layar cuma reader.
     Targetnya selektor `data-panduan`, dan boleh lebih dari satu — yang
     pertama KETEMU DAN TERLIHAT yang disorot, jadi langkah zoom (tombolnya
     disembunyikan di layar HP) jatuh ke halaman bukunya. */
  const langkahPenuh = useMemo<LangkahPanduan[]>(() => [
    {
      judul: t("Cara memakai reader ini"),
      isi: t("Tujuh langkah singkat, kurang dari satu menit. Kamu bisa membukanya lagi kapan saja."),
      tip: t("Tekan Esc untuk keluar, panah kiri/kanan untuk berpindah langkah."),
    },
    {
      target: ['[data-panduan="daftar"]'],
      judul: t("Lompat lewat daftar isi"),
      isi: t("Semua unit modul terdaftar di sini beserta nomor halamannya — ketuk satu unit untuk langsung ke sana, tanpa membalik satu per satu."),
    },
    {
      target: ['[data-panduan="navigasi"]'],
      judul: t("Berpindah halaman"),
      isi: t("Pakai panah untuk membalik satu halaman, tarik penggeser untuk menyusur cepat, atau ketuk nomor halamannya lalu ketik halaman yang kamu tuju."),
      tip: t("Papan tik: ← dan →. Di HP: geser layar seperti membalik kertas."),
    },
    {
      target: ['[data-panduan="zoom"]', ".ebook-buku"],
      judul: t("Memperbesar tulisan"),
      isi: t("Angka persen itu bisa diketik langsung, jadi tak perlu menekan + berkali-kali. Tombol di sebelahnya mengembalikan halaman supaya pas satu layar."),
      tip: t("Cubit dua jari di trackpad atau layar sentuh, atau tekan Ctrl/⌘ dengan + − 0."),
    },
    {
      target: [".ebook-buku"],
      judul: t("Ketuk kata untuk mendengarnya"),
      isi: t("Ketuk kata mana pun di halaman: kamu akan mendengar pelafalannya sekaligus melihat artinya dalam bahasa Indonesia."),
    },
    {
      target: [".ebook-buku"],
      judul: t("Kunci jawaban ditutup dulu"),
      isi: t("Kunci jawaban di modul sengaja ditutup tirai. Kerjakan dulu soalnya, baru ketuk kotaknya untuk mencocokkan."),
    },
    {
      target: ['[data-panduan="latihan"]', '[data-panduan="navigasi"]'],
      judul: t("Kerjakan latihannya di layar"),
      isi: t("Di halaman yang ada blok LATIHAN-nya, tombol ini muncul di bilah bawah. Soalnya dikerjakan langsung di sini dan dinilai otomatis — tanpa kertas."),
    },
    {
      target: ['[data-panduan="panduan"]'],
      judul: t("Panduan ini selalu ada di sini"),
      isi: t("Lupa salah satu langkah? Buka lagi panduannya dari tombol ini kapan saja."),
    },
  ], [t]);

  const langkahLatihan = useMemo<LangkahPanduan[]>(() => [
    {
      target: ['[data-panduan="latihan"]'],
      judul: t("Halaman ini ada latihannya"),
      isi: t("Ketuk tombol ini untuk mengerjakan soal unit ini langsung di layar. Jawabanmu dicek otomatis, dan yang belum pas bisa diulang."),
    },
  ], [t]);

  /* Panduan pertama kali: dijalankan sesudah halaman pertama benar-benar
     tergambar. Menyorot tombol yang kotaknya belum ada = sorotan melayang di
     pojok kiri atas. */
  useEffect(() => {
    if (!doc || memuat || galat || kerjakan) return;
    try { if (localStorage.getItem(PANDUAN_KEY)) return; } catch { return; }
    const jam = window.setTimeout(() => setTur((v) => v ?? "penuh"), 700);
    return () => window.clearTimeout(jam);
  }, [doc, memuat, galat, kerjakan]);

  /* Sorotan tombol latihan: sekali seumur akun, waktu halaman latihan pertama
     terbuka. Tidak dipaksakan menimpa panduan penuh yang mungkin sedang jalan. */
  useEffect(() => {
    if (!unitKini || tur || kerjakan) return;
    try {
      if (localStorage.getItem(TUR_LATIHAN_KEY)) return;
      if (!localStorage.getItem(PANDUAN_KEY)) return; // panduan penuh belum kelar
    } catch { return; }
    const jam = window.setTimeout(() => setTur("latihan"), 450);
    return () => window.clearTimeout(jam);
  }, [unitKini, tur, kerjakan]);

  const tutupTur = useCallback(() => {
    setTur((v) => {
      try {
        if (v === "penuh") localStorage.setItem(PANDUAN_KEY, "1");
        // Panduan penuh sudah memperkenalkan tombolnya — sorotannya tak perlu
        // muncul lagi nanti.
        if (v) localStorage.setItem(TUR_LATIHAN_KEY, "1");
      } catch { /* localStorage diblokir → panduannya cuma muncul lagi lain kali */ }
      return null;
    });
  }, []);

  /* Siswa yang langsung menekan tombol latihan dari dalam sorotan sudah paham
     maksudnya — panduannya dianggap selesai, bukan ditunda sampai kembali. */
  useEffect(() => {
    if (kerjakan && tur) tutupTur();
  }, [kerjakan, tur, tutupTur]);

  /* ── daftar isi ────────────────────────────────────────────────────────
     [ebook-daftar-isi-v1] Modul 40 halaman tanpa daftar isi cuma bisa disusuri
     dengan membalik satu-satu — dan pengajar yang menulis "kerjakan Unit 5" di
     grup praktis menyuruh siswanya mencari.

     PDF-nya dicetak Chromium headless (lihat scripts/build-ebook-pdf.mjs) yang
     TIDAK menyertakan bookmark, jadi getOutline() selalu kosong: daftarnya
     disusun sendiri dari ukuran huruf. Judul unit dicetak 17pt di atas badan
     teks 10,5pt, jadi "baris yang hurufnya jauh lebih besar dari kebanyakan
     baris di halaman ini" adalah penanda yang bertahan walau modulnya bahasa
     lain — ambangnya relatif, bukan angka pt yang dipatok. */
  /* Diuji pada teks yang SPASINYA SUDAH DIBUANG. Label "Unit 1" dicetak dengan
     letter-spacing lebar, dan pdf.js membaca renggangnya sebagai spasi sungguhan
     — teks yang sampai ke sini berbunyi "U n i t 1". */
  const LABEL_BAB = useMemo(
    () => /^(unit|bab|pelajaran|lecci[oó]n|lesson|le[çc]on|lezione|unidade|unidad|kapitel|part|bagian)\.?\d+$/i,
    []
  );

  /** "U n i t 1" / "Unit 1" → "Unit 1". */
  const rapikanLabel = (teks: string) => teks.replace(/\s+/g, "").replace(/(\d+)$/, " $1");

  const pindaiDaftar = useCallback(async () => {
    const d = docRef.current;
    if (!d || memindai) return;
    setPindaiHal(0);
    setMemindai(true);
    try {
      const hasil: Bab[] = [];
      for (let n = 1; n <= d.numPages; n++) {
        setPindaiHal(n);
        const { baris } = await ambilTeks(n);
        if (!baris.length) continue;
        const tinggi = baris.map((b) => b.h).sort((a, b) => a - b);
        const tengah = tinggi[Math.floor(tinggi.length / 2)] || 10;
        // 1,3x badan teks: cukup untuk menangkap judul unit (17pt vs 10,5pt),
        // cukup tinggi untuk melewatkan sub-judul h3 (11pt) & kepala tabel.
        const ambang = Math.max(tengah * 1.3, 12.5);
        // baris sudah terurut dari atas ke bawah — yang pertama lolos = judulnya.
        const idxJudul = baris.findIndex((b) => b.h >= ambang);
        const judul = idxJudul >= 0 ? baris[idxJudul] : undefined;

        /* Keluarga huruf badan teks halaman ini, ditimbang per huruf: yang
           menang pasti serif (badan teks), jadi baris sans-serif yang tersisa
           adalah judul — lihat catatan pada potonganTeks. */
        const hitungFam = new Map<string, number>();
        for (const b of baris) if (b.fam) hitungFam.set(b.fam, (hitungFam.get(b.fam) ?? 0) + b.teks.length);
        let famBadan = "";
        let terbanyak = 0;
        hitungFam.forEach((v, k) => { if (v > terbanyak) { terbanyak = v; famBadan = k; } });

        if (judul) {
          // Label "Unit 3" dicetak kecil PERSIS di atas judulnya.
          const label = baris.find(
            (b) => b.y < judul.y && judul.y - b.y < judul.h * 3.5 && LABEL_BAB.test(b.teks.replace(/\s+/g, ""))
          );
          const teks = judul.teks.replace(/\s{2,}/g, " ").trim().slice(0, 90);
          // Judul yang sama di halaman berturut-turut (unit yang tumpah ke
          // halaman berikutnya) cuma ditulis sekali.
          if (teks && !(hasil.length && hasil[hasil.length - 1].judul === teks)) {
            hasil.push({
              hal: n,
              judul: teks,
              label: label ? rapikanLabel(label.teks).slice(0, 24) : undefined,
              utama: !!label,
              anak: [],
            });
          }
        }

        /* [ebook-daftar-isi-subunit-v1] Sub-bagian dikumpulkan di SETIAP
           halaman, juga halaman yang tak punya judul unit: "Kosakata unit ini"
           hampir selalu tumpah ke halaman kedua sebuah unit, dan di sana
           induknya adalah unit yang barusan dicatat. */
        const induk = hasil[hasil.length - 1];
        if (!induk) continue;
        baris.forEach((b, i) => {
          // Kepala unit (judul asing yang miring + kalimat tujuan) duduk persis
          // di bawah judulnya dan bukan bagian isi — dilewati lewat urutan baris
          // sekaligus jaraknya, supaya judul unit yang terpaksa dua baris tak
          // menyeret sub-judul palsu ikut masuk.
          if (judul && (i <= idxJudul + 1 || b.y - judul.y < judul.h * 2.2)) return;
          // Sekecil badan teks = paragraf; sebesar judul unit = bab, bukan anak.
          if (b.h < tengah * 0.93 || b.h >= ambang) return;
          // Kepala tabel dilaporkan sebagai satu baris berisi banyak kolom.
          if (b.segmen.length > 1) return;
          const teks = b.teks.replace(/\s{2,}/g, " ").trim();
          if (teks.length < 2 || teks.length > 70 || !/\p{L}/u.test(teks)) return;
          // Dua penanda judul bagian di modul Linguo: dicetak KAPITAL SEMUA
          // (h3 "KOSAKATA UNIT INI"), atau keluarga hurufnya beda dari badan
          // teks (judul kotak tata bahasa — ukurannya sama persis dengan badan
          // teks, jadi tinggi saja tak cukup).
          const kapital = !/\p{Ll}/u.test(teks);
          const bedaKeluarga = !!b.fam && !!famBadan && b.fam !== famBadan;
          if (!kapital && !bedaKeluarga) return;
          // Kalimat tebal di tengah latihan berakhir dengan titik; judul tidak.
          if (!kapital && /[.,;:!?]$/.test(teks)) return;
          if (induk.judul === teks || induk.anak[induk.anak.length - 1]?.judul === teks) return;
          induk.anak.push({ hal: n, judul: teks });
        });
      }
      setBab(hasil);
    } finally {
      setMemindai(false);
    }
  }, [ambilTeks, memindai, LABEL_BAB]);

  /* Perangkat bertetikus saja — lihat catatan pada `tepiSiap`. */
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const ubah = () => setTepiSiap(mq.matches);
    ubah();
    mq.addEventListener("change", ubah);
    return () => mq.removeEventListener("change", ubah);
  }, []);

  /* Panel dibuka → tepi kiri berhenti menawarkan diri (tombolnya sudah di sana). */
  useEffect(() => { if (daftarBuka) setTepiHover(false); }, [daftarBuka]);

  const bukaDaftar = useCallback(() => {
    setDaftarBuka(true);
    setBabBuka(undefined);
    if (!bab) void pindaiDaftar();
  }, [bab, pindaiDaftar]);

  /* ── garis waktu daftar isi ───────────────────────────────────────────
     [ebook-daftar-isi-timeline-v1] Daftar isi datar cuma menjawab "unit ini
     ada di halaman berapa". Yang ditanya siswa saat membuka panelnya biasanya
     lebih dari itu: "aku sekarang di mana, dan sisa berapa lagi?" — jadi tiap
     entri dipasangi rentang halaman dan rel progres, dan bab yang sedang
     dibaca menunjukkan posisi di DALAM babnya sendiri. */
  const garisWaktu = useMemo<BabRentang[]>(() => {
    if (!bab?.length || !total) return [];
    return bab.map((b, i) => ({ ...b, sampai: Math.max(b.hal, (bab[i + 1]?.hal ?? total + 1) - 1) }));
  }, [bab, total]);

  /** Halaman paling kiri yang sedang tampil — acuan "kamu di sini". */
  const halKini = tampil.kiri ?? tampil.kanan ?? 1;
  /** Halaman terakhir yang tampak: bentangan dua halaman berarti 2 sudah terbaca. */
  const halTerbaca = tampil.kanan ?? tampil.kiri ?? 1;

  /** Bab keberapa yang sedang dibaca (-1 = masih di depan bab pertama). */
  const idxAktif = useMemo(() => {
    let k = -1;
    garisWaktu.forEach((b, i) => { if (b.hal <= halKini) k = i; });
    return k;
  }, [garisWaktu, halKini]);

  const persenBaca = total ? Math.min(100, Math.round((halTerbaca / total) * 100)) : 0;

  /** Progres di dalam bab yang sedang dibaca (%). */
  const persenBab = useMemo(() => {
    const b = garisWaktu[idxAktif];
    if (!b) return 0;
    const isi = b.sampai - b.hal + 1;
    return Math.min(100, Math.round(((halTerbaca - b.hal + 1) / isi) * 100));
  }, [garisWaktu, idxAktif, halTerbaca]);

  /** Sub-bagian keberapa di bab aktif yang sedang dibaca (-1 = belum sampai). */
  const idxAnak = useMemo(() => {
    const b = garisWaktu[idxAktif];
    if (!b) return -1;
    let k = -1;
    b.anak.forEach((a, i) => { if (a.hal <= halTerbaca) k = i; });
    return k;
  }, [garisWaktu, idxAktif, halTerbaca]);

  /* Bab yang sedang dibaca membentang sendiri begitu daftarnya siap — yang
     dicari siswa saat membuka panel hampir selalu ada di dalam bab itu. */
  useEffect(() => {
    if (!daftarBuka || memindai || idxAktif < 0) return;
    setBabBuka((s) => (s === undefined ? idxAktif : s));
  }, [daftarBuka, memindai, idxAktif]);

  /* Panel dibuka di unit 7 tapi daftarnya mulai dari unit 1 — barisnya digulung
     sendiri supaya "kamu di sini" tak perlu dicari. */
  const babAktifRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (!daftarBuka || memindai || idxAktif < 0) return;
    const el = babAktifRef.current;
    if (!el) return;
    const id = window.setTimeout(() => el.scrollIntoView({ block: "center" }), 40);
    return () => window.clearTimeout(id);
  }, [daftarBuka, memindai, idxAktif, garisWaktu.length]);

  /* [ebook-isi-lompat-v1] Ketukan layar → halaman mana yang kena + titiknya
     dalam satuan halaman (skala 1). Dipakai dua fitur sekaligus: ketuk kata dan
     ketuk baris daftar isi cetak, jadi normalisasinya cuma ditulis sekali. */
  const titikHal = useCallback((box: DOMRect, clientX: number, clientY: number) => {
    if (balik || !ukuran || skalaTampil <= 0 || !box.height || !ph) return null;
    // Kotak buku bisa sedang diskalakan CSS (cubitan belum diraster ulang), jadi
    // ketukan dinormalkan dulu ke ukuran halaman yang sebenarnya. Pembaginya
    // TINGGI, bukan lebar: tinggi tak pernah ikut digencet flex, jadi angkanya
    // sahih walau tata letaknya berubah.
    const tampak = box.height / ph;
    const fx = (clientX - box.left) / tampak;
    const fy = (clientY - box.top) / tampak;

    let hal = tampil.kiri ?? tampil.kanan;
    let xh = fx;
    if (dua) {
      if (fx > pw + GAP / 2) { hal = tampil.kanan; xh = fx - pw - GAP; }
      else hal = tampil.kiri;
    }
    if (!hal) return null;
    return {
      hal,
      xp: xh / skalaTampil,
      yp: fy / skalaTampil,
      /** Geseran mendatar halaman ini di dalam kotak buku — untuk menggambar sorotan. */
      kiriSlot: dua && hal === tampil.kanan ? pw + GAP : 0,
    };
  }, [balik, ukuran, skalaTampil, ph, pw, dua, tampil]);

  /* [ebook-tts-ketuk-kata-v1] Koordinat ketukan → kata + kalimat yang layak
     dibunyikan. Dipakai dua kali: waktu jari MENYENTUH halaman (prasiapan
     audio) dan waktu klik-nya benar-benar jadi. null = tak ada yang perlu
     diubah di popup, "kosong" = ketukan mendarat di luar teks. */
  type Ketuk = {
    unit: string; kalimat: string; terjemahan: boolean;
    ucap: { hal: number; kata: string; kalimat: string; x: number; y: number; w: number; h: number; terjemahan: boolean };
  };
  const resolusiKetuk = useCallback(async (
    box: DOMRect, clientX: number, clientY: number
  ): Promise<Ketuk | "kosong" | null> => {
    if (!ttsAktif || !kodeBahasa) return null;
    const titik = titikHal(box, clientX, clientY);
    if (!titik) return null;
    const { hal, xp, yp, kiriSlot } = titik;

    const { items, baris } = await ambilTeks(hal);
    const kena = items.find(
      (it) => xp >= it.x - 1 && xp <= it.x + it.w + 1 && yp >= it.y - 1 && yp <= it.y + it.h + 1
    );
    const kata = kena ? kataDi(kena, xp) : null;
    if (!kena || !kata) return "kosong";

    // Kalimatnya diambil dari BARIS tempat kata itu duduk, bukan dari potongan
    // teksnya — lihat catatan pada tipe Baris.
    const barisKena = baris.find((b) => Math.abs(b.y - kena.y) <= Math.max(b.h, kena.h) * 0.6);
    // Di baris tabel, yang dipakai adalah SEL tempat katanya duduk — lihat Segmen.
    const sel = barisKena?.segmen.find((g) => xp >= g.x0 - 2 && xp <= g.x1 + 2);
    const kalimat = kalimatTarget(sel?.teks ?? barisKena?.teks ?? kena.str, kodeBahasa);
    /* [ebook-tts-frasa-v1] "buenos días" dibunyikan sebagai satu satuan, bukan
       "buenos" saja — lihat catatan pada frasaSel. Sorotannya ikut melebar ke
       seluruh sel supaya jelas yang dibunyikan memang keduanya. */
    let frasa = sel ? frasaSel(sel.teks, kata.kata) : "";
    // Satu kata Indonesia di dalamnya sudah cukup membatalkan frasa: kolom arti
    // ("senang berkenalan") tak boleh ikut dibunyikan berlogat bahasa target.
    if (frasa && frasa.split(/[^\p{L}\p{N}'’-]+/u).some((w) => w && kataIndonesia(w, kodeBahasa, frasa))) frasa = "";
    const unit = frasa || kata.kata;
    const kotak = frasa && sel
      ? { x: sel.x0, w: Math.max(6, sel.x1 - sel.x0) }
      : { x: kata.x, w: Math.max(6, kata.w) };
    /* Kata bahasa Indonesia (baris terjemahan/penjelasan) tidak dibunyikan dan
       tidak dicarikan arti: bahasa Indonesia berlogat Spanyol justru yang paling
       tidak boleh ditiru siswa A1. Ketukannya tetap ditandai supaya tak terasa
       seperti tombol rusak.

       [ebook-jaga-bahasa-id-v2] Konteksnya SEL dulu, barisnya belakangan: di
       tabel kosakata, sel adalah satu kolom penuh ("Januari"), sementara di
       paragraf penjelasan sel = barisnya sendiri. Kata yang tak bisa dipastikan
       dari dirinya sendiri ("lengkap") diputuskan dari klausa tempat ia duduk —
       lihat kataIndonesia di lib/ebookTts. */
    const konteks = sel?.teks || barisKena?.teks || kena.str;
    const terjemahan = kataIndonesia(kata.kata, kodeBahasa, konteks);
    return {
      unit,
      kalimat,
      terjemahan,
      ucap: {
        hal,
        kata: unit,
        kalimat,
        x: kiriSlot + kotak.x * skalaTampil,
        y: kena.y * skalaTampil,
        w: kotak.w * skalaTampil,
        h: kena.h * skalaTampil,
        terjemahan,
      },
    };
  }, [ttsAktif, kodeBahasa, skalaTampil, titikHal, ambilTeks, kataDi]);

  /* ── daftar isi cetak yang bisa diketuk ───────────────────────────────
     [ebook-isi-lompat-v1] Halaman "Daftar isi" di dalam modul dulu cuma gambar:
     siswa membacanya, lalu mengetik nomornya sendiri di kotak lompat halaman.
     Sekarang barisnya diketuk langsung.

     Tautan PDF sungguhan tak bisa dipakai: modul dicetak Chromium dengan
     --no-pdf-header-footer dan halamannya tak beranotasi sama sekali (lihat
     [ebook-daftar-isi-cetak-v1] di scripts/build-ebook-pdf.mjs), lagipula
     modul yang sudah terbit tak akan dicetak ulang. Barisnya dikenali dari
     BENTUKNYA: kolom paling kanan berisi angka saja, kolom pertama berhuruf.
     Nomor pada daftar isi memang nomor halaman PDF — perakitnya membaca balik
     PDF hasil putaran pertama untuk mengisinya. */
  const isiRef = useRef<Map<number, BarisIsi[]>>(new Map());
  const ambilDaftarIsi = useCallback(async (n: number): Promise<BarisIsi[]> => {
    const ada = isiRef.current.get(n);
    if (ada) return ada;
    const { baris } = await ambilTeks(n);
    const calon: { y: number; h: number; x0: number; x1: number; judul: string; hal: number }[] = [];
    for (const b of baris) {
      const awal = b.segmen[0];
      const akhir = b.segmen[b.segmen.length - 1];
      if (b.segmen.length < 2 || !awal || !akhir) continue;
      if (!/^\d{1,4}$/.test(akhir.teks)) continue;   // kolom nomor halaman
      if (!/\p{L}/u.test(awal.teks)) continue;       // kolom judul
      const hal = Number(akhir.teks);
      if (!total || hal < 1 || hal > total) continue;
      calon.push({
        y: b.y, h: b.h, x0: awal.x0, x1: akhir.x1, hal,
        judul: b.segmen.slice(0, -1).map((g) => g.teks).join(" "),
      });
    }
    /* Pagar terhadap salah kenal: tabel kosakata pun berkolom dua dan kadang
       berangka. Daftar isi punya dua ciri yang tak dimiliki tabel biasa —
       minimal tiga baris bernomor, dan nomornya menanjak dari atas ke bawah. */
    const sah = calon.length >= 3 && calon.every((c, i) => i === 0 || c.hal >= calon[i - 1].hal);
    const x0 = Math.min(...calon.map((c) => c.x0));
    const x1 = Math.max(...calon.map((c) => c.x1));
    const hasil: BarisIsi[] = !sah ? [] : calon.map((c, i) => {
      /* Kotaknya membentang sampai tepat di atas baris berikutnya, supaya judul
         asing yang dicetak miring di bawah judul Indonesianya ("¡Hola! ¿Cómo te
         llamas?") membuka halaman yang sama, bukan jadi lubang mati. Dibatasi
         3,2x tinggi huruf supaya baris TERAKHIR daftar tak menelan sisa
         halaman yang kosong. */
      const bawah = calon[i + 1] ? calon[i + 1].y - 1 : c.y + c.h * 2.4;
      return {
        hal: c.hal,
        judul: c.judul,
        x0: x0 - 4,
        x1: x1 + 4,
        y0: c.y - c.h * 0.35,
        y1: Math.max(c.y + c.h, Math.min(bawah, c.y + c.h * 3.2)),
      };
    });
    isiRef.current.set(n, hasil);
    return hasil;
  }, [ambilTeks, total]);

  /** Ketukan/tunjukan tetikus → baris daftar isi yang kena + sorotannya (px layar). */
  const isiDiTitik = useCallback(async (
    box: DOMRect, clientX: number, clientY: number
  ): Promise<{ hal: number; x: number; y: number; w: number; h: number } | null> => {
    const titik = titikHal(box, clientX, clientY);
    if (!titik) return null;
    const daftar = await ambilDaftarIsi(titik.hal);
    if (!daftar.length) return null;
    const kena = daftar.find(
      (r) => titik.xp >= r.x0 && titik.xp <= r.x1 && titik.yp >= r.y0 && titik.yp <= r.y1
    );
    if (!kena || kena.hal === titik.hal) return null; // barisnya menunjuk dirinya sendiri
    return {
      hal: kena.hal,
      x: titik.kiriSlot + kena.x0 * skalaTampil,
      y: kena.y0 * skalaTampil,
      w: (kena.x1 - kena.x0) * skalaTampil,
      h: (kena.y1 - kena.y0) * skalaTampil,
    };
  }, [titikHal, ambilDaftarIsi, skalaTampil]);

  /* Baris daftar isi yang sedang ditunjuk tetikus — cuma sorotan, bukan keadaan
     yang perlu bertahan. Titik terakhir disimpan supaya mousemove yang beruntun
     tak memanggil ulang pencariannya tiap piksel. */
  const [isiSorot, setIsiSorot] = useState<{ hal: number; x: number; y: number; w: number; h: number } | null>(null);
  const titikTetikusRef = useRef({ x: -1, y: -1 });
  const onGerakTeks = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!tepiSiap) return; // layar sentuh tak punya "menunjuk"
    const { clientX, clientY } = e;
    const lalu = titikTetikusRef.current;
    if (Math.abs(clientX - lalu.x) < 3 && Math.abs(clientY - lalu.y) < 3) return;
    titikTetikusRef.current = { x: clientX, y: clientY };
    const box = e.currentTarget.getBoundingClientRect();
    void isiDiTitik(box, clientX, clientY).then((r) => {
      setIsiSorot((s) => (r?.hal === s?.hal && r?.y === s?.y ? s : r));
    });
  }, [tepiSiap, isiDiTitik]);

  /* [tts-prasiap-v1] Jari menyentuh halaman → audionya sudah mulai disiapkan,
     jauh sebelum `click` menyala (di ponsel jaraknya ratusan milidetik). Cuma
     mengambil yang sudah ada di cache bersama; sentuhan yang ternyata cuma
     geseran halaman tak boleh menagih sintesis baru. */
  const onSentuhTeks = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!ttsAktif || !kodeBahasa) return;
    const box = e.currentTarget.getBoundingClientRect();
    const { clientX, clientY } = e;
    void resolusiKetuk(box, clientX, clientY).then((r) => {
      if (!r || r === "kosong" || r.terjemahan) return;
      siapkanEbook(r.unit, kodeBahasa);
    });
  }, [ttsAktif, kodeBahasa, resolusiKetuk]);

  const onKlikTeks = useCallback(async (e: React.MouseEvent<HTMLDivElement>) => {
    if (abaikanKlikRef.current) { abaikanKlikRef.current = false; return; }
    // Masih di dalam gerakan pengguna — lihat catatan di ebookTts. WAJIB sebelum
    // await pertama: sesudahnya Safari sudah tak menganggapnya gerakan pengguna.
    if (ttsAktif && kodeBahasa) bukaKunciAudio();
    const box = e.currentTarget.getBoundingClientRect();
    const { clientX, clientY } = e;
    /* [ebook-isi-lompat-v1] Baris daftar isi didahulukan: barisnya bukan bahan
       bacaan, jadi tak perlu ikut dibunyikan — dan lompatannya harus tetap
       jalan di modul yang bahasanya belum punya suara. */
    const isiKena = await isiDiTitik(box, clientX, clientY);
    if (isiKena) {
      setUcap(null);
      setIsiSorot(null);
      hentikanEbookTts();
      ke(isiKena.hal);
      return;
    }
    if (!ttsAktif || !kodeBahasa) return;
    const r = await resolusiKetuk(box, clientX, clientY);
    if (!r) return;
    if (r === "kosong") { setUcap(null); return; }
    const { unit, kalimat, terjemahan } = r;
    setUcap(r.ucap);
    if (terjemahan) { setArti(undefined); return; }

    // Arti & bunyi jalan BARENGAN: suara adalah alasan utama fitur ini ada, dan
    // tak boleh ikut menunggu AI yang butuh satu-dua detik.
    const kunciArti = `${unit}|${kalimat}`;
    ucapKunciRef.current = kunciArti;
    setArti(artiTersimpan(unit, kalimat, kodeBahasa));
    void artiKataEbook(unit, kalimat, kodeBahasa).then((a) => {
      // Siswa mungkin sudah mengetuk kata lain — jangan timpa popup yang baru.
      if (ucapKunciRef.current === kunciArti) setArti(a);
    });
    setBunyi("kata");
    await ucapkanEbook(unit, kodeBahasa);
    setBunyi(null);
  }, [ttsAktif, kodeBahasa, resolusiKetuk, isiDiTitik, ke]);

  const ucapkanLagi = useCallback(async (teks: string, jenis: "kata" | "kalimat") => {
    if (!kodeBahasa) return;
    bukaKunciAudio();
    setBunyi(jenis);
    await ucapkanEbook(teks, kodeBahasa);
    setBunyi(null);
  }, [kodeBahasa]);

  // Pindah halaman / ganti tata letak → sorotan kata ikut hilang.
  useEffect(() => { setUcap(null); setIsiSorot(null); hentikanEbookTts(); }, [page, dua]);

  useEffect(() => {
    ucapRef.current = !!ucap;
    if (!ucap) { setArti(undefined); ucapKunciRef.current = ""; }
  }, [ucap]);

  const isi = (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-sm">
      {/* bilah atas */}
      <div className="flex shrink-0 items-center gap-3 border-b border-white/10 px-3 py-2.5 sm:px-5">
        {/* [ebook-daftar-isi-tepi-v1] Dulu tombol ini cuma ikon telanjang
            setinggi 32 px yang meleleh ke bilah hitam — dicari dulu baru bisa
            diklik. Sekarang berbingkai, lebih tinggi, dan tulisannya muncul
            jauh lebih awal (sm, bukan lg). */}
        <button
          onClick={bukaDaftar}
          data-panduan="daftar"
          className="flex h-9 shrink-0 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.07] px-3 text-white/80 transition hover:border-[#3ED9C0]/60 hover:bg-white/15 hover:text-white active:scale-[0.97]"
          aria-label={t("Daftar isi")}
          title={t("Daftar isi")}
        >
          <List className="h-[18px] w-[18px]" />
          <span className="hidden text-[12.5px] font-bold sm:inline">{t("Daftar isi")}</span>
        </button>
        <BookOpen className="hidden h-5 w-5 shrink-0 text-[#3ED9C0] sm:block" />
        <h2 className="min-w-0 flex-1 truncate text-[14px] font-bold text-white sm:text-[15px]">{title}</h2>
        <div data-panduan="zoom" className="hidden items-center gap-1 sm:flex">
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
          {/* [ebook-zoom-kotak-v1] Dulu angka persen cuma pajangan: dari 100%
              ke 250% harus menekan + tujuh kali. Sekarang angkanya bisa
              diketik langsung. */}
          {ketikZoom !== null ? (
            <form onSubmit={(e) => { e.preventDefault(); terapkanKetikZoom(); }}>
              <input
                autoFocus
                value={ketikZoom}
                inputMode="numeric"
                onChange={(e) => setKetikZoom(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
                onBlur={terapkanKetikZoom}
                onKeyDown={(e) => { if (e.key === "Escape") setKetikZoom(null); }}
                className="w-14 rounded-md bg-white/10 px-1 py-1 text-center text-[12px] font-bold text-white outline-none ring-1 ring-white/20 focus:ring-[#3ED9C0]"
                aria-label={t("Ukuran tampilan (persen)")}
              />
            </form>
          ) : (
            <button
              onClick={() => setKetikZoom(String(Math.round(zoomLive * 100)))}
              className="w-14 rounded-md py-1 text-center text-[12px] font-bold text-white/70 transition hover:bg-white/10 hover:text-white"
              title={t("Ketik ukuran tampilan")}
            >
              {Math.round(zoomLive * 100)}%
            </button>
          )}
          <button
            onClick={() => aturZoom(zoomLiveRef.current + ZOOM_STEP, true)}
            className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label={t("Perbesar")}
          >
            <Plus className="h-4 w-4" />
          </button>
          {/* Paskan = kembali ke 100%, yaitu satu bentangan utuh yang muat
              di layar (lihat [ebook-reader-fit-v1]). */}
          <button
            onClick={() => aturZoom(1, true)}
            disabled={Math.round(zoomLive * 100) === 100}
            className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label={t("Paskan ke layar")}
            title={t("Paskan ke layar")}
          >
            <Scan className="h-4 w-4" />
          </button>
        </div>
        {/* [ebook-panduan-tour-v1] Tombolnya duduk di bilah atas, bukan di menu
            tersembunyi: panduan yang harus dicari dulu tak menolong orang yang
            sedang bingung. */}
        <button
          onClick={() => setTur("penuh")}
          data-panduan="panduan"
          className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
          aria-label={t("Panduan pemakaian")}
          title={t("Panduan pemakaian")}
        >
          <HelpCircle className="h-4 w-4" />
        </button>
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
        {memuat && tundaMemuat && (
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
              cursor: ttsAktif || isiSorot ? "pointer" : undefined,
            }}
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={onSentuhTeks}
            onMouseMove={onGerakTeks}
            onMouseLeave={() => setIsiSorot(null)}
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
            {/* Lipatan tengah — bayangannya sengaja tipis dan TANPA celah:
                versi lama menggelapkan 20px di tengah bentangan dan di layar
                terang terbaca sebagai garis hitam yang membelah halaman. */}
            {dua && (
              <div
                aria-hidden
                className="pointer-events-none absolute top-0 h-full"
                style={{
                  // Di ATAS lembar yang berputar (z-5). Kalau di bawahnya,
                  // separuh lipatan tertutup kertas selama animasi lalu muncul
                  // lagi seketika waktu lembarnya dicabut — persis kedipan
                  // bayangan yang terlihat di sisi dalam halaman kiri.
                  zIndex: 6,
                  left: pw - 8,
                  width: 16,
                  background:
                    "linear-gradient(90deg, rgba(15,23,42,0) 0%, rgba(15,23,42,0.05) 45%, rgba(15,23,42,0.07) 50%, rgba(15,23,42,0.05) 55%, rgba(15,23,42,0) 100%)",
                }}
              />
            )}

            {/* lembar yang sedang dibalik */}
            {balik && (
              <div
                /* key ikut tujuan: kalau siswa menahan panah, lembar berikutnya
                   memasang elemen BARU — elemen yang dipakai ulang tidak
                   mengulang animasinya dan halamannya terlihat lompat. */
                key={`daun-${balik.arah}-${balik.tujuan.kiri ?? 0}-${balik.tujuan.kanan ?? 0}`}
                className={`ebook-flipper ${balik.arah > 0 ? "maju" : "mundur"}`}
                /* Animasinya sendiri yang mengabari kapan kertas mendarat.
                   Jam setTimeout selalu meleset beberapa frame dari animasi CSS
                   — kalau kecepetan, lembarnya dicabut sebelum rebah dan itu
                   yang terlihat sebagai kedipan di ujung balikan. */
                onAnimationEnd={(e) => {
                  if (e.target !== e.currentTarget) return;
                  if (!e.animationName.startsWith("ebook-ma") && !e.animationName.startsWith("ebook-mu")) return;
                  selesaiBalikRef.current?.();
                }}
                style={{
                  left: dua && balik.arah > 0 ? pw + GAP : 0,
                  width: pw,
                  height: ph,
                  transformOrigin: balik.arah > 0 ? "left center" : "right center",
                  animationDuration: `${DURASI_BALIK}ms`,
                  "--ebook-durasi": `${DURASI_BALIK}ms`,
                } as React.CSSProperties}
              >
                {/* Sudut kertas disamakan dengan slot tempatnya mendarat.
                    Lembar bersudut siku yang rebah di atas halaman bersudut
                    tumpul membuat kedua ujung luarnya "menyiku" sesaat lalu
                    membulat lagi begitu lembarnya dicabut. Muka punggung ikut
                    nilai yang sama: ia tercermin 180deg, jadi sisi CSS-nya
                    tertukar dengan yang terlihat. */}
                <div className="ebook-muka">
                  <canvas
                    ref={depanRef}
                    className="ebook-hal bg-white"
                    style={{ width: pw, height: ph, borderRadius: sudutDaun }}
                  />
                  {/* Muka depan = halaman yang sedang ditinggalkan. */}
                  {gambarTirai(dua ? (balik.arah > 0 ? tampil.kanan : tampil.kiri) : tampil.kiri, 0, true)}
                  <div className="ebook-bayang" style={{ borderRadius: sudutDaun }} />
                </div>
                <div className="ebook-muka ebook-punggung">
                  <canvas
                    ref={belakangRef}
                    className="ebook-hal bg-white"
                    style={{ width: pw, height: ph, borderRadius: sudutDaun }}
                  />
                  {/* Punggung = halaman baru yang tersingkap di balik kertas. */}
                  {gambarTirai(
                    dua
                      ? (balik.arah > 0 ? balik.tujuan.kiri : balik.tujuan.kanan)
                      : (balik.tujuan.kiri ?? balik.tujuan.kanan),
                    0,
                    true,
                  )}
                  <div className="ebook-bayang balik" style={{ borderRadius: sudutDaun }} />
                </div>
              </div>
            )}

            {/* [ebook-kunci-tertutup-v1] tirai kunci jawaban.
                [ebook-kunci-tirai-saat-balik-v1] Waktu lembar berputar, slot
                kiri/kanan tidak selalu memegang halaman yang sedang "tampil":
                yang maju sudah memasang halaman baru di kanan, yang mundur di
                kiri. Tirainya ikut nomor halaman yang BENAR-BENAR tergambar di
                slot itu, kalau tidak ia menutup tempat yang salah. */}
            {(() => {
              const kiriHal = balik
                ? (dua ? (balik.arah > 0 ? tampil.kiri : balik.tujuan.kiri) : (balik.tujuan.kiri ?? balik.tujuan.kanan))
                : tampil.kiri;
              const kananHal = balik ? (balik.arah > 0 ? balik.tujuan.kanan : tampil.kanan) : tampil.kanan;
              return (
                <>
                  {gambarTirai(kiriHal, 0, !!balik)}
                  {dua && gambarTirai(kananHal, pw + GAP, !!balik)}
                </>
              );
            })()}

            {/* [ebook-isi-lompat-v1] Baris daftar isi yang sedang ditunjuk. Tanpa
                sorotan ini halamannya terlihat seperti gambar mati — tak ada
                yang memberi tahu barisnya bisa diketuk. */}
            {isiSorot && !balik && (
              <span
                aria-hidden
                className="pointer-events-none absolute z-10 rounded-md"
                style={{
                  left: isiSorot.x,
                  top: isiSorot.y,
                  width: isiSorot.w,
                  height: isiSorot.h,
                  background: "rgba(62,217,192,0.16)",
                  boxShadow: "inset 0 0 0 1px rgba(26,158,158,0.45)",
                }}
              />
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
                {/* [ebook-popup-kata-v1] Kartu kata — bentuknya sengaja meniru
                    balon kata Watch and Learn: kata + kelas kata + artinya, lalu
                    dua tombol suara. Dulu isinya cuma nama katanya sendiri, jadi
                    siswa yang tak paham artinya tetap harus membuka kamus. */}
                <div
                  className={`pointer-events-auto absolute w-[252px] -translate-x-1/2 rounded-2xl bg-[#0A1212]/97 p-3 text-white shadow-2xl ring-1 ring-white/15 ${
                    ucap.y > 170 ? "-translate-y-full" : ""
                  }`}
                  style={{
                    left: Math.min(Math.max(ucap.x + ucap.w / 2, 132), Math.max(132, lebarBuku - 132)),
                    // Di baris paling atas halaman, kartunya ditaruh DI BAWAH kata —
                    // di atas berarti keluar dari kertas.
                    top: ucap.y > 170 ? ucap.y - 10 : ucap.y + ucap.h + 10,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {ucap.terjemahan ? (
                    <p className="text-[12px] font-semibold leading-snug text-white/70">
                      {t("Yang bisa dibunyikan hanya teks")} {langLabel(kodeBahasa)}.
                    </p>
                  ) : (
                    <>
                      <div className="flex items-start gap-2">
                        <button
                          onClick={() => void ucapkanLagi(ucap.kata, "kata")}
                          className="flex min-w-0 flex-1 items-center gap-2 text-left"
                          title={t("Dengar pelafalannya")}
                        >
                          {bunyi === "kata"
                            ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#3ED9C0]" />
                            : <Volume2 className="h-4 w-4 shrink-0 text-[#3ED9C0]" />}
                          <span className="truncate text-[16px] font-extrabold leading-tight">{ucap.kata}</span>
                        </button>
                        {arti && arti !== "mati" && arti.kelas && (
                          <span className="shrink-0 rounded-md bg-[#3ED9C0]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#7fe3e0]">
                            {arti.kelas}
                          </span>
                        )}
                        <button
                          onClick={() => setUcap(null)}
                          className="shrink-0 rounded-md p-0.5 text-white/35 transition hover:bg-white/10 hover:text-white"
                          aria-label={t("Tutup")}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Baris arti hilang sepenuhnya waktu layanannya memang
                          sedang mati (kuota AI habis) — popupnya menyusut jadi
                          kartu pelafalan, bukan kartu berisi pesan galat. */}
                      {arti !== "mati" && (
                        <div className="mt-1.5 text-[12.5px] font-medium leading-snug text-white/80">
                          {arti === undefined ? (
                            <span className="inline-flex items-center gap-1.5 text-white/35">
                              <Loader2 className="h-3 w-3 animate-spin" /> {t("Mencari arti…")}
                            </span>
                          ) : arti ? (
                            <>
                              {arti.arti}
                              {arti.dasar && (
                                <span className="text-white/40"> · {t("bentuk dasar")}: {arti.dasar}</span>
                              )}
                            </>
                          ) : (
                            /* Arti gagal dimuat BUKAN alasan menutup popup: bunyinya —
                               bagian yang paling dibutuhkan — tetap jalan. */
                            <span className="text-white/30">{t("Arti belum bisa dimuat")}</span>
                          )}
                        </div>
                      )}

                      {ucap.kalimat && kalimatLayakDibunyikan(ucap.kata, ucap.kalimat) && (
                        <>
                          <p className="mt-2 border-t border-white/10 pt-2 text-[11.5px] italic leading-snug text-white/45 line-clamp-3">
                            {ucap.kalimat}
                          </p>
                          <button
                            onClick={() => void ucapkanLagi(ucap.kalimat, "kalimat")}
                            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-white/10 px-2 py-1.5 text-[12px] font-bold text-white/85 transition hover:bg-white/20 hover:text-white"
                          >
                            {bunyi === "kalimat"
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Play className="h-3.5 w-3.5" fill="currentColor" />}
                            {t("Putar kalimat")}
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* bilah bawah — [ebook-navigasi-halaman-v1] dulu isinya cuma dua panah &
          nomor halaman: satu-satunya cara sampai ke halaman 28 adalah membalik
          14 kali. Sekarang ada penggeser (tarik untuk menyusur cepat) dan nomor
          halaman yang bisa DIKETIK. */}
      {!galat && (
        <div data-panduan="navigasi" className="flex shrink-0 items-center gap-2 border-t border-white/10 px-3 py-2 sm:px-4">
          {/* Di layar sempit tombol daftar isi di bilah atas ikut menyempit —
              di sini letaknya justru dekat ibu jari. */}
          <button
            onClick={bukaDaftar}
            className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white lg:hidden"
            aria-label={t("Daftar isi")}
          >
            <List className="h-5 w-5" />
          </button>
          <button
            onClick={() => void balikKe(-1)}
            disabled={halPertama <= 1}
            className="shrink-0 rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
            aria-label={t("Halaman sebelumnya")}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <input
            type="range"
            min={1}
            max={Math.max(1, total)}
            value={tarik ?? halPertama}
            disabled={!total}
            // Halamannya baru benar-benar pindah waktu jari DILEPAS: merender
            // tiap halaman yang terlewati selama tarikan bikin penggesernya
            // tersendat dan boros memori bitmap.
            onChange={(e) => setTarik(Number(e.target.value))}
            onPointerUp={komitTarik}
            onTouchEnd={komitTarik}
            onKeyUp={komitTarik}
            onBlur={komitTarik}
            className="ebook-geser min-w-0 flex-1"
            aria-label={t("Geser ke halaman")}
          />

          {lompat !== null ? (
            <form
              className="flex shrink-0 items-center gap-1"
              onSubmit={(e) => { e.preventDefault(); lompatKe(); }}
            >
              <input
                autoFocus
                value={lompat}
                inputMode="numeric"
                onChange={(e) => setLompat(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
                onBlur={() => setLompat(null)}
                onKeyDown={(e) => { if (e.key === "Escape") setLompat(null); }}
                placeholder="…"
                className="w-14 rounded-md bg-white/10 px-2 py-1 text-center text-[13px] font-bold text-white outline-none ring-1 ring-white/20 placeholder:text-white/25 focus:ring-[#3ED9C0]"
                aria-label={t("Lompat ke halaman")}
              />
              <span className="text-[12px] font-semibold text-white/40">/ {total || "—"}</span>
              {/* onMouseDown ditahan: tanpa itu, blur kotak isian lebih dulu
                  menutup formulir sebelum kliknya sempat mendarat. */}
              <button
                type="submit"
                onMouseDown={(e) => e.preventDefault()}
                className="rounded-md p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
                aria-label={t("Buka halaman")}
              >
                <CornerDownLeft className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setLompat("")}
              className="shrink-0 rounded-lg px-2 py-1 text-[13px] font-bold text-white/80 transition hover:bg-white/10 hover:text-white"
              title={t("Lompat ke halaman")}
            >
              {tarik != null ? `${tarik} / ${total}` : nomor}
            </button>
          )}

          <button
            onClick={() => void balikKe(1)}
            disabled={!total || (tampil.kanan ?? tampil.kiri ?? 1) >= total}
            className="shrink-0 rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
            aria-label={t("Halaman berikutnya")}
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* [ebook-latihan-interaktif-v1] Muncul cuma waktu halaman yang
              terbuka masih di dalam unit yang punya latihan — tombol yang
              selalu ada akan menanyakan "latihan yang mana?". */}
          {unitKini && (
            <button
              onClick={() => setKerjakan(unitKini)}
              data-panduan="latihan"
              className="ml-1 flex shrink-0 items-center gap-1.5 rounded-lg bg-[#3ED9C0] px-2.5 py-1.5 text-[12px] font-extrabold text-black transition hover:brightness-95"
              title={t("Kerjakan latihan unit ini")}
            >
              <PenLine className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("Kerjakan latihan")}</span>
              <span className="sm:hidden">Unit {unitKini.no}</span>
            </button>
          )}

          {ttsAktif && (
            <span className="hidden shrink-0 items-center gap-1.5 pl-1 text-[12px] font-semibold text-white/45 xl:flex">
              <Volume2 className="h-3.5 w-3.5" />
              {t("Ketuk kata untuk mendengar pelafalannya")}
            </span>
          )}
        </div>
      )}

      {/* [ebook-daftar-isi-tepi-v1] Zona tepi kiri: tempelkan kursor, tombolnya
          muncul. Lebarnya 14 px — cukup untuk ditemukan tanpa dibidik, tapi tak
          sampai memakan klik pada halaman. Zona & tombolnya satu wadah supaya
          kursor yang berpindah dari zona ke tombol tidak dianggap "keluar". */}
      {tepiSiap && !daftarBuka && !galat && (
        <div
          className="absolute inset-y-0 left-0 z-[55] flex w-[188px] items-center"
          style={{ pointerEvents: "none" }}
        >
          <div
            className="h-full w-[14px] shrink-0"
            style={{ pointerEvents: "auto" }}
            onMouseEnter={() => setTepiHover(true)}
          />
          <div
            className={`-ml-[14px] transition-all duration-200 ${
              tepiHover ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
            }`}
            style={{ pointerEvents: tepiHover ? "auto" : "none" }}
            onMouseLeave={() => setTepiHover(false)}
          >
            <button
              onClick={bukaDaftar}
              className="flex items-center gap-2 rounded-r-2xl border border-l-0 border-white/15 bg-[#0D0D0D]/95 py-3 pl-4 pr-4 text-white shadow-2xl backdrop-blur transition hover:bg-[#14201f]"
            >
              <List className="h-[18px] w-[18px] text-[#3ED9C0]" />
              <span className="text-[12.5px] font-bold">{t("Daftar isi")}</span>
            </button>
          </div>
        </div>
      )}

      {/* [ebook-daftar-isi-v1] Panel daftar isi + lompat halaman.
          [ebook-daftar-isi-timeline-v1] Bentuknya garis waktu: rel menyala dari
          bab pertama sampai bab yang sedang dibaca. */}
      {daftarBuka && (
        <div className="absolute inset-0 z-[60] flex">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setDaftarBuka(false)}
            aria-hidden
          />
          <aside className="relative flex h-full w-[88vw] max-w-[360px] flex-col border-r border-white/10 bg-[#0D0D0D] shadow-2xl">
            <div className="shrink-0 border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <List className="h-4 w-4 text-[#3ED9C0]" />
                <span className="flex-1 text-[13.5px] font-extrabold text-white">{t("Daftar isi")}</span>
                <button
                  onClick={() => setDaftarBuka(false)}
                  className="rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
                  aria-label={t("Tutup")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Progres seluruh modul — angka yang sama dengan bilah bawah,
                  tapi di sini yang dijawab "sisa berapa lagi". */}
              {!!total && (
                <div className="mt-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-white/35">
                      {t("Progres baca")}
                    </span>
                    <span className="text-[11.5px] font-bold tabular-nums text-white/60">
                      {halTerbaca} / {total} · {persenBaca}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[#3ED9C0] transition-[width] duration-300"
                      style={{ width: `${persenBaca}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
              {memindai && (
                <div className="px-2 py-3">
                  <p className="flex items-center gap-2 text-[12.5px] font-semibold text-white/50">
                    <Loader2 className="h-4 w-4 animate-spin text-[#3ED9C0]" />
                    <span className="flex-1">{t("Menyusun daftar isi…")}</span>
                    {!!total && (
                      <span className="text-[11.5px] font-bold tabular-nums text-white/30">
                        {pindaiHal}/{total}
                      </span>
                    )}
                  </p>
                  {!!total && (
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-[#3ED9C0]/70 transition-[width] duration-200"
                        style={{ width: `${Math.round((pindaiHal / total) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {!memindai && bab && bab.length === 0 && (
                <p className="px-2 py-3 text-[12.5px] font-semibold leading-relaxed text-white/45">
                  {t("Modul ini tak punya judul yang bisa dibaca otomatis — pakai penggeser halaman di bilah bawah.")}
                </p>
              )}

              {!memindai && garisWaktu.map((b, i) => {
                const aktif = i === idxAktif;
                const lewat = i < idxAktif;
                // Rel di ATAS titik menyala kalau babnya sudah dilewati ATAU
                // sedang dibaca; rel di BAWAH cuma kalau sudah dilewati — itu
                // yang membuat ujung nyalanya berhenti tepat di posisi siswa.
                const relAtas = lewat || aktif;
                const buka = babBuka === i && b.anak.length > 0;
                return (
                  <div
                    key={`${b.hal}-${b.judul}`}
                    className={`flex w-full gap-2.5 rounded-lg pr-2 transition ${
                      aktif ? "bg-[#3ED9C0]/10" : "hover:bg-white/5"
                    }`}
                  >
                    {/* rel garis waktu */}
                    <span className="flex w-5 shrink-0 flex-col items-center">
                      <span
                        className={`w-px flex-1 ${i === 0 ? "bg-transparent" : relAtas ? "bg-[#3ED9C0]/60" : "bg-white/10"}`}
                      />
                      <span
                        className={`my-1 h-2.5 w-2.5 shrink-0 rounded-full border-2 transition ${
                          aktif
                            ? "border-[#3ED9C0] bg-[#3ED9C0] shadow-[0_0_0_4px_rgba(62,217,192,0.18)]"
                            : lewat
                              ? "border-[#3ED9C0]/70 bg-[#3ED9C0]/70"
                              : "border-white/25 bg-[#0D0D0D]"
                        }`}
                      />
                      <span
                        className={`w-px flex-1 ${
                          i === garisWaktu.length - 1 ? "bg-transparent" : lewat ? "bg-[#3ED9C0]/60" : "bg-white/10"
                        }`}
                      />
                    </span>

                    <div className="min-w-0 flex-1 py-2">
                      <div className="flex items-start gap-2">
                        {/* Ketuk judulnya = lompat KE babnya sekaligus membentangkan
                            isinya: siswa yang menuju unit 6 hampir selalu lanjut
                            mencari bagian di dalamnya. */}
                        <button
                          ref={aktif ? babAktifRef : undefined}
                          onClick={() => { ke(b.hal); setBabBuka(i); }}
                          className="min-w-0 flex-1 text-left"
                        >
                          {b.label && (
                            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#3ED9C0]">
                              {b.label}
                            </span>
                          )}
                          <span
                            className={`block text-[13px] leading-snug ${
                              aktif
                                ? "font-bold text-white"
                                : b.utama
                                  ? `font-bold ${lewat ? "text-white/70" : "text-white/85"}`
                                  : "font-semibold text-white/60"
                            }`}
                          >
                            {b.judul}
                          </span>
                        </button>
                        {/* Nomor halamannya: rentang, bukan satu angka — "Unit 6
                            itu 3 halaman" jawaban yang lebih berguna. */}
                        <span
                          className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10.5px] font-bold tabular-nums ${
                            aktif ? "bg-[#3ED9C0] text-black" : "bg-white/[0.06] text-white/40"
                          }`}
                        >
                          {b.hal === b.sampai ? b.hal : `${b.hal}–${b.sampai}`}
                        </span>
                        {b.anak.length > 0 && (
                          // Tombol tersendiri: membentangkan isi bab TANPA ikut
                          // pindah halaman — mengintip isi unit lain sambil tetap
                          // di halaman sekarang.
                          <button
                            onClick={() => setBabBuka(buka ? null : i)}
                            aria-expanded={buka}
                            aria-label={t("Lihat isi bagian ini")}
                            title={t("Lihat isi bagian ini")}
                            className="-mr-1 shrink-0 rounded-md p-1 text-white/35 transition hover:bg-white/10 hover:text-white/70"
                          >
                            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${buka ? "rotate-180" : ""}`} />
                          </button>
                        )}
                      </div>

                      {aktif && (
                        <span className="mt-1.5 flex items-center gap-2">
                          <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                            <span
                              className="block h-full rounded-full bg-[#3ED9C0] transition-[width] duration-300"
                              style={{ width: `${persenBab}%` }}
                            />
                          </span>
                          <span className="shrink-0 text-[10px] font-extrabold uppercase tracking-wider text-[#3ED9C0]">
                            {t("Kamu di sini")}
                          </span>
                        </span>
                      )}

                      {buka && (
                        <ul className="mt-1.5 space-y-px border-l border-white/10 pl-2">
                          {b.anak.map((a, k) => {
                            const anakAktif = aktif && k === idxAnak;
                            return (
                              <li key={`${a.hal}-${a.judul}-${k}`}>
                                <button
                                  onClick={() => ke(a.hal)}
                                  className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition hover:bg-white/5"
                                >
                                  <span
                                    className={`min-w-0 flex-1 truncate text-[11.5px] leading-snug ${
                                      anakAktif ? "font-bold text-[#3ED9C0]" : "font-semibold text-white/55"
                                    }`}
                                  >
                                    {a.judul}
                                  </span>
                                  <span
                                    className={`shrink-0 text-[10px] font-bold tabular-nums ${
                                      anakAktif ? "text-[#3ED9C0]" : "text-white/30"
                                    }`}
                                  >
                                    {a.hal}
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </aside>
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
        /* Tirai kunci jawaban: buram DAN berlatar kertas. backdrop-filter saja
           tak cukup — di Safari lama filternya diabaikan diam-diam dan
           jawabannya terbaca utuh. */
        .ebook-kunci {
          background: rgba(251, 247, 238, 0.985);
          backdrop-filter: blur(7px);
          -webkit-backdrop-filter: blur(7px);
        }
        .ebook-kunci:hover {
          background: rgba(244, 238, 226, 0.99);
        }
        .ebook-hal {
          display: block;
          box-shadow: 0 18px 40px -12px rgba(0, 0, 0, 0.55);
          /* Sudut piksel canvas kadang jatuh di tengah piksel layar waktu zoom
             bukan kelipatan bulat; backface-visibility memaksa penggambaran
             lewat lapisan sendiri sehingga tepinya tidak bergetar. */
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .ebook-flipper {
          position: absolute;
          top: 0;
          transform-style: preserve-3d;
          -webkit-transform-style: preserve-3d;
          /* Sudut awal ditulis eksplisit: tanpa transform di keadaan diam,
             WebKit baru membangun lapisan 3D-nya pada frame pertama animasi —
             frame itulah yang berkedip di Safari/iPad. */
          transform: rotateY(0deg);
          animation-timing-function: cubic-bezier(0.42, 0.02, 0.32, 1);
          animation-fill-mode: forwards;
          will-change: transform;
          z-index: 5;
        }
        .ebook-flipper.maju { animation-name: ebook-maju; }
        .ebook-flipper.mundur { animation-name: ebook-mundur; }
        /* Kertas yang berputar TIDAK memakai drop shadow halaman. Dua alasan:
           bayangannya ikut diputar 3D sehingga menyapu halaman kiri sebagai
           pita gelap, dan waktu lembar mendarat ia menumpuk di atas bayangan
           slot di bawahnya — begitu lembarnya dicabut, bayangan ganda itu
           kembali tunggal dan kelihatan seperti halaman kiri berkedip.
           Gelap-terangnya lembar diurus .ebook-bayang yang menyapu permukaan. */
        .ebook-flipper .ebook-hal { box-shadow: none; }
        .ebook-muka {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          /* Tiap muka dipromosikan jadi lapisannya sendiri. Tanpa ini isi
             canvas-nya diraster ulang tiap frame dan di layar besar putarannya
             patah-patah. */
          will-change: transform;
        }
        /* translateZ kecil, bukan 0: dua muka yang duduk di kedalaman persis
           sama bikin WebKit ragu mana yang di depan — kertasnya berkelip
           bergantian tepat di tengah putaran. */
        .ebook-muka:not(.ebook-punggung) { transform: translateZ(0.4px); }
        .ebook-punggung { transform: rotateY(180deg) translateZ(0.4px); }
        /* Bayangan yang menyapu permukaan kertas saat sudutnya berubah —
           tanpa ini putarannya terlihat seperti gambar yang diputar. */
        .ebook-bayang {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(90deg, rgba(0, 0, 0, 0.34) 0%, rgba(0, 0, 0, 0) 46%);
          opacity: 0;
          animation: ebook-bayang-sapu var(--ebook-durasi, 620ms) linear forwards;
        }
        .ebook-bayang.balik {
          background: linear-gradient(270deg, rgba(0, 0, 0, 0.34) 0%, rgba(0, 0, 0, 0) 46%);
        }
        @keyframes ebook-maju {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(-180deg); }
        }
        @keyframes ebook-mundur {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(180deg); }
        }
        /* Puncaknya digeser dari 50%: tepat di 50% muka depan dan punggung
           bertukar tampak, dan bayangan yang sedang paling pekat di detik itu
           terbaca sebagai kejut gelap. Nolnya juga dijemput lebih awal (92%)
           supaya kertas sudah rata terang sebelum lembarnya dicabut. */
        @keyframes ebook-bayang-sapu {
          0% { opacity: 0; }
          38% { opacity: 0.72; }
          62% { opacity: 0.72; }
          92% { opacity: 0; }
          100% { opacity: 0; }
        }
        /* [ebook-navigasi-halaman-v1] Penggeser halaman. Tampilan bawaan
           browser terlalu tinggi & terang untuk bilah gelap ini. */
        .ebook-geser {
          -webkit-appearance: none;
          appearance: none;
          height: 18px;
          background: transparent;
          cursor: pointer;
        }
        .ebook-geser::-webkit-slider-runnable-track {
          height: 4px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.14);
        }
        .ebook-geser::-moz-range-track {
          height: 4px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.14);
        }
        .ebook-geser::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 13px;
          height: 13px;
          margin-top: -4.5px;
          border-radius: 999px;
          background: #3ed9c0;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.45);
        }
        .ebook-geser::-moz-range-thumb {
          width: 13px;
          height: 13px;
          border: 0;
          border-radius: 999px;
          background: #3ed9c0;
        }
        .ebook-geser:disabled::-webkit-slider-thumb { background: rgba(255, 255, 255, 0.3); }
        @media (prefers-reduced-motion: reduce) {
          .ebook-flipper, .ebook-bayang { animation: none !important; }
        }
      `}</style>

      {/* [ebook-latihan-interaktif-v1] Soalnya menutupi reader, bukan membuka
          tab baru: siswa sering bolak-balik melihat catatan unitnya, dan
          menutup latihan mengembalikannya ke halaman yang sama. */}
      {kerjakan && <EbookLatihan unit={kerjakan} onClose={() => setKerjakan(null)} />}

      {/* [ebook-panduan-tour-v1] Tur disembunyikan selama latihan terbuka:
          targetnya ada di balik lembar soal, jadi sorotannya akan menunjuk
          tombol yang sedang tak terlihat. */}
      {tur && !kerjakan && (
        <EbookPanduan
          langkah={tur === "penuh" ? langkahPenuh : langkahLatihan}
          onClose={tutupTur}
        />
      )}
    </div>
  );

  // Portal ke body: kartu perpustakaan berada di dalam wadah ber-overflow,
  // reader fullscreen tidak boleh ikut terpotong olehnya.
  return typeof document !== "undefined" ? createPortal(isi, document.body) : null;
}
