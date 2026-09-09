// =============================================================================
// [harga-keranjang-kelas-v1] Identitas pendaftar di checkout keranjang.
// Dipakai bersama oleh keranjang Persiapan Ujian (/persiapan-tes) dan keranjang
// Kelas Private/Semi (/harga) — kunci localStorage-nya sengaja SATU supaya
// orang yang sudah mengisi di satu halaman tidak mengetik ulang di halaman lain.
// Kunci lama `linguo_testprep_ident_v1` dipertahankan biar data pengunjung
// lama tidak hilang.
// =============================================================================

export interface CartIdentity { name: string; email: string; wa: string }

const IDENT_KEY = "linguo_testprep_ident_v1";

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
