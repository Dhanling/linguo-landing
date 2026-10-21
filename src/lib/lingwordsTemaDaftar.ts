// [lingwords-v2] Daftar tema Peta Kata — berkas polos tanpa klien Supabase supaya
// bisa diimpor rute API (/api/lingwords-tema) maupun komponen browser.

export const LW_THEMES = [
  { id: "makanan", label: "Makanan & minuman" },
  { id: "keluarga", label: "Keluarga & orang" },
  { id: "angka_waktu", label: "Angka & waktu" },
  { id: "transportasi", label: "Transportasi & tempat" },
  { id: "rumah", label: "Rumah" },
  { id: "cuaca", label: "Cuaca & alam" },
  { id: "belanja", label: "Belanja & uang" },
  { id: "sekolah_kerja", label: "Sekolah & kerja" },
  { id: "sapaan", label: "Sapaan & ungkapan" },
  { id: "kata_umum", label: "Kata kerja & sifat umum" },
  { id: "lainnya", label: "Lainnya" },
] as const;

export type LwThemeId = (typeof LW_THEMES)[number]["id"];
export const LW_THEME_IDS = LW_THEMES.map((x) => x.id) as LwThemeId[];

// [lingwords-kelas-kata-v1] Kelas kata untuk bar kartu Lingwords (benda/kerja/sifat/lainnya).
// Sama seperti tema: sifat KATA, di-cache per kata (tabel bersama word_pos).
export const LW_POS = [
  { id: "benda", label: "Kata benda" },
  { id: "kerja", label: "Kata kerja" },
  { id: "sifat", label: "Kata sifat" },
  { id: "lainnya", label: "Lainnya" },
] as const;

export type LwPosId = (typeof LW_POS)[number]["id"];
export const LW_POS_IDS = LW_POS.map((x) => x.id) as LwPosId[];
