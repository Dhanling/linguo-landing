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
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-white to-emerald-50/30 border-b border-gray-200">
        <div
          aria-hidden="true"
          className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-72 h-72 rounded-full bg-gradient-to-br from-teal-200/30 to-emerald-200/30 blur-3xl"
        />

        <div className="relative max-w-3xl mx-auto px-4 py-10 sm:py-14">
          <Link
            href="/riset"
            className="inline-flex items-center text-sm text-teal-700 hover:text-teal-800 mb-5 font-medium"
          >
            ← Kembali ke pilihan peran
          </Link>

          <div className="inline-block px-2.5 py-1 bg-teal-100 text-teal-800 text-xs font-semibold rounded-md mb-3">
            {kuesioner.shortTitle}
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            {kuesioner.audienceLabel}
          </h1>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-600 mb-7">
            <div className="flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span className="font-medium text-gray-900">{totalQ} pertanyaan</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="font-medium text-gray-900">{kuesioner.estimatedMinutes}</span>
            </div>
          </div>

          {/* Intro letter card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-7 text-sm text-gray-700 whitespace-pre-line leading-relaxed shadow-sm">
            {kuesioner.intro}
          </div>

          <p className="text-xs text-gray-500 mt-5 text-center">
            Scroll ke bawah untuk mulai mengisi. Jawaban tersimpan otomatis ke browser Anda.
          </p>
        </div>
      </div>

      <DiscoveryForm kuesioner={kuesioner} />
    </>
  );
}
