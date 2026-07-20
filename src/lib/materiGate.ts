// [materi-gate-v1] Gate akses menu "Kelas & Materi" — masih under development,
// jadi sementara hanya dibuka untuk email tertentu. Tambah email ke allowlist
// di bawah kalau mau buka akses ke lebih banyak orang.
export const MATERI_ALLOWLIST = ["mlutfiramadhani1@gmail.com"];

/** True kalau email boleh akses menu Kelas & Materi. */
export function canAccessMateri(email?: string | null): boolean {
  if (!email) return false;
  return MATERI_ALLOWLIST.includes(email.trim().toLowerCase());
}
