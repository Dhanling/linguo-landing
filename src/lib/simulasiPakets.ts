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
// soon: TOEFL iBT & IELTS (Academic/General) masih under development → ditandai
// "Segera" dan belum bisa dibeli. Hanya TOEFL ITP yang aktif untuk saat ini.
export const PAKET: Paket[] = [
  { productKey: "simulasi-toefl", variant: "itp", testType: "toefl", title: "Simulasi TOEFL ITP", short: "TOEFL ITP", tag: "Format ITP", accent: "#1A9E9E", skills: ["listening", "structure", "reading"], covers: "1x bayar TOEFL: akses ITP & iBT" },
  { productKey: "simulasi-toefl", variant: "ibt", testType: "toefl", title: "Simulasi TOEFL iBT", short: "TOEFL iBT", tag: "Format iBT", accent: "#1A9E9E", skills: ["reading", "listening", "writing", "speaking"], covers: "1x bayar TOEFL: akses ITP & iBT", soon: true },
  { productKey: "simulasi-ielts", variant: "academic", testType: "ielts", title: "Simulasi IELTS Academic", short: "IELTS Academic", tag: "Academic", accent: "#6D5AE6", skills: ["reading", "listening", "writing", "speaking"], covers: "1x bayar IELTS: akses Academic & General", soon: true },
  { productKey: "simulasi-ielts", variant: "general", testType: "ielts", title: "Simulasi IELTS General", short: "IELTS General", tag: "General Training", accent: "#6D5AE6", skills: ["reading", "listening", "writing", "speaking"], covers: "1x bayar IELTS: akses Academic & General", soon: true },
];

// Jenis tes punya minimal 1 paket yang sudah aktif (bukan "soon")?
export const testTypeHasAvailable = (testType: string) =>
  PAKET.some((p) => p.testType === testType && !p.soon);

export const PRICE = 79000;

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
export type FreePromo = { code: string; attemptLimit: number; label: string };
export const FREE_PROMOS: Record<string, FreePromo> = {
  LINGUOHEMAT: { code: "LINGUOHEMAT", attemptLimit: 3, label: "Gratis coba 3x" },
};
export const normalizePromo = (raw: string) => raw.trim().toUpperCase();
export const getFreePromo = (raw: string): FreePromo | null =>
  FREE_PROMOS[normalizePromo(raw)] ?? null;
