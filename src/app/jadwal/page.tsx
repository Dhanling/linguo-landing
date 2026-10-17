// [jadwal-sesudah-bayar-v1] Kalender jam kosong pengajar tidak lagi publik: jadwal baru
// dicocokkan sesudah bayar, di form pendataan. Tautan lama /jadwal dialihkan ke /daftar.
import { redirect } from "next/navigation";

export default function JadwalIndexPage() {
  redirect("/daftar");
}
