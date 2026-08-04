// [materi-gate-v1] Gate akses menu yang masih under development — sementara hanya
// dibuka untuk email tertentu. Tambah email ke allowlist di bawah kalau mau buka
// akses ke lebih banyak orang.
// [dev-gate-lingbook-v1] menu "Lingbook" ikut digate dengan allowlist yang sama.
export const MATERI_ALLOWLIST = ["mlutfiramadhani1@gmail.com", "official.linguo@gmail.com"];

/**
 * [materi-bahasa-siswa-v1] Menu "Kelas & Materi" SUDAH DIBUKA untuk semua siswa.
 * Isinya memang sudah dibatasi datanya sendiri: kelas live = registrasi milik siswa,
 * Belajar Mandiri = bahasa yang dia ambil/beli. Jadi tak ada lagi yang perlu digate
 * per-email. Fungsi ini sengaja dipertahankan (bukan dihapus) supaya pemanggilnya
 * tidak perlu diubah kalau nanti mau digate lagi.
 */
export function canAccessMateri(_email?: string | null): boolean {
  return true;
}

/** True kalau email boleh akses menu/halaman Lingbook — masih development, allowlist. */
export function canAccessLingbook(email?: string | null): boolean {
  if (!email) return false;
  return MATERI_ALLOWLIST.includes(email.trim().toLowerCase());
}
