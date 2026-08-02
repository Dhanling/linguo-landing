"use client";

// ads-conversion-sync — Fase 1. Menyalakan captureAdAttribution() di tiap
// navigasi. Tidak merender apa-apa.
//
// Dipanggil DUA kali per halaman: sekali langsung (menangkap ?fbclid/?gclid
// sebelum ada yang meng-klik apa pun) dan sekali setelah jeda pendek, karena
// cookie `_fbp` baru ditulis oleh script Pixel yang dimuat `afterInteractive` —
// pada tembakan pertama cookie itu biasanya belum ada.

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { captureAdAttribution } from "@/lib/adAttribution";

const PIXEL_SETTLE_MS = 1800;

export default function AdAttributionCapture() {
  const pathname = usePathname();

  useEffect(() => {
    try {
      captureAdAttribution();
    } catch {
      /* pelacakan tidak boleh pernah menjatuhkan halaman */
    }
    const t = setTimeout(() => {
      try {
        captureAdAttribution();
      } catch {
        /* idem */
      }
    }, PIXEL_SETTLE_MS);
    return () => clearTimeout(t);
  }, [pathname]);

  return null;
}
