"use client";

// Tooltip balon di atas kata yang di-tap dalam player Watch & Learn. Menampilkan
// arti + kelas kata (dari word-info AI), lalu deret aksi: Simpan kata (ke
// localStorage), Analisa (penjelasan tata bahasa), dan Dengar (Web Speech API).
// Otomatis mengucapkan kata saat dibuka; posisinya menempel di atas titik tap
// dan diklem ke tepi layar.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookmarkCheck,
  BookmarkPlus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Maximize2,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";
import WordStudy from "./WordStudy";
import {
  cleanWord,
  getWordGrammar,
  getWordMeaning,
  isNonLatin,
  isWordSaved,
  removeSavedWord,
  saveWord,
  speakText,
  splitWords,
  transliterateLines,
  WordMeaning,
} from "@/lib/immersionLearn";

const TEAL = "#1A9E9E";
const GOLD = "#F4B740";
const BALLOON = "#0A1212";
const SUB = "rgba(255,255,255,0.5)";
const BORDER = "rgba(255,255,255,0.1)";

const TIP_W = 260;

// Berapa kata maksimum dirambatkan otomatis saat kata tunggal tak berarti mandiri
// (kata fungsi) — cukup untuk menangkap frasa seperti "por el entrenamiento de fuerza".
const MAX_AUTO_EXPAND = 4;

// Artikel/determiner per bahasa. Kalau kata yang di-tap didahului salah satunya,
// pilihan awal otomatis mencakup artikelnya (mis. tap "texto" → "el texto"),
// karena artikel gender menentukan bentuk & sering dipelajari sepaket. User tetap
// bisa menciutkan ke "1 kata". Hanya bahasa dengan artikel yang didaftarkan.
const ARTICLES: Record<string, Set<string>> = {
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
  word: rawWord,
  sentence,
  wordIdx,
  langCode,
  x,
  y,
  onClose,
  onSavedChange,
}: {
  word: string;
  sentence: string;
  wordIdx?: number;
  langCode: string;
  x: number;
  y: number;
  onClose: () => void;
  onSavedChange?: () => void;
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

  const [sel, setSel] = useState({ lo: autoLo, hi: initialIdx });
  useEffect(() => setSel({ lo: autoLo, hi: initialIdx }), [autoLo, initialIdx]);

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

  const prevWord = [...wordPositions].reverse().find((p) => p < sel.lo);
  const nextWord = wordPositions.find((p) => p > sel.hi);
  const canLeft = sel.lo >= 0 && prevWord != null;
  const canRight = sel.hi >= 0 && nextWord != null;
  const multi = sel.hi > sel.lo;
  const growLeft = useCallback(() => {
    autoAllowRef.current = false;
    if (prevWord != null) setSel((s) => ({ ...s, lo: prevWord }));
  }, [prevWord]);
  const growRight = useCallback(() => {
    autoAllowRef.current = false;
    if (nextWord != null) setSel((s) => ({ ...s, hi: nextWord }));
  }, [nextWord]);
  const resetOne = useCallback(() => {
    autoAllowRef.current = false;
    setSel({ lo: initialIdx, hi: initialIdx });
  }, [initialIdx]);

  const [meaning, setMeaning] = useState<WordMeaning | null>(null);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [saved, setSaved] = useState(false);
  // Frasa yang `meaning` sekarang wakili — auto-expand hanya boleh lanjut kalau arti
  // yang terlihat memang milik `word` saat ini (bukan sisa fetch sebelumnya), supaya
  // tiap langkah MENUNGGU hasil fetch & tak menembus beberapa perluasan sekaligus.
  const [meaningWord, setMeaningWord] = useState("");

  // Bacaan Latin (romaji/pinyin/dll) untuk kata beraksara non-Latin — word-info
  // "meaning" tak mengembalikannya, jadi kita ambil terpisah via /api/translit.
  const [translit, setTranslit] = useState("");

  // Penjelasan grammar (mode Analisa kata) — dibuka on-demand.
  const [grammarOpen, setGrammarOpen] = useState(false);
  const [grammar, setGrammar] = useState<string | null>(null);
  const [grammarLoading, setGrammarLoading] = useState(false);

  // Mode belajar mendalami kata (layar penuh) — dibuka dari tombol perbesar.
  const [studyOpen, setStudyOpen] = useState(false);

  // Geser bebas — offset dari posisi awal, di-drag lewat header.
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);

  const onDragStart = useCallback(
    (e: React.PointerEvent) => {
      // Jangan mulai drag saat menekan tombol (tutup, dsb).
      if ((e.target as HTMLElement).closest("button")) return;
      e.preventDefault();
      dragRef.current = { sx: e.clientX, sy: e.clientY, ox: offset.x, oy: offset.y };
      const move = (ev: PointerEvent) => {
        const d = dragRef.current;
        if (!d) return;
        setOffset({ x: d.ox + (ev.clientX - d.sx), y: d.oy + (ev.clientY - d.sy) });
      };
      const up = () => {
        dragRef.current = null;
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [offset]
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
    setLoading(true);
    setErrored(false);
    setMeaning(null);
    setTranslit("");
    setSaved(isWordSaved(word, langCode));
    getWordMeaning({ word, sentence, langCode })
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
  }, [word, sentence, langCode]);

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
      saveWord({ word, meaning: meaning?.meaning ?? "", langCode, example: sentence });
      setSaved(true);
    }
    onSavedChange?.();
  }, [saved, word, langCode, meaning, sentence, onSavedChange]);

  const openGrammar = useCallback(() => {
    setGrammarOpen(true);
    if (grammar || grammarLoading) return;
    setGrammarLoading(true);
    getWordGrammar({ word, sentence, langCode })
      .then((t) => setGrammar(t))
      .catch(() => setGrammar("Gagal memuat analisa. Coba lagi nanti."))
      .finally(() => setGrammarLoading(false));
  }, [grammar, grammarLoading, word, sentence, langCode]);

  // Posisi balon: di atas titik tap, diklem ke layar.
  const vw = typeof window !== "undefined" ? window.innerWidth : 360;
  const left = Math.max(8, Math.min(x - TIP_W / 2, vw - TIP_W - 8));
  const wide = grammarOpen;
  // Kalau kepenuhan di atas, taruh di bawah titik tap.
  const above = y > 240;
  const top = above ? undefined : y + 16;
  const bottom = above && typeof window !== "undefined" ? window.innerHeight - y + 14 : undefined;

  return (
    <>
    <div className="fixed inset-0 z-[95]" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute rounded-2xl p-3.5 shadow-2xl"
        style={{
          left,
          top,
          bottom,
          width: wide ? Math.min(320, vw - 16) : TIP_W,
          backgroundColor: BALLOON,
          border: `1px solid ${BORDER}`,
          transform: `translate(${offset.x}px, ${offset.y}px)`,
        }}
      >
        {/* Header: kata + kelas kata + tutup — sekaligus pegangan untuk digeser */}
        <div
          onPointerDown={onDragStart}
          className="flex touch-none cursor-move select-none items-start justify-between gap-2"
        >
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-[18px] font-extrabold text-white">{word}</span>
            {meaning?.type && (
              <span
                className="rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold"
                style={{ backgroundColor: "rgba(26,158,158,0.18)", color: "#7FE0E0" }}
              >
                {meaning.type}
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={() => setStudyOpen(true)}
              aria-label="Belajar mendalam"
              className="opacity-60 hover:opacity-100"
            >
              <Maximize2 className="h-4 w-4 text-white" />
            </button>
            <button onClick={onClose} aria-label="Tutup" className="opacity-60 hover:opacity-100">
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
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
          <p className="mt-1.5 text-[15px] font-bold leading-snug" style={{ color: GOLD }}>
            {meaning.meaning}
          </p>
        )}

        {/* Perluas ke frasa — gabungkan kata di kiri/kanan (mis. "la compañía") */}
        {initialIdx >= 0 && (canLeft || canRight || multi) && (
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="text-[10.5px] font-semibold" style={{ color: SUB }}>
              Frasa
            </span>
            <PhraseBtn onClick={growLeft} disabled={!canLeft} label="Gabung kata kiri">
              <ChevronLeft className="h-3.5 w-3.5" />
            </PhraseBtn>
            <PhraseBtn onClick={growRight} disabled={!canRight} label="Gabung kata kanan">
              <ChevronRight className="h-3.5 w-3.5" />
            </PhraseBtn>
            {multi && (
              <PhraseBtn onClick={resetOne} label="Kembali ke satu kata">
                <span className="text-[10.5px] font-bold">1 kata</span>
              </PhraseBtn>
            )}
          </div>
        )}

        {/* Aksi */}
        <div className="mt-3 flex gap-2">
          <TipAction active={saved} onClick={toggleSave} label={saved ? "Tersimpan" : "Simpan"}>
            {saved ? <BookmarkCheck className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
          </TipAction>
          <TipAction active={grammarOpen} onClick={openGrammar} label="Analisa">
            <Sparkles className="h-4 w-4" />
          </TipAction>
          <TipAction onClick={() => speak(word, langCode)} label="Dengar">
            <Volume2 className="h-4 w-4" />
          </TipAction>
        </div>

        {/* Panel analisa grammar */}
        {grammarOpen && (
          <div
            className="mt-3 max-h-52 overflow-y-auto rounded-xl px-3 py-2.5 [scrollbar-width:thin]"
            style={{ backgroundColor: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}` }}
          >
            {grammarLoading ? (
              <div className="flex items-center gap-2" style={{ color: SUB }}>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-[12px]">Menganalisa…</span>
              </div>
            ) : (
              <GrammarText text={grammar ?? ""} />
            )}
          </div>
        )}
      </div>
    </div>

    {studyOpen && (
      <WordStudy
        word={word}
        sentence={sentence}
        langCode={langCode}
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
    </>
  );
}

// Render penjelasan grammar. word-info membungkus kata target dalam « » guillemet
// (diikuti arti dalam kurung) — kita sorot bagian itu dengan warna teal.
function GrammarText({ text }: { text: string }) {
  const parts = text.split(/(«[^»]*»(?:\s*\([^)]*\))?)/g);
  return (
    <p className="text-[12.5px] leading-relaxed text-white/85">
      {parts.map((p, i) => {
        if (p.startsWith("«")) {
          const clean = p.replace(/[«»]/g, "");
          return (
            <span key={i} className="font-bold" style={{ color: "#7FE0E0" }}>
              {clean}
            </span>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </p>
  );
}

function PhraseBtn({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-6 items-center justify-center rounded-md px-1.5 text-white transition hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
      style={{ border: `1px solid ${BORDER}` }}
    >
      {children}
    </button>
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
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10.5px] font-semibold transition duration-150 hover:scale-105 active:scale-95"
      style={{
        backgroundColor: active ? TEAL : "rgba(255,255,255,0.06)",
        color: "#fff",
      }}
    >
      {children}
      <span>{label}</span>
    </button>
  );
}
