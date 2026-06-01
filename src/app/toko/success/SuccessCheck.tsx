"use client";

// toko-success-lottie-v1 — Lottie ceklis sukses buat success page produk digital.
// /toko/success/page.tsx itu SERVER COMPONENT (baca searchParams + export metadata),
// dan next/dynamic ssr:false GA BOLEH di Server Component. Jadi Lottie dipindah ke
// client island kecil ini, lalu di-render sebagai child dari page server.
import dynamic from "next/dynamic";
import successAnim from "../../payment/success/success-anim.json";

// ssr:false — hindari SSR/hydration mismatch di halaman pasca-bayar.
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export default function SuccessCheck() {
  return (
    <div className="w-40 h-40 mx-auto mb-4">
      <Lottie animationData={successAnim} loop={false} />
    </div>
  );
}
