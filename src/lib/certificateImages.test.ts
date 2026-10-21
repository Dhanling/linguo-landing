import { describe, expect, it, vi } from 'vitest';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { certificatePreviewUrl, prepareCertificatePrintImages } from './certificateImages';
import { CERTIFICATE_COUNTRY_THEMES } from './courseCertificateTheme';

describe('pemuatan gambar sertifikat', () => {
  it('seluruh negara memakai preview lokal yang lebih ringan dari sumber PDF', () => {
    for (const [code, theme] of Object.entries(CERTIFICATE_COUNTRY_THEMES)) {
      const preview = certificatePreviewUrl(code, '');
      expect(preview).toContain('/preview-v1/');
      const original = path.join(process.cwd(), 'public/images/certificates', `${theme}.webp`);
      const file = path.join(process.cwd(), 'public', preview);
      expect(existsSync(file), theme).toBe(true);
      expect(statSync(file).size, theme).toBeLessThan(statSync(original).size * .4);
      expect(existsSync(path.join(process.cwd(), 'public/images/certificates/flags-v1', `${code}.png`)), code).toBe(true);
    }
  });

  it('ekspor menunggu gambar resolusi penuh siap sebelum dilanjutkan', async () => {
    let ready!: () => void;
    const decoded = new Promise<void>(resolve => { ready = resolve; });
    const image = { dataset: { certificatePrintSrc: '/images/certificates/american.webp' }, src: '/preview.webp', loading: 'lazy', removeAttribute: vi.fn(), decode: vi.fn(() => decoded) };
    const paper = { querySelectorAll: () => [image] } as unknown as HTMLElement;
    let finished = false;
    const exporting = prepareCertificatePrintImages(paper).then(() => { finished = true; });
    await Promise.resolve();
    expect(image.src).toBe('/images/certificates/american.webp');
    expect(finished).toBe(false);
    ready();
    await exporting;
    expect(finished).toBe(true);
  });

  it('ekspor gagal dengan jelas jika gambar kualitas penuh tidak dapat dimuat', async () => {
    const image = { dataset: { certificatePrintSrc: '/full.webp' }, removeAttribute: vi.fn(), decode: vi.fn().mockRejectedValue(new Error('Gambar gagal')) };
    await expect(prepareCertificatePrintImages({ querySelectorAll: () => [image] } as unknown as HTMLElement)).rejects.toThrow('Gambar gagal');
  });
});
