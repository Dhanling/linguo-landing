import { imagegenA11BodyBackground } from './imagegenA11BodyBackground';
import { imagegenA2Artwork } from './imagegenA2Artwork';

type Slide = { type: string; cover?: string; sublevel?: string };
const SLUG: Record<string, string> = {
  ja: 'japanese', ko: 'korean', yue: 'cantonese', hi: 'hindi', th: 'thai',
  vi: 'vietnamese', tl: 'filipino', km: 'khmer', ur: 'urdu', ms: 'malay',
  ar: 'arabic', he: 'hebrew', fa: 'persian', fr: 'french', ka: 'georgian',
  el: 'greek', ru: 'russian', sv: 'swedish', no: 'norwegian', da: 'danish',
  fi: 'finnish', pl: 'polish', hu: 'hungarian', ro: 'romanian', tr: 'turkish',
  bg: 'bulgarian', uk: 'ukrainian', is: 'icelandic', bs: 'bosnian',
  id: 'bipa', jv: 'javanese', su: 'sundanese', bbc: 'batak', bug: 'bugis',
  sw: 'swahili', bn: 'bengali', ban: 'balinese', mad: 'madurese',
  cs: 'czech', ga: 'irish', lo: 'lao', my: 'burmese',
};

/** Terapkan latar pada dek lama saat ditonton; gambar pilihan pengajar dipertahankan. */
export function lengkapiLatarA11<T extends Slide>(slides: T[], lang?: string | null, subtitle?: string): T[] {
  const cover = slides[0]?.cover || '';
  const dariCover = /(?:^|\/)([a-z-]+)-a1-1(?:-|\.)/.exec(cover);
  const level = slides[0]?.sublevel || /\bA1\.1\b/i.exec(subtitle || '')?.[0];
  const slug = dariCover?.[1] || (lang && (SLUG[lang.toLowerCase()] || lang.toLowerCase()));
  if (!slug || (!dariCover && level?.toUpperCase() !== 'A1.1')) return slides;
  const key = slug + '-a1-1';
  const latar = imagegenA11BodyBackground(key) || imagegenA2Artwork(key, 1)?.latar;
  if (!latar) return slides;
  let berubah = false;
  const hasil = slides.map((s, i) => {
    const bawaanLama = /^\/slide-cover\/[a-z-]+-a1-a2-latar-cute-vector-v1\.svg$/.test(s.cover || '');
    if (i < 2 || s.type === 'title' || (s.cover && !bawaanLama)) return s;
    berubah = true;
    return { ...s, cover: latar };
  });
  return berubah ? hasil : slides;
}
