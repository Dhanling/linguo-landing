// [quran-reader-v1] Sumber teks Al-Qur'an: API publik Quran.com v4 (api.quran.com).
// Kita TIDAK menyimpan mushaf sendiri — teks Utsmani, tata letak 15 baris mushaf
// Madinah (page_number + line_number per kata), terjemah per kata Indonesia, dan
// terjemah Kemenag (resource 33) diambil dari sana lalu dipadatkan di server
// supaya klien tak menerima payload API mentah yang gemuk.
//
// Teks Al-Qur'an tak pernah berubah → cache fetch Next 30 hari (plus CDN di route).

export const QURAN_API = "https://api.quran.com/api/v4";
/** Terjemah Kementerian Agama RI di Quran.com. */
export const TERJEMAH_KEMENAG = 33;
export const JUMLAH_HALAMAN = 604;
/** Audio murattal per kata & per ayat (relatif ke host ini). */
export const AUDIO_KATA = "https://audio.qurancdn.com/";
export const AUDIO_AYAT = "https://verses.quran.com/";
const REVALIDATE = 60 * 60 * 24 * 30;

export type Kata = {
  /** "2:6:3" — surat:ayat:kata, sama dengan penomoran Quranic Arabic Corpus. */
  lok: string;
  ar: string;
  arti: string;
  latin: string;
  baris: number;
  /** "end" = penanda nomor ayat (bukan kata). */
  akhir?: boolean;
  audio?: string;
};

export type Ayat = {
  key: string;
  surat: number;
  ayat: number;
  juz: number;
  terjemah: string;
  kata: Kata[];
};

/** Balasan /api/quran/irab. */
export type HasilIrab = {
  struktur: string;
  kata: { no: number; ar: string; irab: string; fungsi: string }[];
  catatan: string[];
};

export type Halaman = { halaman: number; ayat: Ayat[] };

export type Surat = {
  id: number;
  nama: string;
  namaArab: string;
  arti: string;
  jumlahAyat: number;
  halaman: [number, number];
  tempat: "makkah" | "madinah";
  basmalah: boolean;
};

// Terjemah Kemenag memuat catatan kaki <sup foot_note=…>1</sup> — dibuang.
const bersihkan = (s: string) => s.replace(/<sup[^>]*>.*?<\/sup>/g, "").replace(/<[^>]+>/g, "").trim();

/* eslint-disable @typescript-eslint/no-explicit-any */
function padatkanAyat(v: any): Ayat {
  const [surat, ayat] = String(v.verse_key).split(":").map(Number);
  return {
    key: v.verse_key,
    surat,
    ayat,
    juz: v.juz_number,
    terjemah: bersihkan(v.translations?.[0]?.text ?? ""),
    kata: (v.words ?? []).map((w: any) => ({
      lok: w.location ?? `${v.verse_key}:${w.position}`,
      ar: w.text_uthmani ?? w.text,
      arti: w.translation?.text ?? "",
      latin: w.transliteration?.text ?? "",
      baris: w.line_number,
      ...(w.char_type_name === "end" ? { akhir: true } : {}),
      ...(w.audio_url ? { audio: w.audio_url } : {}),
    })),
  };
}

const PARAM_KATA =
  `words=true&word_fields=text_uthmani,location&language=id` +
  `&translations=${TERJEMAH_KEMENAG}&per_page=300`;

export async function ambilHalaman(n: number): Promise<Halaman> {
  const res = await fetch(`${QURAN_API}/verses/by_page/${n}?${PARAM_KATA}`, {
    next: { revalidate: REVALIDATE },
  });
  if (!res.ok) throw new Error(`quran.com halaman ${n}: HTTP ${res.status}`);
  const data = await res.json();
  return { halaman: n, ayat: (data.verses ?? []).map(padatkanAyat) };
}

export async function ambilAyat(key: string): Promise<Ayat> {
  const res = await fetch(`${QURAN_API}/verses/by_key/${key}?${PARAM_KATA}`, {
    next: { revalidate: REVALIDATE },
  });
  if (!res.ok) throw new Error(`quran.com ayat ${key}: HTTP ${res.status}`);
  const data = await res.json();
  return padatkanAyat(data.verse);
}

export async function ambilDaftarSurat(): Promise<Surat[]> {
  const res = await fetch(`${QURAN_API}/chapters?language=id`, { next: { revalidate: REVALIDATE } });
  if (!res.ok) throw new Error(`quran.com chapters: HTTP ${res.status}`);
  const data = await res.json();
  return (data.chapters ?? []).map((c: any) => ({
    id: c.id,
    nama: c.name_simple,
    namaArab: c.name_arabic,
    arti: c.translated_name?.name ?? "",
    jumlahAyat: c.verses_count,
    halaman: c.pages,
    tempat: c.revelation_place,
    basmalah: !!c.bismillah_pre,
  }));
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Halaman mushaf tempat surat/juz dimulai — untuk loncat cepat dari daftar. */
export const JUZ_MULAI = [
  1, 22, 42, 62, 82, 102, 121, 142, 162, 182, 201, 222, 242, 262, 282, 302, 322, 342, 362, 382,
  402, 422, 442, 462, 482, 502, 522, 542, 562, 582,
];
