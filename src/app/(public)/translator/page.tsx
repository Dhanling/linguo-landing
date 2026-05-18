// PATCH_TRANSLATOR_B2B_LANDING_V1
"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Stamp,
  Scale,
  ShieldCheck,
  Briefcase,
  BookOpen,
  Heart,
  Wrench,
  MessageCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Globe,
  Award,
  Building2,
  Sparkles,
} from "lucide-react";

const WA = "6285798745252";
const waMsg = (text: string) =>
  `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;
const defaultInquiry = waMsg(
  "Halo Linguo, saya tertarik dengan layanan penerjemah tersumpah B2B. Bisa info detailnya?"
);

const fade = {
  initial: { opacity: 0, y: 8 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5 },
};

const SPECIALIZATIONS = [
  {
    Icon: Scale,
    label: "Hukum & Legal",
    desc: "Kontrak, akta notaris, putusan pengadilan, MoU, legal opinion",
  },
  {
    Icon: ShieldCheck,
    label: "Imigrasi",
    desc: "Visa, paspor, KITAS, dokumen kewarganegaraan, surat keterangan",
  },
  {
    Icon: Briefcase,
    label: "Bisnis & Korporat",
    desc: "Annual report, due diligence, pitch deck, kontrak komersial",
  },
  {
    Icon: BookOpen,
    label: "Akademik",
    desc: "Ijazah, transkrip, abstract jurnal, surat rekomendasi",
  },
  {
    Icon: Heart,
    label: "Medis",
    desc: "Rekam medis, jurnal kesehatan, informed consent, hasil lab",
  },
  {
    Icon: Wrench,
    label: "Teknis & Engineering",
    desc: "Manual produk, paten, spesifikasi teknis, dokumen QA",
  },
];

const BENEFITS = [
  {
    Icon: Sparkles,
    title: "Diterima Resmi",
    desc: "Hasil terjemahan dengan stamp & tanda tangan penerjemah ber-SK Menkumham RI — diterima oleh kementerian, kedutaan, pengadilan, dan instansi pemerintah.",
  },
  {
    Icon: Clock,
    title: "Turnaround Cepat",
    desc: "Standard 3-5 hari kerja untuk dokumen 1-10 halaman. Express 1-2 hari dengan multiplier 1.5×.",
  },
  {
    Icon: Globe,
    title: "Multi-Bahasa",
    desc: "Inggris, Arab, Mandarin, Jepang, Korea, Jerman, Prancis, Belanda, dan 10+ bahasa lain.",
  },
  {
    Icon: ShieldCheck,
    title: "Confidential",
    desc: "NDA tersedia untuk dokumen sensitif. Workflow penanganan dokumen confidential terisolasi.",
  },
  {
    Icon: Building2,
    title: "Trusted by Corporate",
    desc: "Dipercaya oleh perusahaan multinasional, firma hukum, instansi pemerintah, dan lembaga pendidikan.",
  },
  {
    Icon: Award,
    title: "Quality Assurance",
    desc: "Setiap penerjemah di pool kami melalui review tier (Bronze/Silver/Gold) sesuai track record dan kompleksitas.",
  },
];

const PROCESS = [
  {
    num: "01",
    title: "Kirim Inquiry",
    desc: "WhatsApp kami dengan jenis dokumen, pasangan bahasa, dan estimasi halaman",
  },
  {
    num: "02",
    title: "Quote & Approval",
    desc: "Tim kami balas dengan quote (rate × halaman) + estimasi timeline dalam 1-2 jam kerja",
  },
  {
    num: "03",
    title: "Pengerjaan",
    desc: "Setelah approval, penerjemah ber-SK Menkumham mulai pengerjaan dengan QA tier internal",
  },
  {
    num: "04",
    title: "Delivery",
    desc: "Hasil terjemahan dengan stamp + signature dikirim digital (PDF) + hardcopy (opsional)",
  },
];

const LANGS = [
  { flag: "🇬🇧", name: "Inggris" },
  { flag: "🇸🇦", name: "Arab" },
  { flag: "🇨🇳", name: "Mandarin" },
  { flag: "🇯🇵", name: "Jepang" },
  { flag: "🇰🇷", name: "Korea" },
  { flag: "🇩🇪", name: "Jerman" },
  { flag: "🇫🇷", name: "Prancis" },
  { flag: "🇪🇸", name: "Spanyol" },
  { flag: "🇳🇱", name: "Belanda" },
  { flag: "🇮🇹", name: "Italia" },
  { flag: "🇵🇹", name: "Portugis" },
  { flag: "🇷🇺", name: "Rusia" },
  { flag: "🇹🇭", name: "Thailand" },
  { flag: "🇻🇳", name: "Vietnam" },
  { flag: "🇮🇷", name: "Persia" },
];

const FAQS = [
  {
    q: "Apakah hasil terjemahan diterima resmi?",
    a: "Ya. Semua penerjemah di pool kami sudah disumpah oleh Menkumham RI dan punya SK Pengangkatan resmi. Hasil terjemahan dengan stamp + tanda tangan diterima oleh instansi pemerintah, kementerian, kedutaan, pengadilan, BUMN, dan lembaga resmi lain di Indonesia maupun luar negeri.",
  },
  {
    q: "Berapa lama turnaround time?",
    a: "Standard: 3-5 hari kerja untuk dokumen 1-10 halaman. Express: 1-2 hari kerja dengan multiplier 1.5×. Untuk volume besar (50+ halaman) atau bahasa langka, kami berikan estimasi khusus saat quote.",
  },
  {
    q: "Bahasa apa saja yang tersedia?",
    a: "Bahasa utama (Inggris, Arab, Mandarin, Jepang, Korea, Jerman, Prancis, Belanda, Spanyol, Italia, Portugis, Rusia, Thailand, Vietnam, Persia) tersedia dengan turnaround standar. Untuk bahasa lain (Norwegia, Hungaria, Polandia, Yunani, dst), kami bisa supply dengan estimasi waktu khusus.",
  },
  {
    q: "Bagaimana cara pemesanan?",
    a: "Cukup WhatsApp atau kirim inquiry. Sebutkan: (1) bahasa source & target, (2) jenis dokumen, (3) estimasi jumlah halaman, (4) target deadline, (5) format delivery (digital/hardcopy). Tim kami akan balas dengan quote dalam 1-2 jam kerja.",
  },
  {
    q: "Apakah ada NDA untuk dokumen sensitif?",
    a: "Ya. Untuk dokumen confidential (kontrak M&A, paten, rekam medis, due diligence), kami sediakan NDA standar — atau bisa pakai NDA template dari perusahaan Anda. Workflow penanganan dokumen sensitif terisolasi dengan akses terbatas.",
  },
  {
    q: "Apakah bisa request penerjemah tertentu?",
    a: "Bisa, dengan catatan tergantung availability. Klien repeat yang sudah punya preferred translator (mis. project lanjutan) bisa request penerjemah yang sama. Untuk klien baru, kami match dengan penerjemah yang sesuai bidang & bahasa.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      {...fade}
      className="bg-white border border-slate-200 rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-5 py-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
      >
        <span className="font-semibold text-sm">{q}</span>
        <ArrowRight
          className={`h-4 w-4 text-slate-400 flex-shrink-0 transition-transform ${
            open ? "rotate-90" : ""
          }`}
        />
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="px-5 pb-4"
        >
          <p className="text-sm text-slate-600 leading-relaxed">{a}</p>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function TranslatorB2BPage() {
  return (
    <div
      className="min-h-screen bg-white"
      style={{ fontFamily: "Poppins, sans-serif" }}
    >
      {/* HEADER */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 backdrop-blur-md bg-white/90">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img
              src="/images/logo-color.png"
              alt="Linguo"
              className="h-8"
            />
          </Link>
          <a
            href={defaultInquiry}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#1A9E9E] hover:bg-[#178888] text-white font-semibold px-5 py-2.5 rounded-full text-sm transition-all flex items-center gap-1.5"
          >
            <MessageCircle className="h-4 w-4" />
            Hubungi Kami
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0d4f4f] via-[#1A9E9E] to-[#24b8b8] text-white">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-20 left-10 text-9xl select-none">⚖️</div>
          <div className="absolute bottom-20 right-10 text-9xl select-none">📜</div>
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-20 sm:py-28 grid lg:grid-cols-5 gap-8 items-center">
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-xs font-semibold mb-6">
                <Stamp className="h-3.5 w-3.5" />
                <span>LAYANAN PENERJEMAH TERSUMPAH B2B</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-bold mb-6 leading-tight">
                <span className="text-[#fbbf24]">Penerjemah Tersumpah</span>
                <br />
                buat Dokumen Resmi Bisnis Lo
              </h1>
              <p className="text-white/80 text-base sm:text-lg mb-8 leading-relaxed max-w-2xl">
                Kontrak, akta, ijazah, dokumen imigrasi — diterjemahkan oleh
                penerjemah ber-SK Menkumham, dengan stamp & tanda tangan resmi.
                Diterima oleh kementerian, kedubes, dan pengadilan.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href={defaultInquiry}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold px-8 py-4 rounded-full transition-all active:scale-95 text-sm"
                >
                  Kirim Inquiry →
                </a>
                <a
                  href={defaultInquiry}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 backdrop-blur hover:bg-white/15 border border-white/30 text-white font-semibold px-8 py-4 rounded-full transition-all text-sm flex items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat via WhatsApp
                </a>
              </div>
            </motion.div>
          </div>
          <div className="lg:col-span-2 hidden lg:block">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/10 backdrop-blur rounded-3xl p-6 border border-white/20"
            >
              <div className="text-center mb-5">
                <Stamp className="h-12 w-12 mx-auto text-[#fbbf24] mb-2" />
                <p className="text-xs uppercase tracking-wider text-white/60 mb-1">
                  Sworn Translator
                </p>
                <p className="text-lg font-bold">SK Menkumham RI</p>
              </div>
              <div className="space-y-2 text-xs">
                {[
                  "Diterima Kementerian RI",
                  "Diterima Kedutaan",
                  "Diterima Pengadilan",
                  "Tier-based QA",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#fbbf24] flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* TRUST LOGOS */}
      <section className="py-12 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
            DIPERCAYA OLEH PERUSAHAAN & INSTITUSI TERKEMUKA
          </p>
          <img
            src="/images/client-logos.png"
            alt="Klien Linguo"
            className="mx-auto max-h-12 sm:max-h-16 opacity-70"
          />
        </div>
      </section>

      {/* BENEFITS */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div {...fade} className="text-center mb-14">
            <p className="text-xs font-bold text-[#1A9E9E] uppercase tracking-widest mb-2">
              Mengapa Linguo
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold">
              Standar Pelayanan B2B
            </h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={b.title}
                {...fade}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="bg-white rounded-2xl p-6 border border-slate-100"
              >
                <div className="w-11 h-11 bg-[#1A9E9E]/10 text-[#1A9E9E] rounded-xl flex items-center justify-center mb-4">
                  <b.Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <h3 className="font-bold text-base mb-1.5">{b.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {b.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SPECIALIZATIONS */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div {...fade} className="text-center mb-12">
            <p className="text-xs font-bold text-[#1A9E9E] uppercase tracking-widest mb-2">
              Bidang yang Dilayani
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold">
              Spesialisasi Penerjemah Kami
            </h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SPECIALIZATIONS.map((s, i) => (
              <motion.div
                key={s.label}
                {...fade}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl"
              >
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <s.Icon
                    className="h-5 w-5 text-[#1A9E9E]"
                    strokeWidth={2}
                  />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{s.label}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* LANGUAGES */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <motion.div {...fade}>
            <p className="text-xs font-bold text-[#1A9E9E] uppercase tracking-widest mb-2">
              Bahasa Tersedia
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold mb-8">
              15+ Pasangan Bahasa
            </h2>
          </motion.div>
          <div className="flex flex-wrap justify-center gap-3">
            {LANGS.map((l, i) => (
              <motion.div
                key={l.name}
                {...fade}
                transition={{ duration: 0.5, delay: i * 0.03 }}
                className="bg-white rounded-full px-5 py-2 border border-slate-200 text-sm font-medium flex items-center gap-1.5"
              >
                <span>{l.flag}</span>
                <span>{l.name}</span>
              </motion.div>
            ))}
          </div>
          <p className="text-sm text-slate-500 mt-6 max-w-xl mx-auto">
            Bahasa lain (Norwegia, Hungaria, Polandia, Yunani, dst) tersedia by
            request — hubungi kami untuk estimasi waktu dan rate.
          </p>
        </div>
      </section>

      {/* PROCESS */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div {...fade} className="text-center mb-14">
            <p className="text-xs font-bold text-[#1A9E9E] uppercase tracking-widest mb-2">
              Workflow
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold">
              Proses Mudah, 4 Langkah
            </h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROCESS.map((p, i) => (
              <motion.div
                key={p.num}
                {...fade}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-14 h-14 bg-[#1A9E9E]/10 text-[#1A9E9E] font-bold text-lg rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {p.num}
                </div>
                <h3 className="font-bold text-sm mb-2">{p.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {p.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div {...fade} className="text-center mb-12">
            <p className="text-xs font-bold text-[#1A9E9E] uppercase tracking-widest mb-2">
              FAQ
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold">Pertanyaan Umum</h2>
          </motion.div>
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <FaqItem key={i} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA BOTTOM */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-[#0d4f4f] via-[#1A9E9E] to-[#24b8b8]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div {...fade}>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Butuh Terjemahan Tersumpah?
            </h2>
            <p className="text-white/70 text-sm mb-8">
              Quote diberikan dalam 1-2 jam kerja. Tanpa biaya konsultasi awal.
            </p>
            <a
              href={defaultInquiry}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold px-10 py-4 rounded-full transition-all active:scale-95 text-sm inline-flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Kirim Inquiry via WhatsApp →
            </a>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#14726E] text-white py-10">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Link href="/" className="inline-block mb-4">
            <img
              src="/images/logo-white.png"
              alt="Linguo"
              className="h-10 mx-auto"
            />
          </Link>
          <p className="text-white/60 text-sm mb-2">
            PT. Linguo Edu Indonesia
          </p>
          <p className="text-white/40 text-xs">
            Happy Creative Hub, Jl. Cisitu Indah III No.2, Dago, Coblong,
            Bandung 40135
          </p>
          <div className="border-t border-white/20 mt-6 pt-6 text-xs text-white/40">
            © {new Date().getFullYear()} Linguo.id
          </div>
        </div>
      </footer>
    </div>
  );
}
