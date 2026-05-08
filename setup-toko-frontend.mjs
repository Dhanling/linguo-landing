#!/usr/bin/env node
/**
 * Setup frontend /toko — catalog, detail, checkout modal, success/failed pages
 * 
 * Cara pakai:
 *   1. Drag ke ~/linguo-landing/
 *   2. cd ~/linguo-landing
 *   3. node setup-toko-frontend.mjs
 *   4. git add src/app/toko src/components/CheckoutModal.tsx
 *   5. git commit -m "feat(toko): digital products catalog + checkout"
 *   6. git push (Vercel auto-deploy)
 */

import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';

const ROOT = process.cwd();

// Helper: write file dengan auto-create parent dir
function writeFile(relPath, content) {
  const fullPath = join(ROOT, relPath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content, 'utf-8');
  console.log(`✅ Wrote: ${relPath}`);
}

// ============================================================
// 1. Catalog page: src/app/toko/page.tsx
// ============================================================
const TOKO_PAGE = `import Link from "next/link";
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
    .select(\`
      id, type, title, slug, description, cover_url,
      language, level, category, total_sold, is_featured,
      digital_product_pricing (
        id, price, duration_days, display_label, sort_order
      )
    \`)
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
                  href={\`/toko/\${p.slug}\`}
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
`;

// ============================================================
// 2. Detail page: src/app/toko/[slug]/page.tsx
// ============================================================
const DETAIL_PAGE = `import { createClient } from "@supabase/supabase-js";
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
    .select(\`
      id, type, title, slug, description, cover_url, preview_url,
      language, level, category, file_size_mb, pages, format,
      total_duration_min, modules_count, video_provider, is_active,
      digital_product_pricing (
        id, price, duration_days, display_label, sort_order, is_active
      )
    \`)
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
`;

// ============================================================
// 3. Checkout section client component: src/app/toko/[slug]/CheckoutSection.tsx
// ============================================================
const CHECKOUT_SECTION = `"use client";

import { useState } from "react";

interface PricingTier {
  id: string;
  price: number;
  duration_days: number | null;
  display_label: string;
}

interface Props {
  product: {
    id: string;
    title: string;
    type: "ebook" | "elearning";
  };
  pricingTiers: PricingTier[];
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

export default function CheckoutSection({ product, pricingTiers }: Props) {
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(
    pricingTiers[0] ?? null
  );
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [error, setError] = useState<string | null>(null);

  if (!selectedTier) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-700 text-sm">
        Produk ini belum tersedia untuk dibeli. Cek balik nanti ya!
      </div>
    );
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name || !form.email) {
      setError("Nama dan email wajib diisi");
      return;
    }

    if (!selectedTier) return;

    setSubmitting(true);

    try {
      const response = await fetch(
        \`\${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/xendit-create-digital-invoice\`,
        {
          method: "POST",
          headers: {
            Authorization: \`Bearer \${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}\`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pricing_id: selectedTier.id,
            buyer_email: form.email,
            buyer_name: form.name,
            buyer_phone: form.phone || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.invoice_url) {
        throw new Error(data.error ?? "Gagal bikin invoice");
      }

      // Redirect ke Xendit checkout
      window.location.href = data.invoice_url;
    } catch (err: any) {
      setError(err.message ?? "Terjadi kesalahan");
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Pricing tier selector */}
      {pricingTiers.length > 1 && (
        <div className="space-y-2 mb-4">
          <label className="text-sm font-medium text-gray-700">Pilih Durasi Akses</label>
          <div className="grid grid-cols-3 gap-2">
            {pricingTiers.map((tier) => (
              <button
                key={tier.id}
                onClick={() => setSelectedTier(tier)}
                className={\`px-3 py-3 rounded-xl border-2 text-center transition-all \${
                  selectedTier?.id === tier.id
                    ? "border-teal-500 bg-teal-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }\`}
              >
                <div className="text-xs text-gray-500 mb-0.5">{tier.display_label}</div>
                <div className="text-sm font-semibold text-gray-900">
                  Rp {formatRupiah(tier.price)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected price */}
      <div className="bg-teal-50 rounded-2xl p-4 mb-4">
        <div className="text-xs text-gray-600 mb-1">Total Bayar</div>
        <div className="text-3xl font-bold text-teal-600">
          Rp {formatRupiah(selectedTier.price)}
        </div>
        <div className="text-xs text-gray-600 mt-1">{selectedTier.display_label}</div>
      </div>

      <button
        onClick={() => setShowCheckoutModal(true)}
        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-4 rounded-2xl transition-colors text-lg"
      >
        💳 Beli Sekarang
      </button>

      {/* Checkout modal */}
      {showCheckoutModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => !submitting && setShowCheckoutModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Detail Pembelian</h2>
              <button
                onClick={() => !submitting && setShowCheckoutModal(false)}
                className="text-gray-500 hover:text-gray-700"
                disabled={submitting}
              >
                ✕
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm">
              <div className="font-semibold text-gray-900">{product.title}</div>
              <div className="text-gray-600">{selectedTier.display_label} — Rp {formatRupiah(selectedTier.price)}</div>
            </div>

            <form onSubmit={handleCheckout} className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 outline-none"
                  placeholder="Nama kamu"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Email Aktif *
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 outline-none"
                  placeholder="email@kamu.com"
                  disabled={submitting}
                />
                <p className="text-xs text-gray-500 mt-1">
                  📧 Link akses dikirim ke email ini
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  No. WhatsApp (opsional)
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 outline-none"
                  placeholder="08xxx"
                  disabled={submitting}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl transition-colors"
              >
                {submitting ? "Membuat Invoice..." : \`Lanjut Bayar Rp \${formatRupiah(selectedTier.price)}\`}
              </button>

              <p className="text-xs text-gray-500 text-center">
                Pembayaran aman via Xendit (QRIS, VA, e-wallet)
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
`;

// ============================================================
// 4. Success page: src/app/toko/success/page.tsx
// ============================================================
const SUCCESS_PAGE = `import Link from "next/link";

export const metadata = { title: "Pembayaran Berhasil — Linguo.id" };

export default async function SuccessPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ purchase_id?: string }> 
}) {
  const { purchase_id } = await searchParams;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-sm max-w-lg w-full p-8 text-center">
        <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4 text-5xl">
          🎉
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Pembayaran Berhasil!
        </h1>
        <p className="text-gray-600 mb-6">
          Makasih udah belanja di Linguo. Email berisi link akses udah dikirim ke inbox kamu — biasanya nyampe dalam 30 detik.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800 text-left">
          <p className="font-semibold mb-1">📧 Belum dapet email?</p>
          <ul className="list-disc list-inside space-y-1 text-amber-700">
            <li>Tunggu sampai 5 menit (kadang delay)</li>
            <li>Cek folder Spam/Promosi</li>
            <li>Buka <strong>linguo.id/akun</strong> tab "Perpustakaan Saya" — akses produk juga ada di sana</li>
          </ul>
        </div>

        {purchase_id && (
          <p className="text-xs text-gray-400 mb-4">
            Purchase ID: <code className="bg-gray-100 px-2 py-1 rounded">{purchase_id}</code>
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/akun"
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-2xl transition-colors"
          >
            Buka Perpustakaan Saya
          </Link>
          <Link
            href="/toko"
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-2xl transition-colors"
          >
            Lanjut Belanja
          </Link>
        </div>
      </div>
    </div>
  );
}
`;

// ============================================================
// 5. Failed page: src/app/toko/failed/page.tsx
// ============================================================
const FAILED_PAGE = `import Link from "next/link";

export const metadata = { title: "Pembayaran Gagal — Linguo.id" };

export default async function FailedPage({
  searchParams
}: {
  searchParams: Promise<{ purchase_id?: string }>
}) {
  const { purchase_id } = await searchParams;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-sm max-w-lg w-full p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-5xl">
          😔
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Pembayaran Belum Berhasil
        </h1>
        <p className="text-gray-600 mb-6">
          Pembayaran kamu belum ke-process. Bisa karena timeout, saldo gak cukup, atau dibatalin. Coba lagi yuk?
        </p>

        {purchase_id && (
          <p className="text-xs text-gray-400 mb-4">
            Reference: <code className="bg-gray-100 px-2 py-1 rounded">{purchase_id}</code>
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/toko"
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-2xl transition-colors"
          >
            Coba Lagi
          </Link>
          <a
            href="https://wa.me/6281234567890?text=Halo%20Linguo,%20saya%20mau%20tanya%20soal%20pembayaran%20yang%20gagal"
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-2xl transition-colors"
          >
            Chat Admin
          </a>
        </div>
      </div>
    </div>
  );
}
`;

// ====================================================================
// WRITE ALL FILES
// ====================================================================
console.log('🚀 Setting up /toko frontend...');
console.log('');

writeFile('src/app/toko/page.tsx', TOKO_PAGE);
writeFile('src/app/toko/[slug]/page.tsx', DETAIL_PAGE);
writeFile('src/app/toko/[slug]/CheckoutSection.tsx', CHECKOUT_SECTION);
writeFile('src/app/toko/success/page.tsx', SUCCESS_PAGE);
writeFile('src/app/toko/failed/page.tsx', FAILED_PAGE);

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎯 NEXT STEPS:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('1️⃣  Verify env vars di .env.local punya:');
console.log('    NEXT_PUBLIC_SUPABASE_URL=https://jbtgciepdmqxxcjflrxz.supabase.co');
console.log('    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...');
console.log('');
console.log('2️⃣  Test local:');
console.log('    npm run dev');
console.log('    Buka http://localhost:3000/toko → harusnya muncul katalog');
console.log('');
console.log('3️⃣  Commit & deploy:');
console.log('    git add src/app/toko');
console.log('    git commit -m "feat(toko): digital products catalog + checkout"');
console.log('    git push');
console.log('    # Vercel auto-deploy → https://linguo.id/toko live dalam 1-2 menit');
console.log('');
