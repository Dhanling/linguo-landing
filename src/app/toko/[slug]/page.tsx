import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { BookOpen, Clapperboard } from "lucide-react";
import { FLAG_CODE_BY_SLUG, RectFlag } from "@/components/RectFlag";
import CheckoutSection from "./CheckoutSection";
import PratinjauButton from "./PratinjauButton";
import Deskripsi from "./Deskripsi";
import { masihDijual } from "@/lib/elearningBundle";
import { LABEL_NEW_EDITION, adalahNewEdition } from "@/lib/ebookEdisi";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const dynamic = "force-dynamic";

/* [ebook-pratinjau-publik-v1] Tombol pratinjau baru boleh muncul kalau berkas
   potongannya MEMANG ada di bucket (dirakit scripts/build-ebook-pratinjau.mjs).
   Tanpa penjagaan ini, delapan produk "English Edition" yang file_url-nya
   menunjuk berkas yang belum pernah diunggah tetap menawarkan "Baca Gratis
   Unit 1" — dan yang mengkliknya disambut pesan galat. Janji yang tak bisa
   ditepati lebih buruk daripada tombol yang tak ada.

   Ragu = tampilkan: kalau HEAD-nya gagal karena JARINGAN, routenya toh bisa
   merakit potongannya sendiri saat diklik. Yang dihitung sebagai "tidak ada"
   adalah jawaban 4xx dari storage — objek yang hilang dijawab 400 di sini,
   bukan 404 (jadi jangan menyaring 404 saja: itu yang bikin delapan produk
   rusak lolos di percobaan pertama). */
async function punyaPratinjau(fileUrl: string | null): Promise<boolean> {
  if (!fileUrl || /^https?:\/\//i.test(fileUrl)) return false; // link Drive dsb
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return false;
  const jalur = (fileUrl.replace(/\.pdf$/i, "") + ".pratinjau.pdf")
    .split("/").map(encodeURIComponent).join("/");
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/ebook-files/${jalur}`,
      { method: "HEAD", headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" },
    );
    if (res.ok) return true;
    return !(res.status >= 400 && res.status < 500);
  } catch {
    return true;
  }
}

async function getProduct(slug: string) {
  const { data, error } = await supabase
    .from("digital_products")
    .select(`
      id, type, title, slug, description, cover_url, preview_url, file_url,
      language, level, category, file_size_mb, pages, format,
      total_duration_min, modules_count, video_provider, is_active,
      digital_product_pricing (
        id, price, duration_days, display_label, sort_order, is_active
      ),
      digital_product_langs (
        id, language, video_playlist_url, sort_order
      )
    `)
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;
  return data;
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  /* [elearning-per-bahasa-v1] Paket 12+ bahasa berhenti dijual. Barisnya
     TETAP is_active (pembeli lama membacanya lewat join dari
     `digital_purchases` — lihat lib/elearningBundle.ts), jadi etalase publiknya
     ditutup di sini: tanpa penjagaan ini halamannya masih terbuka lewat tautan
     lama dan masih bisa dibayar. */
  if (!masihDijual(slug)) notFound();
  const product = await getProduct(slug);
  if (!product) notFound();

  const pricingTiers = ((product as any).digital_product_pricing ?? [])
    .filter((p: any) => p.is_active)
    .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  // [produk-digital-per-bahasa-v1] Produk paket isinya banyak bahasa (satu
  // playlist per bahasa). Ditampilkan sebagai daftar bendera biar pembeli tahu
  // persis apa yang dia dapat.
  const productLangs = (((product as any).digital_product_langs ?? []) as any[])
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  // linguo-patch:toko-rectflag-lucide-v1 — cover tanpa gambar: bendera SVG
  // rounded-rectangle kalau bahasanya kita kenal, selain itu ikon Lucide.
  const isEbook = product.type === "ebook";
  // [ebook-pratinjau-publik-v1] tombol "Baca Gratis Unit 1"
  const fileUrl = (product as { file_url?: string | null }).file_url ?? null;
  const bisaDicicipi =
    isEbook && pricingTiers.length > 0 && (await punyaPratinjau(fileUrl));
  const TypeIcon = isEbook ? BookOpen : Clapperboard;
  // [ebook-new-edition-label-v1] Label edisi, dari pola judul (tak ada kolomnya).
  const newEdition = adalahNewEdition(product.title, product.type);
  const flagCode = product.language
    ? FLAG_CODE_BY_SLUG[String(product.language).trim().toLowerCase()]
    : undefined;

  /* [toko-produk-compact-v1] `min-h-screen` selalu memaksa satu layar PENUH di
     bawah bar promo yang tingginya sudah didorong ke <body> lewat padding-top —
     hasilnya halaman ini punya bilah gulir setinggi bar itu yang tak berisi
     apa-apa, padahal seluruh isinya sudah muat. Tinggi minimumnya dikurangi
     setinggi bar (variabelnya 0px kalau barnya tutup). */
  return (
    <div className="min-h-[calc(100vh-var(--promo-bar-h,0px))] bg-gray-50">
      {/* [toko-produk-compact-v1] Sasaran tata letak ini: di layar laptop
          (±800 px tinggi) sampul, harga, "Beli Sekarang", dan "Baca Gratis
          Unit 1" harus terlihat SEKALIGUS tanpa menggulir. Yang dulu memakan
          ruangnya bukan isi, melainkan napas: py-12 di halaman, p-8 di kolom,
          judul 3xl, deskripsi sembilan baris, dan dua kotak meta setinggi 70 px
          untuk dua angka. */}
      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Cover */}
            {/* [ebook-sampul-tanpa-latar-v1] Latar gradien teal dicabut 31 Agu
                2026. Sampul modul memang sudah punya latar penuh warnanya
                sendiri (bendera, judul, ilustrasi); menaruhnya di atas kotak
                teal berarti dua bidang warna bertarung, dan sampulnya menyusut
                jadi kartu kecil di tengah kolom. Sekarang kertas putih halaman
                yang jadi latarnya — yang dilihat calon pembeli tinggal
                sampulnya. */}
            <div className="flex items-center justify-center bg-white p-5 text-gray-300 sm:p-6">
              {product.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                /* [ebook-sampul-utuh-v1] `object-cover` dulu memenuhi kolom ini
                   dengan cara MEMOTONG: sampul modul potret (1:√2) dipaksa masuk
                   kotak yang jauh lebih jangkung, jadi sisi kiri-kanannya —
                   tempat bendera & label "LEVEL A1" berada — hilang dari layar.
                   Sekarang sampulnya dimuat utuh di tengah, latar gradiennya
                   yang mengisi sisa ruang. Sampul memang barang jualan: separuh
                   sampul menjual separuhnya saja. */
                <img
                  src={product.cover_url}
                  alt={product.title}
                  /* Tinggi sampul diikat ke TINGGI LAYAR, bukan angka tetap:
                     560 px di layar 800 px sudah menghabiskan jatah sebelum
                     tombol belinya sempat kebagian. */
                  className="max-h-[52vh] w-auto max-w-full rounded-xl object-contain shadow-2xl sm:max-h-[62vh]"
                />
              ) : flagCode ? (
                <RectFlag code={flagCode} h={112} className="shadow-xl" />
              ) : (
                <TypeIcon className="h-24 w-24" strokeWidth={1.5} aria-hidden />
              )}
            </div>

            {/* Info */}
            <div className="p-6 sm:p-7">
              <div className="mb-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded bg-teal-50 text-teal-700">
                  <TypeIcon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  {isEbook ? "E-Book" : "E-Learning"}
                </span>
                {product.level && (
                  <span className="text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-600">
                    Level {product.level}
                  </span>
                )}
                {/* [ebook-new-edition-label-v1] Chip, bukan sisipan ke judul:
                    judul produk dipakai ulang di invoice Xendit, Perpustakaan,
                    dan reader — kalau kata ini ikut ke dalamnya, ketiganya ikut
                    berubah dan judul lama di riwayat pembelian jadi tak cocok. */}
                {newEdition && (
                  <span className="inline-flex items-center gap-1 rounded bg-yellow-400/95 px-2 py-1 text-xs font-bold uppercase tracking-wide text-slate-900">
                    {LABEL_NEW_EDITION}
                  </span>
                )}
              </div>

              <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-[28px]">{product.title}</h1>
              {product.description && <Deskripsi teks={product.description} />}

              {productLangs.length > 0 && (
                <div className="mb-4">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {productLangs.length} bahasa termasuk
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {productLangs.map((l: any) => {
                      const code = FLAG_CODE_BY_SLUG[String(l.language).trim().toLowerCase()];
                      return (
                        <span
                          key={l.id}
                          className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700"
                        >
                          {code ? <RectFlag code={code} h={14} /> : null}
                          {l.language}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Meta info — [toko-produk-compact-v1] dulu dua kartu abu-abu
                  setinggi 70 px untuk memuat dua angka pendek. Sekarang satu
                  baris chip: keterangan yang sama, seperempat tingginya. */}
              <div className="mb-4 flex flex-wrap items-center gap-2 text-[13px]">
                {product.type === "ebook" && product.pages && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-gray-600">
                    <span className="text-gray-400">Halaman</span>
                    <b className="font-semibold text-gray-900">{product.pages} hal</b>
                  </span>
                )}
                {product.type === "ebook" && product.file_size_mb && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-gray-600">
                    <span className="text-gray-400">Ukuran</span>
                    <b className="font-semibold text-gray-900">{product.file_size_mb} MB</b>
                  </span>
                )}
                {product.type === "elearning" && product.modules_count && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-gray-600">
                    <span className="text-gray-400">Total sesi</span>
                    <b className="font-semibold text-gray-900">{product.modules_count} sesi</b>
                  </span>
                )}
                {product.type === "elearning" && product.total_duration_min && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-gray-600">
                    <span className="text-gray-400">Total durasi</span>
                    <b className="font-semibold text-gray-900">{Math.round(product.total_duration_min / 60)} jam</b>
                  </span>
                )}
              </div>

              <CheckoutSection
                product={{
                  id: product.id,
                  title: product.title,
                  type: product.type as "ebook" | "elearning",
                }}
                pricingTiers={pricingTiers}
              />

              {/* [ebook-pratinjau-unit1-v1] Cicipan cuma untuk modul yang dibaca
                  di reader kita: produk yang berkasnya masih link luar (Drive)
                  tak punya batas halaman yang bisa dijaga siapa pun. */}
              {bisaDicicipi && (
                <PratinjauButton slug={slug} title={product.title} language={product.language} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
