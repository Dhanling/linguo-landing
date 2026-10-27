import type { MateriSlide, VocabItem } from './materiSlides';

export const ARABIC_PRONOUN_BACKGROUND = '/slide-cover/arabic-pronouns/background-v1.jpg';
export const PRONOUN_GROUPS = [
  { id: 'singular', label: 'Tunggal', description: 'Satu orang', speech: 'مُفْرَد' },
  { id: 'dual', label: 'Berdua', description: 'Dua orang', speech: 'مُثَنَّى' },
  { id: 'plural', label: 'Jamak', description: 'Kelompok orang', speech: 'جَمْع' },
] as const;
export type PronounGroup = typeof PRONOUN_GROUPS[number]['id'];
const DEFINITIONS = [
  { key: 'ana', group: 'singular', role: 'Pembicara', person: 'I', count: '1', tone: 'teal' },
  { key: 'anta', group: 'singular', role: 'Lawan bicara', person: 'II', count: '1', tone: 'blue' },
  { key: 'anti', group: 'singular', role: 'Lawan bicara', person: 'II', count: '1', tone: 'coral' },
  { key: 'huwa', group: 'singular', role: 'Dibicarakan', person: 'III', count: '1', tone: 'amber' },
  { key: 'hiya', group: 'singular', role: 'Dibicarakan', person: 'III', count: '1', tone: 'purple' },
  { key: 'antuma', group: 'dual', role: 'Lawan bicara', person: 'II', count: '2', tone: 'blue' },
  { key: 'huma', group: 'dual', role: 'Dibicarakan', person: 'III', count: '2', tone: 'purple' },
  { key: 'nahnu', group: 'plural', role: 'Pembicara', person: 'I', count: '2+', tone: 'teal' },
  { key: 'antum', group: 'plural', role: 'Lawan bicara', person: 'II', count: '3+', tone: 'blue' },
  { key: 'antunna', group: 'plural', role: 'Lawan bicara', person: 'II', count: '3+', tone: 'coral' },
  { key: 'hum', group: 'plural', role: 'Dibicarakan', person: 'III', count: '3+', tone: 'amber' },
  { key: 'hunna', group: 'plural', role: 'Dibicarakan', person: 'III', count: '3+', tone: 'purple' },
] as const;
export type ArabicPronoun = typeof DEFINITIONS[number] & { item: VocabItem };

export function arabicPronounKey(item: VocabItem): string | undefined {
  const translit = item.translit?.toLowerCase().replace(/[^a-z]/g, '').replace(/aa/g, 'a');
  const bare = item.term.normalize('NFKC').replace(/[\u064b-\u065f\u0670\u0640]/g, '').replace(/[أإآ]/g, 'ا').trim();
  const keys: Record<string, string> = { انا: 'ana', نحن: 'nahnu', هو: 'huwa', هي: 'hiya', انتما: 'antuma', هما: 'huma', انتم: 'antum', انتن: 'antunna', هم: 'hum', هن: 'hunna' };
  if (bare === 'انت') {
    if (translit === 'anti' || item.term.trim().endsWith('ِ')) return 'anti';
    if (translit === 'anta' || item.term.trim().endsWith('َ')) return 'anta';
    return undefined;
  }
  return keys[bare];
}
export function arabicPronouns(slide: MateriSlide): ArabicPronoun[] {
  return DEFINITIONS.flatMap(definition => {
    const item = slide.items?.find(item => arabicPronounKey(item) === definition.key);
    return item ? [{ ...definition, item }] : [];
  });
}
export function isMsaPronounSlide(slide: MateriSlide, lang?: string | null): boolean {
  const heading = slide.heading.normalize('NFKC').replace(/[\u064b-\u065f\u0670\u0640]/g, '');
  if (slide.type !== 'vocab' || !/kata ganti|pronoun|ضمائر/i.test(heading)) return false;
  if (/egypt|mesir|ar-eg|عامية/i.test(`${slide.cover || ''} ${slide.heading}`)) return false;
  if (lang && !/^ar(?:-|$)/i.test(lang)) return false;
  // Khusus tabel kata ganti MSA; kosakata lain dan varian dialek tidak ikut berubah.
  return arabicPronouns(slide).length >= 10;
}
