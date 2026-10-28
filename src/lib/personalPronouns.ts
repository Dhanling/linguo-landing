import type { MateriSlide, VocabItem } from './materiSlides';
import { NUMBER_THEMES, type NumberTheme } from '../data/numberSlideThemes';
export const PERSON_TABS = [
  { id: 'first', label: 'Pembicara', description: 'Orang pertama: yang berbicara.', tone: 'teal', person: 'I' },
  { id: 'second', label: 'Lawan bicara', description: 'Orang kedua: yang diajak bicara.', tone: 'blue', person: 'II' },
  { id: 'third', label: 'Dibicarakan', description: 'Orang ketiga: orang atau hal yang dibicarakan.', tone: 'purple', person: 'III' },
  { id: 'related', label: 'Lainnya', description: 'Kosakata terkait dari materi asli.', tone: 'amber', person: '…' },
] as const;
export type PersonTab = typeof PERSON_TABS[number]['id'];
const ROLES: Record<string, PersonTab> = Object.fromEntries([
  ...'saya aku kami kita gue gua i me we us my our'.split(' ').map(word => [word, 'first']),
  ...'kamu anda kalian kau engkau lu lo elu you your'.split(' ').map(word => [word, 'second']),
  ...'dia ia mereka beliau itu nya he she him her it they them their'.split(' ').map(word => [word, 'third']),
]);
const MODIFIERS = new Set('dan atau dengan untuk kepada dari oleh milik punya diri sendiri laki-laki perempuan pria wanita lk pr netral benda hewan tunggal jamak berdua sopan formal informal hormat akrab subjek objek subject object masculine feminine male female singular plural polite and or the a an'.split(' '));
const TITLE = /kata ganti|pronoun|pronom|pronomi|zamir|z[aá]jmen|zaimk|zamjen|forn[oö]fn|αντωνυμ|местоимен|займен|ضم[اي]ر|ضمائر|代名|대명/i;
export function classifyPronoun(item: VocabItem): PersonTab | undefined {
  const suffix: Record<string, string> = { ku: 'saya', mu: 'kamu', nya: 'dia' };
  const meaning = item.meaning.toLowerCase().replace(/\b(milik|punya|kepada|dari|diri)(ku|mu|nya)\b/g, (_, prefix: string, end: string) => `${prefix} ${suffix[end]}`)
    .replace(/\([^)]*\)/g, '').replace(/[“”"']/g, '');
  const roles = new Set<PersonTab>();
  for (const clause of meaning.split(/[;–—]/)) {
    const words = clause.trim().split(/[\s,/·+]+/).map(word => word.replace(/[.:!?]+$/, '')).filter(Boolean);
    if (!words.length || !words.every(word => ROLES[word] || MODIFIERS.has(word))) break;
    words.forEach(word => { if (ROLES[word]) roles.add(ROLES[word]); });
  }
  return roles.size === 1 ? [...roles][0] : undefined;
}
export function personalPronouns(slide: MateriSlide) {
  return (slide.items || []).map((item, index) => ({ item, index, tab: classifyPronoun(item) || 'related' as PersonTab }));
}
export function isPersonalPronounSlide(slide: MateriSlide): boolean {
  if (slide.type !== 'vocab') return false;
  const title = slide.heading.normalize('NFKC').replace(/[\u064b-\u065f\u0670\u0640]/g, '');
  if (/kata benda untuk latihan|kata kerja siap pakai|frasa untuk naskah|bentuk siap pakai|jawaban pendek|kerangka perkenalan/i.test(title)) return false;
  const titled = TITLE.test(title);
  const recognized = (slide.items || []).filter(item => classifyPronoun(item) && (titled || /\b(saya|aku|kami|kita|kamu|anda|kalian|dia|mereka|i|we|you|he|she|they)\b/i.test(item.meaning)));
  if (titled) return recognized.length >= 2;
  if (/liaison|latihan sambung|latihan membaca|nada|pelafalan|bunyi|kata kerja|konjugasi/i.test(title)) return false;
  const standalone = recognized.filter(item => item.term.replace(/\([^)]*\)/g, '').split(/[,/·]/).every(term => !/\s/.test(term.trim())));
  return recognized.length >= 3 && standalone.length >= 3;
}
export function personalPronounTheme(slide: MateriSlide, lang?: string | null): NumberTheme | undefined {
  if (!isPersonalPronounSlide(slide)) return undefined;
  const cover = slide.cover || '';
  const match = [...NUMBER_THEMES].sort((a,b) => b.slug.length-a.slug.length).find(theme => cover.includes(`/${theme.slug}-`) || cover.includes(`/${theme.slug}/`));
  if (match) return match;
  if (/\/dutch[-/]/.test(cover) || lang === 'nl') return { slug: 'dutch', code: 'nl', label: 'Belanda', country: 'Belanda', image: '/slide-cover/dutch-numbers/background-reference-v3.jpg' };
  return NUMBER_THEMES.find(theme => theme.code.toLowerCase() === lang?.toLowerCase() || theme.slug === lang);
}
