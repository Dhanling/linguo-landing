import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { languages, examSlugs } from '@/data/curriculum/languages';
import { certificateCountryCode, courseCertificateTheme, CERTIFICATE_COUNTRY_THEMES } from './courseCertificateTheme';

describe('ilustrasi sertifikat sesuai negara dan budaya bahasa', () => {
  it('membedakan Amerika, Inggris, Brasil, dan Portugal sesuai benderanya', () => {
    expect(courseCertificateTheme(certificateCountryCode('English'), 'English')).toBe('american');
    expect(courseCertificateTheme(certificateCountryCode('British English'), 'British English')).toBe('english');
    expect(courseCertificateTheme(certificateCountryCode('Portuguese'), 'Portuguese')).toBe('brazilian');
    expect(courseCertificateTheme(certificateCountryCode('Portuguese (Portugal)'), 'Portuguese (Portugal)')).toBe('portuguese');
  });

  it('nama kelas dan level tetap memperoleh negara bahasa yang benar', () => {
    expect(certificateCountryCode('English - Conversation A1.1 (ENG-A11-AUG26)')).toBe('us');
    expect(certificateCountryCode('Mandarin A1.1')).toBe('cn');
    expect(courseCertificateTheme(null, 'French - Business B1.2')).toBe('french');
  });

  it('bahasa daerah memakai budaya setempat walaupun bendera negaranya sama', () => {
    expect(courseCertificateTheme('id', 'Jawa')).toBe('javanese');
    expect(courseCertificateTheme('id', 'Sunda')).toBe('sundanese');
    expect(courseCertificateTheme('id', 'Bali')).toBe('balinese');
    expect(courseCertificateTheme('in', 'Tamil')).toBe('tamil');
    expect(courseCertificateTheme('in', 'Punjabi')).toBe('punjabi');
    expect(courseCertificateTheme('za', 'Afrikaans')).toBe('afrikaans');
    expect(courseCertificateTheme('za', 'Zulu')).toBe('zulu');
  });

  it('setiap bahasa katalog punya tema khusus, termasuk nama asli bahasanya', () => {
    const themes: string[] = [];
    for (const language of languages.filter(l => !examSlugs.has(l.slug) && l.slug !== 'esperanto')) {
      const theme = courseCertificateTheme(certificateCountryCode(language.name), language.name);
      expect(theme, language.name).not.toBe('watercolor-landscape');
      expect(courseCertificateTheme(certificateCountryCode(language.nativeName), language.nativeName), language.nativeName).toBe(theme);
      expect(courseCertificateTheme(certificateCountryCode(language.slug), language.slug), language.slug).toBe(theme);
      themes.push(theme);
    }
    expect(new Set(themes).size).toBe(themes.length);
  });

  it('Esperanto dan bahasa tak dikenal tidak diberi landmark negara lain', () => {
    expect(courseCertificateTheme(null, 'Esperanto')).toBe('watercolor-landscape');
    expect(courseCertificateTheme(null, 'Bahasa tidak dikenal')).toBe('watercolor-landscape');
    expect(courseCertificateTheme(null, 'Kurdi')).toBe('kurdish');
  });

  it('aset ilustrasi tersedia untuk seluruh negara dan bahasa katalog', () => {
    const themes = new Set(Object.values(CERTIFICATE_COUNTRY_THEMES));
    for (const language of languages) themes.add(courseCertificateTheme(certificateCountryCode(language.name), language.name));
    themes.add(courseCertificateTheme('za', 'Afrikaans'));
    for (const theme of themes) expect(existsSync(join(process.cwd(), 'public/images/certificates', `${theme}.webp`)), theme).toBe(true);
  });
});
