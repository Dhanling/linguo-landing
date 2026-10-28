// Pagar deploy: setiap bahasa memiliki header/adegan umum dan 16 kartu sesi asli.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import sharp from 'sharp';
const common = JSON.parse(await fs.readFile('reports/silabus-scenes-v1/jobs.json', 'utf8'));
const chapters = JSON.parse(await fs.readFile('reports/silabus-first-chapter-v1/jobs.json', 'utf8'));
if (common.map(j=>j.slug).sort().join() !== chapters.map(j=>j.slug).sort().join()) throw Error('Daftar bahasa kedua set berbeda');
const hashes = new Map();
const missing = [];
let bytes = 0;
for (const {slug,folder,ratio} of [
  ...common.map(j=>({slug:j.slug,folder:'scenes-v1',ratio:15/8})),
  ...chapters.map(j=>({slug:j.slug,folder:'first-chapter-v1',ratio:3/2})),
]) {
  const file = `public/images/silabus/${folder}/${slug}.webp`;
  let data;
  try { data = await fs.readFile(file); } catch { missing.push(`${folder}/${slug}`); continue; }
  const {width,height} = await sharp(data).metadata();
  if (!width || !height || width < 1500 || Math.abs(width/height - ratio) > .02) throw Error(`Ukuran atlas ${folder}/${slug} tidak cocok dengan bingkai kartu`);
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  if (hashes.has(hash)) throw Error(`${folder}/${slug} memakai aset yang sama dengan ${hashes.get(hash)}`);
  hashes.set(hash, `${folder}/${slug}`);
  bytes += data.length;
}
if (missing.length) throw Error(`Belum selesai: ${missing.join(', ')}`);
const count=chapters.reduce((n,j)=>n+j.sessions.length,0);
console.log(`${common.length} bahasa · ${common.length*20} adegan umum/header · ${count} kartu chapter awal · ${(bytes/1024/1024).toFixed(1)} MB · semua aset lengkap dan berbeda`);
