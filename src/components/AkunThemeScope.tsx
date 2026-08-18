"use client";

// [akun-dark-mode-v1] Dashboard siswa (/akun) sebelumnya cuma punya palet terang.
// Di perangkat yang memakai tema gelap, Chrome/Android menyalakan "force dark":
// warnanya dibalik sendiri secara algoritmik, jadi kartu teal berubah abu-abu dan
// label `text-gray-500` nyaris tidak terbaca di atasnya.
//
// Perbaikannya: halaman ini MENYATAKAN dukungan tema gelap sendiri. Kelas
// `akun-dark` dipasang di <html>, lalu globals.css memetakan ulang palet Tailwind
// di dalam cakupan itu saat `prefers-color-scheme: dark`. Karena kita juga
// mengeset `color-scheme`, browser berhenti membalik warna sendiri.
//
// Kelas dipasang lewat <script> inline (bukan cuma useEffect) supaya sudah aktif
// saat HTML pertama dicat — tanpa kedip putih sebelum hidrasi.
//
// PENGECUALIAN: halaman sertifikat & laporan simulasi dicetak jadi PDF (latar
// harus tetap putih), jadi dua rute itu tidak ikut digelapkan.

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Dipakai dua kali: di script inline (sebagai string) & di effect.
const EXCLUDED = ["/akun/simulasi/sertifikat", "/akun/simulasi/laporan"];

const INLINE = `(function(){try{var p=location.pathname;var skip=${JSON.stringify(
  EXCLUDED
)}.some(function(x){return p.indexOf(x)===0});document.documentElement.classList.toggle('akun-dark',!skip)}catch(e){}})()`;

export default function AkunThemeScope() {
  const pathname = usePathname();

  useEffect(() => {
    const skip = EXCLUDED.some((x) => (pathname || "").startsWith(x));
    const root = document.documentElement;
    root.classList.toggle("akun-dark", !skip);
    // Dilepas saat pindah ke halaman publik (landing wajib tetap terang).
    return () => root.classList.remove("akun-dark");
  }, [pathname]);

  return <script dangerouslySetInnerHTML={{ __html: INLINE }} />;
}
