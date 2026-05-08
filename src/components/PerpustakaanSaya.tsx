"use client";

import { useEffect, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

interface PurchaseItem {
  id: string;
  payment_status: string;
  access_granted: boolean;
  expires_at: string | null;
  download_count: number;
  created_at: string;
  digital_products: {
    id: string;
    type: "ebook" | "elearning";
    title: string;
    cover_url: string | null;
    file_url: string | null;
    video_playlist_url: string | null;
  };
  digital_product_pricing: {
    display_label: string;
    duration_days: number | null;
  } | null;
}

interface Props {
  userId: string;
  supabase: SupabaseClient;
}

export default function PerpustakaanSaya({ userId, supabase }: Props) {
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetchPurchases();
  }, [userId]);

  async function fetchPurchases() {
    setLoading(true);
    const { data, error } = await supabase
      .from("digital_purchases")
      .select(`
        id, payment_status, access_granted, expires_at, 
        download_count, created_at,
        digital_products (
          id, type, title, cover_url, file_url, video_playlist_url
        ),
        digital_product_pricing (
          display_label, duration_days
        )
      `)
      .eq("auth_user_id", userId)
      .eq("payment_status", "Lunas")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch purchases:", error);
    } else {
      setPurchases((data ?? []) as any[]);
    }
    setLoading(false);
  }

  async function handleAccess(purchase: PurchaseItem) {
    const product = purchase.digital_products;
    
    // For elearning, langsung buka YouTube playlist
    if (product.type === "elearning" && product.video_playlist_url) {
      window.open(product.video_playlist_url, "_blank");
      return;
    }

    // For ebook, generate fresh signed URL via storage API
    if (product.type === "ebook" && product.file_url) {
      setDownloading(purchase.id);
      try {
        const { data, error } = await supabase
          .storage
          .from("ebook-files")
          .createSignedUrl(product.file_url, 7 * 24 * 60 * 60);

        if (error || !data) {
          alert("Gagal generate link download. Coba lagi atau hubungi admin.");
          return;
        }

        // Update download count
        await supabase
          .from("digital_purchases")
          .update({
            download_count: purchase.download_count + 1,
            last_downloaded_at: new Date().toISOString(),
          })
          .eq("id", purchase.id);

        window.open(data.signedUrl, "_blank");
        // Refresh untuk update counter di UI
        setTimeout(() => fetchPurchases(), 1000);
      } catch (e) {
        console.error(e);
        alert("Error generate link download.");
      } finally {
        setDownloading(null);
      }
    }
  }

  function isExpired(expiresAt: string | null) {
    if (!expiresAt) return false; // lifetime
    return new Date(expiresAt).getTime() < Date.now();
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric"
    });
  }

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center text-gray-500">
        Memuat perpustakaan...
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center">
        <div className="text-5xl mb-3">📚</div>
        <h3 className="text-lg font-semibold mb-1">Perpustakaan Masih Kosong</h3>
        <p className="text-gray-500 text-sm mb-4">
          Belum ada e-book atau course yang kamu beli
        </p>
        <a
          href="/toko"
          className="inline-block bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          🛍️ Browse Toko Digital
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {purchases.map((p) => {
        const product = p.digital_products;
        const pricing = p.digital_product_pricing;
        const expired = isExpired(p.expires_at);
        const isLifetime = !p.expires_at;

        return (
          <div
            key={p.id}
            className={`bg-white rounded-2xl p-4 border border-gray-100 ${expired ? "opacity-60" : ""}`}
          >
            <div className="flex gap-4">
              {/* Cover thumbnail */}
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white text-3xl shrink-0 overflow-hidden">
                {product.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.cover_url} alt={product.title} className="w-full h-full object-cover" />
                ) : product.type === "ebook" ? "📚" : "🎬"}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-teal-50 text-teal-700">
                    {product.type === "ebook" ? "E-Book" : "E-Learning"}
                  </span>
                  {pricing && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                      {pricing.display_label}
                    </span>
                  )}
                  {expired && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-red-50 text-red-700">
                      ❌ Akses Berakhir
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 truncate">{product.title}</h3>
                <p className="text-xs text-gray-500">
                  Dibeli {formatDate(p.created_at)}
                  {isLifetime && " · ⭐ Lifetime"}
                  {!isLifetime && p.expires_at && ` · Akses berlaku sampai ${formatDate(p.expires_at)}`}
                  {p.download_count > 0 && product.type === "ebook" && ` · ${p.download_count}× download`}
                </p>
              </div>

              <div className="shrink-0">
                {expired ? (
                  <a
                    href="/toko"
                    className="inline-block bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                  >
                    Perpanjang
                  </a>
                ) : (
                  <button
                    onClick={() => handleAccess(p)}
                    disabled={downloading === p.id || !p.access_granted}
                    className="bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                  >
                    {downloading === p.id 
                      ? "..." 
                      : product.type === "ebook" 
                        ? "📥 Download" 
                        : "▶️ Tonton"}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
