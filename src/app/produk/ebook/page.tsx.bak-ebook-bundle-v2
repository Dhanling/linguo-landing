"use client";
import { useState } from "react";
import Link from "next/link";

const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

const LANGS = ["🇬🇧 Inggris","🇪🇸 Spanyol","🇩🇪 Jerman","🇯🇵 Jepang","🇨🇳 Mandarin","🇫🇷 Prancis","🇰🇷 Korea","🇸🇦 Arab","🇳🇱 Belanda","🇮🇹 Italia","🇵🇭 Tagalog","🇹🇷 Turki","🇷🇺 Rusia","🇵🇹 Portugis","🇹🇭 Thailand","🇻🇳 Vietnam","🇮🇳 Hindi","🇸🇪 Swedia","🇩🇰 Denmark","🇫🇮 Finlandia"];

const FEATURES = ["Format PDF","Akses selamanya","Kosakata praktis","Latihan soal","Contoh percakapan","Update gratis"];

export default function EbookPage() {
  const [sel, setSel] = useState<string | null>(null);

  const buy = (nm: string, price: number) => {
    const msg = `Halo Linguo.id! Saya tertarik membeli:\n\n📦 Produk: ${nm}\n💰 Harga: ${formatRp(price)}\n\nMohon info pembayaran. Terima kasih!`;
    window.open(`https://wa.me/6282116859493?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "Poppins,sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-800 hover:text-teal-600">
            <span className="font-bold text-lg">← Linguo.id</span>
          </Link>
          <a href="https://wa.me/6282116859493" target="_blank" className="text-sm text-teal-600 font-medium">
            Butuh bantuan?
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-teal-50" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-full px-4 py-1.5 mb-6">
            <span className="text-sm font-medium text-indigo-700">E-Book Digital Linguo</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4">
            E-Book Belajar Bahasa
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-teal-500">
              Mulai dari Rp 29.000
            </span>
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Modul lengkap dari basic hingga intermediate. Kosakata praktis, contoh percakapan, dan latihan soal — bisa dipelajari kapan saja.
          </p>
        </div>
      </section>

      {/* Product card */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-3xl p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="flex-1">
              <span className="inline-flex items-center gap-2 bg-indigo-100 rounded-full px-3 py-1 mb-4 text-xs font-semibold text-indigo-700">
                E-Book Digital
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">Satu E-Book, Satu Bahasa</h2>
              <p className="text-slate-500 mb-4">
                Pilih bahasa yang mau kamu kuasai. Setiap e-book disusun rapi oleh tim kurikulum Linguo.
              </p>
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl font-extrabold text-slate-900">Rp 29.000</span>
                <span className="text-sm text-slate-400">/e-book</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {FEATURES.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-indigo-500">✓</span>
                    {f}
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full md:w-80 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900 mb-3">Pilih bahasa:</p>
              <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto">
                {LANGS.map((l) => {
                  const nm: string = l.slice(2).trim();
                  return (
                    <button
                      key={l}
                      onClick={() => setSel(sel === nm ? null : nm)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        sel === nm
                          ? "bg-indigo-500 text-white shadow-md"
                          : "bg-slate-50 text-slate-700 hover:bg-indigo-50"
                      }`}
                    >
                      {l}
                    </button>
                  );
                })}
              </div>
              <button
                disabled={!sel}
                onClick={() => sel && buy(`E-Book ${sel}`, 29000)}
                className="w-full mt-4 py-3 rounded-2xl font-bold text-sm bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-40 transition-all"
              >
                {sel ? `Beli E-Book ${sel}` : "Pilih bahasa dulu"}
              </button>
            </div>
          </div>
        </div>

        {/* Feature strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
          {[
            { i: "📄", l: "Format PDF", s: "Buka di HP / laptop" },
            { i: "♾️", l: "Akses Selamanya", s: "Sekali beli, simpan terus" },
            { i: "✏️", l: "Latihan Soal", s: "Latih pemahamanmu" },
            { i: "🔄", l: "Update Gratis", s: "Revisi terbaru gratis" },
          ].map((f) => (
            <div key={f.l} className="bg-slate-50 rounded-2xl p-5 text-center">
              <div className="text-2xl mb-2">{f.i}</div>
              <p className="text-sm font-semibold text-slate-900">{f.l}</p>
              <p className="text-xs text-slate-400 mt-1">{f.s}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Apa Kata Mereka?</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { n: "Budi S.", t: "E-book materinya lengkap. Worth it banget cuma 29rb!" },
            { n: "Lia P.", t: "Contoh percakapannya kepake banget buat latihan sehari-hari." },
            { n: "Andi W.", t: "Format PDF-nya rapi, gampang dibaca di HP pas lagi senggang." },
          ].map((t, i) => (
            <div key={i} className="bg-slate-50 rounded-2xl p-6">
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((j) => (
                  <span key={j} className="text-amber-400">★</span>
                ))}
              </div>
              <p className="text-sm text-slate-600 mb-4">&ldquo;{t.t}&rdquo;</p>
              <p className="text-sm font-semibold text-slate-900">{t.n}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="bg-slate-50 rounded-3xl p-8 flex flex-wrap items-center justify-center gap-8">
          {["🔒 Pembayaran Aman", "⚡ Akses Instan", "🌍 20+ Bahasa", "⭐ Google Review 5.0"].map((b) => (
            <span key={b} className="text-sm font-medium text-slate-500">{b}</span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-400">© 2026 Linguo.id</p>
          <div className="flex gap-4">
            <a href="https://wa.me/6282116859493" target="_blank" className="text-sm text-slate-500 hover:text-teal-600">WhatsApp</a>
            <a href="https://instagram.com/linguo.id" target="_blank" className="text-sm text-slate-500 hover:text-teal-600">Instagram</a>
            <a href="https://tiktok.com/@linguoid" target="_blank" className="text-sm text-slate-500 hover:text-teal-600">TikTok</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
