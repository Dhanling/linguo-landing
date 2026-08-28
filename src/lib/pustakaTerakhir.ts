/* [pustaka-terakhir-dibuka-v1] Jejak modul yang TERAKHIR DIBUKA siswa, dipungut
   dari localStorage yang sudah ditulis EbookReader.

   Kenapa ada: Perpustakaan siswa sekarang berisi puluhan sampul (113 kartu untuk
   akun yang berlangganan banyak bahasa). Siswa yang cuma mau melanjutkan modul
   kemarin harus mengetik pencarian atau menyusur rak dulu — padahal readernya
   sudah tahu persis modul apa dan halaman berapa. Baris ini yang menutup jarak
   itu, sama seperti "Terakhir dibuka" di Perpustakaan dashboard PENGAJAR.

   Tidak ada kunci localStorage BARU yang dibuat di sini: sumbernya `ebook-hal:`,
   `ebook-hal-ts:`, `ebook-sampul:` dan `ebook-jejak:` yang memang sudah ditulis
   reader tiap kali halaman berganti. Jadi baris ini otomatis benar untuk modul
   yang sudah pernah dibaca, tanpa menunggu siswa membuka apa pun lagi.

   🔴 Semua kunci WAJIB lewat kunciJejak()/sufiksJejak() — lihat lib/jejakPemilik.
   Tanpa ekor pemilik, siswa berikutnya di laptop yang sama melihat modul yang
   dibaca orang sebelumnya di baris "Terakhir dibuka" miliknya. */

import { kunciJejak, sufiksJejak } from "./jejakPemilik";

/** Satu modul yang pernah dibuka di perangkat ini. */
export interface JejakPustaka {
  /** `digital_purchases.id` — kunci yang dipakai reader, bukan id produk. */
  purchaseId: string;
  /** Halaman terakhir yang dilihat (>= 1). */
  hal: number;
  /** Total halaman modulnya, 0 kalau reader belum sempat menghitungnya. */
  total: number;
  /** Epoch ms — dipakai mengurutkan, bukan ditampilkan. */
  ts: number;
  /** Sampul (data URL halaman 1) yang dititipkan reader; null → jatuh ke sampul produk. */
  sampul: string | null;
  /** Judul & bahasa titipan reader — cadangan kalau baris beliannya tak ikut termuat. */
  title: string | null;
  language: string | null;
}

/* Enam kartu = satu baris penuh di layar lebar dan masih enak digulir mendatar di
   layar sempit. Lebih dari itu bukan "terakhir dibuka" lagi, tapi rak kedua yang
   justru menambah tempat mencari. Sama dengan batas di dashboard pengajar. */
export const MAKS_TERAKHIR = 6;

const AWALAN_TS = "ebook-hal-ts:";

function bacaAngka(kunci: string): number {
  const v = Number(localStorage.getItem(kunci) || 0);
  return Number.isFinite(v) ? v : 0;
}

/** Posisi baca "halaman/total" yang ditulis EbookReader. */
function bacaHalaman(purchaseId: string): { hal: number; total: number } | null {
  const mentah = localStorage.getItem(kunciJejak(`ebook-hal:${purchaseId}`));
  if (!mentah) return null;
  const [halTeks, totalTeks] = mentah.split("/");
  const hal = Number(halTeks);
  const total = Number(totalTeks);
  if (!Number.isFinite(hal) || hal < 1) return null;
  return { hal: Math.floor(hal), total: Number.isFinite(total) ? Math.floor(total) : 0 };
}

/**
 * Daftar modul yang terakhir dibuka di perangkat ini, terbaru dulu.
 * Aman dipanggil di server (mengembalikan array kosong) — tapi panggil dari
 * useEffect supaya render server & klien tidak berbeda.
 */
export function bacaTerakhirDibuka(): JejakPustaka[] {
  if (typeof window === "undefined") return [];
  const sufiks = sufiksJejak();
  const out: JejakPustaka[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      /* Cuma jejak BER-EKOR akun yang sedang login yang dipungut. Jejak lawas
         tanpa ekor tak ketahuan milik siapa → sengaja dilewati. */
      if (!k || !k.startsWith(AWALAN_TS) || !k.endsWith(sufiks)) continue;
      const purchaseId = k.slice(AWALAN_TS.length, k.length - sufiks.length);
      if (!purchaseId) continue;
      const ts = bacaAngka(k);
      if (ts <= 0) continue;
      const pos = bacaHalaman(purchaseId);
      if (!pos) continue;
      let title: string | null = null;
      let language: string | null = null;
      try {
        const j = JSON.parse(localStorage.getItem(kunciJejak(`ebook-jejak:${purchaseId}`)) || "null");
        if (j && typeof j.title === "string" && j.title.trim()) title = j.title;
        if (j && typeof j.language === "string" && j.language.trim()) language = j.language;
      } catch { /* jejak rusak → judulnya nanti diambil dari baris belian */ }
      out.push({
        purchaseId,
        hal: pos.hal,
        total: pos.total,
        ts,
        sampul: localStorage.getItem(kunciJejak(`ebook-sampul:${purchaseId}`)),
        title,
        language,
      });
    }
  } catch {
    return []; // localStorage diblokir (mode privat) — barisnya cuma tak muncul
  }
  return out.sort((a, b) => b.ts - a.ts).slice(0, MAKS_TERAKHIR);
}

/**
 * Buang jejak satu modul (`purchaseId` kosong = kosongkan semuanya).
 *
 * Sampulnya IKUT dibuang: dia data URL ratusan KB dan tak ada gunanya kalau
 * modulnya sudah tak ada di baris ini. Posisi bacanya ikut hilang — itu memang
 * yang diminta siswa waktu menekan "Bersihkan": mulai lagi dari sampul.
 */
export function hapusTerakhirDibuka(purchaseId?: string): JejakPustaka[] {
  if (typeof window === "undefined") return [];
  const sasaran = purchaseId ? [purchaseId] : bacaTerakhirDibuka().map((j) => j.purchaseId);
  try {
    for (const id of sasaran) {
      for (const nama of ["ebook-hal", "ebook-hal-ts", "ebook-sampul", "ebook-jejak"]) {
        localStorage.removeItem(kunciJejak(`${nama}:${id}`));
      }
    }
  } catch { /* localStorage diblokir — tak ada yang perlu dibuang */ }
  return bacaTerakhirDibuka();
}
