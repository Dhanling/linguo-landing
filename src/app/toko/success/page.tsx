import Link from "next/link";
// toko-success-lottie-v1 — ceklis sukses pakai Lottie (lihat ./SuccessCheck).
import SuccessCheck from "./SuccessCheck";

export const metadata = { title: "Pembayaran Berhasil — Linguo.id" };

export default async function SuccessPage({
  searchParams
}: {
  searchParams: Promise<{ purchase_id?: string }>
}) {
  const { purchase_id } = await searchParams;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-sm max-w-lg w-full p-8 text-center">
        <SuccessCheck />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Pembayaran Berhasil!
        </h1>
        <p className="text-gray-600 mb-6">
          Makasih udah belanja di Linguo. Email berisi link akses udah dikirim ke inbox kamu — biasanya nyampe dalam 30 detik.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800 text-left">
          <p className="font-semibold mb-1">📧 Belum dapet email?</p>
          <ul className="list-disc list-inside space-y-1 text-amber-700">
            <li>Tunggu sampai 5 menit (kadang delay)</li>
            <li>Cek folder Spam/Promosi</li>
            <li>Buka <strong>linguo.id/akun</strong> tab "Perpustakaan Saya" — akses produk juga ada di sana</li>
          </ul>
        </div>

        {purchase_id && (
          <p className="text-xs text-gray-400 mb-4">
            Purchase ID: <code className="bg-gray-100 px-2 py-1 rounded">{purchase_id}</code>
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/akun"
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-2xl transition-colors"
          >
            Buka Perpustakaan Saya
          </Link>
          <Link
            href="/toko"
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-2xl transition-colors"
          >
            Lanjut Belanja
          </Link>
        </div>
      </div>
    </div>
  );
}
