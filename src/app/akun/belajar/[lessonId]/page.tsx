"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import StudentShell, { type AkunTab } from "@/components/akun/StudentShell";
import LessonPlayer from "@/components/akun/LessonPlayer"; // [linguo-patch:lms-lesson-frame-v1]

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const paramId = Array.isArray(params?.lessonId)
    ? params.lessonId[0]
    : (params?.lessonId as string);

  // [linguo-patch:lms-route-no-remount-v1] switch sesi pakai STATE LOKAL + history.replaceState,
  // BUKAN router.push. router.push = navigasi Next = halaman ke-refetch/remount tiap klik sesi →
  // bootedRef LessonPlayer reset → full-screen spinner + cache (useRef) ke-wipe. Dengan state lokal,
  // halaman ga remount: prop lessonId berubah → effect LessonPlayer re-run → cache-hit → instan, no spinner.
  // URL tetap di-sync (replaceState) biar refresh / share / deep-link tetap nunjuk sesi yang bener.
  const [lessonId, setLessonId] = useState(paramId);

  // Sync kalau param berubah dari LUAR (deep-link / navigasi Next beneran dari halaman lain).
  useEffect(() => {
    setLessonId(paramId);
  }, [paramId]);

  const goTab = (t: AkunTab) => router.push(`/akun?menu=${t}`);

  const openLesson = (id: string) => {
    setLessonId(id); // instan, ga ada navigasi → ga ada remount → ga ada spinner
    try {
      window.history.replaceState(null, "", `/akun/belajar/${id}`);
    } catch {
      /* no-op */
    }
  };

  return (
    <StudentShell active="materi" onTabChange={goTab}>
      <LessonPlayer
        lessonId={lessonId}
        onBack={() => router.push("/akun?menu=materi")}
        onOpenLesson={openLesson}
      />
    </StudentShell>
  );
}
