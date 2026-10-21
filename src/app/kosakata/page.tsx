"use client";

// [lingwords-v1] Halaman Lingwords — dulu "Kosakata Saya" yang langsung membuka
// FlashcardDeck layar penuh. Sekarang halaman progres kosakata (target per level,
// grafik, heatmap, tonggak) di dalam shell dashboard siswa; flashcard dibuka dari
// tombol "Latih kosakata" atau langsung lewat /kosakata?latih=1.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layers } from "lucide-react";
import FlashcardDeck from "@/components/watch/FlashcardDeck";
import StudentShell, { type AkunTab } from "@/components/akun/StudentShell";
import LingwordsDashboard from "@/components/lingwords/LingwordsDashboard";
import { supabase, peekSessionUser } from "@/lib/supabase-client";
import type { RegLike } from "@/lib/lingwords";

// Sama dgn WatchAndLearn — bahasa terakhir dipilih, untuk filter awal deck.
const LANG_KEY = "linguo:watch:lang:v1";

export default function KosakataPage() {
  const router = useRouter();
  const [deckLang, setDeckLang] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [regs, setRegs] = useState<RegLike[]>([]);

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    setPreviewId(qs.get("preview"));
    if (qs.get("latih")) {
      let l = "en";
      try { l = localStorage.getItem(LANG_KEY) || l; } catch { /* abaikan */ }
      setDeckLang(l);
    }
    setUserId(peekSessionUser()?.id || null);

    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!alive || !user) return;
      setUserId(user.id);
      if (qs.get("preview") || !user.email) return;
      // Level kelas → target kosakata per bahasa. Gagal = target jatuh ke A1, tetap jalan.
      const { data: st } = await supabase.from("students").select("id").eq("email", user.email);
      const ids = ((st as { id: string }[] | null) || []).map((s) => s.id);
      if (!ids.length) return;
      const { data: rg } = await supabase
        .from("registrations")
        .select("language, level, pipeline_status, archived_at")
        .in("student_id", ids)
        .is("archived_at", null);
      if (!alive) return;
      setRegs(((rg as (RegLike & { pipeline_status?: string })[] | null) || []).filter((r) => r.pipeline_status !== "Batal"));
    })();
    return () => { alive = false; };
  }, []);

  const goTab = (t: AkunTab) => {
    router.push(`/akun?menu=${t}${previewId ? `&preview=${encodeURIComponent(previewId)}` : ""}`);
  };

  const closeDeck = () => {
    setDeckLang(null);
    const qs = new URLSearchParams(window.location.search);
    if (qs.has("latih")) {
      qs.delete("latih");
      window.history.replaceState(null, "", `/kosakata${qs.toString() ? `?${qs}` : ""}`);
    }
  };

  return (
    <StudentShell active="kosakata" onTabChange={goTab} previewStudentId={previewId}>
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-5 sm:px-6">
        <div className="mb-4">
          <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 sm:text-2xl">
            <Layers className="h-6 w-6 text-[#1A9E9E]" /> Lingwords
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Semua kosakatamu — dari kelas, materi, e-book, Lingnote, dan Watch &amp; Learn — dan seberapa dekat kamu dengan target level.
          </p>
        </div>
        <LingwordsDashboard
          userId={userId}
          regs={regs}
          previewMode={!!previewId}
          onPractice={(l) => setDeckLang(l)}
        />
      </main>
      {deckLang && <FlashcardDeck initialLang={deckLang} onClose={closeDeck} />}
    </StudentShell>
  );
}
