#!/usr/bin/env node
// fix-delete-old-notifs.mjs
// Delete StudentRealtimeNotifs.tsx (replaced by OneSignalProvider.tsx)
// and fix any remaining import references.

import fs from 'fs';
import { execSync } from 'child_process';

if (!fs.existsSync('src/app/akun/page.tsx')) {
  console.error('❌ Run di ~/linguo-landing');
  process.exit(1);
}

// Delete old file
const OLD = 'src/components/StudentRealtimeNotifs.tsx';
if (fs.existsSync(OLD)) {
  fs.unlinkSync(OLD);
  console.log('✓ Deleted', OLD);
} else {
  console.log('ℹ️  Already deleted:', OLD);
}

// Remove any remaining import of StudentRealtimeNotifs from page.tsx
let page = fs.readFileSync('src/app/akun/page.tsx', 'utf8');
const orig = page;
page = page.replace(/^import StudentRealtimeNotifs.*\n/m, '');
page = page.replace(/<StudentRealtimeNotifs\s*\/>/g, '');
if (page !== orig) {
  fs.writeFileSync('src/app/akun/page.tsx', page);
  console.log('✓ Removed StudentRealtimeNotifs references from page.tsx');
}

try {
  console.log('\n🔄 git add / commit / push...');
  execSync('git add -A', { stdio: 'inherit' });
  try {
    execSync('git commit -m "fix: delete old StudentRealtimeNotifs, replaced by OneSignalProvider"', { stdio: 'inherit' });
  } catch { console.log('ℹ️  Nothing to commit.'); }
  execSync('git push', { stdio: 'inherit' });
  console.log('\n✅ Pushed! Vercel akan re-deploy otomatis.');
  fs.unlinkSync(process.argv[1]);
  console.log('🗑️  Self-deleted.');
} catch (e) {
  console.error('\n❌ Git failed:', e.message);
}
