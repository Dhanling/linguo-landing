"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

const PLANS = [
  { id:"e-learning", duration:"1 Bulan", price:29000, orig:99000, discount:70, features:["Akses 10+ bahasa","Video materi","Komunitas belajar"] },
  { id:"e-learning-6", duration:"6 Bulan", price:99000, orig:549000, discount:82, popular:true, features:["Akses 10+ bahasa","Video materi","Komunitas belajar","Update gratis","Konsultasi WA"] },
  { id:"e-learning-12", duration:"12 Bulan", price:179000, orig:1188000, discount:85, features:["Akses 10+ bahasa","Video materi","Komunitas belajar","Update gratis","Konsultasi WA","E-sertifikat","Bonus e-book"] },
];

const LANGS = ["🇬🇧 Inggris","🇪🇸 Spanyol","🇩🇪 Jerman","🇯🇵 Jepang","🇨🇳 Mandarin","🇫🇷 Prancis","🇰🇷 Korea","🇸🇦 Arab","🇳🇱 Belanda","🇮🇹 Italia","🇵🇭 Tagalog","🇹🇷 Turki","🇷🇺 Rusia","🇵🇹 Portugis","🇹🇭 Thailand","🇻🇳 Vietnam","🇮🇳 Hindi","🇸🇪 Swedia","🇩🇰 Denmark","🇫🇮 Finlandia"];

export default function ProdukPage() {
  const [tab, setTab] = useState("elearning");
  const [sel, setSel] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [prod, setProd] = useState<{id:string;name:string;price:number}|null>(null);
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [wa, setWa] = useState("");
  const [loading, setLoading] = useState(false); const [error, setError] = useState("");

  const buy = (id: string, nm: string, price: number) => { setProd({id,name:nm,price}); setOpen(true); setError(""); };

  const checkout = async () => {
    if (!name.trim()||!email.trim()||!wa.trim()) { setError("Lengkapi semua field"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/create-invoice", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ name:name.trim(), email:email.trim(), wa_number:wa.trim(), program:"digital", productKey:prod!.id }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error||"Gagal");
      window.location.href = data.invoice_url;
    } catch(e) { setError(e.message); setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-white" style={{fontFamily:"Poppins,sans-serif"}}>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-800 hover:text-teal-600"><span className="font-bold text-lg">← Linguo.id</span></Link>
          <a href="https://wa.me/6282116859493" target="_blank" className="text-sm text-teal-600 font-medium">Butuh bantuan?</a>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-indigo-50"/>
        <div className="relative max-w-6xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-full px-4 py-1.5 mb-6">
            <span className="text-sm font-medium text-teal-700">⚡ Diskon hingga 85%</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4">Belajar 10+ Bahasa<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-indigo-500">Mulai dari Rp 29.000</span></h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto mb-8">Akses e-learning video interaktif & e-book lengkap untuk kuasai bahasa baru.</p>
          <div className="inline-flex bg-slate-100 rounded-2xl p-1.5 gap-1">
            {[{k:"elearning",l:"🎬 E-Learning"},{k:"ebook",l:"📚 E-Book"}].map(t=>(
              <button key={t.k} onClick={()=>setTab(t.k)} className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab===t.k?"bg-white text-slate-900 shadow-md":"text-slate-500"}`}>{t.l}</button>
            ))}
          </div>
        </div>
      </section>

      {tab==="elearning"&&(
        <section className="max-w-6xl mx-auto px-4 pb-20">
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((p,i)=>(
              <motion.div key={p.id} initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{delay:i*0.1}}
                className={`relative rounded-3xl p-8 transition-all hover:-translate-y-1 ${p.popular?"bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-2xl scale-[1.02]":"bg-white border-2 border-slate-100 hover:border-teal-200 hover:shadow-xl"}`}>
                {p.popular&&<div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-bold px-4 py-1.5 rounded-full">⭐ PALING HEMAT</div>}
                <p className={`text-sm font-semibold mb-1 ${p.popular?"text-teal-100":"text-teal-600"}`}>Berlangganan</p>
                <h3 className={`text-2xl font-bold mb-4 ${p.popular?"text-white":"text-slate-900"}`}>{p.duration}</h3>
                <div className="mb-6">
                  <span className={`text-4xl font-extrabold ${p.popular?"text-white":"text-slate-900"}`}>{formatRp(p.price)}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-sm line-through ${p.popular?"text-teal-200":"text-slate-400"}`}>{formatRp(p.orig)}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.popular?"bg-white/20":"bg-red-100 text-red-600"}`}>-{p.discount}%</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {p.features.map(f=><li key={f} className="flex items-center gap-2 text-sm"><span className={p.popular?"text-teal-200":"text-teal-500"}>✓</span><span className={p.popular?"text-teal-50":"text-slate-600"}>{f}</span></li>)}
                </ul>
                <button onClick={()=>buy(p.id,`E-Learning ${p.duration}`,p.price)} className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all ${p.popular?"bg-white text-teal-600 hover:bg-teal-50 shadow-lg":"bg-teal-500 text-white hover:bg-teal-600"}`}>Beli Sekarang</button>
              </motion.div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
            {[{i:"🌍",l:"10+ Bahasa",s:"Inggris, Jepang, dll"},{i:"🎬",l:"Video Interaktif",s:"Belajar kapan saja"},{i:"⏰",l:"Akses Fleksibel",s:"HP atau laptop"},{i:"🏅",l:"E-Sertifikat",s:"Setelah selesai"}].map(f=>(
              <div key={f.l} className="bg-slate-50 rounded-2xl p-5 text-center">
                <div className="text-2xl mb-2">{f.i}</div>
                <p className="text-sm font-semibold text-slate-900">{f.l}</p>
                <p className="text-xs text-slate-400 mt-1">{f.s}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab==="ebook"&&(
        <section className="max-w-6xl mx-auto px-4 pb-20">
          <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-3xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="flex-1">
                <span className="inline-flex items-center gap-2 bg-indigo-100 rounded-full px-3 py-1 mb-4 text-xs font-semibold text-indigo-700">📚 E-Book Digital</span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">E-Book Belajar Bahasa</h2>
                <p className="text-slate-500 mb-4">Modul lengkap dari basic hingga intermediate. Kosakata praktis, contoh percakapan, dan latihan soal.</p>
                <div className="flex items-baseline gap-3 mb-6">
                  <span className="text-4xl font-extrabold text-slate-900">Rp 29.000</span>
                  <span className="text-sm text-slate-400">/e-book</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {["Format PDF","Akses selamanya","Kosakata praktis","Latihan soal","Contoh percakapan","Update gratis"].map(f=>(<div key={f} className="flex items-center gap-2 text-sm text-slate-600"><span className="text-indigo-500">✓</span>{f}</div>))}
                </div>
              </div>
              <div className="w-full md:w-80 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900 mb-3">Pilih bahasa:</p>
                <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto">
                  {LANGS.map(l=>{const nm: string=l.slice(2).trim();return(
                    <button key={l} onClick={()=>setSel(sel===nm?null:nm)} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${sel===nm?"bg-indigo-500 text-white shadow-md":"bg-slate-50 text-slate-700 hover:bg-indigo-50"}`}>{l}</button>
                  );})}
                </div>
                <button disabled={!sel} onClick={()=>sel&&buy("e-book",`E-Book ${sel}`,29000)} className="w-full mt-4 py-3 rounded-2xl font-bold text-sm bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-40 transition-all">{sel?`Beli E-Book ${sel}`:"Pilih bahasa dulu"}</button>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="max-w-6xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Apa Kata Mereka?</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[{n:"Rina A.",t:"E-learning Linguo sangat praktis! Bisa belajar 3 bahasa sekaligus."},{n:"Budi S.",t:"E-book materinya lengkap. Worth it banget cuma 29rb!"},{n:"Sari M.",t:"Sudah 6 bulan berlangganan, progress bahasa Jepang pesat!"}].map((t,i)=>(
            <div key={i} className="bg-slate-50 rounded-2xl p-6">
              <div className="flex gap-1 mb-3">{[1,2,3,4,5].map(j=><span key={j} className="text-amber-400">★</span>)}</div>
              <p className="text-sm text-slate-600 mb-4">&ldquo;{t.t}&rdquo;</p>
              <p className="text-sm font-semibold text-slate-900">{t.n}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="bg-slate-50 rounded-3xl p-8 flex flex-wrap items-center justify-center gap-8">
          {["🔒 Pembayaran Aman","⚡ Akses Instan","🌍 10+ Bahasa","⭐ Google Review 5.0"].map(b=>(
            <span key={b} className="text-sm font-medium text-slate-500">{b}</span>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-400">© 2026 Linguo.id</p>
          <div className="flex gap-4">
            <a href="https://wa.me/6282116859493" target="_blank" className="text-sm text-slate-500 hover:text-teal-600">WhatsApp</a>
            <a href="https://instagram.com/linguo.id" target="_blank" className="text-sm text-slate-500 hover:text-teal-600">Instagram</a>
            <a href="https://tiktok.com/@linguoid" target="_blank" className="text-sm text-slate-500 hover:text-teal-600">TikTok</a>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {open&&prod&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={()=>!loading&&setOpen(false)}>
            <motion.div initial={{opacity:0,y:100}} animate={{opacity:1,y:0}} exit={{opacity:0,y:100}} onClick={e=>e.stopPropagation()} className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-5 text-white">
                <div className="flex items-center justify-between">
                  <div><p className="text-teal-100 text-xs">Checkout</p><h3 className="text-lg font-bold">{prod.name}</h3></div>
                  <button onClick={()=>!loading&&setOpen(false)} className="h-8 w-8 flex items-center justify-center rounded-full bg-white/20">✕</button>
                </div>
                <p className="text-2xl font-extrabold mt-2">{formatRp(prod.price)}</p>
              </div>
              <div className="p-6 space-y-4">
                <div><label className="text-xs font-semibold text-slate-500 mb-1.5 block">Nama Lengkap</label><input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Nama" disabled={loading} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"/></div>
                <div><label className="text-xs font-semibold text-slate-500 mb-1.5 block">Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@contoh.com" disabled={loading} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"/></div>
                <div><label className="text-xs font-semibold text-slate-500 mb-1.5 block">WhatsApp</label><input type="tel" value={wa} onChange={e=>setWa(e.target.value)} placeholder="0821..." disabled={loading} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"/></div>
                {error&&<p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2">{error}</p>}
                <button onClick={checkout} disabled={loading} className="w-full py-3.5 rounded-2xl bg-teal-500 text-white font-bold text-sm hover:bg-teal-600 disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-teal-100">{loading?"⏳ Memproses...":` Bayar ${formatRp(prod.price)}`}</button>
                <p className="text-[11px] text-slate-400 text-center">Pembayaran aman via Xendit: QRIS, GoPay, OVO, Dana, ShopeePay, Transfer Bank</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
