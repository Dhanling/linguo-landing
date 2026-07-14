"use client";

// Flashcard kosakata — versi web dari deck hafalan di app Linguo, kini dengan
// SRS (spaced repetition, varian SM-2) + dashboard analisa. Menarik kata yang
// disimpan saat menonton (localStorage, lewat WordTooltip → saveWord).
//
// Dua tab:
//   • "Belajar"  → alur review SRS: hero "Review Harian" (kartu jatuh tempo),
//                  statistik tahap (Baru/Belajar/Dikuasai), daftar kata, lalu
//                  sesi review kartu-per-kartu dengan 4 tombol nilai ala Anki
//                  (Lagi/Sulit/Bagus/Mudah) yang menjadwal ulang tiap kartu.
//   • "Analisa"  → dashboard: total kata, jatuh tempo, dikuasai, total ulangan,
//                  plus grafik kata dipelajari per hari/minggu/bulan/tahun.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Check,
  Clock,
  Layers,
  Repeat2,
  RotateCcw,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";
import DeckLibrary from "./DeckLibrary";
import {
  FREE_SAVE_LIMIT,
  getSavedWords,
  gradeSavedWord,
  isWatchPremium,
  SavedWord,
  speakText,
} from "@/lib/immersionLearn";
import {
  cardStage,
  gradePreviewLabel,
  isDue,
  newSrsState,
  type CardStage,
  type SrsGrade,
  type SrsState,
} from "@/lib/srs";
import { getImmersionLang } from "@/lib/immersion";
import { RectFlag } from "@/components/RectFlag";

const TEAL = "#1A9E9E";
const TEAL_DARK = "#127d7d";
const GOLD = "#F4B740";
const RED = "#FF6B6B";
const ORANGE = "#E8973D";
const GREEN = "#16A34A";
const PURPLE = "#7C6BE0";
const CARD = "#161A1C";
const SURFACE_ALT = "#10161A";
const BORDER = "rgba(255,255,255,0.08)";
const SUB = "rgba(255,255,255,0.5)";

// Aksen per tahap kematangan (titik + badge) — dipakai daftar kata & statistik.
const STAGE: Record<CardStage, { label: string; color: string }> = {
  new: { label: "Baru", color: PURPLE },
  learning: { label: "Belajar", color: ORANGE },
  mastered: { label: "Dikuasai", color: TEAL },
};

// Empat respons review, urut tampil, dengan warna + nilai SRS.
const GRADES: { grade: SrsGrade; label: string; color: string }[] = [
  { grade: "again", label: "Lagi", color: RED },
  { grade: "hard", label: "Sulit", color: ORANGE },
  { grade: "good", label: "Bagus", color: TEAL },
  { grade: "easy", label: "Mudah", color: GREEN },
];

// ── Statistik deck ────────────────────────────────────────────────────────────
interface DeckStats {
  total: number;
  newCount: number;
  learningCount: number;
  masteredCount: number;
  dueCount: number;
}

function statsFor(words: SavedWord[]): DeckStats {
  let newCount = 0;
  let learningCount = 0;
  let masteredCount = 0;
  let dueCount = 0;
  for (const w of words) {
    const stage = cardStage(w.srs);
    if (stage === "new") newCount++;
    else if (stage === "learning") learningCount++;
    else masteredCount++;
    if (isDue(w.srs)) dueCount++;
  }
  return { total: words.length, newCount, learningCount, masteredCount, dueCount };
}

function isToday(iso?: string | null): boolean {
  if (!iso) return false;
  return new Date(iso).toDateString() === new Date().toDateString();
}

// Urutkan kartu untuk sesi: yang jatuh tempo dulu (atau semua kalau review lebih
// awal / tak ada yang jatuh tempo), lalu diacak.
function buildOrder(words: SavedWord[], reviewAhead: boolean): SavedWord[] {
  const due = words.filter((w) => isDue(w.srs));
  const cards = reviewAhead || due.length === 0 ? words.slice() : due;
  return cards
    .map((c) => ({ c, k: Math.random() }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.c);
}

const srsOf = (w: SavedWord): SrsState => w.srs ?? newSrsState();

type Tab = "belajar" | "deck" | "analisa";
type ViewMode = "home" | "review" | "done";

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
  const [filter, setFilter] = useState<string>("all"); // "all" atau kode bahasa
  const [tab, setTab] = useState<Tab>("belajar");

  // State sesi review (dibekukan saat sesi mulai).
  const [view, setView] = useState<ViewMode>("home");
  const [deck, setDeck] = useState<SavedWord[]>([]);
  const [pos, setPos] = useState(0);
  const [knew, setKnew] = useState(0);

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

  // Jumlah kata per bahasa — dipakai sidebar desktop.
  const langCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const w of all) counts[w.langCode] = (counts[w.langCode] ?? 0) + 1;
    return counts;
  }, [all]);

  const words = useMemo(
    () => (filter === "all" ? all : all.filter((w) => w.langCode === filter)),
    [all, filter]
  );

  const stats = useMemo(() => statsFor(words), [words]);
  const reviewedToday = useMemo(
    () => words.filter((w) => isToday(w.srs?.lastReviewedAt)).length,
    [words]
  );

  // Ganti filter/tab saat sesi tak aktif → kembali ke home.
  useEffect(() => {
    if (view !== "home") setView("home");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // ── Kontrol sesi ────────────────────────────────────────────────────────────
  const startReview = useCallback(
    (reviewAhead: boolean) => {
      const order = buildOrder(words, reviewAhead);
      if (order.length === 0) return;
      setDeck(order);
      setPos(0);
      setKnew(0);
      setView("review");
    },
    [words]
  );

  const onGrade = useCallback(
    (grade: SrsGrade) => {
      const card = deck[pos];
      if (card) {
        const next = gradeSavedWord(card.word, card.langCode, grade);
        setAll(next);
        onChange?.();
        if (grade !== "again") setKnew((k) => k + 1);
      }
      setPos((p) => p + 1);
    },
    [deck, pos, onChange]
  );

  // Deck habis → layar ringkasan.
  const finished = view === "review" && pos >= deck.length && deck.length > 0;
  useEffect(() => {
    if (finished) setView("done");
  }, [finished]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (view === "review" || view === "done") setView("home");
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, onClose]);

  const totalWords = all.length;

  // Deck habis tapi efek belum menggeser ke "done" — jangan kedip ke home dulu.
  if (finished) return <Shell />;

  // ── REVIEW ────────────────────────────────────────────────────────────────
  if (view === "review" && pos < deck.length) {
    const card = deck[pos];
    return (
      <Shell>
        <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
          <button
            onClick={() => setView("home")}
            className="shrink-0 rounded-full p-2 transition-colors hover:bg-white/10"
            aria-label="Tutup review"
          >
            <X className="h-5 w-5 text-white" />
          </button>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: SURFACE_ALT }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(pos / deck.length) * 100}%`, backgroundColor: TEAL }}
            />
          </div>
          <span className="shrink-0 text-[13px] font-bold" style={{ color: SUB }}>
            {pos + 1}/{deck.length}
          </span>
        </div>
        <ReviewCard key={`${card.langCode}::${card.word}::${pos}`} card={card} onGrade={onGrade} />
      </Shell>
    );
  }

  // ── DONE ──────────────────────────────────────────────────────────────────
  if (view === "done") {
    const accuracy = deck.length > 0 ? Math.round((knew / deck.length) * 100) : 0;
    return (
      <Shell>
        <DoneScreen
          cards={deck.length}
          accuracy={accuracy}
          onDone={() => setView("home")}
          onReplay={() => startReview(true)}
        />
      </Shell>
    );
  }

  // ── HOME (tabbed) ──────────────────────────────────────────────────────────
  // Mobile: header + tab + chip filter (layout lama). Desktop (lg+): dashboard
  // dengan sidebar kiri (nav tab, filter bahasa, ringkasan penguasaan) + konten
  // lebar di kanan — memanfaatkan ruang layar PC yang tadinya kosong.
  const masteredPctAll = stats.total > 0 ? Math.round((stats.masteredCount / stats.total) * 100) : 0;
  return (
    <Shell>
      <div className="flex min-h-0 flex-1">
        {/* Sidebar — desktop saja */}
        <aside
          className="hidden w-72 shrink-0 flex-col lg:flex"
          style={{ backgroundColor: SURFACE_ALT, borderRight: `1px solid ${BORDER}` }}
        >
          <div className="flex items-center gap-2.5 px-5 pb-5 pt-6">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: `linear-gradient(135deg,${TEAL},${TEAL_DARK})` }}
            >
              <Layers className="h-5 w-5" color="#fff" />
            </span>
            <div>
              <p className="text-[15px] font-extrabold text-white">Kosakata Saya</p>
              <p className="text-[11.5px]" style={{ color: SUB }}>
                {isWatchPremium()
                  ? `${totalWords} kata tersimpan`
                  : `${totalWords}/${FREE_SAVE_LIMIT} kata gratis`}
              </p>
            </div>
          </div>

          <nav className="space-y-1 px-3">
            <SideNavBtn active={tab === "belajar"} onClick={() => setTab("belajar")} icon={<Layers className="h-4 w-4" />}>
              Belajar
            </SideNavBtn>
            <SideNavBtn active={tab === "deck"} onClick={() => setTab("deck")} icon={<Sparkles className="h-4 w-4" />}>
              Deck
            </SideNavBtn>
            <SideNavBtn active={tab === "analisa"} onClick={() => setTab("analisa")} icon={<BarChart3 className="h-4 w-4" />}>
              Analisa
            </SideNavBtn>
          </nav>

          {langCodes.length > 1 && (
            <div className="mt-6 min-h-0 flex-1 overflow-y-auto px-3">
              <p className="px-3 pb-2 text-[10.5px] font-bold uppercase tracking-wider" style={{ color: SUB }}>
                Bahasa
              </p>
              <div className="space-y-1">
                <SideLangBtn active={filter === "all"} onClick={() => setFilter("all")} label="Semua bahasa" count={all.length} />
                {langCodes.map((code) => {
                  const l = getImmersionLang(code);
                  return (
                    <SideLangBtn
                      key={code}
                      active={filter === code}
                      onClick={() => setFilter(code)}
                      flag={l?.country}
                      label={l?.name ?? code}
                      count={langCounts[code] ?? 0}
                    />
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-auto px-4 py-5">
            <div className="rounded-2xl p-4" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
              <div className="flex items-center justify-between">
                <span className="text-[12px]" style={{ color: SUB }}>
                  Dikuasai
                </span>
                <span className="text-[12px] font-bold" style={{ color: "#7FE0E0" }}>
                  {stats.masteredCount}/{stats.total} · {masteredPctAll}%
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: SURFACE_ALT }}>
                <div className="h-full rounded-full" style={{ width: `${masteredPctAll}%`, backgroundColor: TEAL }} />
              </div>
            </div>
          </div>
        </aside>

        {/* Konten utama */}
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Header + tab + chip — mobile/tablet (layout lama) */}
          <div className="lg:hidden">
            <div className="flex items-center justify-between px-4 py-3 sm:px-6">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: `linear-gradient(135deg,${TEAL},${TEAL_DARK})` }}
                >
                  <Layers className="h-4 w-4" color="#fff" />
                </span>
                <div>
                  <p className="text-[15px] font-extrabold text-white">Kosakata Saya</p>
                  <p className="text-[11.5px]" style={{ color: SUB }}>
                    {totalWords} kata • hafalan dengan pengulangan berjarak
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

            <div className="flex gap-1 px-4 sm:px-6">
              <TabBtn active={tab === "belajar"} onClick={() => setTab("belajar")}>
                <Layers className="h-4 w-4" /> Belajar
              </TabBtn>
              <TabBtn active={tab === "deck"} onClick={() => setTab("deck")}>
                <Sparkles className="h-4 w-4" /> Deck
              </TabBtn>
              <TabBtn active={tab === "analisa"} onClick={() => setTab("analisa")}>
                <BarChart3 className="h-4 w-4" /> Analisa
              </TabBtn>
            </div>

            {langCodes.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
          </div>

          {/* Topbar — desktop saja */}
          <div
            className="hidden items-center justify-between px-8 py-4 lg:flex"
            style={{ borderBottom: `1px solid ${BORDER}` }}
          >
            <div>
              <p className="text-[18px] font-extrabold leading-tight text-white">
                {tab === "belajar" ? "Belajar" : tab === "deck" ? "Deck" : "Analisa"}
              </p>
              <p className="text-[12px]" style={{ color: SUB }}>
                {tab === "belajar"
                  ? `${words.length} kata • hafalan dengan pengulangan berjarak`
                  : tab === "deck"
                  ? "Deck tematik AI, dari video, buatan sendiri & komunitas"
                  : "Statistik & progres belajarmu"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 rounded-full p-2 transition-colors hover:bg-white/10"
              aria-label="Tutup"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
            <div className="mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none">
              {tab === "deck" ? (
                // Tab Deck tetap tampil walau belum ada kata tersimpan — justru
                // deck (AI/komunitas) jadi jalan tercepat mengisi kosakata.
                <DeckLibrary
                  lang={filter !== "all" ? filter : initialLang}
                  onVocabChange={() => {
                    setAll(getSavedWords());
                    onChange?.();
                  }}
                />
              ) : totalWords === 0 ? (
                <EmptyState />
              ) : tab === "belajar" ? (
                <BelajarTab
                  words={words}
                  stats={stats}
                  reviewedToday={reviewedToday}
                  onStart={startReview}
                />
              ) : (
                <AnalisaTab words={words} stats={stats} />
              )}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

// ── Tab Belajar (home review) ─────────────────────────────────────────────────
function BelajarTab({
  words,
  stats,
  reviewedToday,
  onStart,
}: {
  words: SavedWord[];
  stats: DeckStats;
  reviewedToday: number;
  onStart: (reviewAhead: boolean) => void;
}) {
  const due = stats.dueCount;
  const todayTarget = due + reviewedToday;
  const todayPct = todayTarget > 0 ? Math.round((reviewedToday / todayTarget) * 100) : 0;
  const masteredPct = stats.total > 0 ? Math.round((stats.masteredCount / stats.total) * 100) : 0;

  return (
    // Desktop: 2 kolom — panel review (kiri, sticky) + daftar kata (kanan, grid).
    <div className="space-y-4 lg:grid lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start lg:gap-8 lg:space-y-0">
      <div className="space-y-4 lg:sticky lg:top-0">
      {/* Hero Review Harian */}
      <div
        className="rounded-3xl p-5"
        style={{ background: `linear-gradient(135deg,${TEAL},${TEAL_DARK})` }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-white/80">Review Harian</p>
        <p className="mt-1 text-[24px] font-extrabold leading-tight text-white">
          {due > 0 ? `${due} kartu jatuh tempo` : "Semua kartu sudah diulang"}
        </p>
        {due > 0 ? (
          <>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[13px] text-white/80">Progres hari ini</span>
              <span className="text-[13px] font-bold text-white">
                {reviewedToday} / {todayTarget}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/25">
              <div className="h-full rounded-full bg-white" style={{ width: `${todayPct}%` }} />
            </div>
          </>
        ) : (
          <p className="mt-1.5 text-[13px] text-white/80">Kamu bisa mengulang lebih awal kapan saja.</p>
        )}
        <button
          onClick={() => onStart(due === 0)}
          className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-white py-3.5 text-[15px] font-bold transition-opacity hover:opacity-90"
          style={{ color: TEAL_DARK }}
        >
          {due > 0 ? "Mulai review" : "Ulang lebih awal"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Progres penguasaan */}
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[13px]" style={{ color: SUB }}>
            {stats.masteredCount} dari {stats.total} sudah dikuasai
          </span>
          <span className="text-[13px] font-bold" style={{ color: "#7FE0E0" }}>
            {masteredPct}%
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full" style={{ backgroundColor: SURFACE_ALT }}>
          <div className="h-full rounded-full" style={{ width: `${masteredPct}%`, backgroundColor: TEAL }} />
        </div>
      </div>

      {/* Statistik tahap */}
      <div className="flex gap-2.5">
        <StageTile value={stats.newCount} label="Baru" color={PURPLE} />
        <StageTile value={stats.learningCount} label="Belajar" color={ORANGE} />
        <StageTile value={stats.masteredCount} label="Dikuasai" color={TEAL} />
      </div>
      </div>

      {/* Daftar kata */}
      <div>
        <p className="mb-3 mt-2 text-[14px] font-bold text-white lg:mt-0">Kata ({stats.total})</p>
        <div className="space-y-2.5 xl:grid xl:grid-cols-2 xl:gap-2.5 xl:space-y-0">
          {words.map((w) => {
            const accent = STAGE[cardStage(w.srs)];
            const lang = getImmersionLang(w.langCode);
            return (
              <div
                key={`${w.langCode}::${w.word}`}
                className="flex items-center gap-3 rounded-2xl px-4 py-3"
                style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: accent.color }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-bold text-white">{w.word}</p>
                  {w.meaning && (
                    <p className="truncate text-[13px]" style={{ color: SUB }}>
                      {w.meaning}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => speakText(w.word, w.langCode)}
                  aria-label="Dengar"
                  className="shrink-0 rounded-full p-2 transition-colors hover:bg-white/10"
                >
                  <Volume2 className="h-4 w-4" style={{ color: SUB }} />
                </button>
                <span
                  className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold"
                  style={{ backgroundColor: `${accent.color}22`, color: accent.color }}
                >
                  {accent.label}
                </span>
                <RectFlag code={lang?.country} h={13} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Kartu review (tap untuk lihat arti → nilai) ───────────────────────────────
function ReviewCard({ card, onGrade }: { card: SavedWord; onGrade: (g: SrsGrade) => void }) {
  const [revealed, setRevealed] = useState(false);
  const lang = getImmersionLang(card.langCode);
  const srs = srsOf(card);

  // Otomatis bunyikan kata begitu kartu muncul.
  useEffect(() => {
    const t = setTimeout(() => void speakText(card.word, card.langCode), 250);
    return () => clearTimeout(t);
  }, [card.word, card.langCode]);

  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-6">
      <div className="flex flex-1 items-center justify-center">
        <button
          onClick={() => setRevealed((v) => !v)}
          className="relative w-full max-w-lg rounded-3xl p-6 text-left"
          style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, minHeight: 280 }}
          aria-label="Balik kartu"
        >
          {/* Depan */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2" style={{ color: SUB }}>
              <RectFlag code={lang?.country} h={16} />
              <span className="text-[12px] font-semibold">{lang?.name ?? card.langCode}</span>
            </div>
            <p className="mt-3 text-center text-[34px] font-extrabold leading-tight text-white sm:text-[40px]">
              {card.word}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                speakText(card.word, card.langCode);
              }}
              className="mt-4 flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-white/10"
              style={{ backgroundColor: SURFACE_ALT }}
              aria-label="Dengar"
            >
              <Volume2 className="h-5 w-5" style={{ color: TEAL }} />
            </button>
          </div>

          {/* Belakang */}
          {revealed ? (
            <div className="mt-6 flex flex-col items-center">
              <div className="h-px w-full" style={{ backgroundColor: BORDER }} />
              <p className="mt-5 text-[11px] font-bold uppercase tracking-wider" style={{ color: TEAL }}>
                Bahasa Indonesia
              </p>
              <p className="mt-2 text-center text-[24px] font-extrabold leading-tight" style={{ color: GOLD }}>
                {card.meaning || "—"}
              </p>
              {card.example && (
                <div
                  className="mt-4 w-full rounded-2xl px-4 py-3 text-center text-[13px] italic"
                  style={{ backgroundColor: SURFACE_ALT, color: SUB }}
                >
                  “{card.example}”
                </div>
              )}
            </div>
          ) : (
            <p className="mt-6 text-center text-[13px]" style={{ color: SUB }}>
              Ketuk kartu untuk lihat arti
            </p>
          )}
        </button>
      </div>

      {/* Kontrol bawah */}
      <div className="mx-auto w-full max-w-lg pt-4">
        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="w-full rounded-2xl py-4 text-[15px] font-bold transition-opacity hover:opacity-90"
            style={{ border: `1px solid ${TEAL}`, color: "#7FE0E0", backgroundColor: CARD }}
          >
            Tampilkan jawaban
          </button>
        ) : (
          <>
            <p className="mb-2.5 text-center text-[13px]" style={{ color: SUB }}>
              Seberapa baik kamu mengingatnya?
            </p>
            <div className="flex gap-2">
              {GRADES.map(({ grade, label, color }) => (
                <button
                  key={grade}
                  onClick={() => onGrade(grade)}
                  className="flex-1 rounded-2xl py-3 text-center transition-opacity hover:opacity-90"
                  style={{ backgroundColor: color }}
                >
                  <span className="block text-[14px] font-bold text-white">{label}</span>
                  <span className="mt-0.5 block text-[10px] font-medium text-white/85">
                    {gradePreviewLabel(srs, grade)}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Ringkasan sesi ────────────────────────────────────────────────────────────
function DoneScreen({
  cards,
  accuracy,
  onDone,
  onReplay,
}: {
  cards: number;
  accuracy: number;
  onDone: () => void;
  onReplay: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: TEAL }}>
        <Check className="h-9 w-9 text-white" strokeWidth={3} />
      </div>
      <p className="mt-6 text-[26px] font-extrabold text-white">Sesi selesai!</p>
      <p className="mt-2 text-[15px]" style={{ color: SUB }}>
        Kerja bagus — kamu mereview {cards} kartu.
      </p>

      <div
        className="mt-8 flex w-full max-w-sm items-center justify-around rounded-3xl px-4 py-5"
        style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
      >
        <div>
          <p className="text-[24px] font-extrabold" style={{ color: "#7FE0E0" }}>
            {cards}
          </p>
          <p className="mt-0.5 text-[12px]" style={{ color: SUB }}>
            Kartu
          </p>
        </div>
        <div className="h-8 w-px" style={{ backgroundColor: BORDER }} />
        <div>
          <p className="text-[24px] font-extrabold" style={{ color: GREEN }}>
            {accuracy}%
          </p>
          <p className="mt-0.5 text-[12px]" style={{ color: SUB }}>
            Akurasi
          </p>
        </div>
      </div>

      <div className="mt-8 w-full max-w-sm space-y-3">
        <button
          onClick={onDone}
          className="w-full rounded-2xl py-4 text-[15px] font-bold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: TEAL }}
        >
          Selesai
        </button>
        <button
          onClick={onReplay}
          className="w-full rounded-2xl py-3.5 text-[14px] font-bold text-white transition-colors hover:bg-white/10"
          style={{ border: `1px solid ${BORDER}` }}
        >
          Review lagi
        </button>
      </div>
    </div>
  );
}

// ── Tab Analisa (dashboard) ───────────────────────────────────────────────────
type Range = "day" | "week" | "month" | "year";

const RANGES: { id: Range; label: string }[] = [
  { id: "day", label: "Hari" },
  { id: "week", label: "Minggu" },
  { id: "month", label: "Bulan" },
  { id: "year", label: "Tahun" },
];

interface Bucket {
  label: string;
  count: number;
  start: number;
  end: number;
}

// Bangun bucket grafik untuk rentang tertentu. Selalu menengok ke belakang sejumlah
// bucket tetap yang berakhir "sekarang" → grafik terbaca kiri→kanan lama→baru.
function buildBuckets(range: Range, now: Date): Bucket[] {
  const buckets: Bucket[] = [];
  if (range === "day") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const end = new Date(d);
      end.setDate(end.getDate() + 1);
      buckets.push({ label: ["M", "S", "S", "R", "K", "J", "S"][d.getDay()], count: 0, start: d.getTime(), end: end.getTime() });
    }
  } else if (range === "week") {
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - d.getDay() - i * 7);
      const end = new Date(d);
      end.setDate(end.getDate() + 7);
      buckets.push({ label: `${d.getDate()}/${d.getMonth() + 1}`, count: 0, start: d.getTime(), end: end.getTime() });
    }
  } else if (range === "month") {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      buckets.push({ label: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][d.getMonth()], count: 0, start: d.getTime(), end: end.getTime() });
    }
  } else {
    for (let i = 4; i >= 0; i--) {
      const y = now.getFullYear() - i;
      const d = new Date(y, 0, 1);
      const end = new Date(y + 1, 0, 1);
      buckets.push({ label: `${y}`, count: 0, start: d.getTime(), end: end.getTime() });
    }
  }
  return buckets;
}

function AnalisaTab({ words, stats }: { words: SavedWord[]; stats: DeckStats }) {
  const [range, setRange] = useState<Range>("day");
  const now = useMemo(() => new Date(), []);

  const buckets = useMemo(() => {
    const bs = buildBuckets(range, now);
    for (const w of words) {
      const t = w.ts;
      if (!t || Number.isNaN(t)) continue;
      const b = bs.find((x) => t >= x.start && t < x.end);
      if (b) b.count++;
    }
    return bs;
  }, [words, range, now]);

  const periodTotal = buckets.reduce((s, b) => s + b.count, 0);
  const maxCount = Math.max(1, ...buckets.map((b) => b.count));
  const reviews = useMemo(() => words.reduce((s, w) => s + (w.srs?.reviewCount ?? 0), 0), [words]);
  const notReviewed = stats.newCount; // belum pernah direview (reps 0)

  const periodLabel =
    range === "day" ? "7 hari terakhir" : range === "week" ? "8 minggu terakhir" : range === "month" ? "12 bulan terakhir" : "5 tahun terakhir";

  return (
    <div className="space-y-4">
      {/* Kartu ringkasan SRS */}
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={<BookOpen className="h-[18px] w-[18px]" style={{ color: TEAL }} />} value={stats.total} label="Total kata" />
        <StatCard icon={<Clock className="h-[18px] w-[18px]" style={{ color: ORANGE }} />} value={stats.dueCount} label="Jatuh tempo" />
        <StatCard icon={<Award className="h-[18px] w-[18px]" style={{ color: GREEN }} />} value={stats.masteredCount} label="Dikuasai" />
        <StatCard icon={<RotateCcw className="h-[18px] w-[18px]" style={{ color: PURPLE }} />} value={notReviewed} label="Belum direview" />
        <StatCard icon={<Repeat2 className="h-[18px] w-[18px]" style={{ color: "#7FE0E0" }} />} value={reviews} label="Total ulangan" />
        <StatCard icon={<Layers className="h-[18px] w-[18px]" style={{ color: ORANGE }} />} value={stats.learningCount} label="Sedang belajar" />
      </div>

      {/* Filter rentang */}
      <div className="flex gap-1 rounded-2xl p-1" style={{ backgroundColor: SURFACE_ALT }}>
        {RANGES.map((r) => {
          const active = range === r.id;
          return (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className="flex-1 rounded-xl py-2.5 text-[13px] font-bold transition-colors"
              style={{ backgroundColor: active ? CARD : "transparent", color: active ? "#7FE0E0" : SUB }}
            >
              {r.label}
            </button>
          );
        })}
      </div>

      {/* Total periode */}
      <div className="text-center">
        <p className="text-[36px] font-extrabold leading-none text-white">{periodTotal}</p>
        <p className="mt-1.5 text-[13px]" style={{ color: SUB }}>
          kata dipelajari · {periodLabel}
        </p>
      </div>

      {/* Grafik batang */}
      <div className="rounded-3xl p-4" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
        <div className="flex h-40 items-end justify-between gap-1">
          {buckets.map((b, i) => {
            const h = Math.round((b.count / maxCount) * 128);
            return (
              <div key={i} className="flex flex-1 flex-col items-center justify-end" style={{ height: 150 }}>
                {b.count > 0 && (
                  <span className="mb-1 text-[10px] font-bold" style={{ color: SUB }}>
                    {b.count}
                  </span>
                )}
                <div
                  className="w-[60%] rounded-md"
                  style={{
                    height: Math.max(4, h),
                    backgroundColor: b.count > 0 ? TEAL : BORDER,
                  }}
                />
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between gap-1">
          {buckets.map((b, i) => {
            const step = buckets.length > 8 ? Math.ceil(buckets.length / 5) : 1;
            const show = i % step === 0 || i === buckets.length - 1;
            return (
              <div key={i} className="flex-1 text-center">
                <span className="text-[9px]" style={{ color: show ? SUB : "transparent" }}>
                  {b.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {words.length === 0 && (
        <p className="text-center text-[13px]" style={{ color: SUB }}>
          Belum ada data. Simpan kosakata saat menonton untuk melihat progresmu.
        </p>
      )}
    </div>
  );
}

// ── Bagian bersama ────────────────────────────────────────────────────────────
function Shell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[92] flex flex-col" style={{ backgroundColor: "rgba(6,9,10,0.97)" }}>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto max-w-sm pt-10 text-center">
      <div
        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
      >
        <Layers className="h-6 w-6" color={SUB} />
      </div>
      <p className="text-[16px] font-bold text-white">Belum ada kata tersimpan</p>
      <p className="mx-auto mt-1.5 text-[13px] leading-relaxed" style={{ color: SUB }}>
        Saat menonton, ketuk kata mana pun di transkrip lalu tekan{" "}
        <span style={{ color: TEAL }}>Simpan</span>. Kata itu akan muncul di sini sebagai flashcard
        untuk dihafal.
      </p>
    </div>
  );
}

function TabBtn({
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
      className="inline-flex items-center gap-1.5 rounded-t-xl border-b-2 px-4 py-2.5 text-[13.5px] font-bold transition-colors"
      style={{
        borderColor: active ? TEAL : "transparent",
        color: active ? "#fff" : SUB,
      }}
    >
      {children}
    </button>
  );
}

// Tombol nav vertikal di sidebar desktop (tab Belajar / Analisa).
function SideNavBtn({
  children,
  icon,
  active,
  onClick,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13.5px] font-bold transition-colors hover:bg-white/5"
      style={{
        backgroundColor: active ? `${TEAL}26` : "transparent",
        color: active ? "#7FE0E0" : SUB,
      }}
    >
      {icon}
      {children}
    </button>
  );
}

// Item filter bahasa di sidebar desktop — bendera + nama + jumlah kata.
function SideLangBtn({
  active,
  onClick,
  flag,
  label,
  count,
}: {
  active?: boolean;
  onClick: () => void;
  flag?: string;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-semibold transition-colors hover:bg-white/5"
      style={{
        backgroundColor: active ? `${TEAL}26` : "transparent",
        color: active ? "#fff" : "rgba(255,255,255,0.75)",
      }}
    >
      {flag ? <RectFlag code={flag} h={13} /> : <span className="h-[13px] w-[19px] rounded-sm" style={{ backgroundColor: BORDER }} />}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span
        className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold"
        style={{ backgroundColor: active ? `${TEAL}44` : SURFACE_ALT, color: active ? "#7FE0E0" : SUB }}
      >
        {count}
      </span>
    </button>
  );
}

function StageTile({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div
      className="flex-1 rounded-2xl py-3.5 text-center"
      style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
    >
      <p className="text-[20px] font-extrabold" style={{ color }}>
        {value}
      </p>
      <p className="mt-0.5 text-[12px]" style={{ color: SUB }}>
        {label}
      </p>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="rounded-2xl p-3.5" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
      {icon}
      <p className="mt-2 text-[22px] font-extrabold text-white">{value}</p>
      <p className="text-[12px]" style={{ color: SUB }}>
        {label}
      </p>
    </div>
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
