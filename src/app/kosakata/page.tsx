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

  // Baca bahasa terakhir sesudah mount (hindari mismatch hidrasi).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved) setLang(saved);
    } catch {
      /* abaikan */
    }
  }, []);

  const close = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/akun");
  };

  return <FlashcardDeck initialLang={lang} onClose={close} />;
}
