// [seo-blog-bisa-dirayapi-v1] Arsip lengkap: SETIAP artikel yang sudah terbit
// muncul di sini sebagai <a href> yang dirender server, dikelompokkan per bulan.
// Ini jaring pengaman terakhir — kalau nanti ada post tanpa `category`, post itu
// tetap punya jalur tautan internal lewat halaman ini.

import { pageMetadata } from "@/lib/seo";
import { getArsipPosts, kelompokkanPerBulan } from "../arsipData";
import { ArsipItem, ArsipShell } from "../ArsipShell";

// Sama alasannya dengan /blog: time-gate post terjadwal harus dievaluasi dengan
// `now` yang segar, jadi jangan di-cache jadi statis.
export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  path: "/blog/arsip",
  title: "Arsip Artikel Belajar Bahasa — Blog Linguo.id",
  description:
    "Daftar lengkap semua artikel blog Linguo.id: grammar, kosakata, tips belajar, dan panduan bahasa asing, tersusun per bulan terbit.",
});

export default async function ArsipPage() {
  const posts = await getArsipPosts();
  const perBulan = kelompokkanPerBulan(posts);

  return (
    <ArsipShell
      judul="Arsip Artikel"
      intro="Semua artikel yang pernah terbit di blog Linguo.id, tersusun dari yang terbaru. Cari topik yang kamu butuhkan, atau saring lewat kategori di atas."
      jumlah={posts.length}
    >
      {posts.length === 0 ? (
        <p className="py-16 text-center text-slate-400">Belum ada artikel.</p>
      ) : (
        <div className="mt-8">
          {perBulan.map((bulan) => (
            <section key={bulan.key} className="mb-8">
              <h2 className="mb-1 text-[13px] font-bold uppercase tracking-wider text-[#1A9E9E]">
                {bulan.judul}
              </h2>
              <ul>
                {bulan.posts.map((p) => (
                  <ArsipItem key={p.slug} post={p} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </ArsipShell>
  );
}
