// [jadwal-sesudah-bayar-v1] /jadwal/<bahasa> dulu kalender jam kosong Kelas Private untuk
// calon siswa. Kini jadwal baru dicocokkan sesudah bayar (form pendataan), jadi tautan
// lama — iklan, WA, sitemap — dialihkan ke langkah daftar Private bahasa yang sama.
import { redirect } from "next/navigation";
import { langFromSlug } from "@/lib/funnelRouting";

type PageProps = { params: Promise<{ bahasa: string }> };

export default async function JadwalBahasaPage({ params }: PageProps) {
  const { bahasa } = await params;
  redirect(langFromSlug(bahasa) ? `/daftar/${bahasa}/private` : "/daftar");
}
