// [seo-blog-bisa-dirayapi-v1] Halaman kategori. Selain jadi jalur rayap ke
// setiap artikel, halaman ini punya nilai peringkat sendiri: judul & deskripsinya
// menyasar kueri payung ("artikel grammar", "tips belajar bahasa") yang tidak
// dimiliki satu pun artikel tunggal.

import { notFound } from "next/navigation";
import { pageMetadata } from "@/lib/seo";
import { BLOG_KATEGORI, getArsipPosts, getKategori } from "../../arsipData";
import { ArsipItem, ArsipShell } from "../../ArsipShell";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return BLOG_KATEGORI.map((k) => ({ kategori: k.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ kategori: string }>;
}) {
  const { kategori } = await params;
  const k = getKategori(kategori);
  if (!k) return pageMetadata({ path: "/blog", title: "Blog Linguo.id", description: "Artikel belajar bahasa.", noindex: true });
  return pageMetadata({
    path: `/blog/kategori/${k.slug}`,
    title: k.title,
    description: k.description,
  });
}

export default async function KategoriPage({
  params,
}: {
  params: Promise<{ kategori: string }>;
}) {
  const { kategori } = await params;
  const k = getKategori(kategori);
  if (!k) notFound();

  const posts = await getArsipPosts(k.dbValue);

  return (
    <ArsipShell
      judul={`Artikel ${k.label}`}
      intro={k.intro}
      jumlah={posts.length}
      kategoriAktif={k.slug}
    >
      {posts.length === 0 ? (
        <p className="py-16 text-center text-slate-400">Belum ada artikel di kategori ini.</p>
      ) : (
        <ul className="mt-8">
          {posts.map((p) => (
            <ArsipItem key={p.slug} post={p} />
          ))}
        </ul>
      )}
    </ArsipShell>
  );
}
