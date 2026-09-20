import { supabase } from '@/lib/supabase-client';
import { ELEARNING_BUNDLE_SLUG } from '@/lib/elearningBundle';
import { materialReady } from '@/lib/digitalAccess';
import BreadcrumbLd from "@/components/BreadcrumbLd"; // [aeo-schema-v1]
import ElearningLangClient from './ElearningLangClient';

// Product/pricing data changes rarely, so cache the rendered page and
// revalidate hourly (ISR). This makes navigation from /toko instant — the
// page is served from cache and can be prefetched by <Link> — instead of
// re-running a Supabase query on every click (the old force-dynamic behavior).
export const revalidate = 3600;

export const metadata = {
  alternates: { canonical: "https://linguo.id/toko/paket-elearning" },
  title: 'E-Learning Linguo — Rekaman Kelas per Bahasa, Rp 79.000',
  description:
    'Rekaman kelas level Basic (A1.1) per bahasa: belajar mandiri lewat video kapan saja. Rp 79.000 akses 6 bulan, Rp 150.000 akses 1 tahun.',
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
  language: string | null;
  level: string | null;
  is_featured: boolean;
  /** [elearning-siap-v1] false = playlist-nya belum diisi → `/api/create-cart-invoice`
      menolaknya ("materinya belum siap"), jadi kartunya tampil "Segera hadir". */
  ready: boolean;
  digital_product_pricing: PricingTier[];
};

// [elearning-per-bahasa-v1] Paket "12+ bahasa sekaligus" sudah tidak dijual;
// e-learning sekarang satu produk per bahasa (harga sama rata: Rp 79.000 untuk
// 6 bulan, Rp 150.000 untuk 1 tahun). Halaman ini TIDAK dipindah/diganti URL-nya
// karena dipakai link afiliator, iklan, dan sitemap — isinya saja yang berubah
// dari halaman checkout satu paket jadi etalase per bahasa.
export default async function ElearningPage() {
  const { data, error } = await supabase
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
      is_featured,
      file_url,
      video_playlist_url,
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
    .neq('slug', ELEARNING_BUNDLE_SLUG)
    .order('is_featured', { ascending: false })
    .order('title');

  if (error) {
    console.error('[/toko/paket-elearning] fetch error:', error.message);
  }

  // [elearning-siap-v1] Aturan siapnya SAMA dengan route keranjang (materialReady),
  // dan link playlist-nya dibuang di server — itu isi berbayar, jangan sampai ikut
  // terkirim ke browser. Yang siap di depan, urutan lain tetap.
  type Mentah = Omit<ElearningProduct, 'ready'> & { file_url: string | null; video_playlist_url: string | null };
  const products: ElearningProduct[] = ((data as Mentah[] | null) ?? [])
    .map(({ file_url, video_playlist_url, ...p }) => ({
      ...p,
      ready: materialReady({ type: 'elearning', file_url, video_playlist_url }),
    }))
    .sort((a, b) => Number(b.ready) - Number(a.ready));

  return (
    <>
      <BreadcrumbLd
        trail={[
          { name: "Produk Digital", path: "/toko" },
          { name: "E-Learning", path: "/toko/paket-elearning" },
        ]}
      />
      <ElearningLangClient products={products} />
    </>
  );
}
