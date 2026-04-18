#!/usr/bin/env node
// multi-slot-booking.mjs
// Upgrades BookingModal di /akun untuk support pilih multiple slots sekaligus.
// Perubahan:
//   - selectedSlot (single string) → selectedSlots (Set<string>)
//   - Slot button: toggle on/off, bisa pilih banyak
//   - Footer: "Pilih X sesi" + list preview yang dipilih
//   - Submit: INSERT multiple rows ke schedules sekaligus
//
// Usage: drag ke ~/linguo-landing → cd ~/linguo-landing → node multi-slot-booking.mjs

import fs from 'fs';
import { execSync } from 'child_process';

const PAGE = 'src/app/akun/page.tsx';
if (!fs.existsSync(PAGE)) { console.error('❌ Run di ~/linguo-landing'); process.exit(1); }

let src = fs.readFileSync(PAGE, 'utf8');
const orig = src;

// ── 1. Replace state: selectedSlot → selectedSlots ──────────────────────────
// Handle both possible state declarations
if (src.includes('selectedSlot, setSelectedSlot') && !src.includes('selectedSlots, setSelectedSlots')) {
  src = src.replace(
    /const \[selectedSlot,\s*setSelectedSlot\]\s*=\s*useState<string \| null>\(null\);/,
    `const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());`
  );
  console.log('✓ Replaced selectedSlot state with selectedSlots Set');
}

// ── 2. Reset slots on modal close ────────────────────────────────────────────
src = src.replace(/setSelectedSlot\(null\)/g, 'setSelectedSlots(new Set())');
console.log('✓ Replaced setSelectedSlot(null) → setSelectedSlots(new Set())');

// ── 3. Replace submitBooking function ────────────────────────────────────────
const oldSubmitPattern = /async function submitBooking\(\)[^}]+(?:\{[^}]*\}[^}]*)*\}/s;
// More targeted: find submitBooking function body
const submitStart = src.indexOf('async function submitBooking()');
if (submitStart > -1) {
  // Find matching closing brace
  let depth = 0;
  let i = submitStart;
  let inFunc = false;
  while (i < src.length) {
    if (src[i] === '{') { depth++; inFunc = true; }
    if (src[i] === '}') { depth--; }
    if (inFunc && depth === 0) { i++; break; }
    i++;
  }
  const oldSubmit = src.slice(submitStart, i);
  const newSubmit = `async function submitBooking() {
    if (!bookingReg || selectedSlots.size === 0) return;
    setIsSubmitting(true);
    try {
      const rows = Array.from(selectedSlots).map((slot) => ({
        registration_id: bookingReg.id,
        teacher_id: bookingReg.teacher_id,
        student_id: student?.id,
        scheduled_at: slot,
        duration_minutes: bookingReg.duration || 60,
        status: 'pending',
        student_confirmed: true,
        student_confirmed_at: new Date().toISOString(),
        notes: 'Menunggu konfirmasi pengajar',
      }));
      const { error } = await supabase.from('schedules').insert(rows);
      if (error) throw error;
      setBookingReg(null);
      setSelectedSlots(new Set());
      alert(\`✅ \${rows.length} sesi berhasil di-booking! Menunggu konfirmasi pengajar.\`);
    } catch (e: any) {
      alert('Gagal booking: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  }`;
  src = src.slice(0, submitStart) + newSubmit + src.slice(i);
  console.log('✓ Replaced submitBooking() with multi-slot version');
}

// ── 4. Replace slot button JSX ───────────────────────────────────────────────
// Find the slot button that uses selectedSlot === s.iso
const oldSlotBtn = src.match(/<button[\s\S]*?selectedSlot\s*===\s*s\.iso[\s\S]*?<\/button>/);
if (oldSlotBtn && oldSlotBtn.index !== undefined) {
  const newSlotBtn = `<button
                        key={s.iso}
                        onClick={() => {
                          if (s.past || s.booked) return;
                          setSelectedSlots((prev) => {
                            const next = new Set(prev);
                            if (next.has(s.iso)) next.delete(s.iso);
                            else next.add(s.iso);
                            return next;
                          });
                        }}
                        disabled={s.past || s.booked}
                        className={\`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all \${
                          selectedSlots.has(s.iso)
                            ? 'bg-green-600 text-white border-green-600 ring-2 ring-green-300'
                            : s.past || s.booked
                            ? 'bg-gray-100 text-gray-400 line-through cursor-not-allowed border-gray-200'
                            : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                        }\`}
                      >
                        {s.time}
                      </button>`;
  src = src.slice(0, oldSlotBtn.index) + newSlotBtn + src.slice(oldSlotBtn.index + oldSlotBtn[0].length);
  console.log('✓ Replaced slot button with multi-select toggle');
} else {
  // try alternate pattern
  console.log('⚠️  Slot button pattern not found with selectedSlot — trying alternate...');
  const altBtn = src.match(/<button[\s\S]{0,200}?selectedSlot[\s\S]{0,400}?<\/button>/);
  if (altBtn && altBtn.index !== undefined) {
    const newSlotBtn2 = `<button
                        key={s.iso}
                        onClick={() => {
                          if (s.past || s.booked) return;
                          setSelectedSlots((prev) => {
                            const next = new Set(prev);
                            if (next.has(s.iso)) next.delete(s.iso);
                            else next.add(s.iso);
                            return next;
                          });
                        }}
                        disabled={s.past || s.booked}
                        className={\`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all \${
                          selectedSlots.has(s.iso)
                            ? 'bg-green-600 text-white border-green-600 ring-2 ring-green-300'
                            : s.past || s.booked
                            ? 'bg-gray-100 text-gray-400 line-through cursor-not-allowed border-gray-200'
                            : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                        }\`}
                      >
                        {s.time}
                      </button>`;
    src = src.slice(0, altBtn.index) + newSlotBtn2 + src.slice(altBtn.index + altBtn[0].length);
    console.log('✓ Replaced slot button (alternate pattern)');
  } else {
    console.log('⚠️  Could not find slot button — may need manual update');
  }
}

// ── 5. Replace footer (selected slot preview + booking button) ───────────────
// Find the footer that shows selectedSlot info and Booking button
const footerPattern = src.match(/📌[\s\S]{0,300}?<button[\s\S]{0,300}?Booking[\s\S]{0,100}?<\/button>/);
if (footerPattern && footerPattern.index !== undefined) {
  const newFooter = `{selectedSlots.size > 0 && (
                <div className="mt-3 p-3 bg-green-50 rounded-xl text-xs text-green-800 space-y-1">
                  <div className="font-semibold">📌 {selectedSlots.size} sesi dipilih:</div>
                  {Array.from(selectedSlots).sort().map((iso) => (
                    <div key={iso} className="flex items-center gap-1">
                      <span>•</span>
                      <span>{new Date(iso).toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} WIB</span>
                      <button onClick={() => setSelectedSlots((p) => { const n = new Set(p); n.delete(iso); return n; })} className="ml-auto text-red-400 hover:text-red-600">✕</button>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={submitBooking}
                disabled={selectedSlots.size === 0 || isSubmitting}
                className="mt-3 w-full py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Menyimpan…' : selectedSlots.size > 0 ? \`Booking \${selectedSlots.size} Sesi →\` : 'Pilih slot dulu'}
              </button>`;
  src = src.slice(0, footerPattern.index) + newFooter + src.slice(footerPattern.index + footerPattern[0].length);
  console.log('✓ Replaced footer with multi-slot preview + dynamic button');
} else {
  console.log('⚠️  Footer pattern not found — may need manual update for preview list');
}

// ── 6. Fix isSubmitting state if not exist ────────────────────────────────────
if (!src.includes('isSubmitting') || !src.includes('setIsSubmitting')) {
  src = src.replace(
    /const \[selectedSlots, setSelectedSlots\]/,
    `const [isSubmitting, setIsSubmitting] = useState(false);\n  const [selectedSlots, setSelectedSlots]`
  );
  console.log('✓ Added isSubmitting state');
}

if (src !== orig) {
  fs.writeFileSync(PAGE, src);
  console.log('✓ Saved', PAGE);
} else {
  console.log('⚠️  No changes made — check anchors above');
}

try {
  execSync('git add -A', { stdio: 'inherit' });
  try {
    execSync('git commit -m "feat(akun): multi-slot booking — select multiple sessions at once"', { stdio: 'inherit' });
  } catch { console.log('ℹ️  Nothing new.'); }
  execSync('git push', { stdio: 'inherit' });
  console.log('✅ Pushed!');
  fs.unlinkSync(process.argv[1]);
  console.log('🗑️  Self-deleted.');
} catch (e) { console.error('❌ Git failed:', e.message); }
