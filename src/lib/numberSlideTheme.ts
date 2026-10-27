import type { MateriSlide } from './materiSlides';
import { NUMBER_THEMES, type NumberTheme } from '../data/numberSlideThemes';
import { isNumberVocabulary } from './numberSlides';

export function numberSlideTheme(slide: MateriSlide, lang?: string | null): NumberTheme | undefined {
  if (!isNumberVocabulary(slide)) return undefined;
  const cover = slide.cover?.toLowerCase() || '';
  // Nama folder membedakan Portugis Brasil/Portugal dan bahasa daerah yang berbagi kode.
  const byCover = [...NUMBER_THEMES].sort((a, b) => b.slug.length - a.slug.length)
    .find(theme => cover.includes(`/${theme.slug}-`) || cover.includes(`/${theme.slug}/`));
  if (byCover) return byCover;
  const code = lang?.toLowerCase() || '';
  if (code === 'pt-br') return NUMBER_THEMES.find(theme => theme.slug === 'portuguese-br');
  return NUMBER_THEMES.find(theme => theme.slug === code || theme.code === code.split('-')[0]);
}
