// [lingbook-rak-buku-tunggal-v1] Reader buku contoh CMS dicabut dari dashboard —
// lihat catatan di ../../page.tsx. Tautan lama dialihkan ke Perpustakaan.
import { redirect } from "next/navigation";

export default function LingbookReaderPage() {
  redirect("/akun?menu=pustaka");
}
