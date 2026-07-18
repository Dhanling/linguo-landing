// [lingbook-phase1-v1] Helper audio. Phase 1: belum ada file audio nyata, jadi
// pengucapan pakai Web Speech (speechSynthesis). Struktur siap diganti <audio>
// bersumber Cloudflare/Supabase saat file tersedia (lihat field *Src di tipe).

export function cancelSpeech() {
  try {
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
  } catch {
    /* no-op */
  }
}

/**
 * Ucapkan teks via TTS browser. Mengembalikan utterance agar pemanggil bisa
 * memasang onend. Bila TTS tak tersedia, kembalikan null.
 */
export function speak(text: string, lang: string, rate = 0.92): SpeechSynthesisUtterance | null {
  try {
    if (typeof window === "undefined" || !window.speechSynthesis) return null;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = rate;
    window.speechSynthesis.speak(u);
    return u;
  } catch {
    return null;
  }
}
