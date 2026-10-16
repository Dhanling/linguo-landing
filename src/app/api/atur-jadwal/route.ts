// [atur-jadwal-sendiri-v1] Siswa Private/Kids mengatur jadwalnya sendiri dari /akun.
//
//   { accessToken, aksi: "kelas" }                               → { kelas: [...] }
//   { accessToken, aksi: "slot", regId, kecuali? }               → { slot: [epoch], durasi, ... }
//   { accessToken, aksi: "pesan", regId, slot: [epoch] }         → { ok, dibuat }
//   { accessToken, aksi: "pindah", scheduleId, slot: epoch }     → { ok }
//   { accessToken, aksi: "batal", scheduleId, alasan? }          → { ok }
//
// Kenapa lewat server, bukan insert langsung seperti modal booking lama:
//  - RLS `schedules` cuma memperlihatkan jadwal siswa itu sendiri, jadi pengecekan
//    bentrok dari browser buta terhadap siswa lain pengajar yang sama.
//  - Siswa tidak punya policy UPDATE — pindah & batal mustahil dari klien.
//  - Aturan H-1 (reschedule-h1) harus ditegakkan sistem, bukan dipercayakan ke UI.
// Token diverifikasi dulu; semua baca/tulis memakai service role HANYA untuk
// registrasi milik baris `students` ber-email sama.
//
// Booking langsung berstatus `scheduled` (tanpa tombol Terima pengajar): jam di tab
// Availability = janji pengajar. Karena itu booking sendiri hanya dibuka untuk
// pengajar yang Availability-nya diperbarui dalam AVAIL_SEGAR_HARI terakhir.
// Pengajar & grup kelas dikabari lewat lonceng dashboard + WhatsApp.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { BATAS_UBAH_JAM, MAKS_SEKALI_PESAN, alasanSlotDitolak, daftarSlot, labelSesi } from "@/lib/aturJadwal";
import { kabari, konteksReg, labelKelas, regTertuaPerBahasa, regsMilik, type Sched } from "@/lib/aturJadwalServer";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const gagal = (error: string, status = 400) => NextResponse.json({ error }, { status });

async function siswaDariToken(accessToken: string) {
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user?.email) return null;
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  // Satu email bisa punya >1 baris students ([akun-student-kembar-v1]).
  const { data: students } = await admin.from("students").select("id, name").eq("email", user.email);
  const list = (students ?? []) as { id: string; name: string | null }[];
  return { admin, studentIds: list.map((s) => s.id), nama: list.find((s) => s.name)?.name || "Siswa" };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.accessToken) return gagal("Perlu masuk dulu", 401);
    const ctx = await siswaDariToken(String(body.accessToken));
    if (!ctx) return gagal("Sesi tidak valid atau sudah habis", 401);
    const { admin, studentIds, nama } = ctx;
    if (!studentIds.length) return NextResponse.json({ kelas: [] });
    const aksi = String(body.aksi || "");

    const regs = await regsMilik(admin, studentIds);

    if (aksi === "kelas") {
      const isi = await Promise.all(regs.map(async (reg) => ({ reg, k: await konteksReg(admin, reg) })));
      const tertua = regTertuaPerBahasa(isi.map(({ reg, k }) => ({ reg, sisa: k.sisa })));
      return NextResponse.json({
        kelas: isi.map(({ reg, k }) => ({
          regId: reg.id,
          label: [reg.language, reg.level].filter(Boolean).join(" · "),
          pengajar: k.guru ? (k.guru.nickname || k.guru.name) : null,
          durasi: k.bahan.durasi,
          sisa: k.sisa,
          total: k.total,
          // bisaPesan: tombol "Pilih jadwal" muncul. bisaUbah: pindah sesi lewat pilihan jam.
          bisaUbah: k.guruAktif && k.availSegar,
          bisaPesan: k.guruAktif && k.availSegar && k.sisa > 0 && tertua.has(reg.id),
          alasan: !k.guruAktif ? "pengajar-nonaktif" : !k.availSegar ? "availability-basi"
            : k.sisa <= 0 ? "jatah-habis" : !tertua.has(reg.id) ? "level-sebelumnya-belum-selesai" : null,
        })),
      });
    }

    if (aksi === "slot") {
      const reg = regs.find((r) => r.id === body.regId);
      if (!reg) return gagal("Kelas tidak ditemukan");
      const k = await konteksReg(admin, reg, body.kecuali ? String(body.kecuali) : null);
      if (!k.guruAktif || !k.availSegar) return NextResponse.json({ slot: [], durasi: k.bahan.durasi, sisa: k.sisa, tutup: true });
      return NextResponse.json({ slot: daftarSlot(k.bahan), durasi: k.bahan.durasi, sisa: k.sisa, tutup: false });
    }

    if (aksi === "pesan") {
      const reg = regs.find((r) => r.id === body.regId);
      if (!reg) return gagal("Kelas tidak ditemukan");
      const diminta = Array.from(new Set(((body.slot ?? []) as unknown[]).map(Number).filter(Number.isFinite))).sort((a, b) => a - b);
      if (!diminta.length) return gagal("Pilih minimal satu jam");
      const k = await konteksReg(admin, reg);
      if (!k.guruAktif || !k.availSegar) return gagal("Jadwal pengajar ini belum dibuka untuk dipesan sendiri. Atur lewat grup kelas ya.");
      const tertua = regTertuaPerBahasa((await Promise.all(regs.map(async (r) => ({ reg: r, sisa: r.id === reg.id ? k.sisa : (await konteksReg(admin, r)).sisa })))));
      if (!tertua.has(reg.id)) return gagal("Selesaikan dulu sesi level sebelumnya, baru jadwal level ini bisa dipesan.");
      const batas = Math.min(k.sisa, MAKS_SEKALI_PESAN);
      if (diminta.length > batas) return gagal(k.sisa <= 0 ? "Jatah sesi kelas ini sudah habis terjadwal" : `Maksimal ${batas} sesi untuk saat ini`);
      // Cek tiap jam — termasuk bentrok antar jam yang dipilih sendiri.
      for (const mulai of diminta) {
        const alasan = alasanSlotDitolak(k.bahan, mulai);
        if (alasan) return gagal(`${labelSesi(mulai, k.bahan.durasi)}: ${alasan}. Muat ulang pilihan jamnya.`, 409);
        k.bahan.sibuk.push({ mulai, selesai: mulai + k.bahan.durasi * 60_000 });
      }
      const noAwal = k.sesiReg.reduce((m, s) => Math.max(m, Number(s.session_number) || 0), 0) + 1;
      const grupUlang = diminta.length > 1 ? crypto.randomUUID() : null;
      const rows = diminta.map((mulai, i) => ({
        registration_id: reg.id,
        teacher_id: reg.teacher_id,
        student_id: reg.student_id,
        scheduled_at: new Date(mulai).toISOString(),
        duration_minutes: k.bahan.durasi,
        status: "scheduled",
        confirmation_token: crypto.randomUUID(),
        session_number: noAwal + i,
        recurrence_group_id: grupUlang,
        notes: "Dipesan siswa dari dashboard",
      }));
      const { data: dibuat, error } = await admin.from("schedules").insert(rows).select("id, scheduled_at, session_number");
      if (error) return gagal("Gagal menyimpan: " + error.message, 500);
      const daftar = rows.map((r) => `• Sesi ${r.session_number}: ${labelSesi(new Date(r.scheduled_at).getTime(), k.bahan.durasi)}`).join("\n");
      if (k.guru) await kabari(admin, reg, k.guru, "Jadwal baru dipesan siswa 📅",
        `${nama} memesan jadwal kelas ${labelKelas(reg)} lewat dashboard Linguo:\n${daftar}\n\nJadwalnya sudah otomatis masuk kalender. Kalau ternyata ada yang bentrok, kabari di sini ya 🙏`,
        (dibuat?.[0] as { id: string } | undefined)?.id ?? null);
      return NextResponse.json({ ok: true, dibuat: dibuat?.length ?? rows.length });
    }

    if (aksi === "pindah" || aksi === "batal") {
      const { data: s } = await admin.from("schedules")
        .select("id, registration_id, teacher_id, student_id, scheduled_at, duration_minutes, status, session_number")
        .eq("id", String(body.scheduleId || "")).maybeSingle();
      const sesi = s as Sched | null;
      const reg = sesi && regs.find((r) => r.id === sesi.registration_id);
      if (!sesi || !reg) return gagal("Sesi tidak ditemukan atau jadwalnya tidak bisa diatur sendiri");
      if (!["scheduled", "pending"].includes(String(sesi.status))) return gagal("Sesi ini sudah tidak aktif");
      const lama = new Date(sesi.scheduled_at).getTime();
      if (lama - Date.now() < BATAS_UBAH_JAM * 3600_000) {
        return gagal("Kurang dari 24 jam sebelum kelas, jadwal tidak bisa diubah lagi dan sesinya tetap terhitung. Kalau berhalangan, kabari pengajar di grup kelas ya.", 409);
      }
      const durLama = Number(sesi.duration_minutes) || 60;
      const no = sesi.session_number ? `Sesi ${sesi.session_number}` : "sesi";

      if (aksi === "batal") {
        const alasan = String(body.alasan || "").slice(0, 300).trim();
        const { error } = await admin.from("schedules").update({
          status: "cancelled", cancelled_at: new Date().toISOString(), cancelled_by: "student",
          cancel_reason: alasan || "Dibatalkan siswa dari dashboard (H-1)",
        }).eq("id", sesi.id).in("status", ["scheduled", "pending"]);
        if (error) return gagal("Gagal membatalkan: " + error.message, 500);
        const k = await konteksReg(admin, reg);
        if (k.guru) await kabari(admin, reg, k.guru, "Siswa membatalkan sesi",
          `${nama} membatalkan ${no} kelas ${labelKelas(reg)} (${labelSesi(lama, durLama)}) lewat dashboard Linguo${alasan ? `. Alasan: ${alasan}` : ""}.\n\nJamnya kembali kosong dan jatah sesinya kembali ke siswa.`,
          sesi.id);
        return NextResponse.json({ ok: true });
      }

      const baru = Number(body.slot);
      if (!Number.isFinite(baru)) return gagal("Pilih jam pengganti");
      const k = await konteksReg(admin, reg, sesi.id);
      if (!k.guruAktif || !k.availSegar) return gagal("Jadwal pengajar ini belum dibuka untuk diatur sendiri. Atur lewat grup kelas ya.");
      k.bahan.durasi = durLama;
      const alasan = alasanSlotDitolak(k.bahan, baru);
      if (alasan) return gagal(`${alasan}. Muat ulang pilihan jamnya.`, 409);
      const { error } = await admin.from("schedules").update({ scheduled_at: new Date(baru).toISOString() })
        .eq("id", sesi.id).in("status", ["scheduled", "pending"]);
      if (error) return gagal("Gagal memindah: " + error.message, 500);
      if (k.guru) await kabari(admin, reg, k.guru, "Siswa memindah jadwal",
        `${nama} memindah ${no} kelas ${labelKelas(reg)} lewat dashboard Linguo:\nDari: ${labelSesi(lama, durLama)}\nKe: ${labelSesi(baru, durLama)}\n\nKalender sudah otomatis diperbarui 🙏`,
        sesi.id);
      return NextResponse.json({ ok: true });
    }

    return gagal("Aksi tidak dikenal");
  } catch (e) {
    console.error("[atur-jadwal] error:", e);
    return gagal("Terjadi kesalahan, coba lagi", 500);
  }
}
