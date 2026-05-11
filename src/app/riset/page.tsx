import Link from 'next/link';
import type { Metadata } from 'next';
import { ALL_KUESIONERS, getTotalQuestions } from '@/lib/discovery/schema';
import type { Kuesioner, PersonaId } from '@/lib/discovery/schema';

export const metadata: Metadata = {
  title: 'Riset Lingcore for Schools — Linguo',
  description:
    'Riset kebutuhan program bahasa di sekolah Indonesia untuk pengembangan platform LMS Lingcore. Kontribusi Anda sangat berharga.',
  robots: { index: false, follow: false },
};

// ============================================================================
// PERSONA ICON COMPONENTS (inline SVG, no deps)
// ============================================================================

function PersonaIcon({ persona }: { persona: PersonaId }) {
  const props = {
    width: 28,
    height: 28,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  if (persona === 'kepsek') {
    return (
      <svg {...props}>
        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
        <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
        <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
        <path d="M10 6h4" />
        <path d="M10 10h4" />
        <path d="M10 14h4" />
        <path d="M10 18h4" />
      </svg>
    );
  }
  if (persona === 'koordinator') {
    return (
      <svg {...props}>
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" />
        <path d="m9 14 2 2 4-4" />
      </svg>
    );
  }
  if (persona === 'guru') {
    return (
      <svg {...props}>
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    );
  }
  // siswa
  return (
    <svg {...props}>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

// ============================================================================
// STAT ICONS
// ============================================================================

function StatIcon({ name }: { name: 'school' | 'users' | 'calendar' | 'shield' }) {
  const props = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  if (name === 'school') {
    return (
      <svg {...props}>
        <path d="m4 6 8-4 8 4" />
        <path d="m18 10 4 2v10H2V12l4-2" />
        <path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4" />
        <path d="M18 5v17" />
        <path d="M6 5v17" />
        <circle cx="12" cy="9" r="2" />
      </svg>
    );
  }
  if (name === 'users') {
    return (
      <svg {...props}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }
  if (name === 'calendar') {
    return (
      <svg {...props}>
        <rect width="18" height="18" x="3" y="4" rx="2" />
        <path d="M16 2v4" />
        <path d="M8 2v4" />
        <path d="M3 10h18" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

// ============================================================================
// PERSONA CARD
// ============================================================================

const ACCENT_STYLES: Record<PersonaId, { strip: string; iconBg: string; iconText: string; badge: string }> = {
  kepsek: {
    strip: 'bg-gradient-to-r from-teal-600 to-teal-700',
    iconBg: 'bg-teal-50 group-hover:bg-teal-100',
    iconText: 'text-teal-700',
    badge: 'bg-teal-100 text-teal-800',
  },
  koordinator: {
    strip: 'bg-gradient-to-r from-emerald-600 to-emerald-700',
    iconBg: 'bg-emerald-50 group-hover:bg-emerald-100',
    iconText: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-800',
  },
  guru: {
    strip: 'bg-gradient-to-r from-cyan-600 to-cyan-700',
    iconBg: 'bg-cyan-50 group-hover:bg-cyan-100',
    iconText: 'text-cyan-700',
    badge: 'bg-cyan-100 text-cyan-800',
  },
  siswa: {
    strip: 'bg-gradient-to-r from-sky-500 to-sky-600',
    iconBg: 'bg-sky-50 group-hover:bg-sky-100',
    iconText: 'text-sky-700',
    badge: 'bg-sky-100 text-sky-800',
  },
};

function PersonaCard({ k }: { k: Kuesioner }) {
  const totalQ = getTotalQuestions(k);
  const accent = ACCENT_STYLES[k.id];

  return (
    <Link
      href={'/riset/' + k.slug}
      className="group relative block bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Accent strip top */}
      <div className={'h-1 ' + accent.strip} />

      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between mb-5">
          {/* Icon */}
          <div className={'flex items-center justify-center w-12 h-12 rounded-xl transition-colors ' + accent.iconBg + ' ' + accent.iconText}>
            <PersonaIcon persona={k.id} />
          </div>
          {/* Arrow */}
          <span className="text-gray-400 group-hover:text-gray-700 group-hover:translate-x-1 transition-all text-xl">
            →
          </span>
        </div>

        {/* Persona badge */}
        <div className={'inline-block px-2.5 py-1 text-xs font-semibold rounded-md mb-2.5 ' + accent.badge}>
          {k.shortTitle}
        </div>

        {/* Audience label */}
        <h3 className="text-lg font-bold text-gray-900 mb-4 leading-snug">
          {k.audienceLabel}
        </h3>

        {/* Stats */}
        <div className="flex items-center gap-5 text-sm text-gray-600 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="font-medium text-gray-900">{k.estimatedMinutes}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="font-medium text-gray-900">{totalQ} pertanyaan</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function RisetLandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero with subtle gradient bg */}
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-white to-emerald-50/30">
        {/* Decorative blob */}
        <div
          aria-hidden="true"
          className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-teal-200/40 to-emerald-200/40 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-cyan-200/30 to-teal-200/30 blur-3xl"
        />

        <div className="relative max-w-5xl mx-auto px-4 py-16 sm:py-20 lg:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/80 backdrop-blur border border-teal-200 text-teal-800 text-xs font-semibold rounded-full mb-6 shadow-sm">
            <span className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-pulse" />
            DISCOVERY SPRINT 2026 • LINGCORE FOR SCHOOLS
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-5 leading-tight tracking-tight">
            Bantu Kami Bikin LMS Bahasa<br />
            yang <span className="text-teal-700">Bener-Bener Berguna</span>
          </h1>

          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Linguo (linguo.id) sedang mengembangkan{' '}
            <strong className="text-gray-900 font-semibold">Lingcore for Schools</strong>
            {' '}— platform LMS khusus pembelajaran bahasa. Sebelum membangun, kami ingin
            mendengar kondisi nyata di lapangan dari Anda.
          </p>

          {/* Stats grid */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto">
            {[
              { icon: 'school' as const, value: '10–15', label: 'Sekolah target' },
              { icon: 'users' as const, value: '~120', label: 'Responden' },
              { icon: 'calendar' as const, value: '6 minggu', label: 'Discovery sprint' },
              { icon: 'shield' as const, value: '100%', label: 'Anonim & aman' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl px-3 py-4 text-center"
              >
                <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-teal-50 text-teal-700 mb-2">
                  <StatIcon name={stat.icon} />
                </div>
                <div className="text-lg sm:text-xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Barter callout */}
      <div className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
        <div className="relative bg-gradient-to-br from-teal-600 to-emerald-700 rounded-2xl p-6 sm:p-8 lg:p-10 text-white overflow-hidden">
          {/* Decorative pattern */}
          <div
            aria-hidden="true"
            className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 blur-2xl -translate-y-1/2 translate-x-1/4"
          />
          <div className="relative flex flex-col sm:flex-row items-start gap-5 sm:gap-7">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 backdrop-blur shrink-0">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="inline-block px-2 py-0.5 bg-white/20 backdrop-blur text-xs font-semibold rounded mb-2.5">
                APRESIASI UNTUK SEKOLAH ANDA
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2.5 leading-snug">
                Akses gratis Simulasi TOEFL Linguo untuk siswa di sekolah Anda
              </h2>
              <p className="text-teal-50/95 text-sm sm:text-base leading-relaxed">
                Sebagai timbal balik partisipasi sekolah Anda dalam riset ini, Linguo akan
                memberikan akses gratis ke <strong className="font-semibold text-white">Simulasi TOEFL Linguo</strong>{' '}
                — produk persiapan TOEFL yang biasa kami jual ke individu — untuk siswa di sekolah Bapak/Ibu.
                Plus <strong className="font-semibold text-white">Executive Summary Riset Agregat</strong>{' '}
                (anonim) yang bisa dipakai sebagai benchmark internal.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Persona section */}
      <div className="max-w-5xl mx-auto px-4 pb-16 sm:pb-20">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Pilih peran Anda
          </h2>
          <p className="text-sm text-gray-500">
            Kami punya kuesioner khusus per peran. Pilih yang sesuai dengan posisi Anda di sekolah.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
          {ALL_KUESIONERS.map((k) => (
            <PersonaCard key={k.id} k={k} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-8 text-center">
          <p className="text-sm text-gray-600 mb-1">
            Pertanyaan tentang riset ini?
          </p>
          <a
            href="mailto:hello@linguo.id"
            className="text-base font-semibold text-teal-700 hover:text-teal-800 hover:underline"
          >
            hello@linguo.id
          </a>
          <p className="text-xs text-gray-400 mt-4">
            PT Linguo Edu Indonesia • linguo.id • Discovery Sprint 2026
          </p>
        </div>
      </div>
    </div>
  );
}
