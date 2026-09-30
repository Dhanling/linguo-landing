"use client";

// ads-conversion-sync — Fase 1. Menyalakan captureAdAttribution() di tiap
// navigasi. Tidak merender apa-apa.
//
// Dipanggil DUA kali per halaman: sekali langsung (menangkap ?fbclid/?gclid
// sebelum ada yang meng-klik apa pun) dan sekali setelah jeda pendek, karena
// cookie `_fbp` baru ditulis oleh script Pixel — pada tembakan pertama cookie
// itu biasanya belum ada. [third-party-lazy-v1] Pixel sekarang dimuat
// `lazyOnload` (sesudah halaman selesai dimuat), jadi diulang beberapa kali
// sampai ±12 dtk; captureAdAttribution cuma mengisi yang masih kosong.

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { captureAdAttribution } from "@/lib/adAttribution";

const PIXEL_SETTLE_MS = [1800, 5000, 12000];

export default function AdAttributionCapture() {
  const pathname = usePathname();

  useEffect(() => {
    try {
      captureAdAttribution();
    } catch {
      /* pelacakan tidak boleh pernah menjatuhkan halaman */
    }
    const ts = PIXEL_SETTLE_MS.map((ms) =>
      setTimeout(() => {
        try {
          captureAdAttribution();
        } catch {
          /* idem */
        }
      }, ms),
    );
    return () => ts.forEach(clearTimeout);
  }, [pathname]);

  return null;
}
