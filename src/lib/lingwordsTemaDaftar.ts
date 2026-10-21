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
