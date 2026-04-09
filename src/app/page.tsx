"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, ChevronDown, ChevronLeft, ChevronRight, MessageCircle, Mail, Star, Check, ArrowRight, ArrowUp, Menu, X, Zap, AtSign } from "lucide-react";

const LANGUAGES = [
  {name:"English",flag:"🇬🇧"},{name:"Japanese",flag:"🇯🇵"},{name:"Korean",flag:"🇰🇷"},{name:"Mandarin",flag:"🇨🇳"},{name:"Arabic",flag:"🇸🇦"},{name:"French",flag:"🇫🇷"},
  {name:"German",flag:"🇩🇪"},{name:"Spanish",flag:"🇪🇸"},{name:"Italian",flag:"🇮🇹"},{name:"Dutch",flag:"🇳🇱"},{name:"Portuguese",flag:"🇧🇷"},{name:"Russian",flag:"🇷🇺"},
  {name:"Thai",flag:"🇹🇭"},{name:"Vietnamese",flag:"🇻🇳"},{name:"Hindi",flag:"🇮🇳"},{name:"Turkish",flag:"🇹🇷"},{name:"Polish",flag:"🇵🇱"},{name:"Swedish",flag:"🇸🇪"},
  {name:"Norwegian",flag:"🇳🇴"},{name:"Danish",flag:"🇩🇰"},{name:"Finnish",flag:"🇫🇮"},{name:"Greek",flag:"🇬🇷"},{name:"Czech",flag:"🇨🇿"},{name:"Hungarian",flag:"🇭🇺"},
  {name:"Hebrew",flag:"🇮🇱"},{name:"Persian",flag:"🇮🇷"},{name:"Swahili",flag:"🇰🇪"},{name:"Tagalog",flag:"🇵🇭"},{name:"Malay",flag:"🇲🇾"},{name:"Georgian",flag:"🇬🇪"},
  {name:"Javanese",flag:"🌺"},{name:"Sundanese",flag:"🌺"},{name:"BIPA",flag:"🇮🇩"},{name:"Urdu",flag:"🇵🇰"},{name:"Bengali",flag:"🇧🇩"},{name:"Romanian",flag:"🇷🇴"},
];
const TEACHERS = [
  {name:"Febri Darusman",role:"Spanish & Thai",flags:"🇪🇸🇹🇭"},{name:"Nitalia Wijaya",role:"Korean & English",flags:"🇰🇷🇬🇧"},
  {name:"Angga",role:"Chinese & Korean",flags:"🇨🇳🇰🇷"},{name:"Paramita Wulandari",role:"Japanese & Portuguese",flags:"🇯🇵🇧🇷"},
  {name:"Thifal Syahla",role:"English & Persian",flags:"🇬🇧🇮🇷"},{name:"Yeremia Immanuel",role:"French & Swahili",flags:"🇫🇷🇰🇪"},
];
const FEATURES = ["Recording Class/sesi","Interactive Class via ZOOM","Soft file Materi Pembelajaran","Request Jadwal & Topik","Qualified Teacher","E-Certificate","Bebas Pilih 55+ Bahasa"];
const PLANS = [
  {name:"Per Sesi",desc:"Coba dulu 1 sesi",price:"Rp 90.000",highlighted:true},
  {name:"5 Sesi",desc:"Hemat buat rutin",price:"Rp 400.000",highlighted:false},
  {name:"10 Sesi",desc:"Serius & lebih hemat",price:"Rp 750.000",highlighted:false},
  {name:"20 Sesi",desc:"Best value",price:"Rp 1.400.000",highlighted:false},
];
const FAQS = [
  {q:"Apa itu Linguo.id?",a:"Linguo.id adalah platform kursus bahasa online pertama di Indonesia dengan 55+ pilihan bahasa dan metode interaktif."},
  {q:"Boleh ikut lebih dari 1 bahasa?",a:"Boleh banget! Kamu bisa daftar beberapa bahasa sekaligus."},
  {q:"Bagaimana format kelasnya?",a:"Kelas Private 1-on-1 via Zoom. Request jadwal & topik sesukamu. Dapat rekaman & materi."},
  {q:"Dapat sertifikat?",a:"Ya! Setiap siswa yang menyelesaikan kursus mendapat e-certificate."},
  {q:"Cara bayarnya?",a:"Transfer bank, QRIS, GoPay, OVO, dan lainnya. Konfirmasi otomatis."},
  {q:"Ada kelas lanjutan?",a:"Ada! Tersedia dari Basic hingga Advance."},
];

function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const fn = () => setScrolled(window.scrollY > 80); window.addEventListener("scroll", fn); return () => window.removeEventListener("scroll", fn); }, []);
  const c = scrolled;
  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Announcement Bars */}
      {!c && <>
        <div className="bg-[#22c55e] text-white text-center py-2 text-xs sm:text-sm font-medium">
          🎓 Penutupan Kelas Reguler Batch April — <a href="https://wa.me/6282116859493" target="_blank" className="underline font-bold">Daftar Sekarang!</a>
        </div>
        <div className="bg-[#eab308] text-white text-center py-2 text-xs sm:text-sm font-medium">
          📝 Kelas IELTS / TOEFL Prep Class Batch April — <a href="https://wa.me/6282116859493" target="_blank" className="underline font-bold">Info Selengkapnya</a>
        </div>
      </>}
      {/* Main Nav */}
      <nav className={`transition-all duration-300 ${c ? "bg-white shadow-sm" : "bg-[#1A9E9E]"}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center">
            <img src="/images/logo-white.png" alt="Linguo" className={`h-10 object-contain transition-all ${c?"brightness-0":""}`} />
          </a>
          <div className="hidden md:flex items-center gap-7">
            {[["Private Class","#produk"],["Career","#teacher"],["Blog","#faq"],["Corporate","#bahasa"]].map(([l,h]) => (
              <a key={l} href={h} className={`text-sm font-medium ${c?"text-slate-600 hover:text-slate-900":"text-white/80 hover:text-white"} transition-colors`}>{l}</a>
            ))}
            <div className={`flex items-center gap-1.5 text-sm ${c?"text-slate-500":"text-white/70"}`}>
              <span>Site Language:</span>
              <span className="text-lg">🇬🇧</span>
            </div>
          </div>
          <button className="md:hidden" onClick={()=>setOpen(!open)}>{open?<X className={`h-5 w-5 ${c?"text-slate-900":"text-white"}`}/>:<Menu className={`h-5 w-5 ${c?"text-slate-900":"text-white"}`}/>}</button>
        </div>
        <AnimatePresence>{open&&(<motion.div initial={{height:0}} animate={{height:"auto"}} exit={{height:0}} className="md:hidden bg-white border-t overflow-hidden">
          <div className="px-6 py-4 flex flex-col gap-2">
            {["Private Class","Career","Blog","Corporate"].map(n=>(<a key={n} href="#" className="text-sm py-2.5" onClick={()=>setOpen(false)}>{n}</a>))}
            <a href="https://wa.me/6282116859493" className="mt-2 bg-[#1A9E9E] text-white text-center py-3 rounded-full font-semibold text-sm">Daftar Sekarang</a>
          </div>
        </motion.div>)}</AnimatePresence>
      </nav>
    </div>
  );
}

function FAQ({q,a}:{q:string;a:string}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-200">
      <button onClick={()=>setOpen(!open)} className="flex items-center justify-between w-full py-6 text-left">
        <span className="text-base font-semibold pr-4">{q}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${open?"rotate-180":""}`}/>
      </button>
      <AnimatePresence>{open&&(<motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
        <p className="pb-6 text-sm text-slate-500 leading-relaxed">{a}</p>
      </motion.div>)}</AnimatePresence>
    </div>
  );
}

export default function Home() {
  const [st, setSt] = useState(false);
  useEffect(()=>{const fn=()=>setSt(window.scrollY>400);window.addEventListener("scroll",fn);return()=>window.removeEventListener("scroll",fn);},[]);

  return (<>
    <Navbar/>

    {/* HERO */}
    <section className="bg-[#1A9E9E] min-h-[92vh] flex items-center relative overflow-hidden pt-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-[1fr_1.2fr] gap-4 items-center py-16 lg:py-0">
        <motion.div initial={{opacity:0,x:-30}} animate={{opacity:1,x:0}} transition={{duration:0.7}}>
          <h1 className="text-4xl sm:text-5xl lg:text-[3.8rem] font-extrabold text-white leading-[1.08] mb-6">
            Belajar 55+<br/>bahasa online<br/>rasa offline!
          </h1>
          <p className="text-white/80 text-lg mb-8 max-w-md">Linguo akan membantumu lebih cepat bisa cas cis cus dalam belajar bahasa :)</p>
          <div className="flex flex-wrap gap-3">
            <a href="#produk" className="inline-flex items-center gap-2.5 bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold px-8 py-4 rounded-full text-sm transition-all active:scale-95 shadow-lg shadow-yellow-500/25"><img src="/images/flag-icon.png" alt="" className="h-5 w-5"/> Mulai Belajar</a>
            <a href="#bahasa" className="inline-flex items-center gap-2.5 bg-white hover:bg-white/90 text-slate-700 font-semibold px-8 py-4 rounded-full text-sm transition-all active:scale-95"><img src="/images/calendar-icon.png" alt="" className="h-5 w-5"/> Cek Jadwal</a>
          </div>
        </motion.div>
        <motion.div initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} transition={{delay:0.3}} className="hidden lg:flex justify-end relative -mr-20">
          <div className="relative w-[640px] h-[640px]">
            <img src="/images/hero-character.png" alt="Learn languages with Linguo" className="w-full h-full object-contain drop-shadow-2xl" />
            <motion.div animate={{y:[0,-10,0]}} transition={{duration:3,repeat:Infinity}} className="absolute top-12 right-8 bg-[#f5d0b0] backdrop-blur rounded-2xl px-5 py-2.5 shadow-lg text-base font-bold text-slate-800">Hola!</motion.div>
            <motion.div animate={{y:[0,-8,0]}} transition={{duration:2.5,repeat:Infinity,delay:0.5}} className="absolute top-28 left-4 bg-white/90 backdrop-blur rounded-2xl px-4 py-2 shadow-lg text-sm font-medium text-purple-700">こんにちは 🇯🇵</motion.div>
          </div>
        </motion.div>
      </div>
    </section>

    {/* WA CHAT WIDGET */}
    <a href="https://wa.me/6282116859493" target="_blank"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 group">
      <span className="bg-white text-slate-700 text-sm font-medium px-4 py-2.5 rounded-full shadow-lg border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Need help? Chat with Us</span>
      <div className="h-14 w-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg shadow-green-500/30 hover:scale-110 transition-transform">
        <MessageCircle className="h-6 w-6 text-white" />
      </div>
    </a>

    {/* OUR CLIENTS */}
    <section className="py-10 bg-white border-b border-slate-100 overflow-hidden group">
      <div className="animate-marquee flex items-center gap-16 w-max group-hover:[animation-play-state:paused]">
        {[...Array(3)].flatMap((_, ri) =>
          [
            { src: "/images/clients/aiesec.png", alt: "AIESEC" },
            { src: "/images/clients/cimsa.png", alt: "CIMSA" },
            { src: "/images/clients/prasetiya-mulya.png", alt: "Prasetiya Mulya" },
            { src: "/images/clients/vaksindo.png", alt: "Vaksindo" },
            { src: "/images/clients/binus.png", alt: "BINUS University" },
            { src: "/images/clients/bitget.png", alt: "Bitget" },
            { src: "/images/clients/gojek.png", alt: "Gojek" },
            { src: "/images/clients/polban.png", alt: "POLBAN" },
            { src: "/images/clients/kai.png", alt: "KAI" },
            { src: "/images/clients/orica.png", alt: "Orica" },
          ].map((logo, i) => (
            <img key={`${ri}-${i}`} src={logo.src} alt={logo.alt} className="h-10 max-w-[160px] w-auto object-contain opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300" />
          ))
        )}
      </div>
    </section>

    {/* LANGUAGE MARQUEE */}
    <section id="bahasa" className="py-20 bg-[#f0fafa]">
      <div className="text-center mb-10 px-6">
        <h2 className="text-3xl sm:text-4xl font-bold mb-2">Become a Polyglot<br/>with Linguo</h2>
        <p className="text-slate-500">Linguo helps you to become fluent in many language.</p>
      </div>
      <div className="overflow-hidden">
        {/* Row 1 - left */}
        <div className="animate-marquee-slow flex items-center gap-3 w-max mb-3">
          {[...Array(2)].flatMap((_, ri) =>
            LANGUAGES.slice(0, 18).map((l, i) => (
              <a key={`r1-${ri}-${i}`} href={`https://wa.me/6282116859493?text=Halo, saya tertarik kursus bahasa ${l.name}`} target="_blank"
                className="flex items-center gap-2.5 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-[#1A9E9E]/40 hover:scale-105 hover:-translate-y-1 transition-all cursor-pointer shrink-0">
                <span className="text-xl">{l.flag}</span><span className="text-sm font-medium text-slate-700 whitespace-nowrap">{l.name}</span>
              </a>
            ))
          )}
        </div>
        {/* Row 2 - right (reverse direction via CSS) */}
        <div className="animate-marquee-slow flex items-center gap-3 w-max" style={{animationDirection:"reverse"}}>
          {[...Array(2)].flatMap((_, ri) =>
            LANGUAGES.slice(18).map((l, i) => (
              <a key={`r2-${ri}-${i}`} href={`https://wa.me/6282116859493?text=Halo, saya tertarik kursus bahasa ${l.name}`} target="_blank"
                className="flex items-center gap-2.5 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-[#1A9E9E]/40 hover:scale-105 hover:-translate-y-1 transition-all cursor-pointer shrink-0">
                <span className="text-xl">{l.flag}</span><span className="text-sm font-medium text-slate-700 whitespace-nowrap">{l.name}</span>
              </a>
            ))
          )}
        </div>
      </div>
    </section>

    {/* HOW IT WORKS */}
    <section className="py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1A9E9E] italic mb-3">Learning new language is complicated<br/>but we can make it easy for you</h2>
        <p className="text-slate-500 mb-16">Linguo helps you to become fluent in many language.</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[{i:"🔍",s:"Step 1",t:"Select Language",d:"Pilih bahasa favoritmu (bisa lebih dari satu sekaligus)"},
            {i:"📝",s:"Step 2",t:"Choose the level",d:"Pilih level dari basic hingga advance"},
            {i:"▶️",s:"Step 3",t:"Learn & practice",d:"Mulai belajar interaktif via Zoom sesuai jadwal"},
            {i:"🎓",s:"Step 4",t:"Get certified",d:"Level up dan dapatkan e-sertifikat"}
          ].map((s,i)=>(<motion.div key={i} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.1}} className="flex flex-col items-center">
            <span className="text-5xl mb-4">{s.i}</span>
            <p className="text-xs text-[#1A9E9E] font-semibold italic mb-1">{s.s}</p>
            <h3 className="text-sm font-bold mb-2">{s.t}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{s.d}</p>
          </motion.div>))}
        </div>
      </div>
    </section>

    {/* WHY LINGUO */}
    <section className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center italic mb-14">Why Linguo?</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[{i:"📚",t:"Bebas ikut 55+ pilihan bahasa!",d:"Linguo memiliki 55+ pilihan bahasa dan terus bertambah sesuai minat siswa."},
            {i:"💰",t:"Harga mulai Rp 90.000 / sesi",d:"Kelas Private Linguo memiliki harga terjangkau dengan kualitas premium."},
            {i:"🎬",t:"Level basic hingga advance",d:"Setiap bahasa memiliki opsi lanjutan: Basic, Upper Basic, Intermediate, Advance."}
          ].map((c,i)=>(<motion.div key={i} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.1}}
            className={`bg-white rounded-3xl border-2 p-8 text-center hover:shadow-xl transition-all ${i===1?"border-[#1A9E9E]/30 shadow-lg lg:scale-105":"border-slate-100"}`}>
            <span className="text-5xl block mb-5">{c.i}</span><h3 className="text-lg font-bold mb-3">{c.t}</h3><p className="text-sm text-slate-500 leading-relaxed">{c.d}</p>
          </motion.div>))}
        </div>
      </div>
    </section>

    {/* POPULAR CLASS */}
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold mb-10">Most popular class</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[{l:"ENGLISH",f:"🇬🇧",e:"🏙️",t:"Beginner English",n:"Thifal Syahla",lv:"BEGINNER"},
            {l:"KOREA",f:"🇰🇷",e:"🏯",t:"Korean Conversation",n:"Nitalia Wijaya",lv:"INTERMEDIATE"},
            {l:"JAPAN",f:"🇯🇵",e:"⛩️",t:"Japanese Basic",n:"Paramita Wulandari",lv:"BEGINNER"}
          ].map((c,i)=>(<motion.div key={i} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.1}} className="group cursor-pointer">
            <div className="relative h-52 bg-gradient-to-br from-[#1A9E9E]/20 to-[#1A9E9E]/5 rounded-2xl flex items-center justify-center text-7xl mb-4 group-hover:shadow-lg transition-shadow overflow-hidden">
              {c.e}<span className="absolute top-3 left-3 bg-[#1A9E9E] text-white text-[10px] font-bold px-3 py-1 rounded-full">{c.f} {c.l}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">{c.n.split(" ").map(w=>w[0]).join("")}</div>
                <div><p className="text-sm font-semibold">{c.t}</p><p className="text-xs text-slate-400">{c.n}</p></div>
              </div>
              <span className="text-[10px] font-bold text-[#1A9E9E] border border-[#1A9E9E] px-2.5 py-1 rounded-full">{c.lv}</span>
            </div>
          </motion.div>))}
        </div>
      </div>
    </section>

    {/* TEACHERS */}
    <section id="teacher" className="py-24 bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold italic mb-3">Meet Our Teacher</h2>
        <p className="text-slate-500 mb-14">Linguo helps you to become fluent in many language.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          {TEACHERS.map((t,i)=>(<motion.div key={i} initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.08}}
            className="bg-white rounded-2xl border border-slate-100 p-6 hover:border-[#1A9E9E]/30 hover:shadow-lg transition-all">
            <div className="relative h-20 w-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-2xl font-bold text-slate-500">
              {t.name.split(" ").map(w=>w[0]).join("")}<span className="absolute -bottom-1 text-sm">{t.flags}</span>
            </div>
            <p className="font-semibold text-sm">{t.name}</p><p className="text-xs text-slate-400">{t.role} Teacher</p>
          </motion.div>))}
        </div>
      </div>
    </section>

    {/* TESTIMONIAL */}
    <section className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center italic mb-14">Story from our student</h2>
        <div className="grid lg:grid-cols-5 gap-10 items-center">
          <div className="lg:col-span-2 flex flex-col items-center text-center">
            <div className="h-28 w-28 rounded-full bg-gradient-to-br from-pink-200 to-pink-300 flex items-center justify-center text-4xl mb-4">👩</div>
            <p className="font-bold">Maria Dita</p><p className="text-sm text-slate-400 mb-4">Universitas Indonesia</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">G</span><span className="text-xs text-slate-400">Google Reviews</span>
              <div className="flex gap-0.5">{[1,2,3,4,5].map(s=><Star key={s} className="h-3.5 w-3.5 fill-amber-400 text-amber-400"/>)}</div>
              <span className="text-xs font-semibold">4.9/5</span>
            </div>
          </div>
          <div className="lg:col-span-3">
            <p className="text-slate-600 leading-relaxed mb-4">Awalnya saya mengetahui Linguo dari Instagram dan kemudian saya tertarik karna melihat review dari para siswa Linguo yg ada di story IG, saya hubungi adminnya dan adminnya ramah sekali... Lalu saya tanya harga ternyata harganya cukup terjangkau dan akhirnya saya memutuskan untuk registrasi kursus bahasa Belanda...</p>
            <p className="text-slate-600 leading-relaxed">Daaaan pas mengikuti kelas nya sangatt asyik, materi nya jelas, gurunya enakkkk dan pinter, temen-temen nya juga enak alhasil saya ikut ke kelas lanjutan berikutnya... Pokoknya gak menyesal deh kursus di Linguo.. 💕💜😍</p>
          </div>
        </div>
      </div>
    </section>

    {/* PRICING — KELAS PRIVATE */}
    <section id="produk" className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold italic mb-2">Choose a learning plan<br/>that speaks to you</h2>
        <p className="text-slate-500 mb-14">Kelas Private — fleksibel, personal, dan efektif.</p>
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr><th className="text-left py-4 px-4 w-[220px]"></th>
            {PLANS.map((p,i)=>(<th key={i} className="py-4 px-3 text-center"><div className={`rounded-2xl p-5 ${p.highlighted?"bg-white shadow-xl border-2 border-[#1A9E9E]/30 -mt-4":""}`}>
              <p className="font-bold">{p.name}</p><p className="text-xs text-slate-400 mt-1 mb-3">{p.desc}</p>
              {p.highlighted&&<p className="text-xs text-[#1A9E9E] font-semibold mb-1 flex items-center justify-center gap-1"><Zap className="h-3 w-3"/>Recommended</p>}
              <p className={`text-xl font-bold ${p.highlighted?"text-[#1A9E9E]":"text-slate-900"}`}>{p.price}</p>
            </div></th>))}
          </tr></thead>
          <tbody>
            {FEATURES.map((f,fi)=>(<tr key={fi} className="border-t border-slate-100"><td className="text-left py-4 px-4 font-medium text-slate-700">{f}</td>
              {PLANS.map((_,pi)=>(<td key={pi} className="text-center py-4 px-3"><Check className="h-5 w-5 text-[#1A9E9E] mx-auto"/></td>))}
            </tr>))}
            <tr className="border-t border-slate-100"><td className="py-6 px-4"></td>
              {PLANS.map((p,pi)=>(<td key={pi} className="text-center py-6 px-3">
                <a href={`https://wa.me/6282116859493?text=Halo, saya tertarik Kelas Private ${p.name}`} target="_blank"
                  className={`inline-block px-6 py-2.5 rounded-full text-sm font-semibold transition-all active:scale-95 ${p.highlighted?"bg-[#1A9E9E] text-white hover:bg-[#178888] shadow-lg shadow-[#1A9E9E]/25":"border-2 border-[#1A9E9E] text-[#1A9E9E] hover:bg-[#1A9E9E] hover:text-white"}`}>Get Started</a>
              </td>))}
            </tr>
          </tbody>
        </table></div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold italic leading-tight mb-5">Learning is journey<br/>Start now & Grow up with Linguo</h2>
        <p className="text-slate-500 mb-8 max-w-lg mx-auto">Linguo helps you to become fluent in many language through interactive classes that always prioritizes practice.</p>
        <a href="https://wa.me/6282116859493" target="_blank" className="inline-flex items-center gap-2 bg-[#1A9E9E] hover:bg-[#178888] text-white font-bold px-8 py-4 rounded-full transition-all active:scale-95 shadow-lg shadow-[#1A9E9E]/25">Mulai Belajar</a>
      </div>
    </section>

    {/* FAQ */}
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        <p className="text-xs font-bold text-[#1A9E9E] uppercase tracking-widest text-center mb-2">LEARN HOW TO GET STARTED</p>
        <h2 className="text-3xl font-bold text-center italic mb-3">Frequently Asked Questions</h2>
        <p className="text-[#1A9E9E] text-sm font-semibold text-center mb-10 cursor-pointer hover:underline">Contact Support</p>
        <div>{FAQS.map((f,i)=><FAQ key={i} q={f.q} a={f.a}/>)}</div>
      </div>
    </section>

    {/* FOOTER */}
    <footer className="bg-[#1A9E9E] text-white py-14">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-10 mb-10">
          <div><h4 className="font-bold mb-4">Learn a Language</h4>
            <ul className="flex flex-col gap-1.5 text-sm text-white/80">
              {["English","French","Spanish","Portuguese","German","Japanese","Korean","Arabic","Italian","Russian"].map(l=>(<li key={l}><a href={`https://wa.me/6282116859493?text=Halo, saya mau kursus ${l}`} className="hover:text-white transition-colors">Learn {l}</a></li>))}
              <li><a href="#bahasa" className="font-semibold text-white hover:underline">Learn More Languages</a></li>
            </ul>
          </div>
          <div><h4 className="font-bold mb-4">Level Option</h4>
            <ul className="flex flex-col gap-1.5 text-sm text-white/80">{["Basic","Upper Basic","Intermediate","Advance"].map(l=>(<li key={l}>{l}</li>))}</ul>
            <h4 className="font-bold mt-6 mb-4">Program</h4>
            <ul className="flex flex-col gap-1.5 text-sm text-white/80">{["Regular Class","Private Class","IELTS Prep","TOEFL Prep"].map(l=>(<li key={l}>{l}</li>))}</ul>
          </div>
          <div><h4 className="font-bold mb-4">Teaching</h4>
            <p className="text-sm text-white/80 mb-6">Become a Teacher</p>
            <div className="text-sm text-white/80 space-y-1">
              <p>Happy Creative Hub, Jl. Cisitu Indah III No.2,</p><p>Dago, Coblong, Bandung 40135</p>
              <p className="mt-3">Tel: (022) 85942550</p><p>Email: official.linguo@gmail.com</p>
            </div>
            <div className="flex gap-3 mt-4">{["ig","fb","tt","li","yt"].map(s=>(<a key={s} href={s==="ig"?"https://instagram.com/linguo.id":"#"} target="_blank" className="h-8 w-8 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors"><AtSign className="h-3.5 w-3.5"/></a>))}</div>
          </div>
        </div>
        <div className="border-t border-white/20 pt-6 text-center text-sm text-white/60">© {new Date().getFullYear()} PT. Linguo Edu Indonesia</div>
      </div>
    </footer>

    {/* SCROLL TOP */}
    <AnimatePresence>{st&&(<motion.button initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.8}}
      onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}
      className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-[#1A9E9E] text-white shadow-lg flex items-center justify-center hover:bg-[#178888] z-50 active:scale-90"><ArrowUp className="h-5 w-5"/></motion.button>)}</AnimatePresence>
  </>);
}
