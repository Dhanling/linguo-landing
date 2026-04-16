#!/usr/bin/env node
// Fix: add optional `tip?: string` ke Question interface
// Jalankan di terminal: cd ~/linguo-landing && node fix-tip-type.mjs

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const filePath = path.join(ROOT, 'src/data/placement/english.ts');

if (!fs.existsSync(filePath)) {
  console.error('❌ File tidak ada. Run dari ~/linguo-landing');
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

if (content.includes('tip?: string')) {
  console.log('✓ tip?: string sudah ada, ga perlu fix');
} else {
  // Cari line "explanation: string;" (dengan atau tanpa komentar di belakangnya)
  const newContent = content.replace(
    /(\s*)explanation: string;[^\n]*/,
    '$1explanation: string;\n$1tip?: string;'
  );

  if (newContent === content) {
    console.log('⚠️  Pattern "explanation: string;" tidak ditemukan. Isi file:\n');
    console.log(content.slice(0, 500));
    process.exit(1);
  }

  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log('✅ tip?: string ditambahkan');
}

// Verify
const verify = fs.readFileSync(filePath, 'utf8');
const match = verify.match(/explanation:[^\n]+\n[^\n]+/);
if (match) {
  console.log('\n📋 Verifikasi:');
  console.log(match[0]);
}

// Git commit + push
console.log('\n🚀 Git commit + push...\n');
try {
  execSync('git add -A', { stdio: 'inherit', cwd: ROOT });
  execSync('git commit -m "fix: add optional tip field to Question type"', { stdio: 'inherit', cwd: ROOT });
  execSync('git push', { stdio: 'inherit', cwd: ROOT });
  console.log('\n✅ Pushed\n');
} catch (e) {
  console.log('\n⚠️  Git error:', e.message);
  console.log('Manual: cd ~/linguo-landing && git add -A && git commit -m "fix" && git push');
}

try { fs.unlinkSync(fileURLToPath(import.meta.url)); } catch {}
