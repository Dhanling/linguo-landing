/** Latar isi B1/B2 Portugis Brasil. A1/A2 memakai artwork yang sudah lengkap. */
export function portugueseBrBodyBackground(key: string): string | null {
  if (/^portuguese-br-b1-[1-5]$/.test(key)) return '/slide-cover/portuguese-br-b1-thematic-body-v1.jpg';
  if (/^portuguese-br-b2-[1-7]$/.test(key)) return '/slide-cover/portuguese-br-b2-thematic-body-v1.jpg';
  return null;
}

/** Panel putih bawaan gambar menyisakan sisi kanan untuk ilustrasi. */
export function isPortugueseBrBodyCover(cover?: string): boolean {
  return /^\/slide-cover\/portuguese-br-b[12]-thematic-body-v1\.jpg$/.test(cover || '');
}
