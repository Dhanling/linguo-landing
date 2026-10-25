// [edge-auth-gate-v1] Harga pendaftaran kelas baru dari /akun — dipakai wizard
// (tampilan) DAN /api/enroll (nominal yang ditagih), jadi klien tak bisa lagi
// mengirim nominal sendiri. Dipindah apa adanya dari src/app/akun/page.tsx.

// ── akun-private-price-v1: harga Kelas Private by kategori bahasa ──────────
// Mirror src/app/harga/page.tsx PRICE_TABLE (source of truth). Wizard /akun
// ga nangkep level, jadi harga Private default ke tier A1 (idx 0) — konsisten
// sama framing "Mulai Rp..." di homepage.
export const PRIVATE_PRICE_TABLE: Record<string, number[]> = {
  A: [120000, 130000, 140000, 150000],
  B: [110000, 120000, 130000, 140000],
  C: [100000, 110000, 120000, 130000],
  D: [90000, 95000, 100000, 110000],
  E: [150000, 160000, 170000, 180000],
};
export const PRIVATE_LANG_CAT: Record<string, "A" | "B" | "C" | "D" | "E"> = {
  Swahili: "A", Greek: "A", Hindi: "A", Turkish: "A", Norwegian: "A", Tagalog: "A",
  Vietnamese: "A", Swedish: "A", Urdu: "A", Kurdish: "A", Hebrew: "A", Polish: "A",
  Portuguese: "A", Finnish: "A", Czech: "A", "Traditional Chinese": "A", Hungarian: "A",
  Esperanto: "A", Farsi: "A", "English British": "A", Romanian: "A", Khmer: "A",
  Danish: "A", Uzbek: "A", Serbian: "A", Estonian: "A", Latin: "A",
  "Ancient Egyptian": "A", Georgian: "A", Irish: "A", Malay: "A", Bosnian: "A",
  Russian: "B", Dutch: "B", Italian: "B", Spanish: "B", Thai: "B", "Sign Language": "B",
  Arabic: "C", English: "C", Japanese: "C", German: "C", Korean: "C", Mandarin: "C", French: "C",
  Javanese: "D", Sundanese: "D", Madurese: "D", Batak: "D", Banjar: "D",
  // Melayu = bahasa asing (Malaysia/Brunei/Singapura), bukan bahasa daerah → kategori A.
  Balinese: "D", Bugis: "D",
  BIPA: "E",
};
// Resolve nama bahasa ke kategori harga. Ga ketemu → "C" (median).
export const privateCatOf = (lang: string): "A" | "B" | "C" | "D" | "E" => {
  if (!lang) return "C";
  if (PRIVATE_LANG_CAT[lang]) return PRIVATE_LANG_CAT[lang];
  const hit = Object.keys(PRIVATE_LANG_CAT).find(
    (k) =>
      lang.toLowerCase().includes(k.toLowerCase()) ||
      k.toLowerCase().includes(lang.toLowerCase())
  );
  return hit ? PRIVATE_LANG_CAT[hit] : "C";
};
// Harga per sesi Kelas Private = base(60mnt, A1) × (durasi / 60).
export const privatePerSession = (lang: string, durationMin: string | number): number => {
  const base60 = PRIVATE_PRICE_TABLE[privateCatOf(lang)][0];
  const dur = parseInt(String(durationMin), 10) || 60;
  return Math.round((base60 * dur) / 60);
};

export const pricePerSession: Record<string,Record<string,number>> = {
  "Kelas Private": { "30":45000, "45":65000, "60":85000, "75":105000, "90":125000 },
  "Kelas Reguler": { "90":18750 },
  "Kelas Kids": { "30":75000, "45":85000 },
  "English Test Preparation": { "90":18750 },
};

// Reguler & Test Prep: flat price per 2 bulan, bukan per sesi
export const isFixedPriceProgram = (program: string): boolean =>
  program === "Kelas Reguler" || program === "English Test Preparation";
export const flatPrice: Record<string, number> = {
  "Kelas Reguler": 150000,
  "English Test Preparation": 300000,
};

// Total yang ditagih untuk satu pendaftaran: Reguler/Test Prep flat, sisanya
// harga per sesi × jumlah sesi. 0 = produk/durasi tak dikenal.
export function enrollAmount(program: string, lang: string, duration: string | number, sessions: number): number {
  if (isFixedPriceProgram(program)) return flatPrice[program] || 0;
  const perSesi = program === "Kelas Private"
    ? privatePerSession(lang, duration)
    : (pricePerSession[program]?.[String(duration)] || 0);
  return perSesi * Math.max(0, Math.trunc(sessions || 0));
}
