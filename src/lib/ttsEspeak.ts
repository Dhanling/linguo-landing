/* [tts-latin-espeak-v1] Sintesis suara lewat eSpeak NG (WebAssembly) — HANYA
 * untuk bahasa yang tak punya suara di penyedia komersial mana pun (peta di
 * ESPEAK_VOICES, src/lib/ttsVoice.ts). Dipanggil /api/tts lewat import dinamis,
 * jadi kontainer yang cuma melayani bahasa Google/Azure tak pernah memuat 23 MB
 * data eSpeak.
 *
 * Kenapa perlu kamus macron: modul Latina 101 sengaja ditulis TANPA macron,
 * padahal tekanan kata Latin ditentukan panjang vokal suku kedua dari belakang.
 * Tanpa macron eSpeak menganggap vokal itu pendek dan menekan suku sebelumnya —
 * diukur ke kolom cara baca: 22 dari 200 kata ≥3 suku salah (amicus terbaca
 * A-mi-kus, bukan a-MI-kus). Macron cuma dipakai sebagai MASUKAN mesin suara;
 * teks yang jadi kunci cache tetap teks polos yang dikirim reader, jadi nama
 * berkas cache yang dihitung klien tidak berubah.
 *
 * Lisensi: eSpeak NG GPL-3.0 — dijalankan di server, tidak didistribusikan.
 */
import { Mp3Encoder } from "@breezystack/lamejs";
import makronLa from "@/data/tts/la-makron.json";

/** token huruf kecil tanpa macron → bentuk bermacron, per kode suara eSpeak. */
const KAMUS_MAKRON: Record<string, Record<string, string>> = {
  la: makronLa as Record<string, string>,
};

/** Kecepatan bicara (kata/menit). Bawaan eSpeak 175 — terlalu cepat untuk
 *  pembelajar yang sedang mencocokkan bunyi dengan kolom cara baca. */
const KECEPATAN = 140;
const KBPS = 64;

type PekerjaEspeak = {
  set_voice(nama: string): number;
  set_rate(kpm: number): void;
  readonly samplerate: number;
  synthesize(teks: string, cb: (sampel: Int16Array | null, events: unknown[]) => boolean): void;
};

let _pekerja: Promise<PekerjaEspeak> | null = null;
function pekerja(): Promise<PekerjaEspeak> {
  if (!_pekerja) {
    _pekerja = import("@echogarden/espeak-ng-emscripten")
      .then(async ({ default: Module }) => {
        const m = await Module();
        return new m.eSpeakNGWorker() as PekerjaEspeak;
      })
      // Gagal memuat sekali jangan dikunci selamanya di kontainer ini.
      .catch((e) => { _pekerja = null; throw e; });
  }
  return _pekerja;
}

/** Teks polos → teks bermacron untuk mesin suara. Huruf besar di awal kata
 *  (nama orang, awal kalimat) dipertahankan; kata di luar kamus apa adanya. */
export function beriMakron(kodeEspeak: string, teks: string): string {
  const kamus = KAMUS_MAKRON[kodeEspeak];
  if (!kamus) return teks;
  return teks.replace(/[A-Za-z]+/g, (kata) => {
    const m = kamus[kata.toLowerCase()];
    if (!m) return kata;
    const kapital = kata[0] !== kata[0].toLowerCase();
    return kapital ? m[0].toUpperCase() + m.slice(1) : m;
  });
}

/** base64 mp3 untuk sepotong teks, atau lempar Error. */
export async function sintesisEspeak(kodeEspeak: string, teks: string): Promise<string> {
  const w = await pekerja();
  // synthesize() sinkron dari awal sampai akhir, jadi dua permintaan di
  // kontainer yang sama tak mungkin saling menimpa suara/kecepatannya.
  if (w.set_voice(kodeEspeak) !== 0) throw new Error(`espeak: suara ${kodeEspeak} tidak ada`);
  w.set_rate(KECEPATAN);

  const potongan: Int16Array[] = [];
  w.synthesize(beriMakron(kodeEspeak, teks), (sampel) => {
    if (sampel?.length) potongan.push(sampel.slice());
    return false; // true = hentikan sintesis
  });
  const total = potongan.reduce((n, p) => n + p.length, 0);
  if (!total) throw new Error("espeak: tak ada suara yang dihasilkan");

  const enc = new Mp3Encoder(1, w.samplerate, KBPS);
  const mp3: Uint8Array[] = [];
  const dorong = (b: Int8Array | Uint8Array) => {
    if (b.length) mp3.push(new Uint8Array(b.buffer, b.byteOffset, b.byteLength));
  };
  for (const p of potongan) {
    for (let i = 0; i < p.length; i += 1152) dorong(enc.encodeBuffer(p.subarray(i, i + 1152)));
  }
  dorong(enc.flush());
  return Buffer.concat(mp3).toString("base64");
}
