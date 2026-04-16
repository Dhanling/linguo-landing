"use client";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Search, Clock, ChevronRight, ChevronLeft, ArrowRight, Share2, MessageCircle, LayoutGrid, List, Bookmark } from "lucide-react";
import Link from "next/link";

interface BlogPost {
  id: string; slug: string; title: string; content: string; excerpt?: string;
  cover_image?: string; category?: string; tags?: string[];
  status: string; published_at: string; created_at: string; view_count?: number;
}

const CATEGORIES = ["Semua","Tips","Edukasi","Fun","Grammar"];
const CAT_COLORS: Record<string,{bg:string;text:string;ring:string}> = {
  Tips:{bg:"bg-violet-100",text:"text-violet-600",ring:"ring-violet-200"},
  Edukasi:{bg:"bg-rose-100",text:"text-rose-600",ring:"ring-rose-200"},
  Fun:{bg:"bg-emerald-50",text:"text-emerald-600",ring:"ring-emerald-200"},
  Grammar:{bg:"bg-pink-100",text:"text-pink-600",ring:"ring-pink-200"},
};
const GRADIENTS = [
  "from-violet-400 via-purple-400 to-fuchsia-400","from-cyan-400 via-teal-400 to-emerald-400",
  "from-orange-300 via-rose-300 to-pink-400","from-blue-400 via-indigo-400 to-violet-400",
  "from-emerald-300 via-cyan-300 to-blue-400","from-amber-300 via-orange-300 to-red-300",
  "from-teal-300 via-cyan-400 to-blue-300","from-pink-300 via-rose-300 to-red-300",
];
const LANGUAGES = ["English","French","Spanish","Portuguese","German","Japanese","Korean","Arabic","Hindi","Italian","Russian","Mandarin"];
const FEED_BATCH = 8;

function getGrad(slug:string){return GRADIENTS[(slug||"").split("").reduce((a,c)=>a+c.charCodeAt(0),0)%GRADIENTS.length]}
function getInitial(t:string){const m=t?.match(/Bahasa\s+(\S)/);return m?m[1]:t?.[0]||"L"}
function fmtDate(d:string){if(!d)return"";const x=new Date(d),m=["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];return`${m[x.getMonth()]} ${x.getDate()}, ${x.getFullYear()}`}
function fmtDateLong(d:string){if(!d)return"";const x=new Date(d),m=["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];return`${x.getDate()} ${m[x.getMonth()]} ${x.getFullYear()}`}
function stripHtml(s:string){return s?.replace(/<[^>]*>/g,"")||""}
function readTime(content:string){const words=stripHtml(content).split(/\s+/).length;return Math.max(1,Math.ceil(words/200))}

function Badge({category}:{category?:string}){
  const c=category&&CAT_COLORS[category]?CAT_COLORS[category]:{bg:"bg-slate-100",text:"text-slate-600",ring:""};
  return <span className={"inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold "+c.bg+" "+c.text}>{category||"Artikel"}</span>
}

function Cover({post,className="",size="md"}:{post:BlogPost;className?:string;size?:string}){
  if(post.cover_image)return <img src={post.cover_image} alt={post.title} className={"w-full h-full object-cover "+className}/>;
  const g=getGrad(post.slug),i=getInitial(post.title);
  const ts=size==="lg"?"text-[80px]":size==="sm"?"text-2xl":"text-4xl";
  return(<div className={`w-full h-full bg-gradient-to-br ${g} flex items-center justify-center relative overflow-hidden ${className}`}>
    <span className={`text-white/20 font-black ${ts} select-none`}>{i}</span>
    <div className="absolute top-3 right-3 w-12 h-12 rounded-full bg-white/10"/>
    <div className="absolute bottom-3 left-3 w-8 h-8 rounded-full bg-white/10"/>
  </div>)
}

/* ========== FEED VIEW (Medium-style) ========== */
function FeedItem({post}:{post:BlogPost}){
  const rt = readTime(post.content);
  const excerpt = post.excerpt || stripHtml(post.content).slice(0,160);
  return(
    <Link href={"/blog/"+post.slug} className="group block py-6 border-b border-slate-100 last:border-0">
      <div className="flex gap-5">
        <div className="flex-1 min-w-0">
          {/* Author line */}
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#1A9E9E] to-[#2ABFBF] flex items-center justify-center text-white text-[9px] font-bold shrink-0">L</div>
            <span className="text-xs text-slate-500">
              <span className="font-medium text-slate-700">Linguo Team</span>
              {post.category && <> in <span className="font-medium text-slate-700">{post.category}</span></>}
            </span>
          </div>
          {/* Title */}
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug mb-1.5 group-hover:text-[#1A9E9E] transition-colors line-clamp-2">
            {post.title}
          </h2>
          {/* Excerpt */}
          <p className="text-sm text-slate-400 leading-relaxed line-clamp-2 mb-3 hidden sm:block">{excerpt}</p>
          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="text-[#1A9E9E] font-medium">★</span>
            <span>{fmtDate(post.published_at)}</span>
            <span className="flex items-center gap-0.5"><Clock className="w-3 h-3"/> {rt} min read</span>
            {post.view_count ? <span className="flex items-center gap-0.5">👏 {post.view_count}</span> : null}
          </div>
        </div>
        {/* Thumbnail */}
        <div className="w-24 h-24 sm:w-32 sm:h-28 shrink-0 rounded-lg overflow-hidden">
          <Cover post={post} size="sm" className="group-hover:scale-105 transition-transform duration-300"/>
        </div>
      </div>
    </Link>
  )
}

function StaffPicks({posts}:{posts:BlogPost[]}){
  return(
    <div className="mb-8">
      <h3 className="text-sm font-extrabold text-slate-900 mb-4">Staff Picks</h3>
      <div className="space-y-4">
        {posts.slice(0,3).map(p=>(
          <Link key={p.id} href={"/blog/"+p.slug} className="group block">
            <div className="flex items-start gap-2 mb-1">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#1A9E9E] to-[#2ABFBF] flex items-center justify-center text-white text-[8px] font-bold shrink-0 mt-0.5">L</div>
              <span className="text-[11px] text-slate-500">Linguo Team</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-[#1A9E9E] transition-colors ml-7">{p.title}</h4>
            <p className="text-[11px] text-slate-400 mt-1 ml-7">{fmtDate(p.published_at)}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

function RecommendedTopics({active,onSelect}:{active:string;onSelect:(c:string)=>void}){
  return(
    <div className="mb-8">
      <h3 className="text-sm font-extrabold text-slate-900 mb-3">Recommended Topics</h3>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.filter(c=>c!=="Semua").map(c=>{
          const colors=CAT_COLORS[c]||{bg:"bg-slate-100",text:"text-slate-600",ring:""};
          return <button key={c} onClick={()=>onSelect(active===c?"Semua":c)}
            className={"px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border "+(active===c?colors.bg+" "+colors.text+" border-current/20":"bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100")}>{c}</button>
        })}
      </div>
    </div>
  )
}

/* ========== GRID VIEW ========== */
function ArticleCard({post}:{post:BlogPost}){
  const rt=readTime(post.content);
  return(
    <Link href={"/blog/"+post.slug} className="group bg-white rounded-xl overflow-hidden border border-slate-100 hover:shadow-xl hover:border-slate-200 transition-all duration-300 flex flex-col">
      <div className="aspect-[16/10] overflow-hidden"><Cover post={post} className="group-hover:scale-105 transition-transform duration-500"/></div>
      <div className="p-5 flex flex-col flex-1">
        <Badge category={post.category}/>
        <h3 className="font-bold text-[15px] text-slate-900 leading-snug mt-2.5 mb-2 line-clamp-2 group-hover:text-[#1A9E9E] transition-colors">{post.title}</h3>
        <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed flex-1">{post.excerpt||stripHtml(post.content).slice(0,100)}</p>
        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#1A9E9E] to-[#2ABFBF] flex items-center justify-center text-white text-[9px] font-bold">L</div>
            <div><div className="text-[10px] font-medium text-slate-600">Linguo Team</div><div className="text-[9px] text-slate-400">{fmtDate(post.published_at)}</div></div>
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-0.5"><Clock className="w-3 h-3"/>{rt} min</span>
        </div>
      </div>
    </Link>
  )
}

/* ========== SIDEBAR CARDS ========== */
function TerbaruCard({post}:{post:BlogPost}){return(
  <Link href={"/blog/"+post.slug} className="group flex gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-[#1A9E9E]/20 hover:shadow-md transition-all bg-white">
    <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden"><Cover post={post} size="sm"/></div>
    <div className="flex flex-col justify-center min-w-0 flex-1">
      <Badge category={post.category}/>
      <h3 className="text-[12px] font-bold text-slate-900 leading-snug line-clamp-2 mt-1 group-hover:text-[#1A9E9E] transition-colors">{post.title}</h3>
      <span className="text-[10px] text-slate-400 mt-1">{fmtDate(post.published_at)}</span>
    </div>
  </Link>
)}
function PopulerCard({post,rank}:{post:BlogPost;rank:number}){return(
  <Link href={"/blog/"+post.slug} className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-all">
    <span className="text-2xl font-black text-[#1A9E9E]/15 group-hover:text-[#1A9E9E]/30 w-7 text-center shrink-0">{rank}</span>
    <div className="flex flex-col min-w-0 flex-1">
      <Badge category={post.category}/>
      <h3 className="text-[12px] font-bold text-slate-900 leading-snug line-clamp-2 mt-1 group-hover:text-[#1A9E9E] transition-colors">{post.title}</h3>
      <span className="text-[10px] text-slate-400 mt-1">{fmtDate(post.published_at)}</span>
    </div>
  </Link>
)}
function RekomendasiCard({post}:{post:BlogPost}){return(
  <Link href={"/blog/"+post.slug} className="group flex gap-3 items-center p-2.5 rounded-xl hover:bg-slate-50 transition-all">
    <div className="w-12 h-12 shrink-0 rounded-full overflow-hidden ring-2 ring-slate-100 group-hover:ring-[#1A9E9E]/30"><Cover post={post} size="sm"/></div>
    <div className="flex flex-col min-w-0 flex-1">
      <Badge category={post.category}/>
      <h3 className="text-[12px] font-bold text-slate-900 leading-snug line-clamp-2 mt-1 group-hover:text-[#1A9E9E] transition-colors">{post.title}</h3>
      <span className="text-[10px] text-slate-400 mt-1">{fmtDate(post.published_at)}</span>
    </div>
  </Link>
)}

/* ========== PAGINATION ========== */
function Pagination({current,total,onPage}:{current:number;total:number;onPage:(p:number)=>void}){
  if(total<=1)return null;
  const pages:(number|string)[]=[];
  if(total<=7){for(let i=1;i<=total;i++)pages.push(i)}
  else{pages.push(1);if(current>3)pages.push("...");for(let i=Math.max(2,current-1);i<=Math.min(total-1,current+1);i++)pages.push(i);if(current<total-2)pages.push("...");pages.push(total)}
  return(<div className="flex items-center justify-center gap-1.5 my-8">
    {current>1&&<button onClick={()=>onPage(current-1)} className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"><ChevronLeft className="w-4 h-4"/></button>}
    {pages.map((p,i)=>typeof p==="string"?<span key={"d"+i} className="text-slate-300 px-1 text-sm">…</span>:
      <button key={p} onClick={()=>onPage(p)} className={p===current?"w-9 h-9 rounded-full bg-[#1A9E9E] text-white font-bold text-sm shadow-sm":"w-9 h-9 rounded-full text-slate-500 hover:bg-slate-100 font-medium text-sm transition-colors"}>{p}</button>)}
    {current<total&&<button onClick={()=>onPage(current+1)} className="ml-1.5 px-4 py-2 bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold text-xs rounded-full transition-colors flex items-center gap-1 shadow-sm">next<ChevronRight className="w-3.5 h-3.5"/></button>}
  </div>)
}

/* ========== FOOTER ========== */
function BlogFooter(){return(
  <footer className="bg-[#1A9E9E] text-white mt-14">
    <div className="max-w-7xl mx-auto px-6 py-14">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <h4 className="font-bold text-lg mb-4">Learn a Language</h4>
          <div className="space-y-1.5 text-sm text-white/80">{LANGUAGES.map(l=><a key={l} href={"/?lang="+l.toLowerCase()} className="block hover:text-white transition-colors">Learn {l}</a>)}<a href="/" className="block hover:text-white font-medium mt-2">Learn More Languages</a></div>
        </div>
        <div>
          <h4 className="font-bold text-lg mb-4">Level Option</h4>
          <div className="space-y-1.5 text-sm text-white/80 mb-5">{["Basic","Upper Basic","Intermediate","Advance"].map(l=><span key={l} className="block">{l}</span>)}</div>
          <h4 className="font-bold text-lg mb-4">Program</h4>
          <div className="space-y-1.5 text-sm text-white/80">{["Regular Class","Private Class","IELTS Class","TOEFL Class"].map(p=><span key={p} className="block">{p}</span>)}</div>
        </div>
        <div>
          <h4 className="font-bold text-lg mb-4">Teaching</h4>
          <a href="/jadi-pengajar" className="text-sm text-white/80 hover:text-white block mb-5">Become a Teacher</a>
          <p className="text-sm text-white/80 leading-relaxed mb-5">Happy Creative Hub, Jl. Cisitu Indah III No.2, Dago, Coblong, Bandung 40135</p>
          <h4 className="font-bold text-lg mb-4">Customer Service</h4>
          <div className="space-y-1 text-sm text-white/80">
            <p>WA : <a href="https://wa.me/6282116859493" className="hover:text-white">6282116859493</a></p>
            <p>Tel : (022) 85942550</p>
            <p>Email : <a href="mailto:info@linguo.id" className="hover:text-white">info@linguo.id</a></p>
          </div>
        </div>
        <div className="flex flex-col items-start lg:items-end">
          <a href="/"><img src="/images/logo-white.png" alt="Linguo" className="h-12 mb-4"/></a>
          <p className="text-sm text-white/60 mb-4">&copy; {new Date().getFullYear()} PT. Linguo Edu Indonesia</p>
          <div className="flex gap-2.5">
            {[{h:"https://facebook.com/linguo.id",l:"fb"},{h:"https://instagram.com/linguo.id",l:"ig"},{h:"https://threads.net/@linguo.id",l:"th"},{h:"https://linkedin.com/company/linguo-id",l:"in"},{h:"https://youtube.com/@linguoid",l:"yt"}].map(s=>
              <a key={s.l} href={s.h} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-xs font-bold transition-colors">{s.l}</a>)}
          </div>
        </div>
      </div>
    </div>
    <div className="border-t border-white/10"><div className="max-w-7xl mx-auto px-6 py-3.5 text-center text-xs text-white/40">Linguo.id — Everyone Can Be a Polyglot</div></div>
  </footer>
)}

/* ========== MAIN ========== */
export default function BlogContent({initialPosts}:{initialPosts:BlogPost[]}){
  const [search,setSearch]=useState("");
  const [activeCategory,setActiveCategory]=useState("Semua");
  const [view,setView]=useState<"feed"|"grid">("feed");
  const [page,setPage]=useState(1);
  const [feedCount,setFeedCount]=useState(FEED_BATCH);
  const loaderRef=useRef<HTMLDivElement>(null);

  const filtered=useMemo(()=>{
    let posts=initialPosts;
    if(activeCategory!=="Semua")posts=posts.filter(p=>p.category===activeCategory);
    if(search.trim()){const q=search.toLowerCase();posts=posts.filter(p=>p.title.toLowerCase().includes(q)||(p.excerpt||"").toLowerCase().includes(q))}
    return posts;
  },[initialPosts,activeCategory,search]);

  // Infinite scroll for feed view
  const loadMore=useCallback(()=>{if(feedCount<filtered.length)setFeedCount(c=>Math.min(c+FEED_BATCH,filtered.length))},[feedCount,filtered.length]);
  useEffect(()=>{
    if(view!=="feed")return;
    const observer=new IntersectionObserver(([e])=>{if(e.isIntersecting)loadMore()},{rootMargin:"200px"});
    if(loaderRef.current)observer.observe(loaderRef.current);
    return()=>observer.disconnect();
  },[view,loadMore]);

  // Reset on filter change
  useEffect(()=>{setFeedCount(FEED_BATCH);setPage(1)},[activeCategory,search]);

  const GRID_PER_PAGE=6;
  const totalPages=Math.ceil(filtered.length/GRID_PER_PAGE);
  const gridPaged=filtered.slice((page-1)*GRID_PER_PAGE,page*GRID_PER_PAGE);
  const feedVisible=filtered.slice(0,feedCount);

  const staffPicks=[...filtered].sort((a,b)=>(b.view_count||0)-(a.view_count||0)).slice(0,3);
  const terbaru=filtered.slice(0,3);
  const populer=staffPicks;
  const rekomendasi=filtered.length>3?filtered.slice(Math.max(0,filtered.length-3)):filtered;

  return(
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="/" className="flex items-center">
              <img src="/images/logo-color.png" alt="Linguo" className="h-7 sm:h-9 object-contain" onError={(e)=>{(e.target as HTMLImageElement).src="/images/logo-white.png";(e.target as HTMLImageElement).className="h-7 sm:h-9 object-contain brightness-0"}}/>
            </a>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300"/>
              <input type="text" placeholder="Search" value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}
                className="w-52 pl-9 pr-3 py-1.5 rounded-full bg-slate-50 border-0 focus:bg-white focus:ring-1 focus:ring-slate-200 outline-none text-sm transition-all"/>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* View toggle */}
            <div className="flex items-center bg-slate-100 rounded-full p-0.5">
              <button onClick={()=>setView("feed")} className={`p-1.5 rounded-full transition-all ${view==="feed"?"bg-white shadow-sm text-[#1A9E9E]":"text-slate-400 hover:text-slate-600"}`} title="Feed view">
                <List className="w-4 h-4"/>
              </button>
              <button onClick={()=>setView("grid")} className={`p-1.5 rounded-full transition-all ${view==="grid"?"bg-white shadow-sm text-[#1A9E9E]":"text-slate-400 hover:text-slate-600"}`} title="Grid view">
                <LayoutGrid className="w-4 h-4"/>
              </button>
            </div>
            <a href="/" className="bg-[#1A9E9E] hover:bg-[#178585] text-white text-sm font-semibold px-4 py-1.5 rounded-full transition-colors hidden sm:block">Mulai Belajar</a>
          </div>
        </div>
      </nav>

      {/* Tab bar */}
      <div className="border-b border-slate-100 bg-white">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center gap-6 h-11 overflow-x-auto">
          {CATEGORIES.map(c=>(
            <button key={c} onClick={()=>{setActiveCategory(c);setPage(1)}}
              className={`text-sm whitespace-nowrap pb-3 pt-3 border-b-2 transition-all ${activeCategory===c?"border-[#1A9E9E] text-[#1A9E9E] font-semibold":"border-transparent text-slate-400 hover:text-slate-600"}`}>
              {c === "Semua" ? "For you" : c}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile search */}
      <div className="md:hidden px-6 pt-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
          <input type="text" placeholder="Cari artikel..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-200 outline-none text-sm bg-white"/>
        </div>
      </div>

      {filtered.length===0?(
        <div className="text-center py-20"><p className="text-slate-400 text-lg">Belum ada artikel.</p></div>
      ):(
        <>
          {/* ===== FEED VIEW ===== */}
          {view==="feed"&&(
            <div className="max-w-[1200px] mx-auto px-6 py-6">
              <div className="flex gap-12">
                {/* Main feed */}
                <div className="flex-1 min-w-0 max-w-[680px]">
                  {feedVisible.map(post=><FeedItem key={post.id} post={post}/>)}
                  {feedCount<filtered.length&&(
                    <div ref={loaderRef} className="py-8 text-center">
                      <div className="inline-block w-6 h-6 border-2 border-slate-200 border-t-[#1A9E9E] rounded-full animate-spin"/>
                    </div>
                  )}
                  {feedCount>=filtered.length&&filtered.length>0&&(
                    <p className="text-center text-sm text-slate-300 py-8">— Semua artikel sudah ditampilkan —</p>
                  )}
                </div>
                {/* Sidebar */}
                <div className="hidden lg:block w-[320px] shrink-0 pl-8 border-l border-slate-100">
                  <div className="sticky top-20">
                    <StaffPicks posts={staffPicks}/>
                    <div className="border-t border-slate-100 pt-6">
                      <RecommendedTopics active={activeCategory} onSelect={c=>setActiveCategory(c)}/>
                    </div>
                    <div className="border-t border-slate-100 pt-6">
                      <h3 className="text-sm font-extrabold text-slate-900 mb-3">Belajar Bahasa</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {LANGUAGES.slice(0,8).map(l=>(
                          <a key={l} href={"/?lang="+l.toLowerCase()} className="text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full hover:bg-[#1A9E9E]/5 hover:text-[#1A9E9E] transition-colors">{l}</a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== GRID VIEW ===== */}
          {view==="grid"&&(
            <div className="max-w-7xl mx-auto px-6 py-6">
              {/* Banner */}
              {page===1&&!search&&(
                <div className="bg-gradient-to-r from-[#1A9E9E] via-[#2ABFBF] to-[#1A9E9E] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 shadow-sm">
                  <div>
                    <p className="text-white/70 text-xs font-semibold tracking-wider uppercase mb-1">Linguo.id Blog</p>
                    <h2 className="text-white text-xl sm:text-2xl font-extrabold">Everyone Can Be a Polyglot</h2>
                    <p className="text-white/80 text-sm mt-1">60+ bahasa tersedia dengan pengajar profesional</p>
                  </div>
                  <a href="/" className="shrink-0 bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold px-6 py-3 rounded-full text-sm transition-all shadow-sm">Mulai Belajar →</a>
                </div>
              )}

              {/* Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
                {gridPaged.map(post=><ArticleCard key={post.id} post={post}/>)}
              </div>

              <Pagination current={page} total={totalPages} onPage={p=>{setPage(p);window.scrollTo({top:0,behavior:"smooth"})}}/>

              {/* Bottom sections */}
              {page===1&&!search&&filtered.length>=2&&(
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 mb-3 flex items-center gap-2"><span className="w-1 h-4 bg-[#1A9E9E] rounded-full"/>Artikel Terbaru</h2>
                    <div className="space-y-2">{terbaru.map(p=><TerbaruCard key={p.id} post={p}/>)}</div>
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 mb-3 flex items-center gap-2"><span className="w-1 h-4 bg-[#fbbf24] rounded-full"/>Artikel Populer</h2>
                    <div className="space-y-2">{populer.map((p,i)=><PopulerCard key={p.id} post={p} rank={i+1}/>)}</div>
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 mb-3 flex items-center gap-2"><span className="w-1 h-4 bg-rose-400 rounded-full"/>Direkomendasikan</h2>
                    <div className="space-y-2">{rekomendasi.map(p=><RekomendasiCard key={p.id} post={p}/>)}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <BlogFooter/>
    </div>
  )
}
