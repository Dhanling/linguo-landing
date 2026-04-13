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
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    company_name: "", industry: "", company_size: "", pic_name: "", pic_title: "",
    pic_email: "", pic_phone: "", languages: [] as string[], participant_count: "",
    training_goal: [] as string[], level: "", budget_range: "", timeline: "", notes: "",
  });
  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const toggleArr = (k: string, val: string) => {
    setForm(f => {
      const arr = (f as any)[k] as string[];
      return { ...f, [k]: arr.includes(val) ? arr.filter((v: string) => v !== val) : [...arr, val] };
    });
  };

  const INDUSTRIES = ["Teknologi & IT", "Keuangan & Perbankan", "Farmasi & Kesehatan", "Manufaktur", "Hospitality & Travel", "Pendidikan", "E-Commerce & Retail", "Konstruksi & Real Estate", "Media & Hiburan", "Pemerintahan", "NGO / Non-Profit", "Lainnya"];
  const LANGUAGES = ["English", "Mandarin", "Japanese", "Korean", "German", "French", "Spanish", "Arabic", "Dutch", "Thai", "Vietnamese", "Turkish", "Russian", "Portuguese", "Italian", "BIPA", "Lainnya"];
  const GOALS = ["Business Communication", "Email & Writing", "Meeting & Presentation", "Negotiation", "Customer Service", "Technical Language", "General Conversation", "IELTS/TOEFL Prep", "Cultural Training"];

  const handleSubmit = async () => {
    if (!form.company_name || !form.pic_name || !form.pic_email) return;
    setSaving(true);
    try {
      // Save to Supabase
      const res = await fetch("/api/corporate-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      // Also send WA
      const msg = `Halo, saya ${form.pic_name} (${form.pic_title}) dari ${form.company_name} (${form.industry}).\n\n📋 Kebutuhan Corporate Training:\n• Bahasa: ${form.languages.join(", ")}\n• Peserta: ${form.participant_count}\n• Tujuan: ${form.training_goal.join(", ")}\n• Budget: ${form.budget_range}\n• Timeline: ${form.timeline}\n\n📧 ${form.pic_email}\n📱 ${form.pic_phone}\n\nCatatan: ${form.notes || "-"}`;
      window.open(waMsg(msg), "_blank");
      setSubmitted(true);
    } catch (e) {
      // Still open WA even if API fails
      const msg = `Halo, saya ${form.pic_name} dari ${form.company_name}. Saya tertarik Corporate Training Linguo. Email: ${form.pic_email}, Telp: ${form.pic_phone}`;
      window.open(waMsg(msg), "_blank");
      setSubmitted(true);
    }
    setSaving(false);
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

      {/* FORM — 3-Step Wizard */}
      <section id="form" className="py-16 sm:py-24 bg-gradient-to-br from-[#0d4f4f] via-[#1A9E9E] to-[#24b8b8] relative overflow-hidden">
        <div className="relative max-w-2xl mx-auto px-4">
          <motion.div {...fade} className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Minta Proposal Gratis</h2>
            <p className="text-white/70 text-sm">3 langkah mudah — tim kami akan menghubungi Anda dalam 1×24 jam kerja.</p>
          </motion.div>

          {submitted ? (
            <motion.div {...fade} className="bg-white rounded-3xl p-8 sm:p-12 shadow-2xl text-center">
              <div className="h-20 w-20 bg-[#1A9E9E]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">✅</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">Terima Kasih!</h3>
              <p className="text-slate-500 text-sm mb-2">Proposal akan kami kirim ke <strong>{form.pic_email}</strong></p>
              <p className="text-slate-400 text-xs">Tim kami juga akan menghubungi via WhatsApp dalam 1×24 jam kerja.</p>
            </motion.div>
          ) : (
            <motion.div {...fade} className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl">
              {/* Progress */}
              <div className="flex items-center gap-2 mb-6">
                {["Perusahaan", "Kebutuhan", "PIC & Kirim"].map((label, i) => (
                  <div key={i} className="flex-1">
                    <div className={`h-1.5 rounded-full transition-all ${i <= step ? "bg-[#1A9E9E]" : "bg-slate-200"}`} />
                    <p className={`text-[10px] mt-1 text-center font-medium ${i <= step ? "text-[#1A9E9E]" : "text-slate-400"}`}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Step 1: Company Info */}
              {step === 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Nama Perusahaan *</label>
                    <input type="text" value={form.company_name} onChange={e => setF("company_name", e.target.value)} placeholder="PT. Example Indonesia"
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-2 block">Industri *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {INDUSTRIES.map(ind => (
                        <button key={ind} onClick={() => setF("industry", ind)}
                          className={`px-3 py-2.5 rounded-xl border-2 text-xs font-medium transition-all text-left ${
                            form.industry === ind ? "border-[#1A9E9E] bg-[#1A9E9E]/5 text-[#1A9E9E]" : "border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}>{ind}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-2 block">Ukuran Perusahaan</label>
                    <div className="grid grid-cols-2 gap-2">
                      {["1-50 karyawan", "50-200 karyawan", "200-500 karyawan", "500+ karyawan"].map(s => (
                        <button key={s} onClick={() => setF("company_size", s)}
                          className={`px-3 py-2.5 rounded-xl border-2 text-xs font-medium transition-all ${
                            form.company_size === s ? "border-[#1A9E9E] bg-[#1A9E9E]/5 text-[#1A9E9E]" : "border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}>{s}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Training Needs */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-2 block">Bahasa yang Dibutuhkan * (bisa pilih lebih dari 1)</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {LANGUAGES.map(l => (
                        <button key={l} onClick={() => toggleArr("languages", l)}
                          className={`px-3 py-2 rounded-xl border-2 text-xs font-medium transition-all ${
                            form.languages.includes(l) ? "border-[#1A9E9E] bg-[#1A9E9E]/5 text-[#1A9E9E]" : "border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}>{l}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-2 block">Tujuan Training (bisa pilih lebih dari 1)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {GOALS.map(g => (
                        <button key={g} onClick={() => toggleArr("training_goal", g)}
                          className={`px-3 py-2 rounded-xl border-2 text-xs font-medium transition-all text-left ${
                            form.training_goal.includes(g) ? "border-[#1A9E9E] bg-[#1A9E9E]/5 text-[#1A9E9E]" : "border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}>{g}</button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Jumlah Peserta</label>
                      <select value={form.participant_count} onChange={e => setF("participant_count", e.target.value)}
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors bg-white">
                        <option value="">Pilih</option>
                        {["5-10 orang", "11-20 orang", "21-50 orang", "50-100 orang", "100+ orang"].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Budget Range</label>
                      <select value={form.budget_range} onChange={e => setF("budget_range", e.target.value)}
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors bg-white">
                        <option value="">Pilih</option>
                        {["< Rp 5 juta", "Rp 5-15 juta", "Rp 15-50 juta", "Rp 50-100 juta", "> Rp 100 juta", "Belum ditentukan"].map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Timeline Mulai</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {["Segera", "1 bulan", "2-3 bulan", "Masih survei"].map(t => (
                        <button key={t} onClick={() => setF("timeline", t)}
                          className={`px-3 py-2 rounded-xl border-2 text-xs font-medium transition-all ${
                            form.timeline === t ? "border-[#1A9E9E] bg-[#1A9E9E]/5 text-[#1A9E9E]" : "border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}>{t}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: PIC & Submit */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Nama PIC *</label>
                      <input type="text" value={form.pic_name} onChange={e => setF("pic_name", e.target.value)} placeholder="John Doe"
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Jabatan</label>
                      <input type="text" value={form.pic_title} onChange={e => setF("pic_title", e.target.value)} placeholder="HR Manager"
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Email PIC *</label>
                      <input type="email" value={form.pic_email} onChange={e => setF("pic_email", e.target.value)} placeholder="john@company.com"
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1.5 block">No. Telepon PIC *</label>
                      <input type="tel" value={form.pic_phone} onChange={e => setF("pic_phone", e.target.value)} placeholder="0812-3456-7890"
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Catatan Tambahan</label>
                    <textarea value={form.notes} onChange={e => setF("notes", e.target.value)} rows={3} placeholder="Jelaskan kebutuhan spesifik tim Anda..."
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors resize-none" />
                  </div>
                  {/* Summary */}
                  <div className="bg-slate-50 rounded-xl p-4 space-y-1.5 text-xs">
                    <p className="font-semibold text-sm text-slate-700 mb-2">📋 Ringkasan</p>
                    <p><span className="text-slate-400">Perusahaan:</span> <span className="font-medium">{form.company_name}</span> · {form.industry} · {form.company_size}</p>
                    <p><span className="text-slate-400">Bahasa:</span> <span className="font-medium">{form.languages.join(", ") || "-"}</span></p>
                    <p><span className="text-slate-400">Tujuan:</span> <span className="font-medium">{form.training_goal.join(", ") || "-"}</span></p>
                    <p><span className="text-slate-400">Peserta:</span> {form.participant_count || "-"} · <span className="text-slate-400">Budget:</span> {form.budget_range || "-"} · <span className="text-slate-400">Timeline:</span> {form.timeline || "-"}</p>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3 mt-6">
                {step > 0 && (
                  <button onClick={() => setStep(s => s - 1)}
                    className="flex-1 border-2 border-slate-200 text-slate-600 font-semibold py-3.5 rounded-full text-sm hover:border-slate-300 transition-all">
                    ← Kembali
                  </button>
                )}
                {step < 2 ? (
                  <button onClick={() => setStep(s => s + 1)}
                    disabled={step === 0 && (!form.company_name || !form.industry)}
                    className="flex-1 bg-[#1A9E9E] hover:bg-[#178888] disabled:bg-slate-300 text-white font-bold py-3.5 rounded-full transition-all active:scale-[0.98] text-sm">
                    Lanjut →
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={saving || !form.pic_name || !form.pic_email}
                    className="flex-1 bg-[#1A9E9E] hover:bg-[#178888] disabled:bg-slate-300 text-white font-bold py-3.5 rounded-full transition-all active:scale-[0.98] text-sm">
                    {saving ? "Mengirim..." : "Kirim Proposal Request →"}
                  </button>
                )}
              </div>
              <p className="text-center text-xs text-slate-400 mt-3">Data Anda aman dan tidak akan disebarkan ke pihak lain.</p>
            </motion.div>
          )}
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
