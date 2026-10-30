import { certificateCountryCode, courseCertificateTheme } from './courseCertificateTheme';
import { certificatePreviewUrl } from './certificateImages';

// Daftar tema rapor yang sudah memiliki hasil imagegen khusus.
export const REPORT_BRUSH_THEMES = [
  "american",
  "japanese",
  "korean",
  "mandarin",
  "spanish",
  "french",
  "german",
  "italian",
  "arabic",
  "hebrew",
  "persian",
  "javanese",
  "sundanese",
  "betawi",
  "indonesian",
  "georgian",
  "greek",
  "portuguese",
  "brazilian",
  "dutch",
  "russian",
  "swedish",
  "norwegian",
  "danish",
  "finnish",
  "polish",
  "czech",
  "hungarian",
  "romanian",
  "turkish",
  "bulgarian",
  "ukrainian",
  "icelandic",
  "irish",
  "bosnian",
  "cantonese",
  "vietnamese",
  "thai",
  "filipino",
  "malay",
  "khmer",
  "lao",
  "burmese",
  "hindi",
  "urdu",
  "bengali",
  "tamil",
  "punjabi",
  "nepali",
  "mongolian",
  "kurdish",
  "balinese",
  "minangkabau",
  "batak",
  "bugis",
  "acehnese",
  "banjar",
  "madurese",
  "swahili",
  "zulu",
  "yoruba",
  "amharic",
  "asl",
  "bisindo",
  "latin",
  "watercolor-landscape",
  "armenian"
] as const;
const reportThemes = new Set<string>(REPORT_BRUSH_THEMES);

export function reportIllustration(language: string): { theme: string; preview: string; print: string } {
  const country = certificateCountryCode(language);
  const theme = courseCertificateTheme(country, language);
  if (reportThemes.has(theme)) return {
    theme,
    preview: `/images/reports/brush-v1/${theme}-preview.webp`,
    print: `/images/reports/brush-v1/${theme}.webp`,
  };
  // Nama kelas lama di luar katalog tetap memakai ilustrasi sertifikatnya.
  return { theme, preview: certificatePreviewUrl(country, language), print: `/images/certificates/${theme}.webp` };
}
