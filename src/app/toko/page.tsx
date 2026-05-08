import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

// Public read — pakai anon key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const metadata = {
  title: "Toko Digital — Linguo.id",
  description: "E-Books, course recording, dan materi belajar bahasa lengkap.",
};

export const dynamic = "force-dynamic"; // always fetch fresh

async function getProducts() {
  const { data, error } = await supabase
    .from("digital_products")
    .select(`
      id, type, title, slug, description, cover_url,
      language, level, category, total_sold, is_featured,
      digital_product_pricing (
        id, price, duration_days, display_label, sort_order
      )
    `)
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("total_sold", { ascending: false });

  if (error) {
    console.error("Failed to fetch products:", error);
    return [];
  }
  return data ?? [];
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

export default async function TokoPage() {
  const products = await getProducts();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            🛍️ Toko Digital Linguo
          </h1>
          <p className="text-lg text-gray-600">
            E-Books & Recording Class — belajar bahasa di waktu luang kamu
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-xl mb-2">Belum ada produk tersedia</p>
            <p className="text-sm">Cek balik beberapa hari lagi 😊</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p: any) => {
              const minPrice = Math.min(...(p.digital_product_pricing ?? []).map((x: any) => x.price));
              return (
                <Link
                  key={p.id}
                  href={`/toko/${p.slug}`}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100"
                >
                  <div className="aspect-[4/3] bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white text-5xl">
                    {p.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.cover_url} alt={p.title} className="w-full h-full object-cover" />
                    ) : p.type === "ebook" ? "📚" : "🎬"}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-teal-50 text-teal-700">
                        {p.type === "ebook" ? "E-Book" : "E-Learning"}
                      </span>
                      {p.level && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                          {p.level}
                        </span>
                      )}
                      {p.is_featured && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-700">
                          ⭐ Featured
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">{p.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{p.description}</p>
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-xs text-gray-500">Mulai dari</span>
                        <div className="text-lg font-bold text-teal-600">
                          Rp {formatRupiah(minPrice)}
                        </div>
                      </div>
                      {p.total_sold > 0 && (
                        <span className="text-xs text-gray-500">{p.total_sold} terjual</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
