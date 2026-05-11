'use client';

import { ChangeEvent } from 'react';
import type { Question } from '@/lib/discovery/schema';

// ============================================================================
// SHARED HELPERS
// ============================================================================

function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

interface FieldProps<T = unknown> {
  question: Question;
  value: T;
  onChange: (val: T) => void;
  error?: string;
}

function QuestionHeader({ question }: { question: Question }) {
  return (
    <div className="mb-3">
      <label className="block text-base font-medium text-gray-900 leading-snug">
        <span className="text-gray-500 mr-2">Q{question.number}.</span>
        {question.text}
        {question.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {question.helpText && (
        <p className="text-sm text-gray-500 mt-1">{question.helpText}</p>
      )}
    </div>
  );
}

function ErrorMsg({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="text-sm text-red-600 mt-2">{error}</p>;
}

// ============================================================================
// SINGLE CHOICE (radio)
// ============================================================================

interface SingleChoiceValue {
  selected: string;
  otherText?: string;
}

export function SingleChoice({
  question,
  value,
  onChange,
  error,
}: FieldProps<SingleChoiceValue>) {
  const v: SingleChoiceValue = value || { selected: '' };

  return (
    <div>
      <QuestionHeader question={question} />
      <div className="space-y-2">
        {question.options?.map((opt) => (
          <label
            key={opt}
            className={cn(
              'flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors',
              v.selected === opt
                ? 'border-teal-600 bg-teal-50'
                : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
            )}
          >
            <input
              type="radio"
              name={'q-' + question.number}
              value={opt}
              checked={v.selected === opt}
              onChange={() => onChange({ selected: opt })}
              className="mt-0.5 w-4 h-4 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-900 flex-1">{opt}</span>
          </label>
        ))}

        {question.hasOther && (
          <div
            className={cn(
              'flex items-start gap-3 p-3 border rounded-lg transition-colors',
              v.selected === '__other__'
                ? 'border-teal-600 bg-teal-50'
                : 'border-gray-200'
            )}
          >
            <input
              type="radio"
              name={'q-' + question.number}
              checked={v.selected === '__other__'}
              onChange={() => onChange({ selected: '__other__', otherText: v.otherText || '' })}
              className="mt-0.5 w-4 h-4 text-teal-600 focus:ring-teal-500"
            />
            <div className="flex-1">
              <span className="text-sm text-gray-900">Lainnya:</span>
              <input
                type="text"
                value={v.otherText || ''}
                onChange={(e) => onChange({ selected: '__other__', otherText: e.target.value })}
                onFocus={() => onChange({ selected: '__other__', otherText: v.otherText || '' })}
                placeholder="Tulis di sini..."
                className="mt-1 block w-full border-b border-gray-300 focus:border-teal-600 outline-none text-sm py-1 bg-transparent"
              />
            </div>
          </div>
        )}
      </div>
      <ErrorMsg error={error} />
    </div>
  );
}

// ============================================================================
// MULTI CHOICE (checkbox)
// ============================================================================

interface MultiChoiceValue {
  selected: string[];
  otherText?: string;
}

export function MultiChoice({
  question,
  value,
  onChange,
  error,
}: FieldProps<MultiChoiceValue>) {
  const v: MultiChoiceValue = value || { selected: [] };
  const sel = v.selected || [];

  const toggle = (opt: string) => {
    if (sel.includes(opt)) {
      onChange({ ...v, selected: sel.filter((s) => s !== opt) });
    } else {
      onChange({ ...v, selected: [...sel, opt] });
    }
  };

  const otherChecked = sel.includes('__other__');

  return (
    <div>
      <QuestionHeader question={question} />
      <div className="space-y-2">
        {question.options?.map((opt) => {
          const checked = sel.includes(opt);
          return (
            <label
              key={opt}
              className={cn(
                'flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors',
                checked
                  ? 'border-teal-600 bg-teal-50'
                  : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(opt)}
                className="mt-0.5 w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
              />
              <span className="text-sm text-gray-900 flex-1">{opt}</span>
            </label>
          );
        })}

        {question.hasOther && (
          <div
            className={cn(
              'flex items-start gap-3 p-3 border rounded-lg transition-colors',
              otherChecked ? 'border-teal-600 bg-teal-50' : 'border-gray-200'
            )}
          >
            <input
              type="checkbox"
              checked={otherChecked}
              onChange={() => toggle('__other__')}
              className="mt-0.5 w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
            />
            <div className="flex-1">
              <span className="text-sm text-gray-900">Lainnya:</span>
              <input
                type="text"
                value={v.otherText || ''}
                onChange={(e) => onChange({ ...v, otherText: e.target.value, selected: sel.includes('__other__') ? sel : [...sel, '__other__'] })}
                placeholder="Tulis di sini..."
                className="mt-1 block w-full border-b border-gray-300 focus:border-teal-600 outline-none text-sm py-1 bg-transparent"
              />
            </div>
          </div>
        )}
      </div>
      <ErrorMsg error={error} />
    </div>
  );
}

// ============================================================================
// LIKERT 5 (1-5 scale buttons)
// ============================================================================

export function LikertScale({ question, value, onChange, error }: FieldProps<number>) {
  const v = typeof value === 'number' ? value : 0;

  return (
    <div>
      <QuestionHeader question={question} />
      <div className="mt-3">
        {(question.likertLow || question.likertHigh) && (
          <div className="flex justify-between text-xs text-gray-500 mb-2 px-1">
            <span className="max-w-[40%]">1 = {question.likertLow || ''}</span>
            <span className="max-w-[40%] text-right">5 = {question.likertHigh || ''}</span>
          </div>
        )}
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={cn(
                'py-4 rounded-lg border-2 font-semibold text-lg transition-all',
                v === n
                  ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-teal-400'
              )}
              aria-label={'Pilih nilai ' + n}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <ErrorMsg error={error} />
    </div>
  );
}

// ============================================================================
// RANK SELECTOR (N dropdowns sharing same options)
// ============================================================================

export function RankSelector({
  question,
  value,
  onChange,
  error,
}: FieldProps<string[]>) {
  const topN = question.topN || 3;
  const v: string[] = Array.isArray(value) ? value : [];
  // Pad to topN
  const ranks = Array.from({ length: topN }, (_, i) => v[i] || '');

  const updateRank = (idx: number, val: string) => {
    const newRanks = [...ranks];
    newRanks[idx] = val;
    onChange(newRanks);
  };

  return (
    <div>
      <QuestionHeader question={question} />
      <p className="text-sm text-gray-600 mt-1 mb-3">
        Pilih top {topN} dari opsi di bawah, urut dari paling prioritas.
      </p>
      <div className="space-y-2">
        {Array.from({ length: topN }).map((_, idx) => {
          const labelSuffix =
            idx === 0
              ? ' (paling prioritas)'
              : idx === topN - 1
              ? ' (paling akhir)'
              : '';
          return (
            <div key={idx} className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 w-32 shrink-0">
                #{idx + 1}{labelSuffix}
              </span>
              <select
                value={ranks[idx]}
                onChange={(e) => updateRank(idx, e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-teal-600 focus:ring-teal-500 focus:outline-none bg-white"
              >
                <option value="">— Pilih opsi —</option>
                {question.options?.map((opt) => {
                  const usedElsewhere = ranks.includes(opt) && ranks[idx] !== opt;
                  return (
                    <option key={opt} value={opt} disabled={usedElsewhere}>
                      {opt}
                      {usedElsewhere ? ' (sudah dipilih)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          );
        })}
      </div>
      <ErrorMsg error={error} />
    </div>
  );
}

// ============================================================================
// LONG TEXT (textarea)
// ============================================================================

export function LongText({ question, value, onChange, error }: FieldProps<string>) {
  const v = typeof value === 'string' ? value : '';
  return (
    <div>
      <QuestionHeader question={question} />
      <textarea
        value={v}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        rows={4}
        placeholder="Tulis jawaban Bapak/Ibu di sini..."
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-teal-600 focus:ring-teal-500 focus:outline-none resize-y"
      />
      <ErrorMsg error={error} />
    </div>
  );
}

// ============================================================================
// SHORT TEXT (input)
// ============================================================================

export function ShortText({ question, value, onChange, error }: FieldProps<string>) {
  const v = typeof value === 'string' ? value : '';
  return (
    <div>
      <QuestionHeader question={question} />
      <input
        type="text"
        value={v}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder="Tulis jawaban di sini..."
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-teal-600 focus:ring-teal-500 focus:outline-none"
      />
      <ErrorMsg error={error} />
    </div>
  );
}

// ============================================================================
// NUMBER INPUT
// ============================================================================

export function NumberInput({
  question,
  value,
  onChange,
  error,
}: FieldProps<string>) {
  const v = typeof value === 'string' ? value : '';
  return (
    <div>
      <QuestionHeader question={question} />
      <input
        type="number"
        inputMode="numeric"
        value={v}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder="Angka"
        className="w-full sm:w-48 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-teal-600 focus:ring-teal-500 focus:outline-none"
      />
      <ErrorMsg error={error} />
    </div>
  );
}

// ============================================================================
// YES / NO (radio Ya/Tidak)
// ============================================================================

export function YesNo({ question, value, onChange, error }: FieldProps<string>) {
  const v = typeof value === 'string' ? value : '';
  return (
    <div>
      <QuestionHeader question={question} />
      <div className="flex gap-3">
        {['Ya', 'Tidak'].map((opt) => (
          <label
            key={opt}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-3 border rounded-lg cursor-pointer transition-colors',
              v === opt
                ? 'border-teal-600 bg-teal-50'
                : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
            )}
          >
            <input
              type="radio"
              name={'q-' + question.number}
              value={opt}
              checked={v === opt}
              onChange={() => onChange(opt)}
              className="w-4 h-4 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm font-medium text-gray-900">{opt}</span>
          </label>
        ))}
      </div>
      <ErrorMsg error={error} />
    </div>
  );
}

// ============================================================================
// DISPATCHER
// ============================================================================

interface QuestionFieldProps {
  question: Question;
  value: unknown;
  onChange: (val: unknown) => void;
  error?: string;
}

export function QuestionField({ question, value, onChange, error }: QuestionFieldProps) {
  switch (question.tag) {
    case 'SINGLE':
      return (
        <SingleChoice
          question={question}
          value={value as SingleChoiceValue}
          onChange={onChange as (v: SingleChoiceValue) => void}
          error={error}
        />
      );
    case 'MULTI':
      return (
        <MultiChoice
          question={question}
          value={value as MultiChoiceValue}
          onChange={onChange as (v: MultiChoiceValue) => void}
          error={error}
        />
      );
    case 'LIKERT5':
      return (
        <LikertScale
          question={question}
          value={value as number}
          onChange={onChange as (v: number) => void}
          error={error}
        />
      );
    case 'RANK':
      return (
        <RankSelector
          question={question}
          value={value as string[]}
          onChange={onChange as (v: string[]) => void}
          error={error}
        />
      );
    case 'LONGTEXT':
      return (
        <LongText
          question={question}
          value={value as string}
          onChange={onChange as (v: string) => void}
          error={error}
        />
      );
    case 'TEXT':
      return (
        <ShortText
          question={question}
          value={value as string}
          onChange={onChange as (v: string) => void}
          error={error}
        />
      );
    case 'NUMBER':
      return (
        <NumberInput
          question={question}
          value={value as string}
          onChange={onChange as (v: string) => void}
          error={error}
        />
      );
    case 'YESNO':
      return (
        <YesNo
          question={question}
          value={value as string}
          onChange={onChange as (v: string) => void}
          error={error}
        />
      );
    default:
      return (
        <div className="p-3 bg-yellow-50 border border-yellow-300 rounded text-sm text-yellow-800">
          Unknown question type: {question.tag}
        </div>
      );
  }
}
