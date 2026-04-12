"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const WA = "https://wa.me/6282116859493";
const waMsg = (msg: string) => `${WA}?text=${encodeURIComponent(msg)}`;

const BENEFITS = [
  { icon: "💰", title: "Penghasilan Fleksibel", desc: "Fee per sesi yang kompetitif — semakin banyak mengajar, semakin besar penghasilan" },
  { icon: "🕐", title: "Atur Jadwal Sendiri", desc: "Tentukan hari dan jam mengajar sesuai availability kamu" },
  { icon: "🏠", title: "Kerja dari Mana Saja", desc: "100% online via Zoom — dari rumah, kafe, atau mana pun" },
  { icon: "📈", title: "Berkembang Bersama", desc: "Pelatihan rutin, feedback siswa, dan kesempatan mengajar berbagai level" },
  { icon: "🌍", title: "Komunitas Polyglot", desc: "Bergabung dengan komunitas pengajar bahasa dari berbagai latar belakang" },
  { icon: "📜", title: "Sertifikat Mengajar", desc: "Dapatkan sertifikat pengajar resmi dari Linguo.id" },
];

const TEACHERS_TESTIMONIALS = [
  { name: "Febri Darusman", role: "Spanish & Thai Teacher", img: "/images/teachers/teacher-febri.png", quote: "Mengajar di Linguo memberi saya fleksibilitas waktu dan penghasilan tambahan yang stabil. Sistem-nya terstruktur dan mudah diikuti.", sessions: "850 sesi" },
  { name: "Nitalia Wijaya", role: "Korean & English Teacher", img: "/images/teachers/teacher-nitalia.png", quote: "Saya bisa mengajar dari rumah sambil mengurus keluarga. Siswa-siswanya antusias dan bikin semangat mengajar!", sessions: "1,200 sesi" },
  { name: "Angga", role: "Chinese & Korean Teacher", img: "/images/teachers/teacher-angga.png", quote: "Platform yang profesional dan supportive. Tim Linguo selalu bantu kalau ada kendala. Recommended!", sessions: "680 sesi" },
];

const LANG_OPTIONS = [
  "English", "French", "Spanish", "German", "Japanese", "Korean", "Mandarin", "Arabic",
  "Italian", "Russian", "Portuguese", "Turkish", "Thai", "Vietnamese", "Dutch",
  "Swedish", "Danish", "Finnish", "Polish", "Hungarian", "Georgian", "Hindi", "Bengali", "Lainnya",
];

const STEPS = [
  { num: 1, title: "Data Diri", desc: "Info kontak kamu" },
  { num: 2, title: "Bahasa & Kualifikasi", desc: "Keahlian bahasa" },
  { num: 3, title: "Pengalaman", desc: "Latar belakang" },
  { num: 4, title: "Review & Kirim", desc: "Periksa data" },
];

export default function JadiPengajarPage() {
  const [step, setStep] = useState(0); // 0 = landing, 1-4 = wizard steps
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Step 1: Data Diri
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  // Step 2: Bahasa & Kualifikasi
  const [langs, setLangs] = useState<string[]>([]);
  const [level, setLevel] = useState("");
  const [tier, setTier] = useState("");
  const [certInfo, setCertInfo] = useState("");

  // Step 3: Pengalaman
  const [exp, setExp] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [motivation, setMotivation] = useState("");

  const toggleLang = (l: string) => {
    setLangs(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]);
  };

  const canNext = (s: number) => {
    if (s === 1) return name.trim() && email.trim() && phone.trim();
    if (s === 2) return langs.length > 0 && level && tier;
    if (s === 3) return exp;
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    const payload = {
      name, email, phone,
      languages: langs.join(", "),
      level, experience: exp,
      note: [
        city && `Kota: ${city}`,
        tier && `Tier: ${tier}`,
        certInfo && `Sertifikat: ${certInfo}`,
        videoLink && `Video: ${videoLink}`,
        motivation && `Motivasi: ${motivation}`,
      ].filter(Boolean).join("\n"),
    };

    try {
      await fetch("/api/teacher-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (e) { console.error(e); }

    setLoading(false);
    setSuccess(true);

    const msg = `Halo, saya ${name} dan tertarik menjadi pengajar di Linguo.\n\nEmail: ${email}\nTelp: ${phone}\nKota: ${city}\nBahasa: ${langs.join(", ")}\nLevel: ${level}\nTier: ${tier}\nPengalaman: ${exp}\nVideo: ${videoLink}\nMotivasi: ${motivation}`;
    setTimeout(() => window.open(waMsg(msg), "_blank"), 1000);
  };

  const fade = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };
  const slideIn = { initial: { opacity: 0, x: 30 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -30 }, transition: { duration: 0.3 } };

  // ====== LANDING VIEW (step === 0) ======
  if (step === 0) {
    return (
      <div className="min-h-screen bg-white" style={{ fontFamily: "Poppins, sans-serif" }}>
        {/* HEADER */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center"><img src="/images/logo-white.png" alt="Linguo" className="h-8 brightness-0" /></Link>
            <a href={waMsg("Halo, saya tertarik menjadi pengajar di Linguo")} target="_blank" className="bg-[#1A9E9E] hover:bg-[#178888] text-white font-semibold px-5 py-2.5 rounded-full text-sm transition-all active:scale-95">Hubungi Kami</a>
          </div>
        </header>

        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0d4f4f] via-[#1A9E9E] to-[#24b8b8]" />
          <div className="relative max-w-6xl mx-auto px-4 py-20 sm:py-28 lg:py-36">
            <motion.div {...fade} className="max-w-2xl">
              <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-4 py-1.5 rounded-full mb-6 tracking-wider uppercase">Bergabung Bersama Kami</span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
                Jadi Pengajar Bahasa<br />di <span className="text-[#fbbf24]">Linguo.id</span>
              </h1>
              <p className="text-white/80 text-base sm:text-lg mb-8 leading-relaxed max-w-xl">Bagikan keahlian bahasa kamu dan dapatkan penghasilan fleksibel. Mengajar online dari mana saja, kapan saja.</p>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => setStep(1)} className="bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold px-8 py-4 rounded-full transition-all active:scale-95 text-sm">Daftar Sekarang →</button>
                <a href={waMsg("Halo, saya mau tanya dulu tentang jadi pengajar di Linguo")} target="_blank" className="bg-white/15 hover:bg-white/25 text-white font-semibold px-8 py-4 rounded-full transition-all active:scale-95 text-sm backdrop-blur-sm border border-white/20">Tanya Dulu via WA</a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* STATS */}
        <section className="py-10 border-b border-slate-100 bg-slate-50">
          <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[{ num: "55+", label: "Bahasa" }, { num: "1,200+", label: "Siswa Aktif" }, { num: "20+", label: "Pengajar" }, { num: "Rp 60K", label: "Fee/Sesi" }].map((s, i) => (
              <motion.div key={i} {...fade} transition={{ delay: i * 0.1 }}>
                <p className="text-2xl sm:text-3xl font-bold text-[#1A9E9E]">{s.num}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* EARNING SIMULATOR */}
        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <motion.div {...fade} className="text-center mb-10">
              <p className="text-xs font-bold text-[#1A9E9E] uppercase tracking-widest mb-2">Simulasi Penghasilan</p>
              <h2 className="text-2xl sm:text-3xl font-bold">Berapa yang Bisa Kamu Dapatkan?</h2>
            </motion.div>
            <motion.div {...fade} className="grid sm:grid-cols-3 gap-4">
              {[
                { sesi: "5 sesi/minggu", monthly: "Rp 1.200.000", label: "Part-time ringan", color: "border-blue-200 bg-blue-50" },
                { sesi: "10 sesi/minggu", monthly: "Rp 2.400.000", label: "Part-time aktif", color: "border-[#1A9E9E]/30 bg-[#1A9E9E]/5 ring-2 ring-[#1A9E9E]/20" },
                { sesi: "20 sesi/minggu", monthly: "Rp 4.800.000", label: "Full-time", color: "border-amber-200 bg-amber-50" },
              ].map((e, i) => (
                <div key={i} className={`rounded-2xl border-2 p-6 text-center ${e.color} transition-all`}>
                  <p className="text-sm text-slate-500 mb-1">{e.sesi}</p>
                  <p className="text-2xl font-bold text-slate-800 mb-1">{e.monthly}</p>
                  <p className="text-xs text-slate-400">/bulan • {e.label}</p>
                </div>
              ))}
            </motion.div>
            <p className="text-center text-xs text-slate-400 mt-4">*Berdasarkan fee Rp 60.000/sesi, 4 minggu/bulan</p>
          </div>
        </section>

        {/* BENEFITS */}
        <section className="py-16 sm:py-24 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4">
            <motion.div {...fade} className="text-center mb-14">
              <p className="text-xs font-bold text-[#1A9E9E] uppercase tracking-widest mb-2">Kenapa Mengajar di Linguo?</p>
              <h2 className="text-2xl sm:text-3xl font-bold">Keuntungan Jadi Pengajar</h2>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {BENEFITS.map((b, i) => (
                <motion.div key={i} {...fade} transition={{ delay: i * 0.08 }} className="bg-white border-2 border-slate-100 rounded-2xl p-6 hover:border-[#1A9E9E]/30 hover:shadow-lg transition-all group">
                  <span className="text-3xl mb-3 block">{b.icon}</span>
                  <h3 className="font-bold text-base mb-2 group-hover:text-[#1A9E9E] transition-colors">{b.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{b.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* TWO TIERS */}
        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <motion.div {...fade} className="text-center mb-14">
              <p className="text-xs font-bold text-[#1A9E9E] uppercase tracking-widest mb-2">Dua Jalur Mengajar</p>
              <h2 className="text-2xl sm:text-3xl font-bold">Pilih Sesuai Kualifikasi Kamu</h2>
            </motion.div>
            <div className="grid sm:grid-cols-2 gap-5">
              <motion.div {...fade} className="border-2 border-slate-100 rounded-2xl p-6 hover:border-[#1A9E9E]/30 hover:shadow-lg transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <span className="h-10 w-10 bg-[#1A9E9E]/10 rounded-xl flex items-center justify-center text-xl">🎓</span>
                  <div><h3 className="font-bold">Pengajar Profesional</h3><p className="text-xs text-slate-400">Professional Teacher</p></div>
                </div>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2"><span className="text-[#1A9E9E] mt-0.5">✓</span>S1 Bahasa/Sastra/Pendidikan</li>
                  <li className="flex items-start gap-2"><span className="text-[#1A9E9E] mt-0.5">✓</span>Sertifikat bahasa (JLPT, TOPIK, DELF, IELTS, dll)</li>
                  <li className="flex items-start gap-2"><span className="text-[#1A9E9E] mt-0.5">✓</span>Pengalaman mengajar 1+ tahun</li>
                  <li className="flex items-start gap-2"><span className="text-[#1A9E9E] mt-0.5">✓</span>Bisa mengajar semua level (A1–B2)</li>
                </ul>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <span className="text-xs bg-[#1A9E9E]/10 text-[#1A9E9E] font-semibold px-3 py-1 rounded-full">Fee lebih tinggi • Badge Profesional</span>
                </div>
              </motion.div>
              <motion.div {...fade} transition={{ delay: 0.1 }} className="border-2 border-slate-100 rounded-2xl p-6 hover:border-blue-300 hover:shadow-lg transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <span className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl">🗣️</span>
                  <div><h3 className="font-bold">Pengajar Komunitas</h3><p className="text-xs text-slate-400">Community Tutor</p></div>
                </div>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">✓</span>Fasih di bahasa target (minimal B2)</li>
                  <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">✓</span>Mahasiswa aktif / lulusan S1 (semua jurusan)</li>
                  <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">✓</span>Passionate & sabar mengajar</li>
                  <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">✓</span>Bisa upgrade ke Profesional nanti</li>
                </ul>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-3 py-1 rounded-full">Cocok untuk pemula • Bisa upgrade</span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* TEACHER TESTIMONIALS */}
        <section className="py-16 sm:py-24 bg-slate-50">
          <div className="max-w-4xl mx-auto px-4">
            <motion.div {...fade} className="text-center mb-14">
              <p className="text-xs font-bold text-[#1A9E9E] uppercase tracking-widest mb-2">Cerita Pengajar</p>
              <h2 className="text-2xl sm:text-3xl font-bold">Apa Kata Mereka?</h2>
            </motion.div>
            <div className="grid sm:grid-cols-3 gap-5">
              {TEACHERS_TESTIMONIALS.map((t, i) => (
                <motion.div key={i} {...fade} transition={{ delay: i * 0.1 }} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <img src={t.img} alt={t.name} className="h-12 w-12 rounded-full object-cover" />
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-slate-400">{t.role}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed italic mb-3">"{t.quote}"</p>
                  <span className="text-xs bg-[#1A9E9E]/10 text-[#1A9E9E] px-2.5 py-1 rounded-full font-medium">{t.sessions}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <motion.div {...fade} className="text-center mb-14">
              <p className="text-xs font-bold text-[#1A9E9E] uppercase tracking-widest mb-2">Prosesnya Mudah</p>
              <h2 className="text-2xl sm:text-3xl font-bold">4 Langkah Bergabung</h2>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { num: "01", title: "Isi Form Online", desc: "Lengkapi data diri, bahasa, dan pengalaman kamu" },
                { num: "02", title: "Review & Interview", desc: "Tim kami review profil dan undang interview singkat" },
                { num: "03", title: "Onboarding", desc: "Orientasi metode mengajar dan sistem Linguo" },
                { num: "04", title: "Mulai Mengajar!", desc: "Set jadwal dan mulai terima siswa" },
              ].map((s, i) => (
                <motion.div key={i} {...fade} transition={{ delay: i * 0.12 }} className="text-center">
                  <div className="w-14 h-14 bg-[#1A9E9E]/10 text-[#1A9E9E] font-bold text-lg rounded-2xl flex items-center justify-center mx-auto mb-4">{s.num}</div>
                  <h3 className="font-bold text-sm mb-2">{s.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-24 bg-gradient-to-br from-[#0d4f4f] via-[#1A9E9E] to-[#24b8b8]">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <motion.div {...fade}>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Siap Bergabung?</h2>
              <p className="text-white/70 text-sm mb-8">Proses pendaftaran hanya 5 menit. Isi form, kami review, dan kamu bisa mulai mengajar!</p>
              <button onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold px-10 py-4 rounded-full transition-all active:scale-95 text-sm">Daftar Sekarang →</button>
            </motion.div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-[#14726E] text-white py-10">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <Link href="/" className="inline-block mb-4"><img src="/images/logo-white.png" alt="Linguo" className="h-10 mx-auto" /></Link>
            <p className="text-white/60 text-sm mb-2">PT. Linguo Edu Indonesia</p>
            <p className="text-white/40 text-xs">Happy Creative Hub, Jl. Cisitu Indah III No.2, Dago, Coblong, Bandung 40135</p>
            <div className="border-t border-white/20 mt-6 pt-6 text-xs text-white/40">© {new Date().getFullYear()} Linguo.id</div>
          </div>
        </footer>
      </div>
    );
  }

  // ====== WIZARD VIEW (step 1-4) ======
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" style={{ fontFamily: "Poppins, sans-serif" }}>
      {/* WIZARD HEADER */}
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => step === 1 ? setStep(0) : setStep(step - 1)} className="text-sm text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1">
            ← {step === 1 ? "Kembali" : "Sebelumnya"}
          </button>
          <span className="text-sm font-semibold text-[#1A9E9E]">Pendaftaran Pengajar</span>
          <span className="text-xs text-slate-400">Step {step}/4</span>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <motion.div className="h-full bg-[#1A9E9E]" initial={{ width: 0 }} animate={{ width: `${(step / 4) * 100}%` }} transition={{ duration: 0.4 }} />
        </div>
      </header>

      {/* STEP INDICATORS */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between">
          {STEPS.map((s) => (
            <div key={s.num} className={`flex items-center gap-2 ${step >= s.num ? "text-[#1A9E9E]" : "text-slate-300"}`}>
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step > s.num ? "bg-[#1A9E9E] text-white" : step === s.num ? "bg-[#1A9E9E]/10 text-[#1A9E9E] ring-2 ring-[#1A9E9E]" : "bg-slate-100 text-slate-400"}`}>
                {step > s.num ? "✓" : s.num}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold">{s.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WIZARD CONTENT */}
      <div className="flex-1 py-8">
        <div className="max-w-xl mx-auto px-4">
          <AnimatePresence mode="wait">
            {/* STEP 1: Data Diri */}
            {step === 1 && (
              <motion.div key="step1" {...slideIn} className="space-y-6">
                <div><h2 className="text-xl font-bold mb-1">Data Diri</h2><p className="text-sm text-slate-500">Isi info kontak kamu untuk proses pendaftaran</p></div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Nama Lengkap *</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nama lengkap kamu"
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Email *</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com"
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">No. WhatsApp *</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0812-3456-7890"
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Kota Domisili</label>
                    <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="Contoh: Bandung"
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Bahasa & Kualifikasi */}
            {step === 2 && (
              <motion.div key="step2" {...slideIn} className="space-y-6">
                <div><h2 className="text-xl font-bold mb-1">Bahasa & Kualifikasi</h2><p className="text-sm text-slate-500">Pilih bahasa yang ingin kamu ajarkan</p></div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-2 block">Bahasa yang Dikuasai * (bisa pilih lebih dari 1)</label>
                  <div className="flex flex-wrap gap-2">
                    {LANG_OPTIONS.map(l => (
                      <button key={l} onClick={() => toggleLang(l)}
                        className={`text-sm px-3.5 py-2 rounded-full border-2 transition-all ${langs.includes(l) ? "bg-[#1A9E9E] text-white border-[#1A9E9E]" : "bg-white text-slate-600 border-slate-200 hover:border-[#1A9E9E]/40"}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-2 block">Level Kemampuan *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["B2 (Upper Intermediate)", "C1 (Advanced)", "C2 (Proficient)", "Native Speaker"].map(l => (
                      <button key={l} onClick={() => setLevel(l)}
                        className={`text-sm px-4 py-3 rounded-xl border-2 transition-all text-left ${level === l ? "bg-[#1A9E9E]/5 border-[#1A9E9E] text-[#1A9E9E] font-semibold" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-2 block">Pilih Jalur *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button onClick={() => setTier("professional")}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${tier === "professional" ? "bg-[#1A9E9E]/5 border-[#1A9E9E]" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                      <span className="text-lg mb-1 block">🎓</span>
                      <p className="font-semibold text-sm">Pengajar Profesional</p>
                      <p className="text-xs text-slate-400 mt-1">S1 Bahasa + sertifikat</p>
                    </button>
                    <button onClick={() => setTier("community")}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${tier === "community" ? "bg-blue-50 border-blue-400" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                      <span className="text-lg mb-1 block">🗣️</span>
                      <p className="font-semibold text-sm">Pengajar Komunitas</p>
                      <p className="text-xs text-slate-400 mt-1">Fasih B2+, bisa upgrade</p>
                    </button>
                  </div>
                </div>

                {tier === "professional" && (
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Sertifikat/Ijazah yang Dimiliki</label>
                    <input type="text" value={certInfo} onChange={e => setCertInfo(e.target.value)} placeholder="Contoh: S1 Sastra Jepang, JLPT N2, TOPIK Level 5"
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 3: Pengalaman */}
            {step === 3 && (
              <motion.div key="step3" {...slideIn} className="space-y-6">
                <div><h2 className="text-xl font-bold mb-1">Pengalaman</h2><p className="text-sm text-slate-500">Ceritakan pengalaman dan motivasi kamu</p></div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-2 block">Pengalaman Mengajar *</label>
                  <div className="grid grid-cols-1 gap-2">
                    {["Belum pernah (tapi mau belajar)", "< 1 tahun", "1-3 tahun", "3-5 tahun", "5+ tahun"].map(e => (
                      <button key={e} onClick={() => setExp(e)}
                        className={`text-sm px-4 py-3 rounded-xl border-2 transition-all text-left ${exp === e ? "bg-[#1A9E9E]/5 border-[#1A9E9E] text-[#1A9E9E] font-semibold" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Video Perkenalan (opsional)</label>
                  <input type="url" value={videoLink} onChange={e => setVideoLink(e.target.value)} placeholder="Link YouTube atau Google Drive (1-3 menit)"
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
                  <p className="text-xs text-slate-400 mt-1.5">Tips: Perkenalkan diri, tunjukkan gaya mengajar, dan jelaskan kenapa kamu cocok jadi pengajar</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Kenapa kamu ingin mengajar di Linguo?</label>
                  <textarea value={motivation} onChange={e => setMotivation(e.target.value)} rows={4} placeholder="Ceritakan motivasi dan latar belakang kamu..."
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors resize-none" />
                </div>
              </motion.div>
            )}

            {/* STEP 4: Review & Submit */}
            {step === 4 && !success && (
              <motion.div key="step4" {...slideIn} className="space-y-6">
                <div><h2 className="text-xl font-bold mb-1">Review & Kirim</h2><p className="text-sm text-slate-500">Periksa data kamu sebelum mengirim</p></div>
                <div className="bg-white border-2 border-slate-100 rounded-2xl divide-y divide-slate-100">
                  {[
                    { label: "Nama", value: name },
                    { label: "Email", value: email },
                    { label: "WhatsApp", value: phone },
                    { label: "Kota", value: city || "-" },
                    { label: "Bahasa", value: langs.join(", ") },
                    { label: "Level", value: level },
                    { label: "Jalur", value: tier === "professional" ? "🎓 Pengajar Profesional" : "🗣️ Pengajar Komunitas" },
                    { label: "Sertifikat", value: certInfo || "-" },
                    { label: "Pengalaman", value: exp },
                    { label: "Video", value: videoLink || "-" },
                  ].map((r, i) => (
                    <div key={i} className="flex justify-between px-5 py-3">
                      <span className="text-xs text-slate-400">{r.label}</span>
                      <span className="text-sm font-medium text-right max-w-[60%]">{r.value}</span>
                    </div>
                  ))}
                  {motivation && (
                    <div className="px-5 py-3">
                      <span className="text-xs text-slate-400 block mb-1">Motivasi</span>
                      <p className="text-sm text-slate-600">{motivation}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* SUCCESS */}
            {success && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">✓</span>
                </div>
                <h2 className="text-2xl font-bold mb-3">Pendaftaran Terkirim!</h2>
                <p className="text-slate-500 text-sm mb-8 max-w-md mx-auto">Data kamu sudah tersimpan. Tim kami akan menghubungi kamu via WhatsApp dalam 1-3 hari kerja untuk proses selanjutnya.</p>
                <Link href="/" className="inline-block bg-[#1A9E9E] hover:bg-[#178888] text-white font-semibold px-8 py-3 rounded-full text-sm transition-all">Kembali ke Beranda</Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* WIZARD FOOTER */}
      {!success && (
        <div className="bg-white border-t border-slate-100">
          <div className="max-w-xl mx-auto px-4 py-4 flex justify-between">
            <button onClick={() => step === 1 ? setStep(0) : setStep(step - 1)} className="text-sm text-slate-500 hover:text-slate-900 px-6 py-3 rounded-full transition-colors">
              ← Kembali
            </button>
            {step < 4 ? (
              <button onClick={() => setStep(step + 1)} disabled={!canNext(step)}
                className="bg-[#1A9E9E] hover:bg-[#178888] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-full text-sm transition-all active:scale-95">
                Lanjut →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading}
                className="bg-[#1A9E9E] hover:bg-[#178888] text-white font-semibold px-8 py-3 rounded-full text-sm transition-all active:scale-95 disabled:opacity-70">
                {loading ? "Mengirim..." : "Kirim Pendaftaran →"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
