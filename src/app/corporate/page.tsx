// [seo-metadata-halaman-v1] Halaman ini server component tipis (cuma
// meneruskan corporate-page), jadi metadata bisa diekspor langsung di sini —
// tidak perlu layout terpisah seperti halaman "use client" lainnya.
import { pageMetadata } from "@/lib/seo";
import CorporatePage from "./corporate-page";
import BreadcrumbLd from "@/components/BreadcrumbLd"; // [aeo-schema-v1]

export const metadata = pageMetadata({
  path: "/corporate",
  title: "Corporate Language Training untuk Perusahaan — Linguo.id",
  description:
    "Pelatihan bahasa untuk tim perusahaan. Materi disesuaikan kebutuhan industri dan goals perusahaan, jadwal mengikuti jam kerja tim, 60+ pilihan bahasa.",
  keywords: [
    "corporate language training",
    "pelatihan bahasa untuk perusahaan",
    "kursus bahasa karyawan",
    "in-house training bahasa inggris",
  ],
  ogTitle: "Tingkatkan Skill Bahasa Tim Anda Bersama Linguo",
});

export default function Corporate() {
  return (
    <>
      <BreadcrumbLd trail={[{ name: "Corporate Training", path: "/corporate" }]} />
      <CorporatePage />
    </>
  );
}
