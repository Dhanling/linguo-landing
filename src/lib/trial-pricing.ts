// =============================================================================
// trial-pricing.ts
// [linguo-patch:trial-class-v1]
// Pricing logic untuk Fitur Trial Class. Dipakai di form /kelas-trial (display
// harga live) DAN di route /api/create-trial-invoice (hitung ulang server-side
// — jangan pernah percaya amount dari client).
//
// Trial = 1 sesi berbayar.
//
// [linguo-patch:trial-level-price-v1] Harga trial Private IKUT LEVEL yang dipilih
// siswa (English B1 60 menit = 120rb, bukan 100rb). Sebelumnya form web memaksa
// kolom A1 dengan alasan "trial terjadi sebelum placement test" — akibatnya siswa
// intermediate yang daftar sendiri di website ditagih tarif A1, beda dari quote
// admin di WA (buildTrialQuote di dashboard sudah level-aware sejak awal).
// =============================================================================

/** Bahasa -> kategori harga. Sumber: pricelist Private (getAutoPrice dashboard). */
export const PRICE_CATEGORIES: Record<string, string[]> = {
  A: [
    "Swahili", "Greek", "Hindi", "Turkish", "Norwegian", "Tagalog",
    "Vietnamese", "Swedish", "Urdu", "Kurdish", "Hebrew", "Polish",
    "Portuguese", "Finnish", "Czech", "Traditional Chinese", "Cantonese", "Hungarian",
    "Esperanto", "Farsi", "English British", "Romanian", "Khmer", "Danish",
    "Uzbek", "Serbian", "Estonian", "Latin", "Ancient Egyptian", "Georgian",
    "Irish",
    // linguo-patch:private-pricing-v1 — nama bahasa di funnel landing tidak
    // 100% sama dgn pricelist: "Persian" (= Farsi, sudah ada di atas) dan
    // "Bengali" sebelumnya tidak ketemu kategori → harga jatuh ke fallback.
    // Bengali diasumsikan kategori A (setara Hindi/Urdu) — koreksi bila salah.
    "Persian", "Bengali",
    // Melayu = bahasa asing (Malaysia/Brunei/Singapura), bukan bahasa daerah
    // Nusantara → kategori A, bukan D.
    "Malay",
  ],
  B: ["Russian", "Dutch", "Italian", "Spanish", "Thai", "Sign Language"],
  C: ["Arabic", "English", "Japanese", "German", "Korean", "Mandarin", "French"],
  D: [
    "Javanese", "Sundanese", "Betawi", "Madurese", "Batak", "Banjar", "Balinese",
    "Bugis",
  ],
  E: ["BIPA"],
};

/** Harga per sesi 60 menit, level A1/Basic, per kategori. */
export const PRICE_A1_60MIN: Record<string, number> = {
  A: 120000,
  B: 110000,
  C: 100000,
  D: 90000,
  E: 150000,
};

// =============================================================================
// linguo-patch:funnel-private-level-price-v1
// Harga Kelas Private per sesi 60 menit BERBEDA per level (bukan flat A1).
// SUMBER KEBENARAN = admin Registrations.tsx PRICE_TABLE — angka HARUS identik
// biar tagihan funnel = pricelist resmi. Bug lama: funnel abai level → semua
// level ditagih harga A1 (mis. Portuguese A2 harusnya 130rb, ketagih 120rb).
// Index = tier dari getPrivateLevelTier(): [A1, A2, B1/B2, C1/C2]. Kategori C
// (English dkk) punya 5 tier (B1 & B2 dipisah, increment 10rb).
// =============================================================================
export const PRICE_PRIVATE_60MIN: Record<string, number[]> = {
  A: [120000, 130000, 140000, 150000],
  B: [110000, 120000, 130000, 140000],
  C: [100000, 110000, 120000, 130000, 140000], // 5-tier: A1,A2,B1,B2,C1/C2
  D: [90000, 95000, 100000, 110000],
  E: [150000, 160000, 170000, 180000],
};

/**
 * Level (string) -> tier index untuk PRICE_PRIVATE_60MIN. Category-aware: cat C
 * memisah B1 (tier 2) & B2 (tier 3). Mirror admin getLevelTier(level, category).
 */
export function getPrivateLevelTier(level: string, category?: string): number {
  const l = (level || "A1").toUpperCase().replace(/\.\d+$/, "");
  if (category === "C") {
    if (l === "A1") return 0;
    if (l === "A2") return 1;
    if (l === "B1") return 2;
    if (l === "B2") return 3;
    if (l === "C1" || l === "C2") return 4;
    return 0;
  }
  if (l === "A1") return 0;
  if (l === "A2") return 1;
  if (l === "B1" || l === "B2") return 2;
  if (l === "C1" || l === "C2") return 3;
  return 0;
}

/**
 * Harga Private per sesi 60 menit sesuai kategori bahasa + level.
 * Fallback kategori "C" bila bahasa belum dikategorikan (JANGAN ke D — itu bug lama).
 */
export function getPrivateBase60(language: string, level: string): number {
  const cat = getLanguageCategory(language) || "C";
  const tier = getPrivateLevelTier(level || "A1", cat);
  return PRICE_PRIVATE_60MIN[cat][tier];
}

// =============================================================================
// linguo-patch:native-pricing-v1
// SUMBER TUNGGAL aturan pengajar native. Sebelum ini konstanta 2× dicopy-paste
// di page.tsx, FunnelModal.tsx & create-funnel-invoice, dan Kids/Trial tidak
// punya opsi native sama sekali (padahal tarifnya sama saja: 2× tarif lokal).
// Mirror di /harga (NATIVE_MULTIPLIER) & admin dashboard (Registrations.tsx +
// quickReplyData.ts) — kalau angka di sini berubah, samakan di sana.
// =============================================================================

/** Native speaker = 2× tarif pengajar lokal. Berlaku untuk Private DAN Kids. */
export const NATIVE_MULTIPLIER = 2;

/** Bahasa yang native teacher-nya sudah tersedia. Sisanya "coming soon". */
export const NATIVE_AVAILABLE_LANGS = ["English", "Tagalog", "Spanish", "Arabic"];

export type TeacherType = "lokal" | "native";

export function isNativeAvailable(language: string): boolean {
  return NATIVE_AVAILABLE_LANGS.includes(language);
}

/**
 * Terapkan markup native ke harga per sesi yang SUDAH final untuk pengajar lokal
 * (sudah di-scale durasi / dibulatkan). Dipanggil paling akhir supaya klaim
 * "native = 2× tarif lokal" benar-benar persis 2×. Dibulatkan ke ribuan terdekat
 * biar seragam dengan kalkulator /harga.
 */
export function applyNativeMultiplier(
  perSessionLocal: number,
  teacherType?: string | null
): number {
  if (teacherType !== "native") return perSessionLocal;
  return Math.round((perSessionLocal * NATIVE_MULTIPLIER) / 1000) * 1000;
}

// =============================================================================
// linguo-patch:kids-lang-pricing-v1
// Harga Kids BUKAN flat — ikut KATEGORI BAHASA (A–E) + level, persis seperti
// kelas dewasa. SUMBER KEBENARAN = admin Registrations.tsx (KIDS_PRICE_LL /
// KIDS_PRICE_YE + getKidsPerSessionPrice). Bug lama: landing & semua knowledge
// AI mengutip 75rb/85rb untuk SEMUA bahasa — padahal itu cuma kolom kategori C
// level A1. Akibatnya Belanda (kat. B) Young Explorer ditagih 85rb, harusnya
// 95rb (selisih 10rb per sesi × 16 sesi = 160rb kurang bayar).
// Index array = [A1, A2, B1, B2]. Key = kategori bahasa dari PRICE_CATEGORIES.
// =============================================================================

/** Level yang di-index tabel Kids di bawah. Kids default A1 (tidak pakai placement). */
export const KIDS_PRICE_LEVELS = ["A1", "A2", "B1", "B2"];

/** Little Learner (5–8 th, 30 mnt) — per anak/sesi, pengajar LOKAL. */
export const KIDS_PRICE_LL: Record<string, number[]> = {
  A: [ 90000, 100000, 110000, 120000],
  B: [ 80000,  90000, 100000, 110000],
  C: [ 75000,  85000,  95000, 105000],
  D: [ 70000,  80000,  90000, 100000],
  E: [110000, 120000, 130000, 140000],
};

/** Young Explorer (9–12 th, 45 mnt) — per anak/sesi, pengajar LOKAL. */
export const KIDS_PRICE_YE: Record<string, number[]> = {
  A: [100000, 110000, 120000, 130000],
  B: [ 95000, 105000, 115000, 125000],
  C: [ 85000,  95000, 105000, 115000],
  D: [ 75000,  85000,  95000, 105000],
  E: [130000, 140000, 150000, 160000],
};

/**
 * Tarif dasar Kids per sesi (durasi baku tier, pengajar lokal) sesuai kategori
 * bahasa + level. Bahasa tak dikenal → fallback kategori "C" (sama seperti
 * getPrivateBase60 — JANGAN ke D, itu bug lama yang bikin harga kemurahan).
 */
export function getKidsBasePerSession(
  kidsKey: string,
  language?: string | null,
  level?: string | null
): number {
  const table = kidsKey === "young-explorer" ? KIDS_PRICE_YE : kidsKey === "little-learner" ? KIDS_PRICE_LL : null;
  if (!table) return 0;
  const cat = (language ? getLanguageCategory(language) : null) || "C";
  const lvl = (level || "A1").toUpperCase().replace(/\.\d+$/, "");
  const idx = KIDS_PRICE_LEVELS.indexOf(lvl);
  return table[cat][idx < 0 ? 0 : idx];
}

/**
 * Kids: harga "mulai dari" per tipe = kategori C (English dkk) level A1.
 * HANYA untuk label etalase ("Mulai Rp 75.000/sesi"). Untuk tagihan WAJIB
 * pakai getKidsBasePerSession()/computeKidsPerSession() yang sadar bahasa.
 */
export const KIDS_PRICE: Record<string, number> = {
  "little-learner": KIDS_PRICE_LL.C[0],
  "young-explorer": KIDS_PRICE_YE.C[0],
};

/** Kids: durasi per tipe (fixed by tipe, bukan pilihan bebas). */
export const KIDS_DURATION: Record<string, number> = {
  "little-learner": 30,
  "young-explorer": 45,
};

/** Nama level Kids di funnel → key KIDS_PRICE/KIDS_DURATION. */
export const KIDS_LEVEL_KEY: Record<string, string> = {
  "Little Learner": "little-learner",
  "Young Explorer": "young-explorer",
};

/**
 * Harga Kids per sesi. Tarif dasar per tipe usia IKUT KATEGORI BAHASA + level
 * (kids-lang-pricing-v1), di-scale proporsional ke durasi lalu dibulatkan ke 5rb
 * (pengajar lokal), baru dikali markup native kalau perlu.
 * Formula WAJIB identik di FunnelModal, page.tsx & /api/create-funnel-invoice.
 */
export function computeKidsPerSession(
  kidsKey: string,
  duration: number,
  teacherType?: string | null,
  language?: string | null,
  level?: string | null
): number {
  const base = getKidsBasePerSession(kidsKey, language, level);
  const baseDur = KIDS_DURATION[kidsKey];
  if (!base || !baseDur) return 0;
  const local = Math.round(((base / baseDur) * duration) / 5000) * 5000;
  return applyNativeMultiplier(local, teacherType);
}

/** Pilihan durasi (menit) untuk trial Private. */
export const TRIAL_DURATIONS: number[] = [30, 45, 60, 75, 90];

// =============================================================================
// linguo-patch:trial-level-price-v1
// Pilihan level untuk trial Private. Empat level pertama identik dengan picker
// level funnel (FunnelModal/page.tsx); C1 ditambah karena PRICE_PRIVATE_60MIN
// kategori C memang punya tier ke-5 — tanpa itu siswa advanced ketagih tarif B2.
// =============================================================================
export const TRIAL_LEVELS: { id: string; label: string; desc: string }[] = [
  { id: "A1", label: "A1 — Basic", desc: "Pemula, mulai dari nol" },
  { id: "A2", label: "A2 — Elementary", desc: "Percakapan sederhana" },
  { id: "B1", label: "B1 — Intermediate", desc: "Percakapan sehari-hari" },
  { id: "B2", label: "B2 — Upper Intermediate", desc: "Lancar & topik kompleks" },
  { id: "C1", label: "C1 — Advanced", desc: "Nyaris seperti penutur asli" },
];

/** ID level yang sah dikirim client (dipakai validasi server-side). */
export const TRIAL_LEVEL_IDS: string[] = TRIAL_LEVELS.map((l) => l.id);

/** Daftar bahasa yang bisa dihitung harganya (gabungan semua kategori), urut A-Z. */
export const TRIAL_LANGUAGES: string[] = Object.values(PRICE_CATEGORIES)
  .reduce<string[]>((acc, arr) => acc.concat(arr), [])
  .sort((a, b) => a.localeCompare(b));

/** Cari kategori harga sebuah bahasa. null kalau tidak ada di pricelist. */
export function getLanguageCategory(language: string): string | null {
  const found = Object.keys(PRICE_CATEGORIES).find((k) =>
    PRICE_CATEGORIES[k].includes(language)
  );
  return found || null;
}

/**
 * Harga trial Private = tarif per sesi 60 menit kategori bahasa PADA LEVEL yang
 * dipilih siswa (trial-level-price-v1), di-scale proporsional ke durasi.
 * Return null kalau bahasa tidak ada di pricelist. Level kosong → A1 (perilaku lama).
 */
export function computePrivateTrialPrice(
  language: string,
  durationMinutes: number,
  teacherType?: string | null,
  level?: string | null
): number | null {
  const cat = getLanguageCategory(language);
  if (!cat) return null;
  const base60 = PRICE_PRIVATE_60MIN[cat][getPrivateLevelTier(level || "A1", cat)];
  const dur = Number(durationMinutes) || 60;
  const local = Math.round((base60 * dur) / 60);
  return applyNativeMultiplier(local, teacherType);
}

/**
 * Harga trial Kids = tarif per sesi tier usia pada KATEGORI BAHASA siswa
 * (kids-lang-pricing-v1; native = 2×). Return null kalau tipe tidak dikenal.
 */
export function computeKidsTrialPrice(
  kidsType: string,
  teacherType?: string | null,
  language?: string | null,
  level?: string | null
): number | null {
  const p = getKidsBasePerSession(kidsType, language, level);
  return p > 0 ? applyNativeMultiplier(p, teacherType) : null;
}

// =============================================================================
// linguo-patch:semi-private-pricing-v1
// Pricing Semi Private (grup kecil 2–10 orang). Sumber kebenaran =
// SEMI_PRIVATE_PRICE_BASIC dari admin Registrations.tsx. Index [cat][classSize-1]
// (index 0 = 1 siswa, index 1 = 2 siswa, ... index 9 = 10 siswa). Angka =
// TOTAL GRUP per sesi 60 menit, level BASIC. Kategori bahasa reuse
// getLanguageCategory() di atas (huruf A–E identik dgn PRICE_CATEGORIES admin).
// =============================================================================

/** Total grup per sesi 60mnt, level BASIC, per kategori. index = classSize - 1. */
export const SEMI_PRIVATE_PRICE_BASIC: Record<string, number[]> = {
  A: [120000, 210000, 291000, 340000, 375000, 402000, 420000, 432000, 441000, 450000],
  B: [110000, 190000, 260000, 300000, 325000, 342000, 350000, 352000, 351000, 350000],
  C: [100000, 160000, 230000, 260000, 275000, 282000, 280000, 272000, 261000, 250000],
  D: [ 90000, 150000, 200000, 220000, 225000, 222000, 210000, 192000, 171000, 150000],
  E: [150000, 270000, 381000, 460000, 525000, 582000, 630000, 672000, 711000, 750000],
};

/** Multiplier level: A1 / A2 / B1-B2 / C1-C2. */
export const LEVEL_MULTIPLIER: number[] = [1.0, 1.15, 1.3, 1.45];

/** Level (string) -> tier index untuk LEVEL_MULTIPLIER. A1->0, A2->1, B1|B2->2, C1|C2->3. */
export function getLevelTier(level: string): number {
  const l = (level || "A1").toUpperCase();
  if (l.startsWith("A1")) return 0;
  if (l.startsWith("A2")) return 1;
  if (l.startsWith("B1") || l.startsWith("B2")) return 2;
  if (l.startsWith("C1") || l.startsWith("C2")) return 3;
  return 0;
}

export interface SemiPrivatePrice {
  totalGroup: number;
  perStudent: number;
}

/**
 * Harga Semi Private per sesi. classSize 2–10. duration default 60 menit.
 * Return {0,0} kalau invalid / bahasa tak dikenal.
 */
export function getSemiPrivatePrice(
  language: string,
  level: string,
  classSize: number,
  duration: number = 60
): SemiPrivatePrice {
  if (!language || classSize < 2 || classSize > 10) return { totalGroup: 0, perStudent: 0 };
  const cat = getLanguageCategory(language);
  if (!cat || !SEMI_PRIVATE_PRICE_BASIC[cat]) return { totalGroup: 0, perStudent: 0 };
  const tier = getLevelTier(level || "A1");
  const baseTotal60 = SEMI_PRIVATE_PRICE_BASIC[cat][classSize - 1];
  const adjusted60 = baseTotal60 * LEVEL_MULTIPLIER[tier];
  const dur = Number(duration) || 60;
  const totalGroup = Math.round((adjusted60 * dur) / 60);
  const perStudent = Math.round(totalGroup / classSize);
  return { totalGroup, perStudent };
}

// =============================================================================
// linguo-patch:offline-private-class-v1
// Kelas OFFLINE = pengajar datang ke tempat siswa. Tersedia untuk Kelas Private
// & Semi Private, tarifnya = tarif online + selisih tetap PER SESI. Angka ini
// SUMBER TUNGGAL: dipakai funnel inline (page.tsx), komponen FunnelModal, dan
// /api/create-funnel-invoice yang menghitung ulang total server-side.
// Ketersediaan pengajar TIDAK dijamin di checkout — tergantung daerah siswa,
// makanya kota/area siswa ikut disimpan (leads.class_city) buat dicek admin.
// =============================================================================
export const OFFLINE_SURCHARGE_PER_SESSION = 50000;

/** Mode kelas yang sah dikirim client. */
export type ClassMode = "online" | "offline";

export function normalizeClassMode(mode: unknown): ClassMode {
  return mode === "offline" ? "offline" : "online";
}

/** Tarif per sesi setelah selisih offline. Online → tarif apa adanya. */
export function applyOfflineSurcharge(
  perSession: number,
  mode?: string | null
): number {
  return normalizeClassMode(mode) === "offline"
    ? perSession + OFFLINE_SURCHARGE_PER_SESSION
    : perSession;
}

/** Program yang boleh dipesan offline (Kids & kelas grup tetap online). */
export const OFFLINE_PROGRAMS = ["Kelas Private", "Semi Private"];
export function supportsOffline(program: string): boolean {
  return OFFLINE_PROGRAMS.includes(program);
}

/** Format angka -> "Rp 100.000" */
export function formatRupiah(n: number): string {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}
