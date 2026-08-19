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
