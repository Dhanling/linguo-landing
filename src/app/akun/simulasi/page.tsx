import { redirect } from "next/navigation";

// [simulasi-inshell-v1] Katalog simulasi sekarang jadi tab in-shell di /akun (sidebar tetap tampil).
// Route lama ini dialihkan biar link/back lama tetap nyampe ke tempat yang benar.
export default function SimulasiKatalogRedirect() {
  redirect("/akun?menu=simulasi");
}
