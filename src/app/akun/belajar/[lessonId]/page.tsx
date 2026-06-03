"use client";

import { useParams, useRouter } from "next/navigation";
import StudentShell, { type AkunTab } from "@/components/akun/StudentShell";
import LessonPlayer from "@/components/akun/LessonPlayer"; // [linguo-patch:lms-lesson-frame-v1]

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = Array.isArray(params?.lessonId)
    ? params.lessonId[0]
    : (params?.lessonId as string);

  const goTab = (t: AkunTab) => router.push(`/akun?menu=${t}`);

  return (
    <StudentShell active="materi" onTabChange={goTab}>
      <LessonPlayer lessonId={lessonId} onBack={() => router.push("/akun?menu=materi")} />
    </StudentShell>
  );
}
