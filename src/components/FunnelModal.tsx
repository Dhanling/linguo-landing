"use client";
/* linguo-patch:funnel-native-v1 */
import { supabase } from "@/lib/supabase-client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, X, Search } from "lucide-react";
// linguo-patch:private-pricing-v1 — harga Private mengikuti kategori bahasa
// (bukan flat Rp90k). Rp90k hanya valid utk bahasa daerah / kategori D.
import { getLanguageCategory, PRICE_A1_60MIN } from "@/lib/trial-pricing";
import { useOverlayLock } from "@/lib/overlayStore";

const SUPABASE_URL = "https://jbtgciepdmqxxcjflrxz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpidGdjaWVwZG1xeHhjamZscnh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzE1MjMsImV4cCI6MjA5MDYwNzUyM30.29Md_mApQjnCoCzYAKcvLU2CB7Y3KZzyepSMcvV_7hs";

async function saveLead(data: {wa_number:string; language?:string; name?:string; email?:string; program?:string; level?:string; teacher_type?:string|null; referral_source?:string; ref_code?:string}) {
  try {
    const ref = new URLSearchParams(window.location.search).get("ref") || localStorage.getItem("linguo_ref") || undefined;
    if (ref) localStorage.setItem("linguo_ref", ref);
    await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({ ...data, source: "landing-page", referral_source: data.referral_source || ref || null }),
    });
  } catch (e) { console.error("Lead save failed:", e); }
}

const LANG_CATEGORIES = [
  { label: "Populer", langs: ["English","Japanese","Korean","Mandarin","Arabic","French","German","Spanish"] },
  { label: "Asia", langs: ["Japanese","Korean","Mandarin","Cantonese","Arabic","Thai","Vietnamese","Hindi","Turkish","Hebrew","Persian","Tagalog","Malay","Georgian","Urdu","Bengali"] },
  { label: "Eropa", langs: ["English","French","German","Spanish","Italian","Dutch","Portuguese","Russian","Polish","Swedish","Norwegian","Danish","Finnish","Greek","Czech","Hungarian","Romanian"] },
  { label: "Nusantara", langs: ["Javanese","Sundanese","Betawi","BIPA"] },
  { label: "Afrika", langs: ["Swahili"] },
];

// linguo-patch:reguler-lang-gate-v1 — Kelas Reguler cuma dibuka utk bahasa yg ada di jadwal reguler
// (samain dgn tabel regular_batches). Bahasa Isyarat ga masuk picker funnel ini → daftarnya lewat /jadwal-kelas-reguler.
const REGULER_LANGS = ["English","Mandarin","Japanese","Korean","Arabic","French","German","Italian","Dutch","Spanish","Tagalog"];

const FLAG_CODES: Record<string,string> = {
  English:"gb",Japanese:"jp",Korean:"kr",Mandarin:"cn",Cantonese:"hk",Arabic:"sa",French:"fr",German:"de",Spanish:"es",Italian:"it",Dutch:"nl",Portuguese:"br",Russian:"ru",Thai:"th",Vietnamese:"vn",Hindi:"in",Turkish:"tr",Polish:"pl",Swedish:"se",Norwegian:"no",Danish:"dk",Finnish:"fi",Greek:"gr",Czech:"cz",Hungarian:"hu",Hebrew:"il",Persian:"ir",Swahili:"ke",Tagalog:"ph",Malay:"my",Georgian:"ge",Javanese:"id",Sundanese:"id",Betawi:"id",BIPA:"id",Urdu:"pk",Bengali:"bd",Romanian:"ro",
  Inggris:"gb",Jepang:"jp",Korea:"kr",Arab:"sa",Prancis:"fr",Jerman:"de",Spanyol:"es",Italia:"it",Belanda:"nl",Portugis:"br",Rusia:"ru",Thailand:"th",Vietnam:"vn",Turki:"tr",Polandia:"pl",Swedia:"se",Norwegia:"no",Denmark:"dk",Finlandia:"fi",Yunani:"gr",Ceko:"cz",Hungaria:"hu",Ibrani:"il",Persia:"ir",Filipina:"ph",Melayu:"my",Georgia:"ge",Jawa:"id",Sunda:"id",Pakistan:"pk",Bangladesh:"bd",Rumania:"ro"
};
function getFlagCode(name:string){return FLAG_CODES[name]||"un"}

export default function FunnelModal({open,onClose,initialProgram="",initialLang="",initialLevel="",initialPreferredProg="",initialSource="",initialName="",initialWa=""}:{open:boolean;onClose:()=>void;initialProgram?:string;initialLang?:string;initialLevel?:string;initialPreferredProg?:string;initialSource?:string;initialName?:string;initialWa?:string}) {
  // Detect initial step dari props biar gak flash step 1 dulu pas open
  const initialStep = (() => {
    if (initialLang && initialLevel && initialPreferredProg) return 5;
    if (initialLang && initialProgram) return 3;
    if (initialLang) return 2;
    return 1;
  })();
  const [step, setStep] = useState(initialStep);
  const [selLang, setSelLang] = useState(initialLang || "");
  const [selProgram, setSelProgram] = useState(initialProgram || initialPreferredProg || "");
  const [selLevel, setSelLevel] = useState(initialLevel || "");
  const [formName, setFormName] = useState(initialName || "");
  const [formEmail, setFormEmail] = useState("");
  const [formWa, setFormWa] = useState(initialWa || "");
  const [countryCode, setCountryCode] = useState("+62");
  // referral-code-field-v1 — optional kode referral; auto-prefill dari ?ref= URL param
  // (atau linguo_ref yg sudah tersimpan di localStorage saat halaman dibuka).
  const [refCode, setRefCode] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("ref") || localStorage.getItem("linguo_ref") || "";
  });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Populer");
  const [selTeacherType, setSelTeacherType] = useState<"lokal"|"native">("lokal");
  const [teacherPick, setTeacherPick] = useState(false);

  // [ling-hide-fab-overlay-v1] daftarin overlay global → sembunyiin FAB WhatsApp
  useOverlayLock(open);

  useEffect(() => {
    if (open) {
      if (initialLang && initialLevel && initialPreferredProg) {
        setSelLang(initialLang);
        setSelLevel(initialLevel);
        setSelProgram(initialPreferredProg);
        setStep(5);
      } else if (initialLang && initialProgram) {
        setSelLang(initialLang); setSelProgram(initialProgram); setStep(3);
      } else if (initialLang) {
        setSelLang(initialLang); setStep(2);
      } else if (initialProgram) {
        setSelProgram(initialProgram); setStep(1);
      }
      if (initialName) setFormName(initialName);
      if (initialWa) setFormWa(initialWa);
    }
    if (!open) { setStep(1); setSelProgram(""); setSelLang(""); setSelLevel(""); setSelTeacherType("lokal"); setTeacherPick(false); }
  }, [open, initialProgram, initialLang, initialLevel, initialPreferredProg, initialName, initialWa]);

  const filtered = search.trim()
    ? LANG_CATEGORIES.flatMap(c=>c.langs).filter((v,i,a)=>a.indexOf(v)===i).filter(l=>l.toLowerCase().includes(search.toLowerCase()))
    : LANG_CATEGORIES.find(c=>c.label===activeTab)?.langs || [];

  const isEnglish = selLang==="English";

  // Pengajar native: terbatas ke bahasa yang sudah punya native teacher.
  // Native = NATIVE_MULTIPLIER x tarif lokal (konsisten dgn /harga).
  const NATIVE_AVAILABLE_LANGS = ["English","Tagalog","Spanish","Arabic"];
  const NATIVE_MULTIPLIER = 2;
  // linguo-patch:private-pricing-v1 — harga per sesi 60 menit, level A1, sesuai
  // kategori bahasa yg dipilih siswa. Level dipilih SETELAH langkah ini, jadi
  // angka ini adalah harga "Mulai dari". Fallback "C" (Rp100rb) bila bahasa
  // belum dikenal — JANGAN fallback ke D (Rp90rb), itu sumber bug-nya.
  const PRIVATE_BASE_PRICE = PRICE_A1_60MIN[getLanguageCategory(selLang) || "C"] ?? 100000;
  const nativeAvailable = NATIVE_AVAILABLE_LANGS.includes(selLang);
  const fmtRp = (n:number) => "Rp " + n.toLocaleString("id-ID");

  const isReguler = REGULER_LANGS.includes(selLang); // bahasa ini punya Kelas Reguler?
  const programs = [
    {id:"Kelas Private",icon:"🎓",title:"Kelas Private",desc:"1-on-1 via Zoom, jadwal fleksibel",price:"Mulai "+fmtRp(PRIVATE_BASE_PRICE)+"/sesi",highlight:true},
    ...(isReguler?[{id:"Kelas Reguler",icon:"👥",title:"Kelas Reguler",desc:"Grup class, jadwal tetap, lebih terjangkau",price:"Rp 150.000/2 bulan",highlight:false,note:"*Kelas dibuka minimal 8 peserta"}]:[]),
    {id:"Kelas Kids",icon:"🧒",title:"Kelas Kids",desc:"1-on-1 untuk anak 5-12 tahun, fun & interaktif",price:"Mulai Rp 75.000/sesi",highlight:false},
    ...(isEnglish?[{id:"IELTS/TOEFL Prep",icon:"📝",title:"IELTS / TOEFL Prep",desc:"16 sesi @90 menit, persiapan intensif",price:"Rp 300.000/2 bulan",highlight:false}]:[]),
  ];

  const levels = selProgram==="Kelas Reguler"
    ? [{id:"A1",label:"A1 — Basic",desc:"Pemula, mulai dari nol"}]
    : selProgram==="Kelas Kids"
    ? [{id:"Little Learner",label:"🐣 Little Learner",desc:"Usia 5–8 tahun • 30 menit • Rp 75.000/sesi"},
       {id:"Young Explorer",label:"🚀 Young Explorer",desc:"Usia 9–12 tahun • 45 menit • Rp 85.000/sesi"}]
    : [{id:"A1",label:"A1 — Basic",desc:"Pemula, mulai dari nol"},
       {id:"A2",label:"A2 — Elementary",desc:"Percakapan sederhana"},
       {id:"B1",label:"B1 — Intermediate",desc:"Percakapan sehari-hari"},
       {id:"B2",label:"B2 — Upper Intermediate",desc:"Lancar & kompleks"}];

  const validateForm = () => {
    if(!formName.trim()) { setFormError("Masukkan nama lengkap"); return false; }
    if(!formEmail.trim() || !formEmail.includes("@")) { setFormError("Masukkan email yang valid"); return false; }
    if(!formWa || formWa.length < 9) { setFormError("Masukkan nomor WhatsApp yang valid"); return false; }
    if(countryCode==="+62" && formWa[0]!=="8") { setFormError("Nomor Indonesia harus diawali 8"); return false; }
    setFormError("");
    return true;
  };

  const handleFinal = async () => {
    setSaving(true);
    try {
      const fullNum = countryCode.replace("+","") + formWa;
      try {
        await saveLead({
          wa_number: fullNum,
          name: formName,
          email: formEmail,
          language: selLang,
          program: selProgram,
          level: selLevel,
          teacher_type: selProgram==="Kelas Private" ? selTeacherType : null,
          ref_code: refCode.trim() || undefined, // referral-code-field-v1 — TODO: ensure ref_code column exists in leads table
        });
      } catch (leadErr) {
        console.error("Lead save failed (non-blocking):", leadErr);
      }
      const teacherLine = selProgram==="Kelas Private"
        ? "👨‍🏫 Pengajar: " + (selTeacherType==="native"?"Native Speaker":"Lokal") + "\n"
        : "";
      const waMsg =
        "Halo Admin Linguo, saya tertarik mendaftar:\n\n" +
        "📚 Program: " + selProgram + "\n" +
        teacherLine +
        "🌏 Bahasa: " + selLang + "\n" +
        "📊 Level: " + selLevel + "\n" +
        "🙋 Nama: " + formName + "\n" +
        "📧 Email: " + formEmail + "\n\n" +
        "Mohon info pembayaran & jadwalnya. Terima kasih!";
      window.location.href = "https://wa.me/6282116859493?text=" + encodeURIComponent(waMsg);
    } catch(e) {
      console.error("Submit error:", e);
      alert("Terjadi kesalahan. Silakan coba lagi.");
      setSaving(false);
    }
  };

  const handleGoogleSignIn = async () => {
    document.cookie = "linguo_funnel=" + encodeURIComponent(JSON.stringify({ program: selProgram, language: selLang, level: selLevel })) + ";path=/;max-age=600;SameSite=Lax";
    if(typeof window!=="undefined"&&(window as any).gtag)(window as any).gtag("event","funnel_form_submitted",{program:selProgram,language:selLang,level:selLevel});
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/akun" },
    });
  };

  const handleClose = () => { onClose(); setStep(1); setSearch(""); setSelLang(""); setSelProgram(""); setSelLevel(""); setFormName(""); setFormEmail(""); setFormWa(""); setFormError(""); setSelTeacherType("lokal"); setTeacherPick(false); };

  return (
    <AnimatePresence>{open&&(
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center px-4"
        onClick={handleClose}>
        <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}}
          className="bg-white rounded-3xl max-w-lg w-full shadow-2xl relative overflow-hidden max-h-[85vh] flex flex-col"
          onClick={(e)=>e.stopPropagation()}>

          <div className="flex gap-1.5 px-6 pt-5">
            {[1,2,3,4,5].map(s=>(
              <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-500 ${s<=step?"bg-[#1A9E9E]":"bg-slate-200"}`}/>
            ))}
          </div>

          <button onClick={handleClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10"><X className="h-5 w-5"/></button>

          {step===1 && (
            <motion.div key="s1" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 pb-4">
                <h3 className="text-xl font-bold text-slate-900 mb-1">Mau belajar bahasa apa?</h3>
                <p className="text-sm text-slate-500 mb-4">Pilih bahasa yang kamu minati</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
                  <input type="text" placeholder="Cari bahasa..." value={search} onChange={(e)=>setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/20"/>
                </div>
              </div>
              {!search.trim() && (
                <div className="px-6 flex gap-2 mb-3 overflow-x-auto pb-1">
                  {LANG_CATEGORIES.map(c=>(
                    <button key={c.label} onClick={()=>setActiveTab(c.label)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${activeTab===c.label?"bg-[#1A9E9E] text-white":"bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
              <div className="px-6 pb-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-2">
                  {filtered.map(l=>(
                    <button key={l} onClick={()=>{
                      setSelLang(l); setSearch("");
                      // kalau program udah ke-preset "Kelas Reguler" tapi bahasa ini ga ada kelas regulernya,
                      // batalin presetnya & arahin ke step pilih program (Reguler ga akan muncul di sana).
                      const prog = (selProgram==="Kelas Reguler" && !REGULER_LANGS.includes(l)) ? "" : selProgram;
                      if(prog!==selProgram) setSelProgram(prog);
                      if(prog==="Kelas Private"){setTeacherPick(true);setStep(2)} else {setStep(prog?3:2)}
                    }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all text-left border border-slate-100 text-slate-700 hover:bg-[#1A9E9E]/5 hover:text-[#1A9E9E] hover:border-[#1A9E9E]/30">
                      <img src={`https://flagcdn.com/w40/${getFlagCode(l)}.png`} alt="" className="h-6 w-6 rounded-full object-cover"/>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step===2 && !teacherPick && (
            <motion.div key="s2" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} className="p-6 flex-1">
              <button onClick={()=>setStep(1)} className="text-sm text-[#1A9E9E] font-medium mb-3 flex items-center gap-1 hover:underline">← Ganti bahasa</button>
              <div className="flex items-center gap-2 mb-4">
                <img src={`https://flagcdn.com/w40/${getFlagCode(selLang)}.png`} alt="" className="h-6 w-6 rounded-full object-cover"/>
                <span className="font-bold">{selLang}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Pilih jenis kelas</h3>
              <p className="text-sm text-slate-500 mb-6">Mau belajar dengan cara apa?</p>
              <div className="flex flex-col gap-3">
                {programs.map(p=>(
                  <button key={p.id} onClick={()=>{ if(p.id==="Kelas Private"){ setSelProgram(p.id); setTeacherPick(true); } else { setSelProgram(p.id); setSelTeacherType("lokal"); setStep(3); } }}
                    className={`flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all hover:border-[#1A9E9E]/40 hover:shadow-md ${p.highlight?"border-[#1A9E9E]/20 bg-[#1A9E9E]/[0.02]":"border-slate-100"}`}>
                    <span className="text-2xl mt-0.5">{p.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-sm">{p.title}</p>
                        {p.highlight && <span className="text-[10px] font-bold bg-[#1A9E9E] text-white px-2 py-0.5 rounded-full">POPULER</span>}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{p.desc}</p>
                      <p className="text-sm font-bold text-[#1A9E9E] mt-2">{p.price}</p>
                      {"note" in p && p.note && <p className="text-[10px] text-slate-400 mt-1">{p.note}</p>}
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 mt-1 shrink-0"/>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2b — Pilih Tipe Pengajar (khusus Kelas Private) */}
          {step===2 && teacherPick && (
            <motion.div key="s2b" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} className="p-6 flex-1 overflow-y-auto">
              <button onClick={()=>setTeacherPick(false)} className="text-sm text-[#1A9E9E] font-medium mb-3 flex items-center gap-1 hover:underline">← Ganti program</button>
              <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 mb-5">
                <img src={`https://flagcdn.com/w40/${getFlagCode(selLang)}.png`} alt="" className="h-5 w-5 rounded-full object-cover"/>
                <span className="text-sm font-medium">{selLang}</span>
                <span className="text-slate-300">•</span>
                <span className="text-sm text-[#1A9E9E] font-medium">Kelas Private</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Pilih tipe pengajar</h3>
              <p className="text-sm text-slate-500 mb-5">Mau belajar dengan pengajar lokal atau native speaker?</p>
              <div className="flex flex-col gap-3">
                {/* Lokal */}
                <button onClick={()=>{setSelTeacherType("lokal");setTeacherPick(false);setStep(3)}}
                  className="flex items-start gap-4 p-4 rounded-2xl border-2 border-slate-100 text-left transition-all hover:border-[#1A9E9E]/40 hover:shadow-md">
                  <span className="text-2xl mt-0.5">👩‍🏫</span>
                  <div className="flex-1">
                    <p className="font-bold text-sm">Pengajar Lokal</p>
                    <p className="text-xs text-slate-500 mt-0.5">Pengajar Indonesia berpengalaman & bersertifikat</p>
                    <p className="text-sm font-bold text-[#1A9E9E] mt-2">Mulai {fmtRp(PRIVATE_BASE_PRICE)}/sesi</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 mt-1 shrink-0"/>
                </button>
                {/* Native */}
                {nativeAvailable ? (
                  <button onClick={()=>{setSelTeacherType("native");setTeacherPick(false);setStep(3)}}
                    className="flex items-start gap-4 p-4 rounded-2xl border-2 border-[#fbbf24]/50 bg-[#fbbf24]/[0.04] text-left transition-all hover:border-[#fbbf24] hover:shadow-md">
                    <span className="text-2xl mt-0.5">🌏</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-sm">Pengajar Native</p>
                        <span className="text-[10px] font-bold bg-[#fbbf24] text-slate-900 px-2 py-0.5 rounded-full shrink-0">FULL IMMERSION</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Diajar langsung oleh penutur asli bersertifikat</p>
                      <p className="text-[11px] text-slate-400 italic leading-relaxed mt-1.5">Native speaker classes are conducted fully in your target language by a certified native teacher — full immersion for authentic pronunciation and fluency.</p>
                      <p className="text-sm font-bold text-[#1A9E9E] mt-2">Mulai {fmtRp(PRIVATE_BASE_PRICE*NATIVE_MULTIPLIER)}/sesi</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 mt-1 shrink-0"/>
                  </button>
                ) : (
                  <div className="flex items-start gap-4 p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 text-left opacity-70 cursor-not-allowed">
                    <span className="text-2xl mt-0.5 grayscale">🌏</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-sm text-slate-500">Pengajar Native</p>
                        <span className="text-[10px] font-bold bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full shrink-0">COMING SOON</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">Pengajar native untuk {selLang} belum tersedia. Saat ini hanya English, Tagalog, Spanish & Arabic.</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {step===3 && (
            <motion.div key="s3" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} className="p-6 flex-1">
              <button onClick={()=>{ if(selProgram==="Kelas Private"){ setTeacherPick(true); } setStep(2); }} className="text-sm text-[#1A9E9E] font-medium mb-3 flex items-center gap-1 hover:underline">← Ganti program</button>
              <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 mb-5">
                <img src={`https://flagcdn.com/w40/${getFlagCode(selLang)}.png`} alt="" className="h-5 w-5 rounded-full object-cover"/>
                <span className="text-sm font-medium">{selLang}</span>
                <span className="text-slate-300">•</span>
                <span className="text-sm text-[#1A9E9E] font-medium">{selProgram}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">{selProgram==="Kelas Kids"?"Pilih jenis kelas":"Pilih level"}</h3>
              <p className="text-sm text-slate-500 mb-6">{selProgram==="Kelas Kids"?"Sesuaikan dengan usia anak":"Mulai dari mana?"}</p>
              <div className="flex flex-col gap-3">
                {levels.map(lv=>(
                  <button key={lv.id} onClick={()=>{setSelLevel(lv.id);setStep(4)}}
                    className="flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 text-left transition-all hover:border-[#1A9E9E]/40 hover:shadow-md">
                    <div className="h-10 w-10 rounded-full bg-[#1A9E9E]/10 flex items-center justify-center text-sm font-bold text-[#1A9E9E]">{selProgram==="Kelas Kids"?(lv.id==="Little Learner"?"🐣":"🚀"):lv.id}</div>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{lv.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{lv.desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 shrink-0"/>
                  </button>
                ))}
              </div>
              {selProgram==="Kelas Reguler" && <p className="text-xs text-slate-400 mt-4 text-center">*Kelas Reguler saat ini tersedia untuk level A1</p>}
            </motion.div>
          )}

          {step===4 && (
            <motion.div key="s4" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} className="p-6 flex-1 overflow-y-auto">
              <button onClick={()=>setStep(3)} className="text-sm text-[#1A9E9E] font-medium mb-3 flex items-center gap-1 hover:underline">← Ganti level</button>
              <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2.5 mb-5 text-xs">
                <img src={`https://flagcdn.com/w40/${getFlagCode(selLang)}.png`} alt="" className="h-4 w-4 rounded-full object-cover"/>
                <span className="font-medium">{selLang}</span>
                <span className="text-slate-300">•</span>
                <span className="text-[#1A9E9E] font-medium">{selProgram}</span>
                <span className="text-slate-300">•</span>
                <span>{selLevel}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Lengkapi data diri</h3>
              <p className="text-sm text-slate-500 mb-5">Isi data di bawah agar tim kami bisa menghubungimu</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Nama Lengkap</label>
                  <button onClick={handleGoogleSignIn} type="button"
                  className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition-all active:scale-[0.98] mb-3">
                  <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Daftar dengan Google
                </button>
                <div className="flex items-center gap-3 mb-3"><div className="flex-1 h-px bg-slate-200"></div><span className="text-xs text-slate-400">atau isi manual</span><div className="flex-1 h-px bg-slate-200"></div></div>
                <input type="text" placeholder="John Doe" value={formName} onChange={(e)=>{setFormName(e.target.value);setFormError("")}}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/20"/>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Email</label>
                  <input type="email" placeholder="john@email.com" value={formEmail} onChange={(e)=>{setFormEmail(e.target.value);setFormError("")}}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/20"/>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Nomor WhatsApp</label>
                  <div className="flex gap-0">
                    <select value={countryCode} onChange={(e)=>setCountryCode(e.target.value)}
                      className="bg-slate-100 rounded-l-xl px-3 text-sm font-medium text-slate-600 border border-r-0 border-slate-200 focus:outline-none cursor-pointer appearance-none w-[68px] text-center">
                      {["+62","+60","+65","+66","+81","+82","+86","+91","+1","+44","+61","+49","+33","+971","+966","+7","+55","+234"].map(c=>(
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <input type="tel" placeholder="812-3456-7890" value={formWa}
                      onChange={(e)=>{setFormWa(e.target.value.replace(/[^0-9]/g,"").replace(/^0/,""));setFormError("")}}
                      className="flex-1 px-4 py-3 rounded-r-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/20"/>
                  </div>
                </div>
                {/* referral-code-field-v1 — optional, muncul di semua program (step data diri shared) */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Kode Referral (opsional)</label>
                  <input type="text" placeholder="Masukkan kode referral jika ada" value={refCode}
                    onChange={(e)=>setRefCode(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E]"/>
                  <p className="text-xs text-slate-400 mt-1">Dapatkan dari teman atau afiliator Linguo</p>
                </div>
              </div>
              {formError && <p className="text-red-500 text-xs mt-2">{formError}</p>}
              <button onClick={()=>{if(validateForm()) setStep(5)}}
                className="w-full mt-5 bg-[#1A9E9E] hover:bg-[#178888] text-white font-bold py-3.5 rounded-full text-sm transition-all active:scale-95 shadow-lg shadow-[#1A9E9E]/25">
                Lanjut ke Konfirmasi →
              </button>
            </motion.div>
          )}

          {step===5 && (
            <motion.div key="s5" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} className="p-6 flex-1">
              <button onClick={()=>setStep(4)} className="text-sm text-[#1A9E9E] font-medium mb-3 flex items-center gap-1 hover:underline">← Edit data</button>
              <div className="text-center mb-5">
                <span className="text-4xl mb-2 block">🎉</span>
                <h3 className="text-xl font-bold text-slate-900">Konfirmasi Pendaftaran</h3>
                <p className="text-sm text-slate-500 mt-1">Pastikan data di bawah sudah benar</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-5 mb-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Nama</span>
                  <span className="text-sm font-medium">{formName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Email</span>
                  <span className="text-sm font-medium">{formEmail}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">WhatsApp</span>
                  <span className="text-sm font-medium">{countryCode}{formWa}</span>
                </div>
                <div className="border-t border-slate-200 pt-2.5 mt-2.5"/>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Bahasa</span>
                  <span className="text-sm font-medium flex items-center gap-2">
                    <img src={`https://flagcdn.com/w40/${getFlagCode(selLang)}.png`} alt="" className="h-4 w-4 rounded-full object-cover"/>{selLang}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Program</span>
                  <span className="text-sm font-medium text-[#1A9E9E]">{selProgram}</span>
                </div>
                {selProgram==="Kelas Private" && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Pengajar</span>
                    <span className="text-sm font-medium">{selTeacherType==="native"?"Native Speaker":"Lokal"}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Level</span>
                  <span className="text-sm font-medium">{selLevel}</span>
                </div>
              </div>
              <button onClick={handleFinal} disabled={saving}
                className="w-full bg-[#fbbf24] hover:bg-[#f59e0b] disabled:opacity-50 text-slate-900 font-bold py-3.5 rounded-full text-sm transition-all active:scale-95 shadow-lg">
                {saving ? "Memproses pembayaran..." : "Bayar Sekarang →"}
              </button>
              <p className="text-[11px] text-slate-400 text-center mt-3">Kamu akan diarahkan ke halaman pembayaran Xendit</p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    )}</AnimatePresence>
  );
}
