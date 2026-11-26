"use client";

/* [sambut-siswa-lunas-v1] Sambutan login pertama untuk siswa yang SUDAH bayar.

   Kenapa ada: siswa yang bayar lewat Xendit / didaftarkan admin sebelum pernah
   membuka dashboard dulu langsung dijatuhkan ke Beranda tanpa penjelasan apa
   pun — tak ada yang memberi tahu "kamu sudah terdaftar di kelas X", apalagi di
   mana jadwal & materinya. Kartu ini merangkum kelas yang sudah Lunas/Cicilan
   (program, bahasa, level, jumlah sesi, durasi, pengajar, jadwal grup), lalu
   menawarkan tur singkat dashboard. Wizard onboarding ("Mulai Setup") TIDAK
   dipakai untuk mereka: mereka sudah memilih & membayar. */

import { motion } from "framer-motion";
import { CalendarDays, CheckCircle2, Clock, GraduationCap, Layers, PartyPopper, UserRound, X } from "lucide-react";
import { displayLanguage } from "@/lib/classLanguage";
import { sapaan } from "@/lib/teacherName";

type Reg = any;

function menitPerSesi(r: Reg): number | null {
  const n = parseInt(String(r?.duration ?? r?.batch?.session_duration_min ?? r?.testPrepBatch?.duration_minutes ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function jadwalGrup(r: Reg): string | null {
  const b = r?.batch;
  if (b?.session_day) return `${b.session_day}${b.session_start_time ? `, ${String(b.session_start_time).slice(0, 5)} WIB` : ""}`;
  const tp = r?.testPrepBatch;
  if (tp?.schedule_days) {
    const hari = Array.isArray(tp.schedule_days) ? tp.schedule_days.join(" & ") : String(tp.schedule_days);
    return `${hari}${tp.schedule_time ? `, ${String(tp.schedule_time).slice(0, 5)} WIB` : ""}`;
  }
  return null;
}

function tglMulai(r: Reg): string | null {
  const d = r?.batch?.start_date || r?.testPrepBatch?.start_date;
  if (!d) return null;
  try {
    return new Date(`${String(d).slice(0, 10)}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  } catch { return null; }
}

const DIGITAL = /e-?book|e-?learning|simulasi/i;

export default function SambutanSiswaLunas({
  firstName,
  regs,
  onMulaiTur,
  onTutup,
}: {
  firstName: string;
  regs: Reg[];
  onMulaiTur: () => void;
  onTutup: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[120] flex flex-col items-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22 }}
        className="relative my-auto w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-label="Selamat datang di dashboard Linguo"
      >
        <button onClick={onTutup} aria-label="Tutup" className="absolute right-3 top-3 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>

        <div className="text-center">
          <span className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
            <PartyPopper className="h-7 w-7" />
          </span>
          <h2 className="text-xl font-extrabold text-gray-900">Halo, {firstName}!</h2>
          <p className="mt-1 text-sm text-gray-500">
            Pembayaranmu sudah kami terima dan kamu <b className="text-gray-800">sudah terdaftar</b>. Ini ringkasan kelasmu:
          </p>
        </div>

        <div className="mt-4 space-y-2.5">
          {regs.map((r) => {
            const digital = DIGITAL.test(String(r?.product || ""));
            const menit = menitPerSesi(r);
            const total = Number(r?.sessions_total) || 0;
            const jadwal = jadwalGrup(r);
            const mulai = tglMulai(r);
            const guru = r?.teachers?.name ? sapaan(r.teachers.name) : "";
            const bahasa = r?.language ? displayLanguage(r.language) : "";
            return (
              <div key={r.id} className="rounded-2xl border border-teal-100 bg-teal-50/50 p-3.5 text-left">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-teal-700">{r?.product || "Kelas"}</p>
                    <p className="truncate text-[15px] font-extrabold text-gray-900">
                      {bahasa}{r?.level ? ` · ${r.level}` : ""}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-teal-700 ring-1 ring-teal-100">
                    <CheckCircle2 className="h-3 w-3" /> {r?.payment_status === "Cicilan" ? "Cicilan" : "Lunas"}
                  </span>
                </div>
                {!digital && (
                  <ul className="mt-2 grid grid-cols-1 gap-1 text-[12.5px] text-gray-600 sm:grid-cols-2">
                    {total > 0 && (
                      <li className="flex items-center gap-1.5"><Layers className="h-3.5 w-3.5 shrink-0 text-teal-600" /> {total} sesi</li>
                    )}
                    {menit && (
                      <li className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 shrink-0 text-teal-600" /> {menit} menit / sesi</li>
                    )}
                    <li className="flex items-center gap-1.5">
                      <UserRound className="h-3.5 w-3.5 shrink-0 text-teal-600" /> {guru || "Pengajar sedang disiapkan admin"}
                    </li>
                    {jadwal && (
                      <li className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 shrink-0 text-teal-600" /> {jadwal}</li>
                    )}
                    {mulai && (
                      <li className="flex items-center gap-1.5 sm:col-span-2"><GraduationCap className="h-3.5 w-3.5 shrink-0 text-teal-600" /> Mulai {mulai}</li>
                    )}
                  </ul>
                )}
                {digital && (
                  <p className="mt-1.5 text-[12.5px] text-gray-600">Bisa langsung dibuka dari menu Perpustakaan.</p>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-center text-[12.5px] leading-relaxed text-gray-500">
          Jadwal sesi diatur bersama admin &amp; pengajar lewat WhatsApp, lalu muncul otomatis di menu <b>Jadwal</b>.
        </p>

        <button
          onClick={onMulaiTur}
          className="mt-4 w-full rounded-2xl bg-teal-600 py-3.5 text-[15px] font-bold text-white shadow-md shadow-teal-200 transition hover:bg-teal-700 active:scale-[0.98]"
        >
          Lihat cara pakai dashboard (1 menit)
        </button>
        <button onClick={onTutup} className="mt-2 block w-full py-2 text-center text-sm font-semibold text-gray-400 transition hover:text-gray-600">
          Nanti saja
        </button>
      </motion.div>
    </div>
  );
}
