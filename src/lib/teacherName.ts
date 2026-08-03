/* ── Nama sapaan pengajar ────────────────────────────────────────────────────
   [teacher-sapaan-v1] Kolom `teachers.name` di database berisi nama lengkap apa
   adanya, kadang lengkap dengan gelar ("Ayu Shinta Yuliani, S.Pd.,Gr"). Yang
   dipakai di layar siswa cuma sapaan + nama panggilan: "Kak Ayu" — nama panjang
   bikin kartu kelas & daftar sesi terpotong, dan bukan begitu siswa manggil
   pengajarnya.

   Dulu logika ini cuma hidup di halaman konfirmasi jadwal publik; sekarang
   dipakai bareng-bareng sama dashboard siswa, makanya pindah ke sini. */

const GELAR = /^(mr|mrs|ms|miss|dr|drs|ir|prof|kak|bu|pak|mba|mbak|mas)\.?$/i;

/* Nama depan yang di Indonesia hampir selalu berfungsi sebagai awalan, bukan
   nama panggilan: "Muhamad Lutfi Ramadhani" dipanggil Lutfi, bukan Muhamad.
   Daftarnya sengaja pendek dan hanya berisi varian ejaan Muhammad — nama seperti
   Ahmad atau Siti memang sering dipakai sebagai panggilan, jadi tidak dilewati. */
const AWALAN = /^(m|moh|mohd|muh|mochamad|mochammad|mohamad|mohammad|muhamad|muhammad)\.?$/i;

/* Panggilan yang tidak bisa ditebak dari susunan katanya — ditulis manual.
   ⚠️ Kembaran daftar ini ada di dashboard pengajar
   (linguo-admin-dashboard `TeacherDashboard.tsx` → `getTeacherNickname`);
   kalau nambah baris di sini, samakan juga di sana biar siswa dan pengajar
   ga lihat panggilan yang beda buat orang yang sama. */
const PANGGILAN_KHUSUS: Record<string, string> = {
  "muhamad lutfi ramadhani": "Dhani",
};

/** "Muhamad Lutfi Ramadhani" → "Dhani". Tanpa sapaan. */
export function callName(fullName?: string | null): string {
  const raw = (fullName ?? "").trim();
  if (!raw) return "";

  const khusus = PANGGILAN_KHUSUS[raw.toLowerCase().replace(/\s+/g, " ")];
  if (khusus) return khusus;

  // Nama panggilan yang ditulis di dalam kurung ("Ataya Syakira Azmi (aya)")
  // selalu menang: itu yang orangnya sendiri pilih.
  const dalamKurung = raw.match(/\(([^)]{2,})\)/)?.[1]?.trim();
  const dasar = dalamKurung || raw.split(",")[0];

  const kata = dasar.replace(/\(.*?\)/g, " ").split(/\s+/).filter(Boolean);
  const bersih = kata.filter((k) => !GELAR.test(k));
  // Awalan cuma dilewati kalau masih ada kata sesudahnya — orang yang namanya
  // memang cuma "Muhammad" tetap dipanggil Muhammad.
  const pilihan = bersih.length > 1 && AWALAN.test(bersih[0]) ? bersih.slice(1) : bersih;
  const pertama = pilihan[0] || kata[0] || "";
  return pertama.charAt(0).toUpperCase() + pertama.slice(1);
}

/** "Kak Dhani". `title` diambil dari kolom `teachers.title` (nyaris selalu "Kak"). */
export function sapaan(fullName?: string | null, title?: string | null): string {
  const nama = callName(fullName);
  if (!nama) return "";
  return `${(title || "Kak").trim()} ${nama}`;
}

/** Inisial untuk avatar tanpa foto — satu huruf, dari nama panggilan (bukan sapaannya). */
export function initial(fullName?: string | null): string {
  return callName(fullName).charAt(0).toUpperCase() || "?";
}
