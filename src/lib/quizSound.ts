// Efek suara kuis kosakata — disintesis langsung lewat Web Audio API (tanpa file
// aset .mp3, jadi tak menambah beban unduh & aman dari CSP). Semua nada dibangkitkan
// dari oscillator + envelope singkat. AudioContext dibuat malas saat pertama dipakai
// (harus dari gestur pengguna, mis. tombol "Mulai") supaya lolos kebijakan autoplay.

type Osc = OscillatorType;

export interface QuizAudio {
  correct: () => void;
  wrong: () => void;
  tick: () => void;
  finish: () => void;
  click: () => void;
  /** Hujan Kata: huruf benar — ketukan sangat halus. */
  type: () => void;
  /** Hujan Kata: huruf salah — dengung pendek pelan. */
  typo: () => void;
  /** Hujan Kata: nyawa habis — nada turun. */
  gameOver: () => void;
  /** Bangunkan/resume context — panggil dari klik pengguna sebelum main. */
  unlock: () => void;
}

// Bunyikan satu nada: frekuensi (Hz), durasi (dtk), bentuk gelombang, volume, dan
// jeda mulai (dtk) untuk merangkai beberapa nada jadi melodi.
function tone(
  ctx: AudioContext,
  freq: number,
  dur: number,
  type: Osc = "sine",
  gain = 0.15,
  delay = 0
) {
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  // Envelope attack-decay pendek supaya tak "klik" di awal/akhir.
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export function createQuizAudio(): QuizAudio {
  let ctx: AudioContext | null = null;

  const ac = (): AudioContext | null => {
    if (typeof window === "undefined") return null;
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      try {
        ctx = new AC();
      } catch {
        return null;
      }
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  };

  return {
    unlock: () => {
      ac();
    },
    // Benar: dua nada naik ceria (ala "ting-ting").
    correct: () => {
      const c = ac();
      if (!c) return;
      tone(c, 659.25, 0.12, "triangle", 0.16, 0); // E5
      tone(c, 987.77, 0.18, "triangle", 0.16, 0.1); // B5
    },
    // Salah: dengung rendah singkat (ala "errt").
    wrong: () => {
      const c = ac();
      if (!c) return;
      tone(c, 196, 0.16, "square", 0.12, 0); // G3
      tone(c, 146.83, 0.22, "square", 0.12, 0.08); // D3
    },
    // Detik-detik terakhir waktu — blip pendek halus.
    tick: () => {
      const c = ac();
      if (!c) return;
      tone(c, 880, 0.05, "sine", 0.07, 0);
    },
    // Selesai: arpeggio C-E-G-C meriah.
    finish: () => {
      const c = ac();
      if (!c) return;
      tone(c, 523.25, 0.14, "triangle", 0.15, 0); // C5
      tone(c, 659.25, 0.14, "triangle", 0.15, 0.12); // E5
      tone(c, 783.99, 0.14, "triangle", 0.15, 0.24); // G5
      tone(c, 1046.5, 0.32, "triangle", 0.17, 0.36); // C6
    },
    // Pilih opsi — klik lembut.
    click: () => {
      const c = ac();
      if (!c) return;
      tone(c, 440, 0.04, "sine", 0.06, 0);
    },
    // Hujan Kata: tiap huruf benar — dibuat sangat pelan karena berbunyi terus.
    type: () => {
      const c = ac();
      if (!c) return;
      tone(c, 1318.5, 0.03, "sine", 0.035, 0); // E6
    },
    // Hujan Kata: huruf salah — dengung rendah pendek, lebih halus dari `wrong`.
    typo: () => {
      const c = ac();
      if (!c) return;
      tone(c, 174.61, 0.07, "square", 0.05, 0); // F3
    },
    // Hujan Kata: nyawa habis — tiga nada turun.
    gameOver: () => {
      const c = ac();
      if (!c) return;
      tone(c, 392, 0.16, "triangle", 0.15, 0); // G4
      tone(c, 311.13, 0.16, "triangle", 0.15, 0.15); // Eb4
      tone(c, 233.08, 0.4, "triangle", 0.15, 0.3); // Bb3
    },
  };
}
