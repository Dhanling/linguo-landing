"use client";

// [watch-explain-word-tip-v1] Balon arti kecil untuk kata bahasa target yang di-tap
// DI DALAM teks penjelasan drawer (jawaban Tanya AI / Analisa Kalimat). Sepupu ringkas
// WordTooltip player: arti + Simpan + Analisa + TTS (auto-ucap saat buka, ketuk balon
// utk ulang). TTS memakai cache bersama speakText → klik lagi = audio yang sama, tanpa
// generate ulang. TIDAK meng-import WordStudy (aksi "Analisa" dioper ke host lewat
// onAnalyze) supaya bebas dari import melingkar saat dipakai di dalam WordStudy sendiri.

import { useCallback, useEffect, useRef, useState } from "react";
import { BookmarkCheck, BookmarkPlus, Loader2, Sparkles } from "lucide-react";
import {
  canSaveWord,
  getWordMeaning,
  isNonLatin,
  isWordSaved,
  removeSavedWord,
  savedWordCount,
  saveWord,
  speakText,
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

export default function ExplanationWordTip({
  word,
  sentence,
  langCode,
  baseCode,
  videoId,
  x,
  y,
  onClose,
  onAnalyze,
  onSavedChange,
}: {
  // Kata/frasa bahasa target yang di-tap di teks penjelasan.
  word: string;
  // Kalimat konteks (kalimat/kata yang sedang dibahas drawer) — bantu arti akurat.
  sentence: string;
  langCode: string;
  baseCode?: string;
  videoId?: string;
  // Titik klik (viewport) — balon dipasang menempel di atas/bawahnya, diklem ke layar.
  x: number;
  y: number;
  onClose: () => void;
  // Buka analisa mendalam kata ini (host yang memutuskan render WordStudy).
  onAnalyze: (word: string) => void;
  onSavedChange?: () => void;
}) {
  const [meaning, setMeaning] = useState<WordMeaning | null>(null);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [saved, setSaved] = useState(false);
  const [translit, setTranslit] = useState("");
  const [upsellCount, setUpsellCount] = useState<number | null>(null);
  // Penyimpanan browser penuh/diblokir → tampilkan pesan, jangan gagal diam-diam.
  const [saveError, setSaveError] = useState(false);

  // Arti + bacaan Latin (background) tiap kata berubah.
  useEffect(() => {
    let cancelled = false;
    setSaved(isWordSaved(word, langCode));
    setLoading(true);
    setErrored(false);
    setMeaning(null);
    setTranslit("");
    getWordMeaning({ word, sentence, langCode, baseCode })
      .then((m) => !cancelled && setMeaning(m))
      .catch(() => !cancelled && setErrored(true))
      .finally(() => !cancelled && setLoading(false));
    if (isNonLatin(langCode)) {
      transliterateLines([word], langCode)
        .then((r) => !cancelled && r[0] && setTranslit(r[0]))
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [word, sentence, langCode, baseCode]);

  // Auto-ucap saat balon dibuka (cache speakText → hemat kuota kalau kata sama).
  useEffect(() => {
    const id = window.setTimeout(() => void speakText(word, langCode), 200);
    return () => window.clearTimeout(id);
  }, [word, langCode]);

  const toggleSave = useCallback(() => {
    if (saved) {
      removeSavedWord(word, langCode);
      setSaved(false);
    } else {
      if (!canSaveWord(word, langCode)) {
        setUpsellCount(savedWordCount());
        return;
      }
      // Gagal tulis (penyimpanan penuh) → jangan tampil "Tersimpan" palsu.
      const res = saveWord({
        word,
        meaning: meaning?.meaning ?? "",
        langCode,
        example: sentence,
        videoId,
      });
      if (!res.ok) {
        setSaveError(true);
        return;
      }
      setSaveError(false);
      setSaved(true);
    }
    onSavedChange?.();
  }, [saved, word, langCode, meaning, sentence, videoId, onSavedChange]);

  // Posisi balon: di atas titik tap, diklem ke layar (di bawah kalau kepenuhan di atas).
  const vw = typeof window !== "undefined" ? window.innerWidth : 360;
  const left = Math.max(8, Math.min(x - TIP_W / 2, vw - TIP_W - 8));
  const above = y > 240;
  const top = above ? undefined : y + 26;
  const bottom = above && typeof window !== "undefined" ? window.innerHeight - y + 24 : undefined;
  const tailLeft = Math.max(20, Math.min(x - left, TIP_W - 20));

  return (
    <>
      {/* Backdrop tembus-pandang: klik di luar balon = tutup. z di ATAS drawer (z-97). */}
      <div className="fixed inset-0 z-[98]" onClick={onClose} aria-hidden />
      <style>{`@keyframes ewtPop{from{opacity:0;transform:translateY(10px) scale(0.94)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
      <div
        // Ketuk area balon (bukan tombol) = ucap ulang kata (TTS cache).
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          void speakText(word, langCode);
        }}
        className="fixed z-[99] cursor-pointer select-none rounded-2xl p-3 shadow-2xl"
        style={{
          left,
          top,
          bottom,
          width: TIP_W,
          backgroundColor: BALLOON,
          border: `1px solid ${BORDER}`,
          transformOrigin: "center bottom",
          animation: "ewtPop 200ms cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Ekor speech-bubble menunjuk ke kata */}
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

        {/* Header: kata + bentuk dasar + kelas kata (kiri) — aksi Simpan · Analisa (kanan) */}
        <div className="flex items-start justify-between gap-1.5">
          <div className="flex min-w-0 items-baseline gap-1.5">
            <span className="shrink-0 text-[16px] font-extrabold text-white" dir="auto">
              {word}
            </span>
            {meaning?.base && meaning.base.trim().toLowerCase() !== word.trim().toLowerCase() && (
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
          <div className="flex shrink-0 items-center gap-0.5">
            <TipAction active={saved} onClick={toggleSave} label={saved ? "Tersimpan" : "Simpan"}>
              {saved ? <BookmarkCheck className="h-[17px] w-[17px]" /> : <BookmarkPlus className="h-[17px] w-[17px]" />}
            </TipAction>
            <TipAction onClick={() => onAnalyze(word)} label="Analisa">
              <Sparkles className="h-[17px] w-[17px]" />
            </TipAction>
          </div>
        </div>

        {/* Bacaan Latin (bahasa non-Latin) */}
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

        {saveError && (
          <p className="mt-1.5 text-[11px] font-medium leading-snug" style={{ color: "#FCA5A5" }}>
            Gagal menyimpan — penyimpanan browser penuh.
          </p>
        )}
      </div>

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
  const [show, setShow] = useState(false);
  return (
    <div className="relative flex" onPointerEnter={() => setShow(true)} onPointerLeave={() => setShow(false)}>
      <button
        onClick={onClick}
        aria-label={label}
        className="flex items-center justify-center rounded-lg p-1.5 transition duration-150 hover:scale-125 hover:bg-white/10 active:scale-95"
        style={{ color: active ? TEAL : "rgba(255,255,255,0.85)" }}
      >
        {children}
      </button>
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
