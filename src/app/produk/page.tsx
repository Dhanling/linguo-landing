// [aeo-produk-klaim-basi-v1] Halaman ini dulu berisi landing e-learning lama:
// "Belajar 10+ Bahasa Mulai dari Rp 29.000", paket 1/6/12 bulan Rp 29rb–179rb,
// testimoni karangan, dan badge "Google Review 5.0".
//
// Semua itu SALAH menurut fakta kanonik di src/lib/brand-facts.ts: Linguo
// mengajar 60+ bahasa dan e-learning dijual Rp 79.000/6 bulan. Rutenya sendiri
// sudah lama mati — next.config.ts me-redirect /produk → /toko/paket-elearning
// dengan 308, jadi tidak ada pengunjung yang pernah melihat isi ini. Tapi
// kodenya tetap ikut ter-build dan tetap terbaca siapa pun yang membaca repo
// (termasuk mesin jawaban kalau redirect-nya sekali waktu dicabut), jadi
// angkanya dibuang, bukan ditambal.
//
// Redirect di next.config.ts tetap jadi jalur utama; redirect() di sini cuma
// pagar kalau aturan itu hilang. Jangan hidupkan lagi halaman jualannya —
// halaman e-learning yang benar ada di /toko/paket-elearning, dan e-book di
// /produk/ebook (rute itu MASIH HIDUP, tidak kena redirect).
import { redirect } from "next/navigation";

export default function ProdukPage() {
  redirect("/toko/paket-elearning");
}
