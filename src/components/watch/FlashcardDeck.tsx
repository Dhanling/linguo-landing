"use client";

// Flashcard kosakata — versi web dari deck hafalan di app Linguo. Menarik kata
// yang disimpan saat menonton (localStorage, lewat WordTooltip → saveWord), lalu
// menyajikannya sebagai kartu bolak-balik: depan = kata bahasa target, belakang =
// arti + contoh kalimat. Bisa dibalik, dinavigasi, diacak, didengar, dan dihapus.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Layers,
  RotateCcw,
  Shuffle,
  Trash2,
  Volume2,
  X,
} from "lucide-react";
import { getSavedWords, removeSavedWord, SavedWord, speakText } from "@/lib/immersionLearn";
import { getImmersionLang } from "@/lib/immersion";
import { RectFlag } from "@/components/RectFlag";

const TEAL = "#1A9E9E";
const GOLD = "#F4B740";
const CARD = "#161A1C";
const BORDER = "rgba(255,255,255,0.08)";
const SUB = "rgba(255,255,255,0.5)";

// Acak salinan array (Fisher–Yates) — tak mengubah aslinya.
function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function FlashcardDeck({
  initialLang,
  onClose,
  onChange,
}: {
  initialLang: string;
  onClose: () => void;
  onChange?: () => void;
}) {
  const [all, setAll] = useState<SavedWord[]>([]);
  // Filter bahasa aktif: "all" atau kode bahasa.
  const [filter, setFilter] = useState<string>("all");
  const [order, setOrder] = useState<number[]>([]); // urutan indeks (buat acak)
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Hidrasi kosakata + pilih filter awal (bahasa yang sedang ditonton kalau ada).
  useEffect(() => {
    const list = getSavedWords();
    setAll(list);
    const hasInit = list.some((w) => w.langCode === initialLang);
    setFilter(hasInit ? initialLang : "all");
  }, [initialLang]);

  // Bahasa yang punya kata tersimpan — buat chip filter.
  const langCodes = useMemo(() => {
    const seen = new Set<string>();
    for (const w of all) seen.add(w.langCode);
    return [...seen];
  }, [all]);

  const cards = useMemo(
    () => (filter === "all" ? all : all.filter((w) => w.langCode === filter)),
    [all, filter]
  );

  // Bangun ulang urutan tiap kartu/filter berubah; reset ke kartu pertama.
  useEffect(() => {
    setOrder(cards.map((_, i) => i));
    setPos(0);
    setFlipped(false);
  }, [cards.length, filter]);

  const current = cards[order[pos]] ?? null;
  const total = cards.length;

  const go = useCallback(
    (dir: -1 | 1) => {
      setFlipped(false);
      setPos((p) => {
        const n = p + dir;
        if (n < 0 || n >= total) return p;
        return n;
      });
    },
    [total]
  );

  const doShuffle = useCallback(() => {
    setOrder((o) => shuffled(o));
    setPos(0);
    setFlipped(false);
  }, []);

  const removeCurrent = useCallback(() => {
    if (!current) return;
    const next = removeSavedWord(current.word, current.langCode);
    setAll(next);
    onChange?.();
  }, [current, onChange]);

  // Navigasi keyboard: ←/→ pindah, spasi balik kartu.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === " ") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  const lang = current ? getImmersionLang(current.langCode) : null;

  return (
    <div
      className="fixed inset-0 z-[92] flex flex-col"
      style={{ backgroundColor: "rgba(6,9,10,0.97)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: "linear-gradient(135deg,#1A9E9E,#127d7d)" }}
          >
            <Layers className="h-4 w-4" color="#fff" />
          </span>
          <div>
            <p className="text-[15px] font-extrabold text-white">Kosakata Saya</p>
            <p className="text-[11.5px]" style={{ color: SUB }}>
              {total} kartu • kata yang kamu simpan saat menonton
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded-full p-2 transition-colors hover:bg-white/10"
          aria-label="Tutup"
        >
          <X className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Filter bahasa */}
      {langCodes.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-1 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            Semua
          </FilterChip>
          {langCodes.map((code) => {
            const l = getImmersionLang(code);
            return (
              <FilterChip key={code} active={filter === code} onClick={() => setFilter(code)}>
                <RectFlag code={l?.country} h={14} />
                {l?.name ?? code}
              </FilterChip>
            );
          })}
        </div>
      )}

      {/* Kartu */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-4 sm:px-6">
        {total === 0 ? (
          <div className="max-w-sm text-center">
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
            >
              <Layers className="h-6 w-6" color={SUB} />
            </div>
            <p className="text-[16px] font-bold text-white">Belum ada kata tersimpan</p>
            <p className="mx-auto mt-1.5 text-[13px] leading-relaxed" style={{ color: SUB }}>
              Saat menonton, ketuk kata mana pun di transkrip lalu tekan{" "}
              <span style={{ color: TEAL }}>Simpan</span>. Kata itu akan muncul di sini sebagai
              flashcard untuk dihafal.
            </p>
          </div>
        ) : (
          current && (
            <>
              {/* Kartu bolak-balik */}
              <button
                onClick={() => setFlipped((f) => !f)}
                className="group relative w-full max-w-lg"
                style={{ perspective: 1200 }}
                aria-label="Balik kartu"
              >
                <div
                  className="relative w-full transition-transform duration-500"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    minHeight: 300,
                  }}
                >
                  {/* Depan — kata target */}
                  <CardFace>
                    <div className="flex items-center gap-2" style={{ color: SUB }}>
                      <RectFlag code={lang?.country} h={16} />
                      <span className="text-[12px] font-semibold">{lang?.name ?? current.langCode}</span>
                    </div>
                    <p className="px-2 text-center text-[34px] font-extrabold leading-tight text-white sm:text-[42px]">
                      {current.word}
                    </p>
                    <span className="text-[12px]" style={{ color: SUB }}>
                      Ketuk untuk lihat arti
                    </span>
                  </CardFace>

                  {/* Belakang — arti + contoh */}
                  <CardFace back>
                    <span
                      className="rounded-md px-2 py-0.5 text-[11px] font-bold"
                      style={{ backgroundColor: "rgba(26,158,158,0.18)", color: "#7FE0E0" }}
                    >
                      {current.word}
                    </span>
                    <p className="px-2 text-center text-[26px] font-extrabold leading-tight sm:text-[30px]" style={{ color: GOLD }}>
                      {current.meaning || "—"}
                    </p>
                    {current.example && (
                      <p className="px-3 text-center text-[13px] italic leading-snug" style={{ color: SUB }}>
                        “{current.example}”
                      </p>
                    )}
                  </CardFace>
                </div>
              </button>

              {/* Aksi kartu */}
              <div className="mt-5 flex items-center gap-2.5">
                <CardBtn label="Dengar" onClick={() => speakText(current.word, current.langCode)}>
                  <Volume2 className="h-4 w-4" /> Dengar
                </CardBtn>
                <CardBtn label="Balik" onClick={() => setFlipped((f) => !f)}>
                  <RotateCcw className="h-4 w-4" /> Balik
                </CardBtn>
                <CardBtn label="Hapus" danger onClick={removeCurrent}>
                  <Trash2 className="h-4 w-4" /> Hapus
                </CardBtn>
              </div>
            </>
          )
        )}
      </div>

      {/* Navigasi bawah */}
      {total > 0 && (
        <div
          className="flex items-center justify-center gap-4 border-t px-4 py-4 sm:px-6"
          style={{ borderColor: BORDER }}
        >
          <NavBtn label="Sebelumnya" onClick={() => go(-1)} disabled={pos <= 0}>
            <ChevronLeft className="h-5 w-5" />
          </NavBtn>
          <span className="min-w-[64px] text-center text-[14px] font-bold text-white">
            {pos + 1} <span style={{ color: SUB }}>/ {total}</span>
          </span>
          <NavBtn label="Berikutnya" onClick={() => go(1)} disabled={pos >= total - 1}>
            <ChevronRight className="h-5 w-5" />
          </NavBtn>
          <div className="mx-1 h-6 w-px" style={{ backgroundColor: BORDER }} />
          <button
            onClick={doShuffle}
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-bold text-white transition-colors hover:bg-white/10"
            style={{ border: `1px solid ${BORDER}` }}
          >
            <Shuffle className="h-4 w-4" /> Acak
          </button>
        </div>
      )}
    </div>
  );
}

function CardFace({ children, back }: { children: React.ReactNode; back?: boolean }) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-3xl p-6 shadow-2xl"
      style={{
        backgroundColor: CARD,
        border: `1px solid ${back ? "rgba(26,158,158,0.4)" : BORDER}`,
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transform: back ? "rotateY(180deg)" : undefined,
      }}
    >
      {children}
    </div>
  );
}

function CardBtn({
  children,
  label,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-bold transition-colors"
      style={{
        backgroundColor: CARD,
        border: `1px solid ${BORDER}`,
        color: danger ? "#FF6B6B" : "#fff",
      }}
    >
      {children}
    </button>
  );
}

function NavBtn({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 disabled:opacity-30"
      style={{ border: `1px solid ${BORDER}` }}
    >
      {children}
    </button>
  );
}

function FilterChip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-bold transition-colors"
      style={{
        backgroundColor: active ? TEAL : CARD,
        border: `1px solid ${active ? TEAL : BORDER}`,
        color: active ? "#fff" : "rgba(255,255,255,0.8)",
      }}
    >
      {children}
    </button>
  );
}
