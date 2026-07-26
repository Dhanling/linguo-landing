"use client";

// [watch-followup-translit-v1] Chip pertanyaan lanjutan ("Masih penasaran? Tanya AI:"
// / "Lanjut tanya:") sering MENGUTIP kata bahasa target di dalam pertanyaan berbahasa
// Indonesia — mis. `Ajarin cara pakai "要" untuk menyatakan keinginan.` Untuk bahasa
// beraksara non-Latin, kata kutipan itu tak terbaca pemula: chip-nya jadi tebak-tebakan.
// Modul ini menambahkan BACAAN LATIN tepat setelah tiap kutipan → `"要" (yào)`.
//
// Kenapa dihitung di klien, bukan menunggu field "tl" dari AI: `tl` cuma dikirim di
// mode ask (jawaban → usulan lanjutan) dan sering dilewat model, sementara chip awal
// dari analisa kalimat tak punya field itu sama sekali. Di sini bacaan diambil per
// KUTIPAN lewat /api/translit (transliterateLines) — deterministik, dipakai ulang dari
// cache modul, dan tempelnya tepat di sebelah katanya (bukan satu baris terpisah yang
// ambigu saat satu pertanyaan mengutip dua kata).

import { useEffect, useState } from "react";
import { isNonLatin, transliterateLines } from "@/lib/immersionLearn";

/** Satu potongan teks pertanyaan: `target` = kutipan bahasa target (aksara non-Latin). */
type Seg = { t: string; target: boolean };

// Aksara di atas U+02FF = non-Latin (Sirilik/Han/Kana/Hangul/Arab/Thai/…). Huruf Latin
// berdiakritik (≤ U+02FF) sengaja TIDAK dihitung — bahasa Latin tak butuh transliterasi.
function isTargetChar(ch: string): boolean {
  const cp = ch.codePointAt(0) ?? 0;
  return cp > 0x2ff && /[\p{L}\p{M}]/u.test(ch);
}

// Perekat antar-kata di dalam SATU kutipan: spasi/hubung yang diapit aksara target
// tetap menyatu, jadi frasa multi-kata (mis. Arab «قبل أن») dibaca sebagai satu unit,
// bukan dipecah jadi dua bacaan yang berdiri sendiri.
const JOINERS = new Set([" ", " ", "-", "‑", "'", "’", "‍"]);

/**
 * Pecah teks pertanyaan jadi potongan Latin biasa & kutipan bahasa target.
 * Dipakai dua-duanya: mengumpulkan kutipan yang perlu ditransliterasi, dan merender
 * ulang teks dengan bacaan yang sudah didapat.
 */
export function segmentFollowup(text: string): Seg[] {
  const chars = Array.from(text || "");
  const out: Seg[] = [];
  let buf = "";
  let inTarget = false;
  const flush = () => {
    if (buf) out.push({ t: buf, target: inTarget });
    buf = "";
  };
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    let target = isTargetChar(ch);
    // Perekat dianggap bagian kutipan HANYA bila kiri & kanannya sama-sama aksara target.
    if (!target && inTarget && JOINERS.has(ch)) {
      let j = i + 1;
      while (j < chars.length && JOINERS.has(chars[j])) j++;
      if (j < chars.length && isTargetChar(chars[j])) target = true;
    }
    if (target !== inTarget) {
      flush();
      inTarget = target;
    }
    buf += ch;
  }
  flush();
  return out;
}

/** Kutipan bahasa target unik di dalam sekumpulan pertanyaan (untuk dibatch translit). */
function collectSnippets(texts: string[]): string[] {
  const seen = new Set<string>();
  for (const t of texts) {
    for (const s of segmentFollowup(t)) {
      if (!s.target) continue;
      const w = s.t.trim();
      if (w) seen.add(w);
    }
  }
  return Array.from(seen);
}

// Cache lintas-render & lintas-drawer: kutipan yang sama (mis. «要» yang muncul di
// banyak kalimat) tak pernah minta bacaan dua kali dalam satu sesi.
const readingCache = new Map<string, string>();
const ck = (lang: string, snip: string) => `${lang}|${snip}`;

/**
 * Bacaan Latin per kutipan bahasa target untuk sekumpulan pertanyaan chip.
 * Best-effort: yang gagal/belum datang cukup tak muncul (chip tetap tampil apa adanya),
 * jadi tak pernah menahan render chip.
 */
export function useFollowupReadings(texts: string[], langCode: string): Record<string, string> {
  const [readings, setReadings] = useState<Record<string, string>>({});
  // Kunci berbasis ISI daftar pertanyaan — array baru tiap render (chip dibangun ulang)
  // tak boleh memicu fetch ulang.
  const key = texts.join("");
  useEffect(() => {
    if (!langCode || !isNonLatin(langCode)) {
      setReadings({});
      return;
    }
    const snips = collectSnippets(texts);
    if (!snips.length) {
      setReadings({});
      return;
    }
    let cancelled = false;
    const publish = () => {
      if (cancelled) return;
      const out: Record<string, string> = {};
      for (const s of snips) {
        const v = readingCache.get(ck(langCode, s));
        if (v) out[s] = v;
      }
      setReadings(out);
    };
    publish(); // tampilkan yang sudah tercache dulu (biasanya instan)
    const missing = snips.filter((s) => !readingCache.has(ck(langCode, s)));
    if (!missing.length) return;
    transliterateLines(missing, langCode)
      .then((res) => {
        res.forEach((r, i) => {
          const v = (r || "").trim();
          // Bacaan yang cuma menggemakan kutipannya (translit gagal) tak berguna → buang.
          if (v && v !== missing[i]) readingCache.set(ck(langCode, missing[i]), v);
        });
        publish();
      })
      .catch(() => {
        /* best-effort — chip tetap tampil tanpa bacaan */
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, langCode]);
  return readings;
}

/**
 * Apakah teks ini punya minimal satu kutipan yang bacaannya sudah didapat? Dipakai
 * chip untuk memutuskan: pakai bacaan tersisip (rapi, nempel di katanya) ATAU jatuh
 * kembali ke baris `tl` dari AI — jangan dua-duanya.
 */
export function hasInlineReading(text: string, readings: Record<string, string>): boolean {
  return segmentFollowup(text).some((s) => s.target && !!readings[s.t.trim()]);
}

/**
 * Render teks pertanyaan chip dengan bacaan Latin tersisip: `"出门前" (chūmén qián)`.
 * Kutipan yang bacaannya belum ada (bahasa Latin, fetch gagal, masih jalan) dirender
 * apa adanya — tak ada tanda kurung kosong.
 */
export function FollowupText({
  text,
  readings,
}: {
  text: string;
  readings: Record<string, string>;
}) {
  const segs = segmentFollowup(text);
  const hasAny = segs.some((s) => s.target && readings[s.t.trim()]);
  if (!hasAny) return <>{text}</>;
  return (
    <>
      {segs.map((s, i) => {
        const r = s.target ? readings[s.t.trim()] : "";
        return (
          <span key={i}>
            {s.t}
            {r && <span className="italic opacity-75">{` (${r})`}</span>}
          </span>
        );
      })}
    </>
  );
}
