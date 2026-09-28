// [quran-reader-v1] Al-Qur'an digital Linguo: mushaf 604 halaman yang bisa digeser,
// ketuk kata untuk arti + analisa sharaf, dan i'rab ayat berbantuan AI.
// Pendamping program /bahasa-arab-quran — gratis & publik (pintu masuk organik).
import { Amiri_Quran } from "next/font/google";
import { pageMetadata } from "@/lib/seo";
import { ambilDaftarSurat, JUMLAH_HALAMAN, type Surat } from "@/lib/quran/sumber";
import MushafReader from "@/components/quran/MushafReader";
import BreadcrumbLd from "@/components/BreadcrumbLd";

const amiri = Amiri_Quran({ weight: "400", subsets: ["arabic"], display: "swap" });

export const metadata = pageMetadata({
  path: "/alquran",
  title: "Al-Qur'an Digital per Kata + Analisa Nahwu Sharaf | Linguo.id",
  description:
    "Baca Al-Qur'an 30 juz (mushaf Madinah 604 halaman) gratis. Ketuk kata untuk arti bahasa Indonesia, " +
    "audio pelafalan, analisa sharaf (isim/fi'il/harf, akar, wazan) dan i'rab ayat.",
  keywords: ["al quran digital", "al quran per kata", "terjemah per kata", "i'rab al quran", "nahwu sharaf al quran"],
});

export default async function AlquranPage({
  searchParams,
}: {
  searchParams: Promise<{ hal?: string }>;
}) {
  const n = Number((await searchParams).hal);
  const halamanAwal = Number.isInteger(n) && n >= 1 && n <= JUMLAH_HALAMAN ? n : null;
  let daftar: Surat[] = [];
  try {
    daftar = await ambilDaftarSurat();
  } catch {
    // Daftar surat gagal → pembaca tetap jalan, hanya nama surat jadi "Surat N".
  }
  return (
    <>
      <BreadcrumbLd trail={[{ name: "Al-Qur'an Digital", path: "/alquran" }]} />
      <h1 className="sr-only">Al-Qur&apos;an Digital per Kata dengan Analisa Nahwu Sharaf</h1>
      <MushafReader daftarSurat={daftar} halamanAwal={halamanAwal} fontArab={amiri.className} />
    </>
  );
}
