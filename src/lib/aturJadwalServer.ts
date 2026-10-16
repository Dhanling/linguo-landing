// [atur-jadwal-sendiri-v1] Bagian server "Atur jadwal sendiri": membaca registrasi,
// Availability, jadwal sibuk, dan mengabari pengajar. Dipakai /api/atur-jadwal; dipisah
// dari route supaya bisa diuji kering (baca saja) dengan klien service role.

import { createClient } from "@supabase/supabase-js";
import { sapaan } from "@/lib/teacherName";
import { batchOccurrencesWithOverrides, type BatchScheduleOverride } from "@/lib/batchCalendar";
import {
  AVAIL_SEGAR_HARI, PRODUK_ATUR_SENDIRI, JENDELA_HARI,
  durasiMenit, wibDariLokal, wibInstant,
  type BahanSlot, type Interval,
} from "@/lib/aturJadwal";

/** Nomor Kurikulum — dipakai kalau kelasnya belum punya grup WA. */
const SENDER_PENGAJAR = "riny";
const HARI = 86_400_000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Admin = ReturnType<typeof createClient<any>>;

export type Reg = {
  id: string; student_id: string; teacher_id: string | null; product: string | null;
  language: string | null; level: string | null; duration: string | null;
  sessions_total: number | null; total_sessions: number | null; sessions_used: number | null;
  payment_status: string | null; pipeline_status: string | null; archived_at: string | null;
  expiry_date: string | null; registration_date: string | null; created_at: string | null;
};
export type Sched = {
  id: string; registration_id: string | null; teacher_id: string | null; student_id: string | null;
  scheduled_at: string; duration_minutes: number | null; status: string | null; session_number: number | null;
};

export const MATI = new Set(["cancelled", "hangus"]);
export const jalan = (s: Sched) => !MATI.has(String(s.status || ""));
const intervalOf = (s: Sched): Interval => {
  const mulai = new Date(s.scheduled_at).getTime();
  return { mulai, selesai: mulai + (Number(s.duration_minutes) || 60) * 60_000 };
};

const REG_COLS =
  "id, student_id, teacher_id, product, language, level, duration, sessions_total, total_sessions, sessions_used, payment_status, pipeline_status, archived_at, expiry_date, registration_date, created_at";

const bahasaDasar = (l?: string | null) => String(l || "").split(/\s[-–]\s/)[0].trim().toLowerCase();

/** Konteks lengkap satu registrasi: pengajar, sisa jatah, dan bahan hitungan slot. */
export async function konteksReg(admin: Admin, reg: Reg, kecualiId?: string | null) {
  const sekarang = Date.now();
  const teacherId = reg.teacher_id!;
  const sampai = new Date(sekarang + (JENDELA_HARI + 2) * HARI).toISOString();
  const dari = new Date(sekarang - HARI).toISOString();

  const [guru, mingguan, pengecualian, jadwalReg, sibukGuru, sibukSiswa, reguler, etp] = await Promise.all([
    admin.from("teachers").select("id, name, title, nickname, whatsapp, user_id, status").eq("id", teacherId).maybeSingle(),
    admin.from("teacher_availability").select("day_of_week, time_slot, created_at").eq("teacher_id", teacherId),
    admin.from("teacher_availability_overrides").select("override_date, time_slot, type, created_at").eq("teacher_id", teacherId)
      .gte("override_date", new Date(sekarang - HARI).toISOString().slice(0, 10)),
    admin.from("schedules").select("id, registration_id, teacher_id, student_id, scheduled_at, duration_minutes, status, session_number")
      .eq("registration_id", reg.id).range(0, 999),
    admin.from("schedules").select("id, registration_id, teacher_id, student_id, scheduled_at, duration_minutes, status, session_number")
      .eq("teacher_id", teacherId).gte("scheduled_at", dari).lte("scheduled_at", sampai).range(0, 999),
    admin.from("schedules").select("id, registration_id, teacher_id, student_id, scheduled_at, duration_minutes, status, session_number")
      .eq("student_id", reg.student_id).gte("scheduled_at", dari).lte("scheduled_at", sampai).range(0, 999),
    admin.from("regular_batches").select("id, session_day, session_start_time, session_duration_min, start_date, end_date, total_sessions, status, cancelled_at")
      .eq("teacher_id", teacherId).in("status", ["Confirmed", "Running"]).is("cancelled_at", null),
    admin.from("test_prep_batches").select("id, schedule_days, schedule_time, duration_minutes, start_date, end_date, sessions_total, cancelled_at")
      .eq("teacher_id", teacherId).is("cancelled_at", null),
  ]);

  const avail = (mingguan.data ?? []) as { day_of_week: number; time_slot: string; created_at: string }[];
  const over = (pengecualian.data ?? []) as { override_date: string; time_slot: string; type: string; created_at: string }[];
  const terakhirDiubah = Math.max(
    0,
    ...avail.map((a) => new Date(a.created_at).getTime()),
    ...over.map((o) => new Date(o.created_at).getTime()),
  );
  const availSegar = avail.length > 0 && terakhirDiubah > sekarang - AVAIL_SEGAR_HARI * HARI;

  // Jatah: yang sudah lewat (minimal sessions_used — sesi lama sebelum ada baris schedules)
  // + yang masih akan datang.
  const sesiReg = ((jadwalReg.data ?? []) as Sched[]).filter(jalan);
  const lewat = sesiReg.filter((s) => new Date(s.scheduled_at).getTime() < sekarang).length;
  const mendatang = sesiReg.filter((s) => new Date(s.scheduled_at).getTime() >= sekarang).length;
  const total = Number(reg.sessions_total) || Number(reg.total_sessions) || 0;
  const terpakai = Math.max(Number(reg.sessions_used) || 0, lewat) + mendatang;
  const sisa = Math.max(0, total - terpakai);

  const sibuk: Interval[] = [];
  const dilihat = new Set<string>();
  for (const s of [...((sibukGuru.data ?? []) as Sched[]), ...((sibukSiswa.data ?? []) as Sched[])]) {
    if (dilihat.has(s.id) || s.id === kecualiId || !jalan(s)) continue;
    dilihat.add(s.id);
    sibuk.push(intervalOf(s));
  }

  // Pertemuan batch Reguler/ETP pengajar ini tidak punya baris `schedules`.
  const reg_ = (reguler.data ?? []) as any[];
  const etp_ = (etp.data ?? []) as any[];
  const batchIds = [...reg_.map((b) => b.id), ...etp_.map((b) => b.id)];
  let ovBatch: BatchScheduleOverride[] = [];
  if (batchIds.length) {
    const { data } = await admin.from("batch_schedule_overrides")
      .select("batch_kind,batch_id,occurrence_date,action,new_date,new_time").in("batch_id", batchIds);
    ovBatch = (data ?? []) as BatchScheduleOverride[];
  }
  const tambahBatch = (id: string, durasi: number, pola: Parameters<typeof batchOccurrencesWithOverrides>[0]) => {
    for (const d of batchOccurrencesWithOverrides(pola, ovBatch.filter((o) => o.batch_id === id))) {
      const mulai = wibDariLokal(d);
      if (mulai < sekarang - HARI || mulai > sekarang + (JENDELA_HARI + 2) * HARI) continue;
      sibuk.push({ mulai, selesai: mulai + durasi * 60_000 });
    }
  };
  for (const b of reg_) tambahBatch(b.id, Number(b.session_duration_min) || 90, {
    days: b.session_day, time: b.session_start_time, startDate: b.start_date, endDate: b.end_date, totalSessions: b.total_sessions,
  });
  for (const b of etp_) tambahBatch(b.id, Number(b.duration_minutes) || 90, {
    days: b.schedule_days, time: b.schedule_time, startDate: b.start_date, endDate: b.end_date, totalSessions: b.sessions_total,
  });

  let batasAkhir: number | null = null;
  if (reg.expiry_date) {
    const [y, m, d] = reg.expiry_date.slice(0, 10).split("-").map(Number);
    if (y && m && d) batasAkhir = wibInstant(y, m - 1, d + 1); // sampai akhir hari kedaluwarsa
  }

  const bahan: BahanSlot = {
    mingguan: new Set(avail.map((a) => `${a.day_of_week}-${String(a.time_slot).slice(0, 5)}`)),
    pengecualian: new Map(over.map((o) => [`${o.override_date}-${String(o.time_slot).slice(0, 5)}`, o.type])),
    sibuk,
    durasi: durasiMenit(reg.duration),
    sekarang,
    batasAkhir,
  };
  const g = guru.data as { id: string; name: string; title: string | null; nickname: string | null; whatsapp: string | null; user_id: string | null; status: string | null } | null;
  const guruAktif = !!g && String(g.status || "").toLowerCase() === "aktif";
  return { guru: g, guruAktif, availSegar, sisa, total, sesiReg, bahan };
}

/** Registrasi milik siswa yang jadwalnya boleh diatur sendiri (tanpa melihat Availability). */
export async function regsMilik(admin: Admin, studentIds: string[]) {
  const { data } = await admin.from("registrations").select(REG_COLS).in("student_id", studentIds);
  const semua = ((data ?? []) as Reg[]).filter((r) =>
    PRODUK_ATUR_SENDIRI.has(String(r.product)) && !!r.teacher_id &&
    (r.payment_status === "Lunas" || r.payment_status === "Cicilan") &&
    r.pipeline_status !== "Batal" && !r.archived_at);
  return semua;
}

/** Kelas lanjutan menunggu level sebelumnya (bahasa sama) habis — yang dipesan cuma yang tertua. */
export function regTertuaPerBahasa(regs: { reg: Reg; sisa: number }[]) {
  const pilih = new Map<string, Reg>();
  for (const { reg, sisa } of regs) {
    if (sisa <= 0) continue;
    const k = bahasaDasar(reg.language);
    const lama = pilih.get(k);
    const t = (r: Reg) => new Date(r.registration_date || r.created_at || 0).getTime();
    if (!lama || t(reg) < t(lama)) pilih.set(k, reg);
  }
  return new Set(Array.from(pilih.values()).map((r) => r.id));
}

export async function kabari(admin: Admin, reg: Reg, guru: NonNullable<Awaited<ReturnType<typeof konteksReg>>["guru"]>, judul: string, isi: string, scheduleId: string | null) {
  const sapa = sapaan(guru.nickname || guru.name, guru.title) || "Kak";
  const pesan = `Halo ${sapa}, ${isi}`;
  try {
    const tugas: PromiseLike<unknown>[] = [];
    if (guru.user_id) {
      tugas.push(admin.from("notifications").insert({
        user_id: guru.user_id, user_type: "teacher", title: judul, body: isi,
        related_schedule_id: scheduleId, category: "booking",
      }).then(({ error }) => { if (error) console.error("[atur-jadwal] notif lonceng gagal:", error.message); }));
    }
    // Grup kelas dulu (pengajar + siswa sama-sama lihat); belum ada grup → WA pribadi pengajar.
    const { data: grup } = await admin.from("wa_groups").select("jid, sender, preferred_sender, hidden")
      .eq("registration_id", reg.id).limit(5);
    const g = ((grup ?? []) as { jid: string; sender: string | null; preferred_sender: string | null; hidden: boolean | null }[])
      .find((x) => !x.hidden && x.jid?.endsWith("@g.us"));
    if (g) {
      tugas.push(admin.from("wa_outbound").insert({ phone: g.jid, sender: g.preferred_sender || g.sender, body: pesan })
        .then(({ error }) => { if (error) console.error("[atur-jadwal] WA grup gagal:", error.message); }));
    } else if (guru.whatsapp) {
      tugas.push(admin.from("wa_outbound").insert({ phone: guru.whatsapp, sender: SENDER_PENGAJAR, body: pesan })
        .then(({ error }) => { if (error) console.error("[atur-jadwal] WA pengajar gagal:", error.message); }));
    }
    await Promise.all(tugas);
  } catch (e) {
    console.error("[atur-jadwal] kabari gagal (tidak fatal):", e);
  }
}

export const labelKelas = (r: Reg) => [r.language, r.level].filter(Boolean).join(" ") || "kelas";

