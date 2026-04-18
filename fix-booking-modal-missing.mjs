#!/usr/bin/env node
// fix-booking-modal-missing.mjs
// Root cause: BookingModal JSX failed to insert in previous script.
// This adds it right before EnrollWizard component.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

const FILE = "src/app/akun/page.tsx";

if (!existsSync(FILE)) {
  console.error(`❌ File not found: ${FILE}`);
  process.exit(1);
}

let content = readFileSync(FILE, "utf8");

if (content.includes("{/* Booking Modal */}")) {
  console.log("⏭️  Modal already exists, nothing to do");
  process.exit(0);
}

// Anchor: very specific line that definitely exists
const anchor = `      {/* Enrollment Wizard */}
      <EnrollWizard />`;

const modalJSX = `      {/* Booking Modal */}
      {bookingReg && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4" onClick={() => !bookingSubmit && setBookingReg(null)}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-2xl max-h-[92vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
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
                      const dow = date.getDay();
                      const daySlots: { time: string; iso: string; isBooked: boolean; isPast: boolean }[] = [];
                      for (let h = 6; h < 22; h++) {
                        const time = \`\${String(h).padStart(2, "0")}:00\`;
                        const slotDate = new Date(date);
                        slotDate.setHours(h, 0, 0, 0);
                        const iso = slotDate.toISOString();
                        const isAvail = availSlots.has(\`\${dow}-\${time}\`) || availSlots.has(\`\${dow}-\${time}:00\`);
                        const isBooked = bookedSlots.has(iso);
                        const isPast = slotDate.getTime() <= Date.now() + 60 * 60 * 1000;
                        if (isAvail) daySlots.push({ time, iso, isBooked, isPast });
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

      {/* Enrollment Wizard */}
      <EnrollWizard />`;

if (!content.includes(anchor)) {
  console.error("❌ Anchor not found. File structure may differ. Aborting.");
  process.exit(1);
}

content = content.replace(anchor, modalJSX);
writeFileSync(FILE, content);
console.log("✅ BookingModal JSX inserted");

// Commit & push
try {
  execSync("git add -A", { stdio: "inherit" });
  execSync(`git commit -m "fix(akun): add missing BookingModal JSX"`, { stdio: "inherit" });
  execSync("git push", { stdio: "inherit" });
  console.log("\n🚀 Pushed");
} catch (e) {
  console.error("\n⚠️  Git push failed");
}

try {
  execSync(`rm "${new URL(import.meta.url).pathname}"`);
  console.log("🧹 Self-deleted");
} catch {}
