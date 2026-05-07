"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const PRICE_CATEGORIES: Record<string, { flag: string; name: string }[]> = {
  A: [
    { flag: "🇹🇿", name: "Swahili" },
    { flag: "🇬🇷", name: "Greek" },
    { flag: "🇮🇳", name: "Hindi" },
    { flag: "🇹🇷", name: "Turkish" },
    { flag: "🇳🇴", name: "Norwegian" },
    { flag: "🇵🇭", name: "Tagalog" },
    { flag: "🇻🇳", name: "Vietnamese" },
    { flag: "🇸🇪", name: "Swedish" },
    { flag: "🇵🇰", name: "Urdu" },
    { flag: "🏴", name: "Kurdish" },
    { flag: "🇮🇱", name: "Hebrew" },
    { flag: "🇵🇱", name: "Polish" },
    { flag: "🇵🇹", name: "Portuguese" },
    { flag: "🇫🇮", name: "Finnish" },
    { flag: "🇨🇿", name: "Czech" },
    { flag: "🇹🇼", name: "Traditional Chinese" },
    { flag: "🇭🇺", name: "Hungarian" },
    { flag: "🌐", name: "Esperanto" },
    { flag: "🇮🇷", name: "Farsi" },
    { flag: "🇬🇧", name: "English British" },
    { flag: "🇷🇴", name: "Romanian" },
    { flag: "🇰🇭", name: "Khmer" },
    { flag: "🇩🇰", name: "Danish" },
    { flag: "🇺🇿", name: "Uzbek" },
    { flag: "🇷🇸", name: "Serbian" },
    { flag: "🇪🇪", name: "Estonian" },
    { flag: "📜", name: "Latin" },
    { flag: "🇪🇬", name: "Ancient Egyptian" },
    { flag: "🇬🇪", name: "Georgian" },
    { flag: "🇮🇪", name: "Irish" },
    { flag: "🇲🇾", name: "Malay" },
  ],
  B: [
    { flag: "🇷🇺", name: "Russian" },
    { flag: "🇳🇱", name: "Dutch" },
    { flag: "🇮🇹", name: "Italian" },
    { flag: "🇪🇸", name: "Spanish" },
    { flag: "🇹🇭", name: "Thai" },
    { flag: "👌", name: "Sign Language" },
  ],
  C: [
    { flag: "🇸🇦", name: "Arabic" },
    { flag: "🇬🇧", name: "English" },
    { flag: "🇯🇵", name: "Japanese" },
    { flag: "🇩🇪", name: "German" },
    { flag: "🇰🇷", name: "Korean" },
    { flag: "🇨🇳", name: "Mandarin" },
    { flag: "🇫🇷", name: "French" },
  ],
  D: [
    { flag: "🇮🇩", name: "Javanese" },
    { flag: "🇮🇩", name: "Sundanese" },
    { flag: "🇮🇩", name: "Madurese" },
    { flag: "🇮🇩", name: "Batak" },
    { flag: "🇮🇩", name: "Banjar" },
    { flag: "🇮🇩", name: "Balinese" },
    { flag: "🇮🇩", name: "Bugis" },
  ],
  E: [
    { flag: "🇮🇩", name: "BIPA (Indonesian for Foreigners)" },
  ],
};

// [A1, A2, B1/B2, C1/C2] per 60 menit
const PRICE_TABLE: Record<string, number[]> = {
  A: [120000, 130000, 140000, 150000],
  B: [110000, 120000, 130000, 140000],
  C: [100000, 105000, 110000, 120000],
  D: [90000, 95000, 100000, 110000],
  E: [150000, 160000, 170000, 180000],
};

const LEVELS = [
  { key: 0, label: "A1", sublabel: "Pemula" },
  { key: 1, label: "A2", sublabel: "Dasar" },
  { key: 2, label: "B1/B2", sublabel: "Menengah" },
  { key: 3, label: "C1/C2", sublabel: "Mahir" },
];

const CAT_LABELS: Record<string, string> = {
  A: "Tipe A — Bahasa Langka & Eropa",
  B: "Tipe B — Bahasa Populer Eropa & Asia",
  C: "Tipe C — Bahasa Paling Diminati",
  D: "Tipe D — Bahasa Nusantara",
  E: "Tipe E — BIPA",
};

const CAT_COLORS: Record<string, string> = {
  A: "from-violet-500 to-purple-600",
  B: "from-blue-500 to-cyan-600",
  C: "from-[#1A9E9E] to-teal-600",
  D: "from-amber-500 to-orange-600",
  E: "from-rose-500 to-pink-600",
};

function formatRp(v: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);
}

export default function HargaPage() {
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [selectedSessions, setSelectedSessions] = useState(16);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 backdrop-blur-xl bg-white/95">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src="/images/logo-color.png" alt="Linguo" className="h-8 sm:h-10 object-contain" />
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium hidden sm:block">Home</Link>
            <Link href="/blog" className="text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium">Blog</Link>
            <Link href="/silabus" className="text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium hidden sm:block">Silabus</Link>
            <Link href="/" className="bg-[#1A9E9E] text-white text-sm font-bold px-5 py-2 rounded-full hover:bg-[#178585] transition-colors">
              Daftar Sekarang
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0d7a7a] via-[#1A9E9E] to-[#22b8b8] text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            🎓 Kelas Private 1-on-1
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
            Harga Transparan,<br />Sesuai Bahasa & Level
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
            Harga Kelas Private disesuaikan dengan bahasa pilihan dan level kamu. Semakin tinggi level, semakin intensif materinya.
          </p>
          {/* Session calculator */}
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 max-w-md mx-auto">
            <p className="text-sm font-medium text-white/80 mb-3">Hitung paket kamu:</p>
            <div className="flex items-center gap-3 justify-center">
              <button onClick={() => setSelectedSessions(Math.max(1, selectedSessions - 1))}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 font-bold text-lg transition-colors">−</button>
              <span className="text-3xl font-extrabold w-16 text-center">{selectedSessions}</span>
              <button onClick={() => setSelectedSessions(Math.min(100, selectedSessions + 1))}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 font-bold text-lg transition-colors">+</button>
            </div>
            <p className="text-white/60 text-xs mt-2">sesi (default paket: 16 sesi)</p>
          </div>
        </div>
      </div>

      {/* Level Selector */}
      <div className="sticky top-16 z-40 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap mr-2">Pilih Level:</span>
          {LEVELS.map(l => (
            <button
              key={l.key}
              onClick={() => setSelectedLevel(l.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                selectedLevel === l.key
                  ? "bg-[#1A9E9E] text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {l.label}
              <span className={`text-xs font-normal ${selectedLevel === l.key ? "text-white/70" : "text-slate-400"}`}>
                {l.sublabel}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Pricelist by Category */}
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        {Object.keys(PRICE_CATEGORIES).map(cat => {
          const pricePerSession = PRICE_TABLE[cat][selectedLevel];
          const totalPackage = pricePerSession * selectedSessions;
          return (
            <div key={cat} className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              {/* Category Header */}
              <div className={`bg-gradient-to-r ${CAT_COLORS[cat]} p-5 text-white`}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="text-lg font-bold">{CAT_LABELS[cat]}</h2>
                    <p className="text-white/70 text-sm mt-0.5">{PRICE_CATEGORIES[cat].length} bahasa tersedia</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/70 text-xs mb-0.5">Harga per sesi (60 menit)</p>
                    <p className="text-3xl font-extrabold">{formatRp(pricePerSession)}</p>
                    <p className="text-white/70 text-xs mt-1">
                      Paket {selectedSessions} sesi: <span className="text-white font-bold">{formatRp(totalPackage)}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Languages Grid */}
              <div className="p-5 bg-white">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {PRICE_CATEGORIES[cat].map(lang => (
                    <div key={lang.name}
                      className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 rounded-xl px-3 py-2.5 transition-colors cursor-default">
                      <span className="text-xl">{lang.flag}</span>
                      <span className="text-sm font-medium text-slate-700 truncate">{lang.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="px-5 pb-5">
                <a href={`https://wa.me/6282116859493?text=Halo%20Min%20Ling!%20Saya%20tertarik%20daftar%20Kelas%20Private%20${encodeURIComponent(PRICE_CATEGORIES[cat][0]?.name || "")}%20level%20${LEVELS[selectedLevel].label}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#1A9E9E] hover:bg-[#178585] text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
                  💬 Konsultasi via WhatsApp
                </a>
              </div>
            </div>
          );
        })}

        {/* Notes */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <h3 className="font-bold text-amber-800 mb-3">📋 Catatan Penting</h3>
          <ul className="text-sm text-amber-700 space-y-2">
            <li>✅ Harga di atas untuk durasi <strong>60 menit / sesi</strong>. Tersedia juga 30 menit & 45 menit (harga proporsional).</li>
            <li>✅ Paket standar: <strong>16 sesi</strong> per sublevel (A1.1 → A1.2, dst).</li>
            <li>✅ Semua kelas via <strong>Zoom</strong>, request jadwal & topik sesukamu.</li>
            <li>✅ Termasuk: recording kelas, soft file materi, akses grup belajar.</li>
            <li>⚡ Harga belum termasuk modul fisik (opsional, +Rp 50.000).</li>
          </ul>
        </div>

        {/* Comparison table */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Perbandingan Semua Tipe</h2>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Tipe</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-700">A1<br/><span className="text-xs font-normal text-slate-400">Pemula</span></th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-700">A2<br/><span className="text-xs font-normal text-slate-400">Dasar</span></th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-700">B1/B2<br/><span className="text-xs font-normal text-slate-400">Menengah</span></th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-700">C1/C2<br/><span className="text-xs font-normal text-slate-400">Mahir</span></th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(PRICE_TABLE).map((cat, i) => (
                  <tr key={cat} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="px-4 py-3 font-semibold">
                      <span className={`inline-block w-2 h-2 rounded-full bg-gradient-to-r ${CAT_COLORS[cat]} mr-2`} />
                      {cat} · {CAT_LABELS[cat].split("—")[1]?.trim()}
                    </td>
                    {PRICE_TABLE[cat].map((price, j) => (
                      <td key={j} className={`text-center px-4 py-3 font-medium ${j === selectedLevel ? "text-[#1A9E9E] font-bold" : "text-slate-600"}`}>
                        {formatRp(price)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 text-center mt-3">*Harga per sesi · durasi 60 menit · 1 siswa</p>
        </div>

        {/* CTA Bottom */}
        <div className="bg-gradient-to-r from-[#1A9E9E] to-teal-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">Siap Mulai Belajar?</h2>
          <p className="text-white/80 mb-6">Konsultasi gratis, pilih bahasa & jadwal sesukamu.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a href="https://wa.me/6282116859493?text=Halo%20Min%20Ling!%20Saya%20mau%20daftar%20Kelas%20Private"
              target="_blank" rel="noopener noreferrer"
              className="bg-white text-[#1A9E9E] font-bold px-6 py-3 rounded-full hover:bg-slate-50 transition-colors">
              💬 Chat WhatsApp
            </a>
            <Link href="/"
              className="bg-white/20 hover:bg-white/30 text-white font-bold px-6 py-3 rounded-full transition-colors">
              Placement Test Gratis →
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white/60 text-center py-6 text-xs">
        Linguo.id — Everyone Can Be a Polyglot
      </footer>
    </div>
  );
}
