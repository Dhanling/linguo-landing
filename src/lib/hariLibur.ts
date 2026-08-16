// [kalender-hari-libur-v1] Hari libur nasional & cuti bersama Indonesia.
//
// Dipakai kalender jadwal di DUA tempat (isinya sengaja dikembar persis):
//   · dashboard pengajar  → linguo-admin-dashboard/src/lib/hariLibur.ts
//   · dashboard siswa     → linguo-landing/src/lib/hariLibur.ts (file ini)
// Kalau daftarnya diubah, ubah DUA-DUANYA.
//
// Sumber 2026: SKB 3 Menteri No. 1497, 2, dan 5 Tahun 2025 (setneg.go.id) —
// 17 hari libur nasional + 8 hari cuti bersama.
//
// ⚠️ Tanggal libur keagamaan (Idulfitri, Iduladha, Nyepi, Waisak, dst.) BARU pasti
// setelah SKB tahun bersangkutan terbit — SKB 2027 baru keluar sekitar akhir 2026.
// Tanggal 2027 di bawah karena itu ditandai `perkiraan: true` (hitungan kalender
// Hijriah/gerejawi) dan tergambar dengan awalan "≈": kalender pengajar dipakai
// menjadwalkan kelas berbulan-bulan ke depan, jadi 2027 yang kosong melompong lebih
// menyesatkan daripada perkiraan yang jujur mengaku perkiraan. Cuti bersama 2027
// TIDAK ditebak — itu murni keputusan pemerintah, bukan hitungan kalender.

export type HariLibur = {
  /** yyyy-MM-dd (waktu lokal, bukan UTC) */
  date: string;
  name: string;
  /** true = cuti bersama (bukan libur nasional) */
  cutiBersama?: boolean;
  /** true = belum ada SKB-nya, tanggalnya masih hitungan (bisa geser 1 hari) */
  perkiraan?: boolean;
};

export const HARI_LIBUR: HariLibur[] = [
  // ── 2026 — libur nasional ────────────────────────────────────────────────
  { date: "2026-01-01", name: "Tahun Baru Masehi" },
  { date: "2026-01-16", name: "Isra Mikraj Nabi Muhammad" },
  { date: "2026-02-17", name: "Tahun Baru Imlek" },
  { date: "2026-03-19", name: "Hari Suci Nyepi" },
  { date: "2026-03-21", name: "Idulfitri 1447 H" },
  { date: "2026-03-22", name: "Idulfitri 1447 H" },
  { date: "2026-04-03", name: "Wafat Yesus Kristus" },
  { date: "2026-04-05", name: "Hari Raya Paskah" },
  { date: "2026-05-01", name: "Hari Buruh Internasional" },
  { date: "2026-05-14", name: "Kenaikan Yesus Kristus" },
  { date: "2026-05-27", name: "Iduladha 1447 H" },
  { date: "2026-05-31", name: "Hari Raya Waisak" },
  { date: "2026-06-01", name: "Hari Lahir Pancasila" },
  { date: "2026-06-16", name: "Tahun Baru Islam 1448 H" },
  { date: "2026-08-17", name: "Proklamasi Kemerdekaan RI" },
  { date: "2026-08-25", name: "Maulid Nabi Muhammad" },
  { date: "2026-12-25", name: "Kelahiran Yesus Kristus (Natal)" },
  // ── 2026 — cuti bersama ──────────────────────────────────────────────────
  { date: "2026-02-16", name: "Cuti Bersama Imlek", cutiBersama: true },
  { date: "2026-03-18", name: "Cuti Bersama Nyepi", cutiBersama: true },
  { date: "2026-03-20", name: "Cuti Bersama Idulfitri", cutiBersama: true },
  { date: "2026-03-23", name: "Cuti Bersama Idulfitri", cutiBersama: true },
  { date: "2026-03-24", name: "Cuti Bersama Idulfitri", cutiBersama: true },
  { date: "2026-05-15", name: "Cuti Bersama Kenaikan Yesus Kristus", cutiBersama: true },
  { date: "2026-05-28", name: "Cuti Bersama Iduladha", cutiBersama: true },
  { date: "2026-12-24", name: "Cuti Bersama Natal", cutiBersama: true },
  // ── 2027 — bertanggal tetap (pasti, tak perlu SKB) ───────────────────────
  { date: "2027-01-01", name: "Tahun Baru Masehi" },
  { date: "2027-05-01", name: "Hari Buruh Internasional" },
  { date: "2027-06-01", name: "Hari Lahir Pancasila" },
  { date: "2027-08-17", name: "Proklamasi Kemerdekaan RI" },
  { date: "2027-12-25", name: "Kelahiran Yesus Kristus (Natal)" },
  // ── 2027 — PERKIRAAN, menunggu SKB (lihat catatan di kepala berkas) ──────
  // Islam: hitungan Hijriah dari 1 Muharram 1448 = 16 Jun 2026 (SKB 2026).
  // Kristen: Paskah 2027 = 28 Mar → Jumat Agung 26 Mar, Kenaikan 6 Mei.
  { date: "2027-01-05", name: "Isra Mikraj Nabi Muhammad", perkiraan: true },
  { date: "2027-02-06", name: "Tahun Baru Imlek", perkiraan: true },
  { date: "2027-03-09", name: "Hari Suci Nyepi", perkiraan: true },
  { date: "2027-03-10", name: "Idulfitri 1448 H", perkiraan: true },
  { date: "2027-03-11", name: "Idulfitri 1448 H", perkiraan: true },
  { date: "2027-03-26", name: "Wafat Yesus Kristus", perkiraan: true },
  { date: "2027-03-28", name: "Hari Raya Paskah", perkiraan: true },
  { date: "2027-05-06", name: "Kenaikan Yesus Kristus", perkiraan: true },
  { date: "2027-05-17", name: "Iduladha 1448 H", perkiraan: true },
  { date: "2027-05-20", name: "Hari Raya Waisak", perkiraan: true },
  { date: "2027-06-06", name: "Tahun Baru Islam 1449 H", perkiraan: true },
  { date: "2027-08-15", name: "Maulid Nabi Muhammad", perkiraan: true },
];

/** Peta yyyy-MM-dd → libur. Satu tanggal bisa punya lebih dari satu nama (digabung). */
const BY_DATE: Record<string, HariLibur> = (() => {
  const map: Record<string, HariLibur> = {};
  for (const h of HARI_LIBUR) {
    const prev = map[h.date];
    map[h.date] = prev
      ? { ...prev, name: `${prev.name} · ${h.name}` }
      : h;
  }
  return map;
})();

/** yyyy-MM-dd dari Date memakai komponen LOKAL (toISOString bisa geser 1 hari). */
export function isoLokal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Libur pada tanggal tertentu — `null` kalau hari biasa. */
export function liburOn(d: Date | string): HariLibur | null {
  const iso = typeof d === "string" ? d.slice(0, 10) : isoLokal(d);
  return BY_DATE[iso] ?? null;
}

/**
 * Nama libur ringkas buat kolom sempit (mis. "Cuti Bersama Idulfitri" → "Cuti
 * Idulfitri"). Kata "Cuti" sengaja DIPERTAHANKAN: kalau dipotong habis, 20 Maret
 * (cuti bersama) kebaca sama persis dengan 21 Maret (libur nasional) padahal
 * bobotnya beda buat menjadwalkan kelas.
 */
export function liburSingkat(h: HariLibur): string {
  return h.name.replace(/^Cuti Bersama /, "Cuti ").replace(/ 14\d\d H$/, "");
}

/** Label kolom kalender — "≈" menandai tanggal yang masih perkiraan. */
export function liburLabel(h: HariLibur): string {
  return `${h.perkiraan ? "≈" : ""}${liburSingkat(h)}`;
}

/** Keterangan lengkap buat tooltip / aria-label. */
export function liburTooltip(h: HariLibur): string {
  const jenis = h.cutiBersama ? "cuti bersama" : "libur nasional";
  return `${h.name} (${jenis}${h.perkiraan ? " — perkiraan, menunggu SKB" : ""})`;
}
