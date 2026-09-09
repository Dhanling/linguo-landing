// =============================================================================
// [harga-keranjang-kelas-v1] Keranjang kalkulator /harga: beberapa paket kelas
// (mis. Korean A1 private 16 sesi + Japanese A2 semi-private grup 3) dibayar
// lewat SATU invoice Xendit.
//
// Harga TIDAK dihitung ulang dengan rumus baru: semuanya memanggil helper yang
// sama dengan funnel /daftar & /api/create-funnel-invoice (getPrivateBase60,
// applyNativeMultiplier, getSemiPrivatePrice) supaya angka di kartu = angka
// yang ditagih. Bagian localStorage dipagari `typeof window` biar modul ini
// aman dipakai server (route checkout menghitung ulang total di sini).
// =============================================================================

import {
  getPrivateBase60,
  applyNativeMultiplier,
  getSemiPrivatePrice,
  getLanguageCategory,
  isNativeAvailable,
  offersTeacherTypeChoice,
  TRIAL_LANGUAGES,
  TRIAL_LEVEL_IDS,
  SEMI_PRIVATE_MIN,
  SEMI_PRIVATE_MAX,
  type TeacherType,
} from "./trial-pricing";

export type KelasType = "private" | "semi";

/** Menit per sesi di kalkulator /harga. Durasi lain (30/45) dilayani CS manual. */
export const SESSION_MINUTES = 60;

/** Batas jumlah sesi yang boleh dikirim client (stepper di /harga 1..200). */
export const SESSIONS_MIN = 1;
export const SESSIONS_MAX = 200;

/** Batas wajar: satu orang tidak mendaftar 10 kelas sekaligus. */
export const CART_MAX_ITEMS = 6;

export interface KelasCartItem {
  /** Nama bahasa versi PRICELIST (harus dikenal getLanguageCategory). */
  language: string;
  level: string;
  sessions: number;
  classType: KelasType;
  /** Hanya berarti untuk semi (2–10); private selalu 1. */
  classSize: number;
  /** Hanya berarti untuk private; semi tidak menawarkan native. */
  teacherType: TeacherType;
}

export interface KelasQuote {
  perSession: number;
  amount: number;
  sessions: number;
  program: string;
  description: string;
}

/** Kunci identitas item — dua item berkunci sama = item yang sama (diganti). */
export function cartItemKey(it: KelasCartItem): string {
  return [
    it.language, it.level, it.classType,
    it.classType === "semi" ? it.classSize : 1,
    it.classType === "private" ? it.teacherType : "lokal",
    it.sessions,
  ].join("|");
}

/** Normalisasi + validasi satu item. null = kombinasi tidak sah. */
export function normalizeKelasItem(raw: unknown): KelasCartItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const language = typeof r.language === "string" ? r.language.trim() : "";
  // Whitelist = pricelist itu sendiri. Bahasa di luar daftar tidak punya
  // kategori harga, jadi tak boleh masuk keranjang (anti-tamper).
  if (!language || !TRIAL_LANGUAGES.includes(language) || !getLanguageCategory(language)) return null;

  const level = typeof r.level === "string" && TRIAL_LEVEL_IDS.includes(r.level.toUpperCase())
    ? r.level.toUpperCase()
    : "A1";

  const n = Math.round(Number(r.sessions));
  if (!Number.isFinite(n) || n < SESSIONS_MIN || n > SESSIONS_MAX) return null;

  const classType: KelasType = r.classType === "semi" ? "semi" : "private";

  let classSize = 1;
  if (classType === "semi") {
    const s = Math.round(Number(r.classSize));
    if (!Number.isFinite(s) || s < SEMI_PRIVATE_MIN || s > SEMI_PRIVATE_MAX) return null;
    classSize = s;
  }

  // Native cuma sah untuk private, bahasa yang menawarkan pilihan pengajar,
  // dan yang native-nya memang sudah tersedia. Sisanya dipaksa lokal —
  // kalau tidak, tagihan bisa 2× untuk pengajar yang tak pernah ada.
  const teacherType: TeacherType =
    classType === "private" && r.teacherType === "native" &&
    offersTeacherTypeChoice(language) && isNativeAvailable(language)
      ? "native"
      : "lokal";

  return { language, level, sessions: n, classType, classSize, teacherType };
}

/** Harga satu item. null = kombinasi tak berharga (bahasa/grup tak dikenal). */
export function quoteKelasItem(it: KelasCartItem): KelasQuote | null {
  if (it.classType === "semi") {
    const { perStudent } = getSemiPrivatePrice(it.language, it.level, it.classSize, SESSION_MINUTES);
    if (perStudent <= 0) return null;
    return {
      perSession: perStudent,
      amount: perStudent * it.sessions,
      sessions: it.sessions,
      program: "Semi Private",
      description:
        `Semi Private ${it.language} — Level ${it.level} — ${it.sessions} sesi @${SESSION_MINUTES} menit ` +
        `(grup ${it.classSize} orang, harga/orang)`,
    };
  }
  const perSession = applyNativeMultiplier(getPrivateBase60(it.language, it.level), it.teacherType);
  if (perSession <= 0) return null;
  return {
    perSession,
    amount: perSession * it.sessions,
    sessions: it.sessions,
    program: "Kelas Private",
    description:
      `Kelas Private ${it.language} — Level ${it.level} — ${it.sessions} sesi @${SESSION_MINUTES} menit` +
      (it.teacherType === "native" ? " (pengajar native)" : ""),
  };
}

export function cartTotal(items: KelasCartItem[]): number {
  return items.reduce((s, it) => s + (quoteKelasItem(it)?.amount ?? 0), 0);
}

// ── localStorage (client saja) ───────────────────────────────────────────────
const CART_KEY = "linguo_kelas_cart_v1";

export function loadCart(): KelasCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const arr = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    if (!Array.isArray(arr)) return [];
    const seen = new Set<string>();
    const out: KelasCartItem[] = [];
    for (const raw of arr) {
      const it = normalizeKelasItem(raw);
      if (!it) continue;
      const k = cartItemKey(it);
      if (seen.has(k)) continue;
      seen.add(k); out.push(it);
    }
    return out.slice(0, CART_MAX_ITEMS);
  } catch { return []; }
}

export function saveCart(items: KelasCartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    if (!items.length) localStorage.removeItem(CART_KEY);
    else localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch { /* penyimpanan penuh / private mode — abaikan */ }
}

export { loadIdentity, saveIdentity, type CartIdentity } from "./checkoutIdentity";
