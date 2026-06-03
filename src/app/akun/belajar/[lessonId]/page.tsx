"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
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
import StudentShell, { type AkunTab } from "@/components/akun/StudentShell"; // [linguo-patch:lms-player-shell-v1]

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TEAL = "#16796E"; // [linguo-patch:lms-player-shell-v1] samain palet /akun

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

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = Array.isArray(params?.lessonId)
    ? params.lessonId[0]
    : (params?.lessonId as string);

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [lesson, setLesson] = useState<any>(null);
  const [locked, setLocked] = useState(false);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showText, setShowText] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prevId, setPrevId] = useState<string | null>(null);
  const [nextId, setNextId] = useState<string | null>(null);

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
        .select("id,title,est_minutes,is_preview,module_id,sort_order")
        .eq("id", lessonId)
        .maybeSingle();
      if (!les) {
        setLoading(false);
        return;
      }
      setLesson(les);

      const { data: mod } = await supabase
        .from("lms_modules")
        .select("id,course_id")
        .eq("id", les.module_id)
        .maybeSingle();

      let entitled = false;
      if (mod?.course_id) {
        try {
          const { data: e } = await supabase.rpc("lms_is_entitled", {
            p_course_id: mod.course_id,
          });
          entitled = !!e;
        } catch {}
      }
      const isLocked = !les.is_preview && !entitled;
      setLocked(isLocked);

      // prev / next within the same module
      const { data: sibs } = await supabase
        .from("lms_lessons")
        .select("id,sort_order")
        .eq("module_id", les.module_id)
        .order("sort_order");
      const list = sibs || [];
      const idx = list.findIndex((s: any) => s.id === les.id);
      setPrevId(idx > 0 ? list[idx - 1].id : null);
      setNextId(idx >= 0 && idx < list.length - 1 ? list[idx + 1].id : null);

      if (!isLocked) {
        const { data: blks } = await supabase
          .from("lms_blocks")
          .select(
            "id,type,content,media_url,sort_order, lms_quiz_questions(id,type,prompt,options,answer,sort_order)"
          )
          .eq("lesson_id", les.id)
          .order("sort_order");
        setBlocks(blks || []);

        const { data: prog } = await supabase
          .from("lms_progress")
          .select("status")
          .eq("user_id", user.id)
          .eq("lesson_id", les.id)
          .maybeSingle();
        if (prog && prog.status === "completed") setDone(true);
      }

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

  // nav-rail di sub-route player: balik ke /akun dgn tab kepilih
  const goTab = (t: AkunTab) => router.push(`/akun?menu=${t}`);

  const Back = (
    <a
      href="/akun/belajar"
      className="mb-5 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
    >
      <ArrowLeft className="h-4 w-4" /> Semua materi
    </a>
  );

  let inner: ReactNode;

  if (loading) {
    inner = (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-slate-300" />
      </div>
    );
  } else if (!user) {
    inner = (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <p className="text-slate-700">Kamu perlu masuk dulu untuk belajar.</p>
        <a
          href="/akun"
          className="mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
          style={{ background: TEAL }}
        >
          Masuk ke akun
        </a>
      </div>
    );
  } else if (!lesson) {
    inner = (
      <>
        {Back}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          Sesi tidak ditemukan.
        </div>
      </>
    );
  } else if (locked) {
    inner = (
      <>
        {Back}
        <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <Lock className="h-8 w-8 text-slate-300" />
          <h1 className="mt-3 text-lg font-bold text-slate-900">{lesson.title}</h1>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            Sesi ini terkunci. Aktifkan akses paket untuk membuka seluruh materi.
          </p>
          <a
            href="/akun"
            className="mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
            style={{ background: TEAL }}
          >
            Lihat akses
          </a>
        </div>
      </>
    );
  } else {
    inner = (
      <>
        {Back}
        <h1 className="text-2xl font-bold text-slate-900">{lesson.title}</h1>
        {lesson.est_minutes ? (
          <p className="mt-1 text-sm text-slate-500">± {lesson.est_minutes} menit</p>
        ) : null}

        <div className="mt-6 space-y-4">
          {blocks.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              Konten sesi ini belum diisi.
            </div>
          )}
          {blocks.map((b: any) => {
            const meta = BLOCK_META[b.type] || { icon: BookOpen, label: b.type };
            const Icon = meta.icon;
            return (
              <div key={b.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full"
                    style={{ background: "rgba(22,121,110,0.10)", color: TEAL }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold text-slate-700">{meta.label}</span>
                </div>

                {b.type === "audio" && (
                  <div>
                    <p className="mb-2 text-sm text-slate-500">{b.content?.instruction}</p>
                    <audio controls src={b.media_url} className="w-full" />
                    <p className="mt-1 text-xs text-slate-400">
                      (audio placeholder — aktif setelah R2 dipasang)
                    </p>
                    {!showText[b.id] ? (
                      <button
                        onClick={() => setShowText((p) => ({ ...p, [b.id]: true }))}
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
                        <div className="text-sm text-slate-500">{b.content?.gloss}</div>
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
                      <li key={i} className="flex items-center justify-between py-2">
                        <span className="font-medium text-slate-900">{it.vi}</span>
                        <span className="text-sm text-slate-500">{it.id}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {b.type === "quiz" && (
                  <div>
                    {b.content?.instruction ? (
                      <p className="mb-3 text-sm text-slate-500">{b.content.instruction}</p>
                    ) : null}
                    {((b.lms_quiz_questions || []) as any[])
                      .sort((qa: any, qb: any) => qa.sort_order - qb.sort_order)
                      .map((q: any) => {
                        const chosen = answers[q.id];
                        return (
                          <div key={q.id} className="mb-4 last:mb-0">
                            <div className="mb-2 font-medium text-slate-900">{q.prompt}</div>
                            <div className="flex flex-col gap-2">
                              {(q.options || []).map((opt: string) => {
                                const isChosen = chosen === opt;
                                const isCorrect = opt === q.answer;
                                let cls = "border-slate-200 text-slate-700 hover:border-slate-300";
                                if (chosen) {
                                  if (isCorrect)
                                    cls = "border-emerald-400 bg-emerald-50 text-emerald-700";
                                  else if (isChosen)
                                    cls = "border-rose-400 bg-rose-50 text-rose-700";
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

        {/* Complete */}
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

        {/* Prev / Next */}
        <div className="mt-4 flex items-center justify-between gap-3">
          {prevId ? (
            <a
              href={`/akun/belajar/${prevId}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800"
            >
              <ChevronLeft className="h-4 w-4" /> Sebelumnya
            </a>
          ) : (
            <span />
          )}
          {nextId ? (
            <a
              href={`/akun/belajar/${nextId}`}
              className="inline-flex items-center gap-1 text-sm font-medium"
              style={{ color: TEAL }}
            >
              Berikutnya <ChevronRight className="h-4 w-4" />
            </a>
          ) : (
            <span />
          )}
        </div>
      </>
    );
  }

  return (
    <StudentShell active="materi" onTabChange={goTab}>
      {/* [linguo-patch:lms-player-shell-v1] scroll-container sendiri krn panel materi overflow-hidden */}
      <div className="flex-1 min-h-0 lg:overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-5 py-6 lg:px-8 lg:py-8">{inner}</div>
      </div>
    </StudentShell>
  );
}
