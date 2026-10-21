"use client";

// Hujan Kata — game mengetik kosakata tersimpan. Arti kata (bahasa Indonesia) jatuh
// dari langit; pemain mengingat katanya lalu mengetiknya sebelum menyentuh tanah.
// Huruf pertama mengunci kata terdekat ke tanah yang berawalan huruf itu, Backspace
// melepas kunci. Tiap 6 kata tertangkap level naik: hujan makin cepat & rapat.
// 5 nyawa — kata yang lolos ke tanah memotong satu nyawa dan diselipkan lagi ke
// antrean supaya muncul kembali (justru kata yang belum hafal yang diulang).
//
// Kata beraksara non-Latin diketik lewat bacaan Latin-nya (`translit`: romaji,
// pinyin, dst). Diakritik diabaikan (é → e, ō → o) supaya bisa diketik di keyboard
// biasa. Sama seperti Kuis Arti Kata, game ini MURNI latihan — tidak menyentuh SRS.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CloudRain,
  Flame,
  Heart,
  Keyboard,
  Pause,
  Play,
  RotateCcw,
  Sailboat,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import type { SavedWord } from "@/lib/immersionLearn";
import { isNonLatin, speakText } from "@/lib/immersionLearn";
import { createQuizAudio, type QuizAudio } from "@/lib/quizSound";
import { useT } from "@/lib/uiLang"; // [ui-lang-switcher-v1]

const TEAL = "#1A9E9E";
const TEAL_DARK = "#127d7d";
const TEAL_LIGHT = "#5EEAD4";
const GREEN = "#4ADE80";
const RED = "#EB5757";
const GOLD = "#F4B740";
const CARD = "#161A1C";
const BORDER = "rgba(255,255,255,0.08)";
const SUB = "rgba(255,255,255,0.5)";

const MIN_WORDS = 4;
const MAX_LIVES = 5;
const WORDS_PER_LEVEL = 6;
const MAX_KEYS = 24; // frasa lebih panjang dari ini tak diikutkan
const FX_MS = 1100;
const MISS_MS = 2200; // jawaban kata yang terlewat tampil lebih lama supaya sempat dibaca
const BEST_KEY = "linguo:watch:wordrain:best:v1";

// ── Model ────────────────────────────────────────────────────────────────────
interface Slot {
  ch: string;
  /** Urutan huruf yang harus diketik; -1 = spasi/tanda baca (terlewati otomatis). */
  k: number;
}

interface RainWord {
  word: SavedWord;
  slots: Slot[];
  keys: string[];
  label: string;
}

interface Drop extends RainWord {
  id: number;
  x: number; // 0..1 posisi tengah horizontal
  y: number; // 0..1 — 1 = menyentuh tanah
  speed: number; // bagian langit per detik
  typed: number;
  hint: number; // jumlah huruf awal yang ditampilkan sebagai petunjuk
  shakeAt: number;
}

interface Fx {
  id: number;
  x: number;
  y: number;
  kind: "pop" | "miss";
  text: string;
  sub?: string;
  born: number;
}

interface Game {
  drops: Drop[];
  fx: Fx[];
  queue: RainWord[];
  lockId: number | null;
  score: number;
  combo: number;
  bestCombo: number;
  lives: number;
  level: number;
  caught: number;
  keysOk: number;
  keysBad: number;
  spawnIn: number;
  caughtWords: SavedWord[];
  missedWords: SavedWord[];
  nextId: number;
  flashes: number;
}

/** Salinan state untuk render — layar tak pernah membaca ref game langsung. */
interface Snap {
  drops: Drop[];
  fx: Fx[];
  lockId: number | null;
  score: number;
  combo: number;
  lives: number;
  level: number;
  caught: number;
  flashes: number;
}

interface Result {
  score: number;
  caught: number;
  level: number;
  bestCombo: number;
  accuracy: number;
  newBest: boolean;
  caughtWords: SavedWord[];
  missedWords: SavedWord[];
}

// ── Aturan ───────────────────────────────────────────────────────────────────
const fallSeconds = (level: number, keys: number) =>
  Math.max(5.5, 15 * Math.pow(0.9, level - 1)) * (1 + Math.max(0, keys - 6) * 0.04);
const spawnSeconds = (level: number) => Math.max(1.2, 3.4 * Math.pow(0.9, level - 1));
const maxDrops = (level: number) => Math.min(5, 2 + Math.floor(level / 2));
const hintFor = (keys: number, level: number) => (keys <= 2 ? 0 : keys >= 5 && level <= 3 ? 2 : 1);

const FOLD: Record<string, string> = {
  "ß": "ss", "æ": "ae", "œ": "oe", "ø": "o", "đ": "d", "ł": "l", "ı": "i", "þ": "th", "ð": "d", "ŋ": "ng",
};
const TYPEABLE = /^[a-z0-9]$/;

function foldChar(ch: string): string {
  const lower = ch.toLowerCase();
  return (FOLD[lower] ?? lower).normalize("NFD").replace(/\p{M}/gu, "");
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const wordKey = (w: SavedWord) => `${w.langCode}::${w.word}`;

// Arti panjang ("kereta api; lokomotif, KA") dipangkas jadi label kartu yang pendek.
function shortLabel(meaning: string): string {
  const first = meaning.split(/[;\n|]/)[0].split(/\s*,\s*/).slice(0, 2).join(", ").trim();
  return first.length > 32 ? `${first.slice(0, 31).trimEnd()}…` : first;
}

/** Kata → bentuk yang bisa diketik; null kalau tak punya arti / tak bisa diketik. */
function toRainWord(w: SavedWord): RainWord | null {
  const meaning = w.meaning.trim();
  const source = (isNonLatin(w.langCode) ? w.translit ?? "" : w.word).normalize("NFC").trim();
  if (!meaning || !source) return null;
  const slots: Slot[] = [];
  const keys: string[] = [];
  for (const raw of Array.from(source)) {
    if (/\p{M}/u.test(raw)) continue;
    if (/[\p{L}\p{N}]/u.test(raw)) {
      for (const c of Array.from(foldChar(raw))) {
        if (!TYPEABLE.test(c)) return null; // huruf yang tak ada di keyboard Latin
        slots.push({ ch: c, k: keys.length });
        keys.push(c);
      }
    } else {
      slots.push({ ch: raw, k: -1 });
    }
  }
  if (keys.length === 0 || keys.length > MAX_KEYS) return null;
  return { word: w, slots, keys, label: shortLabel(meaning) };
}

const asRainWord = (d: Drop): RainWord => ({ word: d.word, slots: d.slots, keys: d.keys, label: d.label });

function newGame(pool: RainWord[]): Game {
  return {
    drops: [],
    fx: [],
    queue: shuffle(pool),
    lockId: null,
    score: 0,
    combo: 0,
    bestCombo: 0,
    lives: MAX_LIVES,
    level: 1,
    caught: 0,
    keysOk: 0,
    keysBad: 0,
    spawnIn: 0.6,
    caughtWords: [],
    missedWords: [],
    nextId: 1,
    flashes: 0,
  };
}

function spawn(g: Game, pool: RainWord[]) {
  const onScreen = new Set(g.drops.map((d) => wordKey(d.word)));
  const firstKeys = new Set(g.drops.map((d) => d.keys[0]));
  const pick = () => {
    // Utamakan kata yang huruf awalnya belum dipakai kata lain di layar, supaya
    // huruf pertama tak ambigu mengunci kata yang mana.
    let i = g.queue.findIndex((r) => !onScreen.has(wordKey(r.word)) && !firstKeys.has(r.keys[0]));
    if (i < 0) i = g.queue.findIndex((r) => !onScreen.has(wordKey(r.word)));
    return i;
  };
  let idx = pick();
  if (idx < 0) {
    g.queue.push(...shuffle(pool));
    idx = pick();
  }
  if (idx < 0) return;
  const [rw] = g.queue.splice(idx, 1);

  // Jauhkan dari kata yang masih di bagian atas langit biar kartu tak bertumpuk.
  const near = g.drops.filter((d) => d.y < 0.45);
  let x = 0.5;
  let bestDist = -1;
  for (let i = 0; i < 10; i++) {
    const cx = 0.14 + Math.random() * 0.72;
    const dist = near.length ? Math.min(...near.map((d) => Math.abs(d.x - cx))) : 1;
    if (dist > bestDist) {
      bestDist = dist;
      x = cx;
    }
  }
  g.drops.push({
    ...rw,
    id: g.nextId++,
    x,
    y: 0,
    speed: 1 / fallSeconds(g.level, rw.keys.length),
    typed: 0,
    hint: hintFor(rw.keys.length, g.level),
    shakeAt: 0,
  });
}

/** Maju satu frame. Mengembalikan kata yang baru saja jatuh ke tanah. */
function stepGame(g: Game, dt: number, now: number, pool: RainWord[]): Drop[] {
  for (const d of g.drops) d.y += d.speed * dt;
  const landed = g.drops.filter((d) => d.y >= 1);
  if (landed.length) {
    g.drops = g.drops.filter((d) => d.y < 1);
    for (const d of landed) {
      g.lives = Math.max(0, g.lives - 1);
      g.combo = 0;
      g.missedWords.push(d.word);
      if (g.lockId === d.id) g.lockId = null;
      g.queue.splice(Math.min(2, g.queue.length), 0, asRainWord(d));
      g.fx.push({
        id: g.nextId++,
        x: d.x,
        y: 0.97,
        kind: "miss",
        text: isNonLatin(d.word.langCode) && d.word.translit ? `${d.word.word} · ${d.word.translit}` : d.word.word,
        sub: d.label,
        born: now,
      });
    }
  }
  g.fx = g.fx.filter((f) => now - f.born < (f.kind === "miss" ? MISS_MS : FX_MS));
  g.spawnIn -= dt;
  if (g.drops.length < maxDrops(g.level) && (g.spawnIn <= 0 || g.drops.length === 0)) {
    spawn(g, pool);
    g.spawnIn = spawnSeconds(g.level);
  }
  return landed;
}

type PressResult = "ignored" | "typed" | "typo" | "caught" | "levelup";

/** Proses satu huruf yang sudah di-fold. */
function pressKey(g: Game, ch: string, now: number): { result: PressResult; word?: SavedWord } {
  if (!TYPEABLE.test(ch)) return { result: "ignored" };
  let d = g.lockId != null ? g.drops.find((x) => x.id === g.lockId) : undefined;
  if (!d) {
    g.lockId = null;
    const cands = g.drops.filter((x) => x.keys[0] === ch);
    if (!cands.length) {
      g.keysBad++;
      g.flashes++;
      return { result: "typo" };
    }
    d = cands.reduce((a, b) => (b.y > a.y ? b : a)); // yang paling dekat ke tanah
    g.lockId = d.id;
    d.typed = 0;
  }
  if (d.keys[d.typed] !== ch) {
    g.keysBad++;
    g.combo = 0;
    d.shakeAt = now;
    return { result: "typo" };
  }
  d.typed++;
  g.keysOk++;
  if (d.typed < d.keys.length) return { result: "typed" };

  // Tertangkap — poin dasar per huruf + bonus menangkap lebih awal, dikali combo.
  g.combo++;
  g.bestCombo = Math.max(g.bestCombo, g.combo);
  const base = 10 * d.keys.length + Math.round(30 * (1 - d.y));
  const pts = Math.round(base * (1 + Math.min(g.combo - 1, 10) * 0.1));
  g.score += pts;
  g.caught++;
  g.caughtWords.push(d.word);
  g.fx.push({ id: g.nextId++, x: d.x, y: d.y, kind: "pop", text: `+${pts}`, sub: d.word.word, born: now });
  const caughtId = d.id;
  g.drops = g.drops.filter((x) => x.id !== caughtId);
  g.lockId = null;
  if (g.caught % WORDS_PER_LEVEL === 0) {
    g.level++;
    return { result: "levelup", word: d.word };
  }
  return { result: "caught", word: d.word };
}

const snapshot = (g: Game): Snap => ({
  drops: g.drops.map((d) => ({ ...d })),
  fx: g.fx.slice(),
  lockId: g.lockId,
  score: g.score,
  combo: g.combo,
  lives: g.lives,
  level: g.level,
  caught: g.caught,
  flashes: g.flashes,
});

function uniqueWords(list: SavedWord[]): SavedWord[] {
  const seen = new Set<string>();
  return list.filter((w) => {
    const k = wordKey(w);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// Rekor tersimpan per bahasa di perangkat ini (kenyamanan saja — boleh hilang).
function readBest(k: string): number {
  try {
    const m = JSON.parse(localStorage.getItem(BEST_KEY) || "{}") as Record<string, unknown>;
    return typeof m[k] === "number" ? (m[k] as number) : 0;
  } catch {
    return 0;
  }
}

function writeBest(k: string, v: number) {
  try {
    const m = JSON.parse(localStorage.getItem(BEST_KEY) || "{}") as Record<string, number>;
    m[k] = v;
    localStorage.setItem(BEST_KEY, JSON.stringify(m));
  } catch {
    /* penyimpanan penuh/diblokir — rekor cukup tampil sesi ini */
  }
}

// Garis hujan dekoratif — posisi deterministik (tanpa Math.random saat render).
const frac = (i: number, s: number) => {
  const v = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453;
  return v - Math.floor(v);
};
const STREAKS = Array.from({ length: 36 }, (_, i) => ({
  left: frac(i, 1) * 100,
  delay: frac(i, 2) * 1.4,
  dur: 0.7 + frac(i, 3) * 0.7,
  h: 14 + frac(i, 4) * 26,
  o: 0.08 + frac(i, 5) * 0.18,
}));

const KEYFRAMES = `
@keyframes wr-rain{from{transform:translateY(-40px)}to{transform:translateY(110vh)}}
@keyframes wr-float{0%{opacity:0;transform:translateY(6px) scale(.9)}15%{opacity:1;transform:translateY(0) scale(1.05)}100%{opacity:0;transform:translateY(-40px) scale(1)}}
@keyframes wr-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
@keyframes wr-toast{0%{opacity:0;transform:scale(.85)}15%{opacity:1;transform:scale(1)}75%{opacity:1}100%{opacity:0}}
@keyframes wr-flash{from{opacity:1}to{opacity:0}}
@media (prefers-reduced-motion: reduce){.wr-streak{display:none}}
`;

// Tinggi layar yang benar-benar terlihat — di HP keyboard virtual memakan separuh
// layar; tanpa ini tanah (dan kata yang hampir jatuh) tertutup keyboard.
function useVisibleHeight(): number | null {
  const [h, setH] = useState<number | null>(null);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const on = () => setH(vv.height);
    on();
    vv.addEventListener("resize", on);
    return () => vv.removeEventListener("resize", on);
  }, []);
  return h;
}

// ── Komponen ─────────────────────────────────────────────────────────────────
export default function WordRain({ words, onExit }: { words: SavedWord[]; onExit: () => void }) {
  const t = useT(); // [ui-lang-switcher-v1]
  const pool = useMemo(() => words.map(toRainWord).filter((r): r is RainWord => !!r), [words]);
  const poolRef = useRef(pool);
  useEffect(() => {
    poolRef.current = pool;
  }, [pool]);
  const langKey = useMemo(() => {
    const langs = new Set(words.map((w) => w.langCode));
    return langs.size === 1 ? [...langs][0] : "all";
  }, [words]);
  const hasNonLatin = useMemo(() => words.some((w) => isNonLatin(w.langCode)), [words]);

  const audioRef = useRef<QuizAudio | null>(null);
  const gameRef = useRef<Game | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevLenRef = useRef(0);
  const composingRef = useRef(false);
  const mutedRef = useRef(false);

  const [phase, setPhase] = useState<"intro" | "playing" | "over">("intro");
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [snap, setSnap] = useState<Snap | null>(null);
  const [best, setBest] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const visibleH = useVisibleHeight();

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    setBest(readBest(langKey));
  }, [langKey]);

  const sfx = useCallback((fn: (a: QuizAudio) => void) => {
    if (mutedRef.current) return;
    if (!audioRef.current) audioRef.current = createQuizAudio();
    fn(audioRef.current);
  }, []);

  const focusInput = useCallback(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  const start = useCallback(() => {
    if (poolRef.current.length < MIN_WORDS) return;
    sfx((a) => a.unlock());
    gameRef.current = newGame(poolRef.current);
    setSnap(snapshot(gameRef.current));
    setResult(null);
    setPaused(false);
    setPhase("playing");
  }, [sfx]);

  const finish = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    const prev = readBest(langKey);
    const newBest = g.score > prev;
    if (newBest) writeBest(langKey, g.score);
    setBest(Math.max(prev, g.score));
    const typedTotal = g.keysOk + g.keysBad;
    setResult({
      score: g.score,
      caught: g.caught,
      level: g.level,
      bestCombo: g.bestCombo,
      accuracy: typedTotal ? Math.round((g.keysOk / typedTotal) * 100) : 0,
      newBest,
      caughtWords: uniqueWords(g.caughtWords),
      missedWords: uniqueWords(g.missedWords),
    });
    setPhase("over");
  }, [langKey]);

  // Loop animasi — berhenti total saat dijeda / selesai.
  useEffect(() => {
    if (phase !== "playing" || paused) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const g = gameRef.current;
      if (!g) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const landed = stepGame(g, dt, now, poolRef.current);
      if (g.lives <= 0) {
        sfx((a) => a.gameOver());
        finish();
        return;
      }
      if (landed.length) sfx((a) => a.wrong());
      setSnap(snapshot(g));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, paused, sfx, finish]);

  // Pindah tab / aplikasi → jeda otomatis.
  useEffect(() => {
    if (phase !== "playing") return;
    const onVis = () => {
      if (document.hidden) setPaused(true);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [phase]);

  useEffect(() => {
    if (phase === "playing" && !paused) focusInput();
  }, [phase, paused, focusInput]);

  const press = useCallback(
    (raw: string) => {
      const g = gameRef.current;
      if (!g || phase !== "playing" || paused) return;
      const now = performance.now();
      for (const c of Array.from(foldChar(raw))) {
        const { result: r, word } = pressKey(g, c, now);
        if (r === "typed") sfx((a) => a.type());
        else if (r === "typo") sfx((a) => a.typo());
        else if (r === "caught" || r === "levelup") {
          sfx((a) => (r === "levelup" ? a.finish() : a.correct()));
          if (word && !mutedRef.current) void speakText(word.word, word.langCode);
        }
      }
      setSnap(snapshot(g));
    },
    [phase, paused, sfx]
  );

  const releaseLock = useCallback(() => {
    const g = gameRef.current;
    if (!g || g.lockId == null) return;
    const d = g.drops.find((x) => x.id === g.lockId);
    if (d) d.typed = 0;
    g.lockId = null;
    setSnap(snapshot(g));
  }, []);

  // Input asli (supaya keyboard HP muncul). Nilainya dikosongkan tiap ketikan; saat
  // IME sedang menyusun (Gboard dsb.) cukup ambil selisih panjangnya.
  const onInput = (e: React.FormEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    const v = el.value;
    if (v.length > prevLenRef.current) for (const ch of Array.from(v.slice(prevLenRef.current))) press(ch);
    if (composingRef.current) {
      prevLenRef.current = v.length;
      return;
    }
    el.value = "";
    prevLenRef.current = 0;
  };

  // Keyboard fisik saat fokus lepas dari input (mis. habis klik tombol).
  useEffect(() => {
    if (phase !== "playing") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target === inputRef.current || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Backspace") {
        releaseLock();
        return;
      }
      if (e.key.length === 1 && e.key !== " ") {
        e.preventDefault();
        press(e.key);
        focusInput();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, press, releaseLock, focusInput]);

  // ── Gerbang ────────────────────────────────────────────────────────────────
  if (pool.length < MIN_WORDS && phase === "intro") {
    return (
      <GameShell onExit={onExit} title={t("Hujan Kata")}>
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: `${TEAL}22` }}>
            <CloudRain className="h-7 w-7" style={{ color: TEAL }} />
          </div>
          <p className="mt-5 text-[20px] font-extrabold text-white">{t("Belum bisa main")}</p>
          <p className="mt-2 max-w-xs text-[13.5px] leading-relaxed" style={{ color: SUB }}>
            {t("Hujan Kata butuh minimal")} <b className="text-white">{MIN_WORDS}</b>{" "}
            {t("kata yang punya arti & bisa diketik. Kamu punya")} <b className="text-white">{pool.length}</b>.{" "}
            {t("Simpan lebih banyak kata saat menonton Watch & Learn, lalu balik ke sini.")}
          </p>
          <button
            onClick={onExit}
            className="mt-6 rounded-2xl px-6 py-3 text-[14px] font-bold text-white"
            style={{ backgroundColor: TEAL }}
          >
            {t("Mengerti")}
          </button>
        </div>
      </GameShell>
    );
  }

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <GameShell onExit={onExit} title={t("Hujan Kata")}>
        <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-6 text-center">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-3xl"
            style={{ background: `linear-gradient(135deg,#2D9CDB,${TEAL_DARK})` }}
          >
            <CloudRain className="h-9 w-9 text-white" />
          </div>
          <p className="mt-6 text-[26px] font-extrabold text-white">{t("Hujan Kata")}</p>
          <p className="mt-2 max-w-sm text-[14px] leading-relaxed" style={{ color: SUB }}>
            {t("Baca arti yang jatuh, ingat katanya, lalu ketik sebelum menyentuh tanah.")}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            <IntroPill icon={<Heart className="h-4 w-4" />} label={t("5 nyawa")} />
            <IntroPill icon={<CloudRain className="h-4 w-4" />} label={t("Makin deras")} />
            <IntroPill icon={<Flame className="h-4 w-4" />} label={t("Bonus combo")} />
            {best > 0 && <IntroPill icon={<Trophy className="h-4 w-4" />} label={`${t("Rekor")} ${best}`} />}
          </div>
          <div className="mt-5 max-w-sm space-y-1.5 text-[12.5px] leading-relaxed" style={{ color: SUB }}>
            <p>
              <span style={{ color: GOLD }}>{t("Huruf kuning")}</span> {t("= petunjuk. Backspace = ganti sasaran.")}
            </p>
            {hasNonLatin && <p>{t("Kata beraksara non-Latin diketik pakai huruf Latin (romaji, pinyin, dst).")}</p>}
          </div>
          <button
            onClick={start}
            className="mt-8 flex items-center gap-2 rounded-2xl px-10 py-4 text-[16px] font-extrabold text-white transition-transform hover:scale-[1.03]"
            style={{ background: `linear-gradient(135deg,${TEAL},${TEAL_DARK})` }}
          >
            {t("Mulai")} <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </GameShell>
    );
  }

  // ── Hasil ──────────────────────────────────────────────────────────────────
  if (phase === "over" && result) {
    return (
      <GameShell onExit={onExit} title={t("Permainan selesai")}>
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col overflow-y-auto px-6 py-6">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: GOLD }}>
              <Trophy className="h-8 w-8 text-white" strokeWidth={2.5} />
            </div>
            <p className="mt-4 text-[13px] font-semibold uppercase tracking-wide" style={{ color: SUB }}>
              {t("Skor kamu")}
            </p>
            <p className="text-[44px] font-extrabold leading-none" style={{ color: GOLD }}>
              {result.score}
            </p>
            <p className="mt-2 text-[13px] font-bold" style={{ color: result.newBest ? TEAL_LIGHT : SUB }}>
              {result.newBest ? t("Rekor baru!") : `${t("Rekor")} ${best}`}
            </p>
          </div>

          <div
            className="mt-6 grid grid-cols-2 gap-y-4 rounded-3xl px-4 py-4 sm:grid-cols-4"
            style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
          >
            <ResultStat value={`${result.caught}`} label={t("Kata tertangkap")} color={GREEN} />
            <ResultStat value={`${result.accuracy}%`} label={t("Akurasi ketik")} color="#7FE0E0" />
            <ResultStat value={`${result.bestCombo}`} label={t("Combo terbaik")} color={GOLD} />
            <ResultStat value={`${result.level}`} label={t("Level tercapai")} color="#A5B4FC" />
          </div>

          {result.caughtWords.length > 0 && (
            <WordList title={`${t("Kamu kuasai")} (${result.caughtWords.length})`} color={GREEN} items={result.caughtWords} />
          )}
          {result.missedWords.length > 0 && (
            <WordList title={`${t("Terlewat")} (${result.missedWords.length})`} color={RED} items={result.missedWords} />
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={start}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: TEAL }}
            >
              <RotateCcw className="h-4 w-4" /> {t("Main lagi")}
            </button>
            <button
              onClick={onExit}
              className="flex-1 rounded-2xl py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-white/10"
              style={{ border: `1px solid ${BORDER}` }}
            >
              {t("Selesai")}
            </button>
          </div>
        </div>
      </GameShell>
    );
  }

  // ── Bermain ────────────────────────────────────────────────────────────────
  if (!snap) return <GameShell onExit={onExit} title={t("Hujan Kata")} />;
  const locked = snap.drops.find((d) => d.id === snap.lockId);

  return (
    <div
      className="relative flex min-h-0 flex-col overflow-hidden"
      style={{
        background: "linear-gradient(180deg,#06121C 0%,#0A1E2C 60%,#0D2A38 100%)",
        ...(visibleH ? { height: visibleH, flex: "0 0 auto" } : { flex: "1 1 0%" }),
      }}
    >
      <style>{KEYFRAMES}</style>

      {/* Bar atas */}
      <div className="relative z-10 flex items-center gap-2 px-3 py-2.5 sm:px-6">
        <button
          onClick={onExit}
          className="shrink-0 rounded-full p-2 transition-colors hover:bg-white/10"
          aria-label={t("Keluar permainan")}
        >
          <X className="h-5 w-5 text-white" />
        </button>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold text-white">{t("Hujan Kata")}</p>
          <p className="text-[11.5px]" style={{ color: SUB }}>
            {t("Level")} {snap.level} · {snap.caught} {t("kata")}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1 sm:gap-2.5">
          {snap.combo >= 2 && (
            <span className="flex items-center gap-0.5 text-[13px] font-extrabold" style={{ color: GOLD }}>
              <Flame className="h-4 w-4" />
              {snap.combo}
            </span>
          )}
          <span className="min-w-[44px] text-right text-[15px] font-extrabold" style={{ color: TEAL_LIGHT }}>
            {snap.score}
          </span>
          <span className="hidden items-center gap-0.5 min-[380px]:flex" aria-label={`${snap.lives}/${MAX_LIVES}`}>
            {Array.from({ length: MAX_LIVES }, (_, i) => (
              <Heart
                key={i}
                className="h-3.5 w-3.5"
                color={i < snap.lives ? RED : "rgba(255,255,255,0.25)"}
                fill={i < snap.lives ? RED : "transparent"}
              />
            ))}
          </span>
          <span className="flex items-center gap-0.5 text-[13px] font-bold min-[380px]:hidden" style={{ color: RED }}>
            <Heart className="h-3.5 w-3.5" color={RED} fill={RED} />
            {snap.lives}
          </span>
          <button
            onClick={() => setMuted((m) => !m)}
            className="rounded-full p-2 transition-colors hover:bg-white/10"
            aria-label={muted ? t("Nyalakan suara") : t("Matikan suara")}
          >
            {muted ? <VolumeX className="h-4 w-4 text-white/70" /> : <Volume2 className="h-4 w-4 text-white/70" />}
          </button>
          <button
            onClick={() => setPaused(true)}
            className="rounded-full p-2 transition-colors hover:bg-white/10"
            aria-label={t("Jeda permainan")}
          >
            <Pause className="h-4 w-4 text-white/70" />
          </button>
        </div>
      </div>

      {/* Langit */}
      <div className="relative min-h-0 flex-1 overflow-hidden" onPointerDown={focusInput}>
        {STREAKS.map((s, i) => (
          <span
            key={i}
            className="wr-streak pointer-events-none absolute top-0 w-px"
            style={{
              left: `${s.left}%`,
              height: s.h,
              opacity: s.o,
              background: "linear-gradient(transparent,#9FD8E8)",
              animation: `wr-rain ${s.dur}s linear ${s.delay}s infinite`,
              animationPlayState: paused ? "paused" : "running",
            }}
          />
        ))}

        {snap.drops.map((d) => {
          const isLocked = d.id === snap.lockId;
          const danger = d.y > 0.78;
          const small = d.keys.length > 12;
          return (
            <div
              key={d.id}
              className="pointer-events-none absolute"
              style={{
                left: `clamp(84px, ${d.x * 100}%, calc(100% - 84px))`,
                top: `${d.y * 100}%`,
                transform: "translate(-50%,-100%)",
                zIndex: isLocked ? 5 : 2,
              }}
            >
              <div
                key={d.shakeAt}
                className="rounded-xl px-3 py-2 text-center"
                style={{
                  animation: d.shakeAt ? "wr-shake 280ms" : undefined,
                  maxWidth: 240,
                  backgroundColor: isLocked ? "rgba(26,158,158,0.2)" : "rgba(8,24,36,0.85)",
                  border: `1.5px solid ${isLocked ? TEAL_LIGHT : danger ? "rgba(235,87,87,0.75)" : "rgba(255,255,255,0.35)"}`,
                  boxShadow: isLocked ? "0 0 18px rgba(94,234,212,0.35)" : "0 6px 18px rgba(0,0,0,0.35)",
                }}
              >
                <p className="line-clamp-2 text-[13.5px] font-bold leading-snug text-white">{d.label}</p>
                <p
                  className={`mt-1 whitespace-nowrap font-mono font-bold ${small ? "text-[14px] tracking-[0.04em]" : "text-[17px] tracking-[0.12em]"}`}
                >
                  {d.slots.map((s, i) => {
                    if (s.k < 0)
                      return (
                        <span key={i} style={{ color: SUB }}>
                          {s.ch === " " ? " " : s.ch}
                        </span>
                      );
                    if (s.k < d.typed)
                      return (
                        <span key={i} style={{ color: TEAL_LIGHT }}>
                          {s.ch}
                        </span>
                      );
                    if (s.k < d.hint)
                      return (
                        <span key={i} style={{ color: GOLD }}>
                          {s.ch}
                        </span>
                      );
                    return (
                      <span key={i} style={{ color: "rgba(255,255,255,0.55)" }}>
                        _
                      </span>
                    );
                  })}
                </p>
              </div>
            </div>
          );
        })}

        {snap.fx.map((f) => (
          <div
            key={f.id}
            className="pointer-events-none absolute z-10"
            style={{
              left: `clamp(70px, ${f.x * 100}%, calc(100% - 70px))`,
              top: `${f.y * 100}%`,
              transform: "translate(-50%,-100%)",
            }}
          >
            <div className="whitespace-nowrap text-center" style={{ animation: `wr-float ${f.kind === "miss" ? MISS_MS : FX_MS}ms ease-out forwards` }}>
              <p className="text-[18px] font-extrabold" style={{ color: f.kind === "pop" ? GREEN : RED }}>
                {f.text}
              </p>
              {f.sub && <p className="text-[12.5px] font-semibold text-white/85">{f.sub}</p>}
            </div>
          </div>
        ))}

        {/* Pengumuman level */}
        <div
          key={`lv-${snap.level}`}
          className="pointer-events-none absolute inset-x-0 top-[28%] z-10 text-center"
          style={{ animation: "wr-toast 1.6s ease-out forwards" }}
        >
          <p className="text-[30px] font-extrabold text-white" style={{ textShadow: `0 0 24px ${TEAL}` }}>
            {t("Level")} {snap.level}
          </p>
          {snap.level > 1 && (
            <p className="text-[13px] font-semibold" style={{ color: TEAL_LIGHT }}>
              {t("Hujan makin deras")}
            </p>
          )}
        </div>

        {/* Kilat merah saat huruf tak cocok dengan kata mana pun */}
        {snap.flashes > 0 && (
          <div
            key={`fl-${snap.flashes}`}
            className="pointer-events-none absolute inset-0 z-20"
            style={{ boxShadow: "inset 0 0 0 2px rgba(235,87,87,0.6)", animation: "wr-flash 260ms ease-out forwards" }}
          />
        )}

        {paused && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/60 px-6 text-center">
            <p className="text-[24px] font-extrabold text-white">{t("Dijeda")}</p>
            <button
              onClick={() => setPaused(false)}
              className="flex w-56 items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-bold text-white"
              style={{ backgroundColor: TEAL }}
            >
              <Play className="h-4 w-4" /> {t("Lanjutkan")}
            </button>
            <button
              onClick={() => {
                sfx((a) => a.finish());
                finish();
              }}
              className="w-56 rounded-2xl py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-white/10"
              style={{ border: "1px solid rgba(255,255,255,0.2)" }}
            >
              {t("Akhiri permainan")}
            </button>
          </div>
        )}
      </div>

      {/* Tanah + kolom ketik */}
      {/* sm:pr-24 — beri ruang tombol chat melayang (ChatWidget) di pojok kanan bawah */}
      <div className="relative z-10 px-3 pb-3 sm:pl-6 sm:pr-24">
        <div className="relative h-[3px] rounded-full" style={{ backgroundColor: TEAL, boxShadow: `0 0 18px ${TEAL}` }}>
          <Sailboat className="absolute -top-6 left-1/2 h-6 w-6 -translate-x-1/2" color="#BFEFEF" />
        </div>
        <label
          className="mt-3 flex items-center gap-2 rounded-2xl px-3.5 py-2.5"
          style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <Keyboard className="h-4 w-4 shrink-0" style={{ color: SUB }} />
          {locked && (
            <span className="shrink-0 font-mono text-[15px] font-bold" style={{ color: TEAL_LIGHT }}>
              {locked.keys.slice(0, locked.typed).join("")}
            </span>
          )}
          <input
            ref={inputRef}
            type="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="done"
            aria-label={t("Ketik di sini…")}
            placeholder={locked ? "" : t("Ketik di sini…")}
            className="min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-white/40"
            onInput={onInput}
            onKeyDown={(e) => {
              if (e.key === "Backspace") releaseLock();
            }}
            onCompositionStart={() => {
              composingRef.current = true;
            }}
            onCompositionEnd={(e) => {
              composingRef.current = false;
              e.currentTarget.value = "";
              prevLenRef.current = 0;
            }}
          />
          {locked && (
            <span className="max-w-[40%] truncate text-[12px]" style={{ color: SUB }}>
              {locked.label}
            </span>
          )}
        </label>
      </div>
    </div>
  );
}

// ── Sub-komponen ─────────────────────────────────────────────────────────────
function GameShell({ children, onExit, title }: { children?: React.ReactNode; onExit: () => void; title: string }) {
  const t = useT(); // [ui-lang-switcher-v1]
  return (
    <div className="flex min-h-0 flex-1 flex-col" style={{ backgroundColor: "#0B0F11" }}>
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <button
          onClick={onExit}
          className="shrink-0 rounded-full p-2 transition-colors hover:bg-white/10"
          aria-label={t("Keluar permainan")}
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

function WordList({ title, color, items }: { title: string; color: string; items: SavedWord[] }) {
  const t = useT(); // [ui-lang-switcher-v1]
  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        <p className="text-[13px] font-bold text-white">{title}</p>
      </div>
      <div className="space-y-1.5">
        {items.map((w) => (
          <div
            key={wordKey(w)}
            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5"
            style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-bold text-white">
                {w.word}
                {isNonLatin(w.langCode) && w.translit && (
                  <span className="ml-2 text-[12.5px] font-medium" style={{ color: SUB }}>
                    {w.translit}
                  </span>
                )}
              </p>
              <p className="truncate text-[12.5px]" style={{ color: SUB }}>
                {w.meaning}
              </p>
            </div>
            <button
              onClick={() => void speakText(w.word, w.langCode)}
              aria-label={t("Dengar")}
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
