// Menyimpan hasil Imagegen sebagai atlas WebP untuk header dan kartu sesi.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const [slug, source] = process.argv.slice(2);
if (!/^[a-z-]+$/.test(slug || '') || !source) throw new Error('Butuh slug bahasa dan sumber PNG Imagegen');
const output = `public/images/silabus/scenes-v1/${slug}.webp`;
await fs.mkdir(path.dirname(output), { recursive: true });
await sharp(source).webp({ quality: 92 }).toFile(output);
const { width, height } = await sharp(source).metadata();
await fs.mkdir('reports/silabus-scenes-v1', { recursive: true });
await fs.writeFile(`reports/silabus-scenes-v1/${slug}.json`, JSON.stringify({ slug, source, asset: output, width, height, columns: 5, rows: 4, generator: 'Codex built-in image_gen', completedAt: new Date().toISOString() }, null, 2)+'\n');
console.log(`${slug}: ${width}×${height}`);
