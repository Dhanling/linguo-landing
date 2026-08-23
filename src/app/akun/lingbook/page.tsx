// [lingbook-rak-buku-tunggal-v1] Rak "Lingbook interaktif" (buku contoh CMS:
// Hajime no Ippo, Paso a Paso) DICABUT dari dashboard siswa — nama "Lingbook"
// sekarang menunjuk e-book berkas yang benar-benar dibeli, dan dua rak yang
// sama-sama mengaku Lingbook cuma bikin siswa mengira modulnya hilang.
//
// Route-nya dibiarkan hidup sebagai pengalih supaya tautan/bookmark lama tidak
// mendarat di 404 — dan supaya komponen + CMS-nya masih utuh bila nanti dipakai
// lagi (lihat components/lingbook/*, data/lingbook/*).
import { redirect } from "next/navigation";

export default function LingbookLibraryPage() {
  redirect("/akun?menu=pustaka");
}
