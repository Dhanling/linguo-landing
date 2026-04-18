#!/usr/bin/env node
// add-booking-modal-akun.mjs
// Adds booking modal to /akun: tombol "Booking Sesi" di card Kelas Aktif → modal slot picker
// Workflow: drag ke ~/linguo-landing → node add-booking-modal-akun.mjs

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

const FILE = "src/app/akun/page.tsx";

if (!existsSync(FILE)) {
  console.error(`❌ File not found: ${FILE}`);
  console.error("Run this from ~/linguo-landing/");
  process.exit(1);
}

let content = readFileSync(FILE, "utf8");
const original = content;

// ─────────────────────────────────────────────────────────────────
// Edit 1: Add booking modal state
// ─────────────────────────────────────────────────────────────────
const oldStateAnchor = `  const [activeTab, setActiveTab] = useState<"beranda"|"jadwal"|"materi"|"akun">("beranda");`;

const newStateBlock = `  const [activeTab, setActiveTab] = useState<"beranda"|"jadwal"|"materi"|"akun">("beranda");
  // Booking Modal
  const [bookingReg, setBookingReg] = useState<StudentReg | null>(null);
  const [availSlots, setAvailSlots] = useState<Set<string>>(new Set()); // "day_of_week-HH:MM"
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set()); // ISO strings
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null); // ISO string
  const [bookingSubmit, setBookingSubmit] = useState(false);`;

if (content.includes(oldStateAnchor) && !content.includes("bookingReg")) {
  content = content.replace(oldStateAnchor, newStateBlock);
  console.log("✅ Edit 1/5: Booking state added");
} else if (content.includes("bookingReg")) {
  console.log("⏭️  Edit 1/5: State already exists, skipping");
} else {
  console.log("⚠️  Edit 1/5: State anchor not found");
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────
// Edit 2: Add openBooking helper function
// ─────────────────────────────────────────────────────────────────
const oldFunctionAnchor = `  const activeRegs = useMemo(() => student?.registrations.filter(r => r.status === "Aktif") || [], [student]);`;

const openBookingFn = `  // Booking helpers
  async function openBooking(reg: StudentReg) {
    if (!reg.teacher_id) {
      alert("Kelas ini belum punya pengajar ditugaskan. Hubungi admin.");
      return;
    }
    setBookingReg(reg);
    setSelectedSlot(null);
    setLoadingSlots(true);
    // Fetch teacher_availability
    const { data: avail } = await supabase
      .from("teacher_availability")
      .select("day_of_week, time_slot")
      .eq("teacher_id", reg.teacher_id);
    setAvailSlots(new Set((avail || []).map((a: any) => \`\${a.day_of_week}-\${a.time_slot}\`)));
    // Fetch already-booked schedules in next 14 days (to avoid conflicts)
    const until = new Date(); until.setDate(until.getDate() + 14);
    const { data: booked } = await supabase
      .from("schedules")
      .select("scheduled_at")
      .eq("teacher_id", reg.teacher_id)
      .gte("scheduled_at", new Date().toISOString())
      .lte("scheduled_at", until.toISOString())
      .neq("status", "cancelled");
    setBookedSlots(new Set((booked || []).map((b: any) => new Date(b.scheduled_at).toISOString())));
    setLoadingSlots(false);
  }

  async function submitBooking() {
    if (!bookingReg || !selectedSlot || !student) return;
    setBookingSubmit(true);
    try {
      const { error } = await supabase.from("schedules").insert({
        registration_id: bookingReg.id,
        teacher_id: bookingReg.teacher_id,
        student_id: student.id,
        scheduled_at: selectedSlot,
        duration_minutes: 60,
        status: "pending",
        student_confirmed: true,
        student_confirmed_at: new Date().toISOString(),
        notes: "Menunggu konfirmasi pengajar",
      });
      if (error) throw error;
      // Refresh upcoming schedules
      const { data: schedData } = await supabase
        .from("schedules")
        .select("id, registration_id, scheduled_at, duration_minutes, status")
        .in("registration_id", activeRegs.map(r => r.id))
        .in("status", ["scheduled", "pending"])
        .gt("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true });
      setUpcomingSchedules(schedData || []);
      setBookingReg(null);
      alert("✅ Booking terkirim! Menunggu konfirmasi pengajar.");
    } catch (e: any) {
      alert("Gagal booking: " + (e.message || "unknown"));
    }
    setBookingSubmit(false);
  }

  ${oldFunctionAnchor}`;

if (content.includes(oldFunctionAnchor) && !content.includes("async function openBooking")) {
  content = content.replace(oldFunctionAnchor, openBookingFn);
  console.log("✅ Edit 2/5: openBooking + submitBooking helpers added");
} else if (content.includes("async function openBooking")) {
  console.log("⏭️  Edit 2/5: Helpers already exist");
} else {
  console.log("⚠️  Edit 2/5: Function anchor not found");
}

// ─────────────────────────────────────────────────────────────────
// Edit 3: Add "Booking Sesi" button to each Kelas Aktif card
// ─────────────────────────────────────────────────────────────────
const oldCardClose = `                              {/* Level progress */}
                              <div className="mt-3 pt-3 border-t border-gray-50">`;

const newCardWithButton = `                              {/* Booking button — only for private classes with teacher */}
                              {reg.teacher_id && reg.product === "Kelas Private" && (
                                <button
                                  onClick={() => openBooking(reg)}
                                  className="w-full mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors shadow-sm"
                                >
                                  📅 Booking Sesi Berikutnya
                                </button>
                              )}
                              {/* Level progress */}
                              <div className="mt-3 pt-3 border-t border-gray-50">`;

if (content.includes(oldCardClose) && !content.includes("Booking Sesi Berikutnya")) {
  content = content.replace(oldCardClose, newCardWithButton);
  console.log("✅ Edit 3/5: Booking button added to Kelas Aktif cards");
} else if (content.includes("Booking Sesi Berikutnya")) {
  console.log("⏭️  Edit 3/5: Button already exists");
} else {
  console.log("⚠️  Edit 3/5: Card close anchor not found");
}

// ─────────────────────────────────────────────────────────────────
// Edit 4: Add BookingModal JSX — insert before the FIRST root close </div>
// We inject just before `</div>` that precedes final return closing
// Find a stable anchor: bottom nav tabs section
// ─────────────────────────────────────────────────────────────────
const oldEnrollModalAnchor = `      {/* Enrollment Wizard Modal */}`;

const bookingModalJSX = `      {/* Booking Modal */}
      {bookingReg && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4" onClick={() => !bookingSubmit && setBookingReg(null)}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-2xl max-h-[92vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Booking Sesi</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {bookingReg.language} · {bookingReg.level}
                  {bookingReg.teachers?.name && <> · 👩‍🏫 {bookingReg.teachers.name}</>}
                </p>
              </div>
              <button
                onClick={() => !bookingSubmit && setBookingReg(null)}
                className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >✕</button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {loadingSlots ? (
                <div className="py-16 text-center text-sm text-gray-500">Memuat jadwal pengajar...</div>
              ) : availSlots.size === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-3xl mb-2">🗓️</p>
                  <p className="text-sm text-gray-700 font-medium">Pengajar belum set jadwal tersedia</p>
                  <p className="text-xs text-gray-500 mt-1">Hubungi admin untuk booking manual</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-gray-500 mb-3">
                    Pilih slot yang kosong (hijau) dalam 14 hari ke depan. Jam yang sudah dibook akan abu-abu.
                  </p>
                  <div className="flex flex-col gap-3">
                    {Array.from({ length: 14 }, (_, di) => {
                      const date = new Date();
                      date.setDate(date.getDate() + di);
                      const dow = date.getDay(); // 0=Minggu
                      // Generate slots for this day (06:00 - 21:00, every hour)
                      const daySlots: { time: string; iso: string; isBooked: boolean; isAvail: boolean; isPast: boolean }[] = [];
                      for (let h = 6; h < 22; h++) {
                        const time = \`\${String(h).padStart(2, "0")}:00\`;
                        const slotDate = new Date(date);
                        slotDate.setHours(h, 0, 0, 0);
                        const iso = slotDate.toISOString();
                        const isAvail = availSlots.has(\`\${dow}-\${time}\`) || availSlots.has(\`\${dow}-\${time}:00\`);
                        const isBooked = bookedSlots.has(iso);
                        const isPast = slotDate.getTime() <= Date.now() + 60 * 60 * 1000; // 1hr buffer
                        if (isAvail) daySlots.push({ time, iso, isBooked, isAvail, isPast });
                      }
                      if (daySlots.length === 0) return null;
                      const dayLabel = date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short" });
                      return (
                        <div key={di} className="border border-gray-100 rounded-xl p-3">
                          <p className="text-xs font-semibold text-gray-700 mb-2">{dayLabel}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {daySlots.map(s => {
                              const disabled = s.isBooked || s.isPast;
                              const isSelected = selectedSlot === s.iso;
                              return (
                                <button
                                  key={s.time}
                                  disabled={disabled}
                                  onClick={() => setSelectedSlot(s.iso)}
                                  className={\`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors \${
                                    isSelected
                                      ? "bg-teal-600 text-white ring-2 ring-teal-300"
                                      : disabled
                                      ? "bg-gray-100 text-gray-400 cursor-not-allowed line-through"
                                      : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                                  }\`}
                                >
                                  {s.time}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-5 py-4 flex items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-gray-500 min-w-0 truncate">
                {selectedSlot
                  ? \`📌 \${new Date(selectedSlot).toLocaleString("id-ID", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} WIB\`
                  : "Pilih slot dulu"}
              </div>
              <button
                onClick={submitBooking}
                disabled={!selectedSlot || bookingSubmit}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-teal-600 px-5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                {bookingSubmit ? "Menyimpan..." : "Booking →"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      ${oldEnrollModalAnchor}`;

if (content.includes(oldEnrollModalAnchor) && !content.includes("{/* Booking Modal */}")) {
  content = content.replace(oldEnrollModalAnchor, bookingModalJSX);
  console.log("✅ Edit 4/5: BookingModal JSX added");
} else if (content.includes("{/* Booking Modal */}")) {
  console.log("⏭️  Edit 4/5: Modal already exists");
} else {
  console.log("⚠️  Edit 4/5: Enroll modal anchor not found");
}

// ─────────────────────────────────────────────────────────────────
// Edit 5: Ensure StudentReg type has teacher_id (it does based on scan)
// Just verify — no edit needed.
// ─────────────────────────────────────────────────────────────────
if (content.includes("teacher_id?: string")) {
  console.log("✅ Edit 5/5: StudentReg.teacher_id type confirmed");
} else {
  console.log("⚠️  Edit 5/5: teacher_id field may be missing in StudentReg type");
}

// ─────────────────────────────────────────────────────────────────
// Write + push
// ─────────────────────────────────────────────────────────────────
if (content === original) {
  console.log("\n⚠️  No changes applied.");
  process.exit(0);
}

writeFileSync(FILE, content);
console.log(`\n📝 ${FILE} updated`);

try {
  execSync("git add -A", { stdio: "inherit" });
  execSync(`git commit -m "feat(akun): booking modal with slot picker from teacher availability"`, { stdio: "inherit" });
  execSync("git push", { stdio: "inherit" });
  console.log("\n🚀 Pushed");
} catch (e) {
  console.error("\n⚠️  Git push failed");
  process.exit(1);
}

try {
  execSync(`rm "${new URL(import.meta.url).pathname}"`);
  console.log("🧹 Self-deleted");
} catch {}
