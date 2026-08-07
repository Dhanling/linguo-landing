"use client";

// [sim-riwayat-v1] Buka HASIL LAMA satu pengerjaan simulasi.
// Dulu skor cuma tampil sekali (tepat setelah submit) — begitu halaman ditutup,
// siswa tak punya cara melihatnya lagi. Halaman ini menyusun ulang layar hasil
// dari simulation_attempts + simulation_answers (RLS: hanya baris sendiri).
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchAttemptReview, getStudentInfo, type Question } from "@/lib/simulations";
import ResultView, { type ResultItem } from "@/components/akun/simulasi/ResultView";
import { ArrowLeft, Loader2 } from "lucide-react";

const TEAL = "#1A9E9E";

type Loaded = {
  sim: { title: string; test_type: any; test_variant: any };
  sections: { skill: any }[];
  results: ResultItem[];
  totals: { score: number; max_score: number; auto_score: number; ai_score: number };
  submittedAt: string | null;
};

export default function HasilSimulasiPage() {
  const params = useParams<{ attemptId: string }>();
  const attemptId = params?.attemptId as string;
  const [state, setState] = useState<"loading" | "ready" | "notfound" | "noauth">("loading");
  const [data, setData] = useState<Loaded | null>(null);
  const [studentName, setStudentName] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const info = await getStudentInfo();
      if (!alive) return;
      if (!info) { setState("noauth"); return; }
      setStudentName(info.name);

      const review = await fetchAttemptReview(attemptId);
      if (!alive) return;
      if (!review) { setState("notfound"); return; }

      const { attempt, sections, questions, answers } = review;
      const ansOf = new Map(answers.map((a) => [a.question_id, a]));
      const skillOf = new Map<string, string>();
      const titleOf = new Map<string, string>();
      sections.forEach((s) => { titleOf.set(s.id, s.title); });
      questions.forEach((q) => {
        const sec = sections.find((s) => s.id === q.section_id);
        skillOf.set(q.id, sec?.skill ?? "reading");
      });

      // Susun ulang baris pembahasan. Soal yang tak punya baris jawaban (mis.
      // soal ditambahkan admin setelah attempt ini) ditandai tidak dijawab.
      const results: ResultItem[] = questions.map((q: Question) => {
        const a = ansOf.get(q.id);
        return {
          question: q,
          skill: (a?.section_skill as string) || skillOf.get(q.id) || "reading",
          correct: a?.is_correct ?? null,
          points: Number(a?.points_earned ?? 0),
          ai_score: a?.ai_score == null ? null : Number(a.ai_score),
          ai_feedback: a?.ai_feedback ?? null,
          section_id: q.section_id,
          section_title: titleOf.get(q.section_id) || "",
          answer_index: a?.selected_index ?? null,
          answer_text: a?.response_text ?? "",
          answer_audio_url: a?.audio_url ?? null,
        };
      });

      const maxFromQuestions = questions.reduce((n, q) => n + (q.points || 0), 0);
      setData({
        sim: { title: attempt.title, test_type: attempt.test_type, test_variant: attempt.test_variant },
        sections,
        results,
        totals: {
          score: attempt.score ?? 0,
          // max_score attempt jadi acuan; kalau kosong (baris lama) pakai total poin soal.
          max_score: attempt.max_score ?? maxFromQuestions,
          auto_score: 0,
          ai_score: 0,
        },
        submittedAt: attempt.submitted_at,
      });
      setState("ready");
    })();
    return () => { alive = false; };
  }, [attemptId]);

  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (state !== "ready" || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <p className="text-sm text-slate-600">
            {state === "noauth"
              ? "Masuk dulu untuk melihat riwayat skormu."
              : "Hasil ini tidak ditemukan — mungkin pengerjaannya belum selesai atau bukan milik akun ini."}
          </p>
          <Link
            href={state === "noauth" ? "/akun" : "/akun?menu=simulasi"}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold text-white"
            style={{ background: TEAL }}
          >
            <ArrowLeft className="h-4 w-4" />{state === "noauth" ? "Masuk" : "Ke Riwayat Skor"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ResultView
      past
      attemptId={attemptId}
      sim={data.sim}
      sections={data.sections}
      totals={data.totals}
      results={data.results}
      studentName={studentName}
      submittedAt={data.submittedAt}
    />
  );
}
