#!/usr/bin/env node
// booking-duration-conflict.mjs
// Adds duration picker + conflict detection to booking modal:
//   1. Duration dropdown (30/45/60/75/90 menit)
//   2. Conflict detection: grey-out slots that overlap with existing bookings
//   3. Shows duration info in modal header
//
// Usage: drag ke ~/linguo-landing → cd ~/linguo-landing → node booking-duration-conflict.mjs

import fs from 'fs';
import { execSync } from 'child_process';

const PAGE = 'src/app/akun/page.tsx';
if (!fs.existsSync(PAGE)) { console.error('❌ Run di ~/linguo-landing'); process.exit(1); }

let src = fs.readFileSync(PAGE, 'utf8');
const orig = src;
let changes = 0;

function replace(old, next, label) {
  if (src.includes(old)) {
    src = src.replace(old, next);
    console.log('✓', label);
    changes++;
    return true;
  }
  console.log('⚠️  NOT FOUND:', label);
  return false;
}

// ── 1. Add bookingDuration state ─────────────────────────────────────────────
replace(
  `const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());`,
  `const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [bookingDuration, setBookingDuration] = useState<number>(60); // menit`,
  'Add bookingDuration state'
);

// ── 2. Reset duration when opening booking ───────────────────────────────────
replace(
  `    setBookingReg(reg);
    setSelectedSlots(new Set());`,
  `    setBookingReg(reg);
    setSelectedSlots(new Set());
    setBookingDuration(Number(reg.duration) || 60);`,
  'Reset duration on openBooking'
);

// ── 3. Use bookingDuration in submitBooking ───────────────────────────────────
replace(
  `        duration_minutes: Number(bookingReg.duration) || 60,`,
  `        duration_minutes: bookingDuration,`,
  'Use bookingDuration in submitBooking'
);

// ── 4. Upgrade conflict detection in openBooking ────────────────────────────
// Replace the bookedSlots building logic to store full booking objects
replace(
  `    setBookedSlots(new Set((booked || []).map((b: any) => new Date(b.scheduled_at).toISOString())));`,
  `    // Store booked slots with duration for conflict detection
    setBookedSlots(new Set((booked || []).map((b: any) => \`\${new Date(b.scheduled_at).toISOString()}|\${b.duration_minutes || 60}\`)));`,
  'Store booked slots with duration'
);

// Update the fetch to include duration_minutes
replace(
  `      .select("scheduled_at")
      .eq("teacher_id", reg.teacher_id)`,
  `      .select("scheduled_at, duration_minutes")
      .eq("teacher_id", reg.teacher_id)`,
  'Fetch duration_minutes in booked slots query'
);

// ── 5. Add conflict check helper function (before openBooking) ───────────────
replace(
  `  async function openBooking(reg: StudentReg) {`,
  `  // Check if a slot conflicts with existing bookings
  function hasConflict(slotISO: string, durationMin: number, bookedSlotsSet: Set<string>): boolean {
    const slotStart = new Date(slotISO).getTime();
    const slotEnd = slotStart + durationMin * 60000;
    for (const entry of bookedSlotsSet) {
      const [existingISO, existingDurStr] = entry.split('|');
      const existingStart = new Date(existingISO).getTime();
      const existingDur = Number(existingDurStr) || 60;
      const existingEnd = existingStart + existingDur * 60000;
      // Overlap if: slotStart < existingEnd AND slotEnd > existingStart
      if (slotStart < existingEnd && slotEnd > existingStart) return true;
    }
    return false;
  }

  async function openBooking(reg: StudentReg) {`,
  'Add hasConflict helper function'
);

// ── 6. Update slot rendering to use conflict detection ───────────────────────
replace(
  `const isSelected = selectedSlots.has(s.iso);`,
  `const isSelected = selectedSlots.has(s.iso);
                                const isConflict = !isSelected && !s.past && !s.booked && hasConflict(s.iso, bookingDuration, bookedSlots);`,
  'Add isConflict check in slot rendering'
);

// ── 7. Update slot button className to show conflict ────────────────────────
replace(
  `                        className={\`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all \${
                          isSelected
                            ? "bg-green-600 text-white border-green-600 ring-2 ring-green-300"
                            : s.past || s.booked
                            ? "bg-gray-100 text-gray-400 line-through cursor-not-allowed border-gray-200"
                            : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                        }\`}`,
  `                        title={isConflict ? \`Overlap dengan sesi lain (durasi \${bookingDuration} mnt)\` : ""}
                        className={\`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all \${
                          isSelected
                            ? "bg-green-600 text-white border-green-600 ring-2 ring-green-300"
                            : s.past || s.booked || isConflict
                            ? "bg-gray-100 text-gray-400 line-through cursor-not-allowed border-gray-200"
                            : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                        }\`}`,
  'Update slot button className for conflict'
);

// ── 8. Update onClick to block conflict slots ────────────────────────────────
replace(
  `                        onClick={() => {
                                  setSelectedSlots((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(s.iso)) next.delete(s.iso);
                                    else next.add(s.iso);
                                    return next;
                                  });
                                }}
                        disabled={s.past || s.booked}`,
  `                        onClick={() => {
                                  if (s.past || s.booked || isConflict) return;
                                  setSelectedSlots((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(s.iso)) next.delete(s.iso);
                                    else next.add(s.iso);
                                    return next;
                                  });
                                }}
                        disabled={s.past || s.booked || isConflict}`,
  'Block conflict slots in onClick'
);

// ── 9. Add duration picker in modal header area ──────────────────────────────
replace(
  `      <p className="text-xs text-gray-500 mt-0.5">
                Pilih slot yang kosong (hijau) dalam 14 hari ke depan. Jam yang sudah dibook akan abu-abu.</p>`,
  `      <p className="text-xs text-gray-500 mt-0.5">
                Pilih slot yang kosong (hijau) dalam 14 hari ke depan. Jam yang sudah dibook akan abu-abu.</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-gray-600 font-medium">Durasi per sesi:</span>
                <select
                  value={bookingDuration}
                  onChange={(e) => { setBookingDuration(Number(e.target.value)); setSelectedSlots(new Set()); }}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 font-semibold focus:ring-2 focus:ring-green-500 outline-none"
                >
                  {[30, 45, 60, 75, 90].map((d) => (
                    <option key={d} value={d}>{d} menit</option>
                  ))}
                </select>
                <span className="text-xs text-gray-400">(mengubah durasi akan reset pilihan slot)</span>
              </div>`,
  'Add duration picker in modal'
);

console.log(`\n${changes} change(s) applied.`);

if (src !== orig) {
  fs.writeFileSync(PAGE, src);
  console.log('✓ Saved', PAGE);
} else {
  console.log('⚠️  No changes saved.');
}

try {
  execSync('git add -A', { stdio: 'inherit' });
  try {
    execSync('git commit -m "feat(akun): duration picker + conflict detection in booking modal"', { stdio: 'inherit' });
  } catch { console.log('ℹ️  Nothing new.'); }
  execSync('git push', { stdio: 'inherit' });
  console.log('✅ Pushed!');
  fs.unlinkSync(process.argv[1]);
  console.log('🗑️  Self-deleted.');
} catch (e) { console.error('❌ Git failed:', e.message); }
