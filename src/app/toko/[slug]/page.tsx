import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { BookOpen, Clapperboard } from "lucide-react";
import { FLAG_CODE_BY_SLUG, RectFlag } from "@/components/RectFlag";
import CheckoutSection from "./CheckoutSection";
import { masihDijual } from "@/lib/elearningBundle";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const dynamic = "force-dynamic";

async function getProduct(slug: string) {
  const { data, error } = await supabase
    .from("digital_products")
    .select(`
      id, type, title, slug, description, cover_url, preview_url,
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
  const TypeIcon = isEbook ? BookOpen : Clapperboard;
  const flagCode = product.language
    ? FLAG_CODE_BY_SLUG[String(product.language).trim().toLowerCase()]
    : undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Cover */}
            <div className="aspect-square md:aspect-auto bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white">
              {product.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                // [ebook-sampul-produk-v1] sampul modul itu potret — jangkar atas
                // supaya judulnya tidak ikut terpotong di kotak yang lebih persegi
                <img src={product.cover_url} alt={product.title} className="w-full h-full object-cover object-top" />
              ) : flagCode ? (
                <RectFlag code={flagCode} h={112} className="shadow-xl" />
              ) : (
                <TypeIcon className="h-24 w-24" strokeWidth={1.5} aria-hidden />
              )}
            </div>

            {/* Info */}
            <div className="p-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded bg-teal-50 text-teal-700">
                  <TypeIcon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  {isEbook ? "E-Book" : "E-Learning"}
                </span>
                {product.level && (
                  <span className="text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-600">
                    Level {product.level}
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-3">{product.title}</h1>
              <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>

              {productLangs.length > 0 && (
                <div className="mb-6">
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

              {/* Meta info */}
              <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
                {product.type === "ebook" && product.pages && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-gray-500 block text-xs">Halaman</span>
                    <span className="font-semibold">{product.pages} hal</span>
                  </div>
                )}
                {product.type === "ebook" && product.file_size_mb && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-gray-500 block text-xs">Ukuran File</span>
                    <span className="font-semibold">{product.file_size_mb} MB</span>
                  </div>
                )}
                {product.type === "elearning" && product.modules_count && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-gray-500 block text-xs">Total Sesi</span>
                    <span className="font-semibold">{product.modules_count} sesi</span>
                  </div>
                )}
                {product.type === "elearning" && product.total_duration_min && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-gray-500 block text-xs">Total Durasi</span>
                    <span className="font-semibold">{Math.round(product.total_duration_min / 60)} jam</span>
                  </div>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
