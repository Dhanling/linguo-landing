"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  Volume2,
  Languages,
  BookOpen,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Lock,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TEAL = "#1A9E9E";

const BLOCK_META: Record<string, { icon: any; label: string }> = {
  audio: { icon: Volume2, label: "Dengar & Ucapkan" },
  logic: { icon: Languages, label: "Logika Bahasa" },
  vocab: { icon: BookOpen, label: "Kosakata" },
  quiz: { icon: CheckCircle2, label: "Kuis" },
};

function stripBold(s: string) {
  return s.replace(/\*\*/g, "");
}

function renderMarkdown(md: string) {
  return md.split("\n").map((line: string, i: number) => {
    if (line.startsWith("## "))
      return (
        <h3 key={i} className="mt-1 text-base font-semibold text-slate-900">
          {line.slice(3)}
        </h3>
      );
    if (line.startsWith("- "))
      return (
        <li key={i} className="ml-5 list-disc text-slate-700">
          {stripBold(line.slice(2))}
        </li>
      );
    if (line.trim() === "") return <div key={i} className="h-2" />;
    return (
      <p key={i} className="text-slate-700">
        {stripBold(line)}
      </p>
    );
  });
}

export default function LessonPlayerPage() {
  const params = useParams<{ lessonId: string }>();
  const lessonId = (params?.lessonId as string) || "";

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [lesson, setLesson] = useState<any>(null);
  const [mod, setMod] = useState<any>(null);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [siblings, setSiblings] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [shownText, setShownText] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      if (!user || !lessonId) {
        setLoading(false);
        return;
      }

      const { data: les } = await supabase
        .from("lms_lessons")
        .select(
          "id,title,est_minutes,is_preview,sort_order,module_id, lms_modules(id,cefr_label,title)"
        )
        .eq("id", lessonId)
        .maybeSingle();
      if (!les) {
        setLoading(false);
        return;
      }
      const m = Array.isArray((les as any).lms_modules)
        ? (les as any).lms_modules[0]
        : (les as any).lms_modules;
      setLesson(les);
      setMod(m);

      const { data: blks } = await supabase
        .from("lms_blocks")
        .select(
          "id,type,content,media_url,sort_order, lms_quiz_questions(id,type,prompt,options,answer,sort_order)"
        )
        .eq("lesson_id", (les as any).id)
        .order("sort_order");
      setBlocks(blks || []);

      if ((les as any).module_id) {
        const { data: sibs } = await supabase
          .from("lms_lessons")
          .select("id,title,sort_order")
          .eq("module_id", (les as any).module_id)
          .order("sort_order");
        setSiblings(sibs || []);
      }

      const { data: prog } = await supabase
        .from("lms_progress")
        .select("status")
        .eq("user_id", user.id)
        .eq("lesson_id", (les as any).id)
        .maybeSingle();
      setDone(!!prog && prog.status === "completed");

      setLoading(false);
    })();
  }, [lessonId]);

  function answerQuiz(q: any, choice: string) {
    if (answers[q.id]) return;
    setAnswers((prev) => ({ ...prev, [q.id]: choice }));
    if (user) {
      supabase.from("lms_quiz_attempts").insert({
        user_id: user.id,
        question_id: q.id,
        response: choice,
        is_correct: choice === q.answer,
      });
    }
  }

  async function markComplete() {
    if (!user || !lesson) return;
    setSaving(true);
    const { error } = await supabase.from("lms_progress").upsert(
      {
        user_id: user.id,
        lesson_id: lesson.id,
        status: "completed",
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" }
    );
    setSaving(false);
    if (!error) setDone(true);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <p className="text-slate-700">Kamu perlu masuk dulu untuk mulai belajar.</p>
        <a
          href="/akun"
          className="mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
          style={{ background: TEAL }}
        >
          Masuk ke akun
        </a>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <p className="text-slate-700">Materi tidak ditemukan.</p>
        <a
          href="/akun/belajar"
          className="mt-4 text-sm font-medium underline"
          style={{ color: TEAL }}
        >
          Kembali ke daftar materi
        </a>
      </div>
    );
  }

  const idx = siblings.findIndex((s: any) => s.id === lesson.id);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <a
        href="/akun/belajar"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Semua materi
      </a>

      {mod ? (
        <div
          className="mb-1 text-xs font-semibold uppercase tracking-wide"
          style={{ color: TEAL }}
        >
          {mod.cefr_label} · {mod.title}
        </div>
      ) : null}
      <h1 className="text-2xl font-bold text-slate-900">
        {lesson.sort_order}. {lesson.title}
      </h1>
      {lesson.est_minutes ? (
        <p className="mt-1 text-sm text-slate-500">± {lesson.est_minutes} menit</p>
      ) : null}

      {blocks.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-center">
          {lesson.is_preview === false ? (
            <>
              <Lock className="mx-auto h-7 w-7 text-slate-400" />
              <p className="mt-3 text-sm text-slate-700">
                Materi ini bagian dari paket berlangganan.
              </p>
              <a
                href="/toko"
                className="mt-4 inline-block rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
                style={{ background: TEAL }}
              >
                Lihat paket
              </a>
            </>
          ) : (
            <p className="text-sm text-slate-500">
              Materi sesi ini lagi disusun. Cek lagi nanti ya.
            </p>
          )}
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {blocks.map((b: any) => {
            const meta = BLOCK_META[b.type] || { icon: BookOpen, label: b.type };
            const Icon = meta.icon;
            return (
              <div
                key={b.id}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full"
                    style={{ background: "rgba(26,158,158,0.12)", color: TEAL }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold text-slate-700">
                    {meta.label}
                  </span>
                </div>

                {b.type === "audio" && (
                  <div>
                    <p className="mb-2 text-sm text-slate-500">
                      {b.content?.instruction}
                    </p>
                    <audio controls src={b.media_url} className="w-full" />
                    <p className="mt-1 text-xs text-slate-400">
                      (audio placeholder — aktif setelah R2 dipasang)
                    </p>
                    {!shownText[b.id] ? (
                      <button
                        onClick={() =>
                          setShownText((prev) => ({ ...prev, [b.id]: true }))
                        }
                        className="mt-3 text-sm font-medium underline"
                        style={{ color: TEAL }}
                      >
                        Tampilkan teks
                      </button>
                    ) : (
                      <div className="mt-3 rounded-lg bg-slate-50 p-3">
                        <div className="text-lg font-semibold text-slate-900">
                          {b.content?.transcript}
                        </div>
                        <div className="text-sm text-slate-500">
                          {b.content?.gloss}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {b.type === "logic" && (
                  <div className="space-y-1 text-[15px] leading-relaxed">
                    {renderMarkdown(b.content?.markdown || "")}
                  </div>
                )}

                {b.type === "vocab" && (
                  <ul className="divide-y divide-slate-100">
                    {(b.content?.items || []).map((it: any, i: number) => (
                      <li
                        key={i}
                        className="flex items-center justify-between py-2"
                      >
                        <span className="font-medium text-slate-900">{it.vi}</span>
                        <span className="text-sm text-slate-500">{it.id}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {b.type === "quiz" && (
                  <div>
                    {b.content?.instruction ? (
                      <p className="mb-3 text-sm text-slate-500">
                        {b.content.instruction}
                      </p>
                    ) : null}
                    {((b.lms_quiz_questions || []) as any[])
                      .sort((qa: any, qb: any) => qa.sort_order - qb.sort_order)
                      .map((q: any) => {
                        const chosen = answers[q.id];
                        return (
                          <div key={q.id} className="mb-4 last:mb-0">
                            <div className="mb-2 font-medium text-slate-900">
                              {q.prompt}
                            </div>
                            <div className="flex flex-col gap-2">
                              {(q.options || []).map((opt: string) => {
                                const isChosen = chosen === opt;
                                const isCorrect = opt === q.answer;
                                let cls =
                                  "border-slate-200 text-slate-700 hover:border-slate-300";
                                if (chosen) {
                                  if (isCorrect)
                                    cls =
                                      "border-emerald-400 bg-emerald-50 text-emerald-700";
                                  else if (isChosen)
                                    cls =
                                      "border-rose-400 bg-rose-50 text-rose-700";
                                  else cls = "border-slate-200 text-slate-400";
                                }
                                return (
                                  <button
                                    key={opt}
                                    disabled={!!chosen}
                                    onClick={() => answerQuiz(q, opt)}
                                    className={`rounded-lg border px-4 py-2 text-left text-sm transition ${cls}`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {blocks.length > 0 ? (
        <div className="mt-8">
          {done ? (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-3 text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="h-5 w-5" /> Sesi selesai
            </div>
          ) : (
            <button
              onClick={markComplete}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: TEAL }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Tandai selesai
            </button>
          )}
        </div>
      ) : null}

      {prev || next ? (
        <div className="mt-6 flex items-stretch justify-between gap-3">
          {prev ? (
            <a
              href={`/akun/belajar/${prev.id}`}
              className="flex flex-1 items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600 hover:border-slate-300"
            >
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <span className="line-clamp-1">Sesi {prev.sort_order}</span>
            </a>
          ) : (
            <div className="flex-1" />
          )}
          {next ? (
            <a
              href={`/akun/belajar/${next.id}`}
              className="flex flex-1 items-center justify-end gap-1.5 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600 hover:border-slate-300"
            >
              <span className="line-clamp-1">Sesi {next.sort_order}</span>
              <ChevronRight className="h-4 w-4 shrink-0" />
            </a>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      ) : null}
    </div>
  );
}
