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
};
