#!/usr/bin/env node
// [ebook-reader-v1] Salin worker pdf.js ke /public saat install.
//
// Reader e-book merender PDF di worker terpisah supaya UI tidak beku waktu
// halaman berat digambar. Workernya HARUS disajikan dari domain sendiri:
// memuatnya dari CDN akan ditolak CSP dan bikin reader mati total di produksi.
//
// Dipanggil otomatis lewat "postinstall" (jalan juga di Vercel), jadi berkas
// hasil salinannya tidak perlu ikut di-commit — lihat .gitignore.
//
// Pakai build `legacy`: siswa banyak yang memakai browser bawaan HP lawas.

import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";

const SRC = "node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs";
const DEST = "public/pdfjs/pdf.worker.min.mjs";

if (!existsSync(SRC)) {
  // Bukan kesalahan fatal: `npm install --omit=dev` atau install parsial tetap
  // boleh lanjut. Reader-nya yang akan bilang kalau workernya tak ada.
  console.warn(`[pdf-worker] ${SRC} tidak ditemukan — dilewati.`);
  process.exit(0);
}
mkdirSync(dirname(DEST), { recursive: true });
copyFileSync(SRC, DEST);
console.log(`[pdf-worker] ${DEST} diperbarui.`);
