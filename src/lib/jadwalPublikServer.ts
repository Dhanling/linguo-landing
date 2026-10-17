// [jadwal-publik-v1] Kalender jam kosong Kelas Private per BAHASA untuk calon siswa
// (/jadwal/<bahasa>), tanpa login dan tanpa nama pengajar.
//
// Satu jam tampil kalau minimal MIN_PENGAJAR pengajar aktif bahasa itu kosong di jam
// tersebut: Availability-nya diperbarui ≤ AVAIL_SEGAR_HARI dan tidak bentrok dengan sesi,
// batch, atau jam mingguan kelas Private yang sedang jalan (sibukKelasJalan).
// Aturan per pengajar = rumus "Atur jadwal sendiri"
// (lib/aturJadwal), jadi yang dilihat calon siswa sama dengan yang nanti bisa dipesan.
//
// Jam yang dipilih TIDAK ditahan: ia dibawa ke /daftar sebagai preferensi
// (leads.schedule_preference → registrations.preferred_schedule) dan pengajarnya
// ditugaskan tim sesudah lunas.
//
// [jadwal-satu-guru-v1] Private = satu siswa satu pengajar (keputusan owner 17 Okt). Supaya
// kalender bisa menyaring pilihan ke jam yang dipegang pengajar yang SAMA, tiap slot ikut
// membawa nomor urut pengajar (0, 1, 2… acak per respons) — bukan id, nama, atau email.

import { createClient } from "@supabase/supabase-js";
import { daftarSlot, type BahanSlot } from "@/lib/aturJadwal";
import { bahanPengajar, MATI, type Admin } from "@/lib/aturJadwalServer";
import { JENDELA_HARI, type Interval } from "@/lib/aturJadwal";
import { languageSlug } from "@/lib/languageSlug";

/** Turunkan/naikkan sesudah cakupan Availability cukup — 2 = selalu ada cadangan. */
export const MIN_PENGAJAR = 1;
export const DURASI_PUBLIK = [30, 45, 60, 90] as const;

const HARI = 86_400_000;
const SEGAR_HARI = 30;

/** Akun yang bukan pengajar sungguhan. Owner DULU dikecualikan (31 bahasa), tapi owner
 *  memang ikut mengajar dan minta jam kosongnya tampil (17 Okt). */
const BUKAN_PENGAJAR = new Set<string>();

/** Kelas Private yang sedang jalan jarang punya baris `schedules` ke depan (59 dari 62
 *  per 17 Okt): sesi dicatat sesudah terjadi. Jam mingguannya ditebak dari sesi
 *  ≤ POLA_HARI terakhir lalu diulang tiap minggu, supaya jam itu tidak tampil kosong. */
const POLA_HARI = 28;
const MINGGU = 7 * HARI;

async function sibukKelasJalan(admin: Admin, teacherId: string, sekarang: number) {
  const [regs, sesi] = await Promise.all([
    admin.from("registrations")
      .select("id, sessions_used, total_sessions, sessions_total, expiry_date, pipeline_status, archived_at")
      .eq("teacher_id", teacherId).is("archived_at", null).eq("pipeline_status", "Aktif").range(0, 999),
    admin.from("schedules").select("registration_id, scheduled_at, duration_minutes, status")
      .eq("teacher_id", teacherId)
      .gte("scheduled_at", new Date(sekarang - POLA_HARI * HARI).toISOString())
      .lte("scheduled_at", new Date(sekarang).toISOString()).range(0, 999),
  ]);
  type R = { id: string; sessions_used: number | null; total_sessions: number | null; sessions_total: number | null; expiry_date: string | null };
  const jalanIds = new Set(((regs.data ?? []) as R[])
    .filter((r) => (Number(r.sessions_used) || 0) < (Number(r.total_sessions || r.sessions_total) || 16))
    .filter((r) => !r.expiry_date || new Date(r.expiry_date).getTime() > sekarang)
    .map((r) => r.id));
  const akhir = sekarang + (JENDELA_HARI + 2) * HARI;
  const hasil: Interval[] = [];
  for (const s of (sesi.data ?? []) as { registration_id: string | null; scheduled_at: string; duration_minutes: number | null; status: string | null }[]) {
    if (!s.registration_id || !jalanIds.has(s.registration_id) || MATI.has(String(s.status || ""))) continue;
    const t = new Date(s.scheduled_at).getTime();
    // Detik ≠ 0 = sesi yang dicatat massal (Lengkapi sesi / impor), bukan jam kelas sungguhan.
    if (t % 60_000 !== 0) continue;
    const lama = (Number(s.duration_minutes) || 60) * 60_000;
    for (let m = t + MINGGU; m <= akhir; m += MINGGU) if (m + lama > sekarang) hasil.push({ mulai: m, selesai: m + lama });
  }
  return hasil;
}

/** "English - British" tidak dikenal languageSlug → coba bagian sebelum " - ".
 *  Label produk (mis. "Test Prep - TOEFL") tetap dibaca utuh lebih dulu. */
const bahasaPengajar = (l: string) => languageSlug(l) ?? languageSlug(l.split(/\s[-–]\s/)[0]);

export type HasilJadwalPublik = {
  bahasa: string;
  durasi: number;
  /** epoch ms jam mulai yang bisa dipilih, urut. */
  slot: number[];
  /** Sejajar `slot`: nomor urut pengajar yang kosong di jam itu. */
  guru: number[][];
  /** Jam yang ada di Availability pengajar tapi sudah terisi sesi/batch (blok merah). */
  terisi: number[];
  /** Ada pengajar bahasa ini yang Availability-nya segar (walau mungkin penuh). */
  adaPengajar: boolean;
  /** [ganti-pengajar-v1] Jumlah pengajar aktif bahasa ini (terlepas dari Availability).
   *  ≤ 1 = bahasa terbatas → tidak bisa ganti pengajar. */
  jumlahPengajar: number;
  diperbarui: number;
};

function adminClient(): Admin {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** langEn funnel ("Korean") → slot terbuka 14 hari ke depan. */
export async function jadwalPublik(langEn: string, durasi: number): Promise<HasilJadwalPublik> {
  const admin = adminClient();
  const sekarang = Date.now();
  const target = languageSlug(langEn);
  const kosong = { bahasa: langEn, durasi, slot: [], guru: [], terisi: [], adaPengajar: false, jumlahPengajar: 0, diperbarui: sekarang };
  if (!target) return kosong;

  // [ganti-pengajar-v1] Semua pengajar aktif bahasa ini, untuk aturan ganti pengajar
  // (maks 1 kali; bahasa yang pengajarnya cuma 1 tidak bisa ganti).
  type Guru = { id: string; email: string | null; status: string | null; languages: string[] | null };
  const { data: semuaGuru } = await admin.from("teachers").select("id, email, status, languages").range(0, 9999);
  const guruBahasa = ((semuaGuru ?? []) as Guru[])
    .filter((g) => String(g.status || "").toLowerCase() === "aktif")
    .filter((g) => !BUKAN_PENGAJAR.has(String(g.email || "").toLowerCase()))
    .filter((g) => (g.languages ?? []).some((l) => bahasaPengajar(l) === target));
  kosong.jumlahPengajar = guruBahasa.length;

  // Pengajar yang menyentuh Availability ≤30 hari (simpan = hapus lalu isi ulang,
  // jadi created_at = terakhir diperbarui).
  const batas = new Date(sekarang - SEGAR_HARI * HARI).toISOString();
  const [a, o] = await Promise.all([
    admin.from("teacher_availability").select("teacher_id").gte("created_at", batas).range(0, 9999),
    admin.from("teacher_availability_overrides").select("teacher_id").gte("created_at", batas).range(0, 9999),
  ]);
  const ids = [...new Set([...(a.data ?? []), ...(o.data ?? [])].map((r: { teacher_id: string }) => r.teacher_id))];
  if (!ids.length) return kosong;

  const segar = new Set(ids);
  const cocok = guruBahasa.filter((g) => segar.has(g.id));
  if (!cocok.length) return kosong;

  // Nomor urut diacak supaya urutannya tidak bisa dicocokkan ke daftar pengajar.
  const acak = cocok.map((g) => g.id).sort(() => Math.random() - 0.5);
  const hitung = new Map<number, number[]>();
  // Jam yang dibuka pengajar di Availability, terlepas dari jadwal yang sudah jalan.
  const dibuka = new Set<number>();
  let adaPengajar = false;
  await Promise.all(cocok.map(async (g) => {
    const [p, pola] = await Promise.all([bahanPengajar(admin, g.id, sekarang), sibukKelasJalan(admin, g.id, sekarang)]);
    if (!p.availSegar) return;
    adaPengajar = true;
    const bahan: BahanSlot = {
      mingguan: p.mingguan, pengecualian: p.pengecualian, sibuk: [...p.sibuk, ...pola],
      durasi, sekarang, batasAkhir: null,
    };
    const no = acak.indexOf(g.id);
    for (const t of daftarSlot(bahan)) hitung.set(t, [...(hitung.get(t) ?? []), no]);
    for (const t of daftarSlot({ ...bahan, sibuk: [] })) dibuka.add(t);
  }));

  const slot = [...hitung.entries()].filter(([, n]) => n.length >= MIN_PENGAJAR).map(([t]) => t).sort((x, y) => x - y);
  const guruSlot = slot.map((t) => [...hitung.get(t)!].sort((x, y) => x - y));
  const bisa = new Set(slot);
  const terisi = [...dibuka].filter((t) => !bisa.has(t)).sort((x, y) => x - y);
  return { bahasa: langEn, durasi, slot, guru: guruSlot, terisi, adaPengajar, jumlahPengajar: guruBahasa.length, diperbarui: sekarang };
}
