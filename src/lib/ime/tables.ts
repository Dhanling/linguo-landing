/**
 * Peta ketikan Latin → aksara, untuk aksara yang pemetaannya JUJUR satu arah:
 * tiap bunyi punya satu huruf, tanpa tebakan.
 *
 * ⚠️ Aksara yang TIDAK ada di sini sengaja tidak dipasang, bukan belum sempat:
 * - Arab/Persia/Urdu — vokal pendek tak ditulis, jadi "kitab" bisa jadi كتاب
 *   atau كِتَاب. Mesin akan mengarang ejaan, dan di lembar kuis yang dinilai,
 *   ejaan karangan itu keluar sebagai jawaban siswa.
 * - Devanagari/Thai — butuh mesin suku kata (matra, virama, nada), bukan tabel.
 * - Ibrani — sama seperti Arab.
 * Menambahkannya harus dengan mesin tersendiri + uji per bahasa.
 */

export type Tabel = Record<string, string>;

/* Rusia. Kuncinya konvensi yang benar-benar diketik orang (translit ALA-LC
   longgar), bukan satu sistem resmi: siswa mengetik "shch", "yo", "ya" — bukan
   "ŝ". Kunci terpanjang didahulukan oleh mesinnya, jadi "shch" tak pernah
   keburu terbaca "sh" + "ch". */
const RU: Tabel = {
  shch: "щ", sch: "щ", sh: "ш", ch: "ч", zh: "ж", ts: "ц", kh: "х",
  yo: "ё", yu: "ю", ya: "я", ye: "е", eh: "э",
  a: "а", b: "б", v: "в", g: "г", d: "д", e: "е", z: "з", i: "и",
  j: "й", k: "к", l: "л", m: "м", n: "н", o: "о", p: "п", r: "р",
  s: "с", t: "т", u: "у", f: "ф", h: "х", c: "ц", y: "ы",
  "'": "ь", '"': "ъ",
};

/* Ukraina & Bulgaria: turunan Rusia dengan beberapa huruf ditukar, bukan tabel
   baru. Menyalin seluruh tabel akan membuat perbaikan di satu tempat diam-diam
   tidak ikut ke dua tabel lain. */
const UK: Tabel = {
  ...RU,
  y: "и", i: "і", yi: "ї", ye: "є", g: "ґ", h: "г", e: "е",
  ji: "ї", je: "є",
};
delete (UK as Record<string, string | undefined>).eh;

/* Bulgaria mengikuti kebiasaan papan ketik fonetiknya: щ diketik "sht", ъ di
   tombol "y", я di tombol "q". Huruf ё dan э memang tidak ada di alfabetnya —
   dibuang, bukan dibiarkan menghasilkan aksara Rusia yang salah negara. */
const BG: Tabel = { ...RU, sht: "щ", y: "ъ", q: "я", ya: "я", yu: "ю" };
delete (BG as Record<string, string | undefined>).eh;
delete (BG as Record<string, string | undefined>).yo;

/* Yunani. Konvensi "greeklish" yang lazim: th→θ, ch→χ, ps→ψ, x/ks→ξ, w→ω.
   Sigma akhir kata (ς) tidak ditangani di sini — itu urusan mesin, karena baru
   ketahuan saat kata selesai diketik. */
const EL: Tabel = {
  th: "θ", ch: "χ", ps: "ψ", ks: "ξ", ou: "ου", ai: "αι", ei: "ει", oi: "οι",
  a: "α", b: "β", v: "β", g: "γ", d: "δ", e: "ε", z: "ζ", h: "η", i: "ι",
  k: "κ", l: "λ", m: "μ", n: "ν", x: "ξ", o: "ο", p: "π", r: "ρ", s: "σ",
  t: "τ", y: "υ", u: "υ", f: "φ", w: "ω", c: "σ", j: "ξ",
};

export const TABEL: Record<string, Tabel> = {
  ru: RU, uk: UK, bg: BG, sr: RU, mk: RU, el: EL,
};

/** Huruf terpanjang yang perlu ditunggu sebelum memutuskan — dihitung, bukan
 *  ditulis tangan, supaya menambah kunci baru tak perlu ingat memperbarui angka. */
export function panjangKunciMaks(t: Tabel): number {
  return Object.keys(t).reduce((m, k) => Math.max(m, k.length), 1);
}
