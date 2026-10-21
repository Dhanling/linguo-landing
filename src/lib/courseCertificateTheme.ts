// Ilustrasi khusus bahasa utama; bahasa lainnya memakai lanskap dengan arsitektur
// yang divariasikan secara stabil menurut nama bahasa (termasuk bahasa daerah).
const THEMES: Record<string, string> = {
  hk: 'cantonese', cn: 'mandarin', jp: 'japanese', kr: 'korean', gb: 'english', us: 'english',
  sa: 'arabic', nl: 'dutch', fr: 'french', de: 'german', es: 'spanish', it: 'italian',
  ru: 'russian', in: 'hindi', id: 'indonesian', pt: 'portuguese', br: 'brazilian',
  th: 'thai', vn: 'vietnamese', tr: 'turkish', gr: 'greek',
};
export function courseCertificateTheme(code: string | null, language?: string): string {
  if (code === 'id' && language && !/^(BIPA|Indonesian|Indonesia|Bahasa Indonesia)$/i.test(language)) return 'watercolor-landscape';
  if (code === 'in' && language && !/^Hindi$/i.test(language)) return 'watercolor-landscape';
  return THEMES[code || ''] || 'watercolor-landscape';
}
