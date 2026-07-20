"use client";

// Kuis Arti Kata ala Quizizz — gamifikasi hafalan kosakata tersimpan. Pemain
// menebak arti sebuah kata dari 4 pilihan sebelum waktunya habis; jawab lebih cepat
// = poin lebih besar, jawaban benar beruntun menambah bonus streak. Efek suara
// disintesis lewat Web Audio (lib/quizSound). Di akhir: skor, akurasi, streak
// terbaik, plus daftar kata yang dikuasai (benar) vs perlu diulang (salah).
//
// Catatan: kuis ini MURNI latihan/evaluasi — TIDAK mengubah jadwal SRS deck (aman,
// tak merusak progres "Dikuasai"). Hanya membaca daftar kata tersimpan.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, Clock, Flame, RotateCcw, Volume2, X, Zap } from "lucide-react";
import type { SavedWord } from "@/lib/immersionLearn";
import { speakText } from "@/lib/immersionLearn";
import { getImmersionLang } from "@/lib/immersion";
import { RectFlag } from "@/components/RectFlag";
import { createQuizAudio } from "@/lib/quizSound";

const TEAL = "#1A9E9E";
const TEAL_DARK = "#127d7d";
const GREEN = "#16A34A";
const RED = "#EB5757";
const GOLD = "#F4B740";
const CARD = "#161A1C";
const SURFACE_ALT = "#10161A";
const BORDER = "rgba(255,255,255,0.08)";
const SUB = "rgba(255,255,255,0.5)";

// Warna dasar 4 opsi (ala Quizizz). Saat jawaban terungkap warnanya di-override:
// benar → hijau, pilihan salah → merah, sisanya diredupkan.
const OPTION_COLORS = ["#E8973D", "#7C6BE0", "#2D9CDB", "#E255A1"];

const QUESTIONS_PER_ROUND = 10;
const PER_Q_MS = 20_000; // 20 detik / soal
const OPTIONS = 4;

interface QuizQuestion {
  word: SavedWord;
  options: string[]; // arti (1 benar + 3 pengecoh), sudah diacak
  correct: number; // indeks jawaban benar di options
}

interface Answered {
  word: SavedWord;
  correct: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const norm = (s: string) => s.trim().toLowerCase();

// Bangun satu ronde soal dari kata yang punya arti. Tiap soal butuh 3 pengecoh arti
// yang BERBEDA teksnya dari jawaban benar (dan antar-pengecoh).
function buildRound(pool: SavedWord[]): QuizQuestion[] {
  const eligible = pool.filter((w) => w.word.trim() && w.meaning.trim());
  const picked = shuffle(eligible).slice(0, QUESTIONS_PER_ROUND);
  return picked.map((word) => {
    const correctMeaning = word.meaning.trim();
    const distractors: string[] = [];
    const used = new Set([norm(correctMeaning)]);
    for (const cand of shuffle(eligible)) {
      const m = cand.meaning.trim();
      if (used.has(norm(m))) continue;
      distractors.push(m);
      used.add(norm(m));
      if (distractors.length >= OPTIONS - 1) break;
    }
    const options = shuffle([correctMeaning, ...distractors]);
    return { word, options, correct: options.indexOf(correctMeaning) };
  });
}

export default function VocabQuiz({
  words,
  onExit,
}: {
  words: SavedWord[];
  onExit: () => void;
}) {
  const eligibleCount = useMemo(
    () => words.filter((w) => w.word.trim() && w.meaning.trim()).length,
    [words]
  );
  const audioRef = useRef(createQuizAudio());

  const [phase, setPhase] = useState<"intro" | "playing" | "result">("intro");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<number | null>(null); // null = belum jawab
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(PER_Q_MS);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [gained, setGained] = useState(0); // poin soal terakhir (animasi)
  const [answers, setAnswers] = useState<Answered[]>([]);
  const lastTickRef = useRef<number>(99);

  const start = useCallback(() => {
    audioRef.current.unlock();
    const round = buildRound(words);
    if (round.length === 0) return;
    setQuestions(round);
    setQi(0);
    setPicked(null);
    setRevealed(false);
    setTimeLeft(PER_Q_MS);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setGained(0);
    setAnswers([]);
    lastTickRef.current = 99;
    setPhase("playing");
  }, [words]);

  const q = questions[qi];

  // Kunci jawaban (idx = -1 kalau waktu habis) → hitung poin, mainkan bunyi, catat.
  const lockAnswer = useCallback(
    (idx: number, remainMs: number) => {
      if (!q) return;
      const isCorrect = idx === q.correct;
      const frac = Math.max(0, Math.min(1, remainMs / PER_Q_MS));
      setPicked(idx);
      setRevealed(true);
      const audio = audioRef.current;
      if (isCorrect) {
        // 100 poin dasar + hingga 100 bonus kecepatan + bonus streak (20/streak, maks 100).
        const streakBonus = Math.min(streak, 5) * 20;
        const pts = 100 + Math.round(100 * frac) + streakBonus;
        const nextStreak = streak + 1;
        setGained(pts);
        setScore((s) => s + pts);
        setStreak(nextStreak);
        setBestStreak((b) => Math.max(b, nextStreak));
        audio.correct();
      } else {
        setGained(0);
        setStreak(0);
        audio.wrong();
      }
      setAnswers((a) => [...a, { word: q.word, correct: isCorrect }]);
    },
    [q, streak]
  );

  // Timer per soal — hanya jalan saat belum terjawab. Berbasis timestamp biar akurat.
  useEffect(() => {
    if (phase !== "playing" || revealed || !q) return;
    const startAt = Date.now();
    lastTickRef.current = 99;
    const iv = setInterval(() => {
      const remain = PER_Q_MS - (Date.now() - startAt);
      if (remain <= 0) {
        setTimeLeft(0);
        clearInterval(iv);
        lockAnswer(-1, 0);
        return;
      }
      setTimeLeft(remain);
      // Blip tiap detik di 5 detik terakhir.
      const sec = Math.ceil(remain / 1000);
      if (sec <= 5 && sec !== lastTickRef.current) {
        lastTickRef.current = sec;
        audioRef.current.tick();
      }
    }, 50);
    return () => clearInterval(iv);
  }, [phase, revealed, qi, q, lockAnswer]);

  // Setelah terungkap, jeda sejenak lalu lanjut ke soal berikut / hasil.
  useEffect(() => {
    if (!revealed) return;
    const last = qi >= questions.length - 1;
    const t = setTimeout(() => {
      if (last) {
        audioRef.current.finish();
        setPhase("result");
      } else {
        setQi((i) => i + 1);
        setPicked(null);
        setRevealed(false);
        setTimeLeft(PER_Q_MS);
        setGained(0);
      }
    }, 1150);
    return () => clearTimeout(t);
  }, [revealed, qi, questions.length]);

  const onPick = useCallback(
    (idx: number) => {
      if (revealed) return;
      audioRef.current.click();
      lockAnswer(idx, timeLeft);
    },
    [revealed, lockAnswer, timeLeft]
  );

  // Keyboard: 1–4 pilih opsi, Esc keluar.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return void onExit();
      if (phase !== "playing" || revealed || !q) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= q.options.length) onPick(n - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, revealed, q, onPick, onExit]);

  // ── Gerbang: butuh minimal 4 kata berarti ─────────────────────────────────
  if (eligibleCount < OPTIONS) {
    return (
      <QuizShell onExit={onExit} title="Kuis Arti Kata">
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: `${TEAL}22` }}>
            <Zap className="h-7 w-7" style={{ color: TEAL }} />
          </div>
          <p className="mt-5 text-[20px] font-extrabold text-white">Belum bisa main</p>
          <p className="mt-2 max-w-xs text-[13.5px] leading-relaxed" style={{ color: SUB }}>
            Kuis butuh minimal <b className="text-white">{OPTIONS} kata</b> yang punya arti.
            Kamu punya <b className="text-white">{eligibleCount}</b>. Simpan lebih banyak
            kata saat menonton Watch &amp; Learn, lalu balik ke sini.
          </p>
          <button
            onClick={onExit}
            className="mt-6 rounded-2xl px-6 py-3 text-[14px] font-bold text-white"
            style={{ backgroundColor: TEAL }}
          >
            Mengerti
          </button>
        </div>
      </QuizShell>
    );
  }

  // ── Intro ─────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    const n = Math.min(QUESTIONS_PER_ROUND, eligibleCount);
    return (
      <QuizShell onExit={onExit} title="Kuis Arti Kata">
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-3xl"
            style={{ background: `linear-gradient(135deg,${TEAL},${TEAL_DARK})` }}
          >
            <Zap className="h-9 w-9 text-white" />
          </div>
          <p className="mt-6 text-[26px] font-extrabold text-white">Kuis Arti Kata</p>
          <p className="mt-2 max-w-sm text-[14px] leading-relaxed" style={{ color: SUB }}>
            Tebak arti tiap kata sebelum waktu habis. Makin cepat &amp; makin beruntun,
            makin besar poinmu.
          </p>
          <div className="mt-6 flex gap-3">
            <IntroPill icon={<Zap className="h-4 w-4" />} label={`${n} soal`} />
            <IntroPill icon={<Clock className="h-4 w-4" />} label="20 dtk/soal" />
            <IntroPill icon={<Flame className="h-4 w-4" />} label="Bonus streak" />
          </div>
          <button
            onClick={start}
            className="mt-8 flex items-center gap-2 rounded-2xl px-10 py-4 text-[16px] font-extrabold text-white transition-transform hover:scale-[1.03]"
            style={{ background: `linear-gradient(135deg,${TEAL},${TEAL_DARK})` }}
          >
            Mulai <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </QuizShell>
    );
  }

  // ── Hasil ─────────────────────────────────────────────────────────────────
  if (phase === "result") {
    const correct = answers.filter((a) => a.correct);
    const wrong = answers.filter((a) => !a.correct);
    const accuracy = answers.length ? Math.round((correct.length / answers.length) * 100) : 0;
    return (
      <QuizShell onExit={onExit} title="Hasil Kuis">
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col overflow-y-auto px-6 py-6">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: GOLD }}>
              <Check className="h-8 w-8 text-white" strokeWidth={3} />
            </div>
            <p className="mt-4 text-[13px] font-semibold uppercase tracking-wide" style={{ color: SUB }}>
              Skor kamu
            </p>
            <p className="text-[44px] font-extrabold leading-none" style={{ color: GOLD }}>
              {score}
            </p>
          </div>

          <div
            className="mt-6 flex items-center justify-around rounded-3xl px-4 py-4"
            style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
          >
            <ResultStat value={`${accuracy}%`} label="Akurasi" color="#7FE0E0" />
            <div className="h-8 w-px" style={{ backgroundColor: BORDER }} />
            <ResultStat value={`${correct.length}/${answers.length}`} label="Benar" color={GREEN} />
            <div className="h-8 w-px" style={{ backgroundColor: BORDER }} />
            <ResultStat value={`${bestStreak}🔥`} label="Streak" color={GOLD} />
          </div>

          {correct.length > 0 && (
            <ResultList title={`Kamu kuasai (${correct.length})`} color={GREEN} items={correct} />
          )}
          {wrong.length > 0 && (
            <ResultList title={`Perlu diulang (${wrong.length})`} color={RED} items={wrong} />
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={start}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: TEAL }}
            >
              <RotateCcw className="h-4 w-4" /> Main lagi
            </button>
            <button
              onClick={onExit}
              className="flex-1 rounded-2xl py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-white/10"
              style={{ border: `1px solid ${BORDER}` }}
            >
              Selesai
            </button>
          </div>
        </div>
      </QuizShell>
    );
  }

  // ── Bermain ───────────────────────────────────────────────────────────────
  if (!q) return <QuizShell onExit={onExit} title="Kuis Arti Kata" />;
  const lang = getImmersionLang(q.word.langCode);
  const timePct = Math.max(0, (timeLeft / PER_Q_MS) * 100);
  const timeSec = Math.ceil(timeLeft / 1000);
  const urgent = timeSec <= 5;

  return (
    <QuizShell onExit={onExit} title="Kuis Arti Kata">
      {/* Bar atas: progres soal + skor + streak */}
      <div className="flex items-center gap-3 px-4 pt-1 sm:px-6">
        <span className="text-[13px] font-bold" style={{ color: SUB }}>
          {qi + 1}/{questions.length}
        </span>
        <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: SURFACE_ALT }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${((qi) / questions.length) * 100}%`, backgroundColor: TEAL }} />
        </div>
        {streak >= 2 && (
          <span className="flex items-center gap-1 text-[13px] font-extrabold" style={{ color: GOLD }}>
            <Flame className="h-4 w-4" /> {streak}
          </span>
        )}
        <span className="min-w-[52px] text-right text-[15px] font-extrabold" style={{ color: "#7FE0E0" }}>
          {score}
        </span>
      </div>

      {/* Timer */}
      <div className="mt-3 px-4 sm:px-6">
        <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: SURFACE_ALT }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${timePct}%`,
              backgroundColor: urgent ? RED : TEAL,
              transition: "width 80ms linear",
            }}
          />
        </div>
      </div>

      {/* Kartu soal */}
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-4 text-center">
        <div className="flex items-center gap-2">
          <RectFlag code={lang?.country} h={13} />
          <span className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: SUB }}>
            Apa artinya?
          </span>
          <button
            onClick={() => void speakText(q.word.word, q.word.langCode)}
            aria-label="Dengar kata"
            className="rounded-full p-1.5 transition-colors hover:bg-white/10"
          >
            <Volume2 className="h-4 w-4" style={{ color: SUB }} />
          </button>
        </div>
        <p className="mt-3 break-words px-2 text-[34px] font-extrabold leading-tight text-white sm:text-[40px]">
          {q.word.word}
        </p>
        {gained > 0 && revealed && (
          <p className="mt-2 text-[15px] font-extrabold" style={{ color: GREEN }}>
            +{gained}
          </p>
        )}
      </div>

      {/* Opsi 2×2 */}
      <div className="grid grid-cols-1 gap-3 px-4 pb-5 sm:grid-cols-2 sm:px-6">
        {q.options.map((opt, i) => {
          const base = OPTION_COLORS[i % OPTION_COLORS.length];
          let bg = base;
          let opacity = 1;
          if (revealed) {
            if (i === q.correct) bg = GREEN;
            else if (i === picked) bg = RED;
            else {
              bg = CARD;
              opacity = 0.5;
            }
          }
          return (
            <button
              key={i}
              disabled={revealed}
              onClick={() => onPick(i)}
              className="flex items-center gap-3 rounded-2xl px-4 py-4 text-left text-[15px] font-bold text-white transition-transform disabled:cursor-default enabled:hover:scale-[1.02] enabled:active:scale-[0.99]"
              style={{ backgroundColor: bg, opacity, border: revealed && i !== q.correct && i !== picked ? `1px solid ${BORDER}` : "none" }}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[13px] font-extrabold"
                style={{ backgroundColor: "rgba(0,0,0,0.22)" }}
              >
                {revealed && i === q.correct ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">{opt}</span>
            </button>
          );
        })}
      </div>
    </QuizShell>
  );
}

// ── Sub-komponen ──────────────────────────────────────────────────────────────
function QuizShell({
  children,
  onExit,
  title,
}: {
  children?: React.ReactNode;
  onExit: () => void;
  title: string;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col" style={{ backgroundColor: "#0B0F11" }}>
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <button
          onClick={onExit}
          className="shrink-0 rounded-full p-2 transition-colors hover:bg-white/10"
          aria-label="Keluar kuis"
        >
          <X className="h-5 w-5 text-white" />
        </button>
        <p className="text-[15px] font-bold text-white">{title}</p>
      </div>
      {children}
    </div>
  );
}

function IntroPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span
      className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-bold text-white"
      style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
    >
      <span style={{ color: TEAL }}>{icon}</span>
      {label}
    </span>
  );
}

function ResultStat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="text-center">
      <p className="text-[20px] font-extrabold" style={{ color }}>
        {value}
      </p>
      <p className="mt-0.5 text-[11.5px]" style={{ color: SUB }}>
        {label}
      </p>
    </div>
  );
}

function ResultList({ title, color, items }: { title: string; color: string; items: Answered[] }) {
  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        <p className="text-[13px] font-bold text-white">{title}</p>
      </div>
      <div className="space-y-1.5">
        {items.map((a, i) => (
          <div
            key={`${a.word.langCode}::${a.word.word}::${i}`}
            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5"
            style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-bold text-white">{a.word.word}</p>
              <p className="truncate text-[12.5px]" style={{ color: SUB }}>
                {a.word.meaning}
              </p>
            </div>
            <button
              onClick={() => void speakText(a.word.word, a.word.langCode)}
              aria-label="Dengar"
              className="shrink-0 rounded-full p-1.5 transition-colors hover:bg-white/10"
            >
              <Volume2 className="h-3.5 w-3.5" style={{ color: SUB }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
