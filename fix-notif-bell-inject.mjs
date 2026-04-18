#!/usr/bin/env node
// fix-notif-bell-inject.mjs
// Fix: replace {studentId && <NotificationBell...} with correct variable

import fs from 'fs';
import { execSync } from 'child_process';

if (!fs.existsSync('src/app/akun/page.tsx')) {
  console.error('❌ Run di ~/linguo-landing'); process.exit(1);
}

let page = fs.readFileSync('src/app/akun/page.tsx', 'utf8');
const orig = page;

// Fix the injection — variable is 'student', id is student.id
// Replace the broken injection
page = page.replace(
  /\{studentId\s*&&\s*<NotificationBell\s+userId=\{studentId\}\s+userType="student"\s*\/>\}\n\s*/,
  `{student?.id && <NotificationBell userId={student.id} userType="student" />}\n              `
);

if (page === orig) {
  // Try alternate — maybe it was injected differently
  page = page.replace(
    /<NotificationBell userId=\{studentId\}/,
    '<NotificationBell userId={student?.id || ""}'
  );
}

if (page !== orig) {
  fs.writeFileSync('src/app/akun/page.tsx', page);
  console.log('✓ Fixed NotificationBell prop: studentId → student?.id');
} else {
  console.log('⚠️  Pattern not found — checking what we have...');
  const idx = page.indexOf('NotificationBell');
  if (idx > -1) {
    console.log('Context:', page.slice(Math.max(0, idx-50), idx+150));
  }
}

try {
  execSync('git add -A', { stdio: 'inherit' });
  try {
    execSync('git commit -m "fix(akun): fix NotificationBell userId prop variable name"', { stdio: 'inherit' });
  } catch { console.log('ℹ️  Nothing to commit.'); }
  execSync('git push', { stdio: 'inherit' });
  console.log('✅ Pushed!');
  fs.unlinkSync(process.argv[1]);
  console.log('🗑️  Self-deleted.');
} catch (e) { console.error('❌ Git failed:', e.message); }
