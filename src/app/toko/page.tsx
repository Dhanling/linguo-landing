import { createServerClient } from '@/lib/supabase-server';
import { ELEARNING_BUNDLE_SLUG } from '@/lib/elearningBundle';
import { saringEdisiLama } from '@/lib/ebookEdisi';
import TokoClient from './TokoClient';

// ISR: halaman di-render sekali lalu di-cache 1 jam. Tidak lagi query Supabase
// di tiap request (sebelumnya `force-dynamic` bikin tiap refresh terasa lambat).
export const revalidate = 3600;

export const metadata = {
  alternates: { canonical: "https://linguo.id/toko" },
  title: 'Toko Digital — Linguo.id',
  description:
    'E-Book & E-Learning untuk belajar bahasa di waktu luangmu. Akses kapan saja, dari mana saja.',
};

export type PricingTier = {
  price: number;
  display_label: string;
  sort_order: number;
  duration_days: number | null;
  is_active: boolean | null;
};

export type Product = {
  id: string;
  type: 'ebook' | 'elearning';
  title: string;
  slug: string;
  description: string | null;
  language: string | null;
  level: string | null;
  category: string | null;
  is_featured: boolean;
  digital_product_pricing: PricingTier[];
};

export default async function TokoPage() {
  const supabase = createServerClient(revalidate);
  const { data: products, error } = await supabase
    .from('digital_products')
    .select(
      `
      id,
      type,
      title,
      slug,
      description,
      language,
      level,
      category,
      is_featured,
      digital_product_pricing (
        price,
        display_label,
        sort_order,
        duration_days,
        is_active
      )
    `
    )
    .eq('is_active', true)
    // [elearning-per-bahasa-v1] Paket lama 12+ bahasa tidak dijual lagi — barisnya
    // tetap aktif demi pembeli lama, tapi jangan tampil di etalase.
    .neq('slug', ELEARNING_BUNDLE_SLUG)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[/toko] fetch error:', error.message);
  }

  // [etalase-sembunyikan-edisi-lama-v1] modul edisi lama tidak ditawarkan lagi di
  // bahasa yang sudah punya edisi baru — pembeli sempat salah pilih kartu.
  return <TokoClient products={saringEdisiLama((products as Product[] | null) ?? [])} />;
}
