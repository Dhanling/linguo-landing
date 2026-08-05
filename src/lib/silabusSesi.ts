// [kelas-materi-silabus-sesi-v1] Silabus PER SESI untuk linimasa kelas siswa.
//
// Sumber datanya sama dengan halaman /silabus dan komponen SilabusOutline:
// src/data/curriculum/data/<slug>.ts → levels[].sublevels[].sessions[]
// (tiap sublevel = 16 sesi, persis satu paket kelas). Yang baru di sini cuma
// jalan pintasnya: dari satu baris `registrations` (bahasa + level) langsung ke
// daftar sesi level itu, supaya tiap milestone di tab Materi bisa memberi tahu
// "sesi ini belajar apa" walau pengajar belum menulis laporan apa pun.
//
// Bahasa dipetakan lewat languageSlug() — JANGAN bikin slug ad-hoc di sini,
// registrations.language isinya campur aduk (lihat catatan di lib/languageSlug).

import { languageSlug } from "./languageSlug";

export interface SilabusSesi {
  number: number;
  title: string;
  topics?: string[];
}

export interface SilabusLevel {
  /** kode sublevel yang ketemu, mis. "A1.1" */
  code: string;
  /** nama sublevel, mis. "First Steps" */
  name: string;
  sessions: SilabusSesi[];
}

// Modul kurikulum di-cache per slug: satu kelas bisa membuka drawer belasan kali.
const cache = new Map<string, any>();

async function loadCurriculum(slug: string): Promise<any | null> {
  if (cache.has(slug)) return cache.get(slug);
  try {
    const mod: any = await import(`../data/curriculum/data/${slug}`);
    const cur = mod?.default || mod?.curriculum || mod;
    const ok = cur && Array.isArray(cur.levels) && cur.levels.length > 0 ? cur : null;
    cache.set(slug, ok);
    return ok;
  } catch {
    cache.set(slug, null);
    return null;
  }
}

/**
 * Daftar sesi silabus untuk kelas ini, atau null kalau bahasanya/levelnya tidak
 * terjawab data kurikulum. null itu SENGAJA: lebih baik tidak menampilkan apa-apa
 * daripada memajang materi level (atau bahasa) yang bukan diambil siswa.
 */
export async function loadSilabusLevel(
  language?: string | null,
  level?: string | null,
): Promise<SilabusLevel | null> {
  const slug = languageSlug(language);
  if (!slug) return null;
  const cur = await loadCurriculum(slug);
  if (!cur) return null;

  const subs: any[] = cur.levels.flatMap((l: any) => l.sublevels || []);
  const want = (level || "").trim().toUpperCase();
  // Cocok persis dulu ("A1.2"), baru jatuh ke sublevel pertama level induknya
  // ("A1" → A1.1). Level kosong/aneh ("TBD") tidak ditebak-tebak.
  const hit =
    subs.find((s) => String(s.code).toUpperCase() === want) ||
    (/^[ABC][12]$/.test(want) ? subs.find((s) => String(s.code).toUpperCase().startsWith(`${want}.`)) : null);
  if (!hit || !Array.isArray(hit.sessions) || hit.sessions.length === 0) return null;

  return { code: hit.code, name: hit.name, sessions: hit.sessions };
}
