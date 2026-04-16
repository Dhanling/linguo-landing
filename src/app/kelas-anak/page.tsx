"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const WA = "https://wa.me/6282116859493";
const waMsg = (msg: string) => `${WA}?text=${encodeURIComponent(msg)}`;

const TIERS = [
  {
    emoji: "🐣",
    name: "Little Learner",
    age: "5–8 tahun",
    duration: "30 menit/sesi",
    price: "Rp 75.000",
    pricePer: "/sesi",
    color: "from-pink-400 to-rose-500",
    bg: "bg-pink-50",
    border: "border-pink-200",
    text: "text-pink-700",
    badge: "bg-pink-100 text-pink-700",
    desc: "Program khusus untuk anak usia dini yang baru mulai belajar bahasa asing. Materi dikemas dengan lagu, permainan, dan aktivitas interaktif.",
    features: [
      "Vocabulary dasar melalui flashcards & games",
      "Lagu dan rhymes dalam bahasa target",
      "Aktivitas mewarnai & storytelling",
      "Review mingguan dengan orang tua",
    ],
    wa: "Halo, saya tertarik Kelas Kids Little Learner (5-8 thn) di Linguo untuk anak saya.",
  },
  {
    emoji: "🚀",
    name: "Young Explorer",
    age: "9–12 tahun",
    duration: "45 menit/sesi",
    price: "Rp 85.000",
    pricePer: "/sesi",
    color: "from-blue-400 to-indigo-500",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-700",
    desc: "Program untuk anak yang siap belajar lebih serius. Fokus pada percakapan, grammar dasar, dan membangun kepercayaan diri.",
    features: [
      "Percakapan & roleplay sehari-hari",
      "Grammar dasar yang fun",
      "Reading & mini presentasi",
      "Progress report bulanan untuk orang tua",
    ],
    wa: "Halo, saya tertarik Kelas Kids Young Explorer (9-12 thn) di Linguo untuk anak saya.",
  },
];

const BENEFITS = [
  { icon: "🌍", title: "55+ Bahasa", desc: "Bukan cuma English! Anak bisa belajar Japanese, Korean, Mandarin, French, dan 50+ bahasa lainnya." },
  { icon: "👩‍🏫", title: "1-on-1 Private", desc: "Guru fokus 100% pada anak Anda. Bukan kelas grup — perhatian penuh setiap sesi." },
  { icon: "🎮", title: "Fun & Gamified", desc: "Materi dikemas dengan games, lagu, flashcards, dan aktivitas interaktif — anak belajar tanpa merasa belajar." },
  { icon: "📅", title: "Jadwal Fleksibel", desc: "Pilih jadwal yang cocok untuk anak. Bisa request hari & jam sesuai aktivitas sekolah." },
  { icon: "📊", title: "Progress Report", desc: "Orang tua mendapat laporan perkembangan anak secara berkala. Pantau progres dari mana saja." },
  { icon: "🏆", title: "E-Certificate", desc: "Setiap anak yang menyelesaikan program mendapat sertifikat digital resmi dari Linguo.id." },
];

const STEPS = [
  { num: "01", title: "Pilih Bahasa & Tier", desc: "Pilih bahasa yang ingin dipelajari anak dan sesuaikan tier dengan usia mereka." },
  { num: "02", title: "Coba Kelas Pertama", desc: "Daftarkan anak untuk sesi pertama. Guru akan menyesuaikan materi dengan kemampuan anak." },
  { num: "03", title: "Belajar Rutin", desc: "Jadwalkan kelas secara rutin — 2-3x seminggu untuk hasil optimal." },
  { num: "04", title: "Pantau Progress", desc: "Terima laporan dari guru dan lihat perkembangan anak di student dashboard." },
];

const LANGUAGES = [
  { name: "English", flag: "gb" },
  { name: "Japanese", flag: "jp" },
  { name: "Korean", flag: "kr" },
  { name: "Mandarin", flag: "cn" },
  { name: "French", flag: "fr" },
  { name: "German", flag: "de" },
  { name: "Spanish", flag: "es" },
  { name: "Arabic", flag: "sa" },
];

const FAQ = [
  { q: "Anak saya belum pernah belajar bahasa asing, bisa ikut?", a: "Tentu! Program Little Learner dirancang untuk pemula total. Guru akan mulai dari dasar dengan metode yang menyenangkan." },
  { q: "Kelasnya online atau offline?", a: "Semua kelas dilakukan online via Zoom, jadi anak bisa belajar dari rumah dengan nyaman." },
  { q: "Apakah orang tua perlu mendampingi?", a: "Untuk usia 5-6 tahun, kami sarankan orang tua mendampingi di beberapa sesi awal. Setelah anak terbiasa, biasanya mereka bisa mandiri." },
  { q: "Berapa kali seminggu sebaiknya belajar?", a: "Kami rekomendasikan 2-3x seminggu untuk hasil optimal. Tapi jadwal fleksibel — bisa disesuaikan dengan aktivitas anak." },
  { q: "Bagaimana jika anak tidak cocok dengan gurunya?", a: "Kami bisa mengganti guru kapan saja tanpa biaya tambahan. Kenyamanan anak adalah prioritas kami." },
  { q: "Apakah ada paket hemat?", a: "Ya! Paket 12 sesi mendapat diskon 10%, dan paket 24 sesi diskon 17%. Hubungi kami untuk info lengkap." },
];

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

export default function KelasAnakPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar simple */}
      <nav className="bg-[#1A9E9E] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src="/images/logo-white.png" alt="Linguo" className="h-8 sm:h-12 object-contain" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-white/80 hover:text-white text-sm font-medium hidden sm:block">← Beranda</Link>
            <a href={waMsg("Halo, saya tertarik Kelas Kids Linguo untuk anak saya.")}
              target="_blank" rel="noopener"
              className="bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold px-5 py-2.5 rounded-full text-sm transition-all active:scale-95">
              Daftar Sekarang
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1A9E9E] via-[#168f8f] to-[#0d7a7a] text-white py-20 sm:py-28">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-[#fbbf24]/10 rounded-full blur-3xl" />
          {["🌍","🎮","📚","⭐","🎵","✏️","🧩","🎨"].map((e, i) => (
            <motion.span key={i}
              className="absolute text-2xl sm:text-3xl opacity-20 select-none"
              style={{ left: `${10 + (i * 12) % 85}%`, top: `${15 + (i * 17) % 70}%` }}
              animate={{ y: [0, -15, 0], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}>
              {e}
            </motion.span>
          ))}
        </div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block bg-white/15 backdrop-blur-sm text-sm font-semibold px-5 py-2 rounded-full mb-6 border border-white/20">
              🧒 Kelas Bahasa untuk Anak 5–12 Tahun
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight mb-5">
              Belajar Bahasa Asing
              <br />
              <span className="text-[#fbbf24]">Sejak Dini, Jadi Luar Biasa!</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/85 max-w-2xl mx-auto mb-8 leading-relaxed">
              Kelas private 1-on-1 via Zoom dengan guru berpengalaman.
              <br className="hidden sm:block" />
              55+ bahasa tersedia — bukan cuma English!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href={waMsg("Halo, saya tertarik Kelas Kids Linguo untuk anak saya. Boleh info lebih lanjut?")}
                target="_blank" rel="noopener"
                className="bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold px-8 py-4 rounded-full text-base transition-all active:scale-95 shadow-lg shadow-[#fbbf24]/25">
                Daftar Kelas Kids →
              </a>
              <a href="#tiers"
                onClick={(e) => { e.preventDefault(); document.getElementById("tiers")?.scrollIntoView({ behavior: "smooth" }); }}
                className="border-2 border-white/40 hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-full text-base transition-all">
                Lihat Program
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Language showcase */}
      <section className="py-10 bg-slate-50 border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-sm text-slate-500 font-medium mb-5">Tersedia untuk 55+ bahasa, termasuk:</p>
          <div className="flex flex-wrap justify-center gap-3">
            {LANGUAGES.map((l) => (
              <div key={l.name} className="flex items-center gap-2 bg-white rounded-full px-4 py-2 border border-slate-200 text-sm font-medium text-slate-700">
                <img src={`https://flagcdn.com/w40/${l.flag}.png`} alt="" className="h-5 w-5 rounded-full object-cover" />
                {l.name}
              </div>
            ))}
            <div className="flex items-center gap-2 bg-[#1A9E9E]/10 rounded-full px-4 py-2 border border-[#1A9E9E]/20 text-sm font-semibold text-[#1A9E9E]">
              +47 bahasa lainnya
            </div>
          </div>
        </div>
      </section>

      {/* Tier cards */}
      <section id="tiers" className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
            <p className="text-xs font-bold text-[#1A9E9E] uppercase tracking-widest mb-2">PILIH PROGRAM</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">Dua program, disesuaikan usia anak</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Setiap tier dirancang khusus sesuai kemampuan kognitif dan attention span anak.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {TIERS.map((t, i) => (
              <motion.div key={t.name} initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.15 } } }}
                className={`rounded-3xl border-2 ${t.border} overflow-hidden hover:shadow-xl transition-all duration-300`}>
                <div className={`bg-gradient-to-r ${t.color} p-6 text-white`}>
                  <span className="text-4xl mb-3 block">{t.emoji}</span>
                  <h3 className="text-2xl font-bold">{t.name}</h3>
                  <p className="text-white/80 text-sm mt-1">{t.age} • {t.duration}</p>
                </div>
                <div className="p-6">
                  <p className="text-sm text-slate-600 leading-relaxed mb-5">{t.desc}</p>
                  <ul className="space-y-2.5 mb-6">
                    {t.features.map((f, fi) => (
                      <li key={fi} className="flex items-start gap-2.5 text-sm text-slate-600">
                        <span className="text-[#1A9E9E] mt-0.5 shrink-0">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-slate-100 pt-5">
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-3xl font-bold text-[#1A9E9E]">{t.price}</span>
                      <span className="text-slate-400 text-sm">{t.pricePer}</span>
                    </div>
                    <a href={waMsg(t.wa)} target="_blank" rel="noopener"
                      className="block w-full bg-[#1A9E9E] hover:bg-[#178888] text-white text-center font-bold py-3.5 rounded-full transition-all active:scale-95">
                      Daftar {t.name}
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-sm text-slate-400 mt-8">
            💡 Beli paket hemat: 12 sesi (diskon 10%) atau 24 sesi (diskon 17%).{" "}
            <a href={waMsg("Halo, saya mau tanya paket hemat Kelas Kids Linguo.")} target="_blank" rel="noopener" className="text-[#1A9E9E] hover:underline font-medium">Tanya kami →</a>
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
            <p className="text-xs font-bold text-[#1A9E9E] uppercase tracking-widest mb-2">KEUNGGULAN</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">Kenapa orang tua memilih Linguo?</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((b, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.08 } } }}
                className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-[#1A9E9E]/30 hover:shadow-md transition-all">
                <span className="text-3xl mb-3 block">{b.icon}</span>
                <h3 className="font-bold text-slate-900 mb-2">{b.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
            <p className="text-xs font-bold text-[#1A9E9E] uppercase tracking-widest mb-2">CARA KERJA</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">Mudah banget mulainya!</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.1 } } }}
                className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#1A9E9E]/10 flex items-center justify-center text-[#1A9E9E] font-bold text-lg mx-auto mb-4">
                  {s.num}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison with adult */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">Kelas Kids vs Silabus (Dewasa)</h2>
      {/* Comparison with adult */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">Kelas Kids vs Kelas Private (Dewasa)</h2>
            <p className="text-slate-500 text-sm">Lihat perbedaannya</p>
          </motion.div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {[
              ["", "Kelas Kids", "Private (Dewasa)"],
              ["Usia", "5–12 tahun", "13+ / Dewasa"],
              ["Durasi", "30–45 menit", "60 menit"],
              ["Harga", "Rp 75.000–85.000", "Rp 90.000"],
              ["Metode", "Games, lagu, interaktif", "Konversasi, textbook"],
              ["Format", "1-on-1 via Zoom", "1-on-1 via Zoom"],
              ["Bahasa", "55+ bahasa", "55+ bahasa"],
              ["Report", "Untuk orang tua", "Untuk siswa"],
            ].map((row, i) => (
              <div key={i} className={`grid grid-cols-3 text-sm ${i === 0 ? "bg-[#1A9E9E] text-white font-bold" : i % 2 === 1 ? "bg-white" : "bg-slate-50"}`}>
                {row.map((cell, ci) => (
                  <div key={ci} className={`px-4 py-3 ${ci === 0 ? "font-medium" : ""} ${i > 0 && ci === 0 ? "text-slate-600" : ""}`}>
                    {cell}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-2xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
            <p className="text-xs font-bold text-[#1A9E9E] uppercase tracking-widest mb-2">FAQ</p>
            <h2 className="text-3xl font-bold text-slate-900">Pertanyaan yang sering ditanya</h2>
          </motion.div>
          <div className="space-y-3">
            {FAQ.map((f, i) => (
              <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                  <span className="font-medium text-sm text-slate-800">{f.q}</span>
                  <span className={`text-[#1A9E9E] text-lg shrink-0 transition-transform ${openFaq === i ? "rotate-45" : ""}`}>+</span>
                </button>
                {openFaq === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} transition={{ duration: 0.2 }}
                    className="px-5 pb-4">
                    <p className="text-sm text-slate-500 leading-relaxed">{f.a}</p>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-[#1A9E9E] to-[#168f8f] text-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Siap mulai petualangan bahasa anak Anda?</h2>
          <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
            Daftarkan anak Anda sekarang dan lihat betapa serunya belajar bahasa asing sejak dini!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={waMsg("Halo, saya mau daftarkan anak saya di Kelas Kids Linguo. Boleh info lebih lanjut?")}
              target="_blank" rel="noopener"
              className="bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold px-8 py-4 rounded-full text-base transition-all active:scale-95 shadow-lg shadow-black/10">
              Chat via WhatsApp →
            </a>
            <Link href="/"
              className="border-2 border-white/40 hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-full text-base transition-all text-center">
              Daftar Online
            </Link>
          </div>
          <p className="text-white/60 text-sm mt-6">Atau hubungi kami di 0821-1685-9493</p>
        </div>
      </section>

      {/* Footer mini */}
      <footer className="py-8 bg-slate-900 text-center">
        <Link href="/">
          <img src="/images/logo-white.png" alt="Linguo" className="h-8 mx-auto mb-3 opacity-60" />
        </Link>
        <p className="text-slate-500 text-xs">© {new Date().getFullYear()} Linguo.id — All rights reserved.</p>
      </footer>
    </div>
  );
}
