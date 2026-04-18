#!/usr/bin/env node
// fix-phase3ab-jsx.mjs
// Hotfix: wrap the 📋 Detail button + existing Booking button in a Fragment <>…</>
// Karena mereka berdampingan di dalam single-child JSX expression (kemungkinan di dalam `&&` block),
// JSX parser nya crash. Fragment fixes it.
//
// Usage: drag ke ~/linguo-landing → cd ~/linguo-landing → node fix-phase3ab-jsx.mjs

import fs from 'fs';
import { execSync } from 'child_process';

const PAGE = 'src/app/akun/page.tsx';
if (!fs.existsSync(PAGE)) {
  console.error('❌ Script ini harus di-run di folder ~/linguo-landing');
  process.exit(1);
}

let src = fs.readFileSync(PAGE, 'utf8');
const orig = src;

// 1) Locate the Detail button we inserted — anchor: `setDetailReg(reg)` or `setDetailReg(r)`
const setDetailMatch = src.match(/setDetailReg\((reg|r)\)/);
if (!setDetailMatch || setDetailMatch.index === undefined) {
  console.error('❌ `setDetailReg(...)` ga ketemu. Script fix ini hanya jalan kalo phase3ab-detail-modal.mjs udah sempet inject detail button.');
  process.exit(1);
}
const setDetailIdx = setDetailMatch.index;

// 2) Walk backward to find `<button` opening of the Detail button
const beforeSet = src.slice(0, setDetailIdx);
const detailBtnOpenIdx = beforeSet.lastIndexOf('<button');
if (detailBtnOpenIdx < 0) {
  console.error('❌ `<button` opening untuk Detail ga ketemu.');
  process.exit(1);
}
console.log('✓ Found Detail button opening at index', detailBtnOpenIdx);

// 3) Find the "Booking Sesi Berikutnya" text AFTER the detail button
const bookingTextIdx = src.indexOf('Booking Sesi Berikutnya', setDetailIdx);
if (bookingTextIdx < 0) {
  console.error('❌ "Booking Sesi Berikutnya" ga ketemu setelah Detail button.');
  process.exit(1);
}

// 4) Find its closing `</button>`
const bookingCloseIdx = src.indexOf('</button>', bookingTextIdx);
if (bookingCloseIdx < 0) {
  console.error('❌ `</button>` penutup Booking button ga ketemu.');
  process.exit(1);
}
const bookingCloseEnd = bookingCloseIdx + '</button>'.length;
console.log('✓ Found Booking button closing at index', bookingCloseIdx);

// 5) Check if already wrapped in fragment (idempotent)
const peekBefore = src.slice(Math.max(0, detailBtnOpenIdx - 10), detailBtnOpenIdx);
if (peekBefore.trimEnd().endsWith('<>')) {
  console.log('ℹ️  Sudah ada Fragment wrapper. Skip.');
  process.exit(0);
}

// 6) Inject </> AFTER booking close (do this first, so earlier indices remain valid)
//    then inject <> BEFORE detail button open
let fixed = src.slice(0, bookingCloseEnd) + '</>' + src.slice(bookingCloseEnd);
fixed = fixed.slice(0, detailBtnOpenIdx) + '<>' + fixed.slice(detailBtnOpenIdx);

if (fixed === orig) {
  console.log('ℹ️  Gak ada perubahan. Aneh. Abort.');
  process.exit(0);
}

fs.writeFileSync(PAGE, fixed);
console.log('✓ Wrote', PAGE);
console.log('✓ Wrapped Detail+Booking buttons in <>…</> fragment');

// 7) git push + self-delete
try {
  console.log('\n🔄 git add / commit / push...');
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git commit -m "fix(akun): wrap Detail+Booking buttons in Fragment for valid JSX"', { stdio: 'inherit' });
  execSync('git push', { stdio: 'inherit' });
  console.log('\n✅ Pushed. Tunggu Vercel re-deploy.');

  fs.unlinkSync(process.argv[1]);
  console.log('🗑️  Self-deleted.');
} catch (e) {
  console.error('\n❌ Git failed:', e.message);
  console.error('   Jangan hapus script, cek error dulu.');
}
