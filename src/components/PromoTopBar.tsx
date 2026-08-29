"use client";

// [promo-merdeka-v1] Banner promo paling atas (ala Ruangguru) — tampil di semua
// halaman publik selama jendela promo buka, hilang sendiri setelah lewat.
//
// Bar ini `fixed` di atas segalanya (z-[70] > nav homepage yang z-50). Karena
// fixed = keluar dari alur dokumen, tingginya diumumkan ke CSS lewat variabel
// `--promo-bar-h` supaya:
//   - globals.css bisa mendorong <body> turun (konten tak ketutupan), dan
//   - nav/header yang `fixed`/`sticky top-0` bisa ikut turun sebanyak itu.
// Tingginya diukur dari elemen aslinya (bukan angka hardcode) karena teksnya
// membungkus jadi 2 baris di layar kecil.
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PROMO } from "@/lib/promoMerdeka";
import { openPromoLead } from "@/components/PromoLeadModal";
import { PRICE, formatRp } from "@/lib/simulasiPakets";
import { formatCountdown, usePromoMerdeka } from "@/components/PromoMerdeka";

// Halaman ber-chrome sendiri (dashboard siswa, laporan, form pendataan) sengaja
// dilewati: sudah punya bar sticky sendiri di z-[60] dan bukan halaman jualan.
// [kuis-layar-bersih-v1] /kuis ikut dilewati: halaman pengerjaan soal bukan tempat
// jualan, dan bar promo yang mendorong seluruh halaman turun memakan ruang layar HP
// yang justru dipakai membaca soal.
const EXCLUDED = [
  // [life-dashboard-v1] /life = dashboard privat, tidak boleh kena overlay promo.
  "/life",
  "/akun", "/student", "/laporan-b2b", "/pendataan", "/payment", "/kuis",
];

export default function PromoTopBar() {
  const pathname = usePathname() || "/";
  const { active, remaining } = usePromoMerdeka();
  const ref = useRef<HTMLDivElement | null>(null);

  // `?promo=preview` → paksa bar tampil di luar jendela promo, buat mengecek
  // tata letaknya sebelum hari-H.
  //
  // HANYA TAMPILAN. Harga di checkout tetap dihitung server (api/create-invoice),
  // jadi kalau tautan pratinjau ini dipakai belanja sebelum 17 Agustus, yang
  // ditagih tetap Rp 79.000. Jangan disebar ke calon pembeli.
  //
  // Dibaca lewat window, BUKAN useSearchParams(): hook itu memaksa seluruh
  // halaman statis keluar dari prerender dan menuntut Suspense boundary.
  const [preview, setPreview] = useState(false);
  useEffect(() => {
    setPreview(new URLSearchParams(window.location.search).get("promo") === "preview");
  }, [pathname]);

  const hidden = (!active && !preview) || EXCLUDED.some((p) => pathname.startsWith(p));

  useEffect(() => {
    const root = document.documentElement;
    if (hidden) {
      root.style.setProperty("--promo-bar-h", "0px");
      return;
    }
    const el = ref.current;
    if (!el) return;
    const sync = () => root.style.setProperty("--promo-bar-h", `${el.offsetHeight}px`);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      ro.disconnect();
      // Wajib direset: kalau tidak, halaman berikutnya (mis. /akun) mewarisi
      // padding-top hantu sebesar bar yang sudah tak ada.
      root.style.setProperty("--promo-bar-h", "0px");
    };
  }, [hidden]);

  if (hidden) return null;

  return (
    <div
      ref={ref}
      className="fixed inset-x-0 top-0 z-[70] bg-gradient-to-r from-[#B3121F] via-[#E0353D] to-[#B3121F] text-white shadow-md"
    >
      {/* [promo-lead-form-v1] Klik TIDAK lagi langsung ke wa.me: buka dulu modal
          data diri (nama, nomor WA, email) — sama seperti sticker melayang.
          Tanpa itu CS menerima chat tanpa identitas & tanpa email, padahal akses
          simulasi dikirim lewat email. */}
      <button
        type="button"
        onClick={openPromoLead}
        className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-[13px] font-semibold sm:text-sm"
      >
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden>🇮🇩</span>
          <span className="font-extrabold uppercase tracking-wide">{PROMO.badge}</span>
        </span>

        <span className="inline-flex items-center gap-1.5">
          <span className="hidden sm:inline">Simulasi TOEFL</span>
          <span className="text-white/70 line-through">{formatRp(PRICE)}</span>
          <span className="text-base font-extrabold text-[#FFD43B] sm:text-lg">
            {formatRp(PROMO.price)}
          </span>
        </span>

        {/* tabular-nums: tanpa ini lebar angka berubah tiap detik & bar bergoyang */}
        <span className="tabular-nums text-white/90">
          Berakhir <span className="font-bold">{formatCountdown(remaining)}</span>
        </span>

        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#FFD43B] px-3.5 py-1 text-[12px] font-extrabold text-slate-900 sm:text-[13px]">
          Klaim Sekarang <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </button>
    </div>
  );
}
