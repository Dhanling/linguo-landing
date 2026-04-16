#!/usr/bin/env node
// Add "Silabus" entry to Our Program dropdown (above Kelas Private)
// Run from ~/linguo-landing

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();

function findTsxFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (item.name === 'node_modules' || item.name.startsWith('.')) continue;
    const p = path.join(dir, item.name);
    if (item.isDirectory()) findTsxFiles(p, out);
    else if (item.name.endsWith('.tsx')) out.push(p);
  }
  return out;
}

console.log('🔍 Cari file yang mengandung "Kelas Private"...\n');

const allFiles = findTsxFiles(path.join(ROOT, 'src'));
const candidates = allFiles.filter((f) => {
  try {
    return fs.readFileSync(f, 'utf8').includes('Kelas Private');
  } catch { return false; }
});

console.log(`   Ditemukan ${candidates.length} file:`);
candidates.forEach((f) => console.log(`     • ${path.relative(ROOT, f)}`));

if (candidates.length === 0) {
  console.log('\n❌ Tidak ada file dengan "Kelas Private"');
  process.exit(1);
}

let patched = 0;

for (const file of candidates) {
  let content = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file);

  if (/Silabus.*\/silabus|\/silabus.*Silabus/.test(content)) {
    console.log(`\n   ⏭️  ${rel}: Silabus sudah ada, skip`);
    continue;
  }

  const lines = content.split('\n');
  let inserted = false;

  for (let i = 0; i < lines.length; i++) {
    if (!/Kelas Private/.test(lines[i])) continue;

    // Cari boundary entry: scan ke atas untuk cari line "{" pembuka object
    let startIdx = i;
    for (let j = i; j >= Math.max(0, i - 10); j--) {
      if (/\{\s*$/.test(lines[j]) || /^\s*\{/.test(lines[j])) {
        startIdx = j;
        break;
      }
    }

    // Scan ke bawah cari "}," atau "}"
    let endIdx = i;
    for (let j = i; j <= Math.min(lines.length - 1, i + 10); j++) {
      if (/\},?\s*$/.test(lines[j])) {
        endIdx = j;
        break;
      }
    }

    // Extract Kelas Private block sebagai template
    const block = lines.slice(startIdx, endIdx + 1);
    const indent = (lines[i].match(/^\s*/) || [''])[0];
    const blockIndent = (lines[startIdx].match(/^\s*/) || [''])[0];

    console.log(`\n   📍 ${rel} — "Kelas Private" entry at lines ${startIdx + 1}–${endIdx + 1}:`);
    block.forEach((l, k) => console.log(`       ${startIdx + k + 1}: ${l}`));

    // Buat Silabus entry dari template: copy struktur, replace values
    const silabusBlock = block.map((l) => {
      return l
        .replace(/["']Kelas Private["']/g, '"Silabus"')
        .replace(/Kelas Private/g, 'Silabus')
        .replace(/\/(program|kelas-private|private)[^"')}\s]*/g, '/silabus')
        .replace(/["']\/\/?[^"']*private[^"']*["']/gi, '"/silabus"');
    });

    // Fallback pattern: kalau href tidak ke-replace, coba pattern lain
    const joined = silabusBlock.join('\n');
    let finalBlock = silabusBlock;
    if (!/\/silabus/.test(joined)) {
      // Try to find href attribute and replace
      finalBlock = silabusBlock.map((l) => {
        if (/href\s*[:=]/.test(l)) {
          return l.replace(/(href\s*[:=]\s*["'])[^"']+(["'])/, '$1/silabus$2');
        }
        return l;
      });
    }

    console.log(`\n   ✨ Insert block baru SEBELUM line ${startIdx + 1}:`);
    finalBlock.forEach((l, k) => console.log(`       NEW: ${l}`));

    // Insert
    lines.splice(startIdx, 0, ...finalBlock);
    content = lines.join('\n');
    fs.writeFileSync(file, content, 'utf8');
    console.log(`\n   ✅ Patched ${rel}`);
    patched++;
    inserted = true;
    break;
  }

  if (!inserted) {
    console.log(`   ⚠️  ${rel}: tidak bisa detect boundary block`);
  }
}

console.log(`\n═══════════════════════════════════════════════`);
console.log(`Total file di-patch: ${patched}\n`);

if (patched > 0) {
  try {
    execSync('git add -A', { stdio: 'inherit', cwd: ROOT });
    execSync(
      'git commit -m "feat(nav): add Silabus link in Our Program dropdown"',
      { stdio: 'inherit', cwd: ROOT }
    );
    execSync('git push', { stdio: 'inherit', cwd: ROOT });
    console.log('\n✅ Pushed\n');
  } catch (e) {
    console.log('\n⚠️  Git error:', e.message);
  }
} else {
  console.log('\n⚠️  Tidak ada yang di-patch. Share isi file navbar ke Claude.');
}

// Self-delete
try { fs.unlinkSync(fileURLToPath(import.meta.url)); } catch {}
