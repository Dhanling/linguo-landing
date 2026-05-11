import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  KUESIONER_BY_SLUG,
  ALL_KUESIONERS,
  getTotalQuestions,
} from '@/lib/discovery/schema';
import type { Kuesioner, PersonaSlug } from '@/lib/discovery/schema';
import { DiscoveryForm } from '@/components/discovery/DiscoveryForm';

export const dynamic = 'force-static';

interface PageProps {
  params: Promise<{ persona: string }>;
}

export async function generateStaticParams() {
  return ALL_KUESIONERS.map((k) => ({ persona: k.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { persona } = await params;
  const k = KUESIONER_BY_SLUG[persona as PersonaSlug];
  if (!k) return { title: 'Riset Lingcore' };
  return {
    title: 'Kuesioner ' + k.shortTitle + ' — Riset Lingcore',
    description:
      'Riset kebutuhan program bahasa di sekolah. Estimasi ' +
      k.estimatedMinutes +
      '. Jawaban tersimpan otomatis.',
    robots: { index: false, follow: false },
  };
}

export default async function PersonaFormPage({ params }: PageProps) {
  const { persona } = await params;
  const kuesioner = KUESIONER_BY_SLUG[persona as PersonaSlug];

  if (!kuesioner) {
    notFound();
  }

  return <PageContent kuesioner={kuesioner} />;
}

function PageContent({ kuesioner }: { kuesioner: Kuesioner }) {
  const totalQ = getTotalQuestions(kuesioner);

  return (
    <>
      <div className="bg-gradient-to-b from-teal-50 to-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
          <Link
            href="/riset"
            className="inline-flex items-center text-sm text-teal-700 hover:text-teal-800 mb-4"
          >
            ← Kembali ke pilihan peran
          </Link>
          <div className="inline-block px-2.5 py-1 bg-teal-100 text-teal-800 text-xs font-semibold rounded-md mb-3">
            {kuesioner.shortTitle}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            {kuesioner.audienceLabel}
          </h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mb-6">
            <span>📋 {totalQ} pertanyaan</span>
            <span>⏱ {kuesioner.estimatedMinutes}</span>
            <span>🎁 {kuesioner.voucherAmount}</span>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 text-sm text-gray-700 whitespace-pre-line leading-relaxed shadow-sm">
            {kuesioner.intro}
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">
            Scroll ke bawah untuk mulai mengisi. Jawaban tersimpan otomatis ke browser Anda.
          </p>
        </div>
      </div>

      <DiscoveryForm kuesioner={kuesioner} />
    </>
  );
}
