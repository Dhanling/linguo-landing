"use client";
import { useEffect, useState, useCallback } from "react";
import { Clock, ArrowLeft, MessageCircle, Share2, Send, Copy, Check, ChevronUp } from "lucide-react";
import Link from "next/link";

// ========== SCROLL TO TOP ==========
function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!visible) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Scroll to top"
      className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-[#1A9E9E] hover:bg-[#178585] text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
    >
      <ChevronUp className="w-5 h-5" />
    </button>
  );
}

const SUPABASE_URL = "https://jbtgciepdmqxxcjflrxz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpidGdjaWVwZG1xeHhjamZscnh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzE1MjMsImV4cCI6MjA5MDYwNzUyM30.29Md_mApQjnCoCzYAKcvLU2CB7Y3KZzyepSMcvV_7hs";

interface BlogPost {
  id: string; slug: string; title: string; content: string;
  excerpt?: string; cover_image?: string; category?: string;
  tags?: string[]; status: string; published_at: string;
  created_at: string; view_count?: number;
}

interface Comment {
  id: string; author_name: string; content: string; created_at: string;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Tips: { bg: "bg-violet-100", text: "text-violet-700" },
  Edukasi: { bg: "bg-rose-100", text: "text-rose-700" },
  Fun: { bg: "bg-emerald-50", text: "text-emerald-700" },
  Grammar: { bg: "bg-pink-100", text: "text-pink-700" },
};

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`;
  return formatDate(dateStr);
}

function readTime(content: string) {
  const text = content?.replace(/<[^>]*>/g, "") || "";
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

// Generate visitor hash (simple, no PII)
function getVisitorHash(): string {
  let hash = localStorage.getItem("linguo_visitor");
  if (!hash) {
    hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("linguo_visitor", hash);
  }
  return hash;
}

function CategoryBadge({ category }: { category?: string }) {
  const c = category && CATEGORY_COLORS[category] ? CATEGORY_COLORS[category] : { bg: "bg-slate-100", text: "text-slate-600" };
  return <span className={"inline-block px-3 py-1 rounded-full text-xs font-semibold " + c.bg + " " + c.text}>{category || "Artikel"}</span>;
}

function RelatedCard({ post }: { post: BlogPost }) {
  return (
    <Link href={"/blog/" + post.slug} className="group bg-white rounded-2xl overflow-hidden border border-slate-100 hover:shadow-xl hover:border-[#1A9E9E]/20 transition-all duration-300">
      <div className="aspect-[16/10] overflow-hidden">
        {post.cover_image ? (
          <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1A9E9E]/10 via-[#2ABFBF]/10 to-[#1A9E9E]/20 flex items-center justify-center">
            <span className="text-[#1A9E9E]/20 text-5xl font-black">{post.title?.[0] || "L"}</span>
          </div>
        )}
      </div>
      <div className="p-5">
        <CategoryBadge category={post.category} />
        <h3 className="font-bold text-sm text-slate-900 leading-snug line-clamp-2 mt-2.5 group-hover:text-[#1A9E9E] transition-colors">{post.title}</h3>
        <span className="text-[11px] text-slate-400 mt-2.5 block">{formatDate(post.published_at)}</span>
      </div>
    </Link>
  );
}

// ========== READING CONTROLS (font size + dark mode) ==========
function ReadingControls({ fontSize, setFontSize, darkMode, setDarkMode }: {
  fontSize: "s" | "m" | "l"; setFontSize: (s: "s" | "m" | "l") => void;
  darkMode: boolean; setDarkMode: (b: boolean) => void;
}) {
  const sizes: { key: "s" | "m" | "l"; label: string }[] = [
    { key: "s", label: "A" },
    { key: "m", label: "A" },
    { key: "l", label: "A" },
  ];
  return (
    <div className="flex items-center gap-3">
      {/* Font size */}
      <div className={`flex items-center rounded-full p-0.5 ${darkMode ? "bg-slate-700" : "bg-slate-100"}`}>
        {sizes.map((s, i) => (
          <button key={s.key} onClick={() => setFontSize(s.key)}
            className={`px-2.5 py-1 rounded-full text-center transition-all font-semibold leading-none ${
              fontSize === s.key
                ? darkMode ? "bg-slate-600 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm"
                : darkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-400 hover:text-slate-600"
            }`}
            title={`Font ${s.key === "s" ? "kecil" : s.key === "m" ? "sedang" : "besar"}`}
            style={{ fontSize: i === 0 ? "12px" : i === 1 ? "15px" : "18px" }}
          >{s.label}</button>
        ))}
      </div>
      {/* Dark/Light */}
      <button onClick={() => setDarkMode(!darkMode)}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
          darkMode
            ? "bg-slate-700 text-amber-400 hover:bg-slate-600"
            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
        }`}
        title={darkMode ? "Light mode" : "Dark mode"}
      >
        {darkMode ? (
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        ) : (
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
        )}
      </button>
    </div>
  );
}

// ========== CLAP BUTTON (Medium-style) ==========
function ClapButton({ postId }: { postId: string }) {
  const [claps, setClaps] = useState(0);
  const [myClaps, setMyClaps] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [showCount, setShowCount] = useState(false);

  useEffect(() => {
    fetch(`${SUPABASE_URL}/rest/v1/blog_claps?post_id=eq.${postId}&select=clap_count`, {
      headers: { apikey: SUPABASE_KEY }
    }).then(r => r.json()).then(data => {
      const total = (data || []).reduce((s: number, c: any) => s + (c.clap_count || 0), 0);
      setClaps(total);
    }).catch(() => {});
  }, [postId]);

  const doClap = useCallback(async () => {
    if (myClaps >= 50) return;
    setAnimating(true);
    setShowCount(true);
    setMyClaps(prev => prev + 1);
    setClaps(prev => prev + 1);
    setTimeout(() => setAnimating(false), 300);

    try {
      const hash = getVisitorHash();
      await fetch(`${SUPABASE_URL}/rest/v1/blog_claps`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify({
          post_id: postId,
          visitor_hash: hash,
          clap_count: myClaps + 1,
        }),
      });
    } catch {}

    setTimeout(() => setShowCount(false), 2000);
  }, [postId, myClaps]);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={doClap}
        className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200 ${
          myClaps > 0
            ? "border-[#1A9E9E] bg-[#1A9E9E]/5 text-[#1A9E9E]"
            : "border-slate-200 hover:border-[#1A9E9E] text-slate-400 hover:text-[#1A9E9E]"
        } ${animating ? "scale-110" : "scale-100"}`}
        title="Clap!"
      >
        <span className={`text-xl transition-transform ${animating ? "scale-125" : ""}`}>👏</span>
        {showCount && myClaps > 0 && (
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-bounce shadow-lg">
            +{myClaps}
          </span>
        )}
      </button>
      <span className="text-sm font-semibold text-slate-500">{claps > 0 ? claps : ""}</span>
    </div>
  );
}

// ========== SHARE BUTTONS ==========
function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const copyLink = () => {
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-1.5">
      <a href={`https://wa.me/?text=${encodedTitle}%20${encoded}`} target="_blank" rel="noopener noreferrer"
        className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-green-50 text-slate-400 hover:text-green-600 transition-all" title="Share via WhatsApp">
        <MessageCircle className="w-[18px] h-[18px]" />
      </a>
      <a href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encoded}`} target="_blank" rel="noopener noreferrer"
        className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-sky-50 text-slate-400 hover:text-sky-500 transition-all" title="Share via X">
        <svg className="w-[16px] h-[16px]" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      </a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`} target="_blank" rel="noopener noreferrer"
        className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-all" title="Share via Facebook">
        <svg className="w-[16px] h-[16px]" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
      </a>
      <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`} target="_blank" rel="noopener noreferrer"
        className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-blue-50 text-slate-400 hover:text-blue-700 transition-all" title="Share via LinkedIn">
        <svg className="w-[16px] h-[16px]" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
      </a>
      <button onClick={copyLink}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${copied ? "bg-emerald-50 text-emerald-600" : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"}`} title="Copy link">
        {copied ? <Check className="w-[16px] h-[16px]" /> : <Copy className="w-[16px] h-[16px]" />}
      </button>
    </div>
  );
}

// ========== COMMENTS SECTION ==========
function CommentsSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetch(`${SUPABASE_URL}/rest/v1/blog_comments?post_id=eq.${postId}&is_approved=eq.true&order=created_at.desc&limit=20`, {
      headers: { apikey: SUPABASE_KEY }
    }).then(r => r.json()).then(data => setComments(data || [])).catch(() => {});
  }, [postId]);

  const submit = async () => {
    if (!name.trim() || !text.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/blog_comments`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({ post_id: postId, author_name: name.trim(), content: text.trim() }),
      });
      if (res.ok) {
        const [newComment] = await res.json();
        setComments(prev => [newComment, ...prev]);
        setText("");
        setSent(true);
        setTimeout(() => setSent(false), 3000);
      }
    } catch {} finally { setSending(false); }
  };

  return (
    <div className="comment-section border-t border-slate-100 pt-10 mb-16">
      <h3 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
        Komentar <span className="text-sm font-normal text-slate-400">({comments.length})</span>
      </h3>

      {/* Comment Form */}
      <div className="comment-form bg-slate-50 rounded-2xl p-5 sm:p-6 mb-8">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nama kamu"
          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/10 mb-3 font-medium"
        />
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Tulis komentar..."
          rows={3}
          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/10 resize-y mb-3"
        />
        <div className="flex items-center justify-between">
          {sent && <span className="text-xs text-emerald-600 font-medium">Komentar terkirim! ✓</span>}
          {!sent && <span />}
          <button
            onClick={submit}
            disabled={sending || !name.trim() || !text.trim()}
            className="flex items-center gap-2 bg-[#1A9E9E] hover:bg-[#178585] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
            {sending ? "Mengirim..." : "Kirim"}
          </button>
        </div>
      </div>

      {/* Comment List */}
      {comments.length > 0 && (
        <div className="space-y-5">
          {comments.map(c => (
            <div key={c.id} className="flex gap-3.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1A9E9E] to-[#2ABFBF] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                {c.author_name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-slate-900">{c.author_name}</span>
                  <span className="text-xs text-slate-400">{timeAgo(c.created_at)}</span>
                </div>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed whitespace-pre-line">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {comments.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-6">Belum ada komentar. Jadi yang pertama!</p>
      )}
    </div>
  );
}

// ========== ARTICLE CSS ==========
const ARTICLE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500&display=swap');

.blog-page { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; }

.article-body h2 {
  font-size: 1.625rem;
  font-weight: 800;
  color: #0f172a;
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  line-height: 1.3;
  letter-spacing: -0.02em;
}
.article-body h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin-top: 2rem;
  margin-bottom: 0.75rem;
}
.article-body { max-width: 100%; overflow-wrap: break-word; word-break: break-word; }
.article-body p {
  color: #1e293b;
  line-height: 1.85;
  margin-bottom: 1.5rem;
  font-size: 1.0625rem;
}
.article-body strong { color: #0f172a; font-weight: 700; }
.article-body a { color: #1A9E9E; text-decoration: underline; text-underline-offset: 2px; font-weight: 500; word-break: break-word; overflow-wrap: break-word; }
.article-body a:hover { color: #178585; }
.article-body ul, .article-body ol {
  margin: 1.25rem 0;
  padding-left: 1.75rem;
  color: #1e293b;
}
.article-body li { margin-bottom: 0.625rem; line-height: 1.75; font-size: 1.0625rem; }
.article-body blockquote {
  border-left: 4px solid #1A9E9E;
  padding: 1.25rem 1.5rem;
  margin: 2rem 0;
  background: linear-gradient(135deg, #f0fdfa 0%, #f8fafc 100%);
  border-radius: 0 1rem 1rem 0;
  color: #334155;
  font-style: italic;
  font-size: 1.0625rem;
  line-height: 1.75;
}
/* Tables */
.article-body table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  font-size: 0.95rem;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}
.article-body thead tr {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}
.article-body th {
  padding: 0.75rem 1rem;
  font-weight: 700;
  text-align: left;
  color: #0f172a;
  font-size: 0.875rem;
  border-bottom: 2px solid #e2e8f0;
  letter-spacing: -0.01em;
}
.article-body td {
  padding: 0.75rem 1rem;
  color: #1e293b;
  border-bottom: 1px solid #f1f5f9;
  line-height: 1.6;
}
.article-body tbody tr:hover {
  background-color: #f8fafc;
}
.article-body tbody tr:last-child td {
  border-bottom: none;
}

.article-body img {
  border-radius: 1rem;
  margin: 2rem 0;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}
.article-body hr {
  border: none;
  border-top: 2px solid #f1f5f9;
  margin: 2.5rem 0;
}

/* YouTube Embed */
.article-body figure.youtube-embed {
  margin: 2rem 0;
  border-radius: 1rem;
  overflow: hidden;
  background: #0f172a;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.12);
  position: relative;
  width: 100%;
  padding-bottom: 56.25%;
  height: 0;
}
.article-body figure.youtube-embed iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 1rem;
  display: block;
  border: none;
}

/* Audio Player */
.article-body figure.audio-embed {
  margin: 1.5rem 0;
  background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%);
  border: 1px solid #99f6e4;
  border-radius: 1rem;
  padding: 1rem 1.25rem;
  box-shadow: 0 1px 3px rgba(20, 184, 166, 0.08);
}
.article-body figure.audio-embed audio { width: 100%; display: block; height: 42px; border-radius: 0.5rem; }
.article-body figure.audio-embed figcaption {
  font-size: 0.8125rem; color: #0f766e; margin-top: 0.625rem;
  font-weight: 500; display: flex; align-items: center; gap: 0.375rem;
}
.article-body figure.audio-embed figcaption::before { content: "🔊"; font-size: 0.875rem; }

/* Video Player */
.article-body figure.video-embed {
  margin: 2rem 0;
  border-radius: 1rem;
  overflow: hidden;
  background: #0f172a;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.12);
}
.article-body figure.video-embed video { width: 100%; display: block; border-radius: 1rem; }
.article-body figure.video-embed figcaption {
  font-size: 0.8125rem; color: #94a3b8; padding: 0.625rem 1rem;
  font-weight: 500; display: flex; align-items: center; gap: 0.375rem;
}
.article-body figure.video-embed figcaption::before { content: "🎬"; font-size: 0.875rem; }

/* Font size variants */
.text-size-s .article-body p,
.text-size-s .article-body li { font-size: 0.9375rem; line-height: 1.75; }
.text-size-s .article-body h2 { font-size: 1.375rem; }
.text-size-s .article-body h3 { font-size: 1.125rem; }

.text-size-l .article-body p,
.text-size-l .article-body li { font-size: 1.1875rem; line-height: 1.9; }
.text-size-l .article-body h2 { font-size: 1.875rem; }
.text-size-l .article-body h3 { font-size: 1.5rem; }

/* Dark mode */
.blog-dark { background-color: #0f172a; color: #e2e8f0; }
.blog-dark nav { background: rgba(15,23,42,0.95) !important; border-color: #1e293b !important; }
.blog-dark nav a, .blog-dark nav span { color: #94a3b8 !important; }
.blog-dark nav a:hover { color: #e2e8f0 !important; }
.blog-dark .article-meta-card { background: #1e293b; border-color: #334155; }
.blog-dark .article-body h2 { color: #f1f5f9; border-color: #334155; }
.blog-dark .article-body h3 { color: #f1f5f9; }
.blog-dark .article-body p { color: #cbd5e1; }
.blog-dark .article-body strong { color: #f1f5f9; }
.blog-dark .article-body li { color: #cbd5e1; }
.blog-dark .article-body a { color: #2dd4bf; }
.blog-dark .article-body blockquote { background: #1e293b; border-color: #2dd4bf; color: #94a3b8; }
.blog-dark .article-body table { border-color: #334155; }
.blog-dark .article-body th { background: #1e293b; color: #e2e8f0; border-color: #334155; }
.blog-dark .article-body td { color: #e2e8f0 !important; border-color: #334155; }
.blog-dark .article-body tbody tr:hover { background-color: #1e293b; }
.blog-dark .comment-section { border-color: #334155; }
.blog-dark .comment-form { background: #1e293b; }
.blog-dark .comment-form input, .blog-dark .comment-form textarea {
  background: #0f172a; border-color: #334155; color: #e2e8f0;
}
.blog-dark .social-bar { border-color: #334155; }
.blog-dark .tag-bottom { border-color: #334155; }
.blog-dark .related-card { background: #1e293b; border-color: #334155; }
.blog-dark .related-card h3 { color: #e2e8f0; }

/* Responsive */
@media (max-width: 640px) {
  .article-body h2 { font-size: 1.375rem; }
  .article-body p, .article-body li { font-size: 1rem; }
  .article-body figure.youtube-embed { margin: 1.5rem -1.5rem; border-radius: 0; }
  .article-body figure.youtube-embed iframe { border-radius: 0; }
  .article-body figure.audio-embed { margin: 1rem 0; padding: 0.75rem; }
  .article-body figure.video-embed { margin: 1.5rem -1.5rem; border-radius: 0; }
  .article-body figure.video-embed video { border-radius: 0; }
}
`;

export default function ArticleContent({ post, relatedPosts }: { post: BlogPost; relatedPosts: BlogPost[] }) {
  const shareUrl = typeof window !== "undefined" ? window.location.href : `https://linguo.id/blog/${post.slug}`;

  // Track page view to Supabase
  useEffect(() => {
    if (!post?.slug) return;
    fetch(SUPABASE_URL + "/rest/v1/blog_page_views", {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY },
      body: JSON.stringify({ post_slug: post.slug, referrer: document.referrer || null, user_agent: navigator.userAgent || null }),
    }).catch(function() {});
  }, [post?.slug]);

  // ── Track page view ──
  useEffect(() => {
    if (!post?.slug) return;
    fetch(`${SUPABASE_URL}/rest/v1/blog_page_views`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        post_slug: post.slug,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent || null,
      }),
    }).catch(() => {}); // fire and forget
  }, [post?.slug]);

  // YouTube hydration
  useEffect(() => {
    const hydrateYouTube = () => {
      const figures = document.querySelectorAll<HTMLElement>(".article-body figure.youtube-embed");
      figures.forEach(fig => {
        const id = fig.getAttribute("data-youtube-id");
        if (!id) return;
        const existing = fig.querySelector("iframe");
        if (existing && existing.src.includes(id)) return;
        const iframe = document.createElement("iframe");
        iframe.src = "https://www.youtube-nocookie.com/embed/" + id;
        iframe.setAttribute("frameborder", "0");
        iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
        iframe.setAttribute("allowfullscreen", "");
        iframe.setAttribute("loading", "lazy");
        iframe.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
        iframe.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;border:none;border-radius:1rem;";
        fig.innerHTML = "";
        fig.appendChild(iframe);
      });
    };
    requestAnimationFrame(() => { requestAnimationFrame(hydrateYouTube); });
  }, [post?.content]);

  // Gradients for cover fallback
  const gradients = [
    "from-violet-500 via-purple-500 to-fuchsia-500",
    "from-cyan-500 via-teal-500 to-emerald-500",
    "from-orange-400 via-rose-400 to-pink-500",
    "from-blue-500 via-indigo-500 to-violet-500",
    "from-emerald-400 via-cyan-400 to-blue-500",
    "from-amber-400 via-orange-400 to-red-400",
    "from-teal-400 via-cyan-500 to-blue-400",
    "from-pink-400 via-rose-400 to-red-400",
  ];
  const gradIdx = (post.slug || "").split("").reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % gradients.length;
  const grad = gradients[gradIdx];

  const [fontSize, setFontSize] = useState<"s" | "m" | "l">("m");
  const [darkMode, setDarkMode] = useState(false);
  const fontClass = fontSize === "s" ? "text-size-s" : fontSize === "l" ? "text-size-l" : "";
  const langMatch = post.title?.match(/Bahasa\s+([^:]+)/);
  const langName = langMatch ? langMatch[1].trim() : "";
  const minutes = readTime(post.content);

  return (
    <div className={`blog-page min-h-screen transition-colors duration-300 ${darkMode ? "blog-dark bg-[#0f172a]" : "bg-white"} ${fontClass}`}>
      <style dangerouslySetInnerHTML={{ __html: ARTICLE_CSS }} />

      {/* Navbar */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 backdrop-blur-xl bg-white/95">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center">
            <img src="/images/logo-color.png" alt="Linguo" className="h-8 sm:h-10 object-contain" onError={(e) => { (e.target as HTMLImageElement).src = "/images/logo-white.png"; (e.target as HTMLImageElement).className = "h-8 sm:h-10 object-contain brightness-0"; }} />
          </a>
          <div className="flex items-center gap-6">
            <a href="/" className="text-sm text-slate-500 hover:text-slate-900 transition-colors hidden sm:block font-medium">Home</a>
            <Link href="/blog" className="text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium">Blog</Link>
            <a href={langName ? `/?lang=${encodeURIComponent(langName.toLowerCase())}&program=private` : "/"} className="bg-[#1A9E9E] text-white text-sm font-bold px-5 py-2 rounded-full hover:bg-[#178585] transition-colors">
              {langName ? `Belajar Bahasa ${langName}` : "Mulai Belajar"}
            </a>
          </div>
        </div>
      </nav>

      {/* Cover Image / Hero */}
      <div className={`relative w-full h-[320px] sm:h-[420px] lg:h-[480px] bg-gradient-to-br ${grad} overflow-hidden`}>
        {post.cover_image ? (
          <>
            <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" loading="eager" fetchPriority="high" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/40 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-transparent pointer-events-none" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-white/20 text-[120px] sm:text-[160px] lg:text-[200px] font-black leading-none select-none">{langName?.[0] || "L"}</div>
            </div>
            <div className="absolute top-10 right-10 w-32 h-32 rounded-full bg-white/10" />
            <div className="absolute bottom-10 left-10 w-20 h-20 rounded-full bg-white/10" />
          </div>
        )}
        <div className="absolute top-6 left-6 z-10">
          <span className="bg-white/95 backdrop-blur-sm text-slate-700 text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg">
            {post.category || "Artikel"}
          </span>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6">
        {/* Article Meta Card */}
        <div className="article-meta-card relative -mt-10 rounded-2xl shadow-sm border border-slate-100 bg-white px-6 sm:px-10 py-8 mb-8">
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map(tag => (
                <span key={tag} className="text-xs text-[#1A9E9E] bg-[#1A9E9E]/5 px-2.5 py-0.5 rounded-full font-semibold">#{tag}</span>
              ))}
            </div>
          )}

          <h1 className="text-2xl sm:text-3xl lg:text-[2.5rem] font-extrabold leading-tight mb-6 tracking-tight">{post.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1A9E9E] to-[#2ABFBF] flex items-center justify-center text-white font-bold text-sm shadow-sm">L</div>
              <div>
                <div className="font-semibold text-slate-900 text-sm">Linguo Team</div>
                <div className="text-xs text-slate-400">{formatDate(post.published_at)}</div>
              </div>
            </div>
            <span className="hidden sm:block text-slate-200">|</span>
            <span className="flex items-center gap-1 text-xs font-medium"><Clock className="w-3.5 h-3.5" /> {minutes} min read</span>
          </div>
        </div>



        {/* Reading Controls */}
        <div className={`sticky top-16 z-30 flex items-center justify-between py-3 px-2 mb-6 border-b backdrop-blur-xl ${darkMode ? "border-slate-700 bg-[#0f172a]/95" : "border-slate-100 bg-white/95"}`}>
          <span className={`text-xs font-medium ${darkMode ? "text-slate-500" : "text-slate-400"}`}>{minutes} min read</span>
          <ReadingControls fontSize={fontSize} setFontSize={setFontSize} darkMode={darkMode} setDarkMode={setDarkMode} />
        </div>

        {/* Reading Controls */}

        {/* Article Body */}
        <article className="article-body px-0 sm:px-4 mb-8">
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>

        {/* Social Bar — Clap + Share */}
        <div className={`social-bar flex items-center justify-between py-5 px-1 mb-8 border-y ${darkMode ? "border-slate-700" : "border-slate-100"}`}>
          <ClapButton postId={post.id} />
          <ShareButtons url={shareUrl} title={post.title} />
        </div>

        {/* Tags bottom */}
        {post.tags && post.tags.length > 0 && (
          <div className={`tag-bottom flex flex-wrap gap-2 pb-8 border-t pt-6 mb-8 ${darkMode ? "border-slate-700" : "border-slate-100"}`}>
            <span className="text-sm text-slate-400 mr-1 font-medium">Tags:</span>
            {post.tags.map(tag => (
              <span key={tag} className="text-xs bg-slate-50 border border-slate-200 text-slate-500 px-3 py-1.5 rounded-full hover:border-[#1A9E9E]/30 hover:text-[#1A9E9E] transition-colors cursor-default font-medium">#{tag}</span>
            ))}
          </div>
        )}

        {/* Comments */}
        <CommentsSection postId={post.id} />

        {/* CTA — Enhanced */}
        <div className="mb-14">
          {/* Main CTA Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#1A9E9E] via-[#17918f] to-[#0e7070] rounded-2xl p-8 sm:p-10 text-white shadow-xl">
            {/* Decorative circles */}
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-56 h-56 rounded-full bg-white/5 pointer-events-none" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-3 py-1 text-xs font-semibold mb-4">
                🎯 Kelas Private 1-on-1
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold mb-3 tracking-tight leading-snug">
                {langName
                  ? <>Siap berbicara <span className="text-[#fbbf24]">Bahasa {langName}</span> dengan percaya diri?</>
                  : <>Siap belajar <span className="text-[#fbbf24]">bahasa baru</span> dari nol?</>
                }
              </h3>
              <p className="text-white/80 text-sm sm:text-base mb-6 max-w-lg leading-relaxed">
                Linguo menyediakan kelas private 1-on-1 dengan pengajar berpengalaman.
                Jadwal fleksibel, materi disesuaikan kebutuhan kamu — dari A1 sampai B2.
              </p>

              {/* Social proof row */}
              <div className="flex flex-wrap gap-4 mb-7 text-sm">
                <div className="flex items-center gap-1.5 text-white/70"><span className="text-base">👩‍🎓</span> 200+ pelajar aktif</div>
                <div className="flex items-center gap-1.5 text-white/70"><span className="text-base">🌍</span> 60+ bahasa tersedia</div>
                <div className="flex items-center gap-1.5 text-white/70"><span className="text-base">⭐</span> Jadwal fleksibel</div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={langName ? `/?lang=${encodeURIComponent(langName.toLowerCase())}&program=private` : "/"}
                  className="inline-flex items-center justify-center gap-2 bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold px-8 py-3.5 rounded-full text-sm transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
                >
                  🚀 {langName ? `Mulai Belajar Bahasa ${langName}` : "Mulai Belajar Sekarang"}
                </a>
                <a
                  href="https://wa.me/6282116859493"
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3.5 rounded-full text-sm transition-all border border-white/20 hover:border-white/30"
                >
                  <MessageCircle className="w-4 h-4" /> Konsultasi Gratis
                </a>
              </div>
            </div>
          </div>

          {/* Feature chips below CTA */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {[
              { icon: "📅", label: "Jadwal Fleksibel", sub: "Sesuaikan waktu kamu" },
              { icon: "📚", label: "Materi Custom", sub: "Disesuaikan tujuanmu" },
              { icon: "🎓", label: "Pengajar Berpengalaman", sub: "Terlatih & bersertifikat" },
              { icon: "💬", label: "Fokus Speaking", sub: "Langsung praktek" },
            ].map(f => (
              <div key={f.label} className={`rounded-xl p-4 border text-center transition-colors ${darkMode ? "bg-[#1e293b] border-slate-700" : "bg-slate-50 border-slate-100 hover:border-[#1A9E9E]/20"}`}>
                <div className="text-2xl mb-1">{f.icon}</div>
                <div className={`text-xs font-semibold ${darkMode ? "text-slate-200" : "text-slate-800"}`}>{f.label}</div>
                <div className={`text-[11px] mt-0.5 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>{f.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Back to Blog */}
        <div className="text-center mb-10">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-[#1A9E9E] transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Blog
          </Link>
        </div>

        {/* Related */}
        {relatedPosts.length > 0 && (
          <div className="mb-16">
            <h2 className="text-xl font-extrabold text-slate-900 mb-6 tracking-tight">Artikel Lainnya</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedPosts.map(p => <RelatedCard key={p.id} post={p} />)}
            </div>
          </div>
        )}
      </main>

      <ScrollToTop />
      {/* Footer */}
      <footer className="bg-[#1A9E9E] text-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <div>
              <h4 className="font-bold text-lg mb-4">Learn a Language</h4>
              <div className="space-y-2 text-sm text-white/80">
                {["English","French","Spanish","Portuguese","German","Japanese","Korean","Arabic","Hindi","Italian","Russian","Mandarin"].map(l => (
                  <a key={l} href={"/?lang=" + l.toLowerCase()} className="block hover:text-white transition-colors">Learn {l}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Level Option</h4>
              <div className="space-y-2 text-sm text-white/80 mb-6">
                {["Basic","Upper Basic","Intermediate","Advance"].map(l => <span key={l} className="block">{l}</span>)}
              </div>
              <h4 className="font-bold text-lg mb-4">Program</h4>
              <div className="space-y-2 text-sm text-white/80">
                {["Regular Class","Private Class","IELTS Class","TOEFL Class"].map(p => <span key={p} className="block">{p}</span>)}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Teaching</h4>
              <a href="/jadi-pengajar" className="text-sm text-white/80 hover:text-white block mb-6">Become a Teacher</a>
              <p className="text-sm text-white/80 leading-relaxed mb-6">Happy Creative Hub, Jl. Cisitu Indah III No.2, Dago, Coblong, Bandung 40135</p>
              <h4 className="font-bold text-lg mb-4">Customer Service</h4>
              <div className="space-y-1.5 text-sm text-white/80">
                <p>WA : <a href="https://wa.me/6282116859493" className="hover:text-white">6282116859493</a></p>
                <p>Telepon : (022) 85942550</p>
                <p>Email : <a href="mailto:info@linguo.id" className="hover:text-white">info@linguo.id</a></p>
              </div>
            </div>
            <div className="flex flex-col items-start lg:items-end">
              <a href="/"><img src="/images/logo-white.png" alt="Linguo" className="h-12 mb-4" /></a>
              <p className="text-sm text-white/60 mb-4">&copy; {new Date().getFullYear()} PT. Linguo Edu Indonesia</p>
              <div className="flex gap-3">
                {[{href:"https://facebook.com/linguo.id",l:"fb"},{href:"https://instagram.com/linguo.id",l:"ig"},{href:"https://threads.net/@linguo.id",l:"th"},{href:"https://linkedin.com/company/linguo-id",l:"in"},{href:"https://youtube.com/@linguoid",l:"yt"}].map(s => (
                  <a key={s.l} href={s.href} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-xs font-bold transition-colors">{s.l}</a>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10"><div className="max-w-7xl mx-auto px-6 py-4 text-center text-xs text-white/40">Linguo.id — Everyone Can Be a Polyglot</div></div>
      </footer>
    </div>
  );
}
