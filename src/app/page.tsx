// [home-rsc-v1] Beranda = komponen SERVER. Dulu seluruh berkas ini (2.196
// baris) "use client", jadi tiap pengunjung HP harus mengunduh & meng-hydrate
// semuanya — satu tugas JS ±2 dtk (TBT 460 ms, skor Performa PageSpeed HP 66).
// Sekarang bagian statis dirender di server tanpa JS; yang interaktif tinggal di
// ./_home/islands.tsx. Data yang dipakai keduanya ada di ./_home/data.ts.
// JANGAN bungkus pulau-pulau itu dengan <Suspense>: saat prerender mereka
// "menunda" (modul klien dimuat), jadi Next mengirimnya DI AKHIR HTML lalu
// ditukar skrip $RC — form hero muncul belakangan, CLS 0,44 & LCP molor.
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { BRAND_FACTS } from "@/lib/brand-facts";
import { jsonLd, faqSchema } from "@/lib/schema"; // [aeo-schema-v1]
import TokoCTA from "@/components/TokoCTA";
import TautanLegal from "@/components/TautanLegal"; // [xendit-legal-links-v1]
import Reveal from "@/components/Reveal"; // linguo-patch:scroll-reveal-v1
import HeroModel3D from "@/components/HeroModel3D"; // [hero-3d-v1]
import { FAQS, FOOTER_LANGUAGES, FOOTER_PROGRAMS, SEMUA_BAHASA } from "./_home/data";
import {
  HomeMount, HomeNavbar, HomeLoginModal, HomeHeroFunnel, HomeProductDock, HomePricing,
  TypingBubble, LanguageStrip, WhyCarousel, TeacherGrid, TestimonialCarousel, FAQ,
  Melayang, MunculBergiliran, GeserKelas,
} from "./_home/islands";

export default function Home() {
  return (<>
    <HomeMount />
    <HomeNavbar />
    <HomeLoginModal />

    {/* HERO */}
    <section className="bg-[#1A9E9E] lg:min-h-screen flex items-center relative overflow-hidden pt-20 lg:pt-32 pb-6 lg:pb-0">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-[1fr_1.3fr] gap-4 items-center py-4 lg:py-0">
        {/* [hero-lcp-v1] Kolom hero sengaja div biasa, BUKAN motion.div dengan
            initial opacity 0: framer-motion menulis opacity:0 ke HTML server,
            jadi H1 + form baru kelihatan setelah seluruh JS halaman selesai
            hydrate (FCP HP 6 dtk). Sekarang tampil langsung dari HTML. */}
        <div>
          <div className="flex items-start gap-3 lg:block mb-4 lg:mb-0">
            <div className="flex-1">
              {/* [seo-h1-v1] H1 lama cuma berbunyi "Everyone Can Be a Polyglot":
                  kuat sebagai tagline, tapi nol nilai kata kunci — orang
                  Indonesia tidak mencari kata "polyglot". H1 adalah sinyal
                  relevansi terkuat kedua setelah <title>, jadi kalimat yang
                  benar-benar dicari ditambahkan di dalamnya sebagai baris kedua
                  yang KELIHATAN (bukan teks tersembunyi — itu dihukum Google).
                  Tagline-nya sendiri tetap dominan, hero tetap ramping. */}
              <h1 className="font-heading text-[1.6rem] sm:text-4xl lg:text-[3.8rem] font-extrabold text-white leading-[1.1] mb-4 lg:mb-8">
                Everyone Can<br/>Be a Polyglot
                <span className="block font-sans text-[0.72rem] sm:text-sm lg:text-lg font-semibold text-white/85 leading-snug mt-1.5 lg:mt-4">
                  Kursus Bahasa Asing Online — 60+ Bahasa
                </span>
              </h1>
            </div>
            <div className="lg:hidden shrink-0 relative translate-x-2 sm:translate-x-3">
              <Image src="/images/hero-character.png" alt="" width={176} height={142} priority fetchPriority="high" sizes="(min-width: 1024px) 0px, 176px" className="w-40 sm:w-48 h-auto drop-shadow-xl"/>
              <Melayang amp={5} className="absolute -top-6 -left-1 sm:-top-8 sm:-left-2">
                <div className="relative bg-white rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-lg">
                  <TypingBubble size="sm"/>
                  <div className="absolute -bottom-1 right-3 w-2.5 h-2.5 bg-white rotate-45"/>
                </div>
              </Melayang>
            </div>
          </div>
          <HomeHeroFunnel />
          <Image src="/images/google-review.png" alt="Google Reviews 5.0/5" width={146} height={31} sizes="146px" className="h-7 sm:h-8 w-auto mt-4 sm:mt-6 opacity-90"/>
          
        </div>
        <div className="hidden lg:flex justify-end relative -mr-28">
          <div className="relative w-[810px] h-[810px]">
            <HeroModel3D alt="Learn languages with Linguo"/>
            <div className="absolute top-16 left-[27%] pointer-events-none">
              <Melayang amp={8}>
                <div className="relative bg-white rounded-2xl px-7 py-4 shadow-xl">
                  <TypingBubble/>
                  <div className="absolute -bottom-2 right-12 w-4 h-4 bg-white rotate-45 shadow-xl"/>
                </div>
              </Melayang>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* LANGUAGE FLAG STRIP — flat white, seamless */}
    <Reveal>
    <section className="bg-white pt-8 pb-2">
      <div className="flex items-center justify-center gap-3 mb-4 px-6">
        <h2 className="font-heading text-xl sm:text-2xl font-bold text-center">Tersedia <span className="text-[#1A9E9E]">60+ Bahasa</span></h2>
        <a href="/kursus" className="inline-flex items-center gap-1 shrink-0 rounded-full border border-[#1A9E9E]/30 px-3 py-1 text-xs sm:text-sm font-semibold text-[#1A9E9E] hover:bg-[#1A9E9E]/5 transition-colors">
          Lihat semua <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
      <div className="bg-white mx-6 lg:mx-12 overflow-hidden"><LanguageStrip /></div>
    </section>
    </Reveal>

    {/* linguo-patch:chat-widget-drawer-aware-v1 — chat widget dipindah ke <Navbar/> (lihat dekat <PlacementPicker/>) */}

    {/* PRODUCT CARDS — macOS Dock style */}
    <Reveal>
    <section className="bg-white py-14 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-1">Semua kebutuhan belajar bahasa ada di Linguo</h2>
        <p className="text-slate-500 text-sm text-center mb-10">Pilih program yang sesuai dengan kebutuhanmu</p>
        <HomeProductDock />
      </div>
    </section>
    </Reveal>

    {/* OUR CLIENTS */}
    <section className="py-5 sm:py-10 bg-white border-b border-slate-100 overflow-hidden group">
      <div className="animate-marquee flex items-center gap-16 w-max group-hover:[animation-play-state:paused]" style={{animationDuration:'50s'}}>
        {[...Array(3)].flatMap((_, ri) =>
          [
            { src: "/images/clients/aiesec.png", alt: "AIESEC", w: 845, h: 120 },
            { src: "/images/clients/cimsa.png", alt: "CIMSA", w: 88, h: 119 },
            { src: "/images/clients/prasetiya-mulya.png", alt: "Prasetiya Mulya", w: 365, h: 86 },
            { src: "/images/clients/vaksindo.png", alt: "Vaksindo", w: 328, h: 120 },
            { src: "/images/clients/binus.png", alt: "BINUS University", w: 760, h: 437 },
            { src: "/images/clients/bitget.png", alt: "Bitget", w: 361, h: 112 },
            { src: "/images/clients/gojek.png", alt: "Gojek", w: 410, h: 110 },
            { src: "/images/clients/polban.png", alt: "POLBAN", w: 108, h: 120 },
            { src: "/images/clients/kai.png", alt: "KAI", w: 284, h: 120 },
            { src: "/images/clients/orica.png", alt: "Orica", w: 123, h: 120 },
            { src: "/images/clients/mondelez.png", alt: "Mondelez", w: 1982, h: 474 },
            { src: "/images/clients/alfamart.png", alt: "Alfamart", w: 750, h: 240 },
            { src: "/images/clients/dua-kelinci-v2.png", alt: "Dua Kelinci", w: 494, h: 300 },
          ].map((logo, i) => (
            // Marquee repeats the list 3× for the infinite scroll; only the first
            // copy is exposed to assistive tech, the rest are decorative duplicates.
            <Image key={`${ri}-${i}`} src={logo.src} alt={ri === 0 ? logo.alt : ""} aria-hidden={ri !== 0} width={logo.w} height={logo.h} loading="lazy" sizes="200px" className="h-7 sm:h-10 max-w-[120px] sm:max-w-[200px] w-auto object-contain opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300" />
          ))
        )}
      </div>
    </section>

    {/* HOW IT WORKS */}
    <Reveal>
    <section className="py-8 lg:py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2 className="font-heading text-lg sm:text-3xl lg:text-4xl font-bold text-[#1A9E9E] mb-3">Learning new language is complicated<br/>but we can make it easy for you</h2>
        <p className="text-slate-500 mb-8 lg:mb-16">Linguo helps you to become fluent in many language.</p>
        <div className="hidden lg:flex items-start justify-between max-w-5xl mx-auto">
          {[{img:"/images/step-1.png",iw:383,ih:293,s:"Step 1",t:"Select Language",d:"Pilih bahasa yang kamu sukai (bisa memilih lebih dari satu bahasa sekaligus)"},
            {img:"/images/step-2.png",iw:383,ih:368,s:"Step 2",t:"Choose The Language Level",d:"Pilih level kemampuanmu (tersedia dari basic hingga advance*)",note:"* untuk beberapa bahasa"},
            {img:"/images/step-3.png",iw:320,ih:388,s:"Step 3",t:"Learn & Practice with Linguo",d:"Setelah menyelesaikan pembayaran kamu bisa mulai belajar sesuai jadwal belajar"},
            {img:"/images/step-4.png",iw:384,ih:207,s:"Step 4",t:"Level up & Get certified",d:"Setelah delapan sesi, kamu bisa ikut kelas lanjutan hingga mendapatkan e-sertifikat*",note:"* S&K berlaku"}
          ].map((s,i)=>(<div key={i} className="flex items-start">
            <MunculBergiliran i={i} className="flex flex-col items-center w-[200px]">
              <div className="h-[70px] flex items-end justify-center mb-4"><Image src={s.img} alt={s.t} width={s.iw} height={s.ih} loading="lazy" sizes="100px" className="max-h-[70px] w-auto object-contain"/></div>
              <p className="text-xs text-[#1A9E9E] font-semibold italic mb-1">{s.s}</p>
              <h3 className="text-sm font-bold mb-2 leading-tight">{s.t}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{s.d}</p>
              {s.note&&<p className="text-[10px] text-slate-400 mt-1">{s.note}</p>}
            </MunculBergiliran>
            {i<3&&<div className="flex items-center mt-[45px] mx-3 shrink-0"><div className="w-1.5 h-1.5 rounded-full border-[1.5px] border-[#1A9E9E]"/><div className="w-16 border-t-[1.5px] border-dashed border-[#1A9E9E]/40"/><div className="w-1.5 h-1.5 rounded-full border-[1.5px] border-[#1A9E9E]"/></div>}
          </div>))}
        </div>
        {/* Mobile: simple grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-8 lg:hidden">
          {[{img:"/images/step-1.png",iw:383,ih:293,s:"Step 1",t:"Select Language",d:"Pilih bahasa yang kamu sukai (bisa memilih lebih dari satu bahasa sekaligus)"},
            {img:"/images/step-2.png",iw:383,ih:368,s:"Step 2",t:"Choose the language level",d:"Pilih level kemampuanmu (tersedia dari basic hingga advance*)"},
            {img:"/images/step-3.png",iw:320,ih:388,s:"Step 3",t:"Learn & practice with Linguo",d:"Setelah menyelesaikan pembayaran kamu bisa mulai belajar sesuai jadwal belajar"},
            {img:"/images/step-4.png",iw:384,ih:207,s:"Step 4",t:"Level up & Get certified",d:"Setelah delapan sesi, kamu bisa ikut kelas lanjutan hingga mendapatkan e-sertifikat*"}
          ].map((s,i)=>(<MunculBergiliran key={i} i={i} className="flex flex-col items-center px-1">
            <Image src={s.img} alt={s.t} width={s.iw} height={s.ih} loading="lazy" sizes="80px" className="h-12 sm:h-20 w-auto object-contain mb-2 sm:mb-4"/>
            <p className="text-[10px] sm:text-xs text-[#1A9E9E] font-semibold italic mb-0.5 sm:mb-1">{s.s}</p>
            <h3 className="text-xs sm:text-sm font-bold mb-1 sm:mb-2 leading-tight">{s.t}</h3>
            <p className="text-[11px] sm:text-xs text-slate-500 leading-snug">{s.d}</p>
          </MunculBergiliran>))}
        </div>
      </div>
    </section>
    </Reveal>

    {/* POPULAR CLASS */}
    <Reveal>
    <section className="py-8 lg:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between mb-10">
          <h2 className="font-heading text-xl sm:text-3xl font-bold">Most popular class</h2>
          <GeserKelas />
        </div>
        <div id="class-scroll" className="overflow-hidden group">
          <div className="animate-marquee flex gap-6 w-max group-hover:[animation-play-state:paused]" style={{animationDuration:'30s'}}>
            {[...Array(2)].flatMap((_, ri) =>
              [{l:"ENGLISH",fc:"gb",img:"/images/classes/class-english.png",t:"Beginner English",n:"Thifal Syahla",lv:"BEGINNER",lc:"text-green-600 border-green-500"},
                {l:"KOREA",fc:"kr",img:"/images/classes/class-korea.png",t:"Sweet and tone",n:"Nitalia Wijaya",lv:"INTERMEDIATE",lc:"text-pink-500 border-pink-400"},
                {l:"JAPAN",fc:"jp",img:"/images/classes/class-japan.png",t:"Japanese Basic",n:"Paramita Wulandari",lv:"BEGINNER",lc:"text-green-600 border-green-500"},
              ].map((c, i) => (
                <a key={`${ri}-${i}`} href={`https://wa.me/6282116859493?text=Halo, saya tertarik kelas ${c.t}`} target="_blank" className="w-[280px] sm:w-[360px] shrink-0 group/card cursor-pointer">
                  <div className="relative h-44 sm:h-56 rounded-2xl mb-3 sm:mb-4 overflow-hidden group-hover/card:shadow-lg transition-shadow">
                    <Image src={c.img} alt={ri === 0 ? c.l : ""} aria-hidden={ri !== 0} fill loading="lazy" sizes="(min-width: 640px) 360px, 280px" className="object-cover"/>
                    <span className="absolute top-3 left-3 bg-[#1A9E9E] text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5">
                      <img src={`https://flagcdn.com/w20/${c.fc}.png`} alt="" loading="lazy" decoding="async" className="h-3.5 w-3.5 rounded-full object-cover"/> {c.l}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">{c.n.split(" ").map(w=>w[0]).join("")}</div>
                      <div><p className="text-sm font-semibold">{c.t}</p><p className="text-xs text-slate-400">{c.n}</p></div>
                    </div>
                    <span className={`text-[10px] font-bold px-3 py-1 rounded border ${c.lc}`}>{c.lv}</span>
                  </div>
                </a>
              ))
            )}
          </div>
        </div>
        <div className="text-center mt-5 sm:mt-10">
          <a href="https://wa.me/6282116859493?text=Halo, saya mau lihat kelas lainnya" target="_blank" className="inline-block border border-slate-300 text-slate-600 font-medium px-8 py-3 rounded-full text-sm hover:bg-slate-50 transition-colors">Browse more</a>
        </div>
      </div>
    </section>
    </Reveal>

    {/* WHY LINGUO */}
    <Reveal>
    <section className="py-8 sm:py-16 lg:py-24 bg-white relative overflow-hidden">
      <Image src="/images/wave-line.png" alt="" aria-hidden width={2000} height={642} loading="lazy" sizes="100vw" className="absolute top-1/2 left-0 w-full h-auto -translate-y-1/2 pointer-events-none opacity-60"/>
      <div className="relative z-10">
        <h2 className="font-heading text-base sm:text-3xl font-bold text-center text-[#1A9E9E] mb-2 sm:mb-4">Why Linguo?</h2>
        <WhyCarousel/>
      </div>
    </section>
    </Reveal>

    {/* TEACHERS */}
    <Reveal>
    <section id="teacher" className="py-16 lg:py-24 bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <h2 className="font-heading text-xl sm:text-3xl font-bold mb-3">Meet Our Teacher</h2>
        <p className="text-slate-500 mb-14">Linguo helps you to become fluent in many language.</p>
        <TeacherGrid/>
      </div>
    </section>
    </Reveal>

    {/* TESTIMONIAL */}
    <Reveal>
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="font-heading text-2xl lg:text-3xl font-bold text-center mb-3">Story from our student</h2>
        {/* [aeo-google-reviews-v1] Rating Google Maps sebagai teks + tautan —
            dibaca mesin jawaban yang tidak merayapi Maps. Bukan schema. */}
        <p className="text-center text-sm text-slate-500 mb-10 lg:mb-14">
          <a href={BRAND_FACTS.googleReviews.mapsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#1A9E9E] transition-colors">
            <span className="text-amber-500" aria-hidden>★</span>{" "}
            <strong className="text-slate-800">{BRAND_FACTS.googleReviews.ratingLabel}</strong> dari{" "}
            {BRAND_FACTS.googleReviews.countLabel} ulasan di Google Maps
          </a>
        </p>
        <TestimonialCarousel/>
      </div>
    </section>
    </Reveal>

    {/* PRICING */}
    <Reveal>
    <HomePricing />
    </Reveal>

    {/* CTA */}
    <Reveal>
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="font-heading text-2xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-5">Learning is journey<br/>Start now & Grow up with Linguo</h2>
        <p className="text-slate-500 mb-4 sm:mb-8 max-w-lg mx-auto">Linguo helps you to become fluent in many language through interactive classes that always prioritizes practice.</p>
        <a href="https://wa.me/6282116859493" target="_blank" className="inline-flex items-center gap-2 bg-[#1A9E9E] hover:bg-[#178888] text-white font-bold px-8 py-4 rounded-full transition-all active:scale-95 shadow-lg shadow-[#1A9E9E]/25">Mulai Belajar</a>
      </div>
    </section>
    </Reveal>

    {/* [seo-video-object-v1] Search Console melaporkan 4 video terdeteksi, 0
        terindeks. Penyebabnya: satu-satunya video di halaman ini duduk di dalam
        akordeon FAQ yang tertutup (grid-rows-[0fr] + overflow-hidden), jadi
        tingginya 0 dan Google tidak bisa menentukan video mana yang menonjol.
        Markup di bawah menjawab persis itu — memberi tahu judul, tanggal unggah,
        dan thumbnail videonya secara eksplisit tanpa mengubah tampilan.
        Datanya diambil dari oEmbed YouTube, JANGAN diarang-arang: structured
        data yang tidak cocok dengan video aslinya justru bikin halaman kena
        abaikan. Kalau video FAQ diganti, perbarui blok ini juga. */}
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: "Jadi polyglot kaya Fikri Naki bareng Linguo ID yuk!",
        description: "Perkenalan Linguo.id — platform kursus bahasa online dengan 60+ pilihan bahasa dan kelas live bersama pengajar.",
        thumbnailUrl: ["https://i.ytimg.com/vi/3hDBE8o-jJU/maxresdefault.jpg"],
        uploadDate: "2021-05-02",
        embedUrl: "https://www.youtube.com/embed/3hDBE8o-jJU",
        contentUrl: "https://www.youtube.com/watch?v=3hDBE8o-jJU",
        publisher: { "@id": "https://linguo.id/#organization" },
      }) }}
    />

    {/* [aeo-schema-v1] FAQPage — isinya PERSIS array FAQS yang dirender akordeon
        di bawah, jadi tidak ada pertanyaan yang cuma hidup di markup. FAQ di
        homepage adalah sumber kutipan paling sering dipakai mesin jawaban untuk
        pertanyaan "apa itu Linguo" dan "berapa harganya", jadi jawabannya
        sengaja ditulis lengkap & berdiri sendiri, bukan potongan satu frasa. */}
    <script type="application/ld+json" {...jsonLd(faqSchema(FAQS, `${BRAND_FACTS.url}/`))} />

    {/* FAQ */}
    <Reveal>
    <section id="faq" className="py-16 lg:py-24 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        <p className="text-xs font-bold text-[#1A9E9E] uppercase tracking-widest text-center mb-2">LEARN HOW TO GET STARTED</p>
        <h2 className="font-heading text-xl sm:text-3xl font-bold text-center mb-3">Frequently Asked Questions</h2>
        <p className="text-[#1A9E9E] text-sm font-semibold text-center mb-10 cursor-pointer hover:underline">Contact Support</p>
        <div>{FAQS.map((f,i)=><FAQ key={i} q={f.q} a={f.a} video={"video" in f ? f.video : undefined}/>)}</div>
      </div>
    </section>
    </Reveal>

    {/* FOOTER */}
    <footer className="bg-[#14726E] text-white py-14">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-10 mb-10">
          <div><h4 className="font-bold mb-4">Kursus Bahasa</h4>
            <ul className="flex flex-col gap-1.5 text-sm text-white/80">
              {FOOTER_LANGUAGES.map(l=>(<li key={l.href}><a href={l.href} className="hover:text-white transition-colors">Kursus Bahasa {l.label}</a></li>))}
              <li><a href="/kursus" className="font-semibold text-white hover:underline">Lihat Semua 60+ Bahasa</a></li>
            </ul>
          </div>
          <div><h4 className="font-bold mb-4">Level Option</h4>
            <ul className="flex flex-col gap-1.5 text-sm text-white/80">{["Basic","Upper Basic","Intermediate","Advance"].map(l=>(<li key={l}><a href={`https://wa.me/6282116859493?text=${encodeURIComponent("Halo, saya mau kursus level "+l)}`} target="_blank" className="hover:text-white transition-colors">{l}</a></li>))}</ul>
            <h4 className="font-bold mt-6 mb-4">Program</h4>
            <ul className="flex flex-col gap-1.5 text-sm text-white/80">{FOOTER_PROGRAMS.map(p=>(<li key={p.href}><a href={p.href} className="hover:text-white transition-colors">{p.label}</a></li>))}</ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Info</h4>
            <ul className="flex flex-col gap-1.5 text-sm text-white/80">
              <li><a href="/harga" className="hover:text-white transition-colors">Harga Kelas</a></li>
              <li><a href="/kursus" className="hover:text-white transition-colors">Semua Kelas Bahasa</a></li>
              <li><a href="/silabus" className="hover:text-white transition-colors">Silabus & Kurikulum</a></li>
              <li><a href="/kelas-trial" className="hover:text-white transition-colors">Kelas Trial</a></li>
              {/* [seo-tautan-internal-v1] Dulu di sini ada "Kosakata Gratis" →
                  /kosakata. Halaman itu di-Disallow di robots.txt DAN noindex
                  (isinya flashcard milik siswa, butuh akun), jadi tautan dari
                  footer publik cuma membuang jatah rayap ke halaman terlarang —
                  sekaligus menjanjikan sesuatu yang ternyata minta login.
                  Diganti ke /blog/arsip: gratis, boleh diindeks, dan jadi pintu
                  masuk ke 375 artikel yang sebelumnya tidak ditaut dari mana pun.
                  (/silabus sudah punya barisnya sendiri di atas.) */}
              <li><a href="/blog/arsip" className="hover:text-white transition-colors">Arsip Artikel</a></li>
              <li><a href="/watch-learn" className="hover:text-white transition-colors">Watch &amp; Learn</a></li>
              <li><a href="/simulasi" className="hover:text-white transition-colors">Simulasi TOEFL &amp; IELTS</a></li>
              <li><a href="/toko/paket-elearning" className="hover:text-white transition-colors">Paket E-Learning</a></li>
              <li><a href="/blog" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="/corporate" className="hover:text-white transition-colors">Corporate</a></li>
              <li><a href="/jadi-pengajar" className="hover:text-white transition-colors">Jadi Pengajar</a></li>
              <li><a href="/jadi-interpreter" className="hover:text-white transition-colors">Jadi Interpreter</a></li>
              <li><a href="/afiliator" className="hover:text-white transition-colors">Jadi Afiliator</a></li>
              <li><a href="/karir" className="hover:text-white transition-colors">Karir</a></li>
              <li><a href="/interpreter" className="hover:text-white transition-colors">Layanan Interpreter</a></li>
            </ul>
            <h4 className="font-bold mt-6 mb-2">Bantuan</h4>
            <ul className="flex flex-col gap-1.5 text-sm text-white/80">
              <li><a href="/#faq" className="hover:text-white transition-colors">FAQ</a></li>
              <li><a href="https://wa.me/6282116859493" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Hubungi Kami</a></li>
            </ul>
          </div>
          <div><h4 className="font-bold mb-4">Kontak</h4>
            <div className="text-sm text-white/80 space-y-1">
              <p>{BRAND_FACTS.address.streetAddress},</p><p>{BRAND_FACTS.address.addressLocality} {BRAND_FACTS.address.postalCode}</p>
              <p className="mt-3">Tel: (022) 85942550</p><p>Email: hello@linguo.id</p>
            </div>
            <div className="flex gap-3 mt-4">
              {[
                {id:"ig",href:"https://instagram.com/linguo.id",label:"Instagram",svg:<svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>},
                {id:"fb",href:"https://facebook.com/linguo.id",label:"Facebook",svg:<svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>},
                {id:"tt",href:"https://tiktok.com/@linguo.id",label:"TikTok",svg:<svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.66a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.09z"/></svg>},
                {id:"li",href:"https://linkedin.com/company/linguo-id",label:"LinkedIn",svg:<svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z"/></svg>},
                {id:"yt",href:"https://youtube.com/@linguo.id",label:"YouTube",svg:<svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>},
              ].map(s=>(
                <a key={s.id} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="h-8 w-8 rounded-full bg-white/15 flex items-center justify-center hover:bg-white hover:text-[#1A9E9E] transition-all">
                  {s.svg}
                </a>
              ))}
            </div>
          </div>
        </div>
        {/* [seo-tautan-internal-v1] Semua landing bahasa ditaut langsung dari
            homepage — lihat catatan di atas definisi SEMUA_BAHASA. */}
        <nav aria-label="Semua kursus bahasa" className="border-t border-white/20 pt-8 pb-8">
          <h4 className="font-bold mb-3 text-sm">Semua Kursus Bahasa</h4>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-[13px] text-white/70">
            {SEMUA_BAHASA.map(b=>(
              <li key={b.slug}>
                <a href={`/kursus/bahasa-${b.slug}`} className="hover:text-white hover:underline transition-colors">
                  Kursus Bahasa {b.label}
                </a>
              </li>
            ))}
            <li><a href="/kursus" className="font-semibold text-white hover:underline">Lihat Semua &rarr;</a></li>
          </ul>
        </nav>
        <div className="border-t border-white/20 pt-6 text-center text-sm text-white/60">
          <TautanLegal className="mb-3 text-white/70" />
          © {new Date().getFullYear()} PT. Linguo Edu Indonesia
        </div>
      </div>
    </footer>
    <TokoCTA />
    </>
  );
}
