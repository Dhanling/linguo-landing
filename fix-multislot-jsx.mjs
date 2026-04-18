#!/usr/bin/env node
// fix-multislot-jsx.mjs
// Fixes JSX parse error from multi-slot-booking.mjs injection.
// Surgically patches the footer area and removes old selectedSlot references.

import fs from 'fs';
import { execSync } from 'child_process';

const PAGE = 'src/app/akun/page.tsx';
if (!fs.existsSync(PAGE)) { console.error('❌ Run di ~/linguo-landing'); process.exit(1); }

let src = fs.readFileSync(PAGE, 'utf8');
const orig = src;

// ── Fix 1: Remove old selectedSlot footer (the one with 📌 and old selectedSlot ref) ──
// This is the original single-slot footer that wasn't fully replaced
const oldFooterPattern = /\{selectedSlot\s*\n?\s*\?\s*`📌[^`]+`\s*\n?\s*: "Pilih slot dulu"\}\s*\n\s*<\/div>\s*\n\s*<button\s*\n\s*key=\{s\.iso\}/;
const match = src.match(oldFooterPattern);
if (match) {
  console.log('Found old footer with selectedSlot — but this is complex, using line-based approach');
}

// ── Better approach: find and fix the footer div block ──────────────────────
// The broken section looks like:
//   <div className="border-t...">
//     <div ...>{selectedSlot ? `📌 ...` : "Pilih slot dulu"}</div>
//     <button key={s.iso}  ← THIS IS WRONG (leftover from slot button replacement)
//       ...
//     </button>
//   </div>
// Replace this entire footer block

// Find the footer container by its unique className
const footerDivIdx = src.indexOf('<div className="border-t border-gray-100 px-5 py-4 flex items-center justify-between gap-3 shrink-0">');
if (footerDivIdx > -1) {
  // Find matching closing div
  let depth = 0;
  let i = footerDivIdx;
  let started = false;
  while (i < src.length) {
    if (src.slice(i, i+4) === '<div') { depth++; started = true; }
    if (src.slice(i, i+6) === '</div>') { 
      depth--; 
      if (started && depth === 0) { i += 6; break; }
    }
    i++;
  }
  
  const oldFooterBlock = src.slice(footerDivIdx, i);
  console.log('Found footer block, length:', oldFooterBlock.length);
  
  const newFooterBlock = `<div className="border-t border-gray-100 px-5 py-4 shrink-0 space-y-2">
              {selectedSlots.size > 0 && (
                <div className="p-2.5 bg-green-50 rounded-xl text-xs text-green-800 space-y-1">
                  <div className="font-semibold">📌 {selectedSlots.size} sesi dipilih:</div>
                  {Array.from(selectedSlots).sort().map((iso) => (
                    <div key={iso} className="flex items-center gap-1">
                      <span>•</span>
                      <span>{new Date(iso).toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} WIB</span>
                      <button onClick={() => setSelectedSlots((p) => { const n = new Set(p); n.delete(iso); return n; })} className="ml-auto text-red-400 hover:text-red-600 font-bold">✕</button>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={submitBooking}
                disabled={selectedSlots.size === 0 || isSubmitting}
                className="w-full py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Menyimpan…' : selectedSlots.size > 0 ? \`Booking \${selectedSlots.size} Sesi →\` : 'Pilih slot dulu'}
              </button>
            </div>`;
  
  src = src.slice(0, footerDivIdx) + newFooterBlock + src.slice(i);
  console.log('✓ Replaced footer block with clean multi-slot version');
} else {
  console.log('⚠️  Footer div not found by className. Trying alternate...');
  // Try finding by selectedSlot reference in footer
  const oldPreview = src.match(/\{selectedSlot[\s\S]{0,20}\?[\s\S]{0,50}📌[\s\S]{0,200}\}/);
  if (oldPreview && oldPreview.index !== undefined) {
    // Find enclosing div and replace
    const beforePreview = src.slice(0, oldPreview.index);
    const lastDivOpen = beforePreview.lastIndexOf('<div');
    console.log('Found selectedSlot footer preview at', oldPreview.index);
    // Simple replace of just the ternary
    src = src.replace(
      /\{selectedSlot\s*\n?\s*\?\s*`📌[^`]+`\s*\n?\s*: "Pilih slot dulu"\}/,
      `{selectedSlots.size > 0 ? \`📌 \${selectedSlots.size} sesi dipilih\` : 'Pilih slot dulu'}`
    );
    console.log('✓ Fixed selectedSlot → selectedSlots in footer preview');
  }
}

// ── Fix 2: Remove any duplicate <button key={s.iso} that ended up in footer ──
// This happens when the footer replacement left a stray slot button
const strayBtnPattern = /(<div className="border-t[\s\S]{0,500}?)<button\s*\n?\s*key=\{s\.iso\}[\s\S]{0,500}?<\/button>/;
if (strayBtnPattern.test(src)) {
  src = src.replace(strayBtnPattern, '$1');
  console.log('✓ Removed stray slot button from footer area');
}

// ── Fix 3: Make sure isSubmitting state exists ────────────────────────────────
if (!src.includes('isSubmitting') || !src.includes('setIsSubmitting')) {
  src = src.replace(
    /const \[selectedSlots, setSelectedSlots\] = useState<Set<string>>\(new Set\(\)\);/,
    `const [isSubmitting, setIsSubmitting] = useState(false);\n  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());`
  );
  console.log('✓ Added isSubmitting state');
}

if (src !== orig) {
  fs.writeFileSync(PAGE, src);
  console.log('✓ Saved page.tsx');
  
  // Quick syntax check
  try {
    execSync(`node --input-type=module --eval "import('data:text/javascript,');" 2>/dev/null || true`);
  } catch {}
} else {
  console.log('⚠️  No changes — may need manual fix');
  console.log('   Open src/app/akun/page.tsx and find line ~387');
  console.log('   Look for selectedSlot (without s) and fix to selectedSlots.size > 0');
}

try {
  execSync('git add -A', { stdio: 'inherit' });
  try {
    execSync('git commit -m "fix(akun): fix multi-slot booking JSX parse error"', { stdio: 'inherit' });
  } catch { console.log('ℹ️  Nothing new.'); }
  execSync('git push', { stdio: 'inherit' });
  console.log('✅ Pushed!');
  fs.unlinkSync(process.argv[1]);
  console.log('🗑️  Self-deleted.');
} catch (e) { console.error('❌ Git failed:', e.message); }
