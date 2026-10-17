// Tema mengikuti bahasa; bahasa lain tetap memperoleh desain internasional.
export function courseCertificateTheme(code: string | null): string {
  if (code === 'hk') return 'cantonese';
  if (code === 'jp') return 'japanese';
  if (code === 'kr') return 'korean';
  if (code === 'cn') return 'mandarin';
  if (['us', 'gb'].includes(code || '')) return 'english';
  if (['sa', 'ae', 'ir', 'il', 'pk', 'af'].includes(code || '')) return 'arabic';
  if (['vn', 'th', 'kh', 'la', 'mm', 'my', 'ph'].includes(code || '')) return 'southeastasia';
  if (code === 'id') return 'indonesia';
  if (['fr', 'de', 'es', 'it', 'pt', 'br', 'ru', 'nl', 'gr', 'tr', 'pl', 'cz', 'dk', 'se', 'fi', 'no', 'hu', 'ro', 'bg', 'ua', 'is', 'ba', 'rs', 'hr', 'sk', 'si', 'al', 'lt', 'lv', 'ee', 'mk', 'ie', 'gb-wls', 'es-ct', 'va'].includes(code || '')) return 'europe';
  return 'world';
}
