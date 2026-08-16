"use client";

// [promo-merdeka-v1] Elemen UI promo Kemerdekaan (pita + hitung mundur).
// Sumber jendela waktu & harga: lib/promoMerdeka — jangan hardcode tanggal di sini.
import { useEffect, useState } from "react";
import { PROMO, PROMO_END_MS, isPromoActive } from "@/lib/promoMerdeka";
import { PRICE, formatRp } from "@/lib/simulasiPakets";

/**
 * Status promo untuk komponen KLIEN.
 *
 * `active` sengaja mulai dari false lalu dinyalakan di useEffect: halaman-halaman
 * ini ikut di-prerender saat build — yang bisa terjadi SEBELUM promo buka —
 * sehingga menghitung langsung di render pertama bikin HTML server ≠ HTML klien
 * (hydration mismatch). Efek sampingnya cuma satu frame sebelum promo muncul.
 */
export function usePromoMerdeka() {
  const [active, setActive] = useState(false);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      setActive(isPromoActive(now));
      setRemaining(Math.max(0, PROMO_END_MS - now));
    };
    tick();
    // Detik-detikan supaya hitung mundur jalan DAN promo menutup sendiri kalau
    // halamannya dibiarkan terbuka melewati batas waktu.
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return { active, remaining };
}

/** Harga yang ditampilkan: promo kalau jendelanya buka, kalau tidak harga normal. */
export const displayPrice = (active: boolean) => (active ? PROMO.price : PRICE);

export function formatCountdown(ms: number): string {
  const total = Math.floor(ms / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return d > 0 ? `${d} hari ${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/**
 * Pita promo + hitung mundur. Render null di luar jendela promo, jadi aman
 * dipasang permanen di halaman — tak perlu dicopot setelah 19 Agustus.
 *
 * tone="dark"  → dipasang di atas hero berwarna (teks putih)
 * tone="light" → dipasang di badan halaman putih
 */
export function PromoMerdekaRibbon({ tone = "light" }: { tone?: "dark" | "light" }) {
  const { active, remaining } = usePromoMerdeka();
  if (!active) return null;

  const dark = tone === "dark";
  return (
    <div
      className={`mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-1.5 rounded-2xl px-4 py-2.5 text-sm font-semibold ${
        dark
          ? "bg-white/15 text-white backdrop-blur"
          : "border border-red-200 bg-red-50 text-red-700"
      }`}
    >
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden>🇮🇩</span> {PROMO.badge} · {PROMO.periodLabel}
      </span>
      <span className={dark ? "text-white/60" : "text-red-300"} aria-hidden>
        |
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className={dark ? "text-white/70 line-through" : "text-red-400 line-through"}>
          {formatRp(PRICE)}
        </span>
        <span className="font-extrabold">{formatRp(PROMO.price)}</span>
      </span>
      <span className={dark ? "text-white/60" : "text-red-300"} aria-hidden>
        |
      </span>
      {/* tabular-nums: tanpa ini lebar angka berubah tiap detik dan pitanya goyang */}
      <span className="tabular-nums">Berakhir dalam {formatCountdown(remaining)}</span>
    </div>
  );
}
