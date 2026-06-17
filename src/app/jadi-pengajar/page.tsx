"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { WILAYAH_ID } from "@/lib/wilayah-id";
import { languages, regionLabels } from "@/data/curriculum/languages";
import {
  Video, Users, Repeat,
  Smile, Ban, Baby, Backpack,
  GraduationCap, Award, Link2, AlertCircle,
  X, Loader2, CheckCircle2, Search, Check, ChevronDown, ChevronLeft, ChevronRight,
} from "lucide-react";

const WA = "https://wa.me/6282130113243";
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

const STEPS = [
  { num: 1, title: "Data Diri", desc: "Info kontak kamu" },
  { num: 2, title: "Bahasa & Kualifikasi", desc: "Keahlian bahasa" },
  { num: 3, title: "Pengalaman", desc: "Latar belakang" },
  { num: 4, title: "Review & Kirim", desc: "Periksa data" },
];

const LANG_REGION_ORDER = ["european", "asian", "middle-eastern", "nusantara", "african", "other"] as const;

type PickerLang = { slug: string; name: string; flag: string; nativeName?: string };

// Bahasa isyarat — bukan bagian dari katalog `languages`, jadi didefinisikan terpisah.
const SIGN_LANGUAGES: PickerLang[] = [
  { slug: "bisindo", name: "BISINDO", flag: "🤟", nativeName: "Bahasa Isyarat Indonesia" },
  { slug: "asl", name: "ASL", flag: "🤟", nativeName: "American Sign Language" },
  { slug: "sign-both", name: "Keduanya (BISINDO & ASL)", flag: "🤟" },
];

// Slug penanda "induk" bahasa isyarat di list utama — bukan nilai yang disimpan,
// klik item ini akan membuka sub-pilihan (BISINDO / ASL / Keduanya).
const SIGN_PARENT_SLUG = "__sign__";
const SIGN_PARENT: PickerLang = { slug: SIGN_PARENT_SLUG, name: "Bahasa Isyarat", flag: "🤟" };

const LANG_GROUPS: { region: string; label: string; items: PickerLang[] }[] = [
  ...LANG_REGION_ORDER.map(region => ({
    region,
    label: regionLabels[region],
    items: languages
      .filter(l => l.region === region)
      .sort((a, b) => a.name.localeCompare(b.name, "id"))
      .map(l => ({ slug: l.slug, name: l.name, flag: l.flag, nativeName: l.nativeName })),
  })).filter(g => g.items.length > 0),
  // Di list utama bahasa isyarat tampil sebagai SATU item, bukan 3.
  { region: "sign", label: "Bahasa Isyarat", items: [SIGN_PARENT] },
];

// Resolusi nama: cari di katalog utama + 3 opsi bahasa isyarat yang sebenarnya.
const findLangMeta = (slug: string): PickerLang | null =>
  LANG_GROUPS.flatMap(g => g.items).find(l => l.slug === slug)
  ?? SIGN_LANGUAGES.find(l => l.slug === slug)
  ?? null;

const LEVEL_OPTIONS = [
  { value: "A1", label: "A1 (Pemula)" },
  { value: "A2", label: "A2 (Dasar)" },
  { value: "B1", label: "B1 (Menengah)" },
  { value: "B2", label: "B2 (Menengah Atas)" },
  { value: "C1", label: "C1 (Mahir)" },
  { value: "C2", label: "C2 (Sangat Mahir)" },
  { value: "Native", label: "Native Speaker" },
];

const langNameBySlug = (slug: string) => findLangMeta(slug)?.name ?? slug;

// ---- Language picker modal (search + grouped per region) ----
function LangPicker({ value, usedLangs, onSelect }: {
  value: string;
  usedLangs: string[];
  onSelect: (slug: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [showSignSub, setShowSignSub] = useState(false);
  const selected = value ? findLangMeta(value) : null;
  const close = () => { setOpen(false); setQ(""); setShowSignSub(false); };

  const norm = q.trim().toLowerCase();
  const matches = (l: PickerLang) =>
    !norm ||
    l.name.toLowerCase().includes(norm) ||
    (l.nativeName?.toLowerCase().includes(norm) ?? false);

  const groups = LANG_GROUPS.map(g => ({
    ...g,
    items: g.items.filter(matches),
  })).filter(g => g.items.length > 0);

  const signOptions = SIGN_LANGUAGES.filter(matches);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm text-left focus:outline-none focus:border-[#1A9E9E] transition-colors bg-white flex items-center justify-between gap-2">
        <span className={selected ? "truncate" : "text-slate-400"}>
          {selected ? `${selected.flag} ${selected.name}` : "Pilih bahasa..."}
        </span>
        <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
            className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 min-w-0">
                  {showSignSub && (
                    <button type="button" onClick={() => setShowSignSub(false)} aria-label="Kembali"
                      className="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
                      <ChevronLeft size={18} />
                    </button>
                  )}
                  <h3 className="font-bold text-base truncate">{showSignSub ? "Bahasa Isyarat" : "Pilih Bahasa"}</h3>
                </div>
                <button type="button" onClick={close} aria-label="Tutup"
                  className="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input autoFocus value={q} onChange={e => setQ(e.target.value)}
                  placeholder={showSignSub ? "Cari jenis bahasa isyarat..." : "Cari bahasa..."}
                  className="w-full border-2 border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
              </div>
            </div>
            <div className="overflow-y-auto p-2">
              {showSignSub ? (
                signOptions.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 py-10">Tidak ditemukan</p>
                ) : signOptions.map(l => {
                  const isSel = l.slug === value;
                  const used = !isSel && usedLangs.includes(l.slug);
                  return (
                    <button key={l.slug} type="button" disabled={used}
                      onClick={() => { onSelect(l.slug); close(); }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between gap-2 transition-colors ${used ? "opacity-40 cursor-not-allowed" : "hover:bg-[#1A9E9E]/5"} ${isSel ? "bg-[#1A9E9E]/10 text-[#1A9E9E] font-semibold" : ""}`}>
                      <span className="truncate">{l.flag} {l.name}</span>
                      {isSel && <Check className="h-4 w-4 flex-shrink-0" />}
                      {used && <span className="text-[10px] text-slate-400 flex-shrink-0">dipakai</span>}
                    </button>
                  );
                })
              ) : groups.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-10">Bahasa tidak ditemukan</p>
              ) : groups.map(g => (
                <div key={g.region} className="mb-2">
                  <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">{g.label}</p>
                  {g.items.map(l => {
                    const isSignParent = l.slug === SIGN_PARENT_SLUG;
                    // Item bahasa isyarat terpilih bila value adalah salah satu dari 3 opsi.
                    const isSel = isSignParent
                      ? SIGN_LANGUAGES.some(s => s.slug === value)
                      : l.slug === value;
                    const used = !isSel && !isSignParent && usedLangs.includes(l.slug);
                    const onClick = isSignParent
                      ? () => { setShowSignSub(true); setQ(""); }
                      : () => { onSelect(l.slug); close(); };
                    return (
                      <button key={l.slug} type="button" disabled={used} onClick={onClick}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between gap-2 transition-colors ${used ? "opacity-40 cursor-not-allowed" : "hover:bg-[#1A9E9E]/5"} ${isSel ? "bg-[#1A9E9E]/10 text-[#1A9E9E] font-semibold" : ""}`}>
                        <span className="truncate">
                          {l.flag} {l.name}
                          {isSignParent && isSel && (
                            <span className="font-normal text-[#1A9E9E]/70"> · {findLangMeta(value)?.name}</span>
                          )}
                        </span>
                        {isSignParent
                          ? <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-400" />
                          : <>
                              {isSel && <Check className="h-4 w-4 flex-shrink-0" />}
                              {used && <span className="text-[10px] text-slate-400 flex-shrink-0">dipakai</span>}
                            </>}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}

// ---- Dup detection helpers ----
type DupStatus = "idle" | "checking" | "ok" | "blocking";
type DupCheck = { status: DupStatus; appStatus?: string };

const STATUS_MESSAGES: Record<string, string> = {
  submitted: "Pendaftaran kamu sedang menunggu review. Tim kami akan menghubungi via WhatsApp dalam 1–3 hari kerja.",
  reviewed: "Pendaftaran sudah direview tim. Tunggu kabar selanjutnya via WhatsApp.",
  interview: "Kamu sudah masuk tahap interview. Cek WhatsApp untuk jadwal interview.",
  accepted: "Kamu sudah diterima! Tunggu info onboarding via WhatsApp.",
  onboarded: "Kamu sudah jadi pengajar Linguo. Login ke dashboard pengajar untuk mulai mengajar.",
};

function normalizePhone(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  return digits;
}

// ---- Tier kids ----
const KIDS_TIERS = [
  { value: "little_learner", label: "Little Learner", age: "4–6 tahun", Icon: Baby },
  { value: "young_explorer", label: "Young Explorer", age: "7–12 tahun", Icon: Backpack },
] as const;

// ---- Mode mengajar ----
const TEACHING_MODES = [
  { value: "online", label: "Online", desc: "Via Zoom", Icon: Video },
  { value: "offline", label: "Offline", desc: "Tatap muka", Icon: Users },
  { value: "both", label: "Keduanya", desc: "Online & offline", Icon: Repeat },
] as const;

export default function JadiPengajarPage() {
  const [step, setStep] = useState(0); // 0 = landing, 1-4 = wizard steps
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Step 1: Data Diri
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");

  // Step 1: Dup check states
  const [emailCheck, setEmailCheck] = useState<DupCheck>({ status: "idle" });
  const [phoneCheck, setPhoneCheck] = useState<DupCheck>({ status: "idle" });
  const [lastCheckedEmail, setLastCheckedEmail] = useState("");
  const [lastCheckedPhone, setLastCheckedPhone] = useState("");

  // Step 2: Bahasa & Kualifikasi
  const [langSkills, setLangSkills] = useState<{ lang: string; level: string }[]>([{ lang: "", level: "" }]);
  const [teachingMode, setTeachingMode] = useState<"" | "online" | "offline" | "both">("");
  const [certificates, setCertificates] = useState<{ name: string; link: string }[]>([{ name: "", link: "" }]);
  const [canTeachKids, setCanTeachKids] = useState<null | boolean>(null);
  const [kidsTiers, setKidsTiers] = useState<string[]>([]);

  // Step 3: Pengalaman
  const [exp, setExp] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [motivation, setMotivation] = useState("");

  // ---- Lang skills helpers ----
  const addLangSlot = () => {
    if (langSkills.length < 5) setLangSkills([...langSkills, { lang: "", level: "" }]);
  };
  const removeLangSlot = (idx: number) => {
    setLangSkills(langSkills.filter((_, i) => i !== idx));
  };
  const updateLangSlot = (idx: number, field: "lang" | "level", value: string) => {
    setLangSkills(langSkills.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };
  const validSkills = langSkills.filter(s => s.lang && s.level);
  const hasIncompleteSkill = langSkills.some(s => (s.lang && !s.level) || (!s.lang && s.level));

  // ---- Certificate helpers ----
  const addCert = () => {
    if (certificates.length < 5) setCertificates([...certificates, { name: "", link: "" }]);
  };
  const removeCert = (idx: number) => {
    setCertificates(certificates.filter((_, i) => i !== idx));
  };
  const updateCert = (idx: number, field: "name" | "link", value: string) => {
    setCertificates(certificates.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };
  const validCerts = certificates.filter(c => c.name.trim() && c.link.trim());
  const hasIncompleteCert = certificates.some(c => {
    const hasName = !!c.name.trim();
    const hasLink = !!c.link.trim();
    return (hasName && !hasLink) || (!hasName && hasLink);
  });

  // ---- Kids tier helper ----
  const toggleKidsTier = (t: string) => {
    setKidsTiers(kidsTiers.includes(t)
      ? kidsTiers.filter(x => x !== t)
      : [...kidsTiers, t]
    );
  };

  // ---- Dup check API ----
  async function checkDuplicate(field: "email" | "phone", rawValue: string) {
    const value = field === "email" ? rawValue.trim().toLowerCase() : rawValue;
    const param = field === "email"
      ? `email=${encodeURIComponent(value)}`
      : `phone=${encodeURIComponent(value)}`;
    try {
      const res = await fetch(`/api/teacher-apply?${param}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data[field] as { exists: boolean; status: string; blocking: boolean } | null;
    } catch {
      return null;
    }
  }

  const handleEmailBlur = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) return;
    if (trimmed === lastCheckedEmail) return;
    setEmailCheck({ status: "checking" });
    setLastCheckedEmail(trimmed);
    const result = await checkDuplicate("email", trimmed);
    if (result?.blocking) {
      setEmailCheck({ status: "blocking", appStatus: result.status });
    } else {
      setEmailCheck({ status: "ok" });
    }
  };

  const handlePhoneBlur = async () => {
    const normalized = normalizePhone(phone);
    if (!normalized || normalized.length < 9) return;
    if (normalized === lastCheckedPhone) return;
    setPhoneCheck({ status: "checking" });
    setLastCheckedPhone(normalized);
    const result = await checkDuplicate("phone", phone);
    if (result?.blocking) {
      setPhoneCheck({ status: "blocking", appStatus: result.status });
    } else {
      setPhoneCheck({ status: "ok" });
    }
  };

  const onEmailChange = (v: string) => {
    setEmail(v);
    if (emailCheck.status !== "idle") setEmailCheck({ status: "idle" });
  };
  const onPhoneChange = (v: string) => {
    setPhone(v);
    if (phoneCheck.status !== "idle") setPhoneCheck({ status: "idle" });
  };

  const canNext = (s: number) => {
    if (s === 1) {
      return !!(name.trim() && email.trim() && phone.trim() && province && city)
        && emailCheck.status !== "blocking"
        && phoneCheck.status !== "blocking"
        && emailCheck.status !== "checking"
        && phoneCheck.status !== "checking";
    }
    if (s === 2) {
      const kidsOk = canTeachKids === false || (canTeachKids === true && kidsTiers.length > 0);
      return validSkills.length >= 1
        && !hasIncompleteSkill
        && !!teachingMode
        && !hasIncompleteCert
        && canTeachKids !== null
        && kidsOk;
    }
    if (s === 3) return !!exp;
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    const certsBlock = validCerts.length > 0
      ? `Sertifikat:\n${validCerts.map(c => `- ${c.name} (${c.link})`).join("\n")}`
      : null;
    const payload = {
      name, email, phone, province, city,
      languages: validSkills.map(s => `${s.lang}|${s.level}`).join(", "),
      level: validSkills[0]?.level ?? "",
      experience: exp,
      note: [
        province && `Provinsi: ${province}`,
        city && `Kota: ${city}`,
        certsBlock,
        videoLink && `Video: ${videoLink}`,
        motivation && `Motivasi: ${motivation}`,
      ].filter(Boolean).join("\n"),
      teaching_mode: teachingMode || null,
      can_teach_kids: canTeachKids === true,
      kids_tiers: canTeachKids === true ? kidsTiers : null,
    };

    try {
      const res = await fetch("/api/teacher-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error("Submit failed:", res.status, errData);
        if (res.status === 409 && errData.error === "duplicate") {
          const msg = STATUS_MESSAGES[errData.status] || "Email atau WhatsApp kamu sudah terdaftar.";
          alert(`${msg}\n\nKamu akan diarahkan ke Step 1 untuk mengganti kontak atau hubungi admin via WA.`);
          setStep(1);
          if (errData.field === "email") setEmailCheck({ status: "blocking", appStatus: errData.status });
          if (errData.field === "phone") setPhoneCheck({ status: "blocking", appStatus: errData.status });
          setLoading(false);
          return;
        }
        alert(errData.error || "Gagal mengirim pendaftaran. Silakan coba lagi atau hubungi kami langsung via WhatsApp.");
        setLoading(false);
        return;
      }
    } catch (e) {
      console.error(e);
      alert("Koneksi terputus. Cek internet kamu dan coba lagi.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setSuccess(true);

    const skillsText = validSkills.map(s => `${langNameBySlug(s.lang)} (${s.level})`).join(", ");
    const modeLabel = TEACHING_MODES.find(m => m.value === teachingMode)?.label ?? "-";
    const kidsLabel = canTeachKids
      ? kidsTiers.map(t => KIDS_TIERS.find(k => k.value === t)?.label).filter(Boolean).join(", ") || "Ya"
      : "Tidak";
    const certsText = validCerts.length > 0
      ? validCerts.map(c => `${c.name}: ${c.link}`).join("\n")
      : "-";
    const msg = `Halo, saya ${name} dan tertarik menjadi pengajar di Linguo.\n\nEmail: ${email}\nTelp: ${phone}\nProvinsi: ${province}\nKota: ${city}\nBahasa: ${skillsText}\nMode: ${modeLabel}\nMengajar Kids: ${kidsLabel}\nSertifikat:\n${certsText}\nPengalaman: ${exp}\nVideo: ${videoLink}\nMotivasi: ${motivation}`;
    setTimeout(() => window.open(waMsg(msg), "_blank"), 1000);
  };

  const fade = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };
  const slideIn = { initial: { opacity: 0, x: 30 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -30 }, transition: { duration: 0.3 } };

  // ====== LANDING VIEW (step === 0) ======
  if (step === 0) {
    return (
      <div className="min-h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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
    <div className="min-h-screen bg-slate-50 flex flex-col" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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
                    <input type="email" value={email}
                      onChange={e => onEmailChange(e.target.value)}
                      onBlur={handleEmailBlur}
                      placeholder="email@example.com"
                      className={`w-full border-2 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors ${
                        emailCheck.status === "blocking"
                          ? "border-red-300 focus:border-red-500 bg-red-50/30"
                          : emailCheck.status === "ok"
                          ? "border-green-300 focus:border-green-500"
                          : "border-slate-200 focus:border-[#1A9E9E]"
                      }`} />
                    {emailCheck.status === "checking" && (
                      <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                        <Loader2 className="animate-spin h-3 w-3" />
                        Mengecek email...
                      </p>
                    )}
                    {emailCheck.status === "ok" && (
                      <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Email belum terdaftar
                      </p>
                    )}
                    {emailCheck.status === "blocking" && (
                      <div className="mt-1.5 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs text-red-700 leading-relaxed flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>{STATUS_MESSAGES[emailCheck.appStatus!] || "Email ini sudah terdaftar di sistem kami."}</span>
                        </p>
                        <a href={waMsg(`Halo, saya cek pendaftaran pengajar dengan email ${email}`)} target="_blank"
                          className="inline-block mt-2 text-xs font-semibold text-red-700 underline hover:text-red-800">
                          Tanya admin via WhatsApp →
                        </a>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">No. WhatsApp *</label>
                    <input type="tel" value={phone}
                      onChange={e => onPhoneChange(e.target.value)}
                      onBlur={handlePhoneBlur}
                      placeholder="0812-3456-7890"
                      className={`w-full border-2 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors ${
                        phoneCheck.status === "blocking"
                          ? "border-red-300 focus:border-red-500 bg-red-50/30"
                          : phoneCheck.status === "ok"
                          ? "border-green-300 focus:border-green-500"
                          : "border-slate-200 focus:border-[#1A9E9E]"
                      }`} />
                    {phoneCheck.status === "checking" && (
                      <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                        <Loader2 className="animate-spin h-3 w-3" />
                        Mengecek nomor WhatsApp...
                      </p>
                    )}
                    {phoneCheck.status === "ok" && (
                      <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Nomor belum terdaftar
                      </p>
                    )}
                    {phoneCheck.status === "blocking" && (
                      <div className="mt-1.5 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs text-red-700 leading-relaxed flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>{STATUS_MESSAGES[phoneCheck.appStatus!] || "Nomor WhatsApp ini sudah terdaftar di sistem kami."}</span>
                        </p>
                        <a href={waMsg(`Halo, saya cek pendaftaran pengajar dengan WA ${phone}`)} target="_blank"
                          className="inline-block mt-2 text-xs font-semibold text-red-700 underline hover:text-red-800">
                          Tanya admin via WhatsApp →
                        </a>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Provinsi *</label>
                    <select value={province} onChange={e => { setProvince(e.target.value); setCity(""); }}
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors bg-white">
                      <option value="">Pilih provinsi...</option>
                      {WILAYAH_ID.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Kab/Kota Domisili *</label>
                    <select value={city} onChange={e => setCity(e.target.value)} disabled={!province}
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors bg-white disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed">
                      <option value="">{province ? "Pilih kab/kota..." : "Pilih provinsi dulu"}</option>
                      {(WILAYAH_ID.find(p => p.name === province)?.cities ?? []).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Bahasa & Kualifikasi */}
            {step === 2 && (
              <motion.div key="step2" {...slideIn} className="space-y-6">
                <div><h2 className="text-xl font-bold mb-1">Bahasa & Kualifikasi</h2><p className="text-sm text-slate-500">Pilih bahasa yang ingin kamu ajarkan</p></div>

                {/* BAHASA */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-2 block">Bahasa yang Dikuasai * (urutkan dari paling mahir, max 5)</label>
                  <div className="space-y-3">
                    {langSkills.map((skill, idx) => {
                      const usedLangs = langSkills.filter((_, i) => i !== idx).map(s => s.lang).filter(Boolean);
                      return (
                        <div key={idx} className="flex gap-2 items-start">
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-semibold text-slate-400 mb-1 block uppercase tracking-wide">
                                Bahasa #{idx + 1}{idx === 0 ? " (paling mahir)" : ""}
                              </label>
                              <LangPicker
                                value={skill.lang}
                                usedLangs={usedLangs}
                                onSelect={slug => updateLangSlot(idx, "lang", slug)}
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-slate-400 mb-1 block uppercase tracking-wide">Level</label>
                              <select value={skill.level} onChange={e => updateLangSlot(idx, "level", e.target.value)} disabled={!skill.lang}
                                className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors bg-white disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed">
                                <option value="">Pilih level...</option>
                                {LEVEL_OPTIONS.map(lv => (
                                  <option key={lv.value} value={lv.value}>{lv.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          {idx > 0 && (
                            <button type="button" onClick={() => removeLangSlot(idx)} aria-label="Hapus bahasa"
                              className="mt-6 h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {langSkills.length < 5 && (
                      <button type="button" onClick={addLangSlot}
                        className="text-sm text-[#1A9E9E] font-semibold hover:bg-[#1A9E9E]/5 px-4 py-2 rounded-lg transition-colors">
                        + Tambah bahasa
                      </button>
                    )}
                  </div>
                </div>

                {/* MODE MENGAJAR */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-2 block">Mode Mengajar *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {TEACHING_MODES.map(m => {
                      const selected = teachingMode === m.value;
                      const Icon = m.Icon;
                      return (
                        <button key={m.value} type="button" onClick={() => setTeachingMode(m.value)}
                          className={`text-center p-3 rounded-xl border-2 transition-all ${selected ? "bg-[#1A9E9E]/5 border-[#1A9E9E]" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                          <Icon strokeWidth={1.75} className={`h-7 w-7 mb-1.5 mx-auto ${selected ? "text-[#1A9E9E]" : "text-slate-500"}`} />
                          <p className="font-semibold text-xs">{m.label}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{m.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SERTIFIKAT BAHASA — multi-add, optional */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4" />
                    Sertifikat Bahasa <span className="font-normal text-slate-400">(opsional)</span>
                  </label>
                  <div className="mb-3 p-3 bg-amber-50/60 border border-amber-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Lampirkan link Google Drive untuk tiap sertifikat. Pastikan akses-nya di-set <strong>"Anyone with the link can view"</strong> — jangan private/gembok, biar tim kami bisa langsung buka tanpa request access.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {certificates.map((cert, idx) => (
                      <div key={idx} className="flex gap-2 items-start">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-5 gap-2">
                          <div className="sm:col-span-2">
                            <label className="text-[10px] font-semibold text-slate-400 mb-1 flex items-center gap-1 uppercase tracking-wide">
                              <Award className="h-3 w-3" /> Sertifikat #{idx + 1}
                            </label>
                            <input type="text" value={cert.name} onChange={e => updateCert(idx, "name", e.target.value)} placeholder="Contoh: JLPT N2"
                              className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
                          </div>
                          <div className="sm:col-span-3">
                            <label className="text-[10px] font-semibold text-slate-400 mb-1 flex items-center gap-1 uppercase tracking-wide">
                              <Link2 className="h-3 w-3" /> Link Google Drive
                            </label>
                            <input type="url" value={cert.link} onChange={e => updateCert(idx, "link", e.target.value)} placeholder="https://drive.google.com/..."
                              className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
                          </div>
                        </div>
                        {idx > 0 && (
                          <button type="button" onClick={() => removeCert(idx)} aria-label="Hapus sertifikat"
                            className="mt-6 h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                    {certificates.length < 5 && (
                      <button type="button" onClick={addCert}
                        className="text-sm text-[#1A9E9E] font-semibold hover:bg-[#1A9E9E]/5 px-4 py-2 rounded-lg transition-colors">
                        + Tambah sertifikat
                      </button>
                    )}
                  </div>
                </div>

                {/* BISA NGAJAR KIDS */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-2 block">Bisa Mengajar Anak-anak? *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => { setCanTeachKids(true); }}
                      className={`text-center p-3 rounded-xl border-2 transition-all ${canTeachKids === true ? "bg-amber-50 border-amber-400" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                      <Smile strokeWidth={1.75} className={`h-7 w-7 mb-1.5 mx-auto ${canTeachKids === true ? "text-amber-500" : "text-slate-500"}`} />
                      <p className="font-semibold text-sm">Ya, bisa</p>
                    </button>
                    <button type="button" onClick={() => { setCanTeachKids(false); setKidsTiers([]); }}
                      className={`text-center p-3 rounded-xl border-2 transition-all ${canTeachKids === false ? "bg-slate-100 border-slate-400" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                      <Ban strokeWidth={1.75} className={`h-7 w-7 mb-1.5 mx-auto ${canTeachKids === false ? "text-slate-600" : "text-slate-500"}`} />
                      <p className="font-semibold text-sm">Tidak / Hanya dewasa</p>
                    </button>
                  </div>

                  {canTeachKids === true && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
                      className="mt-3 p-4 bg-amber-50/50 border-2 border-amber-100 rounded-xl">
                      <label className="text-xs font-semibold text-amber-700 mb-2 block">Pilih kelompok usia yang bisa kamu ajar * (boleh pilih keduanya)</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {KIDS_TIERS.map(k => {
                          const selected = kidsTiers.includes(k.value);
                          const Icon = k.Icon;
                          return (
                            <button key={k.value} type="button" onClick={() => toggleKidsTier(k.value)}
                              className={`text-left p-3 rounded-xl border-2 transition-all flex items-start gap-2.5 ${selected ? "bg-white border-amber-400 ring-2 ring-amber-200" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                              <Icon strokeWidth={1.75} className={`h-7 w-7 flex-shrink-0 ${selected ? "text-amber-500" : "text-slate-500"}`} />
                              <div className="flex-1">
                                <p className="font-semibold text-sm">{k.label}</p>
                                <p className="text-xs text-slate-500">{k.age}</p>
                              </div>
                              {selected && <CheckCircle2 className="h-5 w-5 text-amber-500 flex-shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </div>
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
                    { label: "Provinsi", value: province || "-" },
                    { label: "Kota", value: city || "-" },
                    { label: "Bahasa", value: validSkills.map(s => `${langNameBySlug(s.lang)} (${s.level})`).join(", ") || "-" },
                    { label: "Mode Mengajar", value: TEACHING_MODES.find(m => m.value === teachingMode)?.label ?? "-" },
                    { label: "Sertifikat", value: validCerts.length > 0 ? validCerts.map(c => c.name).join(", ") : "-" },
                    { label: "Mengajar Kids", value: canTeachKids === true
                        ? (kidsTiers.length > 0
                          ? kidsTiers.map(t => KIDS_TIERS.find(k => k.value === t)?.label ?? t).join(", ")
                          : "Ya")
                        : "Tidak" },
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
                  <CheckCircle2 className="h-12 w-12 text-green-600" strokeWidth={2} />
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
                className="bg-[#1A9E9E] hover:bg-[#178888] text-white font-semibold px-8 py-3 rounded-full text-sm transition-all active:scale-95 disabled:opacity-70 flex items-center gap-2">
                {loading && <Loader2 className="animate-spin h-4 w-4" />}
                {loading ? "Mengirim..." : "Kirim Pendaftaran →"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
