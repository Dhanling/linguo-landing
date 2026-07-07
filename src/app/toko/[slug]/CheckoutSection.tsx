"use client";

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
  // referral-code-field-v1 — optional kode referral; default KOSONG (input manual).
  // Affiliate tetap ke-track lewat cookie linguo_ref / ?ref= saat submit (lihat bawah).
  const [refCode, setRefCode] = useState("");
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
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/xendit-create-digital-invoice`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pricing_id: selectedTier.id,
            // referral-code-field-v1 — manual input menang; fallback ke linguo_ref cookie (affiliate-ref-capture-v1)
            referral_code:
              refCode.trim() ||
              (typeof document !== "undefined"
                ? ("; " + document.cookie).split("; linguo_ref=")[1]?.split(";")[0] ?? null
                : null),
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
                className={`px-3 py-3 rounded-xl border-2 text-center transition-all ${
                  selectedTier?.id === tier.id
                    ? "border-teal-500 bg-teal-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
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

              {/* referral-code-field-v1 — optional, sama seperti funnel kelas */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Kode Referral (opsional)
                </label>
                <input
                  type="text"
                  value={refCode}
                  onChange={(e) => setRefCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 outline-none"
                  placeholder="Masukkan kode referral jika ada"
                  disabled={submitting}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Dapatkan dari teman atau afiliator Linguo
                </p>
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
                {submitting ? "Membuat Invoice..." : `Lanjut Bayar Rp ${formatRupiah(selectedTier.price)}`}
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
