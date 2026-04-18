#!/usr/bin/env node
// fix-modal-supabase-import.mjs
// ClassDetailModal.tsx imports `createClient` tapi file supabase-client.ts export `supabase` instance langsung.
// Fix: replace `import { createClient } from '@/lib/supabase-client'` dengan `import { supabase } from '@/lib/supabase-client'`
// and remove all `const supabase = createClient();` lines.
//
// Usage: drag ke ~/linguo-landing → cd ~/linguo-landing → node fix-modal-supabase-import.mjs

import fs from 'fs';
import { execSync } from 'child_process';

const FILE = 'src/components/ClassDetailModal.tsx';
if (!fs.existsSync(FILE)) {
  console.error('❌ ' + FILE + ' ga ketemu. Run di folder ~/linguo-landing.');
  process.exit(1);
}

let src = fs.readFileSync(FILE, 'utf8');
const orig = src;

// 1) Fix import
src = src.replace(
  /import\s*\{\s*createClient\s*\}\s*from\s*['"]@\/lib\/supabase-client['"]\s*;?/g,
  `import { supabase } from '@/lib/supabase-client';`
);

// 2) Remove all `const supabase = createClient();` lines (with surrounding whitespace-only line)
src = src.replace(/^\s*const\s+supabase\s*=\s*createClient\(\)\s*;\s*\n/gm, '');

if (src === orig) {
  console.log('ℹ️  Tidak ada perubahan (udah fix?).');
} else {
  fs.writeFileSync(FILE, src);
  console.log('✓ Fixed imports & removed createClient() calls in', FILE);
}

// Quick sanity check
const stillBroken = /createClient/.test(src);
if (stillBroken) {
  console.log('⚠️  Masih ada "createClient" di file. Cek manual.');
} else {
  console.log('✓ Tidak ada sisa "createClient" di file.');
}

// Git push
try {
  console.log('\n🔄 git add / commit / push...');
  execSync('git add -A', { stdio: 'inherit' });
  try {
    execSync('git commit -m "fix(modal): use direct supabase instance instead of createClient"', { stdio: 'inherit' });
  } catch {
    console.log('ℹ️  Nothing to commit.');
  }
  execSync('git push', { stdio: 'inherit' });
  console.log('\n✅ Pushed.');

  fs.unlinkSync(process.argv[1]);
  console.log('🗑️  Self-deleted.');
} catch (e) {
  console.error('\n❌ Git failed:', e.message);
}
