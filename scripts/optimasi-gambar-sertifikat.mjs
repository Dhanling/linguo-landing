// Buat aset layar ringan; gambar sumber tetap dipakai untuk unduhan PDF.
import sharp from 'sharp';
import { mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
const root = path.join(process.cwd(), 'public/images/certificates');
const target = path.join(root, 'preview-v1');
await mkdir(target, { recursive: true });
let sumber = 0, pratinjau = 0;
for (const file of (await readdir(root)).filter(f => f.endsWith('.webp') && !f.startsWith('logo-'))) {
  const input = path.join(root, file);
  const output = path.join(target, file);
  await sharp(input).resize({ width: 1120, withoutEnlargement: true }).webp({ quality: 52, effort: 6 }).toFile(output);
  sumber += (await stat(input)).size;
  pratinjau += (await stat(output)).size;
}
await sharp('public/images/full-logo-linguo-hijau.png').resize({ width: 768, withoutEnlargement: true }).webp({ quality: 90 }).toFile(path.join(root, 'logo-v1.webp'));
console.log(JSON.stringify({ sumber, pratinjau, penghematanPersen: Math.round((1 - pratinjau / sumber) * 100) }));
