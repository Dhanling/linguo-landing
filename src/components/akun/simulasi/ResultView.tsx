"use client";

// [sim-official-score-v1] Layar hasil simulasi — dipakai DUA tempat:
//   • runner /akun/simulasi/[id] tepat setelah "Selesai & Kirim"
//   • /akun/simulasi/hasil/[attemptId] untuk membuka hasil lama dari Riwayat Skor
// Skor ditampilkan pada SKALA RESMI ujian (TOEFL ITP 310–677, IELTS band 0–9,
// dst — lihat lib/simScore) plus poin mentahnya sebagai rincian.
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  SKILL_LABEL, testTypeLabel,
  type Simulation, type Section, type Question,
} from "@/lib/simulations";
import { officialScore, type SkillRaw } from "@/lib/simScore";
import {
  ArrowLeft, BookOpen, Headphones, PenLine, Mic, Type, Trophy, Sparkles,
  CheckCircle2, XCircle, Lightbulb, MessageCircle, Target, MinusCircle,
  GraduationCap, ArrowRight, Info, History, Award, Download, FileText,
} from "lucide-react";

const TEAL = "#1A9E9E";
const TEAL_DEEP = "#0F6E56";
const YELLOW = "#FFC93C";
const WA_ADMIN = "6282116859493";

export const SKILL_ICON: Record<string, any> = {
  reading: BookOpen, listening: Headphones, writing: PenLine, speaking: Mic, structure: Type,
};

export const TFNG = ["True", "False", "Not Given"];

// Buang prefiks label "(A) " / "A. " / "A) " bawaan import — badge A/B/C/D sudah
// dirender sendiri, jadi tanpa ini teksnya jadi dobel ("(A) (A) Each of").
export function stripOptionLabel(opt: string, i: number): string {
  const letter = String.fromCharCode(65 + i);
  const stripped = opt.replace(new RegExp(`^\\s*[([]?${letter}[)\\].:\\-]?\\s+`, "i"), "").trim();
  return stripped || opt;
}

export const optLetter = (i: number) => String.fromCharCode(65 + i);

// Satu baris pembahasan di halaman hasil. Selain penilaian, ikut membawa
// JAWABAN SISWA (indeks pilihan / teks / rekaman) supaya bisa ditampilkan
// berdampingan dengan kunci jawaban.
export type ResultItem = {
  question: Question; skill: string; correct: boolean | null; points: number;
  ai_score: number | null; ai_feedback: string | null;
  section_id: string; section_title: string;
  answer_index: number | null; answer_text: string; answer_audio_url: string | null;
};

export function optionTextOf(q: Question, idx: number | null): string | null {
  if (idx == null || idx < 0) return null;
  const opts = q.type === "true_false_ng" ? TFNG : (q.options ?? []);
  const raw = opts[idx];
  if (raw == null) return null;
  return q.type === "true_false_ng" ? raw : stripOptionLabel(raw, idx);
}
// Kunci jawaban pilihan ganda (indeks) — samakan dengan gradeObjective().
const keyIndexOf = (q: Question): number | null => (typeof q.answer === "number" ? q.answer : null);
// Kunci jawaban isian singkat (teks) — samakan dengan gradeObjective().
export function keyTextOf(q: Question): string | null {
  if (q.type !== "fill_blank" && q.type !== "short_answer") return null;
  const t = (typeof q.answer === "string" ? q.answer : (q.answer?.text ?? "")) as string;
  return t.trim() || null;
}
const isChoiceType = (t: string) => t === "multiple_choice" || t === "true_false_ng" || t === "matching";

// Satu baris "Jawabanmu" / "Kunci jawaban" — dipakai berdampingan supaya siswa
// langsung lihat bedanya tanpa harus mengingat soalnya.
function AnswerRow({ label, tone, letter, text, icon: Icon }: {
  label: string; tone: "ok" | "bad" | "empty" | "key" | "plain";
  letter?: string | null; text: string; icon?: any;
}) {
  const skin = {
    ok:    { box: "border-emerald-200 bg-emerald-50", chip: "bg-emerald-500 text-white", txt: "text-emerald-800", lab: "text-emerald-600" },
    bad:   { box: "border-rose-200 bg-rose-50",       chip: "bg-rose-500 text-white",    txt: "text-rose-800",    lab: "text-rose-500" },
    empty: { box: "border-slate-200 bg-slate-50",     chip: "bg-slate-300 text-white",   txt: "text-slate-500",   lab: "text-slate-400" },
    key:   { box: "border-emerald-200 bg-emerald-50", chip: "bg-emerald-500 text-white", txt: "text-emerald-800", lab: "text-emerald-600" },
    plain: { box: "border-slate-200 bg-white",        chip: "bg-slate-200 text-slate-600", txt: "text-slate-700", lab: "text-slate-400" },
  }[tone];
  return (
    <div className={`rounded-xl border px-3 py-2.5 ${skin.box}`}>
      <p className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide ${skin.lab}`}>
        {Icon && <Icon className="h-3 w-3" />}{label}
      </p>
      <div className="mt-1 flex items-start gap-2">
        {letter && (
          <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${skin.chip}`}>{letter}</span>
        )}
        <p className={`whitespace-pre-wrap text-sm font-medium leading-relaxed ${skin.txt}`}>{text}</p>
      </div>
    </div>
  );
}

// Kartu pembahasan satu soal: soal → jawaban siswa vs kunci → alasan.
export function ReviewCard({ r, no }: { r: ResultItem; no: number }) {
  const q = r.question;
  const kIdx = keyIndexOf(q);
  const kText = keyTextOf(q);
  const myOpt = optionTextOf(q, r.answer_index);
  const keyOpt = optionTextOf(q, kIdx);
  const choice = isChoiceType(q.type);
  // Soal objektif (pilihan/isian) → jawaban ditampilkan berwarna sesuai benar/salah;
  // esai & speaking dinilai AI, jadi jawabannya ditampilkan netral apa adanya.
  const objective = choice || q.type === "fill_blank" || q.type === "short_answer";
  const answered = choice ? r.answer_index != null : (r.answer_text.trim() !== "" || !!r.answer_audio_url);
  const showKey = r.correct === false && (keyOpt != null || kText != null);

  return (
    <li className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-start gap-3 border-b border-slate-100 px-4 py-3">
        <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
          r.correct === true ? "bg-emerald-100 text-emerald-700"
          : r.correct === false ? "bg-rose-100 text-rose-600"
          : "bg-slate-100 text-slate-500"}`}>{no}</span>
        <p className="whitespace-pre-line text-sm font-semibold leading-relaxed text-slate-900">{q.prompt}</p>
      </div>

      <div className="space-y-3 px-4 py-3">
        {q.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={q.image_url} alt="Visual soal" className="max-h-72 w-full rounded-lg border border-slate-200 bg-slate-50 object-contain" />
        )}

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {r.correct === true && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />Benar</span>
          )}
          {r.correct === false && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 font-bold text-rose-500"><XCircle className="h-3.5 w-3.5" />Kurang tepat</span>
          )}
          {r.ai_score != null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 font-bold text-violet-600"><Sparkles className="h-3.5 w-3.5" />Skor AI {r.ai_score}/100</span>
          )}
          {!answered && r.correct !== true && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-500"><MinusCircle className="h-3.5 w-3.5" />Tidak dijawab</span>
          )}
        </div>

        {/* Jawaban siswa — pilihan ganda / isian singkat */}
        {objective && (
          <AnswerRow
            label="Jawabanmu"
            tone={r.correct === true ? "ok" : answered ? "bad" : "empty"}
            letter={choice && r.answer_index != null ? optLetter(r.answer_index) : null}
            text={(choice ? myOpt : r.answer_text.trim()) || "Kamu tidak menjawab soal ini."}
            icon={r.correct === true ? CheckCircle2 : answered ? XCircle : MinusCircle}
          />
        )}

        {/* Jawaban esai / rekaman speaking */}
        {!objective && (answered ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-slate-400"><PenLine className="h-3 w-3" />Jawabanmu</p>
            {r.answer_text.trim() !== "" && (
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{r.answer_text}</p>
            )}
            {r.answer_audio_url && <audio controls src={r.answer_audio_url} className="mt-2 w-full" />}
          </div>
        ) : (
          <AnswerRow label="Jawabanmu" tone="empty" text="Kamu tidak menjawab soal ini." icon={MinusCircle} />
        ))}

        {/* Kunci jawaban — hanya saat jawaban belum tepat, biar tidak berulang */}
        {showKey && (
          <AnswerRow
            label="Kunci jawaban"
            tone="key"
            letter={kIdx != null ? optLetter(kIdx) : null}
            text={keyOpt ?? kText ?? ""}
            icon={Target}
          />
        )}

        {/* Alasan / pembahasan */}
        {q.explanation && (
          <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2.5">
            <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-amber-600">
              <Lightbulb className="h-3 w-3" />{objective ? "Pembahasan" : "Kriteria penilaian"}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-amber-900">{q.explanation}</p>
          </div>
        )}

        {/* Catatan penilai AI (writing/speaking) */}
        {r.ai_feedback && (
          <div className="rounded-xl border border-violet-100 bg-violet-50 px-3 py-2.5">
            <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-violet-500"><Sparkles className="h-3 w-3" />Catatan penilai</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-violet-800">{r.ai_feedback}</p>
          </div>
        )}
      </div>
    </li>
  );
}

export type ResultSim = Pick<Simulation, "title" | "test_type" | "test_variant">;

const fmtTanggal = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function ResultView({
  sim, sections, totals, results, preview, studentName, submittedAt, past, attemptId,
}: {
  sim: ResultSim;
  sections: Pick<Section, "skill">[];
  totals: { score: number; max_score: number; auto_score: number; ai_score: number };
  results: ResultItem[];
  preview?: boolean;
  studentName?: string | null;
  submittedAt?: string | null; // hasil lama → tampilkan kapan dikumpulkan
  past?: boolean; // dibuka dari Riwayat Skor (bukan barusan selesai)
  attemptId?: string | null; // [sim-certificate-v1] ada → tombol unduh sertifikat
}) {
  const pct = totals.max_score > 0 ? Math.round((totals.score / totals.max_score) * 100) : 0;

  // Nomor soal RESET ke 1 tiap bagian (part) — samakan dgn tampilan saat mengerjakan.
  const resultNo = useMemo(() => {
    const arr: number[] = []; let prevSec = ""; let n = 0;
    results.forEach((r) => {
      if (r.section_id !== prevSec) { prevSec = r.section_id; n = 1; } else { n += 1; }
      arr.push(n);
    });
    return arr;
  }, [results]);

  // Kelompokkan pembahasan PER SUBTES (skill) — sama seperti pembagian saat
  // mengerjakan; tiap subtes jadi satu tab supaya tidak jadi daftar panjang.
  const groups = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, {
      skill: string; label: string;
      items: Array<{ r: ResultItem; no: number }>;
      earned: number; max: number; correct: number; objective: number; aiScores: number[];
      answered: number;
    }>();
    // urutan skill mengikuti urutan section pada simulasi
    sections.forEach((s) => { if (!order.includes(s.skill)) order.push(s.skill); });
    results.forEach((r, i) => {
      const key = r.skill;
      if (!map.has(key)) {
        if (!order.includes(key)) order.push(key);
        map.set(key, {
          skill: key, label: SKILL_LABEL[key as keyof typeof SKILL_LABEL] ?? key,
          items: [], earned: 0, max: 0, correct: 0, objective: 0, aiScores: [], answered: 0,
        });
      }
      const g = map.get(key)!;
      g.items.push({ r, no: resultNo[i] });
      g.earned += r.points;
      g.max += r.question.points;
      if (r.correct != null) { g.objective += 1; if (r.correct) g.correct += 1; }
      if (r.ai_score != null) g.aiScores.push(r.ai_score);
      if (r.answer_index != null || r.answer_text.trim() !== "" || r.answer_audio_url) g.answered += 1;
    });
    return order.map((k) => map.get(k)).filter(Boolean) as Array<NonNullable<ReturnType<typeof map.get>>>;
  }, [results, resultNo, sections]);

  // [sim-official-score-v1] Skor pada skala resmi ujian — dihitung dari rincian
  // per subtes (bukan linear atas total poin) lewat tabel konversi tiap ujian.
  const official = useMemo(() => {
    const skills: SkillRaw[] = groups.map((g) => ({
      skill: g.skill as SkillRaw["skill"],
      correct: g.correct, objective: g.objective, aiScores: g.aiScores,
      earned: g.earned, max: g.max, answered: g.answered,
    }));
    return officialScore({
      testType: sim.test_type, variant: sim.test_variant, title: sim.title,
      skills,
      aggregate: { score: totals.score, max: totals.max_score },
    });
  }, [groups, sim, totals]);

  const [tab, setTab] = useState<string>("");
  const [onlyWrong, setOnlyWrong] = useState(false);
  const activeTab = tab || groups[0]?.skill || "";
  const active = groups.find((g) => g.skill === activeTab) ?? groups[0];

  // Lembar kosong (auto-submit waktu habis / keluar tanpa mengisi) — tak ada
  // yang bisa dikonversi ke skala resmi; ditandai supaya tak terbaca "gagal".
  const totalAnswered = groups.reduce((n, g) => n + g.answered, 0);
  const totalCorrect = results.filter((r) => r.correct === true).length;
  const totalObjective = results.filter((r) => r.correct != null).length;
  const wrongCount = active ? active.items.filter((it) => it.r.correct === false).length : 0;
  const shown = active ? (onlyWrong ? active.items.filter((it) => it.r.correct === false) : active.items) : [];

  // Pesan CTA — masuk ke WA Inbox dashboard sebagai chat baru dari siswa.
  const skorTeks = official
    ? `${official.headline}${official.unit.startsWith("/") ? official.unit : ` ${official.unit}`} (${official.scaleLabel})`
    : `${Math.round(totals.score)}/${Math.round(totals.max_score)} (${pct}%)`;
  const waText = encodeURIComponent(
    `Halo admin Linguo, saya ${studentName || "calon siswa"}. Saya baru selesai ${sim.title} (${testTypeLabel(sim.test_type, sim.test_variant)}) dengan skor ${skorTeks}. Saya mau tanya kelas persiapan privat untuk menaikkan skor saya.`
  );
  const waHref = `https://wa.me/${WA_ADMIN}?text=${waText}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* ── Ringkasan skor ─────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="px-6 py-7 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white" style={{ background: TEAL_DEEP }}>
              <Trophy className="h-7 w-7" />
            </span>
            <h1 className="mt-3 text-xl font-bold text-slate-900">{past ? "Hasil simulasi" : "Simulasi selesai!"}</h1>
            <p className="text-sm text-slate-500">{sim.title} · {testTypeLabel(sim.test_type, sim.test_variant)}</p>
            {submittedAt && <p className="mt-0.5 text-xs text-slate-400">Dikumpulkan {fmtTanggal(submittedAt)}</p>}

            {official ? (
              <>
                {/* Skor pada skala resmi ujian — angka utama yang dicari siswa. */}
                <div className="mt-4 inline-flex items-baseline gap-1.5">
                  <span className="text-5xl font-extrabold leading-none" style={{ color: TEAL_DEEP }}>{official.headline}</span>
                  <span className="text-lg font-bold text-slate-400">{official.unit}</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  Perkiraan skor {official.scaleLabel} · {official.rangeLabel}
                </p>
                {official.verdict && (
                  <p className="mt-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                      official.verdict.startsWith("Belum") ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-700"}`}>
                      {official.verdict}
                    </span>
                  </p>
                )}
                <div className="mx-auto mt-4 h-2 max-w-xs overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.round(official.fraction * 100)}%`, background: TEAL }} />
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Skor mentah {Math.round(totals.score)}/{Math.round(totals.max_score)} poin · {pct}%
                  {totalObjective > 0 && <> · {totalCorrect} dari {totalObjective} soal objektif benar</>}
                </p>
              </>
            ) : (
              <>
                <div className="mt-4 inline-flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold" style={{ color: TEAL_DEEP }}>{Math.round(totals.score)}</span>
                  <span className="text-lg font-semibold text-slate-400">/ {Math.round(totals.max_score)}</span>
                </div>
                <p className="text-sm font-medium text-slate-600">
                  {pct}%{totalObjective > 0 && <> · {totalCorrect} dari {totalObjective} soal objektif benar</>}
                </p>
                <div className="mx-auto mt-4 h-2 max-w-xs overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: TEAL }} />
                </div>
                {totals.score <= 0 && (
                  <p className="mx-auto mt-4 max-w-md rounded-xl bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-700">
                    {totalAnswered === 0
                      ? "Tidak ada satu pun soal yang terjawab pada pengerjaan ini, "
                      : "Belum ada jawaban yang benar pada pengerjaan ini, "}
                    jadi hasilnya <b>tidak dikonversi</b> ke skala resmi (skala {testTypeLabel(sim.test_type, sim.test_variant)}
                    {" "}punya batas bawah yang bukan nol). Kerjakan ulang simulasinya untuk mendapat perkiraan skor.
                  </p>
                )}
              </>
            )}
          </div>

          {/* Rincian per subtes — pada skala resmi bila konversinya ada */}
          {official ? (
            <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">Nilai per subtes ({official.scaleLabel})</p>
              <div className="space-y-3">
                {official.skills.map((s) => {
                  const Icon = SKILL_ICON[s.skills[0]] ?? BookOpen;
                  const gp = Math.round(s.fraction * 100);
                  const missing = s.value == null && !s.informational;
                  return (
                    <div key={s.key} className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className={`truncate text-sm font-semibold ${missing ? "text-slate-400" : "text-slate-700"}`}>{s.label}</p>
                          <p className="shrink-0 text-xs font-bold text-slate-600">
                            {s.display}
                            {s.value != null && !s.informational && <span className="font-medium text-slate-400"> / {s.max}</span>}
                          </p>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
                          <div className="h-full rounded-full" style={{ width: `${gp}%`, background: gp >= 70 ? TEAL : gp >= 40 ? YELLOW : "#f43f5e" }} />
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400">
                          {s.detail}
                          {s.informational && " · tidak dihitung di skala resmi ujian ini"}
                          {s.belowMin && " · di bawah nilai minimum seksi"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Catatan: konversi resmi tetap estimasi (jumlah soal simulasi lebih
                  sedikit dari ujian asli + Writing/Speaking dinilai AI). */}
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                <p className="text-[11px] leading-relaxed text-slate-500">
                  {official.note}{" "}
                  {official.estimateOnly
                    ? "Rincian per subtes tak tersimpan pada pengerjaan ini, jadi angkanya diperkirakan dari total poin."
                    : official.partial
                      ? "Simulasi ini tidak memuat seluruh subtes ujian aslinya, jadi skor total diperkirakan proporsional."
                      : ""}{" "}
                  Angka ini <b>perkiraan</b> untuk mengukur posisimu — bukan skor resmi lembaga tes.
                </p>
              </div>
            </div>
          ) : groups.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">Skor per subtes</p>
              <div className="space-y-3">
                {groups.map((g) => {
                  const gp = g.max > 0 ? Math.round((g.earned / g.max) * 100) : 0;
                  const Icon = SKILL_ICON[g.skill] ?? BookOpen;
                  return (
                    <div key={g.skill} className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-slate-700">{g.label}</p>
                          <p className="shrink-0 text-xs font-semibold text-slate-500">
                            {g.objective > 0 ? `${g.correct}/${g.objective} benar` : `${Math.round(g.earned)}/${Math.round(g.max)} poin`}
                          </p>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
                          <div className="h-full rounded-full" style={{ width: `${gp}%`, background: gp >= 70 ? TEAL : gp >= 40 ? YELLOW : "#f43f5e" }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* [sim-certificate-v1] Sertifikat — hanya bila skornya bisa dikonversi
              ke skala resmi (lembar kosong tak diterbitkan sertifikatnya).
              [sim-score-report-v1] + Laporan Skor: lembar potret berisi rincian
              angka (untuk orang tua/kampus/sponsor), beda peruntukan dari
              sertifikat yang sifatnya apresiasi. */}
          {!preview && attemptId && official && (
            <>
              <Link
                href={`/akun/simulasi/laporan/${attemptId}`}
                className="flex items-center justify-between gap-3 border-t border-slate-100 bg-teal-50/60 px-5 py-3.5 transition hover:bg-teal-50"
              >
                <span className="flex items-center gap-2 text-[13px] font-bold text-teal-800">
                  <FileText className="h-4 w-4" style={{ color: TEAL_DEEP }} />
                  Unduh Laporan Skor {official.scaleLabel} (PDF)
                </span>
                <Download className="h-4 w-4 shrink-0 text-teal-600" />
              </Link>
              <Link
                href={`/akun/simulasi/sertifikat/${attemptId}`}
                className="flex items-center justify-between gap-3 border-t border-slate-100 bg-teal-50/60 px-5 py-3.5 transition hover:bg-teal-50"
              >
                <span className="flex items-center gap-2 text-[13px] font-bold text-teal-800">
                  <Award className="h-4 w-4" style={{ color: TEAL_DEEP }} />
                  Unduh Sertifikat hasil simulasi (PDF)
                </span>
                <Download className="h-4 w-4 shrink-0 text-teal-600" />
              </Link>
            </>
          )}

          {/* Riwayat: skor lama tak pernah hilang — kasih tahu di mana carinya. */}
          {!preview && (
            <Link
              href="/akun?menu=simulasi"
              className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 transition hover:bg-slate-50"
            >
              <span className="flex items-center gap-2 text-[13px] font-semibold text-slate-600">
                <History className="h-4 w-4 text-slate-400" />
                Semua skormu tersimpan di <b>Riwayat Skor</b> (tab Simulasi Tes)
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
            </Link>
          )}
        </div>

        {/* ── CTA: lanjut belajar privat ─────────────────────────────────── */}
        {!preview && (
          <div className="mt-5 overflow-hidden rounded-2xl p-5 text-white sm:p-6" style={{ background: `linear-gradient(135deg, ${TEAL} 0%, ${TEAL_DEEP} 100%)` }}>
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <GraduationCap className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-bold sm:text-lg">
                  {pct >= 70 ? "Skormu bagus — kunci biar makin stabil" : "Mau skormu naik lebih cepat?"}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-white/85">
                  Belajar privat 1-on-1 bareng pengajar {testTypeLabel(sim.test_type, sim.test_variant)}: materi disusun dari kelemahanmu di simulasi ini,
                  jadwal fleksibel, plus latihan &amp; pembahasan tiap sesi. Konsultasi gratis dulu, tanpa komitmen.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={waHref} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold shadow-sm transition active:scale-95"
                    style={{ color: TEAL_DEEP }}
                  >
                    <MessageCircle className="h-4 w-4" />Konsultasi via WhatsApp
                  </a>
                  <Link
                    href="/persiapan-tes"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Lihat program persiapan tes <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Pembahasan per subtes ──────────────────────────────────────── */}
        <div className="mt-7 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-700">Pembahasan jawaban</h2>
          {active && wrongCount > 0 && (
            <button
              type="button"
              onClick={() => setOnlyWrong((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                onlyWrong ? "border-rose-200 bg-rose-50 text-rose-600" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}
            >
              <XCircle className="h-3.5 w-3.5" />Hanya yang salah ({wrongCount})
            </button>
          )}
        </div>

        {/* Tab subtes */}
        {groups.length > 1 && (
          <div className="mt-3 -mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            <div className="flex w-max gap-2">
              {groups.map((g) => {
                const on = g.skill === activeTab;
                const Icon = SKILL_ICON[g.skill] ?? BookOpen;
                return (
                  <button
                    key={g.skill}
                    type="button"
                    onClick={() => { setTab(g.skill); setOnlyWrong(false); }}
                    className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      on ? "border-transparent text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                    style={on ? { background: TEAL } : undefined}
                  >
                    <Icon className="h-4 w-4" />
                    {g.label}
                    <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${on ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>
                      {g.objective > 0 ? `${g.correct}/${g.objective}` : g.items.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {shown.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
            {onlyWrong ? "Tidak ada jawaban yang salah di subtes ini." : "Belum ada soal di subtes ini."}
          </p>
        ) : (
          <ol className="mt-4 space-y-3">
            {shown.map(({ r, no }) => <ReviewCard key={r.question.id} r={r} no={no} />)}
          </ol>
        )}

        {/* Preview dibuka admin di tab baru tanpa sesi siswa → hindari /akun* yg
            login-gated; cukup satu tombol tutup preview ke katalog publik. */}
        <div className="mt-6 flex flex-wrap gap-3">
          {preview ? (
            <Link href="/simulasi" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600">
              <ArrowLeft className="h-4 w-4" />Tutup preview
            </Link>
          ) : (
            <>
              <Link href="/akun?menu=simulasi" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600">
                <ArrowLeft className="h-4 w-4" />{past ? "Kembali ke Riwayat Skor" : "Simulasi lain"}
              </Link>
              <Link href="/akun" className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold text-white" style={{ background: TEAL }}>
                Ke Dashboard
              </Link>
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-5 py-2.5 text-sm font-bold text-teal-700">
                <MessageCircle className="h-4 w-4" />Tanya admin
              </a>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
