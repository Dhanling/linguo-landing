"use client";
// [quran-reader-v1] Cache klien untuk halaman mushaf & morfologi per surat.
// Modul-level supaya pindah halaman bolak-balik tak mengambil ulang, dan halaman
// tetangga bisa diambil duluan (prefetch) sebelum pengguna menggeser.
import type { Halaman } from "@/lib/quran/sumber";
import type { SegmenMentah } from "@/lib/quran/morfologi";

const halaman = new Map<number, Promise<Halaman>>();
const morf = new Map<number, Promise<Record<string, SegmenMentah[]>>>();

export function muatHalaman(n: number): Promise<Halaman> {
  let p = halaman.get(n);
  if (!p) {
    p = fetch(`/api/quran/halaman/${n}`).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    });
    // Gagal jangan di-cache — biar tombol "Coba lagi" benar-benar mencoba lagi.
    p.catch(() => halaman.delete(n));
    halaman.set(n, p);
  }
  return p;
}

export function muatMorfologi(surat: number): Promise<Record<string, SegmenMentah[]>> {
  let p = morf.get(surat);
  if (!p) {
    p = fetch(`/quran/morph/${surat}.json`).then((r) => (r.ok ? r.json() : {}));
    p.catch(() => morf.delete(surat));
    morf.set(surat, p);
  }
  return p;
}

/** "2:6:3" → segmen morfologi kata itu (atau undefined). */
export async function morfologiKata(lok: string): Promise<SegmenMentah[] | undefined> {
  const [s, a, w] = lok.split(":");
  const data = await muatMorfologi(Number(s));
  return data[`${a}:${w}`];
}
