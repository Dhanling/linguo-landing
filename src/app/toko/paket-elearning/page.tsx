import { supabase } from '@/lib/supabase-client';
import { notFound } from 'next/navigation';
import PaketElearningClient from './PaketElearningClient';

// Product/pricing data changes rarely, so cache the rendered page and
// revalidate hourly (ISR). This makes navigation from /toko instant — the
// page is served from cache and can be prefetched by <Link> — instead of
// re-running a Supabase query on every click (the old force-dynamic behavior).
export const revalidate = 3600;

export const metadata = {
  title: 'Paket E-Learning Linguo — Akses 10+ Bahasa Mulai Rp 29.000',
  description:
    'Belajar bahasa di waktu luangmu dengan video materi, komunitas belajar, dan e-sertifikat. Pilih durasi 1, 6, atau 12 bulan.',
};

export type PricingTier = {
  id: string;
  price: number;
  display_label: string;
  sort_order: number;
  duration_days: number | null;
};

export type ElearningProduct = {
  id: string;
  type: 'elearning';
  title: string;
  slug: string;
  description: string | null;
  digital_product_pricing: PricingTier[];
};

export default async function PaketElearningPage() {
  const { data: product, error } = await supabase
    .from('digital_products')
    .select(
      `
      id,
      type,
      title,
      slug,
      description,
      digital_product_pricing (
        id,
        price,
        display_label,
        sort_order,
        duration_days
      )
    `
    )
    .eq('type', 'elearning')
    .eq('is_active', true)
    .limit(1)
    .single();

  if (error || !product) {
    console.error('[/toko/paket-elearning] not found:', error?.message);
    notFound();
  }

  return <PaketElearningClient product={product as ElearningProduct} />;
}
