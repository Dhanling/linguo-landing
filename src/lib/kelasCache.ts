// [kelas-switch-instan-v1] Cache sesi-browser buat halaman detail kelas
// (/akun/kelas/[id]) — supaya pindah level lewat strip chip terasa INSTAN.
//
// Masalahnya: tiap pindah level ada 3 query berantai sebelum ada yang bisa dilihat
// (registrations → schedules → class_materials). Selama itu layar isinya spinner,
// lalu konten muncul mendadak — kelihatan seperti halaman di-reload (kedip).
// Solusinya dua lapis:
//   1. Hasil query terakhir disimpan di sessionStorage; saat kembali ke level yang
//      sama, isinya dipasang SEBELUM paint (useIsoLayoutEffect) — nol kedip.
//   2. Level tetangga di-prefetch diam-diam sesudah halaman tenang, jadi klik
//      pertama pun sudah ada isinya.
//
// sessionStorage (bukan localStorage) disengaja: datanya milik satu tab & ikut
// hilang saat tab ditutup — tak ada risiko siswa lain di perangkat yang sama
// melihat sisa data, dan tak perlu urusan invalidasi lintas sesi login.

import { useEffect, useLayoutEffect } from 'react';
import { languageSlug } from './languageSlug';

// Materi bisa memuat teks panjang (materi hasil AI). Cache yang kegedean cuma
// bikin sessionStorage penuh & bikin query balik lagi — lebih baik dilewat.
const MAX_BYTES = 300_000;

const PREFIXES = ['linguo_sched_', 'linguo_materi_', 'linguo_levelregs_'];

export const regKey = (id: string) => `linguo_reg_${id}`;
export const schedKey = (id: string) => `linguo_sched_${id}`;
export const materiKey = (id: string) => `linguo_materi_${id}`;
// Id siswa yang sedang login — dipakai kalau baris reg dari handoff beranda tak
// membawa `student_id` (select kartu beranda memang tak memilih kolom itu).
// Aman dari salah-tampil antar akun: query yang memakainya tetap dijaga RLS, jadi
// id yang basi paling banter menghasilkan daftar kosong, bukan data siswa lain.
export const STUDENT_ID_KEY = 'linguo_student_id';
export const levelRegsKey = (studentId: string, language?: string | null) =>
  `linguo_levelregs_${studentId}_${languageSlug(language) || String(language || '').toLowerCase()}`;

export function readCache<T>(key: string | null | undefined): T | null {
  if (!key || typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeCache(key: string | null | undefined, value: unknown): void {
  if (!key || typeof window === 'undefined') return;
  try {
    const raw = JSON.stringify(value);
    if (raw.length > MAX_BYTES) return;
    try {
      sessionStorage.setItem(key, raw);
    } catch {
      // Kuota penuh → buang cache kelas yang lama, lalu coba sekali lagi.
      // Kalau masih gagal, biarkan — cache itu bonus, bukan syarat halaman jalan.
      prune();
      try { sessionStorage.setItem(key, raw); } catch {}
    }
  } catch {}
}

function prune() {
  try {
    const buang: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && PREFIXES.some((p) => k.startsWith(p))) buang.push(k);
    }
    buang.forEach((k) => sessionStorage.removeItem(k));
  } catch {}
}

// Pasang data cache SEBELUM browser menggambar (useEffect kelewat telat: satu frame
// spinner sempat terlihat = kedip). Di server jatuh ke useEffect biar tak ada warning.
export const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/* [kelas-level-switcher-v3] Titipan daftar level dari BERANDA.
   Strip pindah level di /akun/kelas/[id] dulu berdiri di atas satu rantai query
   sendiri (students by email → registrations by student_id). Tiap kali rantai itu
   putus — sesi pratinjau kedaluwarsa, RLS menjawab kosong, jaringan kedip — strip-nya
   lenyap tanpa suara, padahal beranda BARUSAN memuat daftar yang sama persis.
   Jadi beranda menitipkannya: satu tulis sessionStorage, halaman detail tinggal pakai. */
export function simpanDaftarLevel(
  studentId: string | null | undefined,
  regs: any[] | null | undefined,
): void {
  if (!studentId || !Array.isArray(regs) || regs.length === 0) return;
  writeCache(STUDENT_ID_KEY, studentId);
  const perBahasa = new Map<string, any[]>();
  for (const r of regs) {
    if (!r?.id || !r?.language) continue;
    // Aturan yang sama dengan query strip: kelas batal & yang tak pernah dibayar
    // bukan level yang mau ditengok. Level lama yang `archived_at` justru wajib ikut.
    if (r.pipeline_status === 'Batal') continue;
    if (r.payment_status !== 'Lunas' && r.payment_status !== 'Cicilan') continue;
    const k = levelRegsKey(studentId, r.language);
    const arr = perBahasa.get(k);
    if (arr) arr.push(r);
    else perBahasa.set(k, [r]);
  }
  perBahasa.forEach((v, k) => writeCache(k, v));
}
