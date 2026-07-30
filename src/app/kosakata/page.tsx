"use client";

// Halaman "Kosakata Saya" — entry point global ke flashcard kata tersimpan, biar
// bisa dibuka langsung dari sidebar dashboard tanpa harus masuk katalog Watch &
// Learn dulu. Me-render FlashcardDeck (overlay layar penuh) sbg halaman mandiri;
// tombol tutup mengembalikan ke halaman sebelumnya (fallback /akun).

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FlashcardDeck from "@/components/watch/FlashcardDeck";

// Sama dgn WatchAndLearn — bahasa terakhir dipilih, untuk filter awal deck.
const LANG_KEY = "linguo:watch:lang:v1";

export default function KosakataPage() {
  const router = useRouter();
  const [lang, setLang] = useState("en");
  // [preview-session-v1] POV siswa (staf). Kata tersimpan hidup di localStorage
  // perangkat masing-masing — tak ada salinannya di server — jadi dari pratinjau
  // yang tampil adalah kosakata BROWSER INI, bukan milik siswanya. Dijelaskan
  // lewat banner supaya deck kosong tak terbaca sebagai "siswa belum menyimpan apa pun".
  const [preview, setPreview] = useState(false);

  // Baca bahasa terakhir sesudah mount (hindari mismatch hidrasi).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved) setLang(saved);
    } catch {
      /* abaikan */
    }
    try {
      setPreview(!!new URLSearchParams(window.location.search).get("preview"));
    } catch {
      /* abaikan */
    }
  }, []);

  const close = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/akun");
  };

  return (
    <>
      <FlashcardDeck initialLang={lang} onClose={close} />
      {preview && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[95] flex justify-center px-3 pb-3">
          <p className="rounded-xl bg-amber-400/95 px-3.5 py-2 text-center text-[12px] font-semibold leading-snug text-amber-950 shadow-lg">
            Mode pratinjau — kosakata tersimpan di perangkat siswa, jadi daftar di sini
            mengikuti browser ini, bukan milik siswanya.
          </p>
        </div>
      )}
    </>
  );
}
