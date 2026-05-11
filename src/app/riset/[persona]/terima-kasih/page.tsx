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

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 text-center shadow-sm">
          {/* Check icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-100 rounded-full mb-6">
            <svg
              className="w-10 h-10 text-teal-600"
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

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Terima kasih! 🙌
          </h1>
          <p className="text-base text-gray-600 mb-8">
            Jawaban Anda sudah kami terima.
          </p>

          {/* Voucher info */}
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-5 mb-6 text-left">
            <p className="text-sm font-semibold text-teal-800 mb-1">
              🎁 Apresiasi Anda:
            </p>
            <p className="text-base text-gray-900 mb-3">
              {kuesioner.voucherAmount}
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">
              Voucher / Executive Summary akan dikirim dalam{' '}
              <span className="font-medium">3–7 hari kerja</span>{' '}
              ke email/WhatsApp yang Anda cantumkan di akhir kuesioner.
            </p>
          </div>

          {/* Closing message from kuesioner */}
          <div className="text-left text-sm text-gray-700 whitespace-pre-line leading-relaxed mb-8 px-2">
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
              href="mailto:dhani@linguo.id"
              className="px-6 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
            >
              Kontak Dhani →
            </a>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          PT Linguo Edu Indonesia • linguo.id
        </p>
      </div>
    </div>
  );
}
