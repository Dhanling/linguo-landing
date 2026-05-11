'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import type { Kuesioner, Question } from '@/lib/discovery/schema';
import { getTotalQuestions, isAnswered } from '@/lib/discovery/schema';
import { QuestionField } from './form-fields';

// ============================================================================
// SUPABASE CLIENT (anon, client-side, untuk INSERT public)
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================================
// TYPES & STATE
// ============================================================================

type ResponseValue = unknown;
type Responses = Record<number, ResponseValue>;
type Errors = Record<number, string>;

interface DiscoveryFormProps {
  kuesioner: Kuesioner;
}

function getDraftKey(personaId: string) {
  return 'linguo-discovery-draft-' + personaId;
}

function getUtmParams(): Record<string, string | null> {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_content: params.get('utm_content'),
    utm_term: params.get('utm_term'),
    referrer: typeof document !== 'undefined' ? document.referrer || null : null,
  };
}

function validateQuestion(q: Question, value: ResponseValue): string | null {
  if (!q.required) return null;
  if (!isAnswered(q, value)) return 'Wajib diisi';
  return null;
}

function validateSection(
  questions: Question[],
  responses: Responses
): Errors {
  const errors: Errors = {};
  for (const q of questions) {
    const err = validateQuestion(q, responses[q.number]);
    if (err) errors[q.number] = err;
  }
  return errors;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DiscoveryForm({ kuesioner }: DiscoveryFormProps) {
  const router = useRouter();
  const totalQuestions = useMemo(() => getTotalQuestions(kuesioner), [kuesioner]);

  const [responses, setResponses] = useState<Responses>({});
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);

  // === Load draft from localStorage on mount ===
  useEffect(() => {
    const key = getDraftKey(kuesioner.id);
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.responses) {
          setResponses(parsed.responses);
          setDraftRestored(true);
        }
        if (typeof parsed.currentSectionIdx === 'number') {
          setCurrentSectionIdx(parsed.currentSectionIdx);
        }
      }
    } catch {
      // ignore corrupted draft
    }
  }, [kuesioner.id]);

  // === Save draft on changes (debounced via simple effect) ===
  useEffect(() => {
    const key = getDraftKey(kuesioner.id);
    const payload = JSON.stringify({ responses, currentSectionIdx });
    try {
      localStorage.setItem(key, payload);
    } catch {
      // localStorage might be full / disabled
    }
  }, [responses, currentSectionIdx, kuesioner.id]);

  // === Compute progress ===
  const answeredCount = useMemo(() => {
    let count = 0;
    for (const sec of kuesioner.sections) {
      for (const q of sec.questions) {
        if (isAnswered(q, responses[q.number])) count++;
      }
    }
    return count;
  }, [kuesioner.sections, responses]);

  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const currentSection = kuesioner.sections[currentSectionIdx];
  const isLastSection = currentSectionIdx === kuesioner.sections.length - 1;
  const isFirstSection = currentSectionIdx === 0;

  // === Handlers ===
  const updateResponse = useCallback((qNum: number, val: ResponseValue) => {
    setResponses((prev) => ({ ...prev, [qNum]: val }));
    setErrors((prev) => {
      if (!prev[qNum]) return prev;
      const next = { ...prev };
      delete next[qNum];
      return next;
    });
  }, []);

  const goToSection = useCallback(
    (idx: number) => {
      setCurrentSectionIdx(idx);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    []
  );

  const handleNext = useCallback(() => {
    const sectionErrors = validateSection(currentSection.questions, responses);
    if (Object.keys(sectionErrors).length > 0) {
      setErrors(sectionErrors);
      const firstErrorQ = Object.keys(sectionErrors)[0];
      const el = document.getElementById('question-' + firstErrorQ);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setErrors({});
    goToSection(currentSectionIdx + 1);
  }, [currentSection, responses, currentSectionIdx, goToSection]);

  const handlePrev = useCallback(() => {
    setErrors({});
    goToSection(currentSectionIdx - 1);
  }, [currentSectionIdx, goToSection]);

  const handleSubmit = useCallback(async () => {
    // Validate last section
    const sectionErrors = validateSection(currentSection.questions, responses);
    if (Object.keys(sectionErrors).length > 0) {
      setErrors(sectionErrors);
      const firstErrorQ = Object.keys(sectionErrors)[0];
      const el = document.getElementById('question-' + firstErrorQ);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    // Helper: ekstrak pesan error dari Supabase (PostgrestError) atau Error standar.
    // Supabase error adalah plain object, jadi 'err instanceof Error' returns false.
    // Tanpa helper ini, message ke-suppress dan user cuma liat "Unknown error".
    function extractError(err: unknown): string {
      if (!err) return 'Unknown error';
      if (typeof err === 'string') return err;
      if (typeof err !== 'object') return String(err);
      const e = err as Record<string, unknown>;
      const parts: string[] = [];
      if (e.message) parts.push(String(e.message));
      if (e.details) parts.push('(' + String(e.details) + ')');
      if (e.hint) parts.push('Hint: ' + String(e.hint));
      if (e.code) parts.push('[code: ' + String(e.code) + ']');
      return parts.length ? parts.join(' ') : 'Unknown error';
    }

    try {
      const utm = getUtmParams();
      const fullPayload = {
        persona: kuesioner.id,
        responses: responses,
        submitted_at: new Date().toISOString(),
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        utm_source: utm.utm_source,
        utm_medium: utm.utm_medium,
        utm_campaign: utm.utm_campaign,
        referrer: utm.referrer,
      };

      // First attempt: full payload (assumes table has all columns).
      let { error } = await supabase
        .from('discovery_responses')
        .insert(fullPayload);

      // Fallback: kalau gagal karena column mismatch (42703 = "column does not exist",
      // PGRST204 = PostgREST schema cache miss), retry dengan minimal payload.
      // Ini handle case dimana table cuma punya 'persona' + 'responses' JSONB.
      if (error) {
        const code = String((error as { code?: string }).code || '');
        const msg = String((error as { message?: string }).message || '').toLowerCase();
        const isColumnError =
          code === '42703' ||
          code === 'PGRST204' ||
          msg.includes('column') ||
          msg.includes('schema cache');

        if (isColumnError) {
          console.warn('[discovery] Full payload rejected — retrying with minimal payload. Original error:', error);
          const minimal = { persona: kuesioner.id, responses };
          const retry = await supabase.from('discovery_responses').insert(minimal);
          error = retry.error;

          // Last-ditch: kalau kolom 'persona' juga gak ada, coba dengan 'responses' aja.
          if (error) {
            const retryCode = String((error as { code?: string }).code || '');
            const retryMsg = String((error as { message?: string }).message || '').toLowerCase();
            if (retryCode === '42703' || retryCode === 'PGRST204' || retryMsg.includes('column')) {
              console.warn('[discovery] Minimal payload rejected — retrying responses-only. Error:', error);
              const responsesOnly = { responses: { ...responses, _persona: kuesioner.id } };
              const retry2 = await supabase.from('discovery_responses').insert(responsesOnly);
              error = retry2.error;
            }
          }
        }
      }

      if (error) throw error;

      // Clear draft & redirect
      localStorage.removeItem(getDraftKey(kuesioner.id));
      router.push('/riset/' + kuesioner.slug + '/terima-kasih');
    } catch (err) {
      console.error('[discovery] Submit failed. Full error object:', err);
      const msg = extractError(err);
      setSubmitError(
        'Gagal mengirim jawaban: ' + msg + '. Mohon screenshot pesan ini dan kirim ke hello@linguo.id, atau buka Developer Tools (F12) → Console untuk detail.'
      );
      setSubmitting(false);
    }
  }, [currentSection, responses, kuesioner, router]);

  // === RENDER ===
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header sticky dengan progress */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-sm font-medium text-gray-900">
                {kuesioner.shortTitle}
              </h1>
              <p className="text-xs text-gray-500">
                Bagian {currentSectionIdx + 1} dari {kuesioner.sections.length}
                {' • '}
                {answeredCount}/{totalQuestions} pertanyaan
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-teal-600">
                {progressPercent}%
              </span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-600 transition-all duration-300"
              style={{ width: progressPercent + '%' }}
            />
          </div>
          {draftRestored && (
            <p className="text-xs text-teal-700 mt-2 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 bg-teal-600 rounded-full" />
              Draft dipulihkan dari sesi sebelumnya. Tersimpan otomatis.
            </p>
          )}
        </div>
      </div>

      {/* Form content */}
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        {/* Section title */}
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            {currentSection.title}
          </h2>
        </div>

        {/* Questions */}
        <div className="space-y-6 sm:space-y-8">
          {currentSection.questions.map((q) => (
            <div
              key={q.number}
              id={'question-' + q.number}
              className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6"
            >
              <QuestionField
                question={q}
                value={responses[q.number]}
                onChange={(val) => updateResponse(q.number, val)}
                error={errors[q.number]}
              />
            </div>
          ))}
        </div>

        {/* Submit error */}
        {submitError && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{submitError}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrev}
            disabled={isFirstSection || submitting}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Sebelumnya
          </button>

          <span className="text-xs text-gray-500 hidden sm:block">
            Jawaban tersimpan otomatis
          </span>

          {isLastSection ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {submitting ? 'Mengirim...' : 'Kirim Jawaban →'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              disabled={submitting}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-60 transition-colors shadow-sm"
            >
              Berikutnya →
            </button>
          )}
        </div>

        {/* Section navigation dots (mobile-hidden, desktop visible) */}
        <div className="mt-6 hidden sm:flex items-center justify-center gap-2">
          {kuesioner.sections.map((sec, idx) => {
            const isCurrent = idx === currentSectionIdx;
            const isPast = idx < currentSectionIdx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => goToSection(idx)}
                className={
                  'w-2.5 h-2.5 rounded-full transition-all ' +
                  (isCurrent
                    ? 'bg-teal-600 w-8'
                    : isPast
                    ? 'bg-teal-300 hover:bg-teal-400'
                    : 'bg-gray-300 hover:bg-gray-400')
                }
                title={sec.title}
                aria-label={'Lompat ke ' + sec.title}
              />
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-3xl mx-auto px-4 py-6 text-center text-xs text-gray-500">
        <p>
          Riset Lingcore for Schools • PT Linguo Edu Indonesia •
          {' '}
          <a href="mailto:hello@linguo.id" className="text-teal-700 hover:underline">
            hello@linguo.id
          </a>
        </p>
      </div>
    </div>
  );
}
