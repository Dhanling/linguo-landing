import { supabase } from '@/lib/supabase-client';
import TokoClient from './TokoClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Toko Digital — Linguo.id',
  description:
    'E-Book & E-Learning untuk belajar bahasa di waktu luangmu. Akses kapan saja, dari mana saja.',
};

export type PricingTier = {
  price: number;
  display_label: string;
  sort_order: number;
  duration_days: number | null;
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
        duration_days
      )
    `
    )
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[/toko] fetch error:', error.message);
  }

  return <TokoClient products={(products as Product[] | null) ?? []} />;
}
