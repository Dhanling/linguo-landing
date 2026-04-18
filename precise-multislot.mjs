#!/usr/bin/env node
// precise-multislot.mjs
// Upgrades booking modal from single-slot to multi-slot using exact string matching.
// Based on confirmed line content from grep output.

import fs from 'fs';
import { execSync } from 'child_process';

const PAGE = 'src/app/akun/page.tsx';
if (!fs.existsSync(PAGE)) { console.error('❌ Run di ~/linguo-landing'); process.exit(1); }

let src = fs.readFileSync(PAGE, 'utf8');
const orig = src;
let changes = 0;

function replace(oldStr, newStr, label) {
  if (src.includes(oldStr)) {
    src = src.replace(oldStr, newStr);
    console.log('✓', label);
    changes++;
  } else {
    console.log('⚠️  NOT FOUND:', label);
    console.log('   Expected:', JSON.stringify(oldStr.slice(0, 80)));
  }
}

// ── 1. State: single → Set ────────────────────────────────────────────────────
replace(
  `const [selectedSlot, setSelectedSlot] = useState<string | null>(null);`,
  `const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());`,
  'State: selectedSlot → selectedSlots Set'
);

// ── 2. submitBooking: condition ───────────────────────────────────────────────
replace(
  `if (!bookingReg || !selectedSlot || !student) return;`,
  `if (!bookingReg || selectedSlots.size === 0 || !student) return;`,
  'submitBooking: guard condition'
);

// ── 3. submitBooking: scheduled_at ───────────────────────────────────────────
// Replace the single INSERT with multi-INSERT
// Find the whole insert block
const oldInsert = `      scheduled_at: selectedSlot,`;
const newInsert = `      scheduled_at: slot,`;

// We need to replace the whole submitBooking body for multi-slot
// Find it by unique strings around it
const oldSubmitBody = `      const { error } = await supabase.from("schedules").insert({
        registration_id: bookingReg.id,
        teacher_id: bookingReg.teacher_id,
        student_id: student.id,
        scheduled_at: selectedSlot,`;

if (src.includes(oldSubmitBody)) {
  // Find the end of this insert block and replace the whole submitBooking function
  const funcStart = src.indexOf('  async function submitBooking()');
  const funcEnd = src.indexOf('\n  }', funcStart) + 4; // find closing brace + newline
  
  const newSubmitFunc = `  async function submitBooking() {
    if (!bookingReg || selectedSlots.size === 0 || !student) return;
    setBookingSubmit(true);
    try {
      const rows = Array.from(selectedSlots).map((slot) => ({
        registration_id: bookingReg.id,
        teacher_id: bookingReg.teacher_id,
        student_id: student.id,
        scheduled_at: slot,
        duration_minutes: Number(bookingReg.duration) || 60,
        status: "pending",
        student_confirmed: true,
        student_confirmed_at: new Date().toISOString(),
        notes: "Menunggu konfirmasi pengajar",
      }));
      const { error } = await supabase.from("schedules").insert(rows);
      if (error) throw error;
      setBookingReg(null);
      setSelectedSlots(new Set());
      alert(\`✅ \${rows.length} sesi berhasil di-booking! Menunggu konfirmasi pengajar.\`);
    } catch (e: any) {
      alert("Gagal: " + e.message);
    }
    setBookingSubmit(false);
  }`;

  src = src.slice(0, funcStart) + newSubmitFunc + src.slice(funcEnd);
  console.log('✓ submitBooking: rewritten for multi-slot INSERT');
  changes++;
} else {
  // Just update the scheduled_at line
  replace(oldInsert, newInsert, 'submitBooking: scheduled_at line');
}

// ── 4. Reset on modal close ───────────────────────────────────────────────────
replace(
  `setSelectedSlot(null);`,
  `setSelectedSlots(new Set());`,
  'Reset on modal close'
);
// Also in openBooking
if (src.includes('setSelectedSlots(new Set());') && src.includes('setSelectedSlot(null)')) {
  replace(`setSelectedSlot(null)`, `setSelectedSlots(new Set())`, 'Reset in openBooking');
}

// ── 5. Slot button: isSelected check ─────────────────────────────────────────
replace(
  `const isSelected = selectedSlot === s.iso;`,
  `const isSelected = selectedSlots.has(s.iso);`,
  'Slot button: isSelected check'
);

// ── 6. Slot button: onClick ───────────────────────────────────────────────────
replace(
  `onClick={() => setSelectedSlot(s.iso)}`,
  `onClick={() => {
                                  setSelectedSlots((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(s.iso)) next.delete(s.iso);
                                    else next.add(s.iso);
                                    return next;
                                  });
                                }}`,
  'Slot button: onClick toggle'
);

// ── 7. Footer: selected slot preview ─────────────────────────────────────────
// Replace the single-slot preview text
replace(
  `{selectedSlot
                  ? \`📌 \${new Date(selectedSlot).toLocaleString("id-ID", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} WIB\`
                  : "Pilih slot dulu"}`,
  `{selectedSlots.size > 0
                  ? \`📌 \${selectedSlots.size} sesi dipilih\`
                  : "Pilih slot dulu"}`,
  'Footer: preview text'
);

// ── 8. Footer: disabled condition ────────────────────────────────────────────
replace(
  `disabled={!selectedSlot || bookingSubmit}`,
  `disabled={selectedSlots.size === 0 || bookingSubmit}`,
  'Footer: button disabled condition'
);

// ── 9. Button label ───────────────────────────────────────────────────────────
replace(
  `{bookingSubmit ? "Menyimpan..." : "Booking →"}`,
  `{bookingSubmit ? "Menyimpan..." : selectedSlots.size > 0 ? \`Booking \${selectedSlots.size} Sesi →\` : "Pilih slot dulu"}`,
  'Button label: dynamic count'
);
// Alternate label pattern
replace(
  `{bookingSubmit ? "Menyimpan…" : "Booking →"}`,
  `{bookingSubmit ? "Menyimpan…" : selectedSlots.size > 0 ? \`Booking \${selectedSlots.size} Sesi →\` : "Pilih slot dulu"}`,
  'Button label (alt ellipsis): dynamic count'
);

console.log(`\n${changes} change(s) applied.`);

if (src !== orig) {
  fs.writeFileSync(PAGE, src);
  console.log('✓ Saved', PAGE);
} else {
  console.log('⚠️  No changes made to file.');
}

try {
  execSync('git add -A', { stdio: 'inherit' });
  try {
    execSync('git commit -m "feat(akun): multi-slot booking — select multiple sessions"', { stdio: 'inherit' });
  } catch { console.log('ℹ️  Nothing new.'); }
  execSync('git push', { stdio: 'inherit' });
  console.log('✅ Pushed!');
  fs.unlinkSync(process.argv[1]);
  console.log('🗑️  Self-deleted.');
} catch (e) { console.error('❌ Git failed:', e.message); }
