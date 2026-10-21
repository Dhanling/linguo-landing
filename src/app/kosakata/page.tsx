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
import type { LwThemePractice } from "@/components/lingwords/LwThemeMap";
import { getSavedWords, saveWord, type SavedWord } from "@/lib/immersionLearn";

// Sama dgn WatchAndLearn — bahasa terakhir dipilih, untuk filter awal deck.
const LANG_KEY = "linguo:watch:lang:v1";

export default function KosakataPage() {
  const router = useRouter();
  const [deckLang, setDeckLang] = useState<string | null>(null);
  const [deckOnly, setDeckOnly] = useState<{ label: string; keys: string[] } | null>(null);
  const [deckGame, setDeckGame] = useState<{ mode: "quiz" | "rain"; words: SavedWord[] } | null>(null);
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

  /* [lingwords-v2] Latih satu tema: kata tema yang belum ada di simpanan perangkat ini
     (materi, Lingnote, perangkat lain) dan belum dikuasai dimasukkan dulu sebagai
     kartu baru — flashcard/SRS hanya bekerja di atas simpanan lokal. */
  const practiceTheme = (lang: string, p: LwThemePractice) => {
    const key = (w: string) => `${lang}::${w.trim().toLowerCase()}`;
    /* [lingwords-v3] Kuis / Hujan Kata per tema: murni permainan (tak menyentuh SRS),
       jadi pakai SEMUA kata tema — termasuk yang dikuasai — tanpa menambah simpanan.
       Versi simpanan lokal didahulukan karena sering punya translit (wajib untuk
       mengetik kata non-Latin di Hujan Kata). */
    if (p.mode === "quiz" || p.mode === "rain") {
      const local = new Map(getSavedWords().map((w) => [key(w.word), w]));
      const words: SavedWord[] = p.words
        .filter((w) => w.meaning?.trim())
        .map((w) => {
          const s = local.get(key(w.word));
          return s
            ? { ...s, meaning: s.meaning || w.meaning, translit: s.translit || w.translit }
            : { word: w.word, meaning: w.meaning, translit: w.translit, langCode: lang, example: "", ts: w.firstSeen || Date.now() };
        });
      setDeckOnly(null);
      setDeckGame({ mode: p.mode, words });
      setDeckLang(lang);
      return;
    }
    setDeckGame(null);
    if (!previewId) {
      const have = new Set(getSavedWords().map((w) => key(w.word)));
      p.words
        .filter((w) => w.stage !== "dikuasai" && !have.has(key(w.word)))
        .slice(0, 40)
        .forEach((w) => saveWord({
          word: w.word,
          meaning: w.meaning,
          translit: w.translit,
          langCode: lang,
          example: "",
          ...(w.source === "lingnote" || w.source === "ebook" ? { origin: w.source } : {}),
        }));
    }
    setDeckOnly({ label: p.label, keys: p.words.map((w) => key(w.word)) });
    setDeckLang(lang);
  };

  const closeDeck = () => {
    setDeckLang(null);
    setDeckOnly(null);
    setDeckGame(null);
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
          previewStudentId={previewId}
          onPractice={(l) => setDeckLang(l)}
          onPracticeTheme={practiceTheme}
        />
      </main>
      {deckLang && <FlashcardDeck initialLang={deckLang} onClose={closeDeck} only={deckOnly} game={deckGame} />}
    </StudentShell>
  );
}
