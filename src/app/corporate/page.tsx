"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const WA = "https://wa.me/6282116859493";
const waMsg = (msg: string) => `${WA}?text=${encodeURIComponent(msg)}`;

const BENEFITS = [
  { icon: "🎯", title: "Custom Curriculum", desc: "Materi disesuaikan dengan kebutuhan industri & goals perusahaan Anda" },
  { icon: "📅", title: "Jadwal Fleksibel", desc: "Kelas bisa dijadwalkan sesuai jam kerja tim Anda — pagi, siang, atau sore" },
  { icon: "👥", title: "Group Class", desc: "Satu kelas untuk tim Anda (5-15 orang), lebih efisien & membangun team bonding" },
  { icon: "📊", title: "Progress Report", desc: "Laporan perkembangan bulanan untuk setiap peserta, langsung ke HR/PIC" },
  { icon: "📜", title: "E-Certificate", desc: "Sertifikat resmi dari Linguo.id untuk setiap peserta yang menyelesaikan program" },
  { icon: "🌍", title: "55+ Bahasa", desc: "Dari English & Mandarin hingga Korean, Japanese, German, French, dan lainnya" },
];

const PROGRAMS = [
  { title: "Business Communication", desc: "Tingkatkan kemampuan komunikasi bisnis tim Anda dalam bahasa asing — email, meeting, presentasi, dan negosiasi.", langs: ["English", "Mandarin", "Japanese", "Korean"], levels: "A1 – B2", sessions: "16–32 sesi", color: "from-teal-500 to-teal-600" },
  { title: "General Language Training", desc: "Program bahasa umum untuk karyawan — membangun fondasi komunikasi dan kepercayaan diri berbahasa asing.", langs: ["55+ bahasa tersedia"], levels: "A1 – B2", sessions: "16–32 sesi", color: "from-blue-500 to-blue-600" },
  { title: "IELTS / TOEFL Preparation", desc: "Persiapan tes bahasa Inggris untuk karyawan yang butuh sertifikasi — IELTS, TOEFL, atau tes internal perusahaan.", langs: ["English"], levels: "Intermediate+", sessions: "16 sesi @90 menit", color: "from-amber-500 to-amber-600" },
  { title: "Custom Program", desc: "Butuh sesuatu yang berbeda? Kami bisa rancang program khusus sesuai kebutuhan perusahaan Anda.", langs: ["Semua bahasa"], levels: "Custom", sessions: "Flexible", color: "from-purple-500 to-purple-600" },
];

const CLIENTS = [
  { name: "AIESEC", img: "/images/clients/aiesec.png" },
  { name: "BINUS University", img: "/images/clients/binus.png" },
  { name: "Gojek", img: "/images/clients/gojek.png" },
  { name: "KAI", img: "/images/clients/kai.png" },
  { name: "Mondelez", img: "/images/clients/mondelez.png" },
  { name: "Orica", img: "/images/clients/orica.png" },
  { name: "Prasetiya Mulya", img: "/images/clients/prasetiya-mulya.png" },
  { name: "Vaksindo", img: "/images/clients/vaksindo.png" },
  { name: "POLBAN", img: "/images/clients/polban.png" },
  { name: "Bitget", img: "/images/clients/bitget.png" },
  { name: "CIMSA", img: "/images/clients/cimsa.png" },
];

const STEPS = [
  { num: "01", title: "Konsultasi Gratis", desc: "Hubungi kami untuk diskusi kebutuhan bahasa tim Anda" },
  { num: "02", title: "Custom Proposal", desc: "Kami buatkan proposal program, jadwal, dan harga khusus" },
  { num: "03", title: "Kick-off Class", desc: "Setelah deal, kelas dimulai sesuai jadwal yang disepakati" },
  { num: "04", title: "Progress & Report", desc: "Terima laporan bulanan dan evaluasi dari tim pengajar" },
];

export default function CorporatePage() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [lang, setLang] = useState("");
  const [size, setSize] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = () => {
    const msg = `Halo, saya ${name} dari ${company}.\n\nSaya tertarik dengan Corporate Language Training dari Linguo.\n\nEmail: ${email}\nTelp: ${phone}\nBahasa: ${lang}\nJumlah peserta: ${size}\nCatatan: ${note}`;
    window.open(waMsg(msg), "_blank");
  };

  const fade = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "Poppins, sans-serif" }}>
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-800 hover:text-teal-600 transition-colors">
            <img src="/images/logo-white.png" alt="Linguo" className="h-8 brightness-0" />
          </Link>
          <a href={waMsg("Halo, saya tertarik Corporate Class Linguo")} target="_blank"
            className="bg-[#1A9E9E] hover:bg-[#178888] text-white font-semibold px-5 py-2.5 rounded-full text-sm transition-all active:scale-95">
            Hubungi Kami
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d4f4f] via-[#1A9E9E] to-[#24b8b8]" />
        <div className="relative max-w-6xl mx-auto px-4 py-20 sm:py-28 lg:py-36">
          <motion.div {...fade} className="max-w-2xl">
            <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-4 py-1.5 rounded-full mb-6 tracking-wider uppercase">
              Corporate Language Training
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
              Tingkatkan Skill Bahasa<br />Tim Anda Bersama <span className="text-[#fbbf24]">Linguo</span>
            </h1>
            <p className="text-white/80 text-base sm:text-lg mb-8 leading-relaxed max-w-xl">
              Program pelatihan bahasa asing yang dirancang khusus untuk kebutuhan perusahaan Anda. Fleksibel, terstruktur, dan terukur.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#form" className="bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold px-8 py-4 rounded-full transition-all active:scale-95 text-sm">
                Minta Proposal Gratis
              </a>
              <a href={waMsg("Halo, saya mau konsultasi tentang Corporate Class Linguo")} target="_blank"
                className="bg-white/15 hover:bg-white/25 text-white font-semibold px-8 py-4 rounded-full transition-all active:scale-95 text-sm backdrop-blur-sm border border-white/20">
                Chat via WhatsApp
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CLIENTS */}
      <section className="py-10 border-b border-slate-100 bg-slate-50">
        <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6">Dipercaya oleh perusahaan & institusi terkemuka</p>
        <div className="flex items-center justify-center flex-wrap gap-8 sm:gap-12 px-6 max-w-5xl mx-auto">
          {CLIENTS.map((c, i) => (
            <motion.img key={i} src={c.img} alt={c.name} className="h-8 sm:h-10 object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all"
              {...fade} transition={{ delay: i * 0.05 }} />
          ))}
        </div>
      </section>

      {/* BENEFITS */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div {...fade} className="text-center mb-14">
            <p className="text-xs font-bold text-[#1A9E9E] uppercase tracking-widest mb-2">Mengapa Linguo?</p>
            <h2 className="text-2xl sm:text-3xl font-bold">Keuntungan Corporate Training di Linguo</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map((b, i) => (
              <motion.div key={i} {...fade} transition={{ delay: i * 0.08 }}
                className="bg-white border-2 border-slate-100 rounded-2xl p-6 hover:border-[#1A9E9E]/30 hover:shadow-lg transition-all group">
                <span className="text-3xl mb-3 block">{b.icon}</span>
                <h3 className="font-bold text-base mb-2 group-hover:text-[#1A9E9E] transition-colors">{b.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PROGRAMS */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div {...fade} className="text-center mb-14">
            <p className="text-xs font-bold text-[#1A9E9E] uppercase tracking-widest mb-2">Program Kami</p>
            <h2 className="text-2xl sm:text-3xl font-bold">Pilih Program yang Sesuai</h2>
            <p className="text-slate-500 mt-3 max-w-lg mx-auto text-sm">Semua program bisa di-custom sesuai kebutuhan. Harga khusus untuk corporate.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-5">
            {PROGRAMS.map((p, i) => (
              <motion.div key={i} {...fade} transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden hover:shadow-lg hover:border-[#1A9E9E]/20 transition-all">
                <div className={`bg-gradient-to-r ${p.color} px-6 py-4`}>
                  <h3 className="font-bold text-white text-lg">{p.title}</h3>
                </div>
                <div className="p-6">
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">{p.desc}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {p.langs.map((l, li) => (
                      <span key={li} className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full">{l}</span>
                    ))}
                  </div>
                  <div className="flex gap-4 text-xs text-slate-400">
                    <span>📚 {p.levels}</span>
                    <span>🕐 {p.sessions}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <motion.div {...fade} className="text-center mt-10">
            <p className="text-slate-500 text-sm mb-4">Harga corporate mulai dari <span className="font-bold text-[#1A9E9E] text-lg">Rp 75.000</span>/sesi/orang</p>
            <p className="text-xs text-slate-400">*Harga final tergantung jumlah peserta, durasi program, dan bahasa yang dipilih</p>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div {...fade} className="text-center mb-14">
            <p className="text-xs font-bold text-[#1A9E9E] uppercase tracking-widest mb-2">Prosesnya Mudah</p>
            <h2 className="text-2xl sm:text-3xl font-bold">Cara Memulai</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <motion.div key={i} {...fade} transition={{ delay: i * 0.12 }} className="text-center">
                <div className="w-14 h-14 bg-[#1A9E9E]/10 text-[#1A9E9E] font-bold text-lg rounded-2xl flex items-center justify-center mx-auto mb-4">{s.num}</div>
                <h3 className="font-bold text-sm mb-2">{s.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FORM */}
      <section id="form" className="py-16 sm:py-24 bg-gradient-to-br from-[#0d4f4f] via-[#1A9E9E] to-[#24b8b8] relative overflow-hidden">
        <div className="relative max-w-2xl mx-auto px-4">
          <motion.div {...fade} className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Minta Proposal Gratis</h2>
            <p className="text-white/70 text-sm">Isi form di bawah, tim kami akan menghubungi Anda dalam 1x24 jam kerja.</p>
          </motion.div>
          <motion.div {...fade} className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Nama Lengkap *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Perusahaan *</label>
                <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="PT. Example"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Email *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@company.com"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">No. Telepon *</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0812-3456-7890"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Bahasa yang Diinginkan</label>
                <select value={lang} onChange={e => setLang(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors bg-white">
                  <option value="">Pilih bahasa</option>
                  {["English", "Mandarin", "Japanese", "Korean", "German", "French", "Spanish", "Arabic", "Lainnya"].map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Jumlah Peserta</label>
                <select value={size} onChange={e => setSize(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors bg-white">
                  <option value="">Pilih jumlah</option>
                  {["5-10 orang", "11-20 orang", "21-50 orang", "50+ orang"].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mb-6">
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Catatan Tambahan</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Jelaskan kebutuhan spesifik tim Anda..."
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors resize-none" />
            </div>
            <button onClick={handleSubmit}
              className="w-full bg-[#1A9E9E] hover:bg-[#178888] text-white font-bold py-4 rounded-full transition-all active:scale-[0.98] text-sm">
              Kirim via WhatsApp →
            </button>
            <p className="text-center text-xs text-slate-400 mt-3">Data Anda aman dan tidak akan disebarkan ke pihak lain.</p>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#14726E] text-white py-10">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Link href="/" className="inline-block mb-4">
            <img src="/images/logo-white.png" alt="Linguo" className="h-10 mx-auto" />
          </Link>
          <p className="text-white/60 text-sm mb-2">PT. Linguo Edu Indonesia</p>
          <p className="text-white/40 text-xs">Happy Creative Hub, Jl. Cisitu Indah III No.2, Dago, Coblong, Bandung 40135</p>
          <div className="border-t border-white/20 mt-6 pt-6 text-xs text-white/40">© {new Date().getFullYear()} Linguo.id</div>
        </div>
      </footer>
    </div>
  );
}
