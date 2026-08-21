// [pustaka-keranjang-v1] Keranjang belanja produk digital di Perpustakaan /akun.
//
// Kenapa ada: sebelum ini satu klik "Beli" = satu invoice Xendit = satu kali
// bayar. Siswa yang mau 3 e-book harus melewati tiga halaman pembayaran dan
// membayar tiga kali (tiga biaya admin, tiga kali transfer). Keranjang membuat
// beberapa produk berbagi SATU invoice.
//
// Isinya sengaja cuma di localStorage, TIDAK di database: keranjang bukan
// kepemilikan, tidak bernilai uang, dan tak perlu bertahan lintas perangkat.
// Yang menentukan harga & hak akses tetap server (/api/create-cart-invoice) —
// baris di sini murni catatan "mau beli apa", jadi diutak-atik dari console pun
// tak menghasilkan apa-apa selain daftar belanja yang salah untuk dirinya sendiri.
//
// Kunci penyimpanan dipisah per user id supaya keranjang tidak bocor ke akun
// berikutnya yang login di browser yang sama.

import { useCallback, useSyncExternalStore } from "react";

export interface ItemKeranjang {
  productId: string;
  pricingId: string;
  /** Ditampilkan di popup keranjang — bukan sumber kebenaran harga. */
  title: string;
  type: string;
  price: number;
  tierLabel: string | null;
  durationDays: number | null;
  language: string | null;
  coverUrl: string | null;
}

const PREFIX = "linguo_keranjang_pustaka_";
/** Pagar kewarasan; keranjang sepanjang ini sudah pasti bukan belanja sungguhan. */
const MAKS_ITEM = 20;

const kunci = (userId: string) => `${PREFIX}${userId}`;

/* ---------------- store ---------------- */
// Snapshot di-cache per kunci: useSyncExternalStore membandingkan hasil
// getSnapshot dengan Object.is, jadi mengembalikan array baru hasil JSON.parse
// tiap panggilan bikin React menganggapnya selalu berubah → render tak berhenti.
const snapshot = new Map<string, ItemKeranjang[]>();
const pendengar = new Set<() => void>();
const KOSONG: ItemKeranjang[] = [];

function bacaStorage(userId: string): ItemKeranjang[] {
  if (typeof window === "undefined" || !userId) return KOSONG;
  try {
    const mentah = window.localStorage.getItem(kunci(userId));
    if (!mentah) return KOSONG;
    const isi = JSON.parse(mentah);
    if (!Array.isArray(isi)) return KOSONG;
    return isi.filter(
      (x): x is ItemKeranjang =>
        !!x && typeof x.productId === "string" && typeof x.pricingId === "string",
    );
  } catch {
    // localStorage bisa dimatikan (mode privat Safari) — keranjang kosong jauh
    // lebih baik daripada Perpustakaan yang gagal render.
    return KOSONG;
  }
}

function segarkan(userId: string) {
  snapshot.set(userId, bacaStorage(userId));
  pendengar.forEach((f) => f());
}

function tulis(userId: string, isi: ItemKeranjang[]) {
  if (typeof window === "undefined" || !userId) return;
  try {
    window.localStorage.setItem(kunci(userId), JSON.stringify(isi.slice(0, MAKS_ITEM)));
  } catch {
    /* kuota penuh / storage mati — abaikan, state di memori tetap jalan */
  }
  snapshot.set(userId, isi.slice(0, MAKS_ITEM));
  pendengar.forEach((f) => f());
}

function ambilSnapshot(userId: string): ItemKeranjang[] {
  if (!userId) return KOSONG;
  if (!snapshot.has(userId)) snapshot.set(userId, bacaStorage(userId));
  return snapshot.get(userId) ?? KOSONG;
}

/* ---------------- aksi ---------------- */

/** Satu produk cuma boleh sekali; menambah ulang = mengganti pilihan tier-nya. */
export function tambahKeKeranjang(userId: string, item: ItemKeranjang) {
  const isi = ambilSnapshot(userId);
  const lain = isi.filter((x) => x.productId !== item.productId);
  tulis(userId, [...lain, item]);
}

export function hapusDariKeranjang(userId: string, productId: string) {
  tulis(userId, ambilSnapshot(userId).filter((x) => x.productId !== productId));
}

export function kosongkanKeranjang(userId: string) {
  tulis(userId, []);
}

/**
 * Buang produk yang sudah dimiliki. Dipanggil sesudah pustaka dimuat: kalau
 * pembayaran keranjang sebelumnya sudah lunas, isinya harus rontok sendiri —
 * bukan menyisakan tombol "Bayar" untuk barang yang sudah jadi miliknya.
 */
export function sinkronkanKeranjang(userId: string, idDimiliki: Set<string>) {
  if (!userId) return;
  const isi = ambilSnapshot(userId);
  const sisa = isi.filter((x) => !idDimiliki.has(x.productId));
  if (sisa.length !== isi.length) tulis(userId, sisa);
}

/* ---------------- hook ---------------- */
export function useKeranjang(userId: string) {
  const subscribe = useCallback((cb: () => void) => {
    pendengar.add(cb);
    // Keranjang bisa berubah di tab lain (mis. checkout tuntas di sana).
    const onStorage = (e: StorageEvent) => {
      if (e.key === kunci(userId)) segarkan(userId);
    };
    if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
    return () => {
      pendengar.delete(cb);
      if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
    };
  }, [userId]);

  const items = useSyncExternalStore(
    subscribe,
    () => ambilSnapshot(userId),
    () => KOSONG, // server render: keranjang selalu kosong
  );

  const total = items.reduce((n, x) => n + (Number(x.price) || 0), 0);
  return { items, total };
}
