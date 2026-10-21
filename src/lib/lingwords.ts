// [lingwords-v1] Lingwords — satu "dompet kosakata" per siswa per bahasa.
//
// Menyatukan tiga sumber jadi satu daftar kata berstatus:
//   1. "simpanan" — kata yang disimpan di Watch & Learn (localStorage perangkat ini,
//      status dari SRS di src/lib/srs.ts).
//   2. "materi"   — kata blok Kosakata (lms_blocks.type='vocab') dari sesi Belajar
//      Mandiri yang sudah selesai; bahasanya dari lms_modules.language.
//   3. "server"   — tabel student_words (sql/20261020_lingwords.sql): salinan kata
//      dari SEMUA perangkat siswa. Ditulis lewat RPC lingwords_sync.
//   4. "lingnote" — [lingwords-v2] kata kiriman pengajar ke Lingnote (RPC
//      teacher_kirim_kosakata): baris "- **kata** (latin) — arti" di student_notes
//      bertag 'dari-pengajar'. Dibaca langsung dari tabel asalnya.
//   5. "ebook"    — [lingwords-v2] kata yang disimpan dari kartu ketuk-kata reader
//      e-book. Masuk ke simpanan lokal (SavedWord.origin='ebook') supaya ikut SRS.
//
// Semua sumber selain "server" disinkronkan ke student_words, jadi tabel itu jadi
// cermin lengkap dompet siswa (dipakai portal pengajar & tema kata).
//
// Tabel server bersifat opsional: kalau belum ada / RLS menolak / offline, semua
// fungsi di sini jatuh diam-diam ke dua sumber lokal — kartunya tetap jalan.
//
// Status kata (yang dihitung ke target hanya "dikuasai"):
//   dikenal  = baru disimpan / dilihat, belum pernah direview
//   dilatih  = sudah direview, interval SRS < 21 hari (atau kuis sesi belum benar)
//   dikuasai = interval SRS ≥ 21 hari, atau sesi materinya lulus kuis

import { supabase } from "@/lib/supabase-client";
import { cardStage } from "@/lib/srs";
import type { SavedWord } from "@/lib/immersionLearn";
import { toLangCode } from "@/lib/quiz/language";
import { LEVEL_VOCAB_TARGET, normalizeLevel } from "@/lib/vocabProgress";

export type LwStage = "dikenal" | "dilatih" | "dikuasai";
export type LwSource = "simpanan" | "materi" | "server" | "ebook" | "lingnote";
const SERVER_SOURCES: LwSource[] = ["simpanan", "materi", "ebook", "lingnote"];

export interface LwWord {
  lang: string;
  word: string;
  meaning: string;
  translit?: string;
  source: LwSource;
  stage: LwStage;
  firstSeen: number; // ms
  masteredAt: number | null;
  lastActive: number | null;
}

export const LW_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
const DAY = 86_400_000;
const STAGE_RANK: Record<LwStage, number> = { dikenal: 0, dilatih: 1, dikuasai: 2 };

const keyOf = (lang: string, word: string) => `${lang}::${word.trim().toLowerCase()}`;

// ── Sumber 1: kata simpanan (localStorage) ──────────────────────────────────

export function fromSaved(saved: SavedWord[]): LwWord[] {
  const out: LwWord[] = [];
  saved.forEach((w) => {
    const word = (w.word || "").trim();
    const lang = (w.langCode || "").toLowerCase();
    if (!word || !lang) return;
    const st = cardStage(w.srs);
    // Review terakhir; kata lama tanpa lastReviewedAt → diturunkan dari jatuh tempo − interval.
    const last = w.srs?.lastReviewedAt
      ? new Date(w.srs.lastReviewedAt).getTime()
      : w.srs && w.srs.reps > 0 && w.srs.dueAt
        ? new Date(w.srs.dueAt).getTime() - w.srs.intervalDays * DAY
        : null;
    const stage: LwStage = st === "mastered" ? "dikuasai" : st === "learning" ? "dilatih" : "dikenal";
    out.push({
      lang,
      word,
      meaning: (w.meaning || "").trim(),
      translit: w.translit,
      source: w.origin || "simpanan",
      stage,
      firstSeen: w.ts || Date.now(),
      masteredAt: stage === "dikuasai" ? estimateMasteredAt(w, last) : null,
      lastActive: last,
    });
  });
  return out;
}

/**
 * Kapan kata pertama kali menyentuh interval ≥ 21 hari. SRS tak menyimpannya, dan
 * review terakhir BUKAN jawabannya (kata yang sudah dikuasai tetap direview → tanggalnya
 * terus maju, grafik jadi naik palsu). Mundur dari review terakhir: interval sebelumnya
 * ≈ interval / ease; selama itu masih ≥ 21, berarti sudah dikuasai sejak review sebelumnya.
 * Sesudah tersinkron, server menyimpan mastered_at paling awal, jadi angkanya stabil.
 */
function estimateMasteredAt(w: SavedWord, last: number | null): number {
  if (!w.srs || last == null) return w.ts || Date.now();
  const ease = Math.max(1.3, w.srs.ease || 2.5);
  let iv = w.srs.intervalDays;
  let at = last;
  for (let i = 0; i < 20 && iv / ease >= 21; i++) {
    iv = iv / ease;
    at -= iv * DAY;
  }
  return Math.max(at, w.ts || 0);
}

// ── Sumber 2: kosakata materi Belajar Mandiri ───────────────────────────────

const materiCache = new Map<string, LwWord[]>();

/** Sama logika lulusnya dengan vocabProgress.fetchMateriVocab, plus kode bahasa. */
export async function fetchMateriWords(userId: string): Promise<LwWord[]> {
  if (!userId) return [];
  const hit = materiCache.get(userId);
  if (hit) return hit;
  try {
    const { data: prog } = await supabase
      .from("lms_progress")
      .select("lesson_id,completed_at")
      .eq("user_id", userId)
      .eq("status", "completed");
    const rows = ((prog as { lesson_id: string; completed_at: string | null }[] | null) || []).filter((r) => r.lesson_id);
    if (!rows.length) return [];
    const doneAt = new Map<string, number>();
    rows.forEach((r) => doneAt.set(r.lesson_id, r.completed_at ? new Date(r.completed_at).getTime() : Date.now()));
    const lessonIds = Array.from(doneAt.keys()).slice(0, 300);

    const [blkRes, attRes, lesRes] = await Promise.all([
      supabase.from("lms_blocks").select("type,content,lesson_id, lms_quiz_questions(id)").in("lesson_id", lessonIds),
      supabase.from("lms_quiz_attempts").select("question_id").eq("user_id", userId).eq("is_correct", true),
      supabase.from("lms_lessons").select("id,module_id").in("id", lessonIds),
    ]);
    const lessons = (lesRes.data as { id: string; module_id: string }[] | null) || [];
    const moduleIds = Array.from(new Set(lessons.map((l) => l.module_id).filter(Boolean)));
    const modRes = moduleIds.length
      ? await supabase.from("lms_modules").select("id,language").in("id", moduleIds)
      : { data: [] };
    const modLang = new Map<string, string>();
    ((modRes.data as { id: string; language: string | null }[] | null) || []).forEach((m) => {
      const c = toLangCode(m.language);
      if (c) modLang.set(m.id, c);
    });
    const lessonLang = new Map<string, string>();
    lessons.forEach((l) => {
      const c = modLang.get(l.module_id);
      if (c) lessonLang.set(l.id, c);
    });

    type Blk = { type: string; content: { items?: { vi?: string; id?: string }[] } | null; lesson_id: string; lms_quiz_questions?: { id: string }[] | null };
    const blocks = ((blkRes.data as Blk[] | null) || []).filter((b) => b?.lesson_id);
    const correct = new Set(((attRes.data as { question_id: string }[] | null) || []).map((a) => a.question_id));
    const qByLesson = new Map<string, string[]>();
    blocks.forEach((b) => {
      const qs = (b.lms_quiz_questions || []).map((q) => q.id);
      if (qs.length) qByLesson.set(b.lesson_id, (qByLesson.get(b.lesson_id) || []).concat(qs));
    });
    const passed = (id: string) => {
      const qs = qByLesson.get(id);
      return !qs || !qs.length || qs.some((q) => correct.has(q));
    };

    const out: LwWord[] = [];
    blocks.forEach((b) => {
      if (b.type !== "vocab") return;
      const lang = lessonLang.get(b.lesson_id);
      if (!lang) return;
      const ok = passed(b.lesson_id);
      const at = doneAt.get(b.lesson_id) || Date.now();
      (b.content?.items || []).forEach((it) => {
        const word = (it?.vi || "").trim();
        if (!word) return;
        out.push({
          lang,
          word,
          meaning: (it?.id || "").trim(),
          source: "materi",
          stage: ok ? "dikuasai" : "dilatih",
          firstSeen: at,
          masteredAt: ok ? at : null,
          lastActive: at,
        });
      });
    });
    materiCache.set(userId, out);
    return out;
  } catch {
    return [];
  }
}

// ── Sumber 4: kosakata kiriman pengajar di Lingnote ─────────────────────────

const lingnoteCache = new Map<string, LwWord[]>();

/**
 * [lingwords-v2] Satu baris kiriman = "- **kata** (latin) · bentuk dasar: x — arti"
 * (lihat sql/20260928_lingnote_kosakata_pengajar.sql). Siswa boleh menyunting
 * catatannya, jadi pengurai ini longgar: cukup "- **kata**" di awal baris.
 */
export function parseLingnoteLines(md: string): { word: string; translit?: string; meaning: string }[] {
  const out: { word: string; translit?: string; meaning: string }[] = [];
  (md || "").split("\n").forEach((line) => {
    const m = line.match(/^\s*[-*]\s+\*\*(.+?)\*\*\s*(?:\(([^)]*)\))?(.*)$/);
    if (!m) return;
    const word = m[1].trim();
    if (!word || word.length > 80) return;
    const rest = m[3] || "";
    const dash = rest.indexOf("—");
    out.push({
      word,
      translit: (m[2] || "").trim() || undefined,
      meaning: dash >= 0 ? rest.slice(dash + 1).trim() : "",
    });
  });
  return out;
}

/** Catatan Lingnote kiriman pengajar → kata. Bahasanya dari tag "kelas:<bahasa · level>". */
export function lingnoteFromNotes(rows: { content: string | null; tags: string[] | null; created_at: string }[]): LwWord[] {
  const out: LwWord[] = [];
  rows.forEach((r) => {
    const kelas = (r.tags || []).find((x) => x.startsWith("kelas:"))?.slice(6) || "";
    const lang = toLangCode(kelas.split("·")[0].trim());
    if (!lang) return;
    const at = new Date(r.created_at).getTime() || Date.now();
    parseLingnoteLines(r.content || "").forEach((w) =>
      out.push({
        lang,
        word: w.word,
        meaning: w.meaning,
        translit: w.translit,
        source: "lingnote",
        stage: "dikenal",
        firstSeen: at,
        masteredAt: null,
        lastActive: null,
      })
    );
  });
  return out;
}

/** Kata kiriman pengajar dari Lingnote (siswa login). */
export async function fetchLingnoteWords(userId: string): Promise<LwWord[]> {
  if (!userId) return [];
  const hit = lingnoteCache.get(userId);
  if (hit) return hit;
  try {
    const { data: ses } = await supabase.auth.getSession();
    const email = ses.session?.user?.email;
    if (!email) return [];
    // Satu email bisa punya beberapa baris students (lihat akun-student-kembar).
    const { data: st } = await supabase.from("students").select("id").eq("email", email);
    const ids = ((st as { id: string }[] | null) || []).map((x) => x.id);
    if (!ids.length) return [];
    type Row = { content: string | null; tags: string[] | null; created_at: string };
    const rows: Row[] = [];
    for (let from = 0; from < 10_000; from += 1000) {
      const { data, error } = await supabase
        .from("student_notes")
        .select("content,tags,created_at")
        .in("student_id", ids)
        .contains("tags", ["dari-pengajar"])
        .is("archived_at", null)
        .order("created_at", { ascending: true })
        .range(from, from + 999);
      if (error) break;
      const page = (data as Row[] | null) || [];
      rows.push(...page);
      if (page.length < 1000) break;
    }
    const out = lingnoteFromNotes(rows);
    lingnoteCache.set(userId, out);
    return out;
  } catch {
    return [];
  }
}

// ── Sumber 3: server (student_words) ────────────────────────────────────────

let serverMissing = false; // tabel belum dibuat → berhenti mencoba di sesi tab ini

interface ServerRow {
  source: string | null;
  lang: string;
  word: string;
  meaning: string | null;
  translit: string | null;
  stage: LwStage;
  first_seen: string;
  mastered_at: string | null;
  last_active: string | null;
}

function fromServerRow(r: ServerRow): LwWord {
  return {
    lang: r.lang,
    word: r.word,
    meaning: r.meaning || "",
    translit: r.translit || undefined,
    // Asal aslinya ikut dibawa (e-book/Lingnote dari perangkat lain); kolom kosong = "server".
    source: SERVER_SOURCES.includes(r.source as LwSource) ? (r.source as LwSource) : "server",
    stage: r.stage,
    firstSeen: new Date(r.first_seen).getTime(),
    masteredAt: r.mastered_at ? new Date(r.mastered_at).getTime() : null,
    lastActive: r.last_active ? new Date(r.last_active).getTime() : null,
  };
}

export async function fetchServerWords(): Promise<LwWord[]> {
  if (serverMissing) return [];
  const out: LwWord[] = [];
  try {
    // PostgREST memotong di 1.000 baris → baca berhalaman.
    for (let from = 0; from < 20_000; from += 1000) {
      const { data, error } = await supabase
        .from("student_words")
        .select("lang,word,meaning,translit,source,stage,first_seen,mastered_at,last_active")
        .order("first_seen", { ascending: true })
        .range(from, from + 999);
      if (error) {
        if (/does not exist|schema cache|PGRST205|42P01/i.test(`${error.code} ${error.message}`)) serverMissing = true;
        break;
      }
      const rows = (data as ServerRow[] | null) || [];
      rows.forEach((r) => out.push(fromServerRow(r)));
      if (rows.length < 1000) break;
    }
  } catch {
    /* offline / belum login → lokal saja */
  }
  return out;
}

const SYNC_KEY = "linguo:lingwords:synced:v1";

/**
 * Kirim kata perangkat ini ke server — simpanan (W&L/e-book), materi, Lingnote — hanya
 * yang berubah sejak sinkron terakhir (tanda tangan stage+review disimpan di
 * localStorage). Best-effort.
 */
export async function syncSavedWords(userId: string, words: LwWord[]): Promise<void> {
  if (serverMissing || !userId || typeof window === "undefined") return;
  let sent: Record<string, string> = {};
  try {
    sent = JSON.parse(localStorage.getItem(`${SYNC_KEY}:${userId}`) || "{}");
  } catch {
    sent = {};
  }
  const sig = (w: LwWord) => `${w.source}|${w.stage}|${w.lastActive ?? 0}|${w.meaning ? 1 : 0}|${w.translit ? 1 : 0}`;
  const todo = words.filter((w) => w.source !== "server" && sent[keyOf(w.lang, w.word)] !== sig(w));
  if (!todo.length) return;
  const iso = (ms: number | null) => (ms ? new Date(ms).toISOString() : null);
  for (let i = 0; i < todo.length; i += 500) {
    const chunk = todo.slice(i, i + 500);
    const { error } = await supabase.rpc("lingwords_sync", {
      p_words: chunk.map((w) => ({
        lang: w.lang,
        word: w.word,
        meaning: w.meaning,
        translit: w.translit || "",
        source: w.source,
        stage: w.stage,
        first_seen: iso(w.firstSeen),
        mastered_at: iso(w.masteredAt),
        last_active: iso(w.lastActive),
      })),
    });
    if (error) {
      if (/does not exist|schema cache|PGRST202|42883/i.test(`${error.code} ${error.message}`)) serverMissing = true;
      return;
    }
    chunk.forEach((w) => (sent[keyOf(w.lang, w.word)] = sig(w)));
  }
  try {
    localStorage.setItem(`${SYNC_KEY}:${userId}`, JSON.stringify(sent));
  } catch {
    /* penuh — sinkron ulang lain kali, tak apa */
  }
}

export interface LwActivity {
  day: string; // YYYY-MM-DD
  lang: string;
  n: number;
}

export async function fetchActivity(days = 140): Promise<LwActivity[]> {
  if (serverMissing) return [];
  try {
    const since = new Date(Date.now() - days * DAY).toISOString().slice(0, 10);
    const { data, error } = await supabase.from("student_word_activity").select("day,lang,n").gte("day", since);
    if (error) return [];
    return (data as LwActivity[] | null) || [];
  } catch {
    return [];
  }
}

// ── Gabung + statistik ──────────────────────────────────────────────────────

/** Gabung kata kembar lintas sumber: status tertinggi menang, waktu paling awal dipakai. */
export function mergeWords(...lists: LwWord[][]): LwWord[] {
  const map = new Map<string, LwWord>();
  lists.flat().forEach((w) => {
    const k = keyOf(w.lang, w.word);
    const prev = map.get(k);
    if (!prev) {
      map.set(k, { ...w });
      return;
    }
    const minNum = (a: number | null, b: number | null) => (a == null ? b : b == null ? a : Math.min(a, b));
    const maxNum = (a: number | null, b: number | null) => (a == null ? b : b == null ? a : Math.max(a, b));
    map.set(k, {
      ...prev,
      meaning: prev.meaning || w.meaning,
      translit: prev.translit || w.translit,
      source: prev.source === "simpanan" || w.source !== "simpanan" ? prev.source : w.source,
      stage: STAGE_RANK[w.stage] > STAGE_RANK[prev.stage] ? w.stage : prev.stage,
      firstSeen: Math.min(prev.firstSeen, w.firstSeen),
      masteredAt: minNum(prev.masteredAt, w.masteredAt),
      lastActive: maxNum(prev.lastActive, w.lastActive),
    });
  });
  return Array.from(map.values());
}

export interface RegLike {
  language?: string | null;
  level?: string | null;
}

/** Level yang sedang dijalani untuk bahasa ini (tertinggi), dari registrasi aktif. */
export function levelForLang(lang: string, regs: RegLike[]): string | null {
  let best = -1;
  regs.forEach((r) => {
    if (toLangCode(r.language) !== lang) return;
    const n = normalizeLevel(r.level) || normalizeLevel((r.language || "").match(/\b([ABC][12])/i)?.[1]);
    if (n) best = Math.max(best, LW_LEVELS.indexOf(n as (typeof LW_LEVELS)[number]));
  });
  return best >= 0 ? LW_LEVELS[best] : null;
}

/** Daftar bahasa yang pantas ditampilkan: punya kata ATAU sedang dipelajari di kelas. */
export function langsOf(words: LwWord[], regs: RegLike[]): string[] {
  const count = new Map<string, number>();
  words.forEach((w) => count.set(w.lang, (count.get(w.lang) || 0) + 1));
  regs.forEach((r) => {
    const c = toLangCode(r.language);
    if (c && !count.has(c)) count.set(c, 0);
  });
  return Array.from(count.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([l]) => l);
}

export interface LwStats {
  lang: string;
  level: string; // level target sekarang
  levelKnown: boolean; // level dari kelas, bukan tebakan
  target: number;
  counts: Record<LwStage, number>;
  mastered: number;
  pct: number;
  remaining: number;
  pacePerDay: number; // kata dikuasai/hari, 28 hari terakhir
  etaDays: number | null;
  weekGain: number;
  prevWeekGain: number;
  weekly: { start: number; mastered: number; collected: number }[]; // kumulatif
  heat: Map<string, number>; // YYYY-MM-DD → kegiatan
  streak: number;
  bestStreak: number;
  activeDays: number;
  recent: LwWord[]; // terakhir dikuasai
  milestones: { n: number; reached: boolean }[];
}

const dayKey = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Level target: level kelas; kalau target level itu sudah tercapai, naik ke berikutnya. */
function pickLevel(mastered: number, classLevel: string | null): string {
  let i = classLevel ? LW_LEVELS.indexOf(classLevel as (typeof LW_LEVELS)[number]) : 0;
  while (i < LW_LEVELS.length - 1 && mastered >= LEVEL_VOCAB_TARGET[LW_LEVELS[i]]) i++;
  return LW_LEVELS[Math.max(0, i)];
}

export function computeStats(all: LwWord[], lang: string, regs: RegLike[], activity: LwActivity[], weeks = 12): LwStats {
  const words = all.filter((w) => w.lang === lang);
  const counts: Record<LwStage, number> = { dikenal: 0, dilatih: 0, dikuasai: 0 };
  words.forEach((w) => counts[w.stage]++);
  const mastered = counts.dikuasai;
  const classLevel = levelForLang(lang, regs);
  const level = pickLevel(mastered, classLevel);
  const target = LEVEL_VOCAB_TARGET[level];
  const remaining = Math.max(0, target - mastered);
  const now = Date.now();

  const masteredTimes = words.filter((w) => w.stage === "dikuasai").map((w) => w.masteredAt ?? w.firstSeen);
  const in28 = masteredTimes.filter((t) => t >= now - 28 * DAY).length;
  const pacePerDay = in28 / 28;
  const etaDays = remaining === 0 ? 0 : pacePerDay >= 0.1 ? Math.ceil(remaining / pacePerDay) : null;
  const weekGain = masteredTimes.filter((t) => t >= now - 7 * DAY).length;
  const prevWeekGain = masteredTimes.filter((t) => t >= now - 14 * DAY && t < now - 7 * DAY).length;

  // Seri mingguan kumulatif, titik terakhir = hari ini.
  const weekly: LwStats["weekly"] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const end = now - i * 7 * DAY;
    weekly.push({
      start: end,
      mastered: masteredTimes.filter((t) => t <= end).length,
      collected: words.filter((w) => w.firstSeen <= end).length,
    });
  }

  // Heatmap: log server (kartu direview) + jejak lokal (kata disimpan / dikuasai / review).
  const heat = new Map<string, number>();
  const bump = (k: string, n: number) => heat.set(k, (heat.get(k) || 0) + n);
  activity.filter((a) => a.lang === lang).forEach((a) => bump(a.day, a.n));
  words.forEach((w) => {
    bump(dayKey(w.firstSeen), 1);
    if (w.lastActive) bump(dayKey(w.lastActive), 1);
  });
  let streak = 0;
  for (let d = 0; d < 400; d++) {
    const has = heat.has(dayKey(now - d * DAY));
    if (has) streak++;
    else if (d === 0) continue; // hari ini belum latihan → beruntun dihitung dari kemarin
    else break;
  }
  const keys = Array.from(heat.keys()).sort();
  let bestStreak = 0;
  let run = 0;
  let prev = 0;
  keys.forEach((k) => {
    const t = new Date(`${k}T00:00:00`).getTime();
    run = prev && Math.round((t - prev) / DAY) === 1 ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
    prev = t;
  });

  const recent = words
    .filter((w) => w.stage === "dikuasai")
    .sort((a, b) => (b.masteredAt ?? b.firstSeen) - (a.masteredAt ?? a.firstSeen))
    .slice(0, 24);

  const marks = [50, 100, 250, 500, 1000, 2000];
  const milestones = marks.map((n) => ({ n, reached: mastered >= n }));

  return {
    lang,
    level,
    levelKnown: !!classLevel,
    target,
    counts,
    mastered,
    pct: Math.min(100, Math.round((mastered / target) * 100)),
    remaining,
    pacePerDay,
    etaDays,
    weekGain,
    prevWeekGain,
    weekly,
    heat,
    streak,
    bestStreak: Math.max(bestStreak, streak),
    activeDays: heat.size,
    recent,
    milestones,
  };
}

/** "± 3 minggu" / "± 5 hari" / "± 2 bulan". */
export function etaLabel(days: number): string {
  if (days <= 1) return "± 1 hari";
  if (days < 14) return `± ${days} hari`;
  if (days < 60) return `± ${Math.round(days / 7)} minggu`;
  if (days < 365) return `± ${Math.round(days / 30)} bulan`;
  return `± ${(days / 365).toFixed(1).replace(".", ",").replace(",0", "")} tahun`;
}

/**
 * Kalimat perkiraan sampai target. Tempo siswa dipakai kalau masuk akal (≤ 4 bulan);
 * kalau lebih lambat, tetap disebut jujur lalu disandingkan tempo saran 5 kata/hari.
 */
export function etaText(s: LwStats): { pace: string | null; suggest: string | null } {
  if (s.remaining === 0) return { pace: null, suggest: null };
  const rate = s.pacePerDay.toFixed(1).replace(".", ",");
  const suggestDays = Math.ceil(s.remaining / 5);
  if (s.etaDays != null && s.etaDays <= 120) return { pace: `${rate} kata/hari → selesai ${etaLabel(s.etaDays)}`, suggest: null };
  return {
    pace: s.etaDays != null ? `${rate} kata/hari → ${etaLabel(s.etaDays)}` : null,
    suggest: `latih 5 kata/hari → selesai ${etaLabel(suggestDays)}`,
  };
}

/** Muat semua sumber sekaligus (+ sinkron kata lokal ke server di latar). */
export async function loadLingwords(
  userId: string | null | undefined,
  saved: SavedWord[],
  opts: { sync?: boolean } = {}
): Promise<{ words: LwWord[]; activity: LwActivity[]; server: boolean }> {
  const local = fromSaved(saved);
  if (!userId) return { words: mergeWords(local), activity: [], server: false };
  const [materi, lingnote, server, activity] = await Promise.all([
    fetchMateriWords(userId),
    fetchLingnoteWords(userId),
    fetchServerWords(),
    fetchActivity(),
  ]);
  // Sinkron di latar: semua sumber perangkat ini (bukan baris server) → student_words.
  if (opts.sync !== false) void syncSavedWords(userId, mergeWords(local, materi, lingnote)).catch(() => {});
  return { words: mergeWords(local, materi, lingnote, server), activity, server: !serverMissing };
}

/**
 * [lingwords-pratinjau-v1] Mode pratinjau POV staf: data ASLI siswa lewat
 * /api/preview-lingwords (service role, dikunci cookie pratinjau, hanya-baca).
 * Kata simpanan di browser staf sengaja TIDAK ikut — itu bukan milik siswanya.
 * Kosakata materi hanya terlihat kalau siswa pernah membuka Lingwords (sudah tersinkron).
 */
export async function loadPreviewLingwords(
  studentId: string
): Promise<{ words: LwWord[]; activity: LwActivity[]; server: boolean; regs: RegLike[]; themes: Record<string, string> }> {
  try {
    const res = await fetch(`/api/preview-lingwords?student=${encodeURIComponent(studentId)}`, { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    const j = (await res.json()) as {
      words?: ServerRow[];
      activity?: LwActivity[];
      notes?: { content: string | null; tags: string[] | null; created_at: string }[];
      regs?: RegLike[];
      themes?: Record<string, string>;
      akun?: boolean;
    };
    const words = mergeWords((j.words || []).map(fromServerRow), lingnoteFromNotes(j.notes || []));
    return { words, activity: j.activity || [], server: !!j.akun, regs: j.regs || [], themes: j.themes || {} };
  } catch {
    return { words: [], activity: [], server: false, regs: [], themes: {} };
  }
}
