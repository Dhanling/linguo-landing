// [cek-jadwal-popup-v1] Halaman pilih bahasa /jadwal dihapus — menu "Cek Jadwal" kini pop-up
// (Private / Reguler / Test Prep). Tautan lama dialihkan ke beranda yang langsung membuka pop-up itu.
import { permanentRedirect } from "next/navigation";

export default function JadwalIndexPage() {
  permanentRedirect("/#cek-jadwal");
}
