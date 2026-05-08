import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import CheckoutSection from "./CheckoutSection";

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
  const product = await getProduct(slug);
  if (!product) notFound();

  const pricingTiers = ((product as any).digital_product_pricing ?? [])
    .filter((p: any) => p.is_active)
    .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Cover */}
            <div className="aspect-square md:aspect-auto bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white text-9xl">
              {product.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.cover_url} alt={product.title} className="w-full h-full object-cover" />
              ) : product.type === "ebook" ? "📚" : "🎬"}
            </div>

            {/* Info */}
            <div className="p-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium px-2 py-1 rounded bg-teal-50 text-teal-700">
                  {product.type === "ebook" ? "📚 E-Book" : "🎬 E-Learning"}
                </span>
                {product.level && (
                  <span className="text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-600">
                    Level {product.level}
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-3">{product.title}</h1>
              <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>

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
