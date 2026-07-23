// [materi-gate-v1] Gate akses menu yang masih under development — sementara hanya
// dibuka untuk email tertentu. Tambah email ke allowlist di bawah kalau mau buka
// akses ke lebih banyak orang.
// [dev-gate-lingbook-v1] menu "Lingbook" ikut digate dengan allowlist yang sama.
export const MATERI_ALLOWLIST = ["mlutfiramadhani1@gmail.com", "official.linguo@gmail.com"];

/** True kalau email boleh akses menu Kelas & Materi. */
export function canAccessMateri(email?: string | null): boolean {
  if (!email) return false;
  return MATERI_ALLOWLIST.includes(email.trim().toLowerCase());
}

/** True kalau email boleh akses menu/halaman Lingbook (allowlist sama dgn Materi). */
export function canAccessLingbook(email?: string | null): boolean {
  return canAccessMateri(email);
}
