// [jadwal-publik-v1] Kalender jam kosong Kelas Private per BAHASA untuk calon siswa
// (/jadwal/<bahasa>), tanpa login dan tanpa nama pengajar.
//
// Satu jam tampil kalau minimal MIN_PENGAJAR pengajar aktif bahasa itu kosong di jam
// tersebut: Availability-nya diperbarui ≤ AVAIL_SEGAR_HARI dan tidak bentrok dengan sesi
// atau batch yang sudah ada. Aturan per pengajar = rumus "Atur jadwal sendiri"
// (lib/aturJadwal), jadi yang dilihat calon siswa sama dengan yang nanti bisa dipesan.
//
// Jam yang dipilih TIDAK ditahan: ia dibawa ke /daftar sebagai preferensi
// (leads.schedule_preference → registrations.preferred_schedule) dan pengajarnya
// ditugaskan tim sesudah lunas. Karena itu cukup jumlah, bukan identitas pengajar.

import { createClient } from "@supabase/supabase-js";
import { daftarSlot, type BahanSlot } from "@/lib/aturJadwal";
import { bahanPengajar, type Admin } from "@/lib/aturJadwalServer";
import { languageSlug } from "@/lib/languageSlug";

/** Turunkan/naikkan sesudah cakupan Availability cukup — 2 = selalu ada cadangan. */
export const MIN_PENGAJAR = 1;
export const DURASI_PUBLIK = [30, 45, 60, 90] as const;

const HARI = 86_400_000;
const SEGAR_HARI = 30;

/** Akun yang bukan pengajar sungguhan tapi tercatat mengajar banyak bahasa (owner). */
const BUKAN_PENGAJAR = new Set(["mlutfiramadhani1@gmail.com"]);

/** "English - British" tidak dikenal languageSlug → coba bagian sebelum " - ".
 *  Label produk (mis. "Test Prep - TOEFL") tetap dibaca utuh lebih dulu. */
const bahasaPengajar = (l: string) => languageSlug(l) ?? languageSlug(l.split(/\s[-–]\s/)[0]);

export type HasilJadwalPublik = {
  bahasa: string;
  durasi: number;
  /** epoch ms jam mulai yang bisa dipilih, urut. */
  slot: number[];
  /** Jam yang ada di Availability pengajar tapi sudah terisi sesi/batch (blok merah). */
  terisi: number[];
  /** Ada pengajar bahasa ini yang Availability-nya segar (walau mungkin penuh). */
  adaPengajar: boolean;
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
  const kosong = { bahasa: langEn, durasi, slot: [], terisi: [], adaPengajar: false, diperbarui: sekarang };
  if (!target) return kosong;

  // Pengajar yang menyentuh Availability ≤30 hari (simpan = hapus lalu isi ulang,
  // jadi created_at = terakhir diperbarui).
  const batas = new Date(sekarang - SEGAR_HARI * HARI).toISOString();
  const [a, o] = await Promise.all([
    admin.from("teacher_availability").select("teacher_id").gte("created_at", batas).range(0, 9999),
    admin.from("teacher_availability_overrides").select("teacher_id").gte("created_at", batas).range(0, 9999),
  ]);
  const ids = [...new Set([...(a.data ?? []), ...(o.data ?? [])].map((r: { teacher_id: string }) => r.teacher_id))];
  if (!ids.length) return kosong;

  const { data: guru } = await admin.from("teachers").select("id, email, status, languages").in("id", ids);
  const cocok = ((guru ?? []) as { id: string; email: string | null; status: string | null; languages: string[] | null }[])
    .filter((g) => String(g.status || "").toLowerCase() === "aktif")
    .filter((g) => !BUKAN_PENGAJAR.has(String(g.email || "").toLowerCase()))
    .filter((g) => (g.languages ?? []).some((l) => bahasaPengajar(l) === target));
  if (!cocok.length) return kosong;

  const hitung = new Map<number, number>();
  // Jam yang dibuka pengajar di Availability, terlepas dari jadwal yang sudah jalan.
  const dibuka = new Set<number>();
  let adaPengajar = false;
  await Promise.all(cocok.map(async (g) => {
    const p = await bahanPengajar(admin, g.id, sekarang);
    if (!p.availSegar) return;
    adaPengajar = true;
    const bahan: BahanSlot = {
      mingguan: p.mingguan, pengecualian: p.pengecualian, sibuk: p.sibuk,
      durasi, sekarang, batasAkhir: null,
    };
    for (const t of daftarSlot(bahan)) hitung.set(t, (hitung.get(t) ?? 0) + 1);
    for (const t of daftarSlot({ ...bahan, sibuk: [] })) dibuka.add(t);
  }));

  const slot = [...hitung.entries()].filter(([, n]) => n >= MIN_PENGAJAR).map(([t]) => t).sort((x, y) => x - y);
  const bisa = new Set(slot);
  const terisi = [...dibuka].filter((t) => !bisa.has(t)).sort((x, y) => x - y);
  return { bahasa: langEn, durasi, slot, terisi, adaPengajar, diperbarui: sekarang };
}
