import Link from 'next/link';
import type { Metadata } from 'next';
import { ALL_KUESIONERS, getTotalQuestions } from '@/lib/discovery/schema';

export const metadata: Metadata = {
  title: 'Riset Lingcore for Schools — Linguo',
  description:
    'Riset kebutuhan program bahasa di sekolah Indonesia untuk pengembangan platform LMS Lingcore. Kontribusi Anda sangat berharga.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RisetLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-block px-3 py-1 bg-teal-100 text-teal-800 text-xs font-semibold rounded-full mb-4">
            DISCOVERY SPRINT • LINGCORE FOR SCHOOLS
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Bantu Kami Bikin LMS Bahasa yang Benar-Benar Berguna
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Linguo (linguo.id) sedang mengembangkan{' '}
            <span className="font-semibold text-teal-700">Lingcore for Schools</span>
            {' '}— platform LMS khusus pembelajaran bahasa. Sebelum membangun, kami ingin mendengar
            kondisi nyata di lapangan dari Anda.
          </p>
        </div>

        {/* Why help us */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-10 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Mengapa partisipasi Anda penting?
          </h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex gap-3">
              <span className="text-teal-600 mt-1">✓</span>
              <span>
                Kami sedang riset 10–15 sekolah swasta Jabodetabek untuk memahami pain harian
                pengelolaan program bahasa.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-teal-600 mt-1">✓</span>
              <span>
                Hasil agregat akan kami share kembali (anonim) — bisa dipakai sebagai benchmark
                internal.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-teal-600 mt-1">✓</span>
              <span>
                Sebagai apresiasi, ada insentif voucher per peran (lihat detail di tiap kuesioner).
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-teal-600 mt-1">✓</span>
              <span>Data dijaga ketat. Tidak ada informasi spesifik per sekolah yang dipublikasikan tanpa izin.</span>
            </li>
          </ul>
        </div>

        {/* Persona cards */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Pilih peran Anda:
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {ALL_KUESIONERS.map((k) => {
            const totalQ = getTotalQuestions(k);
            return (
              <Link
                key={k.id}
                href={'/riset/' + k.slug}
                className="group block bg-white rounded-2xl border border-gray-200 p-6 hover:border-teal-500 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="inline-block px-2.5 py-1 bg-teal-50 text-teal-700 text-xs font-medium rounded-md">
                    {k.shortTitle}
                  </div>
                  <span className="text-teal-600 group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2 leading-snug">
                  {k.audienceLabel}
                </h3>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Estimasi waktu</span>
                    <span className="font-medium text-gray-900">{k.estimatedMinutes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Jumlah pertanyaan</span>
                    <span className="font-medium text-gray-900">{totalQ}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Apresiasi:</p>
                  <p className="text-sm text-gray-900 font-medium">{k.voucherAmount}</p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Contact */}
        <div className="mt-12 text-center text-sm text-gray-600">
          <p>
            Pertanyaan?{' '}
            <a href="mailto:dhani@linguo.id" className="text-teal-700 font-medium hover:underline">
              dhani@linguo.id
            </a>
            {' '}— Muhamad Lutfi Ramadhani, Founder
          </p>
        </div>
      </div>
    </div>
  );
}
