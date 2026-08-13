"use client";

import { useEffect, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  externalLinkFor, isStoragePath, accessVerb, isPlaceholderLink,
  fetchProductLangs, usableLangs, type ProductLang,
} from "@/lib/digitalAccess";
/* linguo-patch:produk-digital-link-v1 — playlist YouTube diputar di dashboard, bukan tab baru */
import { parseYouTube } from "@/lib/youtube";
import YouTubePlayerModal, { type PlayerTarget } from "@/components/YouTubePlayerModal";
/* produk-digital-per-bahasa-v1 — paket multi-bahasa: pilih bahasa dulu, baru playlist-nya dibuka */
import LangMateriPicker, { type LangPickerTarget } from "@/components/LangMateriPicker";

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
  const [playing, setPlaying] = useState<PlayerTarget | null>(null);
  /* produk-digital-per-bahasa-v1 */
  const [prodLangs, setProdLangs] = useState<Record<string, ProductLang[]>>({});
  const [picking, setPicking] = useState<LangPickerTarget | null>(null);

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
      const rows = (data ?? []) as any[];
      setPurchases(rows);
      // [produk-digital-per-bahasa-v1] link materi per bahasa untuk produk yang dibeli
      fetchProductLangs(supabase, rows.map((r) => r.digital_products?.id)).then(setProdLangs);
    }
    setLoading(false);
  }

  /* [produk-digital-per-bahasa-v1] buka satu bahasa dari paket */
  function openLang(productTitle: string, l: ProductLang) {
    setPicking(null);
    const url = (l.video_playlist_url ?? "").trim();
    const yt = parseYouTube(url);
    if (yt) { setPlaying({ title: `${productTitle} — ${l.language}`, ref: yt }); return; }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function handleAccess(purchase: PurchaseItem) {
    const product = purchase.digital_products;

    // [produk-digital-per-bahasa-v1] Paket multi-bahasa: materinya banyak playlist,
    // jadi tanya bahasanya dulu. Aturan sama dengan LibraryView.
    const kids = prodLangs[product.id];
    if (kids && kids.length > 0) {
      const ready = usableLangs(kids);
      if (ready.length === 0) {
        alert(`Materi "${product.title}" belum dipasang linknya oleh admin. Hubungi CS Linguo ya.`);
        return;
      }
      if (ready.length === 1) { openLang(product.title, ready[0]); return; }
      setPicking({ title: product.title, langs: ready });
      return;
    }

    // Produk dikirim sebagai LINK (YouTube / Google Drive / dll) → buka langsung.
    const link = externalLinkFor(product);
    // [bug-fix:placeholder-link-guard-v1] Aturan sama dengan LibraryView — jangan
    // pernah membuang siswa ke beranda YouTube gara-gara link contekan.
    if (link && isPlaceholderLink(link)) {
      alert(`Materi "${product.title}" belum dipasang linknya oleh admin. Hubungi CS Linguo ya.`);
      return;
    }
    if (link) {
      if (product.type === "ebook") {
        supabase
          .from("digital_purchases")
          .update({
            download_count: purchase.download_count + 1,
            last_downloaded_at: new Date().toISOString(),
          })
          .eq("id", purchase.id)
          .then(() => setTimeout(() => fetchPurchases(), 1000));
      }
      // [produk-digital-link-v1] YouTube → putar di sini; sisanya tetap tab baru.
      const yt = parseYouTube(link);
      if (yt) {
        setPlaying({ title: product.title, ref: yt });
        return;
      }
      window.open(link, "_blank", "noopener,noreferrer");
      return;
    }

    // e-book tanpa link eksternal → file di storage (signed URL, perilaku lama)
    if (product.type === "ebook" && isStoragePath(product.file_url)) {
      setDownloading(purchase.id);
      try {
        const { data, error } = await supabase
          .storage
          .from("ebook-files")
          .createSignedUrl(product.file_url!, 7 * 24 * 60 * 60);

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
                      : (() => {
                          const v = accessVerb(product);
                          return v === "Tonton" ? "▶️ Tonton" : v === "Buka" ? "🔗 Buka" : "📥 Download";
                        })()}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {/* produk-digital-per-bahasa-v1 — paket multi-bahasa: pilih bahasa dulu */}
      <LangMateriPicker
        target={picking}
        onPick={(l) => openLang(picking?.title ?? "", l)}
        onClose={() => setPicking(null)}
      />
      {/* linguo-patch:produk-digital-link-v1 */}
      <YouTubePlayerModal target={playing} onClose={() => setPlaying(null)} />
    </div>
  );
}
