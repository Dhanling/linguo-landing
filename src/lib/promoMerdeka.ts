// [promo-merdeka-v1] Promo Kemerdekaan 17 Agustus — Simulasi TOEFL Rp 45.000.
//
// SUMBER TUNGGAL jendela waktu + harga promo. Dipakai bersama oleh:
//   - api/create-invoice        → harga yang MENGIKAT (uang beneran)
//   - lib/simulasiPakets        → re-export utk UI
//   - /simulasi & /simulasi/paket & SimulasiBeliModal → tampilan
//
// Angka 45.000 diambil dari tahun 1945, BUKAN dari "diskon 45%" — 79.000 turun
// ke 45.000 itu hemat 43%, jadi jangan tulis 45% di copy mana pun.
//
// File ini sengaja TANPA dependensi (tak impor lucide-react seperti
// simulasiPakets) supaya aman diimpor dari route handler tanpa menyeret ikon
// ke bundle server.
//
// Cuma TOEFL yang ikut promo: paket iBT & IELTS masih `soon` di simulasiPakets
// dan belum bisa dibeli — mendiskon yang tak bisa dibeli cuma bikin komplain.

export const PROMO = {
  slug: "merdeka45",
  badge: "Promo Kemerdekaan",
  headline: "Merdeka dari Skor TOEFL Pas-pasan",
  /** Harga promo (Rp). Harga normal tetap di simulasiPakets.PRICE = 79.000. */
  price: 45000,
  /** Produk yang ikut promo. Hanya yang benar-benar bisa dibeli. */
  productKeys: ["simulasi-toefl"] as string[],
  // Zona waktu WIB ditulis EKSPLISIT (+07:00): server Vercel jalan di UTC, jadi
  // tanpa offset ini promo akan buka/tutup 7 jam meleset dari niatnya.
  // Ganti dua baris ini saja kalau mau perpanjang/persingkat periode.
  startsAt: "2026-08-16T00:00:00+07:00",
  endsAt: "2026-08-19T23:59:59+07:00",
  /** Label periode untuk copy di halaman. Sinkronkan manual dgn tanggal di atas. */
  periodLabel: "16–19 Agustus",
};

export const PROMO_START_MS = Date.parse(PROMO.startsAt);
export const PROMO_END_MS = Date.parse(PROMO.endsAt);

// ── Tujuan klik banner & tombol floating ────────────────────────────────────
// Keduanya diarahkan ke inbox WA CS (bukan langsung checkout) atas permintaan.
// Konsekuensinya: setiap pembeli lewat jalur ini butuh dibalas manusia — pastikan
// ada yang jaga WA selama 16–19 Agustus, termasuk tanggal merahnya.
export const PROMO_WA_NUMBER = "6282116859493";

/**
 * Pesan yang sudah terisi di WA supaya CS langsung tahu konteksnya.
 *
 * [promo-lead-form-v1] Nama & email ikut ditulis di pesan — datanya sudah
 * tersimpan lewat /api/promo-lead, tapi CS tetap butuh melihatnya di chat tanpa
 * harus membuka WA Inbox dulu.
 *
 * Emoji bendera sengaja TIDAK dipakai di sini: rangkaian regional-indicator
 * sering tampil jadi kotak "?" di pratinjau tautan wa.me sebagian perangkat.
 */
export const promoWaUrl = (lead?: { name?: string; email?: string }): string => {
  const lines = [
    `Halo Linguo, saya mau klaim ${PROMO.badge} — Simulasi TOEFL Rp ${PROMO.price.toLocaleString("id-ID")}`,
  ];
  if (lead?.name?.trim()) lines.push(`Nama: ${lead.name.trim()}`);
  if (lead?.email?.trim()) lines.push(`Email: ${lead.email.trim()}`);
  return `https://wa.me/${PROMO_WA_NUMBER}?text=${encodeURIComponent(
    lines.length > 1 ? `${lines[0]}\n\n${lines.slice(1).join("\n")}` : lines[0],
  )}`;
};

/** Jendela promo sedang buka? */
export const isPromoActive = (now: number = Date.now()): boolean =>
  now >= PROMO_START_MS && now <= PROMO_END_MS;

/**
 * Harga promo untuk satu produk, atau null kalau tidak berlaku
 * (di luar jendela waktu, atau produknya memang tidak ikut promo).
 */
export const promoAmountFor = (
  productKey: string | null | undefined,
  now: number = Date.now(),
): number | null =>
  productKey && isPromoActive(now) && PROMO.productKeys.includes(productKey)
    ? PROMO.price
    : null;
