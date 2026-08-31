"use client";

/* [toko-produk-compact-v1] Deskripsi produk yang dilipat.
 *
 * Deskripsi Lingbook panjangnya 60-80 kata — di kolom kanan itu sembilan baris,
 * dan sembilan baris itulah yang mendorong harga, tombol beli, dan tombol
 * "Baca Gratis Unit 1" ke bawah lipatan layar. Yang paling menentukan keputusan
 * beli justru yang terdorong turun.
 *
 * Jadi teksnya dipangkas TAMPILANNYA saja (line-clamp), bukan isinya: seluruh
 * kalimat tetap ada di DOM — mesin pencari membacanya utuh, dan pembaca yang
 * memang ingin detailnya tinggal menekan "Selengkapnya".
 */

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function Deskripsi({ teks }: { teks: string }) {
  const [buka, setBuka] = useState(false);
  /* Deskripsi pendek tak perlu tombol sama sekali — ambangnya kasar (jumlah
     huruf), tapi salah tebak di sini cuma berarti tombol yang tak menyembunyikan
     apa pun, bukan teks yang hilang. */
  const panjang = teks.trim().length > 220;

  return (
    <div className="mb-4">
      <p
        className={`text-[15px] leading-relaxed text-gray-600 ${
          panjang && !buka ? "line-clamp-4" : ""
        }`}
      >
        {teks}
      </p>
      {panjang && !buka && (
        <button
          onClick={() => setBuka(true)}
          className="mt-1 inline-flex items-center gap-1 text-[13px] font-semibold text-teal-700 transition-colors hover:text-teal-800"
        >
          Selengkapnya
          <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
        </button>
      )}
    </div>
  );
}
