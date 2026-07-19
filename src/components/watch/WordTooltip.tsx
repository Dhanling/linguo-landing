"use client";

// Tooltip balon di atas kata yang di-tap dalam player Watch & Learn. Menampilkan
// arti + kelas kata (dari word-info AI), lalu deret aksi: Simpan kata (ke
// localStorage), Analisa (mode belajar mendalam layar penuh), dan Dengar.
// Otomatis mengucapkan kata saat dibuka; posisinya menempel di atas titik tap
// dan diklem ke tepi layar. Bisa digeser dari area mana pun kecuali tombol.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookmarkCheck,
  BookmarkPlus,
  Loader2,
  Sparkles,
  Volume2,
  X,
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

const TIP_W = 260;

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
    setSaved(isWordSaved(word, langCode));

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
      saveWord({ word, meaning: meaning?.meaning ?? "", langCode, example: sentence, videoId });
      setSaved(true);
    }
    onSavedChange?.();
  }, [saved, word, langCode, meaning, sentence, videoId, onSavedChange]);

  // Posisi balon: di atas titik tap, diklem ke layar.
  const vw = typeof window !== "undefined" ? window.innerWidth : 360;
  const left = Math.max(8, Math.min(x - TIP_W / 2, vw - TIP_W - 8));
  // Kalau kepenuhan di atas, taruh di bawah titik tap.
  const above = y > 240;
  const top = above ? undefined : y + 16;
  const bottom = above && typeof window !== "undefined" ? window.innerHeight - y + 14 : undefined;

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
        className="pointer-events-auto absolute touch-none cursor-move select-none rounded-2xl p-3.5 shadow-2xl"
        style={{
          left,
          top,
          bottom,
          width: TIP_W,
          backgroundColor: BALLOON,
          border: `1px solid ${BORDER}`,
          transform: `translate(${offset.x}px, ${offset.y}px)`,
          transformOrigin: "center bottom",
          animation: "wtPopUp 240ms cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Header: kata + kelas kata + tutup */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-[18px] font-extrabold text-white">{word}</span>
            {/* Bentuk dasar/infinitive utk verba terkonjugasi — mis. produjo (producir) */}
            {meaning?.base &&
              meaning.base.trim().toLowerCase() !== word.trim().toLowerCase() && (
                <span className="text-[14px] font-semibold" style={{ color: SUB }}>
                  ({meaning.base})
                </span>
              )}
            {meaning?.type && (
              <span
                className="rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold"
                style={{ backgroundColor: "rgba(26,158,158,0.18)", color: "#7FE0E0" }}
              >
                {meaning.type}
              </span>
            )}
          </div>
          <button onClick={onClose} aria-label="Tutup" className="shrink-0 opacity-60 hover:opacity-100">
            <X className="h-4 w-4 text-white" />
          </button>
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

        {/* Aksi */}
        <div className="mt-3 flex gap-2">
          <TipAction active={saved} onClick={toggleSave} label={saved ? "Tersimpan" : "Simpan"}>
            {saved ? <BookmarkCheck className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
          </TipAction>
          <TipAction onClick={() => setStudyOpen(true)} label="Analisa">
            <Sparkles className="h-4 w-4" />
          </TipAction>
          <TipAction onClick={() => speak(word, langCode)} label="Dengar">
            <Volume2 className="h-4 w-4" />
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
  // Ikon saja (ringkas) — labelnya jadi tooltip hover lewat komponen Tip.
  return (
    <Tip label={label}>
      <button
        onClick={onClick}
        aria-label={label}
        className="flex flex-1 items-center justify-center rounded-xl py-2.5 transition duration-150 hover:scale-105 active:scale-95"
        style={{
          backgroundColor: active ? TEAL : "rgba(255,255,255,0.06)",
          color: "#fff",
        }}
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
      className="relative flex flex-1"
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
