"use client";

import Link from "next/link";

export default function TokoCTA() {
  return (
    <section className="px-6 py-16 md:py-24">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/toko"
          className="group relative block overflow-hidden rounded-3xl bg-gradient-to-br from-[#0d7474] via-[#1A9E9E] to-[#1A9E9E] p-10 md:p-14 transition-all duration-500 hover:shadow-[0_32px_64px_-16px_rgba(26,158,158,0.5)]"
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-[#F5C842] opacity-20 blur-3xl rounded-full group-hover:opacity-30 transition-opacity duration-700" />
            <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-white opacity-10 blur-3xl rounded-full" />
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1.5px, transparent 0)", backgroundSize: "28px 28px" }}
            />
          </div>
          <div className="relative grid md:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] font-bold text-[#F5C842] mb-4">
                <span>🛍️</span> Toko Digital · Baru!
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white leading-[1] tracking-tight mb-4">
                E-Books & Recording Class
                <br />
                <span className="italic font-serif font-medium text-[#F5C842]">belajar di waktu luangmu.</span>
              </h2>
              <p className="text-white/80 text-lg max-w-xl leading-relaxed">
                Modul belajar 6+ bahasa, plus paket E-Learning unlimited 10+ bahasa. Akses sekali, manfaat seumur hidup.
              </p>
            </div>
            <div className="flex md:flex-col items-center gap-3">
              <span className="inline-flex items-center gap-2 px-6 py-4 rounded-full bg-white text-zinc-900 font-bold text-base shadow-2xl group-hover:scale-105 group-hover:bg-[#F5C842] transition-all duration-300">
                Masuk Toko
                <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </span>
              <span className="text-xs text-white/60 hidden md:block">Mulai Rp 29.000</span>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
