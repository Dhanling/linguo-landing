// [cek-jadwal-profil-v1] Profil belajar yang ditanyakan pop-up Cek Jadwal (Private) sesudah pilih
// bahasa: level, tujuan, minat. Dibawa lewat query ?level=&tujuan=&minat= ke /jadwal/<bahasa>,
// lalu ke form daftar (level terpilih + tujuan/minat ikut teks preferensi yang dilihat admin).

export const LEVEL_PROFIL = [
  { key: "A1", bar: 1, title: "Baru tahu sedikit kata (A1)", desc: "A1 atau di bawahnya: Pemula / dari nol" },
  { key: "A2", bar: 2, title: "Bisa ungkapan sederhana (A2)", desc: "A2: Elementary" },
  { key: "B1", bar: 3, title: "Bisa percakapan dasar (B1)", desc: "B1: Intermediate" },
  { key: "B2", bar: 4, title: "Bisa percakapan mendalam (B2)", desc: "B2: Upper Intermediate" },
  { key: "C1", bar: 5, title: "Hampir fasih (C1–C2)", desc: "C1 atau C2: Advanced / Proficient" },
] as const;

export const TUJUAN = [
  { key: "hobi", label: "Hobi atau minat budaya" },
  { key: "traveling", label: "Persiapan traveling" },
  { key: "otak", label: "Latihan otak" },
  { key: "ujian", label: "Ujian atau sekolah" },
  { key: "pindah", label: "Pindah ke negara baru" },
  { key: "keluarga", label: "Keluarga atau pasangan" },
  { key: "kerja", label: "Pekerjaan" },
  { key: "anak", label: "Untuk anak saya" },
] as const;

export const MINAT = [
  { key: "musik", emoji: "🎵", label: "Musik" },
  { key: "olahraga", emoji: "🏀", label: "Olahraga & Kebugaran" },
  { key: "kuliner", emoji: "🍕", label: "Kuliner" },
  { key: "film", emoji: "🎬", label: "Film & Serial" },
  { key: "membaca", emoji: "📚", label: "Membaca" },
  { key: "menulis", emoji: "✍️", label: "Menulis" },
  { key: "seni", emoji: "🎨", label: "Seni" },
  { key: "sejarah", emoji: "🏛️", label: "Sejarah" },
  { key: "sains", emoji: "🔬", label: "Sains" },
  { key: "bisnis", emoji: "💼", label: "Bisnis & Keuangan" },
  { key: "kesehatan", emoji: "🩺", label: "Kesehatan & Medis" },
  { key: "teknologi", emoji: "💻", label: "Teknologi" },
  { key: "hewan", emoji: "🐾", label: "Hewan Peliharaan" },
  { key: "game", emoji: "🎮", label: "Game" },
  { key: "traveling", emoji: "✈️", label: "Traveling" },
  { key: "hukum", emoji: "⚖️", label: "Hukum" },
  { key: "marketing", emoji: "📈", label: "Marketing" },
  { key: "fashion", emoji: "👗", label: "Fashion & Kecantikan" },
  { key: "alam", emoji: "🌿", label: "Lingkungan & Alam" },
  { key: "animasi", emoji: "🦸", label: "Animasi & Komik" },
] as const;

export const MAKS_MINAT = 5;

export type ProfilBelajar = { level: string; tujuan: string; minat: string[] };

/** Baca dari query string; null kalau tidak lengkap (mis. buka /jadwal/<bahasa> langsung). */
export function profilDariQuery(search: string): ProfilBelajar | null {
  const sp = new URLSearchParams(search);
  const level = LEVEL_PROFIL.find((l) => l.key === (sp.get("level") || "").toUpperCase())?.key;
  const tujuan = TUJUAN.find((t) => t.key === sp.get("tujuan"))?.key;
  const minat = (sp.get("minat") || "").split(",").filter((m) => MINAT.some((x) => x.key === m)).slice(0, MAKS_MINAT);
  return level && tujuan && minat.length ? { level, tujuan, minat } : null;
}

export function queryProfil(p: ProfilBelajar) {
  return new URLSearchParams({ level: p.level, tujuan: p.tujuan, minat: p.minat.join(",") }).toString();
}

/** Level untuk funnel daftar: produk Private cuma A1–B2, jadi C1–C2 → B2 (teks profil tetap "C1–C2"). */
export const levelFunnel = (level: string) => (level === "C1" ? "B2" : level);

export function teksProfil(p: ProfilBelajar) {
  const lv = p.level === "C1" ? "C1–C2" : p.level;
  const tj = TUJUAN.find((t) => t.key === p.tujuan)?.label ?? p.tujuan;
  const mn = p.minat.map((m) => MINAT.find((x) => x.key === m)?.label ?? m).join(", ");
  return `Level ${lv} · Tujuan: ${tj} · Minat: ${mn}`;
}
