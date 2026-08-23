/* [jejak-belajar-per-siswa-v1] Pemilik jejak belajar yang tersimpan di PERANGKAT.

   Kenapa ada: blok "Lanjutkan Belajar" dirakit dari localStorage (halaman terakhir
   e-book, riwayat tonton Watch & Learn). localStorage itu milik BROWSER, bukan milik
   akun — jadi kalau satu perangkat dipakai bergantian (siswa pinjam laptop, atau
   admin membuka "lihat sebagai siswa"), dashboard siswa berikutnya ikut menampilkan
   modul & video yang dibuka orang SEBELUMNYA. Yang tampil di sana harusnya cuma
   milik siswa yang sedang login.

   Caranya: tiap kunci jejak diberi ekor identitas pemiliknya. Siswa lain di
   perangkat yang sama membaca ekor yang berbeda → jejaknya tak saling terlihat,
   tapi jejak masing-masing tetap utuh kalau dia login lagi di perangkat itu.

   Identitasnya dibaca SINKRON dari cookie sesi (lihat peekSessionCookie) supaya
   bisa dipakai di dalam fungsi baca/tulis biasa yang tak bisa menunggu janji. */

import { peekSessionCookie } from "./supabase-client";

/** Identitas pemilik jejak di perangkat ini: id akun, id siswa yang dipratinjau, atau tamu. */
export function pemilikJejak(): string {
  if (typeof window === "undefined") return "ssr";
  /* [preview-pov-v1] Mode "lihat sebagai siswa" tak punya sesi login sama sekali.
     Tanpa cabang ini pratinjau jatuh ke "tamu" dan berbagi jejak dengan siapa pun
     yang belum login di perangkat ini — persis kebocoran yang mau ditutup. */
  try {
    const pv = new URLSearchParams(window.location.search).get("preview");
    if (pv && /^[0-9a-f-]{36}$/i.test(pv)) return `pv:${pv}`;
  } catch {
    /* URL aneh — abaikan, jatuh ke identitas sesi */
  }
  const id = peekSessionCookie()?.user?.id;
  return id ? `u:${id}` : "tamu";
}

/** Ekor yang ditempel ke tiap kunci localStorage milik jejak belajar. */
export function sufiksJejak(): string {
  return `@${pemilikJejak()}`;
}

/** Kunci localStorage yang sudah terikat ke pemiliknya. */
export function kunciJejak(nama: string): string {
  return `${nama}${sufiksJejak()}`;
}
