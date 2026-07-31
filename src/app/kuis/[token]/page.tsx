"use client";

// ============================================================================
// /kuis/[token] — halaman kuis harian spaced repetition
// [sr-kuis-spaced-repetition-v1]
// ----------------------------------------------------------------------------
// Dibuka dari link personal di WhatsApp, mayoritas dari HP, sering tanpa login —
// jadi halaman ini SENGAJA berdiri sendiri: tanpa gerbang sesi, tanpa shell
// dashboard, dan seluruh datanya lewat route server (kunci jawaban tidak pernah
// sampai ke browser sebelum kuis selesai).
//
// State kuis ditahan di React state saja, TIDAK di localStorage: jawaban dikirim
// sekali di akhir. Menyimpan jawaban setengah jalan ke storage bikin dua tab
// saling menimpa dan sesi "hantu" yang tidak pernah benar-benar dikumpulkan.
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, CheckCircle2, XCircle, Loader2, Sparkles,
  ClipboardCheck, AlertCircle, RefreshCw, CalendarClock, Send,
} from "lucide-react";

const TEAL = "#1A9E9E";
const TEAL_DEEP = "#0F6E56";

// ── Bentuk data dari /api/quiz/session/[token] ───────────────────────────────
type QuestionType = "mc" | "translation";

interface PublicQuestion {
  id: string;
  concept_id: string;
  concept_name: string;
  question_type: QuestionType;
  prompt: string;
  prompt_translit: string | null;
  choices: string[] | null;
  choices_translit: string[] | null;
}

interface ResultItem {
  no: number;
  concept_name: string;
  question_type: QuestionType;
  prompt: string;
  prompt_translit: string | null;
  student_answer_text: string | null;
  correct_answer_text: string;
  correct_answer_translit: string | null;
  is_correct: boolean;
  explanation: string;
  ai_feedback: string | null;
}

interface ResultConcept {
  concept_id: string;
  name: string;
  mastery_level: number;
  mastery_label: string;
  next_review_at: string | null;
  correct: number;
  total: number;
}

interface SessionResult {
  score_total: number;
  score_mc: number;
  score_translation: number;
  total_questions: number;
  total_mc: number;
  total_translation: number;
  items: ResultItem[];
  concepts: ResultConcept[];
}

interface SessionPayload {
  status: "in_progress" | "completed" | "expired";
  student_name: string | null;
  language_label: string;
  needs_translit: boolean;
  new_concepts?: number;
  review_concepts?: number;
  concept_names?: string[];
  total_questions?: number;
  questions?: PublicQuestion[];
  result?: SessionResult;
  expires_at?: string;
  error?: string;
  code?: string;
}

type Phase = "loading" | "intro" | "quiz" | "grading" | "result" | "error";

function jadwalBerikutnya(iso: string | null): string {
  if (!iso) return "belum dijadwalkan";
  const hari = Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (hari <= 1) return "besok";
  if (hari <= 6) return `${hari} hari lagi`;
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", timeZone: "Asia/Jakarta",
  });
}

export default function KuisPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";

  const [phase, setPhase] = useState<Phase>("loading");
  const [data, setData] = useState<SessionPayload | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [idx, setIdx] = useState(0);
  // question_id → jawaban ("0".."3" untuk pilihan ganda, teks untuk terjemahan)
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SessionResult | null>(null);

  const questions = useMemo(() => data?.questions ?? [], [data]);
  const current = questions[idx];

  // ── Muat sesi ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/quiz/session/${token}`, { cache: "no-store" });
        const body: SessionPayload = await res.json();
        if (!alive) return;
        if (!res.ok) {
          setErrorMsg(body.error || "Kuis tidak bisa dibuka.");
          setErrorCode(body.code || "");
          setPhase("error");
          return;
        }
        setData(body);
        if (body.status === "completed" && body.result) {
          setResult(body.result);
          setPhase("result");
        } else {
          setPhase("intro");
        }
      } catch {
        if (!alive) return;
        setErrorMsg("Koneksi bermasalah. Coba muat ulang halaman ini.");
        setErrorCode("network");
        setPhase("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [token]);

  const setAnswer = useCallback((qid: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  }, []);

  const answeredCount = questions.filter((q) => (answers[q.id] ?? "").trim() !== "").length;

  // ── Kirim jawaban ──────────────────────────────────────────────────────────
  const submit = useCallback(async () => {
    if (!questions.length) return;
    const kosong = questions.length - answeredCount;
    if (kosong > 0) {
      const lanjut = window.confirm(
        `Masih ada ${kosong} soal yang belum dijawab. Kirim sekarang? Soal kosong dihitung salah.`
      );
      if (!lanjut) return;
    }
    setPhase("grading");
    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          answers: questions.map((q) => ({ question_id: q.id, answer: answers[q.id] ?? "" })),
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error || "Jawaban gagal dikirim.");
        setPhase("quiz");
        return;
      }
      setResult(body.result as SessionResult);
      setPhase("result");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      toast.error("Koneksi terputus saat mengirim. Coba lagi.");
      setPhase("quiz");
    }
  }, [answers, answeredCount, questions, token]);

  // ── Layar: memuat ──────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-500">
          <Loader2 className="h-7 w-7 animate-spin" style={{ color: TEAL }} />
          <p className="text-sm">Menyiapkan kuis kamu…</p>
        </div>
      </Shell>
    );
  }

  // ── Layar: link bermasalah ─────────────────────────────────────────────────
  if (phase === "error") {
    const kedaluwarsa = errorCode === "expired";
    return (
      <Shell>
        <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
            <AlertCircle className="h-6 w-6 text-amber-500" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">
            {kedaluwarsa ? "Link kuis sudah hangus" : "Link kuis tidak bisa dibuka"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {kedaluwarsa
              ? "Setiap kuis berlaku 48 jam. Tenang, materinya tidak hilang — semuanya otomatis muncul lagi di kuis berikutnya."
              : errorMsg}
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <a
              href="https://wa.me/6285121276622?text=Halo%20Linguo%2C%20link%20kuis%20harian%20saya%20tidak%20bisa%20dibuka."
              className="flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white"
              style={{ background: TEAL }}
            >
              <Send className="h-4 w-4" /> Hubungi admin Linguo
            </a>
            <Link
              href="/akun"
              className="flex h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700"
            >
              Buka dashboard siswa
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  // ── Layar: hasil ───────────────────────────────────────────────────────────
  if (phase === "result" && result) {
    return (
      <Shell>
        <HasilKuis
          result={result}
          languageLabel={data?.language_label ?? ""}
          studentName={data?.student_name ?? null}
        />
      </Shell>
    );
  }

  // ── Layar: sedang dinilai ──────────────────────────────────────────────────
  if (phase === "grading") {
    const adaTerjemahan = questions.some((q) => q.question_type === "translation");
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: TEAL }} />
          <p className="text-sm font-medium text-slate-700">
            {adaTerjemahan ? "Mengoreksi jawaban terjemahanmu…" : "Menghitung skormu…"}
          </p>
          <p className="max-w-xs text-xs">
            {adaTerjemahan
              ? "Jawaban terjemahan diperiksa satu per satu, biasanya butuh 10–20 detik. Jangan tutup halaman ini."
              : "Sebentar ya."}
          </p>
        </div>
      </Shell>
    );
  }

  // ── Layar: intro ───────────────────────────────────────────────────────────
  if (phase === "intro" && data) {
    const baru = data.new_concepts ?? 0;
    const review = data.review_concepts ?? 0;
    return (
      <Shell>
        <div className="mx-auto max-w-md">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div
              className="mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white"
              style={{ background: TEAL }}
            >
              <Sparkles className="h-3.5 w-3.5" /> Kuis harian
            </div>
            <h1 className="text-xl font-extrabold leading-tight text-slate-900">
              {data.student_name ? `Halo, ${data.student_name.split(" ")[0]}!` : "Halo!"}
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              Latihan bahasa {data.language_label} hari ini: {data.total_questions ?? 0} soal, sekitar
              5 menit.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <Stat label="Materi baru" value={baru} tone="new" />
              <Stat label="Pengulangan" value={review} tone="review" />
            </div>

            {!!data.concept_names?.length && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Yang diuji hari ini
                </p>
                <ul className="space-y-1.5">
                  {data.concept_names.map((n) => (
                    <li key={n} className="flex gap-2 text-sm text-slate-700">
                      <span
                        className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: TEAL }}
                      />
                      <span>{n}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              type="button"
              onClick={() => setPhase("quiz")}
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-base font-bold text-white transition active:scale-[0.99]"
              style={{ background: TEAL }}
            >
              Mulai kuis <ArrowRight className="h-4 w-4" />
            </button>
            <p className="mt-3 text-center text-[11px] text-slate-400">
              Jawaban dikirim sekali di akhir. Kamu masih bisa mundur untuk mengubah jawaban.
            </p>
          </div>
        </div>
      </Shell>
    );
  }

  // ── Layar: kuis ────────────────────────────────────────────────────────────
  if (phase === "quiz" && current) {
    const nilai = answers[current.id] ?? "";
    const terakhir = idx === questions.length - 1;
    return (
      <Shell>
        <div className="mx-auto max-w-md">
          {/* Progres */}
          <div className="mb-4">
            <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>
                Soal {idx + 1} dari {questions.length}
              </span>
              <span>{answeredCount} terjawab</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${((idx + 1) / questions.length) * 100}%`, background: TEAL }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {current.concept_name}
            </p>
            <p className="text-lg font-bold leading-snug text-slate-900">{current.prompt}</p>
            {current.prompt_translit && (
              <p className="mt-1 text-sm italic text-slate-500">{current.prompt_translit}</p>
            )}

            {current.question_type === "mc" && current.choices ? (
              <div className="mt-5 space-y-2.5">
                {current.choices.map((choice, i) => {
                  const dipilih = nilai === String(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAnswer(current.id, String(i))}
                      className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition active:scale-[0.99] ${
                        dipilih ? "bg-teal-50" : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                      style={dipilih ? { borderColor: TEAL } : undefined}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          dipilih ? "text-white" : "bg-slate-100 text-slate-500"
                        }`}
                        style={dipilih ? { background: TEAL } : undefined}
                      >
                        {["A", "B", "C", "D"][i]}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold text-slate-900">{choice}</span>
                        {current.choices_translit?.[i] && (
                          <span className="block text-xs italic text-slate-500">
                            {current.choices_translit[i]}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="mt-5">
                <textarea
                  value={nilai}
                  onChange={(e) => setAnswer(current.id, e.target.value)}
                  rows={3}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="Tulis terjemahanmu di sini…"
                  className="w-full resize-none rounded-xl border-2 border-slate-200 px-4 py-3 text-[15px] text-slate-900 outline-none transition focus:border-teal-500"
                />
                <p className="mt-1.5 text-[11px] text-slate-400">
                  Salah ketik kecil masih dimaafkan, tapi tata bahasanya tetap dinilai.
                </p>
              </div>
            )}
          </div>

          {/* Navigasi */}
          <div className="mt-4 flex gap-2.5">
            <button
              type="button"
              onClick={() => setIdx((i) => Math.max(0, i - 1))}
              disabled={idx === 0}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
              aria-label="Soal sebelumnya"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            {terakhir ? (
              <button
                type="button"
                onClick={submit}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-base font-bold text-white transition active:scale-[0.99]"
                style={{ background: TEAL_DEEP }}
              >
                <ClipboardCheck className="h-4.5 w-4.5" /> Kumpulkan jawaban
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIdx((i) => Math.min(questions.length - 1, i + 1))}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-base font-bold text-white transition active:scale-[0.99]"
                style={{ background: TEAL }}
              >
                Lanjut <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="py-24 text-center text-sm text-slate-500">Kuis tidak tersedia.</div>
    </Shell>
  );
}

// ── Potongan tampilan ───────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-slate-50 px-4 py-6 pb-16">
      <div className="mx-auto w-full max-w-md">{children}</div>
    </main>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "new" | "review" }) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        tone === "new" ? "border-teal-100 bg-teal-50/60" : "border-amber-100 bg-amber-50/60"
      }`}
    >
      <p className="text-2xl font-extrabold leading-none text-slate-900">{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}

function HasilKuis({
  result,
  languageLabel,
  studentName,
}: {
  result: SessionResult;
  languageLabel: string;
  studentName: string | null;
}) {
  const persen = result.total_questions
    ? Math.round((result.score_total / result.total_questions) * 100)
    : 0;
  const pujian =
    persen >= 90 ? "Luar biasa!" : persen >= 70 ? "Bagus!" : persen >= 50 ? "Lumayan." : "Belum apa-apa, tidak masalah.";
  const perluDiulang = result.concepts.filter((c) => c.correct < c.total);
  const solid = result.concepts.filter((c) => c.correct === c.total);

  return (
    <div>
      {/* Skor */}
      <div className="rounded-2xl p-6 text-center text-white shadow-sm" style={{ background: TEAL }}>
        <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
          Kuis {languageLabel} {studentName ? `· ${studentName.split(" ")[0]}` : ""}
        </p>
        <p className="mt-2 text-5xl font-extrabold leading-none">
          {result.score_total}
          <span className="text-2xl opacity-70">/{result.total_questions}</span>
        </p>
        <p className="mt-2 text-sm font-semibold opacity-90">{pujian}</p>
        {!!result.total_mc && !!result.total_translation && (
          <p className="mt-3 text-xs opacity-80">
            Pilihan ganda {result.score_mc}/{result.total_mc} · Terjemahan {result.score_translation}/
            {result.total_translation}
          </p>
        )}
      </div>

      {/* Ringkasan konsep */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
          <CalendarClock className="h-4 w-4" style={{ color: TEAL }} /> Materi kamu
        </h2>
        <ul className="space-y-2.5">
          {solid.map((c) => (
            <li key={c.concept_id} className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                <p className="text-xs text-slate-500">
                  {c.mastery_label} · muncul lagi {jadwalBerikutnya(c.next_review_at)}
                </p>
              </div>
            </li>
          ))}
          {perluDiulang.map((c) => (
            <li key={c.concept_id} className="flex items-start gap-2.5">
              <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                <p className="text-xs text-slate-500">
                  {c.correct}/{c.total} benar · diulang {jadwalBerikutnya(c.next_review_at)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Pembahasan */}
      <h2 className="mb-2 mt-5 px-1 text-sm font-bold text-slate-900">Pembahasan</h2>
      <div className="space-y-3">
        {result.items.map((item) => (
          <div
            key={item.no}
            className={`rounded-2xl border bg-white p-4 shadow-sm ${
              item.is_correct ? "border-emerald-100" : "border-rose-100"
            }`}
          >
            <div className="flex items-start gap-2.5">
              {item.is_correct ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
              ) : (
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {item.no}. {item.concept_name}
                </p>
                <p className="mt-1 text-[15px] font-bold leading-snug text-slate-900">{item.prompt}</p>
                {item.prompt_translit && (
                  <p className="text-xs italic text-slate-500">{item.prompt_translit}</p>
                )}

                <div className="mt-3 space-y-1 text-sm">
                  <p className={item.is_correct ? "text-emerald-700" : "text-rose-700"}>
                    <span className="text-slate-500">Jawabanmu: </span>
                    {item.student_answer_text?.trim() || <span className="italic">(kosong)</span>}
                  </p>
                  {!item.is_correct && (
                    <p className="text-slate-900">
                      <span className="text-slate-500">Jawaban benar: </span>
                      <span className="font-semibold">{item.correct_answer_text}</span>
                      {item.correct_answer_translit && (
                        <span className="italic text-slate-500"> ({item.correct_answer_translit})</span>
                      )}
                    </p>
                  )}
                </div>

                {(item.ai_feedback || item.explanation) && (
                  <p className="mt-2.5 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
                    {item.ai_feedback?.trim() || item.explanation}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
        <p className="text-sm font-semibold text-slate-900">
          {perluDiulang.length
            ? "Materi yang belum kuat otomatis muncul lagi di kuis berikutnya."
            : "Semua materi hari ini kamu kuasai."}
        </p>
        <p className="mt-1 text-xs text-slate-500">Kuis baru dikirim ke WhatsApp kamu besok pagi.</p>
        <Link
          href="/akun"
          className="mt-4 inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-white"
          style={{ background: TEAL }}
        >
          Buka dashboard siswa
        </Link>
      </div>
    </div>
  );
}
