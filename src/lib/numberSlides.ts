import type { MateriSlide, VocabItem } from './materiSlides';

export interface NumberEntry extends VocabItem { value: number }
const SATUAN = ['nol', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan'];
export function numberMeaning(value: number): string {
  if (value < 10) return SATUAN[value];
  if (value === 10) return 'sepuluh';
  if (value === 11) return 'sebelas';
  if (value < 20) return `${SATUAN[value - 10]} belas`;
  if (value < 100) return `${SATUAN[Math.floor(value / 10)]} puluh${value % 10 ? ` ${SATUAN[value % 10]}` : ''}`;
  if (value === 100) return 'seratus';
  if (value === 1000) return 'seribu';
  return value.toLocaleString('id-ID');
}
const WORDS = Array.from({ length: 101 }, (_, value) => [numberMeaning(value), value] as const).sort((a, b) => b[0].length - a[0].length);

function values(meaning: string): number[] {
  const text = meaning.trim().toLowerCase().replace(/^angka\s+/, '').replace(/\([^)]*\)/g, '').split(/\s+[—;=]/)[0].trim().replace(/\s+orang$/, '');
  const range = text.match(/^(\d+)\s*[–-]\s*(\d+)$/);
  if (range) {
    const start = Number(range[1]), end = Number(range[2]);
    return end >= start && end - start <= 20 ? Array.from({ length: end - start + 1 }, (_, i) => start + i) : [];
  }
  const pieces = text.split(/\s*[,·/]\s*/);
  const result: number[] = [];
  for (const piece of pieces) {
    if (/^\d+(?:\.\d{3})*$/.test(piece)) { result.push(Number(piece.replace(/\./g, ''))); continue; }
    if (piece === 'ribu' || piece === 'seribu') { result.push(1000); continue; }
    const found = WORDS.find(([word]) => piece === word);
    if (!found) return [];
    result.push(found[1]);
  }
  return result;
}

export function numberItems(slide: MateriSlide): VocabItem[] {
  return slide.type === 'vocab' ? slide.items || [] : slide.type === 'pattern'
    ? (slide.examples || []).map(example => ({ term: example.target, meaning: example.meaning || '', translit: example.translit })) : [];
}
export function parseNumberItem(item: VocabItem): NumberEntry[] {
  const numbers = values(item.meaning);
  if (!numbers.length) return [];
  const numberedTerms = Array.from(item.term.matchAll(/(?:^|[·,;])\s*(\d+)\s+([^·,;]+)/g));
  if (numberedTerms.length > 1 && numberedTerms.length === numbers.length) {
    return numberedTerms.map((match, i) => ({ ...item, value: Number(match[1]), term: match[2].trim(), meaning: numberMeaning(Number(match[1])), example: i === 0 ? item.example : undefined }));
  }
  if (numbers.length === 1) return [{ ...item, value: numbers[0], meaning: /^\d+$/.test(item.meaning) ? numberMeaning(numbers[0]) : item.meaning }];
  let terms = item.term.split(/\s*[·,]\s*/);
  if (terms.length !== numbers.length) terms = item.term.split(/\s*\/\s*/);
  if (terms.length !== numbers.length) return [];
  const translits = item.translit?.split(/\s*[·,]\s*/);
  return numbers.map((value, i) => ({ ...item, value, term: terms[i], meaning: numberMeaning(value),
    translit: translits?.length === numbers.length ? translits[i] : undefined,
    example: i === 0 ? item.example : undefined, example_meaning: i === 0 ? item.example_meaning : undefined }));
}

export function numberEntries(slide: MateriSlide): NumberEntry[] {
  return numberItems(slide).flatMap(parseNumberItem);
}
export function isNumberVocabulary(slide: MateriSlide): boolean {
  if (slide.type !== 'vocab' && slide.type !== 'pattern') return false;
  // Daftar bulan, tanggal, nada, ukuran, dan contoh hitungan tetap memakai tampilan aslinya.
  if (/bulan|months?|hijriyah|nada|tone|pelafalan|alfabet|tanggal|ukuran|counters?|kata ukur|operasi|operazioni|operações|hitungan|โทรศัพท์/i.test(slide.heading)) return false;
  const items = numberItems(slide), numericItems = items.filter(item => parseNumberItem(item).length > 0);
  /* [angka-bukan-nomor-urut-v1] "1 — tempat dan tanggal surat" pada kerangka surat/cerita
     adalah nomor urut bagian, bukan nama angka — butirnya kalimat dan artinya
     "N — kalimat". Dulu slide polanya ikut dirender jadi slide angka 0–10. */
  const kalimat = numericItems.filter(item => item.term.trim().split(/\s+/).length >= 4
    && /^\d+\s*[—–-]\s+\S+(?:\s+\S+){2,}/.test(item.meaning.trim())).length;
  if (kalimat * 2 > numericItems.length) return false;
  return numericItems.length >= 2 && numericItems.length / Math.max(items.length, 1) >= 0.45 && numberEntries(slide).length >= 4;
}
export function numberSystem(slide: MateriSlide): string {
  return /asli korea|korea asli/i.test(slide.heading) ? 'native'
    : /angka spanyol/i.test(slide.heading) ? 'borrowed'
    : /pearsanta|angka orang/i.test(slide.heading) ? 'personal' : 'default';
}
export function numberGroup(value: number): string {
  return value <= 10 ? '0–10' : value <= 20 ? '11–20' : value <= 100 ? '21–100' : '100+';
}

export function numberSpeech(term: string): string {
  const cleaned = term.replace(/\s*\([\p{N}\s]+\)/gu, '').replace(/^[\p{N}\s]+|[\p{N}\s]+$/gu, '').trim();
  return cleaned || term;
}
