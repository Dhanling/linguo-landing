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
//
// [lingwords-kelas-kata-v1] Kelas kata (benda/kerja/sifat/lainnya) memakai mekanisme
// yang sama persis (buatCache) dengan kunci localStorage & tabel word_pos sendiri.

import { supabase } from "@/lib/supabase-client";

import { LW_POS_IDS, LW_THEME_IDS, type LwPosId, type LwThemeId } from "@/lib/lingwordsTemaDaftar";
export { LW_THEMES, LW_THEME_IDS, type LwThemeId, LW_POS, LW_POS_IDS, type LwPosId } from "@/lib/lingwordsTemaDaftar";

const kunci = (lang: string, word: string) => `${lang}::${word.trim().toLowerCase()}`;

function buatCache<T extends string>(lsKey: string, ids: readonly T[], jenis: "tema" | "kelas", resKey: "themes" | "pos") {
  let mem: Record<string, T> | null = null;
  function baca(): Record<string, T> {
    if (mem) return mem;
    try {
      mem = JSON.parse(localStorage.getItem(lsKey) || "{}") || {};
    } catch {
      mem = {};
    }
    return mem!;
  }
  function tulis() {
    try {
      localStorage.setItem(lsKey, JSON.stringify(mem || {}));
    } catch {
      /* penuh — cache memori tetap jalan, server tetap punya salinannya */
    }
  }
  const sah = (x: string): x is T => (ids as readonly string[]).includes(x);

  /** Nilai yang sudah diketahui untuk kata ini (tanpa jaringan). */
  function of(lang: string, word: string): T | undefined {
    if (typeof window === "undefined") return undefined;
    return baca()[kunci(lang, word)];
  }

  /** [lingwords-pratinjau-v1] Isi cache dengan nilai yang sudah diketahui server ("lang::kata" → nilai). */
  function prime(map: Record<string, string>): void {
    if (typeof window === "undefined") return;
    const lokal = baca();
    let ubah = false;
    Object.entries(map).forEach(([k, t]) => {
      if (sah(t) && lokal[k] !== t) { lokal[k] = t; ubah = true; }
    });
    if (ubah) tulis();
  }

  let mati = false; // AI/rute tumbang → berhenti mencoba sampai muat ulang
  const jalan = new Map<string, Promise<void>>();

  /**
   * Pastikan kata-kata ini punya nilai: yang belum ada di cache lokal dikirim ke
   * /api/lingwords-tema per 120 kata. Balikin true kalau ada nilai baru.
   */
  async function ensure(lang: string, words: { word: string; meaning?: string }[]): Promise<boolean> {
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
          body: JSON.stringify({ lang, jenis, words: chunk.map((w) => ({ word: w.word, meaning: (w.meaning || "").slice(0, 80) })) }),
        }).catch(() => null);
        if (!res || !res.ok) {
          if (!res || res.status >= 500) mati = true;
          return;
        }
        const j = (await res.json().catch(() => ({}))) as Record<string, Record<string, string> | undefined>;
        Object.entries(j[resKey] || {}).forEach(([w, t]) => {
          if (sah(t)) lokal[kunci(lang, w)] = t;
        });
        tulis();
      }
    })().finally(() => jalan.delete(tag));
    jalan.set(tag, janji);
    await janji;
    return true;
  }

  return { of, prime, ensure };
}

const tema = buatCache<LwThemeId>("linguo:lingwords:tema:v1", LW_THEME_IDS, "tema", "themes");
export const themeOf = tema.of;
export const primeThemes = tema.prime;
export const ensureThemes = tema.ensure;

const kelas = buatCache<LwPosId>("linguo:lingwords:kelas:v1", LW_POS_IDS, "kelas", "pos");
export const posOf = kelas.of;
export const primePos = kelas.prime;
export const ensurePos = kelas.ensure;
