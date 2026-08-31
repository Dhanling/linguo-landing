"use client";

/* [ebook-pratinjau-publik-v2] "Baca Gratis Unit 1" — popup, TANPA login.
 *
 * Versi pertama tombol ini melempar tamu ke halaman masuk dulu. Salah tempat:
 * orang yang sedang menimbang beli belum punya alasan bikin akun — akunnya baru
 * masuk akal SESUDAH dia melihat isinya bagus. Jadi urutannya dibalik: lihat
 * dulu, akun belakangan (dan akun cuma perlu kalau dia benar-benar membeli).
 *
 * Yang menjaga sisanya bukan gerbang login, tapi berkasnya sendiri:
 * /api/ebook/pratinjau-publik memotong PDF-nya di server dan cuma mengirim
 * halaman Unit 1 — halaman berbayarnya tak pernah sampai ke browser tamu, jadi
 * tak ada yang bisa "dibuka" dari tab Network.
 *
 * Yang membacakannya sekarang EbookReader — reader yang SAMA dengan dashboard
 * siswa, bukan tumpukan canvas gulir seperti versi kemarin. Alasannya bukan
 * kerapian kode, melainkan apa yang sedang dijual: bentangan dua halaman dengan
 * animasi balik ala Issuu, dan ketuk-kata-untuk-mendengar (Chirp 3 HD) plus
 * artinya. Cicipan yang memperlihatkan isi TAPI bukan pengalamannya menjual
 * separuh barang — dan yang separuh itu justru yang membedakan modul ini dari
 * PDF mana pun yang bisa diunduh orang dari internet.
 *
 * Readernya diimpor DINAMIS: bundelnya (pdf.js + latihan + panduan) ratusan KB
 * dan halaman produk ini adalah halaman yang dilihat mesin pencari — ia tak
 * boleh ikut terbawa sampai tombolnya benar-benar ditekan.
 */

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { BookOpen, Loader2 } from "lucide-react";

const EbookReader = dynamic(() => import("@/components/akun/EbookReader"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95">
      <div className="text-center">
        <Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin text-[#3ED9C0]" aria-hidden />
        <p className="text-[13px] font-semibold text-white/60">Menyiapkan pratinjau…</p>
      </div>
    </div>
  ),
});

export default function PratinjauButton({
  slug, title, language,
}: {
  slug: string;
  title: string;
  /** `digital_products.language` — yang menentukan suara TTS waktu kata diketuk. */
  language?: string | null;
}) {
  const [buka, setBuka] = useState(false);

  /* Selama reader terbuka: halaman di belakangnya dikunci (tanpa itu gulir yang
     lolos dari reader ikut menyeret halaman produk), dan gelembung Ling
     disembunyikan — ia melayang di z-index 9990 dan menimpa tombol "Beli
     Sekarang" di kaki reader (aturannya di globals.css). */
  useEffect(() => {
    if (!buka) return;
    const semula = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("ebook-cicip-buka");
    return () => {
      document.body.style.overflow = semula;
      document.body.classList.remove("ebook-cicip-buka");
    };
  }, [buka]);

  /* Tombol beli di kaki reader memakai tombol checkout yang SUDAH ada di
     halaman (CheckoutSection) — bukan menyalin alur invoicenya ke sini. Satu
     alur bayar, satu tempat memperbaikinya kalau berubah.

     Readernya ditutup dulu: ia layar penuh di z-[100], jadi popup checkout yang
     digambar di bawahnya akan tampak seperti tombol yang tak berfungsi. */
  const keCheckout = () => {
    setBuka(false);
    setTimeout(() => {
      const t = document.getElementById("tombol-beli-sekarang") as HTMLButtonElement | null;
      t?.scrollIntoView({ block: "center", behavior: "smooth" });
      t?.click();
    }, 120);
  };

  return (
    <>
      <div className="mt-2.5">
        <button
          onClick={() => setBuka(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-teal-600 bg-white py-3 text-[15px] font-semibold text-teal-700 transition-colors hover:bg-teal-50"
        >
          <BookOpen className="h-5 w-5" strokeWidth={2} aria-hidden />
          Baca Gratis Unit 1
        </button>
        <p className="mt-1.5 text-center text-[11.5px] text-gray-500">
          Coba dulu sebelum beli — Unit 1 terbuka penuh, gratis, tanpa perlu daftar.
        </p>
      </div>

      {buka && (
        <EbookReader
          /* Tamu tak punya baris pembelian; id ini cuma kunci simpanan di dalam
             reader, dan mode cicip memang tak menitipkan jejak apa pun. */
          purchaseId={`pratinjau:${slug}`}
          accessToken=""
          title={title}
          language={language}
          pratinjauUrl={`/api/ebook/pratinjau-publik?slug=${encodeURIComponent(slug)}`}
          onBeli={keCheckout}
          onClose={() => setBuka(false)}
        />
      )}
    </>
  );
}
