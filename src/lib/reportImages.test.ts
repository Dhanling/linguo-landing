import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { languages, examSlugs } from '@/data/curriculum/languages';
import { reportIllustration, REPORT_BRUSH_THEMES } from './reportImages';

const catalog = languages.filter(language => !examSlugs.has(language.slug));

describe('ilustrasi rapor brush seluruh katalog Linguo', () => {
  it('setiap bahasa katalog punya latar khusus beserta pratinjau dan sumber cetaknya', () => {
    expect(REPORT_BRUSH_THEMES).toHaveLength(catalog.length);
    const themes = new Set<string>();
    for (const language of catalog) {
      const image = reportIllustration(language.name);
      expect(REPORT_BRUSH_THEMES, language.name).toContain(image.theme);
      expect(image.preview, language.name).toMatch(/^\/images\/reports\/brush-v1\//);
      expect(existsSync(join(process.cwd(), 'public', image.preview)), `${language.name}: preview`).toBe(true);
      expect(existsSync(join(process.cwd(), 'public', image.print)), `${language.name}: cetak`).toBe(true);
      expect(reportIllustration(language.nativeName).theme, language.nativeName).toBe(image.theme);
      themes.add(image.theme);
    }
    expect(themes.size).toBe(catalog.length);
  });

  it('varian negara dan bahasa daerah tidak tertukar', () => {
    expect(reportIllustration('Portuguese (Portugal)').theme).toBe('portuguese');
    expect(reportIllustration('Portuguese').theme).toBe('brazilian');
    expect(reportIllustration('Jawa').theme).toBe('javanese');
    expect(reportIllustration('Sunda').theme).toBe('sundanese');
    expect(reportIllustration('Bahasa Isyarat ASL').theme).toBe('asl');
    expect(reportIllustration('Bahasa Isyarat BISINDO').theme).toBe('bisindo');
    expect(reportIllustration('English - Conversation A1.1 (ENG-A11-AUG26)').theme).toBe('american');
  });

  it('nama tidak dikenal memakai lanskap netral tanpa menebak negara', () => {
    expect(reportIllustration('bahasa yang belum dikenal').theme).toBe('watercolor-landscape');
    expect(reportIllustration('Esperanto').theme).toBe('watercolor-landscape');
  });
});
