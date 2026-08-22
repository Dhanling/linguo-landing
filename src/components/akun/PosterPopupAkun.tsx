"use client";

// [poster-popup-akun-v1] Pop-up poster promo di DASHBOARD SISWA — saudara kembar
// PosterPopup di landing, tapi hidup di dalam StudentShell.
//
// Kenapa komponen sendiri, bukan PosterPopup landing dipakai ulang:
//   - PosterPopup justru MELEWATI "/akun" (dashboard sengaja bebas promo waktu itu),
//   - poster & tujuannya beda (di sini siswa sudah login → langsung ke Perpustakaan,
//     bukan ke halaman toko publik),
//   - dan warnanya harus ikut mode gelap dashboard (`lms-dark`).
//
// Aturan mainnya:
//   - Muncul tiap kali halaman DIMUAT (buka dashboard / refresh / tab baru), sama
//     seperti di landing.
//   - Pindah menu di dalam dashboard TIDAK memunculkannya lagi. Di landing itu
//     gratis karena komponennya nempel di layout; di sini StudentShell ikut
//     ter-mount ulang tiap ganti route (/akun → /akun/lingbook → …), jadi
//     penjaganya variabel level-modul: hidup selama satu pemuatan halaman dan
//     hangus begitu di-refresh. Sengaja BUKAN sessionStorage — itu malah bikin
//     refresh ikut sunyi.
//   - Ditunda ~1,2 detik biar dashboard sempat kelihatan dulu.
//   - Halaman immersive (pemutar sesi, reader) tak memasangnya sama sekali —
//     penjagaan itu ada di StudentShell.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";

// Ganti kalau posternya diperbarui.
const POSTER_SRC = "/popup-ebook-101.jpg";
const POSTER_ALT =
  "Seri e-book 101 Linguo — kuasai dasar bahasa dengan audio interaktif, kuis, latihan, dan kosakata. Mulai dari Rp 79.000";

// Siswa sudah login → arahkan ke katalog Perpustakaan di dalam dashboard
// (di situ e-book-nya bisa langsung dibeli), bukan ke toko publik.
const CTA_HREF = "/akun/perpustakaan";
const CTA_LABEL = "Lihat E-Book";

const DELAY_MS = 1200;

/** Penjaga satu-kali-per-pemuatan-halaman. Lihat catatan di kepala berkas. */
let sudahTampil = false;

export default function PosterPopupAkun() {
  const [open, setOpen] = useState(false);
  const [masuk, setMasuk] = useState(false); // pemicu animasi masuk

  useEffect(() => {
    if (sudahTampil) return;
    const id = setTimeout(() => {
      sudahTampil = true;
      setOpen(true);
      requestAnimationFrame(() => setMasuk(true));
    }, DELAY_MS);
    return () => clearTimeout(id);
  }, []);

  const close = useCallback(() => {
    setMasuk(false);
    // Tunggu animasi keluar selesai baru di-unmount.
    setTimeout(() => setOpen(false), 200);
  }, []);

  // Kunci scroll body selama pop-up terbuka.
  useEffect(() => {
    if (typeof document === "undefined" || !open) return;
    const sebelum = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = sebelum; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Promo e-book Linguo"
      onClick={close}
      className={`fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto p-4 backdrop-blur-sm transition-opacity duration-200 ${
        masuk ? "bg-black/70 opacity-100" : "bg-black/0 opacity-0"
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative my-auto w-full max-w-[420px] transition-all duration-300 ease-out ${
          masuk ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-95 opacity-0"
        }`}
      >
        {/* Tombol tutup DI LUAR poster (bukan menimpa) supaya tak menutupi isi
            poster dan tetap kelihatan di poster mana pun. */}
        <button
          type="button"
          onClick={close}
          aria-label="Tutup"
          // Warna ditulis inline, BUKAN lewat kelas Tailwind: aturan mode gelap
          // dashboard (`lms-dark .bg-white`, `.text-slate-*`) menimpa kelas apa pun
          // dengan !important — tombolnya bakal ikut menghitam padahal ia mengambang
          // di atas tirai hitam. Lihat [lms-dark-inline-style-gotcha].
          style={{ background: "#ffffff", color: "#12172B" }}
          className="absolute -right-3 -top-3 z-10 grid h-9 w-9 place-items-center rounded-full shadow-lg ring-1 ring-black/5 transition hover:scale-110"
        >
          <X className="h-5 w-5" />
        </button>

        <Link href={CTA_HREF} onClick={close} className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={POSTER_SRC}
            alt={POSTER_ALT}
            width={1080}
            height={1080}
            className="h-auto w-full rounded-2xl shadow-2xl"
          />
        </Link>

        <Link
          href={CTA_HREF}
          onClick={close}
          style={{ background: "#F2CB05", color: "#12172B" }}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-extrabold shadow-lg transition-transform duration-200 hover:scale-[1.03] sm:text-base"
        >
          {CTA_LABEL} <ArrowRight className="h-4 w-4" />
        </Link>

        <button
          type="button"
          onClick={close}
          className="mx-auto mt-2 block px-3 py-1 text-xs font-semibold text-white/80 underline-offset-2 transition hover:text-white hover:underline"
        >
          Nanti saja
        </button>
      </div>
    </div>
  );
}
