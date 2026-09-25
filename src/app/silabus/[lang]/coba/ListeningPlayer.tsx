"use client";

/* [placement-listening-v1] Pemutar audio soal listening placement test.
 *
 * Suaranya lewat /api/tts (Google Chirp 3 HD) — rute yang sama dengan kuis,
 * Watch & Learn, dan reader e-book, jadi tak ada kredensial atau tagihan baru.
 * Cache-nya tiga lapis:
 *   1. memori     — soal yang sama diputar ulang / siswa mundur ke soal itu;
 *   2. CDN+browser — dipanggil lewat GET, balasannya disimpan setahun;
 *   3. server     — Supabase Storage `tts-cache` di /api/tts, dipakai bersama
 *                   semua peserta: satu transkrip cuma disintesis sekali.
 * Audio semua soal listening disiapkan begitu tes dimulai (siapkanAudio), jadi
 * waktu siswa sampai di soalnya tombol putar langsung berbunyi.
 *
 * Web Speech browser SENGAJA tidak dipakai sebagai cadangan: mutu dan aksennya
 * tergantung HP masing-masing — tak adil untuk soal yang dinilai. Gagal muat →
 * tombol "Coba lagi"; siswa tetap bisa melewati soalnya.
 */
import { useEffect, useRef, useState } from "react";
import { Headphones, Loader2, Pause, Play, RotateCw } from "lucide-react";
import type { ListeningAudio } from "@/data/placement/english";

/** Batas putar per soal — pola tes listening pada umumnya. */
export const MAKS_PUTAR = 3;

const memori = new Map<string, Promise<string | null>>(); // `${lang}|${text}` -> objectURL
const hitungPutar = new Map<string, number>(); // id soal -> sudah diputar berapa kali

function ambilAudio(a: ListeningAudio): Promise<string | null> {
  const kunci = `${a.lang}|${a.text}`;
  const ada = memori.get(kunci);
  if (ada) return ada;
  const kerja = (async () => {
    // GET, bukan POST: hanya GET yang boleh disimpan CDN Vercel + cache browser.
    const res = await fetch(`/api/tts?text=${encodeURIComponent(a.text)}&lang=${encodeURIComponent(a.lang)}`);
    if (!res.ok) return null;
    const { audioContent } = await res.json();
    if (!audioContent) return null;
    const bytes = Uint8Array.from(atob(audioContent), (c) => c.charCodeAt(0));
    return URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }));
  })().catch(() => null);
  memori.set(kunci, kerja);
  // Gagal jangan dikunci di memori — "Coba lagi" harus benar-benar mencoba lagi.
  void kerja.then((url) => { if (!url) memori.delete(kunci); });
  return kerja;
}

/** Siapkan audio semua soal listening + reset hitungan putar (tes baru dimulai). */
export function siapkanAudio(daftar: (ListeningAudio | undefined)[]) {
  hitungPutar.clear();
  for (const a of daftar) if (a) void ambilAudio(a);
}

function fmt(sec: number): string {
  if (!isFinite(sec) || sec < 0) return "0:00";
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
}

export default function ListeningPlayer({ id, audio }: { id: string; audio: ListeningAudio }) {
  const [url, setUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"muat" | "siap" | "gagal">("muat");
  const [main, setMain] = useState(false);
  const [waktu, setWaktu] = useState(0);
  const [durasi, setDurasi] = useState(0);
  const [pelan, setPelan] = useState(false);
  const [putar, setPutar] = useState(() => hitungPutar.get(id) ?? 0);
  const el = useRef<HTMLAudioElement | null>(null);

  const muat = () => {
    setStatus("muat");
    ambilAudio(audio).then((u) => {
      if (u) { setUrl(u); setStatus("siap"); } else setStatus("gagal");
    });
  };
  useEffect(() => {
    muat();
    return () => { el.current?.pause(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audio.text, audio.lang]);

  useEffect(() => {
    if (el.current) el.current.playbackRate = pelan ? 0.75 : 1;
  }, [pelan, url]);

  const habis = putar >= MAKS_PUTAR;

  const tekan = () => {
    const a = el.current;
    if (!a || status !== "siap") return;
    if (main) { a.pause(); return; }
    // Lanjut dari posisi jeda tidak dihitung putaran baru.
    const mulaiBaru = a.currentTime === 0 || a.ended;
    if (mulaiBaru) {
      if (habis) return;
      const n = putar + 1;
      hitungPutar.set(id, n);
      setPutar(n);
      a.currentTime = 0;
    }
    a.playbackRate = pelan ? 0.75 : 1;
    a.play().catch(() => setMain(false));
  };

  const persen = durasi ? Math.min(100, (waktu / durasi) * 100) : 0;
  // onEnded memutar balik ke 0, jadi waktu === 0 = belum/sudah selesai diputar.
  const tombolMati = status !== "siap" || (habis && !main && waktu === 0);

  return (
    <div className="mb-5 rounded-2xl border border-[#1A9E9E]/20 bg-[#1A9E9E]/5 p-4">
      <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-[#1A9E9E] uppercase tracking-wide">
        <Headphones className="w-4 h-4" /> Listening
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={tekan} disabled={tombolMati}
          aria-label={main ? "Jeda audio" : "Putar audio"}
          className="w-12 h-12 flex-shrink-0 rounded-full bg-[#1A9E9E] text-white flex items-center justify-center shadow-md shadow-[#1A9E9E]/20 hover:bg-[#147a7a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          {status === "muat" ? <Loader2 className="w-5 h-5 animate-spin" />
            : main ? <Pause className="w-5 h-5" fill="currentColor" />
            : <Play className="w-5 h-5 ml-0.5" fill="currentColor" />}
        </button>
        <div className="flex-1 min-w-0">
          {status === "gagal" ? (
            <div className="flex items-center gap-2 text-sm text-rose-600">
              Audio gagal dimuat.
              <button type="button" onClick={muat} className="inline-flex items-center gap-1 font-semibold underline underline-offset-2">
                <RotateCw className="w-3.5 h-3.5" /> Coba lagi
              </button>
            </div>
          ) : (
            <>
              <div className="h-1.5 bg-white rounded-full overflow-hidden">
                <div className="h-full bg-[#1A9E9E] rounded-full transition-[width] duration-200" style={{ width: persen + "%" }} />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs text-gray-500 tabular-nums">
                <span>{fmt(waktu)} / {fmt(durasi)}</span>
                <span>{habis ? "Batas putar habis" : `Sisa putar: ${MAKS_PUTAR - putar}`}</span>
              </div>
            </>
          )}
        </div>
        <button type="button" onClick={() => setPelan((p) => !p)} aria-pressed={pelan}
          className={"px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors " +
            (pelan ? "bg-[#1A9E9E] text-white border-[#1A9E9E]" : "bg-white text-gray-600 border-gray-200 hover:border-[#1A9E9E]")}>
          0.75x
        </button>
      </div>
      {url && (
        <audio ref={el} src={url} preload="auto"
          onLoadedMetadata={(e) => setDurasi(e.currentTarget.duration)}
          onTimeUpdate={(e) => setWaktu(e.currentTarget.currentTime)}
          onPlay={() => setMain(true)}
          onPause={() => setMain(false)}
          onEnded={(e) => { setMain(false); e.currentTarget.currentTime = 0; setWaktu(0); }} />
      )}
    </div>
  );
}
