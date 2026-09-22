// [ebook-bahasa-dari-katalog-v1] Halaman ini dulu satu berkas "use client"
// dengan daftar 20 bahasa ditulis tangan di dalamnya. Sekarang ia server
// component tipis: bahasanya dibaca dari `digital_products` (lihat
// src/lib/ebookBahasa.ts) lalu dioper ke EbookKlien, supaya modul baru yang
// diterbitkan lewat scripts/ebook-publish.mjs langsung bisa dibeli dari sini
// tanpa deploy — sama seperti /toko dan Perpustakaan dashboard siswa.
//
// Dirender di server (bukan diambil klien lewat /api) karena daftar bahasanya
// ISI UTAMA halaman jualan ini: kalau ia baru datang sesudah JS jalan, mesin
// pencari dan pembaca layar tak pernah melihatnya.
import { muatBahasaEbook, BAHASA_CADANGAN } from "@/lib/ebookBahasa";
import EbookKlien from "./EbookKlien";

// Katalog berubah paling sering beberapa kali seminggu (terbit modul baru);
// setengah jam sudah cukup segar dan halaman tetap terbit dari cache.
export const revalidate = 1800;

export default async function EbookPage() {
  const bahasa = await muatBahasaEbook();
  return <EbookKlien bahasa={bahasa.length > 0 ? bahasa : BAHASA_CADANGAN} />;
}
