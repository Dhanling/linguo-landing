"use client";

// [latihan-menulis-v1] Tab "Latihan Menulis" di dashboard siswa — menyambungkan
// WritingPractice ke suara (/api/tts lewat ebookTts) dan penilaian AI
// (/api/menulis-nilai) milik landing.
import { useCallback } from "react";
import { supabase } from "@/lib/supabase-client";
import WritingPractice, { type MintaNilaiAi } from "@/components/akun/WritingPractice";

function ucapBrowser(teks: string, kode: string) {
  try {
    const u = new SpeechSynthesisUtterance(teks);
    u.lang = kode;
    u.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch { /* peramban tanpa speechSynthesis */ }
}

export default function LatihanMenulisTab({ languages }: { languages: (string | null | undefined)[] }) {
  // ebookTts besar (±2.000 baris) — baru ditarik saat tombol Dengar pertama kali diketuk.
  const speak = useCallback((teks: string, kode: string) => {
    import("@/lib/ebookTts")
      .then((m) => m.ucapkanEbook(teks, kode))
      .then((hasil) => { if (hasil === "dilewati") ucapBrowser(teks, kode); })
      .catch(() => ucapBrowser(teks, kode));
  }, []);

  const aiGrade = useCallback<MintaNilaiAi>(async (a) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("belum login");
    const res = await fetch("/api/menulis-nilai", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(a),
    });
    if (!res.ok) throw new Error(`menulis-nilai ${res.status}`);
    const j = await res.json();
    return { score: Number(j.score) || 0, feedback: String(j.feedback || ""), tips: Array.isArray(j.tips) ? j.tips : [] };
  }, []);

  return <WritingPractice skin="siswa" preferLangs={languages} speak={speak} aiGrade={aiGrade} />;
}
