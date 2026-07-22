"use client";

// Tooltip balon di atas kata yang di-tap dalam player Watch & Learn. Menampilkan
// arti + kelas kata (dari word-info AI), lalu deret aksi: Simpan kata (ke
// localStorage) & Analisa (mode belajar mendalam layar penuh). Otomatis
// mengucapkan kata saat dibuka; KETUK area balon/kata untuk memutar audio ulang
// (tombol Dengar & tombol tutup dihapus — balon tertutup saat video diputar lagi
// atau kata lain di-tap). Posisinya menempel di atas titik tap & diklem ke tepi
// layar; bisa digeser dari area mana pun kecuali tombol.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookmarkCheck,
  BookmarkPlus,
  Loader2,
  Sparkles,
} from "lucide-react";
import WordStudy from "./WordStudy";
import {
  canSaveWord,
  cleanWord,
  getCachedWordMeaning,
  getWordMeaning,
  isNonLatin,
  isWordSaved,
  removeSavedWord,
  savedWordCount,
  saveWord,
  speakText,
  splitWords,
  transliterateLines,
  WordMeaning,
} from "@/lib/immersionLearn";
import WatchUpsellModal from "./WatchUpsellModal";

const TEAL = "#1A9E9E";
const GOLD = "#F4B740";
const BALLOON = "#0A1212";
const SUB = "rgba(255,255,255,0.5)";
const BORDER = "rgba(255,255,255,0.1)";

const TIP_W = 232;

// Berapa kata maksimum dirambatkan otomatis saat kata tunggal tak berarti mandiri
// (kata fungsi) — cukup untuk menangkap frasa seperti "por el entrenamiento de fuerza".
const MAX_AUTO_EXPAND = 4;

// Artikel/determiner per bahasa. Kalau kata yang di-tap didahului salah satunya,
// pilihan awal otomatis mencakup artikelnya (mis. tap "texto" → "el texto"),
// karena artikel gender menentukan bentuk & sering dipelajari sepaket. User tetap
// bisa menciutkan ke "1 kata". Hanya bahasa dengan artikel yang didaftarkan.
const ARTICLES: Record<string, Set<string>> = {
  en: new Set(["a", "an", "the"]),
  es: new Set(["el", "la", "los", "las", "un", "una", "unos", "unas"]),
  fr: new Set(["le", "la", "les", "un", "une", "des", "du"]),
  it: new Set(["il", "lo", "la", "i", "gli", "le", "un", "uno", "una"]),
  pt: new Set(["o", "a", "os", "as", "um", "uma", "uns", "umas"]),
  ca: new Set(["el", "la", "els", "les", "un", "una", "uns", "unes"]),
  de: new Set(["der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "einem", "einer", "eines"]),
  nl: new Set(["de", "het", "een"]),
};

// Ucapkan kata pakai Chirp 3 HD (fallback Web Speech) — helper bersama di lib.
const speak = speakText;

export function WordTooltip({
  tapId,
  word: rawWord,
  sentence,
  wordIdx,
  wordEndIdx,
  langCode,
  baseLang,
  videoId,
  x,
  y,
  autoStudy = false,
  onClose,
  onSavedChange,
  onStudyOpenChange,
}: {
  // Id unik tiap tap kata (dari player). Berubah = kata baru di-tap → reset apakah
  // drawer Analisa terbuka, mengikuti autoStudy (drawer sudah terbuka → tetap di
  // drawer & muat ulang; belum → kembali ke popup). Reset TANPA remount (drawer
  // tetap terpasang) supaya tak ada kedipan animasi/reflow.
  tapId?: number;
  word: string;
  sentence: string;
  wordIdx?: number;
  /** Indeks token AKHIR frasa (mis. tap "birthday card" dari sapuan karaoke) —
   *  selection dibuka langsung sebagai rentang wordIdx..wordEndIdx. */
  wordEndIdx?: number;
  langCode: string;
  /** Bahasa terjemahan pengguna ("kamu bicara bahasa apa?") — arti kata & cache
   *  breakdown ikut bahasa ini, bukan selalu Indonesia. */
  baseLang?: string;
  videoId?: string;
  x: number;
  y: number;
  // Langsung buka drawer Analisa (WordStudy) tanpa singgah di balon kecil dulu —
  // dipakai saat dibuka ulang dari riwayat kata (tombol AI melayang).
  autoStudy?: boolean;
  onClose: () => void;
  onSavedChange?: () => void;
  // Diberi tahu saat drawer Analisa (WordStudy) buka/tutup — player memakainya untuk
  // auto-sembunyikan transkrip (drawer kini panel kanan yang menimpa kolom transkrip).
  onStudyOpenChange?: (open: boolean) => void;
}) {
  // Token kalimat + posisi kata — dipakai untuk memperluas pilihan ke frasa
  // (mis. tap "compañía" lalu gabungkan "la" jadi "la compañía").
  const tokens = useMemo(() => splitWords(sentence, langCode), [sentence, langCode]);
  const wordPositions = useMemo(
    () => tokens.reduce<number[]>((a, t, i) => (t.isWord ? (a.push(i), a) : a), []),
    [tokens]
  );
  // Titik awal pilihan: pakai indeks yang dikirim player kalau valid, kalau tidak
  // cari kata pertama yang cocok. -1 = tak ketemu (mis. token mode Analisa) →
  // fitur frasa nonaktif, pakai kata mentah apa adanya.
  const initialIdx = useMemo(() => {
    if (wordIdx != null && tokens[wordIdx]?.isWord) return wordIdx;
    const target = cleanWord(rawWord).toLowerCase();
    return tokens.findIndex((t) => t.isWord && cleanWord(t.text).toLowerCase() === target);
  }, [tokens, wordIdx, rawWord]);

  // Titik kiri default: sertakan artikel gender di depannya kalau ada.
  const autoLo = useMemo(() => {
    if (initialIdx < 0) return initialIdx;
    const arts = ARTICLES[(langCode || "").split("-")[0]];
    if (!arts) return initialIdx;
    const prev = [...wordPositions].reverse().find((p) => p < initialIdx);
    if (prev != null && arts.has(cleanWord(tokens[prev].text).toLowerCase())) return prev;
    return initialIdx;
  }, [initialIdx, langCode, wordPositions, tokens]);

  // Titik kanan default: kalau player mengirim akhir frasa (sapuan karaoke, mis.
  // "birthday card"), buka selection langsung sampai kata itu; kalau tidak, kata
  // tunggal (hi = awal).
  const initialHi = useMemo(() => {
    if (wordEndIdx != null && wordEndIdx >= initialIdx && tokens[wordEndIdx]?.isWord) {
      return wordEndIdx;
    }
    return initialIdx;
  }, [wordEndIdx, initialIdx, tokens]);

  const [sel, setSel] = useState({ lo: autoLo, hi: initialHi });
  useEffect(() => setSel({ lo: autoLo, hi: initialHi }), [autoLo, initialHi]);

  // Auto-perluas ke frasa saat kata tunggal tak punya arti mandiri (kata fungsi
  // seperti "por", "de", "el"). Arti sesungguhnya baru muncul digabung tetangganya
  // (mis. "por" → "por el entrenamiento de fuerza"), jadi kita rambat ke KANAN
  // sampai dapat arti — tanpa user harus menekan tombol Frasa. Nonaktif begitu
  // user menyentuh kontrol frasa manual, & direset tiap klik kata baru.
  const autoAllowRef = useRef(true);
  const [autoTries, setAutoTries] = useState(0);
  useEffect(() => {
    autoAllowRef.current = true;
    setAutoTries(0);
  }, [initialIdx, rawWord]);

  // Frasa terpilih (endpoint selalu kata, pemisah di antaranya ikut tergabung).
  const word = useMemo(() => {
    if (sel.lo < 0 || sel.hi < 0) return cleanWord(rawWord) || rawWord;
    return tokens.slice(sel.lo, sel.hi + 1).map((t) => t.text).join("").trim();
  }, [tokens, sel, rawWord]);

  // Kata kanan berikutnya — dipakai auto-expand kata fungsi (kontrol frasa manual
  // sudah dihapus demi tooltip yang ringkas).
  const nextWord = wordPositions.find((p) => p > sel.hi);

  // [watch-phrase-chunk-v1] Posisi token tiap kata dalam frasa yang MULA-MULA di-tap
  // (rentang autoLo..initialHi) — jadi bahan chip "turun ke per-kata".
  const phraseWords = useMemo(
    () => wordPositions.filter((p) => p >= autoLo && p <= initialHi),
    [wordPositions, autoLo, initialHi]
  );

  const [meaning, setMeaning] = useState<WordMeaning | null>(null);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [saved, setSaved] = useState(false);
  // Kalau non-null: tampilkan modal upsell (kuota simpan gratis habis); angkanya =
  // jumlah kata tersimpan buat ditampilkan di modal.
  const [upsellCount, setUpsellCount] = useState<number | null>(null);
  // Penyimpanan browser penuh/diblokir → tampilkan pesan jujur, jangan diam-diam gagal.
  const [saveError, setSaveError] = useState(false);
  // Frasa yang `meaning` sekarang wakili — auto-expand hanya boleh lanjut kalau arti
  // yang terlihat memang milik `word` saat ini (bukan sisa fetch sebelumnya), supaya
  // tiap langkah MENUNGGU hasil fetch & tak menembus beberapa perluasan sekaligus.
  const [meaningWord, setMeaningWord] = useState("");

  // Bacaan Latin (romaji/pinyin/dll) untuk kata beraksara non-Latin — word-info
  // "meaning" tak mengembalikannya, jadi kita ambil terpisah via /api/translit.
  const [translit, setTranslit] = useState("");

  // Mode belajar mendalami kata (layar penuh) — dibuka dari tombol Analisa, atau
  // langsung terbuka saat dipanggil dari riwayat (autoStudy).
  const [studyOpen, setStudyOpen] = useState(autoStudy);
  // Tiap tap kata baru (tapId berubah) → selaraskan status drawer dgn autoStudy:
  // drawer sedang terbuka (tap saat drawer aktif → autoStudy true) tetap di drawer
  // & memuat ulang kata baru di tempat; kalau tidak, kembali ke popup. Lewati mount
  // pertama (nilai awal sudah = autoStudy) supaya tak memicu ulang percuma.
  const firstTapRef = useRef(true);
  useEffect(() => {
    if (firstTapRef.current) {
      firstTapRef.current = false;
      return;
    }
    setStudyOpen(autoStudy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tapId]);

  // Rambatkan status buka/tutup drawer ke player (auto-hide transkrip). Cleanup
  // memastikan status "tutup" tetap terkirim kalau tooltip di-unmount saat drawer
  // masih terbuka (mis. anchor dibersihkan) — biar transkrip tak nyangkut tersembunyi.
  useEffect(() => {
    onStudyOpenChange?.(studyOpen);
  }, [studyOpen, onStudyOpenChange]);
  useEffect(() => () => onStudyOpenChange?.(false), [onStudyOpenChange]);

  // Geser bebas — offset dari posisi awal, di-drag dari area mana pun balon.
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);

  const onDragStart = useCallback(
    (e: React.PointerEvent) => {
      // Jangan mulai drag / ucap saat menekan tombol aksi (Simpan, Analisa).
      if ((e.target as HTMLElement).closest("button")) return;
      e.preventDefault();
      dragRef.current = { sx: e.clientX, sy: e.clientY, ox: offset.x, oy: offset.y };
      // Bedakan ketuk vs geser: kalau kursor bergerak > 4px, ini geser (bukan ketuk),
      // jadi jangan ucapkan kata saat dilepas.
      let moved = false;
      const move = (ev: PointerEvent) => {
        const d = dragRef.current;
        if (!d) return;
        if (Math.abs(ev.clientX - d.sx) + Math.abs(ev.clientY - d.sy) > 4) moved = true;
        setOffset({ x: d.ox + (ev.clientX - d.sx), y: d.oy + (ev.clientY - d.sy) });
      };
      const up = () => {
        dragRef.current = null;
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        // [watch-tip-tap-to-speak-v1] Ketuk (bukan geser) di area balon = ucapkan
        // kata/frasa. Pengganti tombol Dengar 🔊 yang dihapus — cukup klik kata /
        // balon-nya untuk memutar audio ulang.
        if (!moved) speak(word, langCode);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [offset, word, langCode]
  );

  // Ucapkan kata/frasa yang STABIL (debounce). Saat perluasan frasa — otomatis
  // (kata fungsi) maupun manual — mengubah `word` beruntun, hanya bentuk final yang
  // diucapkan sehingga audio tak menumpuk/tumpang-tindih.
  useEffect(() => {
    const id = window.setTimeout(() => speak(word, langCode), 350);
    return () => window.clearTimeout(id);
  }, [word, langCode]);

  // Ambil arti saat kata/frasa berubah.
  useEffect(() => {
    let cancelled = false;
    setSaved(isWordSaved(word, langCode));
    setSaveError(false);

    // Jalur cepat: arti kata ini sudah ada di cache analisa kalimat (di-prewarm
    // begitu transkrip siap) → tampil INSTAN tanpa memanggil word-info. Fallback
    // ke fetch di bawah hanya kalau cache belum ada / kata fungsi (auto-expand).
    const cached = getCachedWordMeaning({ word, sentence, langCode, baseCode: baseLang });
    if (cached) {
      setMeaning({ meaning: cached.meaning, type: cached.type, base: cached.base });
      setMeaningWord(word);
      setErrored(false);
      setLoading(false);
      setTranslit(isNonLatin(langCode) && cached.translit ? cached.translit : "");
      // Cache tak menyertakan bacaan Latin → ambil terpisah (background).
      if (isNonLatin(langCode) && !cached.translit) {
        transliterateLines([word], langCode)
          .then((r) => !cancelled && r[0] && setTranslit(r[0]))
          .catch(() => {});
      }
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    setErrored(false);
    setMeaning(null);
    setTranslit("");
    getWordMeaning({ word, sentence, langCode, baseCode: baseLang })
      .then((m) => {
        if (cancelled) return;
        setMeaning(m);
        setMeaningWord(word);
      })
      .catch(() => !cancelled && setErrored(true))
      .finally(() => !cancelled && setLoading(false));
    // Bacaan Latin di background (hanya bahasa non-Latin) — biar arti tampil dulu.
    if (isNonLatin(langCode)) {
      transliterateLines([word], langCode)
        .then((r) => !cancelled && r[0] && setTranslit(r[0]))
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word, sentence, langCode, baseLang]);

  // Arti tunggal kosong = kata fungsi tanpa makna mandiri → rambatkan ke kata
  // kanan (skip artikel via seleksi) sampai dapat arti, maksimum beberapa kata.
  useEffect(() => {
    if (!autoAllowRef.current) return;
    if (loading || errored) return;
    if (meaningWord !== word) return; // arti belum sinkron dgn frasa saat ini
    if (meaning?.meaning) return; // sudah ada arti → berhenti
    if (autoTries >= MAX_AUTO_EXPAND) return;
    if (nextWord == null) return; // tak ada kata di kanan lagi
    setSel((s) => ({ ...s, hi: nextWord }));
    setAutoTries((n) => n + 1);
  }, [loading, errored, meaning, meaningWord, word, autoTries, nextWord]);

  const toggleSave = useCallback(() => {
    if (saved) {
      removeSavedWord(word, langCode);
      setSaved(false);
    } else {
      // Gratis: mentok kuota → tawarkan langkah berikutnya, jangan diam-diam gagal.
      if (!canSaveWord(word, langCode)) {
        setUpsellCount(savedWordCount());
        return;
      }
      // Gagal tulis (penyimpanan browser penuh/diblokir) → JANGAN pura-pura sukses:
      // dulu tombol berubah "Tersimpan" tapi katanya tak pernah muncul di flashcard.
      const res = saveWord({
        word,
        meaning: meaning?.meaning ?? "",
        langCode,
        example: sentence,
        videoId,
        ...(isNonLatin(langCode) && translit ? { translit } : {}),
      });
      if (!res.ok) {
        setSaveError(true);
        return;
      }
      setSaveError(false);
      setSaved(true);
    }
    onSavedChange?.();
  }, [saved, word, langCode, meaning, translit, sentence, videoId, onSavedChange]);

  // Posisi balon: di atas titik tap, diklem ke layar.
  const vw = typeof window !== "undefined" ? window.innerWidth : 360;
  // [watch-tip-adaptive-w-v1] Lebar balon MENYESUAIKAN panjang kata/frasa yang diklik:
  // kata pendek tetap ramping (TIP_W), frasa panjang (mis. "Siswa Sekolah Menengah
  // pertama SMP") melebar sampai batas MAXW supaya header tak terpotong. Estimasi
  // lebar header 16px extra-bold: aksara CJK/Hangul ~15px, lainnya ~8.6px; +24px
  // padding p-3, +40px ruang pil POS di kanan. Kalau masih lebih panjang dari MAXW,
  // header dibiarkan membungkus (lihat flex-wrap + break-words di bawah).
  const tipW = useMemo(() => {
    const MAXW = Math.min(420, vw - 16);
    let est = 24 + 40;
    for (const ch of word) est += /[　-鿿가-힯＀-￯]/.test(ch) ? 15 : 8.6;
    return Math.round(Math.max(TIP_W, Math.min(est, MAXW)));
  }, [word, vw]);
  const left = Math.max(8, Math.min(x - tipW / 2, vw - tipW - 8));
  // Kalau kepenuhan di atas, taruh di bawah titik tap.
  const above = y > 240;
  // [watch-tip-balloon-v1] Balon "agak ke atas" (referensi user): gap dinaikkan
  // (14→28 / 16→30) supaya ada ruang buat ekor speech-bubble & balon melayang lebih
  // tinggi dari kata, tak menimpanya.
  const top = above ? undefined : y + 30;
  const bottom = above && typeof window !== "undefined" ? window.innerHeight - y + 28 : undefined;
  // Ekor balon menunjuk ke kata yang di-tap: posisi horizontal relatif tepi kiri
  // balon, diklem biar tak keluar dari sudut membulat.
  const tailLeft = Math.max(20, Math.min(x - left, TIP_W - 20));

  return (
    <>
    {/* Saat drawer Analisa (WordStudy) terbuka, popup kecil ini disembunyikan —
        kalau tidak, ia nyempil di belakang drawer (drawer kini panel kanan, bukan
        full-screen). Tutup drawer → popup muncul lagi. */}
    {!studyOpen && (
    // [watch-tip-persist-v1] Backdrop TEMBUS klik (pointer-events-none): balon tetap
    // tampil saat video di-play lagi — klik tombol putar/kontrol video lolos ke bawah,
    // tak lagi nyangkut di backdrop & menutup balon. Balon ditutup lewat tombol ✕ atau
    // saat kata lain di-tap. Balon sendiri pointer-events-auto (interaktif & bisa digeser).
    <div className="pointer-events-none fixed inset-0 z-[95]">
      {/* [watch-tip-pop-v1] Balon "meletup" naik dari bawah tiap kata di-tap —
          key={tapId} me-remount div-nya jadi animasi replay tiap kata baru. */}
      <style>{`@keyframes wtPopUp{from{opacity:0;transform:translateY(14px) scale(0.92)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
      <div
        key={tapId}
        onPointerDown={onDragStart}
        className="pointer-events-auto absolute touch-none cursor-move select-none rounded-2xl p-3 shadow-2xl"
        style={{
          left,
          top,
          bottom,
          width: TIP_W,
          backgroundColor: BALLOON,
          transform: `translate(${offset.x}px, ${offset.y}px)`,
          transformOrigin: "center bottom",
          animation: "wtPopUp 240ms cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* [watch-tip-balloon-v1] Ekor speech-bubble menunjuk ke kata: di BAWAH balon
            saat balon di atas kata (menunjuk turun), atau di ATAS balon saat balon di
            bawah kata (menunjuk naik). Segitiga CSS sewarna balon. */}
        <span
          aria-hidden
          className="absolute h-0 w-0"
          style={{
            left: tailLeft,
            transform: "translateX(-50%)",
            ...(above
              ? { top: "100%", borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderTop: `11px solid ${BALLOON}` }
              : { bottom: "100%", borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderBottom: `11px solid ${BALLOON}` }),
          }}
        />
        {/* Header: kata + kelas kata (kiri). Deret aksi dipindah ke KANAN BAWAH balon. */}
        {/* [watch-tip-pos-inline-v1] Kelas kata (POS) menempel di KANAN kata dalam
            SATU baris — bukan turun & membungkus 2 baris seperti sebelumnya
            (permintaan user). Kata & bentuk dasar shrink-0 (utuh); hanya pil POS
            yang boleh menciut/terpotong (min-w-0 + truncate) kalau ruang mepet,
            jadi tetap 1 baris. */}
        <div className="flex min-w-0 flex-wrap items-baseline gap-1.5">
          <span className="min-w-0 break-words text-[16px] font-extrabold text-white">{word}</span>
          {/* Bentuk dasar/infinitive utk verba terkonjugasi — mis. produjo (producir) */}
          {meaning?.base &&
            meaning.base.trim().toLowerCase() !== word.trim().toLowerCase() && (
              <span className="shrink-0 text-[14px] font-semibold" style={{ color: SUB }}>
                ({meaning.base})
              </span>
            )}
          {meaning?.type && (
            <span
              title={meaning.type}
              className="min-w-0 shrink truncate whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-semibold leading-tight"
              style={{ backgroundColor: "rgba(26,158,158,0.18)", color: "#7FE0E0" }}
            >
              {meaning.type}
            </span>
          )}
        </div>

        {/* Bacaan Latin (romaji/pinyin/dll) — hanya bahasa non-Latin */}
        {translit && (
          <p className="mt-0.5 text-[12.5px] font-medium italic" style={{ color: "#7FE0E0" }}>
            {translit}
          </p>
        )}

        {/* Arti */}
        {loading ? (
          <div className="mt-2 flex items-center gap-2" style={{ color: SUB }}>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-[12px] font-medium">Mencari arti…</span>
          </div>
        ) : errored || !meaning?.meaning ? (
          <p className="mt-1.5 text-[12.5px] leading-snug" style={{ color: SUB }}>
            Tidak ada arti mandiri — mungkin kata fungsi tata bahasa.
          </p>
        ) : (
          <p className="mt-1 text-[14px] font-bold leading-snug" style={{ color: GOLD }}>
            {meaning.meaning}
          </p>
        )}

        {/* [watch-phrase-chunk-v1] Turun ke per-kata: kalau yang di-tap sebuah FRASA
            ("the king"), tampilkan chip tiap katanya biar siswa yang mau belajar
            per-kata tinggal ketuk — dan chip "Frasa" untuk balik ke arti utuh. Siswa
            dapat DUA level (frasa & kata) tanpa mode/toggle yang membingungkan. */}
        {phraseWords.length > 1 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => {
                autoAllowRef.current = false;
                setSel({ lo: autoLo, hi: initialHi });
              }}
              className="rounded-full px-2 py-0.5 text-[11px] font-bold transition-colors"
              style={
                sel.lo === autoLo && sel.hi === initialHi
                  ? { backgroundColor: TEAL, color: "#fff" }
                  : { backgroundColor: "rgba(255,255,255,0.06)", color: "#7FE0E0" }
              }
            >
              Frasa
            </button>
            {phraseWords.map((p) => {
              const on = sel.lo === p && sel.hi === p;
              return (
                <button
                  key={p}
                  onClick={() => {
                    autoAllowRef.current = false;
                    setSel({ lo: p, hi: p });
                  }}
                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors"
                  style={
                    on
                      ? { backgroundColor: TEAL, color: "#fff" }
                      : { backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.75)" }
                  }
                >
                  {cleanWord(tokens[p].text)}
                </button>
              );
            })}
          </div>
        )}

        {saveError && (
          <p className="mt-2 text-[11px] font-medium leading-snug" style={{ color: "#FCA5A5" }}>
            Gagal menyimpan — penyimpanan browser penuh. Coba tutup tab lain atau
            bersihkan data situs, lalu simpan lagi.
          </p>
        )}

        {/* [watch-tip-actions-bottom-v1] Deret aksi (Simpan · Analisa) di pojok
            KANAN BAWAH balon (permintaan user) — tiap ikon zoom-in saat hover. */}
        <div className="mt-2.5 flex items-center justify-end gap-0.5">
          <TipAction active={saved} onClick={toggleSave} label={saved ? "Tersimpan" : "Simpan"}>
            {saved ? <BookmarkCheck className="h-[17px] w-[17px]" /> : <BookmarkPlus className="h-[17px] w-[17px]" />}
          </TipAction>
          <TipAction onClick={() => setStudyOpen(true)} label="Analisa">
            <Sparkles className="h-[17px] w-[17px]" />
          </TipAction>
        </div>

      </div>
    </div>
    )}

    {studyOpen && (
      <WordStudy
        word={word}
        sentence={sentence}
        langCode={langCode}
        baseCode={baseLang}
        videoId={videoId}
        translit={translit}
        meaning={meaning}
        onClose={() => {
          setStudyOpen(false);
          setSaved(isWordSaved(word, langCode));
        }}
        onSavedChange={() => {
          setSaved(isWordSaved(word, langCode));
          onSavedChange?.();
        }}
      />
    )}

    {upsellCount !== null && (
      <WatchUpsellModal savedCount={upsellCount} onClose={() => setUpsellCount(null)} />
    )}
    </>
  );
}

function TipAction({
  children,
  onClick,
  active,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  label: string;
}) {
  // [watch-tip-compact-v1] Ikon POLOS (tanpa kotak abu-abu) — hanya highlight halus
  // saat hover; aktif (tersimpan) → warna teal. Label muncul sebagai tooltip hover.
  // [watch-tip-actions-top-v1] Hover = zoom-in tegas (scale-125) biar ikon di pojok
  // kanan-atas terasa "membesar" saat disorot.
  return (
    <Tip label={label}>
      <button
        onClick={onClick}
        aria-label={label}
        className="flex items-center justify-center rounded-lg p-1.5 transition duration-150 hover:scale-125 hover:bg-white/10 active:scale-95"
        style={{ color: active ? TEAL : "rgba(255,255,255,0.85)" }}
      >
        {children}
      </button>
    </Tip>
  );
}

// Tooltip info kecil yang muncul saat hover tombol aksi. Native title kadang
// lambat/tak konsisten, jadi kita render sendiri agar tampil rapi di atas tombol.
function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <div
      className="relative flex"
      onPointerEnter={() => setShow(true)}
      onPointerLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span
          className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md px-2 py-1 text-[10.5px] font-semibold text-white shadow-lg"
          style={{ backgroundColor: "rgba(0,0,0,0.9)", border: `1px solid ${BORDER}` }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
