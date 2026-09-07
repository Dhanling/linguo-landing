// [simulasi-paket-shared-v1] Sumber tunggal data paket Simulasi Tes.
// Dipakai bersama oleh halaman /simulasi/paket dan popup "Beli Paket" di
// katalog /akun/simulasi, supaya daftar paket + harga selalu sinkron.
import { BookOpen, Headphones, PenLine, Mic } from "lucide-react";

export type ProductKey = "simulasi-toefl" | "simulasi-ielts";
export type Variant = "itp" | "ibt" | "academic" | "general";
export type SkillKey = "reading" | "listening" | "writing" | "speaking" | "structure";

export const SKILL_META: Record<SkillKey, { icon: typeof BookOpen; label: string }> = {
  reading: { icon: BookOpen, label: "Reading" },
  listening: { icon: Headphones, label: "Listening" },
  writing: { icon: PenLine, label: "Writing" },
  speaking: { icon: Mic, label: "Speaking" },
  structure: { icon: PenLine, label: "Structure" },
};

export type Paket = {
  productKey: ProductKey;
  variant: Variant;
  testType: string;
  title: string;
  short: string;
  tag: string;
  accent: string;
  skills: SkillKey[];
  covers: string; // catatan jujur: 1x bayar mencakup kedua varian
  soon?: boolean; // masih under development → belum bisa dibeli/dikerjakan
};

// 4 varian tes. Entitlement di-grant per test_type (toefl/ielts) oleh webhook,
// jadi sekali bayar TOEFL sudah membuka ITP & iBT — begitu pula IELTS utk
// Academic & General. `variant` cuma dikirim utk pelabelan invoice.
// soon: paket yang soalnya belum terbit (test_simulations.is_published=false)
// → ditandai "Segera" dan belum bisa dibeli. Aktif: TOEFL ITP (Agu 2026) dan
// IELTS Academic (7 Sep 2026, "Simulasi IELTS Academic — Full Test (Paket 1)").
// TOEFL iBT & IELTS General masih disusun. Karena entitlement per test_type,
// pembeli IELTS otomatis ikut dapat General begitu paketnya terbit.
// [simulasi-ielts-open-v1] Cermin manual di admin dashboard:
// src/components/wainbox/quickReplyData.ts (SIM_PAKETS) — samakan flag `soon`.
export const PAKET: Paket[] = [
  { productKey: "simulasi-toefl", variant: "itp", testType: "toefl", title: "Simulasi TOEFL ITP", short: "TOEFL ITP", tag: "Format ITP", accent: "#1A9E9E", skills: ["listening", "structure", "reading"], covers: "1x bayar TOEFL: akses ITP & iBT" },
  { productKey: "simulasi-toefl", variant: "ibt", testType: "toefl", title: "Simulasi TOEFL iBT", short: "TOEFL iBT", tag: "Format iBT", accent: "#1A9E9E", skills: ["reading", "listening", "writing", "speaking"], covers: "1x bayar TOEFL: akses ITP & iBT", soon: true },
  { productKey: "simulasi-ielts", variant: "academic", testType: "ielts", title: "Simulasi IELTS Academic", short: "IELTS Academic", tag: "Academic", accent: "#6D5AE6", skills: ["reading", "listening", "writing", "speaking"], covers: "1x bayar IELTS: akses Academic & General" },
  { productKey: "simulasi-ielts", variant: "general", testType: "ielts", title: "Simulasi IELTS General", short: "IELTS General", tag: "General Training", accent: "#6D5AE6", skills: ["reading", "listening", "writing", "speaking"], covers: "1x bayar IELTS: akses Academic & General", soon: true },
];

// Jenis tes punya minimal 1 paket yang sudah aktif (bukan "soon")?
export const testTypeHasAvailable = (testType: string) =>
  PAKET.some((p) => p.testType === testType && !p.soon);

export const PRICE = 79000;

// ── promo-merdeka-v1 ────────────────────────────────────────────────────────
// Harga promo Kemerdekaan. Jendela waktu & daftar produknya di lib/promoMerdeka
// (file tanpa dependensi supaya aman diimpor server). Selama promo buka, PRICE
// jadi harga CORET dan promoPriceFor() yang dipakai.
export { PROMO, isPromoActive, promoAmountFor } from "./promoMerdeka";
import { promoAmountFor } from "./promoMerdeka";

/** Harga yang benar-benar dibayar untuk satu paket, sudah memperhitungkan promo. */
export const promoPriceFor = (productKey: string, now: number = Date.now()): number =>
  promoAmountFor(productKey, now) ?? PRICE;

export const FEATURES = [
  "Sesuai format tes asli TOEFL & IELTS",
  "Skor & pembahasan langsung keluar",
  "Akses selamanya (sekali bayar)",
];

export const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

// ── promo-code-v1 ────────────────────────────────────────────────────────────
// Kode promo GRATIS: alih-alih bayar, user dapat akses coba beberapa kali.
// `source_external_id` entitlement diprefix "PROMO-" supaya bisa dibedakan dari
// pembelian berbayar (yang unlimited) → cap attempt hanya berlaku utk promo.
// Prefix ini juga dipakai enforcement di simulations.ts (jangan diubah).
export const PROMO_SOURCE_PREFIX = "PROMO-";
// `testType` (opsional) = kode cuma berlaku untuk satu jenis tes. Tanpa itu kode
// bisa dipakai di semua jenis tes yang sudah aktif. Ditegakkan di SERVER
// (api/simulasi/redeem-promo) — UI cuma menyembunyikan tombol klaim.
export type FreePromo = { code: string; attemptLimit: number; label: string; testType?: "toefl" | "ielts" };
export const FREE_PROMOS: Record<string, FreePromo> = {
  LINGUOHEMAT: { code: "LINGUOHEMAT", attemptLimit: 3, label: "Gratis coba 3x" },
  // [simulasi-ielts-open-v1] Kode gratis khusus IELTS (Academic; General ikut
  // begitu terbit) — 3x pengerjaan yang benar-benar dikumpulkan per akun.
  GRATISIELTS: { code: "GRATISIELTS", attemptLimit: 3, label: "Gratis coba 3x Simulasi IELTS", testType: "ielts" },
};
export const normalizePromo = (raw: string) => raw.trim().toUpperCase();
/** Kode gratis yang cocok. `testType` diisi → kode yang dikunci ke jenis tes lain
 *  dianggap tidak berlaku (mis. GRATISIELTS di paket TOEFL). */
export const getFreePromo = (raw: string, testType?: string): FreePromo | null => {
  const promo = FREE_PROMOS[normalizePromo(raw)] ?? null;
  if (!promo) return null;
  if (promo.testType && testType && promo.testType !== testType) return null;
  return promo;
};
