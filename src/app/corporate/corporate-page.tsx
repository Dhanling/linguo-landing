"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import TautanLegal from "@/components/TautanLegal"; // [xendit-legal-links-v1]

const WA = "https://wa.me/6282116859493";
const waMsg = (msg: string) => `${WA}?text=${encodeURIComponent(msg)}`;

const BENEFITS = [
  { icon: "🎯", title: "Custom Curriculum", desc: "Materi disesuaikan dengan kebutuhan industri & goals perusahaan Anda" },
  { icon: "📅", title: "Jadwal Fleksibel", desc: "Kelas bisa dijadwalkan sesuai jam kerja tim Anda — pagi, siang, atau sore" },
  { icon: "👥", title: "Group Class", desc: "Satu kelas untuk tim Anda (5-15 orang), lebih efisien & membangun team bonding" },
  { icon: "📊", title: "Progress Report", desc: "Laporan perkembangan bulanan untuk setiap peserta, langsung ke HR/PIC" },
  { icon: "📜", title: "E-Certificate", desc: "Sertifikat resmi dari Linguo.id untuk setiap peserta yang menyelesaikan program" },
  { icon: "🌍", title: "60+ Bahasa", desc: "Dari English & Mandarin hingga Korean, Japanese, German, French, dan lainnya" },
];

const PROGRAMS = [
  { title: "Business Communication", desc: "Tingkatkan kemampuan komunikasi bisnis tim Anda dalam bahasa asing — email, meeting, presentasi, dan negosiasi.", langs: ["English", "Mandarin", "Japanese", "Korean"], levels: "A1 – B2", sessions: "16–32 sesi", color: "from-teal-500 to-teal-600" },
  { title: "General Language Training", desc: "Program bahasa umum untuk karyawan — membangun fondasi komunikasi dan kepercayaan diri berbahasa asing.", langs: ["60+ bahasa tersedia"], levels: "A1 – B2", sessions: "16–32 sesi", color: "from-blue-500 to-blue-600" },
  { title: "IELTS / TOEFL Preparation", desc: "Persiapan tes bahasa Inggris untuk karyawan yang butuh sertifikasi — IELTS, TOEFL, atau tes internal perusahaan.", langs: ["English"], levels: "Intermediate+", sessions: "16 sesi @90 menit", color: "from-amber-500 to-amber-600" },
  { title: "Juru Bahasa / Interpreter", desc: "Interpreter untuk acara, site visit, audit, meeting, dan kunjungan delegasi — simultan, konsekutif, atau pendamping. Termasuk alat simultan (transmitter + headset) dan teknisi bila dibutuhkan.", langs: ["Japanese", "English", "Mandarin", "Korean", "60+ bahasa"], levels: "Interpreter profesional", sessions: "Per hari / per acara", color: "from-rose-500 to-rose-600" },
  { title: "Penerjemahan Dokumen", desc: "Penerjemahan dokumen umum, teknis, maupun tersumpah (sworn translation) untuk keperluan legal dan bisnis.", langs: ["60+ bahasa"], levels: "Umum & tersumpah", sessions: "Per halaman", color: "from-indigo-500 to-indigo-600" },
  { title: "Custom Program", desc: "Butuh sesuatu yang berbeda? Kami bisa rancang program khusus sesuai kebutuhan perusahaan Anda.", langs: ["Semua bahasa"], levels: "Custom", sessions: "Flexible", color: "from-purple-500 to-purple-600" },
];

// [b2b-service-type-v1] Form ini dulu hanya menampung kelas training, padahal
// permintaan yang masuk lewat WA kerap soal JURU BAHASA acara (tanggal, lokasi,
// alat simultan, teknisi, perjalanan interpreter) atau penerjemahan dokumen.
const SERVICES = [
  { id: "training", icon: "🎓", title: "Corporate Class Training", desc: "Kelas bahasa rutin untuk tim / karyawan" },
  { id: "interpreting", icon: "🎧", title: "Juru Bahasa / Interpreter", desc: "Acara, site visit, audit, meeting, kunjungan delegasi" },
  { id: "translation", icon: "📄", title: "Penerjemahan Dokumen", desc: "Dokumen umum, teknis, atau tersumpah" },
];
const INTERPRET_MODES = ["Simultan (headset/booth)", "Konsekutif (bergantian)", "Pendamping / escort", "Bisikan (whispering)", "Belum tahu — mohon disarankan"];
const EQUIPMENT = ["Alat simultan (transmitter + headset)", "Booth interpreter", "Sound system & microphone", "Teknisi / operator alat", "Sudah tersedia dari kami", "Belum tahu"];
const TRAVEL_OPTS = ["Ya, masukkan ke penawaran", "Tidak — kami yang atur", "Belum tahu"];
const DAILY_HOURS = ["≤ 4 jam (half day)", "8 jam (full day)", "> 8 jam / lembur", "Belum tahu"];
const INTERPRETER_COUNT = ["1 interpreter", "2 interpreter (tim simultan)", "Lebih dari 2", "Belum tahu — mohon disarankan"];
const DOC_TYPES = ["Legal / kontrak", "Teknis", "Materi presentasi", "Laporan / company profile", "Sertifikat & dokumen resmi", "Lainnya"];
const SWORN_OPTS = ["Ya, tersumpah", "Tidak perlu", "Belum tahu"];

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
    // [b2b-service-type-v1]
    services: [] as string[],
    event_name: "", event_start: "", event_end: "", event_location: "",
    interpret_mode: "", language_pairs: "", interpreter_count: "", daily_hours: "",
    equipment: [] as string[], travel_cover: "",
    doc_types: [] as string[], doc_pages: "", doc_sworn: "", doc_deadline: "",
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

  // Langkah wizard mengikuti layanan yang dipilih: yang tak dipilih tidak
  // ditanyakan sama sekali (klien juru bahasa tak perlu ditanya "tujuan training").
  const hasTraining = form.services.includes("training");
  const hasInterpreting = form.services.includes("interpreting");
  const hasTranslation = form.services.includes("translation");
  const wizardSteps = useMemo(() => {
    const st: { key: string; label: string }[] = [
      { key: "service", label: "Layanan" },
      { key: "company", label: "Perusahaan" },
    ];
    if (hasTraining || form.services.length === 0) st.push({ key: "training", label: "Kebutuhan" });
    if (hasInterpreting) st.push({ key: "event", label: "Detail Acara" });
    if (hasTranslation) st.push({ key: "doc", label: "Dokumen" });
    st.push({ key: "pic", label: "PIC & Kirim" });
    return st;
  }, [hasTraining, hasInterpreting, hasTranslation, form.services.length]);
  // Daftar langkah bisa menyusut saat pilihan layanan diubah → jaga indeksnya.
  const stepIdx = Math.min(step, wizardSteps.length - 1);
  const cur = wizardSteps[stepIdx].key;
  const isLast = stepIdx === wizardSteps.length - 1;
  const canNext =
    cur === "service" ? form.services.length > 0 && form.languages.length > 0
    : cur === "company" ? !!form.company_name && !!form.industry
    : true;

  // Ringkasan permintaan — dipakai untuk pesan WA sekaligus ditempel ke `notes`
  // supaya rincian acara tetap terbaca di menu Corporate dashboard.
  const buildSummary = () => {
    const L: string[] = [];
    L.push(`Layanan: ${form.services.map(id => SERVICES.find(s2 => s2.id === id)?.title || id).join(" + ")}`);
    L.push(`Bahasa: ${form.languages.join(", ") || "-"}`);
    if (hasTraining) {
      L.push(`Tujuan training: ${form.training_goal.join(", ") || "-"}`);
      L.push(`Peserta: ${form.participant_count || "-"} · Timeline: ${form.timeline || "-"}`);
    }
    if (hasInterpreting) {
      L.push(`Acara: ${form.event_name || "-"}`);
      L.push(`Tanggal: ${form.event_start || "-"}${form.event_end ? ` s/d ${form.event_end}` : ""} · Lokasi: ${form.event_location || "-"}`);
      L.push(`Mode interpretasi: ${form.interpret_mode || "-"} · Arah bahasa: ${form.language_pairs || "-"}`);
      L.push(`Jumlah interpreter: ${form.interpreter_count || "-"} · Jam/hari: ${form.daily_hours || "-"} · Pendengar: ${form.participant_count || "-"}`);
      L.push(`Alat: ${form.equipment.join(", ") || "-"}`);
      L.push(`Akomodasi & transport interpreter: ${form.travel_cover || "-"}`);
    }
    if (hasTranslation) {
      L.push(`Dokumen: ${form.doc_types.join(", ") || "-"} · ${form.doc_pages || "-"} halaman · ${form.doc_sworn || "-"}`);
      L.push(`Deadline dokumen: ${form.doc_deadline || "-"}`);
    }
    L.push(`Budget: ${form.budget_range || "-"}`);
    return L;
  };

  const handleSubmit = async () => {
    if (!form.company_name || !form.pic_name || !form.pic_email) return;
    setSaving(true);
    const summary = buildSummary();
    const notesFull = [form.notes?.trim(), ...summary].filter(Boolean).join("\n");
    const serviceDetail: Record<string, any> = { services: form.services, languages: form.languages };
    if (hasInterpreting) {
      serviceDetail.event = {
        name: form.event_name, start_date: form.event_start || null, end_date: form.event_end || null,
        location: form.event_location, mode: form.interpret_mode, language_pairs: form.language_pairs,
        interpreter_count: form.interpreter_count, daily_hours: form.daily_hours,
        audience: form.participant_count, equipment: form.equipment, travel_cover: form.travel_cover,
      };
    }
    if (hasTranslation) {
      serviceDetail.document = {
        types: form.doc_types, pages: form.doc_pages, sworn: form.doc_sworn, deadline: form.doc_deadline || null,
      };
    }
    try {
      // Save to Supabase
      await fetch("/api/corporate-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          notes: notesFull,
          service_type: form.services.join("+") || "training",
          service_detail: serviceDetail,
        }),
      });
      // Also send WA
      const msg = `Halo, saya ${form.pic_name}${form.pic_title ? ` (${form.pic_title})` : ""} dari ${form.company_name}${form.industry ? ` (${form.industry})` : ""}.\n\n📋 Permintaan B2B:\n${summary.map(l => `• ${l}`).join("\n")}\n\n📧 ${form.pic_email}\n📱 ${form.pic_phone}\n\nCatatan: ${form.notes || "-"}`;
      window.open(waMsg(msg), "_blank");
      setSubmitted(true);
    } catch (e) {
      // Still open WA even if API fails
      const msg = `Halo, saya ${form.pic_name} dari ${form.company_name}. Saya tertarik layanan B2B Linguo (${form.services.join(", ") || "corporate"}). Email: ${form.pic_email}, Telp: ${form.pic_phone}`;
      window.open(waMsg(msg), "_blank");
      setSubmitted(true);
    }
    setSaving(false);
  };

  const fade = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* HEADER */}
      <header className="sticky top-[var(--promo-bar-h,0px)] z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-800 hover:text-teal-600 transition-colors">
            <Image src="/images/logo-white.png" alt="Linguo" width={90} height={32} priority className="h-8 w-auto brightness-0" />
          </Link>
          <a href={waMsg("Halo, saya tertarik Corporate Linguo")} target="_blank"
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
              Pelatihan bahasa, juru bahasa acara, dan penerjemahan dokumen — dirancang khusus untuk kebutuhan perusahaan Anda. Fleksibel, terstruktur, dan terukur.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#form" className="bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold px-8 py-4 rounded-full transition-all active:scale-95 text-sm">
                Minta Proposal Gratis
              </a>
              <a href={waMsg("Halo, saya mau konsultasi tentang Corporate Linguo")} target="_blank"
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
            <p className="text-slate-500 mt-3 max-w-lg mx-auto text-sm">Kelas training, juru bahasa acara, hingga penerjemahan dokumen — semuanya bisa di-custom. Harga khusus untuk corporate.</p>
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
            <p className="text-xs text-slate-400 mt-1">Juru bahasa &amp; penerjemahan dokumen dihitung per acara/dokumen — kirim detailnya lewat form di bawah untuk penawaran rinci.</p>
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
            <p className="text-white/70 text-sm">Kelas training, juru bahasa, atau penerjemahan dokumen — tim kami menghubungi Anda dalam 1×24 jam kerja.</p>
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
                {wizardSteps.map((sv, i) => (
                  <div key={sv.key} className="flex-1">
                    <div className={`h-1.5 rounded-full transition-all ${i <= stepIdx ? "bg-[#1A9E9E]" : "bg-slate-200"}`} />
                    <p className={`text-[10px] mt-1 text-center font-medium ${i <= stepIdx ? "text-[#1A9E9E]" : "text-slate-400"}`}>{sv.label}</p>
                  </div>
                ))}
              </div>

              {/* Langkah 1: Jenis layanan + bahasa */}
              {cur === "service" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-2 block">Layanan yang Dibutuhkan * (bisa pilih lebih dari 1)</label>
                    <div className="grid sm:grid-cols-3 gap-2">
                      {SERVICES.map(sv => (
                        <button key={sv.id} onClick={() => toggleArr("services", sv.id)}
                          className={`px-4 py-3 rounded-xl border-2 text-left transition-all ${
                            form.services.includes(sv.id) ? "border-[#1A9E9E] bg-[#1A9E9E]/5" : "border-slate-200 hover:border-slate-300"
                          }`}>
                          <span className="text-xl block mb-1">{sv.icon}</span>
                          <span className={`block text-xs font-bold ${form.services.includes(sv.id) ? "text-[#1A9E9E]" : "text-slate-700"}`}>{sv.title}</span>
                          <span className="block text-[10px] text-slate-400 leading-snug mt-1">{sv.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
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
                </div>
              )}

              {/* Langkah 2: Profil perusahaan */}
              {cur === "company" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Nama Perusahaan / Instansi *</label>
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
                      {["1-50 karyawan", "50-200 karyawan", "200-500 karyawan", "500+ karyawan"].map(sz => (
                        <button key={sz} onClick={() => setF("company_size", sz)}
                          className={`px-3 py-2.5 rounded-xl border-2 text-xs font-medium transition-all ${
                            form.company_size === sz ? "border-[#1A9E9E] bg-[#1A9E9E]/5 text-[#1A9E9E]" : "border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}>{sz}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Langkah 3a: Kebutuhan kelas training */}
              {cur === "training" && (
                <div className="space-y-4">
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
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Jumlah Peserta</label>
                    <select value={form.participant_count} onChange={e => setF("participant_count", e.target.value)}
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors bg-white">
                      <option value="">Pilih</option>
                      {["5-10 orang", "11-20 orang", "21-50 orang", "50-100 orang", "100+ orang"].map(sz => <option key={sz} value={sz}>{sz}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-2 block">Timeline Mulai</label>
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

              {/* Langkah 3b: Detail acara juru bahasa */}
              {cur === "event" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Nama / Jenis Acara *</label>
                    <input type="text" value={form.event_name} onChange={e => setF("event_name", e.target.value)}
                      placeholder="Mis. RSPO Post-RT Tour / Field Visit" className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Tanggal Mulai</label>
                      <input type="date" value={form.event_start} onChange={e => setF("event_start", e.target.value)} className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Tanggal Selesai</label>
                      <input type="date" value={form.event_end} onChange={e => setF("event_end", e.target.value)} className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Lokasi Acara</label>
                    <input type="text" value={form.event_location} onChange={e => setF("event_location", e.target.value)}
                      placeholder="Mis. Palangka Raya, Kalimantan Tengah (atau: Online / Zoom)" className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Arah Bahasa</label>
                    <input type="text" value={form.language_pairs} onChange={e => setF("language_pairs", e.target.value)}
                      placeholder="Mis. Jepang ⇄ Indonesia, Jepang ⇄ Inggris" className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-2 block">Mode Interpretasi</label>
                    <div className="grid grid-cols-2 gap-2">
                      {INTERPRET_MODES.map(m => (
                        <button key={m} onClick={() => setF("interpret_mode", m)}
                          className={`px-3 py-2 rounded-xl border-2 text-xs font-medium transition-all text-left ${
                            form.interpret_mode === m ? "border-[#1A9E9E] bg-[#1A9E9E]/5 text-[#1A9E9E]" : "border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}>{m}</button>
                      ))}
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Jumlah Peserta / Pendengar</label>
                      <select value={form.participant_count} onChange={e => setF("participant_count", e.target.value)}
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors bg-white">
                        <option value="">Pilih</option>
                        {["< 10 orang", "10-30 orang", "31-50 orang", "51-100 orang", "100+ orang"].map(sz => <option key={sz} value={sz}>{sz}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Jumlah Interpreter</label>
                      <select value={form.interpreter_count} onChange={e => setF("interpreter_count", e.target.value)}
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors bg-white">
                        <option value="">Pilih</option>
                        {INTERPRETER_COUNT.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-2 block">Durasi Kerja per Hari</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {DAILY_HOURS.map(h => (
                        <button key={h} onClick={() => setF("daily_hours", h)}
                          className={`px-3 py-2 rounded-xl border-2 text-xs font-medium transition-all ${
                            form.daily_hours === h ? "border-[#1A9E9E] bg-[#1A9E9E]/5 text-[#1A9E9E]" : "border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}>{h}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-2 block">Kebutuhan Alat (bisa pilih lebih dari 1)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {EQUIPMENT.map(eq => (
                        <button key={eq} onClick={() => toggleArr("equipment", eq)}
                          className={`px-3 py-2 rounded-xl border-2 text-xs font-medium transition-all text-left ${
                            form.equipment.includes(eq) ? "border-[#1A9E9E] bg-[#1A9E9E]/5 text-[#1A9E9E]" : "border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}>{eq}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-2 block">Perjalanan, Akomodasi &amp; Konsumsi Interpreter</label>
                    <div className="grid grid-cols-3 gap-2">
                      {TRAVEL_OPTS.map(t => (
                        <button key={t} onClick={() => setF("travel_cover", t)}
                          className={`px-3 py-2 rounded-xl border-2 text-xs font-medium transition-all ${
                            form.travel_cover === t ? "border-[#1A9E9E] bg-[#1A9E9E]/5 text-[#1A9E9E]" : "border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}>{t}</button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5">Untuk acara di luar Bandung/Jakarta, penawaran bisa mencakup tiket, hari perjalanan, penginapan, transport lokal, dan konsumsi.</p>
                  </div>
                </div>
              )}

              {/* Langkah 3c: Penerjemahan dokumen */}
              {cur === "doc" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-2 block">Jenis Dokumen (bisa pilih lebih dari 1)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {DOC_TYPES.map(d => (
                        <button key={d} onClick={() => toggleArr("doc_types", d)}
                          className={`px-3 py-2 rounded-xl border-2 text-xs font-medium transition-all text-left ${
                            form.doc_types.includes(d) ? "border-[#1A9E9E] bg-[#1A9E9E]/5 text-[#1A9E9E]" : "border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}>{d}</button>
                      ))}
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Perkiraan Jumlah Halaman</label>
                      <input type="text" value={form.doc_pages} onChange={e => setF("doc_pages", e.target.value)} placeholder="Mis. 25" className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Deadline</label>
                      <input type="date" value={form.doc_deadline} onChange={e => setF("doc_deadline", e.target.value)} className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-2 block">Perlu Penerjemah Tersumpah?</label>
                    <div className="grid grid-cols-3 gap-2">
                      {SWORN_OPTS.map(o => (
                        <button key={o} onClick={() => setF("doc_sworn", o)}
                          className={`px-3 py-2 rounded-xl border-2 text-xs font-medium transition-all ${
                            form.doc_sworn === o ? "border-[#1A9E9E] bg-[#1A9E9E]/5 text-[#1A9E9E]" : "border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}>{o}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Langkah terakhir: PIC & kirim */}
              {cur === "pic" && (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Nama PIC *</label>
                      <input type="text" value={form.pic_name} onChange={e => setF("pic_name", e.target.value)} placeholder="John Doe" className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Jabatan</label>
                      <input type="text" value={form.pic_title} onChange={e => setF("pic_title", e.target.value)} placeholder="HR Manager" className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Email PIC *</label>
                      <input type="email" value={form.pic_email} onChange={e => setF("pic_email", e.target.value)} placeholder="john@company.com" className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1.5 block">No. Telepon PIC *</label>
                      <input type="tel" value={form.pic_phone} onChange={e => setF("pic_phone", e.target.value)} placeholder="0812-3456-7890" className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Perkiraan Budget</label>
                    <select value={form.budget_range} onChange={e => setF("budget_range", e.target.value)} className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors bg-white">
                      <option value="">Pilih</option>
                      {["< Rp 5 juta", "Rp 5-15 juta", "Rp 15-50 juta", "Rp 50-100 juta", "> Rp 100 juta", "Belum ditentukan"].map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Catatan Tambahan</label>
                    <textarea value={form.notes} onChange={e => setF("notes", e.target.value)} rows={3} placeholder="Rundown acara, kebutuhan khusus, atau hal lain yang perlu kami tahu..."
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors resize-none" />
                  </div>
                  {/* Summary */}
                  <div className="bg-slate-50 rounded-xl p-4 space-y-1 text-xs">
                    <p className="font-semibold text-sm text-slate-700 mb-2">📋 Ringkasan</p>
                    <p><span className="text-slate-400">Perusahaan:</span> <span className="font-medium">{form.company_name}</span> · {form.industry} · {form.company_size}</p>
                    {buildSummary().map((line, i) => {
                      const [k, ...rest] = line.split(":");
                      return <p key={i}><span className="text-slate-400">{k}:</span> <span className="font-medium">{rest.join(":").trim()}</span></p>;
                    })}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3 mt-6">
                {stepIdx > 0 && (
                  <button onClick={() => setStep(stepIdx - 1)}
                    className="flex-1 border-2 border-slate-200 text-slate-600 font-semibold py-3.5 rounded-full text-sm hover:border-slate-300 transition-all">
                    ← Kembali
                  </button>
                )}
                {!isLast ? (
                  <button onClick={() => setStep(stepIdx + 1)} disabled={!canNext}
                    className="flex-1 bg-[#1A9E9E] hover:bg-[#178888] disabled:bg-slate-300 text-white font-bold py-3.5 rounded-full transition-all active:scale-[0.98] text-sm">
                    Lanjut →
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={saving || !form.pic_name || !form.pic_email || !form.pic_phone}
                    className="flex-1 bg-[#1A9E9E] hover:bg-[#178888] disabled:bg-slate-300 text-white font-bold py-3.5 rounded-full transition-all active:scale-[0.98] text-sm">
                    {saving ? "Mengirim..." : "Kirim Permintaan Penawaran →"}
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
            <Image src="/images/logo-white.png" alt="Linguo" width={113} height={40} className="h-10 w-auto mx-auto" />
          </Link>
          <p className="text-white/60 text-sm mb-2">PT. Linguo Edu Indonesia</p>
          <p className="text-white/40 text-xs">Happy Creative Hub, Jl. Cisitu Indah III No.2, Dago, Coblong, Bandung 40135</p>
          <div className="border-t border-white/20 mt-6 pt-6 text-xs text-white/40">
            <TautanLegal className="mb-2" />
            © {new Date().getFullYear()} Linguo.id
          </div>
        </div>
      </footer>
    </div>
  );
}
