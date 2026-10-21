// [lingwords-v2] Peta Kata per tema — daftar tema baku + cache tema per kata.
//
// Tema = sifat KATA, bukan sifat siswa: "manzana" selalu "makanan" siapa pun yang
// menyimpannya. Karena itu disimpan sebagai cache per kata (bahasa + kata), bukan
// dihitung ulang tiap render:
//   1. localStorage perangkat ini (LS_KEY) — dibaca seketika;
//   2. tabel bersama word_themes (sql/20261021_lingwords_fase2.sql) lewat
//      /api/lingwords-tema — kata yang sudah pernah ditandai siswa mana pun
//      langsung terjawab tanpa AI;
//   3. AI (batch) hanya untuk kata yang belum pernah ditandai sama sekali.

import { supabase } from "@/lib/supabase-client";

import { LW_THEME_IDS, type LwThemeId } from "@/lib/lingwordsTemaDaftar";
export { LW_THEMES, LW_THEME_IDS, type LwThemeId } from "@/lib/lingwordsTemaDaftar";

const LS_KEY = "linguo:lingwords:tema:v1";
const kunci = (lang: string, word: string) => `${lang}::${word.trim().toLowerCase()}`;

let mem: Record<string, LwThemeId> | null = null;
function baca(): Record<string, LwThemeId> {
  if (mem) return mem;
  try {
    mem = JSON.parse(localStorage.getItem(LS_KEY) || "{}") || {};
  } catch {
    mem = {};
  }
  return mem!;
}
function tulis() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(mem || {}));
  } catch {
    /* penuh — cache memori tetap jalan, server tetap punya salinannya */
  }
}

/** Tema yang sudah diketahui untuk kata ini (tanpa jaringan). */
export function themeOf(lang: string, word: string): LwThemeId | undefined {
  if (typeof window === "undefined") return undefined;
  return baca()[kunci(lang, word)];
}

let mati = false; // AI/rute tumbang → berhenti mencoba sampai muat ulang
const jalan = new Map<string, Promise<void>>();

/**
 * Pastikan kata-kata ini punya tema: yang belum ada di cache lokal dikirim ke
 * /api/lingwords-tema per 120 kata. Balikin true kalau ada tema baru.
 */
export async function ensureThemes(lang: string, words: { word: string; meaning?: string }[]): Promise<boolean> {
  if (typeof window === "undefined" || mati || !lang) return false;
  const lokal = baca();
  const seen = new Set<string>();
  const kurang = words.filter((w) => {
    const k = kunci(lang, w.word);
    if (!w.word.trim() || lokal[k] || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  if (!kurang.length) return false;
  const tag = `${lang}|${kurang.length}|${kurang[0].word}`;
  const ada = jalan.get(tag);
  if (ada) {
    await ada;
    return true;
  }
  const janji = (async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    for (let i = 0; i < kurang.length && i < 600; i += 120) {
      const chunk = kurang.slice(i, i + 120);
      const res = await fetch("/api/lingwords-tema", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lang, words: chunk.map((w) => ({ word: w.word, meaning: (w.meaning || "").slice(0, 80) })) }),
      }).catch(() => null);
      if (!res || !res.ok) {
        if (!res || res.status >= 500) mati = true;
        return;
      }
      const j = (await res.json().catch(() => ({}))) as { themes?: Record<string, string> };
      Object.entries(j.themes || {}).forEach(([w, t]) => {
        if ((LW_THEME_IDS as string[]).includes(t)) lokal[kunci(lang, w)] = t as LwThemeId;
      });
      tulis();
    }
  })().finally(() => jalan.delete(tag));
  jalan.set(tag, janji);
  await janji;
  return true;
}
