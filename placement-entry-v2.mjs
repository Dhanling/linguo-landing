#!/usr/bin/env node
// Add Placement Test entry: hero link + dropdown
// Run: cd ~/linguo-landing && node placement-entry-v2.mjs

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
// B. Hero: insert link setelah "Gratis konsultasi pertama via WhatsApp"
// ============================================================
console.log('🔧 [B] Hero text link...\n');

const heroAnchor = 'Gratis konsultasi pertama via WhatsApp":"Free first consultation via WhatsApp"}</p>';
const heroIdx = content.indexOf(heroAnchor);

if (content.includes('Tes level kamu dulu')) {
  console.log('  ✓ Hero placement link sudah ada');
} else if (heroIdx !== -1) {
  const insertAfter = heroIdx + heroAnchor.length;
  const linkHtml = `
              <a href="/silabus/english/coba" className="inline-flex items-center gap-1.5 text-xs mt-3 group">
                <span className="text-white/40">{lang==="id"?"Bingung mulai dari mana?":"Not sure where to start?"}</span>
                <span className="text-[#fbbf24] font-semibold group-hover:underline">{lang==="id"?"Tes level kamu dulu →":"Test your level first →"}</span>
              </a>`;
  content = content.slice(0, insertAfter) + linkHtml + content.slice(insertAfter);
  changes.push('Hero: "Tes level kamu dulu →" link added below WA text');
} else {
  console.log('  ⚠️  Hero anchor "Gratis konsultasi..." tidak ditemukan');
  // Fallback: cari pattern lebih pendek
  const fallback = 'Free first consultation via WhatsApp"}</p>';
  const fbIdx = content.indexOf(fallback);
  if (fbIdx !== -1) {
    const insertAfter = fbIdx + fallback.length;
    const linkHtml = `
              <a href="/silabus/english/coba" className="inline-flex items-center gap-1.5 text-xs mt-3 group">
                <span className="text-white/40">{lang==="id"?"Bingung mulai dari mana?":"Not sure where to start?"}</span>
                <span className="text-[#fbbf24] font-semibold group-hover:underline">{lang==="id"?"Tes level kamu dulu →":"Test your level first →"}</span>
              </a>`;
    content = content.slice(0, insertAfter) + linkHtml + content.slice(insertAfter);
    changes.push('Hero: "Tes level kamu dulu →" link added (fallback match)');
  } else {
    console.log('  ⚠️  Fallback juga ga match');
  }
}

// ============================================================
// A. Dropdown "Our Program": insert Placement Test entry
// ============================================================
console.log('\n🔧 [A] Dropdown "Our Program"...\n');

// Strategy: find the area where dropdown items are listed
// From grep, dropdown items include "Kelas Private" as links/buttons
// Pattern: look for JSX section with dropdown items
// The dropdown items are probably onClick handlers that call window.__openFunnel
// or simple <a> / <button> elements in a dropdown container

// Search for the dropdown by finding where "Kelas Private" appears as a clickable item near "Our Program"
const lines = content.split('\n');
let dropdownInsertLine = -1;

// Find first occurrence of "Kelas Private" that's inside a link/button (dropdown item)
// NOT the product card data (line 401 has id:"Kelas Private" which is card data)
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  // Dropdown items pattern: onClick that triggers openFunnel with "Kelas Private"
  // Or: <a/Link> with text "Kelas Private" inside dropdown
  // From earlier mobile drawer investigation, dropdown items are in the area that has
  // onClick setOpen with scrollTo, href links, etc.
  // Look for a button/link that just says "Kelas Private" (not desc/price/etc)
  if (
    (l.includes('>Kelas Private<') || l.includes("'>Kelas Private'")) &&
    !l.includes('desc:') &&
    !l.includes('title:') &&
    !l.includes('label:')
  ) {
    dropdownInsertLine = i;
    console.log(`  📍 Found "Kelas Private" dropdown item at line ${i + 1}: ${l.trim().slice(0, 80)}`);
    break;
  }
}

// If not found with simple text match, try broader approach
if (dropdownInsertLine === -1) {
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    // Look for scrollTo("kelas-private") or href to "#kelas-private" or onClick with openFunnel "Kelas Private"
    if (
      l.includes('scrollTo') && l.includes('Kelas Private') ||
      l.includes('__openFunnel') && l.includes('Kelas Private') && i < 200 // only in top part (nav area)
    ) {
      dropdownInsertLine = i;
      console.log(`  📍 Found Kelas Private interaction at line ${i + 1}: ${l.trim().slice(0, 80)}`);
      break;
    }
  }
}

// Now scan backward from dropdownInsertLine to find the start of this item's block
// Then insert a Placement Test entry before it
if (content.includes('Placement Test Gratis') && content.includes('/silabus/english/coba')) {
  console.log('  ✓ Placement Test dropdown entry sudah ada');
} else if (dropdownInsertLine >= 0) {
  // We insert a new dropdown item BEFORE the Kelas Private line
  // Match the style: it's likely a <button> or <a> with similar className
  const indent = (lines[dropdownInsertLine].match(/^\s*/) || [''])[0];
  const placementEntry = `${indent}<a href="/silabus/english/coba" className="block py-2.5 text-sm text-[#1A9E9E] font-semibold hover:text-[#147a7a] border-b border-gray-100 mb-1 pb-3">🎯 Placement Test Gratis</a>`;
  lines.splice(dropdownInsertLine, 0, placementEntry);
  content = lines.join('\n');
  changes.push('Dropdown: "🎯 Placement Test Gratis" inserted above Kelas Private');
} else {
  console.log('  ⚠️  Dropdown Kelas Private item tidak ditemukan');
  console.log('  💡 Run: grep -n ">Kelas Private<\\|Kelas Private<\\/a\\|Kelas Private<\\/button" src/app/page.tsx');
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
  execSync('git commit -m "feat: placement test entry in hero + dropdown"', { stdio: 'inherit', cwd: ROOT });
  execSync('git push', { stdio: 'inherit', cwd: ROOT });
  console.log('\n✅ Pushed\n');
} catch (e) {
  console.log('\n⚠️  Git error:', e.message);
  console.log('Manual: cd ~/linguo-landing && git add -A && git commit -m "feat: placement entry" && git push');
}

try { fs.unlinkSync(fileURLToPath(import.meta.url)); } catch {}
