"use client";

// [poster-popup-v1] Pop-up poster saat pengunjung baru masuk website (pola yang
// dipakai Ruangguru), bedanya isinya BUKAN form pilih jenjang melainkan poster
// promo Linguo apa adanya + satu tombol aksi.
//
// Aturan mainnya:
//   - Muncul SETIAP kali halaman dimuat ulang (refresh / buka tab baru / masuk
//     dari iklan). Sengaja TANPA gerbang sessionStorage: promonya masih baru
//     dan pemiliknya memang mau poster ini kelihatan tiap kunjungan.
//   - Perpindahan halaman di DALAM situs (klik menu) tidak memunculkannya lagi,
//     karena komponen ini hidup di layout dan tidak ter-mount ulang selama
//     navigasi klien.
//   - Ditunda ~1,2 detik supaya halaman sempat terlihat dulu (dan tidak
//     mengganggu LCP/CLS halaman).
//   - Halaman ber-chrome sendiri & halaman "kerja" (dashboard siswa, laporan,
//     form pendataan, pembayaran, pengerjaan kuis, checkout) dilewati — daftar
//     yang sama dengan PromoTopBar/BatchRegulerTopBar, ditambah alur yang
//     sedang di tengah transaksi.
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, X } from "lucide-react";
import { useOverlayLock } from "@/lib/overlayStore";

// Ganti kalau posternya diperbarui.
const POSTER_SRC = "/popup-reguler-september.jpg";
const POSTER_W = 1200;
const POSTER_H = 982;
const POSTER_ALT =
  "Belajar 60+ bahasa cuma Rp 150.000 untuk 2 bulan / 8x pertemuan — pendaftaran Kelas Reguler batch September dibuka";

// Ke mana poster ini mengarah. Poster mengiklankan Kelas Reguler batch
// terdekat, jadi tujuannya halaman jadwal batch (di situ ada tombol daftarnya).
const CTA_HREF = "/jadwal-kelas-reguler";
const CTA_LABEL = "Lihat Jadwal & Daftar";

const DELAY_MS = 1200;

const EXCLUDED = [
  "/life",          // [life-dashboard-v1] dashboard privat — bebas dari overlay promo
  "/akun",
  "/student",
  "/laporan-b2b",
  "/pendataan",
  "/payment",
  "/kuis",
  "/auth",
  "/onboarding",
  "/pretest",
  "/micro-teaching",
  "/simulasi",
  "/watch",
];

export default function PosterPopup() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [masuk, setMasuk] = useState(false); // pemicu animasi masuk

  const dilewati = EXCLUDED.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (dilewati) return;

    const id = setTimeout(() => {
      setOpen(true);
      requestAnimationFrame(() => setMasuk(true));
    }, DELAY_MS);
    return () => clearTimeout(id);
  }, [dilewati]);

  const close = useCallback(() => {
    setMasuk(false);
    // Tunggu animasi keluar selesai baru di-unmount.
    setTimeout(() => setOpen(false), 200);
  }, []);

  // Kunci scroll body selama pop-up terbuka.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // [ling-hide-fab-overlay-v1] daftarkan overlay global → FAB WhatsApp disembunyikan
  useOverlayLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Promo Linguo"
      onClick={close}
      className={`fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto p-4 backdrop-blur-sm transition-opacity duration-200 ${
        masuk ? "bg-black/60 opacity-100" : "bg-black/0 opacity-0"
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative my-auto w-full max-w-[440px] transition-all duration-300 ease-out ${
          masuk ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-95 opacity-0"
        }`}
      >
        {/* Tombol tutup ditaruh DI LUAR poster (bukan menimpa) supaya tidak
            menutupi logo/teks poster dan tetap terlihat di poster mana pun. */}
        <button
          type="button"
          onClick={close}
          aria-label="Tutup"
          className="absolute -top-3 -right-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white text-slate-700 shadow-lg ring-1 ring-black/5 transition hover:scale-110 hover:text-slate-900"
        >
          <X className="h-5 w-5" />
        </button>

        <Link href={CTA_HREF} onClick={close} className="block">
          <Image
            src={POSTER_SRC}
            alt={POSTER_ALT}
            width={POSTER_W}
            height={POSTER_H}
            sizes="(max-width: 480px) 92vw, 440px"
            className="h-auto w-full rounded-2xl shadow-2xl"
            priority={false}
          />
        </Link>

        <Link
          href={CTA_HREF}
          onClick={close}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[#FFD43B] px-5 py-3 text-sm font-extrabold text-slate-900 shadow-lg transition-transform duration-200 hover:scale-[1.03] sm:text-base"
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
