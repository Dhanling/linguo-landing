import { createClient } from "@supabase/supabase-js";
import TokoClient from "./TokoClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Toko Digital — Linguo",
  description: "E-Books premium & recording class. Belajar 10+ bahasa kapan aja, di mana aja.",
};

interface PricingTier {
  price: number;
  display_label: string;
  sort_order: number;
  duration_days: number | null;
}

interface Product {
  id: string;
  type: "ebook" | "elearning";
  title: string;
  slug: string;
  description: string;
  language: string | null;
  level: string | null;
  category: string | null;
  is_featured: boolean;
  digital_product_pricing: PricingTier[];
}

export default async function TokoPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: products } = await supabase
    .from("digital_products")
    .select(\`
      id, type, title, slug, description,
      language, level, category, is_featured,
      digital_product_pricing (
        price, display_label, sort_order, duration_days
      )
    \`)
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  return <TokoClient products={(products ?? []) as Product[]} />;
}
