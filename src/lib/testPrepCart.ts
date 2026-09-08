// =============================================================================
// [test-prep-keranjang-v1] Keranjang Persiapan Ujian: beberapa paket (JLPT N5
// semi-private + TOPIK I private, dst) dibayar lewat SATU invoice Xendit.
//
// Bagian murni (tipe + penghitungan) dipakai client & server; bagian
// localStorage dipagari `typeof window`. Harga dari klien TIDAK pernah
// dipercaya — server menghitung ulang lewat quoteCartItem() (anti-tamper).
// =============================================================================

import {
  getTestPrepProduct, quoteTestPrep, PRIVATE_SESSION_OPTS, DEFAULT_PRIVATE_SESSIONS,
  type TestPrepFormat, type TestPrepProduct, type TestPrepQuote,
} from "./testPrep";

export interface TestPrepCartItem {
  productId: string;
  format: TestPrepFormat;
  level: string;
  /** Hanya berarti untuk format private; semi selalu paket tetap. */
  sessions: number;
}

/** Kunci identitas item: produk + format + level (+ sesi utk private).
 *  Dua item berkunci sama = item yang sama (diganti, bukan ditumpuk). */
export function cartItemKey(it: TestPrepCartItem): string {
  return `${it.productId}|${it.format}|${it.level}|${it.format === "private" ? it.sessions : 0}`;
}

/** Normalisasi + validasi satu item. null = kombinasi tidak sah. */
export function normalizeCartItem(raw: unknown): TestPrepCartItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const product = getTestPrepProduct(typeof r.productId === "string" ? r.productId : "");
  if (!product) return null;
  const format: TestPrepFormat = r.format === "private" ? "private" : "semi";
  const level = typeof r.level === "string" && product.levels.some((l) => l.id === r.level)
    ? r.level
    : product.levels[0]?.id ?? "";
  const n = Number(r.sessions);
  const sessions = (PRIVATE_SESSION_OPTS as readonly number[]).includes(n) ? n : DEFAULT_PRIVATE_SESSIONS;
  return { productId: product.id, format, level, sessions };
}

export function quoteCartItem(it: TestPrepCartItem): { product: TestPrepProduct; quote: TestPrepQuote } | null {
  const product = getTestPrepProduct(it.productId);
  if (!product) return null;
  const quote = quoteTestPrep(product, it.format, it.level, it.format === "private" ? it.sessions : undefined);
  if (quote.amount <= 0) return null;
  return { product, quote };
}

export function cartTotal(items: TestPrepCartItem[]): number {
  return items.reduce((s, it) => s + (quoteCartItem(it)?.quote.amount ?? 0), 0);
}

/** Batas wajar: satu orang tidak mendaftar 10 kelas sekaligus. */
export const CART_MAX_ITEMS = 6;

// ── localStorage (client saja) ───────────────────────────────────────────────
const CART_KEY = "linguo_testprep_cart_v1";
const IDENT_KEY = "linguo_testprep_ident_v1";

export function loadCart(): TestPrepCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const arr = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    if (!Array.isArray(arr)) return [];
    const seen = new Set<string>();
    const out: TestPrepCartItem[] = [];
    for (const raw of arr) {
      const it = normalizeCartItem(raw);
      if (!it) continue;
      const k = cartItemKey(it);
      if (seen.has(k)) continue;
      seen.add(k); out.push(it);
    }
    return out.slice(0, CART_MAX_ITEMS);
  } catch { return []; }
}

export function saveCart(items: TestPrepCartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    if (!items.length) localStorage.removeItem(CART_KEY);
    else localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch { /* penyimpanan penuh / private mode — abaikan */ }
}

export interface CartIdentity { name: string; email: string; wa: string }

export function loadIdentity(): CartIdentity {
  if (typeof window === "undefined") return { name: "", email: "", wa: "" };
  try {
    const o = JSON.parse(localStorage.getItem(IDENT_KEY) || "{}");
    return {
      name: typeof o?.name === "string" ? o.name : "",
      email: typeof o?.email === "string" ? o.email : "",
      wa: typeof o?.wa === "string" ? o.wa : "",
    };
  } catch { return { name: "", email: "", wa: "" }; }
}

export function saveIdentity(id: CartIdentity): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(IDENT_KEY, JSON.stringify(id)); } catch { /* abaikan */ }
}
