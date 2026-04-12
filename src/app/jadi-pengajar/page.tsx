"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const WA = "https://wa.me/6282116859493";
const waMsg = (msg: string) => `${WA}?text=${encodeURIComponent(msg)}`;

const BENEFITS = [
  { icon: "💰", title: "Penghasilan Fleksibel", desc: "Dapatkan fee per sesi yang kompetitif. Semakin banyak mengajar, semakin besar penghasilan." },
  { icon: "🕐", title: "Atur Jadwal Sendiri", desc: "Tentukan sendiri hari dan jam mengajar sesuai availability kamu." },
  { icon: "🏠", title: "Kerja dari Mana Saja", desc: "Mengajar 100% online via Zoom — dari rumah, kafe, atau mana pun." },
  { icon: "📈", title: "Berkembang Bersama", desc: "Akses pelatihan rutin, feedback siswa, dan kesempatan mengajar berbagai level." },
  { icon: "🌍", title: "Komunitas Polyglot", desc: "Bergabung dengan komunitas pengajar bahasa dari berbagai latar belakang." },
  { icon: "📜", title: "Sertifikat Mengajar", desc: "Dapatkan sertifikat pengajar resmi dari Linguo.id untuk portofolio profesional kamu." },
];

const REQUIREMENTS = [
  { icon: "🎓", text: "Minimal mahasiswa aktif / lulusan S1 (jurusan bahasa diutamakan)" },
  { icon: "🗣️", text: "Fasih di bahasa yang ingin diajarkan (minimal B2 / setara)" },
  { icon: "💻", text: "Memiliki laptop/PC & koneksi internet stabil untuk Zoom" },
  { icon: "⏰", text: "Bisa commit minimal 5-10 jam/minggu untuk mengajar" },
  { icon: "❤️", text: "Passionate dalam mengajar dan sabar dengan siswa pemula" },
  { icon: "📱", text: "Responsif di WhatsApp untuk koordinasi jadwal & materi" },
];

const LANGS = [
  "🇬🇧 English", "🇫🇷 French", "🇪🇸 Spanish", "🇩🇪 German", "🇯🇵 Japanese",
  "🇰🇷 Korean", "🇨🇳 Mandarin", "🇸🇦 Arabic", "🇮🇹 Italian", "🇷🇺 Russian",
  "🇵🇹 Portuguese", "🇹🇷 Turkish", "🇹🇭 Thai", "🇻🇳 Vietnamese", "🇳🇱 Dutch",
  "🇸🇪 Swedish", "🇩🇰 Danish", "🇫🇮 Finnish", "🇵🇱 Polish", "🇭🇺 Hungarian",
  "🇬🇪 Georgian", "🇮🇳 Hindi", "🇧🇩 Bengali", "dan 30+ bahasa lainnya",
];

const STEPS = [
  { num: "01", title: "Isi Form Pendaftaran", desc: "Lengkapi form di bawah dengan data diri dan bahasa yang kamu kuasai" },
  { num: "02", title: "Review & Interview", desc: "Tim kami akan review profil kamu dan mengundang untuk interview singkat" },
  { num: "03", title: "Onboarding & Training", desc: "Ikuti sesi orientasi tentang metode mengajar dan sistem Linguo" },
  { num: "04", title: "Mulai Mengajar!", desc: "Set jadwal kamu dan mulai terima siswa. Fee dibayar per periode." },
];

export default function JadiPengajarPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [lang, setLang] = useState("");
  const [level, setLevel] = useState("");
  const [exp, setExp] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = () => {
    const msg = `Halo, saya ${name} dan tertarik menjadi pengajar di Linguo.\n\nEmail: ${email}\nTelp: ${phone}\nBahasa: ${lang}\nLevel: ${level}\nPengalaman: ${exp}\nCatatan: ${note}`;
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
          <a href={waMsg("Halo, saya tertarik menjadi pengajar di Linguo")} target="_blank"
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
              Bergabung Bersama Kami
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
              Jadi Pengajar Bahasa<br />di <span className="text-[#fbbf24]">Linguo.id</span>
            </h1>
            <p className="text-white/80 text-base sm:text-lg mb-8 leading-relaxed max-w-xl">
              Bagikan keahlian bahasa kamu dan dapatkan penghasilan fleksibel. Mengajar online dari mana saja, kapan saja.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#form" className="bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold px-8 py-4 rounded-full transition-all active:scale-95 text-sm">
                Daftar Sekarang
              </a>
              <a href={waMsg("Halo, saya mau tanya-tanya dulu tentang jadi pengajar di Linguo")} target="_blank"
                className="bg-white/15 hover:bg-white/25 text-white font-semibold px-8 py-4 rounded-full transition-all active:scale-95 text-sm backdrop-blur-sm border border-white/20">
                Tanya Dulu via WA
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-10 border-b border-slate-100 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { num: "55+", label: "Bahasa Diajarkan" },
            { num: "1,200+", label: "Siswa Aktif" },
            { num: "20+", label: "Pengajar" },
            { num: "4.9★", label: "Rating Rata-rata" },
          ].map((s, i) => (
            <motion.div key={i} {...fade} transition={{ delay: i * 0.1 }}>
              <p className="text-2xl sm:text-3xl font-bold text-[#1A9E9E]">{s.num}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* BENEFITS */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div {...fade} className="text-center mb-14">
            <p className="text-xs font-bold text-[#1A9E9E] uppercase tracking-widest mb-2">Kenapa Mengajar di Linguo?</p>
            <h2 className="text-2xl sm:text-3xl font-bold">Keuntungan Jadi Pengajar</h2>
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

      {/* REQUIREMENTS */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div {...fade} className="text-center mb-14">
            <p className="text-xs font-bold text-[#1A9E9E] uppercase tracking-widest mb-2">Persyaratan</p>
            <h2 className="text-2xl sm:text-3xl font-bold">Yang Kami Cari</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-4">
            {REQUIREMENTS.map((r, i) => (
              <motion.div key={i} {...fade} transition={{ delay: i * 0.08 }}
                className="flex items-start gap-4 bg-white rounded-xl p-5 border border-slate-100">
                <span className="text-2xl shrink-0">{r.icon}</span>
                <p className="text-sm text-slate-600 leading-relaxed">{r.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* LANGUAGES */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div {...fade} className="text-center mb-10">
            <p className="text-xs font-bold text-[#1A9E9E] uppercase tracking-widest mb-2">Bahasa yang Dibutuhkan</p>
            <h2 className="text-2xl sm:text-3xl font-bold">Kami Terbuka untuk 55+ Bahasa</h2>
          </motion.div>
          <motion.div {...fade} className="flex flex-wrap justify-center gap-2">
            {LANGS.map((l, i) => (
              <span key={i} className="text-sm bg-slate-50 border border-slate-200 px-4 py-2 rounded-full hover:border-[#1A9E9E]/40 hover:bg-[#1A9E9E]/5 transition-all">
                {l}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div {...fade} className="text-center mb-14">
            <p className="text-xs font-bold text-[#1A9E9E] uppercase tracking-widest mb-2">Prosesnya Mudah</p>
            <h2 className="text-2xl sm:text-3xl font-bold">Cara Bergabung</h2>
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
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Daftar Jadi Pengajar</h2>
            <p className="text-white/70 text-sm">Isi form di bawah, tim kami akan menghubungi kamu untuk proses selanjutnya.</p>
          </motion.div>
          <motion.div {...fade} className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Nama Lengkap *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nama kamu"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Email *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">No. WhatsApp *</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0812-3456-7890"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Bahasa yang Dikuasai *</label>
                <input type="text" value={lang} onChange={e => setLang(e.target.value)} placeholder="Contoh: English, Korean"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Level Kemampuan</label>
                <select value={level} onChange={e => setLevel(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors bg-white">
                  <option value="">Pilih level</option>
                  {["B2 (Upper Intermediate)", "C1 (Advanced)", "C2 (Proficient)", "Native Speaker"].map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Pengalaman Mengajar</label>
                <select value={exp} onChange={e => setExp(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors bg-white">
                  <option value="">Pilih pengalaman</option>
                  {["Belum pernah (tapi mau belajar)", "< 1 tahun", "1-3 tahun", "3-5 tahun", "5+ tahun"].map(e => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mb-6">
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Ceritakan tentang diri kamu</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Latar belakang pendidikan, sertifikasi bahasa, motivasi mengajar..."
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors resize-none" />
            </div>
            <button onClick={handleSubmit}
              className="w-full bg-[#1A9E9E] hover:bg-[#178888] text-white font-bold py-4 rounded-full transition-all active:scale-[0.98] text-sm">
              Kirim Pendaftaran via WhatsApp →
            </button>
            <p className="text-center text-xs text-slate-400 mt-3">Kami akan menghubungi kamu dalam 1-3 hari kerja.</p>
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
