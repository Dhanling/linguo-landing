// Menyimpan atlas 16 kartu sesi asli untuk chapter pertama setiap bahasa.
import fs from 'node:fs/promises';
import sharp from 'sharp';
const [slug,source]=process.argv.slice(2);
if(!/^[a-z-]+$/.test(slug||'')||!source)throw Error('Butuh slug dan sumber Imagegen');
const asset=`public/images/silabus/first-chapter-v1/${slug}.webp`;
await fs.mkdir('public/images/silabus/first-chapter-v1',{recursive:true});
await sharp(source).webp({quality:92}).toFile(asset);
const {width,height}=await sharp(source).metadata();
await fs.writeFile(`reports/silabus-first-chapter-v1/${slug}.json`,JSON.stringify({slug,source,asset,width,height,columns:4,rows:4,generator:'Codex built-in image_gen',completedAt:new Date().toISOString()},null,2)+'\n');
console.log(`${slug}: ${width}×${height}`);
