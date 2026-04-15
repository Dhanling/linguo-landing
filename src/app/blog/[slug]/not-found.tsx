import Link from "next/link";
export default function NotFound() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Artikel Tidak Ditemukan</h2>
        <p className="text-gray-500 mb-6">Artikel belum dipublikasikan.</p>
        <Link href="/blog" className="inline-block bg-teal-600 text-white font-semibold px-6 py-2.5 rounded-full hover:bg-teal-700">Lihat Semua Artikel</Link>
      </div>
    </main>
  );
}