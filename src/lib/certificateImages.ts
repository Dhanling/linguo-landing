import { certificateCountryCode, courseCertificateTheme } from './courseCertificateTheme';

export function certificatePreviewUrl(code: string | null, language: string): string {
  return `/images/certificates/preview-v1/${courseCertificateTheme(code, language)}.webp`;
}

const prefetched = new Set<string>();

// Muat hanya saat ada niat membuka sertifikat; jangan unduh semua tema sekaligus.
export function prefetchCertificatePreview(language: string): void {
  if (typeof window === 'undefined') return;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) return;
  const src = certificatePreviewUrl(certificateCountryCode(language), language);
  if (prefetched.has(src)) return;
  prefetched.add(src);
  const img = new window.Image();
  img.decoding = 'async';
  img.onerror = () => prefetched.delete(src);
  img.src = src;
}

// Mutu penuh hanya dimuat untuk ekspor, di dokumen salinan html2canvas.
export async function prepareCertificatePrintImages(paper: HTMLElement): Promise<void> {
  await Promise.all(Array.from(paper.querySelectorAll<HTMLImageElement>('img[data-certificate-print-src]')).map(async img => {
    const src = img.dataset.certificatePrintSrc;
    if (!src) return;
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
    img.loading = 'eager';
    img.src = src;
    await img.decode();
  }));
}
