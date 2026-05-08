import Link from "next/link";

export const metadata = { title: "Pembayaran Gagal — Linguo.id" };

export default async function FailedPage({
  searchParams
}: {
  searchParams: Promise<{ purchase_id?: string }>
}) {
  const { purchase_id } = await searchParams;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-sm max-w-lg w-full p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-5xl">
          😔
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Pembayaran Belum Berhasil
        </h1>
        <p className="text-gray-600 mb-6">
          Pembayaran kamu belum ke-process. Bisa karena timeout, saldo gak cukup, atau dibatalin. Coba lagi yuk?
        </p>

        {purchase_id && (
          <p className="text-xs text-gray-400 mb-4">
            Reference: <code className="bg-gray-100 px-2 py-1 rounded">{purchase_id}</code>
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/toko"
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-2xl transition-colors"
          >
            Coba Lagi
          </Link>
          <a
            href="https://wa.me/6281234567890?text=Halo%20Linguo,%20saya%20mau%20tanya%20soal%20pembayaran%20yang%20gagal"
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-2xl transition-colors"
          >
            Chat Admin
          </a>
        </div>
      </div>
    </div>
  );
}
