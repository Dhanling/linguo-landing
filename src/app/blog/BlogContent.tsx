"use client";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Search, Clock, ChevronRight, ChevronLeft, ArrowRight, LayoutGrid, List, MoreHorizontal, Bookmark, MessageCircle, X, Moon, Sun } from "lucide-react";
import Link from "next/link";

interface BlogPost {
  id: string; slug: string; title: string; content: string; excerpt?: string;
  cover_image?: string; category?: string; tags?: string[];
  status: string; published_at: string; created_at: string; view_count?: number;
}

const CATEGORIES = ["Semua","Tips","Edukasi","Fun","Grammar"];
const CAT_COLORS: Record<string,{bg:string;text:string}> = {
  Tips:{bg:"bg-violet-100",text:"text-violet-600"},
  Edukasi:{bg:"bg-rose-100",text:"text-rose-600"},
  Fun:{bg:"bg-emerald-50",text:"text-emerald-600"},
  Grammar:{bg:"bg-pink-100",text:"text-pink-600"},
};
const GRADS = [
  "from-violet-400 via-purple-400 to-fuchsia-400","from-cyan-400 via-teal-400 to-emerald-400",
  "from-orange-300 via-rose-300 to-pink-400","from-blue-400 via-indigo-400 to-violet-400",
  "from-emerald-300 via-cyan-300 to-blue-400","from-amber-300 via-orange-300 to-red-300",
  "from-teal-300 via-cyan-400 to-blue-300","from-pink-300 via-rose-300 to-red-300",
];
const LANGS = ["English","French","Spanish","Portuguese","German","Japanese","Korean","Arabic","Hindi","Italian","Russian","Mandarin"];
const FEED_BATCH = 8;

function getGrad(s:string){return GRADS[(s||"").split("").reduce((a,c)=>a+c.charCodeAt(0),0)%GRADS.length]}
function getInit(t:string){const m=t?.match(/Bahasa\s+(\S)/);return m?m[1]:t?.[0]||"L"}
function fmtD(d:string){if(!d)return"";const x=new Date(d),m=["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];return`${m[x.getMonth()]} ${x.getDate()}, ${x.getFullYear()}`}
function strip(s:string){return s?.replace(/<[^>]*>/g,"")||""}
function rt(c:string){return Math.max(1,Math.ceil(strip(c).split(/\s+/).length/200))}

// localStorage helpers
function getClaps(slug:string):number{try{return parseInt(localStorage.getItem("clap_"+slug)||"0")}catch{return 0}}
function setClaps(slug:string,n:number){try{localStorage.setItem("clap_"+slug,String(n))}catch{}}
function isSaved(slug:string):boolean{try{return localStorage.getItem("save_"+slug)==="1"}catch{return false}}
function toggleSave(slug:string):boolean{try{const v=isSaved(slug);localStorage.setItem("save_"+slug,v?"0":"1");return!v}catch{return false}}
function isHidden(slug:string):boolean{try{return localStorage.getItem("hide_"+slug)==="1"}catch{return false}}
function hidePost(slug:string){try{localStorage.setItem("hide_"+slug,"1")}catch{}}

function Badge({cat}:{cat?:string}){
  const c=cat&&CAT_COLORS[cat]?CAT_COLORS[cat]:{bg:"bg-slate-100",text:"text-slate-600"};
  return <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${c.bg} ${c.text}`}>{cat||"Artikel"}</span>
}

function Cover({post,cls="",sz="md"}:{post:BlogPost;cls?:string;sz?:string}){
  if(post.cover_image)return <img src={post.cover_image} alt={post.title} className={`w-full h-full object-cover ${cls}`}/>;
  const g=getGrad(post.slug),i=getInit(post.title);
  const ts=sz==="lg"?"text-[80px]":sz==="sm"?"text-2xl":"text-4xl";
  return <div className={`w-full h-full bg-gradient-to-br ${g} flex items-center justify-center relative overflow-hidden ${cls}`}>
    <span className={`text-white/20 font-black ${ts} select-none`}>{i}</span>
    <div className="absolute top-3 right-3 w-12 h-12 rounded-full bg-white/10"/>
  </div>
}

/* ===== CLAP BUTTON ===== */
function ClapButton({slug}:{slug:string}){
  const [count,setCount]=useState(0);
  const [animate,setAnimate]=useState(false);
  useEffect(()=>setCount(getClaps(slug)),[slug]);
  const clap=()=>{const n=count+1;setCount(n);setClaps(slug,n);setAnimate(true);setTimeout(()=>setAnimate(false),300)};
  return(
    <button onClick={(e)=>{e.preventDefault();e.stopPropagation();clap()}} className="flex items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors group" title="Clap">
      <span className={`text-lg transition-transform ${animate?"scale-125":""}`}>👏</span>
      {count>0&&<span className="text-xs">{count}</span>}
    </button>
  )
}

/* ===== BOOKMARK BUTTON ===== */
function BookmarkBtn({slug}:{slug:string}){
  const [saved,setSaved]=useState(false);
  useEffect(()=>setSaved(isSaved(slug)),[slug]);
  return(
    <button onClick={(e)=>{e.preventDefault();e.stopPropagation();setSaved(toggleSave(slug))}} className={`transition-colors ${saved?"text-[#1A9E9E]":"text-slate-300 hover:text-slate-500"}`} title={saved?"Unsave":"Save"}>
      <Bookmark className={`w-[18px] h-[18px] ${saved?"fill-current":""}`}/>
    </button>
  )
}

/* ===== MORE MENU ===== */
function MoreMenu({slug,onHide}:{slug:string;onHide:()=>void}){
  const [open,setOpen]=useState(false);
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{const fn=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false)};document.addEventListener("click",fn);return()=>document.removeEventListener("click",fn)},[]);
  return(
    <div className="relative" ref={ref}>
      <button onClick={(e)=>{e.preventDefault();e.stopPropagation();setOpen(!open)}} className="text-slate-300 hover:text-slate-500 transition-colors">
        <MoreHorizontal className="w-5 h-5"/>
      </button>
      {open&&(
        <div className="dm-more absolute right-0 top-8 bg-white border border-slate-200 rounded-xl shadow-xl py-1 w-52 z-50">
          <button onClick={(e)=>{e.preventDefault();e.stopPropagation();hidePost(slug);onHide();setOpen(false)}} className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2">
            <X className="w-4 h-4"/> Not interested
          </button>
          <button onClick={(e)=>{e.preventDefault();e.stopPropagation();navigator.clipboard?.writeText(`https://linguo.id/blog/${slug}`);setOpen(false)}} className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2">
            <ArrowRight className="w-4 h-4"/> Copy link
          </button>
        </div>
      )}
    </div>
  )
}

/* ===== FEED ITEM ===== */
function FeedItem({post,onHide}:{post:BlogPost;onHide:()=>void}){
  const mins=rt(post.content);
  const exc=post.excerpt||strip(post.content).slice(0,160);
  const dmCls=typeof window!=="undefined"&&document.querySelector(".blog-dm")?"dm-active":"";
  return(
    <article className={`py-7 border-b last:border-0 dm-border border-slate-100`}>
      {/* Author line */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#1A9E9E] to-[#2ABFBF] flex items-center justify-center text-white text-[9px] font-bold shrink-0">L</div>
        <span className="text-[13px] text-slate-500">
          <span className="font-semibold text-[#0f172a]">Linguo Team</span>
          {post.category&&<> in <span className="font-semibold text-[#0f172a]">{post.category}</span></>}
        </span>
      </div>
      {/* Content row */}
      <Link href={"/blog/"+post.slug} className="group flex gap-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-[22px] font-extrabold leading-snug mb-1 group-hover:text-[#1A9E9E] transition-colors line-clamp-2 dm-text-main text-[#0f172a]">{post.title}</h2>
          <p className="text-[15px] text-slate-600 leading-relaxed line-clamp-2 mb-0 hidden sm:block">{exc}</p>
        </div>
        <div className="w-28 h-28 sm:w-36 sm:h-32 shrink-0 rounded-lg overflow-hidden">
          <Cover post={post} sz="sm" cls="group-hover:scale-105 transition-transform duration-300"/>
        </div>
      </Link>
      {/* Action bar */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="text-[#1A9E9E]">★</span>
          <span>{fmtD(post.published_at)}</span>
          <span className="flex items-center gap-0.5"><Clock className="w-3 h-3"/>{mins} min read</span>
        </div>
        <div className="flex items-center gap-3">
          <ClapButton slug={post.slug}/>
          <Link href={"/blog/"+post.slug} className="flex items-center gap-1 text-slate-300 hover:text-slate-500 transition-colors" title="Comments">
            <MessageCircle className="w-[18px] h-[18px]"/>
            <span className="text-xs">{post.view_count||0}</span>
          </Link>
          <BookmarkBtn slug={post.slug}/>
          <MoreMenu slug={post.slug} onHide={onHide}/>
        </div>
      </div>
    </article>
  )
}

/* ===== SIDEBAR ===== */
function StaffPicks({posts}:{posts:BlogPost[]}){return(
  <div className="mb-8">
    <h3 className="text-[15px] font-extrabold text-[#0f172a] mb-4">Staff Picks</h3>
    <div className="space-y-5">
      {posts.slice(0,3).map(p=>(
        <Link key={p.id} href={"/blog/"+p.slug} className="group block">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#1A9E9E] to-[#2ABFBF] flex items-center justify-center text-white text-[8px] font-bold shrink-0">L</div>
            <span className="text-[11px] text-slate-500 font-medium">Linguo Team</span>
          </div>
          <h4 className="text-[14px] font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-[#1A9E9E] transition-colors">{p.title}</h4>
          <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1"><span className="text-[#1A9E9E]">★</span>{fmtD(p.published_at)}</p>
        </Link>
      ))}
    </div>
  </div>
)}

function RecTopics({active,onSelect}:{active:string;onSelect:(c:string)=>void}){return(
  <div className="mb-8">
    <h3 className="text-[15px] font-extrabold text-slate-900 mb-3">Recommended Topics</h3>
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.filter(c=>c!=="Semua").map(c=>{
        const cl=CAT_COLORS[c]||{bg:"bg-slate-100",text:"text-slate-600"};
        return <button key={c} onClick={()=>onSelect(active===c?"Semua":c)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border ${active===c?cl.bg+" "+cl.text+" border-current/20":"bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}>{c}</button>
      })}
    </div>
  </div>
)}

/* ===== GRID CARD ===== */
function GridCard({post}:{post:BlogPost}){
  const mins=rt(post.content);
  return(
    <Link href={"/blog/"+post.slug} className="group dm-card bg-white rounded-xl overflow-hidden border border-slate-100 hover:shadow-2xl hover:border-slate-200 hover:-translate-y-1 transition-all duration-300 flex flex-col">
      <div className="aspect-[16/10] overflow-hidden relative">
        <Cover post={post} cls="group-hover:scale-110 transition-transform duration-500 ease-out"/>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <Badge cat={post.category}/>
        <h3 className="font-extrabold text-[17px] dm-text-main text-[#0f172a] leading-snug mt-2 mb-2 line-clamp-2 group-hover:text-[#1A9E9E] transition-colors">{post.title}</h3>
        <p className="text-[13px] dm-text-muted text-slate-600 leading-relaxed line-clamp-2 mb-4 flex-1">{post.excerpt||strip(post.content).slice(0,100)}</p>
        <div className="flex items-center justify-between pt-3 border-t dm-border border-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#1A9E9E] to-[#2ABFBF] flex items-center justify-center text-white text-[9px] font-bold">L</div>
            <div><div className="text-[10px] font-medium dm-text-muted text-slate-600">Linguo Team</div><div className="text-[9px] dm-text-muted text-slate-400">{fmtD(post.published_at)}</div></div>
          </div>
          <span className="text-xs dm-text-muted text-slate-400 flex items-center gap-0.5"><Clock className="w-3 h-3"/>{mins} min</span>
        </div>
      </div>
    </Link>
  )
}

/* ===== BOTTOM SECTIONS ===== */
function SmCard({post}:{post:BlogPost}){return(
  <Link href={"/blog/"+post.slug} className="group flex gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-[#1A9E9E]/20 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 bg-white">
    <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden"><Cover post={post} sz="sm" cls="group-hover:scale-110 transition-transform duration-300"/></div>
    <div className="flex flex-col justify-center min-w-0 flex-1">
      <Badge cat={post.category}/><h3 className="text-[12px] font-bold text-slate-900 leading-snug line-clamp-2 mt-1 group-hover:text-[#1A9E9E] transition-colors">{post.title}</h3>
      <span className="text-[10px] text-slate-400 mt-1">{fmtD(post.published_at)}</span>
    </div>
  </Link>
)}
function RankCard({post,rank}:{post:BlogPost;rank:number}){return(
  <Link href={"/blog/"+post.slug} className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-all">
    <span className="text-2xl font-black text-[#1A9E9E]/15 group-hover:text-[#1A9E9E]/30 w-7 text-center shrink-0">{rank}</span>
    <div className="flex flex-col min-w-0 flex-1">
      <Badge cat={post.category}/><h3 className="text-[12px] font-bold text-slate-900 leading-snug line-clamp-2 mt-1 group-hover:text-[#1A9E9E] transition-colors">{post.title}</h3>
      <span className="text-[10px] text-slate-400 mt-1">{fmtD(post.published_at)}</span>
    </div>
  </Link>
)}
function CircCard({post}:{post:BlogPost}){return(
  <Link href={"/blog/"+post.slug} className="group flex gap-3 items-center p-2.5 rounded-xl hover:bg-slate-50 transition-all">
    <div className="w-12 h-12 shrink-0 rounded-full overflow-hidden ring-2 ring-slate-100 group-hover:ring-[#1A9E9E]/30"><Cover post={post} sz="sm"/></div>
    <div className="flex flex-col min-w-0 flex-1">
      <Badge cat={post.category}/><h3 className="text-[12px] font-bold text-slate-900 leading-snug line-clamp-2 mt-1 group-hover:text-[#1A9E9E] transition-colors">{post.title}</h3>
      <span className="text-[10px] text-slate-400 mt-1">{fmtD(post.published_at)}</span>
    </div>
  </Link>
)}

/* ===== PAGINATION ===== */
function Pagi({cur,tot,go}:{cur:number;tot:number;go:(p:number)=>void}){
  if(tot<=1)return null;
  const pgs:(number|string)[]=[];
  if(tot<=7){for(let i=1;i<=tot;i++)pgs.push(i)}else{pgs.push(1);if(cur>3)pgs.push("...");for(let i=Math.max(2,cur-1);i<=Math.min(tot-1,cur+1);i++)pgs.push(i);if(cur<tot-2)pgs.push("...");pgs.push(tot)}
  return <div className="flex items-center justify-center gap-1.5 my-8">
    {cur>1&&<button onClick={()=>go(cur-1)} className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"><ChevronLeft className="w-4 h-4"/></button>}
    {pgs.map((p,i)=>typeof p==="string"?<span key={"d"+i} className="text-slate-300 px-1 text-sm">…</span>:
      <button key={p} onClick={()=>go(p)} className={p===cur?"w-9 h-9 rounded-full bg-[#1A9E9E] text-white font-bold text-sm shadow-sm":"w-9 h-9 rounded-full text-slate-500 hover:bg-slate-100 font-medium text-sm"}>{p}</button>)}
    {cur<tot&&<button onClick={()=>go(cur+1)} className="ml-1.5 px-4 py-2 bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold text-xs rounded-full flex items-center gap-1 shadow-sm">next<ChevronRight className="w-3.5 h-3.5"/></button>}
  </div>
}

/* ===== FOOTER ===== */
function Footer(){return(
  <footer className="bg-[#1A9E9E] text-white mt-14">
    <div className="max-w-7xl mx-auto px-6 py-14">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div><h4 className="font-bold text-lg mb-4">Learn a Language</h4><div className="space-y-1.5 text-sm text-white/80">{LANGS.map(l=><a key={l} href={"/?lang="+l.toLowerCase()} className="block hover:text-white transition-colors">Learn {l}</a>)}</div></div>
        <div><h4 className="font-bold text-lg mb-4">Level</h4><div className="space-y-1.5 text-sm text-white/80 mb-5">{["Basic","Upper Basic","Intermediate","Advance"].map(l=><span key={l} className="block">{l}</span>)}</div><h4 className="font-bold text-lg mb-4">Program</h4><div className="space-y-1.5 text-sm text-white/80">{["Regular","Private","IELTS","TOEFL"].map(p=><span key={p} className="block">{p} Class</span>)}</div></div>
        <div><h4 className="font-bold text-lg mb-4">Teaching</h4><a href="/jadi-pengajar" className="text-sm text-white/80 hover:text-white block mb-5">Become a Teacher</a><p className="text-sm text-white/80 leading-relaxed mb-5">Happy Creative Hub, Jl. Cisitu Indah III No.2, Dago, Coblong, Bandung 40135</p><h4 className="font-bold text-lg mb-4">Customer Service</h4><div className="space-y-1 text-sm text-white/80"><p>WA: <a href="https://wa.me/6282116859493" className="hover:text-white">6282116859493</a></p><p>Tel: (022)85942550</p><p>Email: <a href="mailto:info@linguo.id" className="hover:text-white">info@linguo.id</a></p></div></div>
        <div className="flex flex-col items-start lg:items-end"><a href="/"><img src="/images/logo-white.png" alt="Linguo" className="h-12 mb-4"/></a><p className="text-sm text-white/60 mb-4">&copy; {new Date().getFullYear()} PT. Linguo Edu Indonesia</p><div className="flex gap-2.5">{[{h:"https://instagram.com/linguo.id",l:"ig"},{h:"https://youtube.com/@linguoid",l:"yt"},{h:"https://linkedin.com/company/linguo-id",l:"in"},{h:"https://facebook.com/linguo.id",l:"fb"}].map(s=><a key={s.l} href={s.h} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-xs font-bold transition-colors">{s.l}</a>)}</div></div>
      </div>
    </div>
    <div className="border-t border-white/10"><div className="max-w-7xl mx-auto px-6 py-3.5 text-center text-xs text-white/40">Linguo.id — Everyone Can Be a Polyglot</div></div>
  </footer>
)}

/* ===== MAIN COMPONENT ===== */
export default function BlogContent({initialPosts}:{initialPosts:BlogPost[]}){
  const [search,setSearch]=useState("");
  const [activeCat,setActiveCat]=useState("Semua");
  const [view,setView]=useState<"feed"|"grid">("feed");
  const [page,setPage]=useState(1);
  const [feedN,setFeedN]=useState(FEED_BATCH);
  const [hiddenSlugs,setHiddenSlugs]=useState<Set<string>>(new Set());
  const loaderRef=useRef<HTMLDivElement>(null);
  const [dm,setDm]=useState(false);
  useEffect(()=>{
    const saved=localStorage.getItem("blog_dm")==="1";
    setDm(saved);
  },[]);
  const toggleDm=()=>{const next=!dm;setDm(next);localStorage.setItem("blog_dm",next?"1":"0")};

  // Load hidden posts from localStorage
  useEffect(()=>{
    const h=new Set<string>();
    initialPosts.forEach(p=>{if(isHidden(p.slug))h.add(p.slug)});
    setHiddenSlugs(h);
  },[initialPosts]);

  const filtered=useMemo(()=>{
    let posts=initialPosts.filter(p=>!hiddenSlugs.has(p.slug));
    if(activeCat!=="Semua")posts=posts.filter(p=>p.category===activeCat);
    if(search.trim()){const q=search.toLowerCase();posts=posts.filter(p=>p.title.toLowerCase().includes(q)||(p.excerpt||"").toLowerCase().includes(q))}
    return posts;
  },[initialPosts,activeCat,search,hiddenSlugs]);

  const loadMore=useCallback(()=>{if(feedN<filtered.length)setFeedN(c=>Math.min(c+FEED_BATCH,filtered.length))},[feedN,filtered.length]);
  useEffect(()=>{
    if(view!=="feed")return;
    const obs=new IntersectionObserver(([e])=>{if(e.isIntersecting)loadMore()},{rootMargin:"300px"});
    if(loaderRef.current)obs.observe(loaderRef.current);
    return()=>obs.disconnect();
  },[view,loadMore]);
  useEffect(()=>{setFeedN(FEED_BATCH);setPage(1)},[activeCat,search]);

  const GP=6;
  const totP=Math.ceil(filtered.length/GP);
  const gridPg=filtered.slice((page-1)*GP,page*GP);
  const feedVis=filtered.slice(0,feedN);
  const picks=[...filtered].sort((a,b)=>(b.view_count||0)-(a.view_count||0)).slice(0,3);
  const terbaru=filtered.slice(0,3);
  const rekom=filtered.length>3?filtered.slice(Math.max(0,filtered.length-3)):filtered;

  const doHide=(slug:string)=>{setHiddenSlugs(prev=>{const n=new Set(prev);n.add(slug);return n})};

  return(
    <div className={`min-h-screen transition-colors duration-300 ${dm?"bg-[#0f172a] blog-dm":"bg-white"}`} style={{fontFamily:"'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,sans-serif"}}>
      <style dangerouslySetInnerHTML={{__html:`
        .blog-dm .dm-nav { background:#111827 !important; border-color:#1e293b !important; }
        .blog-dm .dm-tab { background:#111827 !important; border-color:#1e293b !important; }
        .blog-dm .dm-input { background:#1e293b !important; color:#e2e8f0 !important; }
        .blog-dm .dm-card { background:#1e293b !important; border-color:#334155 !important; }
        .blog-dm .dm-text-main { color:#f1f5f9 !important; }
        .blog-dm .dm-text-muted { color:#94a3b8 !important; }
        .blog-dm .dm-border { border-color:#334155 !important; }
        .blog-dm .dm-sidebar { border-color:#1e293b !important; }
        .blog-dm .dm-more { background:#1e293b !important; border-color:#334155 !important; }
        .blog-dm .dm-more button { color:#cbd5e1 !important; }
        .blog-dm .dm-more button:hover { background:#334155 !important; }
      `}}/>
      <style dangerouslySetInnerHTML={{__html:`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500&display=swap');`}}/>
      {/* NAV */}
      <nav className="dm-nav bg-white border-b border-slate-100 sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a href="/" className="flex items-center shrink-0">
              <img src="/images/logo-color.png" alt="Linguo" className="h-7 sm:h-9 object-contain" onError={(e)=>{(e.target as HTMLImageElement).src="/images/logo-white.png";(e.target as HTMLImageElement).className="h-7 sm:h-9 object-contain brightness-0"}}/>
            </a>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300"/>
              <input type="text" placeholder="Search" value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}
                className="w-52 pl-9 pr-3 py-1.5 rounded-full bg-slate-50 border-0 focus:bg-white focus:ring-1 focus:ring-slate-200 outline-none text-sm transition-all"/>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 rounded-full p-0.5">
              <button onClick={()=>setView("feed")} className={`p-1.5 rounded-full transition-all ${view==="feed"?"bg-white shadow-sm text-[#1A9E9E]":"text-slate-400 hover:text-slate-600"}`} title="Feed"><List className="w-4 h-4"/></button>
              <button onClick={()=>setView("grid")} className={`p-1.5 rounded-full transition-all ${view==="grid"?"bg-white shadow-sm text-[#1A9E9E]":"text-slate-400 hover:text-slate-600"}`} title="Grid"><LayoutGrid className="w-4 h-4"/></button>
            </div>
            <button
              onClick={toggleDm}
              title={dm?"Light mode":"Dark mode"}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${dm?"bg-slate-700 text-yellow-300 hover:bg-slate-600":"bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
            >
              {dm?<Sun className="w-4 h-4"/>:<Moon className="w-4 h-4"/>}
            </button>
            <a href="/" className="bg-[#1A9E9E] hover:bg-[#178585] text-white text-sm font-semibold px-4 py-1.5 rounded-full transition-colors hidden sm:block">Mulai Belajar</a>
          </div>
        </div>
      </nav>

      {/* TABS */}
      <div className="dm-tab border-b border-slate-100 bg-white transition-colors duration-300">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center gap-6 overflow-x-auto">
          {CATEGORIES.map(c=>(
            <button key={c} onClick={()=>{setActiveCat(c);setPage(1)}}
              className={`text-sm whitespace-nowrap py-3 transition-all relative font-semibold ${activeCat===c?(dm?"text-white":"text-[#0f172a]"):(dm?"text-slate-500 hover:text-slate-300":"text-slate-400 hover:text-slate-700")}`}>
              {c==="Semua"?"For you":c}
              {activeCat===c&&<span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1A9E9E] rounded-full"/>}
            </button>
          ))}
        </div>
      </div>

      {/* MOBILE SEARCH */}
      <div className="md:hidden px-6 pt-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
          <input type="text" placeholder="Cari artikel..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-200 outline-none text-sm bg-white"/>
        </div>
      </div>

      {filtered.length===0?<div className="text-center py-20"><p className="text-slate-400 text-lg">Belum ada artikel.</p></div>:(
      <>
        {/* FEED VIEW */}
        {view==="feed"&&(
          <div className="max-w-[1200px] mx-auto px-6 pt-2">
            <div className="flex gap-16">
              <div className="flex-1 min-w-0 max-w-[728px]">
                {feedVis.map(p=><FeedItem key={p.id} post={p} onHide={()=>doHide(p.slug)}/>)}
                {feedN<filtered.length&&<div ref={loaderRef} className="py-10 text-center"><div className="inline-block w-6 h-6 border-2 border-slate-200 border-t-[#1A9E9E] rounded-full animate-spin"/></div>}
                {feedN>=filtered.length&&filtered.length>0&&<p className="text-center text-sm text-slate-300 py-10">— Semua artikel sudah ditampilkan —</p>}
              </div>
              <aside className="hidden lg:block w-[340px] shrink-0 border-l border-slate-100 pl-10 pt-8">
                <div className="sticky top-20">
                  <StaffPicks posts={picks}/>
                  <div className="border-t border-slate-100 pt-6 mb-6"><RecTopics active={activeCat} onSelect={c=>setActiveCat(c)}/></div>
                  <div className="border-t border-slate-100 pt-6">
                    <h3 className="text-[15px] font-extrabold text-slate-900 mb-3">Belajar Bahasa</h3>
                    <div className="flex flex-wrap gap-1.5">{LANGS.slice(0,8).map(l=><a key={l} href={"/?lang="+l.toLowerCase()} className="text-[11px] text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full hover:bg-[#1A9E9E]/5 hover:text-[#1A9E9E] hover:border-[#1A9E9E]/20 transition-colors">{l}</a>)}</div>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-8 leading-relaxed">See more recommendations · Help · Status · About · Careers · Privacy · Terms</p>
                </div>
              </aside>
            </div>
          </div>
        )}

        {/* GRID VIEW */}
        {view==="grid"&&(
          <div className={`max-w-7xl mx-auto px-6 py-6 min-h-screen transition-colors duration-300`}>
            {page===1&&!search&&(
              <div className="bg-gradient-to-r from-[#1A9E9E] via-[#2ABFBF] to-[#1A9E9E] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 shadow-sm">
                <div><p className="text-white/70 text-xs font-semibold tracking-wider uppercase mb-1">Linguo.id Blog</p><h2 className="text-white text-xl sm:text-2xl font-extrabold">Everyone Can Be a Polyglot</h2><p className="text-white/80 text-sm mt-1">60+ bahasa tersedia dengan pengajar profesional</p></div>
                <a href="/" className="shrink-0 bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold px-6 py-3 rounded-full text-sm transition-all shadow-sm">Mulai Belajar →</a>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">{gridPg.map(p=><GridCard key={p.id} post={p}/>)}</div>
            <Pagi cur={page} tot={totP} go={p=>{setPage(p);window.scrollTo({top:0,behavior:"smooth"})}}/>
            {page===1&&!search&&filtered.length>=2&&(
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
                <div><h2 className="text-base font-extrabold text-slate-900 mb-3 flex items-center gap-2"><span className="w-1 h-4 bg-[#1A9E9E] rounded-full"/>Artikel Terbaru</h2><div className="space-y-2">{terbaru.map(p=><SmCard key={p.id} post={p}/>)}</div></div>
                <div><h2 className="text-base font-extrabold text-slate-900 mb-3 flex items-center gap-2"><span className="w-1 h-4 bg-[#fbbf24] rounded-full"/>Artikel Populer</h2><div className="space-y-2">{picks.map((p,i)=><RankCard key={p.id} post={p} rank={i+1}/>)}</div></div>
                <div><h2 className="text-base font-extrabold text-slate-900 mb-3 flex items-center gap-2"><span className="w-1 h-4 bg-rose-400 rounded-full"/>Direkomendasikan</h2><div className="space-y-2">{rekom.map(p=><CircCard key={p.id} post={p}/>)}</div></div>
              </div>
            )}
          </div>
        )}
      </>)}
      <Footer/>
    </div>
  )
}
