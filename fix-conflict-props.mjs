#!/usr/bin/env node
// fix-conflict-props.mjs
import fs from 'fs';
import { execSync } from 'child_process';

const PAGE = 'src/app/akun/page.tsx';
if (!fs.existsSync(PAGE)) { console.error('❌ Run di ~/linguo-landing'); process.exit(1); }

let src = fs.readFileSync(PAGE, 'utf8');
const orig = src;

// Fix: s.past → s.isPast, s.booked → s.isBooked in isConflict line
src = src.replace(
  `const isConflict = !isSelected && !s.past && !s.booked && hasConflict(s.iso, bookingDuration, bookedSlots);`,
  `const isConflict = !isSelected && !s.isPast && !s.isBooked && hasConflict(s.iso, bookingDuration, bookedSlots);`
);

// Fix disabled prop
src = src.replace(
  `disabled={s.past || s.booked || isConflict}`,
  `disabled={s.isPast || s.isBooked || isConflict}`
);

// Fix className condition
src = src.replace(
  `s.past || s.booked || isConflict`,
  `s.isPast || s.isBooked || isConflict`
);

// Fix onClick guard
src = src.replace(
  `if (s.past || s.booked || isConflict) return;`,
  `if (s.isPast || s.isBooked || isConflict) return;`
);

// Fix title tooltip
src = src.replace(
  `title={isConflict ? \`Overlap dengan sesi lain (durasi \${bookingDuration} mnt)\` : ""}`,
  `title={isConflict ? \`Overlap — durasi \${bookingDuration} mnt bentrok dengan sesi lain\` : ""}`
);

if (src !== orig) {
  fs.writeFileSync(PAGE, src);
  console.log('✓ Fixed isPast/isBooked property names');
} else {
  console.log('⚠️  Pattern not found — checking existing props...');
  // Show context around line 1030
  const lines = src.split('\n');
  console.log('Lines 1025-1035:');
  lines.slice(1024, 1035).forEach((l, i) => console.log(1025+i+':', l));
}

try {
  execSync('git add -A', { stdio: 'inherit' });
  try { execSync('git commit -m "fix(akun): correct isPast/isBooked prop names in conflict detection"', { stdio: 'inherit' }); }
  catch { console.log('ℹ️  Nothing new.'); }
  execSync('git push', { stdio: 'inherit' });
  console.log('✅ Pushed!');
  fs.unlinkSync(process.argv[1]);
  console.log('🗑️  Self-deleted.');
} catch (e) { console.error('❌ Git failed:', e.message); }
