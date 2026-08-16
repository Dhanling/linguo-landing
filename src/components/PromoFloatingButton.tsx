"use client";

// [promo-merdeka-v1] Sticker promo melayang (ala Ruangguru) → inbox WA CS.
//
// Posisinya KIRI-bawah, bukan kanan-bawah: ChatWidget sudah memakai kanan-bawah
// (launcher 64px di right/bottom 20px + gelembung teaser selebar 270px sampai
// bottom 96px). Menaruh sticker di sana akan saling menutupi.
//
// z-index 9985 → di bawah launcher chat (9990) dan panelnya (9998/9999), tapi
// di atas konten halaman biasa.
import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { PROMO, promoWaUrl } from "@/lib/promoMerdeka";
import { usePromoMerdeka } from "@/components/PromoMerdeka";

// Samakan dengan daftar di PromoTopBar — halaman ber-chrome sendiri dilewati.
const EXCLUDED = ["/akun", "/student", "/laporan-b2b", "/pendataan", "/payment"];

const DISMISS_KEY = "linguo_promo_merdeka_dismissed";

export default function PromoFloatingButton() {
  const pathname = usePathname() || "/";
  const { active } = usePromoMerdeka();
  const [preview, setPreview] = useState(false);
  // Sticker menutupi sebagian layar HP. Tanpa tombol tutup, pengunjung yang tak
  // tertarik tidak punya jalan keluar — dismiss disimpan per-tab (sessionStorage)
  // supaya kunjungan berikutnya tetap melihat promonya.
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setPreview(new URLSearchParams(window.location.search).get("promo") === "preview");
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      /* sessionStorage diblokir (mode privat) → anggap belum ditutup */
    }
  }, [pathname]);

  if (dismissed) return null;
  if (!active && !preview) return null;
  if (EXCLUDED.some((p) => pathname.startsWith(p))) return null;

  const close = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* tak apa — cukup hilang untuk sesi ini */
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-[9985] sm:bottom-5 sm:left-5">
      <div className="relative">
        <a
          href={promoWaUrl()}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${PROMO.badge} — Simulasi TOEFL Rp ${PROMO.price.toLocaleString("id-ID")}, tanya lewat WhatsApp`}
          className="block drop-shadow-[0_10px_24px_rgba(0,0,0,0.35)] transition-transform duration-200 hover:scale-105 active:scale-95 motion-safe:animate-[promoFloat_3s_ease-in-out_infinite]"
        >
          <Image
            src="/promo-merdeka-sticker.png"
            alt={`${PROMO.badge} — Simulasi TOEFL Rp ${PROMO.price.toLocaleString("id-ID")}`}
            width={400}
            height={267}
            priority={false}
            className="h-auto w-[132px] sm:w-[168px]"
          />
        </a>

        <button
          type="button"
          onClick={close}
          aria-label="Tutup promo"
          className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-white/70 bg-slate-900/80 text-white shadow-md transition hover:bg-slate-900"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
