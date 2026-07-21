// [lingbook-tts-gemini] Helper audio reader Lingbook.
//
// Utama: Gemini 2.5 Flash TTS via /api/lingbook/tts (suara natural, bukan robot).
// Audio WAV di-cache per (bahasa+teks) selama sesi supaya baris/kata yang diputar
// ulang instan & hemat kuota. Fallback: Web Speech browser (speechSynthesis) bila
// endpoint gagal (mis. kuota Gemini habis / offline), jadi tombol putar tak pernah
// "mati" total.
//
// API dipertahankan mirip versi lama: speak() balikin handle; pemanggil pasang
// `.onended` (menggantikan `.onend`) untuk tahu kapan pengucapan selesai.

let currentAudio: HTMLAudioElement | null = null;
const cache = new Map<string, string>(); // `${lang}::${text}` → data URL WAV

export interface SpeakHandle {
  /** Dipanggil sekali saat pengucapan selesai (audio habis / fallback selesai / gagal). */
  onended?: () => void;
}

export function cancelSpeech() {
  try {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.onended = null;
      currentAudio.onerror = null;
      currentAudio = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
  } catch {
    /* no-op */
  }
}

// "ja-JP" → "ja". Gemini auto-detect dari teks; base lang dikirim utk keperluan lain.
function baseLang(lang: string): string {
  return (lang || "").split(/[-_]/)[0].toLowerCase();
}

// Fallback pengucapan pakai TTS browser. Selalu memanggil done() tepat sekali.
function browserFallback(text: string, lang: string, rate: number, done: () => void) {
  try {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      done();
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = rate;
    let fired = false;
    const fin = () => {
      if (!fired) {
        fired = true;
        done();
      }
    };
    u.onend = fin;
    u.onerror = fin;
    window.speechSynthesis.speak(u);
    // Jaring pengaman: beberapa browser tak selalu memicu onend.
    setTimeout(fin, Math.max(2500, text.length * 90));
  } catch {
    done();
  }
}

/**
 * Ucapkan teks. Utama Gemini TTS (natural); fallback Web Speech saat gagal.
 * Selalu mengembalikan handle non-null — pemanggil pasang `handle.onended`.
 */
export function speak(text: string, lang: string, rate = 0.95): SpeakHandle {
  const clean = (text || "").trim();
  const handle: SpeakHandle = {};
  let done = false;
  const finish = () => {
    if (!done) {
      done = true;
      handle.onended?.();
    }
  };

  if (typeof window === "undefined" || !clean) {
    setTimeout(finish, 0);
    return handle;
  }

  cancelSpeech();

  const play = (url: string) => {
    if (done) return;
    const a = new Audio(url);
    a.playbackRate = rate;
    currentAudio = a;
    a.onended = () => {
      if (currentAudio === a) currentAudio = null;
      finish();
    };
    a.onerror = () => {
      if (currentAudio === a) currentAudio = null;
      browserFallback(clean, lang, rate, finish);
    };
    a.play().catch(() => browserFallback(clean, lang, rate, finish));
  };

  const key = `${lang}::${clean}`;
  const cached = cache.get(key);
  if (cached) {
    play(cached);
    return handle;
  }

  fetch("/api/lingbook/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: clean, lang: baseLang(lang) }),
  })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((j: { audioContent?: string; mimeType?: string }) => {
      if (done) return;
      if (!j?.audioContent) throw new Error("no audio");
      const url = `data:${j.mimeType || "audio/wav"};base64,${j.audioContent}`;
      cache.set(key, url);
      play(url);
    })
    .catch(() => browserFallback(clean, lang, rate, finish));

  return handle;
}
