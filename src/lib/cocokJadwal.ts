// [jadwal-sesudah-bayar-v1] Cocokkan jam yang BISA siswa (kisi 30 menit di form pendataan)
// dengan jam kosong pengajar aktif bahasa itu (jadwalPublik — rumus yang sama dengan
// kalender publik lama & "Atur jadwal sendiri"). Dihitung sesudah form dikirim; hasilnya
// ditampilkan ke siswa dan disimpan di student_intake_forms.schedule_match untuk admin.
//
// Private = satu siswa satu pengajar, jadi yang dihitung adalah pengajar TERBAIK: berapa
// hari pilihan siswa yang bisa dia pegang dengan satu sesi utuh (durasi kelasnya).
//   cocok    → satu pengajar bisa memegang ≥ min(2, jumlah hari pilihan siswa) hari
//   sebagian → ada pengajar, tapi cuma sebagian hari
//   tidak    → tidak ada jam yang bisa dipegang (atau Availability belum diisi)
// Preferensi gender pengajar belum ikut disaring — admin yang memastikan.

import { wibOf } from "@/lib/aturJadwal";
import { DURASI_PUBLIK, jadwalPublik } from "@/lib/jadwalPublikServer";

export const HARI_PENDATAAN = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const LANGKAH = 30;
const RENTANG_RE = /^(\S+)\s+(\d{1,2})[.:](\d{2})\s*[-–]\s*(\d{1,2})[.:](\d{2})$/;

export type StatusCocok = "cocok" | "sebagian" | "tidak";
export type HasilCocok = {
  status: StatusCocok;
  durasi: number;
  /** Jumlah hari berbeda yang dipilih siswa. */
  hariDiminta: number;
  /** Hari terbanyak yang bisa dipegang SATU pengajar. */
  hariCocok: number;
  /** Contoh jam mulai dari pengajar terbaik, satu per hari: "Senin 19.00". */
  contoh: string[];
  /** Ada pengajar bahasa ini yang Availability-nya segar. */
  adaPengajar: boolean;
  dicek: string;
};

const titik = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}.${String(m % 60).padStart(2, "0")}`;

/** "Senin 19.00-21.00, Kamis 08.00-09.30" → kunci kotak 30 menit "hari|menit". */
export function kotakSiswa(teks: string): Set<string> {
  const set = new Set<string>();
  for (const bagian of teks.split(",").map((s) => s.trim()).filter(Boolean)) {
    const m = bagian.match(RENTANG_RE);
    if (!m) continue;
    const d = HARI_PENDATAAN.indexOf(m[1]);
    if (d < 0) continue;
    const dari = Number(m[2]) * 60 + Number(m[3]);
    const sampai = Number(m[4]) * 60 + Number(m[5]);
    for (let x = dari - (dari % LANGKAH); x < sampai; x += LANGKAH) set.add(`${d}|${x}`);
  }
  return set;
}

/** "60", "60 menit", 45 → durasi kalender terdekat (30/45/60/90); kosong = 60. */
export function durasiKelas(raw: unknown): number {
  const n = parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(n) || n <= 0) return 60;
  return [...DURASI_PUBLIK].sort((a, b) => Math.abs(a - n) - Math.abs(b - n))[0];
}

/** Sesi [menit, menit+durasi) seluruhnya di dalam kotak yang dipilih siswa. */
function muat(kotak: Set<string>, dow: number, menit: number, durasi: number) {
  for (let x = menit - (menit % LANGKAH); x < menit + durasi; x += LANGKAH) {
    if (!kotak.has(`${dow}|${x}`)) return false;
  }
  return true;
}

export function hitungCocok(
  kotak: Set<string>,
  slot: number[],
  guru: number[][],
  durasi: number,
  adaPengajar: boolean,
): HasilCocok {
  const hariDiminta = new Set([...kotak].map((k) => k.split("|")[0])).size;
  // Per pengajar: hari → jam mulai paling awal yang muat di pilihan siswa.
  const perGuru = new Map<number, Map<number, number>>();
  slot.forEach((t, i) => {
    const w = wibOf(t);
    const menit = w.hh * 60 + w.mi;
    if (!muat(kotak, w.dow, menit, durasi)) return;
    for (const g of guru[i] ?? []) {
      const hari = perGuru.get(g) ?? new Map<number, number>();
      const lama = hari.get(w.dow);
      if (lama === undefined || menit < lama) hari.set(w.dow, menit);
      perGuru.set(g, hari);
    }
  });
  let terbaik = new Map<number, number>();
  for (const hari of perGuru.values()) if (hari.size > terbaik.size) terbaik = hari;
  const hariCocok = terbaik.size;
  const target = Math.min(2, hariDiminta);
  const status: StatusCocok = hariCocok === 0 ? "tidak" : hariCocok >= target ? "cocok" : "sebagian";
  const contoh = [...terbaik.entries()]
    .sort((a, b) => a[0] - b[0])
    .slice(0, 4)
    .map(([d, m]) => `${HARI_PENDATAAN[d]} ${titik(m)}`);
  return { status, durasi, hariDiminta, hariCocok, contoh, adaPengajar, dicek: new Date().toISOString() };
}

/** Kelas berjadwal batch (Reguler / Test Prep grup) tidak dicocokkan — jamnya sudah fix. */
export const programBerbatch = (program: unknown) => /reguler|regular|batch|etp|grup|group/i.test(String(program || ""));

export async function cocokkanJadwal(language: string, teksJadwal: string, durasiRaw: unknown): Promise<HasilCocok | null> {
  const kotak = kotakSiswa(teksJadwal);
  if (!kotak.size || !language) return null;
  const durasi = durasiKelas(durasiRaw);
  const h = await jadwalPublik(language, durasi);
  return hitungCocok(kotak, h.slot, h.guru, durasi, h.adaPengajar);
}
