"use client";
import { useState } from "react";

// ─── Data ────────────────────────────────────────────────────────────────────

const LEVEL_PRESETS = [
  { label: "A1", desc: "Pemula", sessions: 48 },
  { label: "A2", desc: "Dasar", sessions: 64 },
  { label: "B1", desc: "Menengah", sessions: 80 },
  { label: "A1–A2", desc: "Pemula → Dasar", sessions: 112 },
  { label: "A1–B1", desc: "Pemula → Menengah", sessions: 192 },
  { label: "A1–B2", desc: "Full Program", sessions: 304 },
];

const PRICE_DATA = [
  { id: "private", slug: "1 on 1", name: "Private Class", cat: "private", paxMin: 1, paxMax: 1, price: 350_000, recommended: false },
  { id: "semi-s", slug: "Semi Private S", name: "Small Group", cat: "semi_private", paxMin: 2, paxMax: 3, price: 500_000, recommended: false },
  { id: "semi-m", slug: "Semi Private M", name: "Medium Group", cat: "semi_private", paxMin: 4, paxMax: 7, price: 750_000, recommended: true },
  { id: "semi-l", slug: "Semi Private L", name: "Large Semi Private", cat: "semi_private", paxMin: 8, paxMax: 10, price: 950_000, recommended: false },
  { id: "group-s", slug: "Group S", name: "Group Small", cat: "group", paxMin: 11, paxMax: 15, price: 1_100_000, recommended: false },
  { id: "group-m", slug: "Group M", name: "Group Medium", cat: "group", paxMin: 16, paxMax: 20, price: 1_300_000, recommended: false },
  { id: "group-l", slug: "Group L", name: "Group Large", cat: "group", paxMin: 21, paxMax: 30, price: 1_800_000, recommended: false },
];

const INCLUDES = [
  "Modul & materi belajar custom per industri",
  "Laporan progres peserta setiap bulan",
  "Sertifikat kelulusan untuk setiap peserta",
  "Kelas online via Zoom / Google Meet",
  "Reschedule fleksibel (maks. 1× per minggu)",
  "Trial session gratis sebelum kontrak",
  "Harga negotiable sesuai budget perusahaan",
];

function rp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function perPersonRange(price: number, paxMin: number, paxMax: number) {
  if (paxMin === paxMax) return rp(Math.round(price / paxMin)) + " / orang";
  return rp(Math.round(price / paxMax)) + " – " + rp(Math.round(price / paxMin)) + " / orang";
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HargaKorporatPage() {
  const [sessions, setSessions] = useState(40);
  const [customInput, setCustomInput] = useState(false);
  const [filter, setFilter] = useState<"all" | "private" | "semi_private" | "group">("all");
  const [copied, setCopied] = useState(false);

  const filtered = filter === "all" ? PRICE_DATA : PRICE_DATA.filter((p) => p.cat === filter);

  function copyLink() {
    navigator.clipboard.writeText("https://linguo.id/corporate-pricelist").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{ background: "#0D7A7A" }} className="px-5 py-10 relative overflow-hidden">
        {/* decorative circles */}
        <div className="absolute top-[-60px] right-[-60px] w-64 h-64 rounded-full border border-white/10" />
        <div className="absolute bottom-[-80px] left-[-40px] w-48 h-48 rounded-full border border-white/10" />

        <div className="max-w-4xl mx-auto">
          {/* logo */}
          <a href="/" className="inline-flex items-center gap-2 mb-8"><img src="/images/logo-color.png" alt="Linguo" className="h-9 object-contain" /></a>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-2">
                Corporate Program
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 leading-tight">
                Daftar Harga B2B
              </h1>
              <p className="text-white/60 text-sm">
                PT. Linguo Edu Indonesia · 60+ bahasa · Online &amp; Offline
              </p>
              {/* pills */}
              <div className="flex flex-wrap gap-2 mt-5">
                {["90 menit / sesi", "Min. 40 sesi", "Maks. 3 bulan", "Fleksibel & Negotiable"].map((t) => (
                  <span key={t} className="bg-white/10 border border-white/20 text-white/80 text-xs px-3 py-1 rounded-full">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Controls ───────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-5 mt-8 print:hidden">

        {/* Level presets */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Target Level Peserta
          </p>
          <div className="flex flex-wrap gap-2">
            {LEVEL_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => { setSessions(p.sessions); setCustomInput(false); }}
                className={`text-sm px-4 py-2 rounded-xl font-medium transition flex flex-col items-center leading-tight ${
                  sessions === p.sessions && !customInput
                    ? "text-white shadow-sm"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-teal-400 hover:text-teal-600"
                }`}
                style={sessions === p.sessions && !customInput ? { background: "#1A9E9E" } : {}}
              >
                <span className="font-bold">{p.label}</span>
                <span className="text-[11px] opacity-80">{p.sessions} sesi</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom + filter row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Custom sesi */}
          <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5">
            <span className="text-sm text-gray-600 shrink-0">Custom sesi:</span>
            <div className="flex gap-1.5">
              {[40, 60, 80].map((n) => (
                <button
                  key={n}
                  onClick={() => { setSessions(n); setCustomInput(false); }}
                  className={`text-xs px-3 py-1 rounded-lg font-medium transition ${
                    sessions === n && !customInput ? "text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                  style={sessions === n && !customInput ? { background: "#1A9E9E" } : {}}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setCustomInput(true)}
                className={`text-xs px-3 py-1 rounded-lg font-medium transition ${
                  customInput ? "text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
                style={customInput ? { background: "#1A9E9E" } : {}}
              >
                Lainnya
              </button>
            </div>
            {customInput && (
              <input
                type="number"
                min={1}
                max={500}
                value={sessions}
                onChange={(e) => setSessions(Math.max(1, Number(e.target.value)))}
                className="w-20 text-sm border border-gray-300 rounded-lg px-2 py-1"
                autoFocus
              />
            )}
          </div>

          {/* Category filter */}
          <div className="flex gap-1.5 flex-wrap">
            {[
              { key: "all", label: "Semua" },
              { key: "private", label: "Private" },
              { key: "semi_private", label: "Semi Private" },
              { key: "group", label: "Group" },
            ].map((c) => (
              <button
                key={c.key}
                onClick={() => setFilter(c.key as typeof filter)}
                className={`text-xs px-4 py-1.5 rounded-full font-medium transition ${
                  filter === c.key ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Cards ──────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const total = item.price * sessions;
            return (
              <div
                key={item.id}
                className={`relative rounded-2xl border bg-white p-5 flex flex-col gap-3 transition-shadow hover:shadow-md ${
                  item.recommended ? "border-[#1A9E9E] ring-1 ring-[#1A9E9E]/20" : "border-gray-200"
                }`}
              >
                {item.recommended && (
                  <div
                    className="absolute -top-3 left-4 text-white text-xs font-semibold px-3 py-0.5 rounded-full"
                    style={{ background: "#1A9E9E" }}
                  >
                    ★ Paling Populer
                  </div>
                )}
                <div className="flex items-start justify-between mt-1 gap-2">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.slug}</p>
                    <p className="text-base font-bold text-gray-900">{item.name}</p>
                  </div>
                  <span className="shrink-0 bg-gray-100 text-gray-600 text-[11px] font-medium px-2.5 py-1 rounded-full">
                    {item.paxMin === item.paxMax ? `${item.paxMin} peserta` : `${item.paxMin}–${item.paxMax} peserta`}
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex flex-col gap-1.5">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-gray-400">Per sesi</span>
                    <span className="text-lg font-bold" style={{ color: "#1A9E9E" }}>{rp(item.price)}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-gray-400">Per orang / sesi</span>
                    <span className="text-xs text-gray-500">{perPersonRange(item.price, item.paxMin, item.paxMax)}</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl px-3 py-2.5 flex justify-between items-center">
                  <span className="text-xs text-gray-500">Total {sessions} sesi</span>
                  <span className="text-sm font-bold text-gray-900">{rp(total)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Includes ── */}
        <div className="mt-8 border border-gray-200 rounded-2xl p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
            Sudah termasuk dalam semua paket
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {INCLUDES.map((inc) => (
              <div key={inc} className="flex items-start gap-2.5 text-sm text-gray-600">
                <svg className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#1A9E9E" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {inc}
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="mt-6 rounded-2xl p-6 mb-12 text-white" style={{ background: "#0D7A7A" }}>
          <h2 className="text-lg font-bold mb-1">Tertarik? Mari diskusi lebih lanjut.</h2>
          <p className="text-white/70 text-sm mb-4">
            Harga dapat disesuaikan dengan kebutuhan dan budget perusahaan Anda.
            PPN 11% &amp; PPh 23 dihitung terpisah untuk invoice resmi.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://wa.me/6282217866789?text=Halo%20Linguo%2C%20saya%20tertarik%20Corporate%20Class%20Program"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-white text-sm font-semibold px-5 py-2.5 rounded-xl transition hover:bg-white/90"
              style={{ color: "#0D7A7A" }}
            >
              WhatsApp Kami
            </a>
            <a
              href="mailto:info@linguo.id"
              className="flex items-center gap-2 bg-white/10 border border-white/20 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition hover:bg-white/20"
            >
              info@linguo.id
            </a>
          </div>
        </div>

        {/* ── Footer note ── */}
        <p className="text-center text-xs text-gray-400 pb-8">
          PT. Linguo Edu Indonesia · (022) 85942550 · www.linguo.id
        </p>
      </div>
    </div>
  );
}
