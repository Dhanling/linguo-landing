import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { KUESIONER_BY_SLUG, ALL_KUESIONERS } from '@/lib/discovery/schema';
import type { PersonaSlug } from '@/lib/discovery/schema';

export const dynamic = 'force-static';

interface PageProps {
  params: Promise<{ persona: string }>;
}

export async function generateStaticParams() {
  return ALL_KUESIONERS.map((k) => ({ persona: k.slug }));
}

export const metadata: Metadata = {
  title: 'Terima kasih — Riset Lingcore',
  robots: { index: false, follow: false },
};

export default async function TerimaKasihPage({ params }: PageProps) {
  const { persona } = await params;
  const kuesioner = KUESIONER_BY_SLUG[persona as PersonaSlug];

  if (!kuesioner) {
    notFound();
  }

  const isSiswa = kuesioner.id === 'siswa';

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50/30 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Decorative blob */}
      <div
        aria-hidden="true"
        className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-teal-200/40 to-emerald-200/40 blur-3xl pointer-events-none"
      />

      <div className="relative max-w-2xl w-full">
        <div className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-12 text-center shadow-xl">
          {/* Check icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl mb-6 shadow-lg shadow-teal-200/50">
            <svg
              className="w-11 h-11 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
            {isSiswa ? 'Makasih banget! 🙌' : 'Terima kasih! 🙌'}
          </h1>
          <p className="text-base text-gray-600 mb-8">
            {isSiswa
              ? 'Jawaban kamu udah kami terima.'
              : 'Jawaban Bapak/Ibu sudah kami terima.'}
          </p>

          {/* Barter callout */}
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl p-5 sm:p-6 mb-6 text-left">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-600 text-white shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-teal-800 uppercase tracking-wide mb-1">
                  Apresiasi untuk Sekolah {isSiswa ? 'Kamu' : 'Anda'}
                </p>
                <p className="text-base font-semibold text-gray-900 leading-snug">
                  Akses gratis Simulasi TOEFL Linguo
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              Akses Simulasi TOEFL Linguo {!isSiswa && '+ Executive Summary Riset Agregat '}akan dikirim dalam{' '}
              <span className="font-semibold">3–7 hari kerja</span>{' '}
              setelah cukup peserta dari sekolah{isSiswa ? 'mu' : ' Anda'} mengisi kuesioner.
              {!isSiswa && ' Kami akan kontak via email/WA yang Anda cantumkan di akhir kuesioner.'}
            </p>
          </div>

          {/* Closing message from schema */}
          <div className="text-left text-sm text-gray-700 whitespace-pre-line leading-relaxed mb-8 px-2 border-l-2 border-teal-200 pl-4 py-1">
            {kuesioner.closing}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Ke linguo.id
            </Link>
            <a
              href="mailto:hello@linguo.id"
              className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-emerald-600 rounded-lg hover:from-teal-700 hover:to-emerald-700 transition-all shadow-sm"
            >
              Kontak Linguo →
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          PT Linguo Edu Indonesia • linguo.id • Discovery Sprint 2026
        </p>
      </div>
    </div>
  );
}
