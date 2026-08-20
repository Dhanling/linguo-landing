"use client";

/* [ui-lang-switcher-v1] Bahasa antarmuka dashboard siswa (ID ⇄ EN).
   ────────────────────────────────────────────────────────────────
   Sengaja TANPA provider/context: pemilihnya duduk di top bar `/akun`, tapi
   yang harus ikut berganti tersebar sampai ke StudentShell, bottom nav mobile,
   dan komponen tab (Perpustakaan dll). Membungkus semuanya dengan Provider
   berarti menyentuh tiap halaman ber-shell; store modul + `useSyncExternalStore`
   memberi hasil yang sama tanpa satu pun pohon komponen diubah.

   Kunci terjemahan = KALIMAT INDONESIA-nya. Jadi teks yang belum diterjemahkan
   tetap tampil apa adanya (bukan "missing.key"), dan menambah terjemahan cukup
   menambah satu baris di kamus EN di bawah — tak perlu menyentuh komponennya. */

import { useCallback, useEffect, useSyncExternalStore } from "react";

export type UiLang = "id" | "en";

export const UI_LANG_KEY = "linguo_ui_lang";

let current: UiLang = "id";
let hydrated = false;
const subs = new Set<() => void>();

function emit() {
  for (const fn of subs) fn();
}

/** Baca pilihan tersimpan. Dipanggil SESUDAH hidrasi, bukan saat render pertama:
    render server selalu "id", jadi membacanya lebih awal = hydration mismatch. */
function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const saved = localStorage.getItem(UI_LANG_KEY);
    if (saved === "en" || saved === "id") {
      if (saved !== current) {
        current = saved;
        document.documentElement.lang = saved;
        emit();
      }
    }
  } catch {
    /* localStorage diblokir → tetap pakai bawaan */
  }
}

export function getUiLang(): UiLang {
  return current;
}

export function setUiLang(next: UiLang) {
  if (next === current) return;
  current = next;
  hydrated = true;
  try {
    localStorage.setItem(UI_LANG_KEY, next);
    document.documentElement.lang = next;
  } catch {
    /* abaikan */
  }
  emit();
}

function subscribe(fn: () => void) {
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
}

const serverSnapshot = () => "id" as UiLang;

/** Bahasa aktif + ikut re-render saat diganti dari mana pun. */
export function useUiLang(): UiLang {
  const lang = useSyncExternalStore(subscribe, getUiLang, serverSnapshot);
  useEffect(hydrate, []);
  return lang;
}

/** `const t = useT()` lalu `t("Beranda")`. */
export function useT(): (s: string) => string {
  const lang = useUiLang();
  return useCallback((s: string) => (lang === "en" ? EN[s] ?? s : s), [lang]);
}

/** Terjemahan sekali pakai di luar komponen (mis. label yang dirakit di helper). */
export function tr(s: string, lang: UiLang = current): string {
  return lang === "en" ? EN[s] ?? s : s;
}

/* ── Kamus Inggris ────────────────────────────────────────────────────────── */
const EN: Record<string, string> = {
  /* Navigasi sidebar & bottom nav */
  "Beranda": "Home",
  "Jadwal": "Schedule",
  "Grup Kelas": "Class Group",
  "Perpustakaan": "Library",
  "Sertifikat": "Certificates",
  "Kelas & Materi": "Classes & Materials",
  "Lingbook": "Lingbook",
  "Simulasi Tes": "Test Simulation",
  "Watch & Learn": "Watch & Learn",
  "Kosakata Saya": "My Vocabulary",
  "Pengaturan": "Settings",
  "Aktivitas": "Activity",
  "Belajar": "Learn",
  "Akun": "Account",
  "Materi": "Materials",
  "Profil": "Profile",

  /* Aksi umum di shell */
  "Lapor Bug": "Report a Bug",
  "Keluar": "Log out",
  "Mode terang": "Light mode",
  "Mode gelap": "Dark mode",
  "Buka menu": "Open menu",
  "Tutup menu": "Close menu",
  "Menu utama": "Main menu",
  "Menu utama mobile": "Mobile main menu",
  "Siswa": "Student",
  "Siswa Linguo": "Linguo Student",
  "Bahasa antarmuka": "Interface language",
  "Bahasa Indonesia": "Indonesian",
  "Bahasa Inggris": "English",
  "Buka": "Open",
  "Navigasi utama": "Main navigation",
  "Watch": "Watch",
  "di tab baru": "in a new tab",

  /* Top bar /akun */
  "Cari kelas, pengajar, atau bahasa…": "Search classes, teachers, or languages…",
  "Cari di dashboard": "Search the dashboard",
  "Kosongkan pencarian": "Clear search",
  "Buka panel profil": "Open profile panel",
  "Tutup panel profil": "Close profile panel",

  /* Perpustakaan */
  "Perpustakaan Saya": "My Library",
  "E-Book & E-Learning yang sudah kamu beli · buka kapan saja":
    "E-Books & E-Learning you've purchased · open them anytime",
  "Perpustakaan masih kosong": "Your library is still empty",
  "Kamu belum punya E-Book atau E-Learning. Jelajahi toko untuk mulai belajar mandiri kapan saja.":
    "You don't have any E-Book or E-Learning yet. Browse the store to start learning on your own, anytime.",
  "Jelajahi Toko Digital": "Browse the Digital Store",
  "Cari produk…": "Search products…",
  "Semua": "All",
  "E-Learning": "E-Learning",
  "E-Book": "E-Book",
  "produk": "products",
  "sedang berjalan": "in progress",
  "sertifikat": "certificates",
  "Tampilan grid": "Grid view",
  "Tampilan daftar": "List view",
  "Dashboard": "Dashboard",

  /* Grup Kelas */
  "Ngobrol dengan pengajarmu di grup WhatsApp kelas — tanpa keluar dari dashboard.":
    "Chat with your teacher in the class WhatsApp group — without leaving the dashboard.",
  "Cari grup kelas…": "Search class groups…",
  "Pilih grup kelas di sebelah kiri untuk membuka percakapan.":
    "Pick a class group on the left to open the conversation.",
  "Tulis pesan ke grup kelas…": "Write a message to the class group…",
  "Kirim": "Send",
  "Muat ulang": "Reload",

  /* Pengaturan */
  "Bahasa Antarmuka": "Interface Language",
  "Kelola akun & preferensimu": "Manage your account & preferences",
  "Preferensi Belajar": "Learning Preferences",
  "Pengingat Belajar": "Study Reminders",
  "Pemutaran Rekaman": "Recording Playback",
  "Nama, foto, bio": "Name, photo, bio",
  "Akun & Keamanan": "Account & Security",
  "Email, kata sandi": "Email, password",
  "Notifikasi": "Notifications",
  "Email, WhatsApp, push": "Email, WhatsApp, push",
  "Bahasa, pengingat": "Language, reminders",
  "Tagihan & Paket": "Billing & Packages",
  "Langganan, cicilan": "Subscriptions, installments",
  "Simpan Perubahan": "Save Changes",

  /* ── Tanggal & waktu (kalender Jadwal, kartu sesi, rapor) ───────────────── */
  "Januari": "January", "Februari": "February", "Maret": "March", "April": "April",
  "Mei": "May", "Juni": "June", "Juli": "July", "Agustus": "August",
  "September": "September", "Oktober": "October", "November": "November", "Desember": "December",
  "Jan": "Jan", "Feb": "Feb", "Mar": "Mar", "Apr": "Apr", "Jun": "Jun", "Jul": "Jul",
  "Agu": "Aug", "Sep": "Sep", "Okt": "Oct", "Nov": "Nov", "Des": "Dec",
  "Senin": "Monday", "Selasa": "Tuesday", "Rabu": "Wednesday", "Kamis": "Thursday",
  "Jumat": "Friday", "Sabtu": "Saturday", "Minggu": "Sunday",
  "Sen": "MON", "Sel": "TUE", "Rab": "WED", "Kam": "THU", "Jum": "FRI", "Sab": "SAT", "Min": "SUN",
  "Hari": "Day", "Bulan": "Month",
  "Hari ini": "Today", "Hari Ini": "Today", "Berikutnya": "Next", "Sebelumnya": "Previous",
  "besok": "tomorrow", "menit": "minutes", "mnt": "min", "jam": "hours",
  "menit lagi": "min left", "jam lagi": "hr left", "hari lagi": "days left",
  "sedang berlangsung": "in progress", "Sedang berlangsung": "In progress", "Live": "Live",
  "selesai": "ends", "Setiap": "Every",

  /* ── Sapaan beranda ─────────────────────────────────────────────────────── */
  "Selamat pagi": "Good morning",
  "Selamat siang": "Good afternoon",
  "Selamat sore": "Good evening",
  "Selamat malam": "Good evening",
  "yuk belajar bahasa hari ini!": "let's learn a language today!",
  "Ga ada yang cocok sama": "Nothing matches",

  /* ── Kartu kelas & seksi beranda ────────────────────────────────────────── */
  "Kelas Live": "Live Classes",
  "Belajar Mandiri": "Self-Study",
  "Aktif": "Active",
  "Riwayat": "History",
  "Tambah": "Add",
  "Tambah Kelas": "Add a Class",
  "Daftar Kelas": "Enroll in a Class",
  "Selesai": "Completed",
  "Sesi": "Session",
  "sesi": "sessions",
  "kelas": "classes",
  "Lanjut": "Continue",
  "Ulangi": "Repeat",
  "Private": "Private",
  "Semi Private": "Semi Private",
  "Reguler": "Regular",
  "Kids": "Kids",
  "Semi Private Kids": "Semi Private Kids",
  "Test Prep": "Test Prep",
  "Kelas Private": "Private Class",
  "Kelas Semi Private": "Semi Private Class",
  "Kelas Reguler": "Regular Class",
  "Kelas Kids": "Kids Class",
  "Kelas Semi Private Kids": "Semi Private Kids Class",
  "English Test Preparation (IELTS/TOEFL)": "English Test Preparation (IELTS/TOEFL)",
  "Satu pengajar khusus buat kamu, jadwal fleksibel.": "One dedicated teacher just for you, flexible schedule.",
  "Grup kecil, jadwal disepakati bareng anggota grup.": "Small group, schedule agreed with the other members.",
  "Kelas berkelompok per batch dengan jadwal tetap.": "Group class per batch with a fixed schedule.",
  "Kelas anak dengan materi & pendekatan khusus.": "Kids class with dedicated materials & approach.",
  "Grup kecil khusus anak.": "Small group just for kids.",
  "Persiapan tes IELTS/TOEFL bareng pengajar spesialis.": "IELTS/TOEFL test prep with specialist teachers.",
  "Belum ada riwayat kelas": "No class history yet",
  "Kelas yang sudah selesai akan muncul di sini.": "Classes you've finished will show up here.",
  "Belum ada kelas live aktif": "No active live class yet",
  "Mulai belajar bahasa baru sekarang!": "Start learning a new language now!",
  "Belum ada paket belajar mandiri": "No self-study package yet",
  "Belajar sendiri kapan saja lewat paket E-Learning.": "Learn on your own anytime with an E-Learning package.",
  "Semua Silabus (60+ Bahasa)": "All Syllabuses (60+ Languages)",
  "Blog & Tips Belajar": "Blog & Learning Tips",

  /* ── Ringkasan Belajar (beranda) ────────────────────────────────────────── */
  "Ringkasan Belajar": "Learning Summary",
  "PR menunggu": "homework pending",
  "Tutup": "Close",
  "Lihat": "View",
  "Jam belajar minggu ini": "Study hours this week",
  "terjadwal": "scheduled",
  "dari sesi yang sudah jalan": "from sessions already held",
  "Sesi minggu ini": "Sessions this week",
  "sesi lagi": "sessions to go",
  "semua sudah jalan": "all done",
  "PR belum disetor": "Homework not submitted",
  "ketuk kartu PR di bawah": "tap the homework card below",
  "aman, tidak ada tunggakan": "all clear, nothing pending",
  "Rata-rata skill": "Average skill",
  "belum dinilai pengajar": "not graded by the teacher yet",
  "Progres": "Progress",
  "Dinilai pengajar": "Graded by the teacher",
  "Bagikan progres": "Share progress",
  "Tersalin": "Copied",
  "Gagal": "Failed",
  "Bagikan": "Share",
  "Cetak kartu progres": "Print progress card",
  "Rata-rata": "Average",
  "Detail": "Details",
  "tugas menunggu dikerjakan": "assignments waiting to be done",
  "Kelas": "Class",
  "PR lain di tab Tugas": "more homework in the Assignments tab",
  "Materi Terbaru": "Latest Materials",
  "dari pengajar": "from your teacher",
  "Peringkat Kelas": "Class Leaderboard",
  "Kamu peringkat": "You're ranked",
  "dari": "of",
  "Kamu": "You",

  /* ── Sesi Mendatang (beranda) ───────────────────────────────────────────── */
  "Sesi Mendatang": "Upcoming Sessions",
  "sesi hari ini": "sessions today",
  "sesi terjadwal": "sessions scheduled",
  "semua kelas aktif": "all classes active",
  "Buka Jadwal": "Open Schedule",
  "Ringkas": "Collapse",
  "Lihat semua": "See all",
  "Masuk Kelas": "Join Class",

  /* ── Halaman Jadwal ─────────────────────────────────────────────────────── */
  "Jadwal Kelas": "Class Schedule",
  "sesi mendatang": "upcoming sessions",
  "sudah lewat": "already held",
  "Total minggu ini": "Total this week",
  "Keluar layar penuh": "Exit full screen",
  "Layar penuh": "Full screen",
  "Keluar layar penuh (Esc)": "Exit full screen (Esc)",
  "Layar penuh (F)": "Full screen (F)",
  "Tidak ada sesi di hari ini": "No sessions today",
  "Tidak ada sesi minggu ini": "No sessions this week",
  "Pakai panah di atas buat lihat hari lain.": "Use the arrows above to see another day.",
  "Pakai panah di atas buat lihat minggu lain.": "Use the arrows above to see another week.",
  "Jadwal Tetap (Kelas Grup)": "Fixed Schedule (Group Class)",
  "Jadwal tetap": "Fixed schedule",
  "Bahasa": "Language",
  "Presensi": "Attendance",
  "Hadir": "Present",
  "Izin": "Excused",
  "Sakit": "Sick",
  "Alpa": "Absent",
  "Dibatalkan": "Cancelled",
  "Hangus": "Forfeited",
  "Sudah lewat": "Past",
  "Libur nasional / cuti bersama": "National holiday / collective leave",
  "Pertemuan": "Meeting",
  "Materi sesi": "Session material",
  "Rekaman": "Recording",

  /* ── Detail kelas ───────────────────────────────────────────────────────── */
  "Kembali ke Beranda": "Back to Home",
  "Sesi pratinjau sudah kedaluwarsa": "The preview session has expired",
  "Sesi kamu sudah berakhir": "Your session has ended",
  "Jadwal, materi, dan daftar level di bahasa ini tidak bisa dimuat sampai kamu masuk lagi. Yang tampil di halaman ini data terakhir yang sempat tersimpan.":
    "Schedules, materials, and the level list for this language can't be loaded until you sign in again. What you see here is the last saved data.",
  "Muat Ulang": "Reload",
  "Masuk Lagi": "Sign In Again",
  "menit/sesi": "minutes/session",
  "Paket": "Package",
  "Pengajar": "Teacher",
  "Pengajar belum di-assign. Hubungi admin untuk dipasangkan.": "No teacher assigned yet. Contact the admin to get matched.",
  "Progress Sesi": "Session Progress",
  "Sisa": "Left",
  "lagi di level ini": "left at this level",
  "Semua sesi di level ini sudah selesai": "All sessions at this level are done",
  "Sesi Berikutnya": "Next Session",
  "menunggu konfirmasi pengajar": "waiting for the teacher's confirmation",
  "Mau ubah atau batalkan jadwal? Kabari pengajar di grup kelas ya.": "Need to move or cancel a session? Let your teacher know in the class group.",
  "Chat Admin": "Chat Admin",
  "Belum ada sesi terjadwal": "No session scheduled yet",
  "Hubungi admin untuk menjadwalkan sesi berikutnya.": "Contact the admin to schedule your next session.",
  "Memuat…": "Loading…",
  "Progress": "Progress",
  "Kuis": "Quiz",
  "Rapor": "Report",

  /* ── Tab Progress ───────────────────────────────────────────────────────── */
  "sesi berjalan": "sessions held",
  "Kehadiran": "Attendance rate",
  "belum berjalan": "not held yet",
  "Belum jalan": "Not held yet",
  "Kemampuan 4 Skill · CEFR": "4 Skills · CEFR",
  "Cetak": "Print",
  "Pengajar belum mengisi penilaian skill": "Your teacher hasn't filled in the skill assessment",
  "Penilaian muncul di sini setelah pengajar mengisi Catatan Progress": "The assessment shows up here once the teacher fills in the Progress Notes",
  "dari 5.0": "out of 5.0",
  "sebelumnya": "previously",
  "Pemula": "Beginner",
  "Dasar": "Elementary",
  "Menengah": "Intermediate",
  "Menengah Atas": "Upper Intermediate",
  "Mahir": "Advanced",
  "Perjalanan Belajar": "Learning Journey",
  "Belum ada sesi yang selesai": "No completed session yet",
  "Setiap sesi selesai, laporan pengajar (topik, PR, recording) tampil di sini": "After each session, the teacher's report (topic, homework, recording) shows up here",
  "Nilai kuis": "Quiz score",
  "Topik": "Topic",
  "PR": "Homework",
  "Tonton Recording": "Watch Recording",

  /* ── Tab Materi ─────────────────────────────────────────────────────────── */
  "Materi belajar": "Learning material",
  "Materi Belajar": "Learning Material",
  "Slide Materi": "Material Slides",
  "Dokumen": "Document",
  "Slide": "Slides",
  "Lampiran": "Attachment",
  "Recording Sesi": "Session Recording",
  "slide": "slides",
  "materi": "materials",
  "Yang dipelajari": "What you'll learn",
  "Catatan Materi": "Material Notes",
  "Catatan": "Notes from",
  "Pengumpulan & penilaiannya ada di tab Tugas.": "Submission & grading live in the Assignments tab.",
  "Materi Sesi": "Session Materials",
  "Belum ada materi untuk sesi ini": "No materials for this session yet",
  "Rekaman, berkas, & catatan sesi ini akan muncul di sini setelah sesinya dijalankan pengajar.":
    "The recording, files, and notes for this session will appear here once your teacher has held it.",
  "Pengajar belum melampirkan berkas atau tautan di sesi ini.": "Your teacher hasn't attached any file or link to this session.",
  "Materi & catatan akan muncul di sini setelah pengajar mengisinya.": "Materials & notes will appear here once your teacher fills them in.",
  "Sesi ini sudah berjalan": "This session has been held",
  "Belum dijadwalkan": "Not scheduled yet",
  "belum dijadwalkan": "not scheduled yet",
  "Terjadwal": "Scheduled",
  "Menunggu laporan pengajar": "Waiting for the teacher's report",
  "Menunggu konfirmasi pengajar": "Waiting for the teacher's confirmation",
  "Buka materi sesi": "Open materials for session",
  "Materi Umum": "General Materials",
  "Perjalanan Kelas": "Class Journey",
  "Belum ada sesi di kelas ini": "No sessions in this class yet",
  "Hubungi admin untuk menjadwalkan sesi pertamamu": "Contact the admin to schedule your first session",
  "Tampilkan": "Show",
  "Sesi Dibatalkan": "Cancelled Sessions",
  "Alasan": "Reason",

  /* ── Tab Kuis & Tugas ───────────────────────────────────────────────────── */
  "Rincian per Kuis": "Quiz Breakdown",
  "poin": "points",
  "benar": "correct",
  "salah": "wrong",
  "Klik kuis untuk melihat pembahasan tiap soal beserta catatan perbaikannya.": "Tap a quiz to see the explanation for each question and its correction notes.",
  "Belum ada tugas": "No assignments yet",
  "PR yang diberikan pengajar setelah sesi akan muncul di sini, lengkap dengan tempat menyetornya.":
    "Homework your teacher gives after a session shows up here, along with where to submit it.",
  "Sudah disetor": "Submitted",
  "Belum disetor": "Not submitted",
  "Sudah dinilai": "Graded",
  "Setoran kamu": "Your submission",
  "Buka lampiran": "Open attachment",
  "Penilaian pengajar": "Teacher's assessment",
  "Tulis jawabanmu di sini…": "Write your answer here…",
  "…atau tempel link (Google Docs, Drive, dll)": "…or paste a link (Google Docs, Drive, etc.)",
  "Lampirkan file (foto / PDF)": "Attach a file (photo / PDF)",
  "Perbarui setoran": "Update submission",
  "Setor tugas": "Submit assignment",
  "Batal": "Cancel",

  /* ── Tab Rapor ──────────────────────────────────────────────────────────── */
  "Belum ada rapor yang diterbitkan": "No report card published yet",
  "Pengajar menerbitkan Rapor Tengah (± sesi 8) dan Rapor Akhir di akhir program":
    "Your teacher publishes a Mid-term Report (around session 8) and a Final Report at the end of the program",
  "Sertifikat Penyelesaian": "Certificate of Completion",
  "Selamat! 🎉 Program": "Congratulations! 🎉 Your",
  "sudah selesai — sertifikatmu siap diunduh.": "program is complete — your certificate is ready to download.",
  "Unduh Sertifikat": "Download Certificate",
  "Rapor Tengah": "Mid-term Report",
  "Rapor Akhir": "Final Report",
  "Diterbitkan": "Published",
  "Komentar Pengajar": "Teacher's Comment",
  "Rekomendasi": "Recommendation",

  /* ── Tab Kelas & Materi ─────────────────────────────────────────────────── */
  "Cari bahasa…": "Search languages…",
  "Hapus pencarian": "Clear search",
  "Kelas Kamu": "Your Classes",
  "Berjalan": "Ongoing",
  "Tidak ada kelas di filter ini": "No class matches this filter",
  "Belum terjadwal": "Not scheduled yet",
  "Belum ditentukan": "Not assigned yet",
  "Kelas selesai": "Class completed",
  "Sedang berjalan": "In progress",
  "Sesi Selesai": "Sessions Completed",
  "Sesi & Rekaman": "Sessions & Recordings",
  "Silabus Level": "Level Syllabus",
  "Punya paket e-learning? Buka tab Belajar Mandiri di atas. Atau daftar kelas live di bawah.":
    "Have an e-learning package? Open the Self-Study tab above. Or enroll in a live class below.",
};
