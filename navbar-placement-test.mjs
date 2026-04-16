#!/usr/bin/env node
// 1. Ganti "Mulai Belajar" di navbar (desktop + mobile) jadi "Placement Test" link ke /silabus/english/coba
// 2. Hapus hero "Tes level kamu dulu" link (ga perlu lagi karena ada di navbar)
// Run: cd ~/linguo-landing && node navbar-placement-test.mjs

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const pagePath = path.join(ROOT, 'src/app/page.tsx');

if (!fs.existsSync(pagePath)) {
  console.error('❌ Run dari ~/linguo-landing');
  process.exit(1);
}

let content = fs.readFileSync(pagePath, 'utf8');
const before = content;
const changes = [];

// ============================================================
// 1. Desktop navbar (line 119): button onClick → openFunnel → ganti jadi <a> ke placement test
// ============================================================
console.log('🔧 [1/3] Desktop navbar "Mulai Belajar" → "Placement Test"...\n');

const desktopOld = '<button onClick={()=>(window as any).__openFunnel?.("")} className="bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold px-6 py-2.5 rounded-full text-sm transition-all active:scale-95">Mulai Belajar</button>';
const desktopNew = '<a href="/silabus/english/coba" className="bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold px-6 py-2.5 rounded-full text-sm transition-all active:scale-95">Placement Test</a>';

if (content.includes(desktopOld)) {
  content = content.replace(desktopOld, desktopNew);
  changes.push('Desktop navbar: "Mulai Belajar" → "Placement Test" (link ke /silabus/english/coba)');
} else {
  console.log('  ⚠️  Desktop pattern tidak match exact');
  // Fallback: cari pattern lebih lenient
  const fb = /(<button[^>]*__openFunnel\?\.\(""\)[^>]*className="bg-\[#fbbf24\][^"]*"[^>]*>)Mulai Belajar(<\/button>)/;
  if (fb.test(content)) {
    content = content.replace(fb, '<a href="/silabus/english/coba" className="bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold px-6 py-2.5 rounded-full text-sm transition-all active:scale-95">Placement Test</a>');
    changes.push('Desktop navbar: "Mulai Belajar" → "Placement Test" (fallback match)');
  } else {
    console.log('  ⚠️  Fallback juga ga match');
  }
}

// ============================================================
// 2. Mobile drawer (line 137): button onClick → openFunnel → ganti jadi <a>
// ============================================================
console.log('🔧 [2/3] Mobile drawer "Mulai Belajar" → "Placement Test"...\n');

const mobileOld = '<button onClick={()=>{(window as any).__openFunnel?.("");setOpen(false)}} className="mt-2 bg-[#1A9E9E] text-white text-center py-3 rounded-full font-semibold text-sm w-full">Mulai Belajar</button>';
const mobileNew = '<a href="/silabus/english/coba" onClick={()=>setOpen(false)} className="mt-2 bg-[#1A9E9E] text-white text-center py-3 rounded-full font-semibold text-sm w-full block">Placement Test</a>';

if (content.includes(mobileOld)) {
  content = content.replace(mobileOld, mobileNew);
  changes.push('Mobile drawer: "Mulai Belajar" → "Placement Test"');
} else {
  console.log('  ⚠️  Mobile pattern tidak match exact');
  // Fallback
  const fb = /(<button[^>]*__openFunnel\?\.\(""\);setOpen\(false\)[^>]*className="mt-2 bg-\[#1A9E9E\][^"]*"[^>]*>)Mulai Belajar(<\/button>)/;
  if (fb.test(content)) {
    content = content.replace(fb, '<a href="/silabus/english/coba" onClick={()=>setOpen(false)} className="mt-2 bg-[#1A9E9E] text-white text-center py-3 rounded-full font-semibold text-sm w-full block">Placement Test</a>');
    changes.push('Mobile drawer: "Mulai Belajar" → "Placement Test" (fallback)');
  } else {
    console.log('  ⚠️  Fallback juga ga match');
  }
}

// ============================================================
// 3. Hapus hero "Tes level kamu dulu" link (line 755 area)
// ============================================================
console.log('🔧 [3/3] Hapus hero "Tes level kamu dulu" link...\n');

// Pattern dari script sebelumnya yang di-insert
const heroLinkPatterns = [
  // Pattern dari placement-entry-v2.mjs
  /\n\s*<a href="\/silabus\/english\/coba"[^>]*className="inline-flex items-center[^"]*"[^>]*>\s*<span[^>]*>[^<]*Bingung[^<]*<\/span>\s*<span[^>]*>[^<]*Tes level[^<]*<\/span>\s*<\/a>/,
  // Simpler pattern
  /\n[^\n]*Bingung mulai dari mana[^\n]*Tes level kamu dulu[^\n]*/,
  /\n[^\n]*Tes level kamu dulu[^\n]*/,
];

let heroRemoved = false;
for (const pat of heroLinkPatterns) {
  if (pat.test(content)) {
    content = content.replace(pat, '');
    changes.push('Hero: "Tes level kamu dulu" link removed');
    heroRemoved = true;
    break;
  }
}
if (!heroRemoved) {
  console.log('  ⚠️  Hero link pattern ga ketemu (mungkin sudah dihapus)');
}

// ============================================================
// Write + Git
// ============================================================
if (content === before) {
  console.log('\n⚠️  Tidak ada perubahan. Abort.\n');
  try { fs.unlinkSync(fileURLToPath(import.meta.url)); } catch {}
  process.exit(1);
}

fs.writeFileSync(pagePath, content, 'utf8');
console.log('\n═══════════════════════════════════════════════');
console.log('📋 Changes:');
changes.forEach((c) => console.log('   • ' + c));
console.log('═══════════════════════════════════════════════\n');

console.log('🚀 Git commit + push...\n');
try {
  execSync('git add -A', { stdio: 'inherit', cwd: ROOT });
  execSync('git commit -m "feat(nav): replace Mulai Belajar with Placement Test button"', { stdio: 'inherit', cwd: ROOT });
  execSync('git push', { stdio: 'inherit', cwd: ROOT });
  console.log('\n✅ Pushed\n');
} catch (e) {
  console.log('\n⚠️  Git error:', e.message);
  console.log('Manual: cd ~/linguo-landing && git add -A && git commit -m "feat: placement nav" && git push');
}

try { fs.unlinkSync(fileURLToPath(import.meta.url)); } catch {}
