"use client";

// [linguo-patch:pustaka-page-v1] Halaman "Perpustakaan Saya" (E-Book & E-Learning yang sudah dibeli).
// Data: digital_purchases JOIN digital_products + digital_product_pricing (skema existing, TIDAK diubah).
// Progress e-learning: best-effort dari lms_progress, dipetakan via digital_products.language → lms_modules.

import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import {
  Film, BookOpen, Bookmark, BookmarkCheck, Play, Search, LayoutGrid, List,
  Infinity as InfinityIcon, CalendarClock, Clock, Download, ChevronRight,
  Flame, Loader2, ShoppingBag, GraduationCap, ExternalLink,
} from "lucide-react";
import { externalLinkFor, isStoragePath, accessVerb } from "@/lib/digitalAccess";

/* ---------------- types ---------------- */
type ProductType = "elearning" | "ebook";

interface DProduct {
  id: string;
  type: ProductType;
  title: string;
  slug: string | null;
  cover_url: string | null;
  file_url: string | null;
  video_playlist_url: string | null;
  language: string | null;
  level: string | null;
  pages: number | null;
  modules_count: number | null;
  total_duration_min: number | null;
}

interface Purchase {
  id: string;
  payment_status: string;
  access_granted: boolean;
  expires_at: string | null;
  download_count: number;
  created_at: string;
  digital_products: DProduct;
  digital_product_pricing: { display_label: string | null; duration_days: number | null } | null;
}

interface Prog { pct: number; done: number; total: number; resume: { id: string; title: string } | null; nextIndex: number }

/* ---------------- tokens / helpers ---------------- */
const GRADIENTS = [
  "linear-gradient(150deg,#1FA98A,#0C8163)",
  "linear-gradient(150deg,#3B82F6,#1D4ED8)",
  "linear-gradient(150deg,#8B5CF6,#6D28D9)",
  "linear-gradient(150deg,#F59E0B,#D97706)",
  "linear-gradient(150deg,#EC4899,#BE185D)",
  "linear-gradient(150deg,#14B8A6,#0F766E)",
];
function gradFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

const LANG_GLYPH: Record<string, string> = {
  english: "EN", inggris: "EN", korean: "한", korea: "한", japanese: "あ", jepang: "あ",
  mandarin: "中", chinese: "中", arabic: "ع", arab: "ع", french: "FR", prancis: "FR",
  german: "DE", jerman: "DE", spanish: "ES", spanyol: "ES", italian: "IT", italia: "IT",
  thai: "TH", vietnamese: "VN", vietnam: "VN", dutch: "NL", belanda: "NL",
};
function glyphFor(p: DProduct) {
  if (/12\s*\+|multi|semua bahasa/i.test(p.title)) return "12+";
  const lang = p.language?.toLowerCase().trim();
  if (lang && LANG_GLYPH[lang]) return LANG_GLYPH[lang];
  if (p.level) return p.level.slice(0, 3).toUpperCase();
  if (lang) return lang.slice(0, 2).toUpperCase();
  return p.type === "ebook" ? "PDF" : "EN";
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

type Access =
  | { kind: "forever" }
  | { kind: "expired" }
  | { kind: "soon"; days: number }
  | { kind: "dated"; until: string };

function accessInfo(p: Purchase): Access {
  if (!p.expires_at) return { kind: "forever" };
  const ms = new Date(p.expires_at).getTime() - Date.now();
  if (ms <= 0) return { kind: "expired" };
  const days = Math.ceil(ms / 86_400_000);
  if (days <= 14) return { kind: "soon", days };
  return { kind: "dated", until: p.expires_at };
}

/* ---------------- progress mapping (lms) ---------------- */
function buildProgressByLang(
  modules: { id: string; language: string; sort_order: number | null }[],
  lessons: { id: string; module_id: string; title: string; sort_order: number | null }[],
  doneSet: Set<string>
): Record<string, { total: number; done: number; resume: { id: string; title: string } | null }> {
  const modLang = new Map<string, string>();
  const modOrder = new Map<string, number>();
  const sorted = [...modules].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  sorted.forEach((m, i) => { modLang.set(m.id, m.language); modOrder.set(m.id, m.sort_order ?? i); });

  const byLang: Record<string, { id: string; title: string; mo: number; so: number }[]> = {};
  for (const l of lessons) {
    const lang = modLang.get(l.module_id);
    if (!lang) continue;
    const key = lang.toLowerCase().trim();
    (byLang[key] ||= []).push({ id: l.id, title: l.title, mo: modOrder.get(l.module_id) ?? 0, so: l.sort_order ?? 0 });
  }

  const out: Record<string, { total: number; done: number; resume: { id: string; title: string } | null }> = {};
  for (const key of Object.keys(byLang)) {
    const arr = byLang[key].sort((a, b) => a.mo - b.mo || a.so - b.so);
    const done = arr.filter((x) => doneSet.has(x.id)).length;
    const next = arr.find((x) => !doneSet.has(x.id)) || null;
    out[key] = { total: arr.length, done, resume: next ? { id: next.id, title: next.title } : null };
  }
  return out;
}

function progFor(p: Purchase, byLang: Record<string, { total: number; done: number; resume: { id: string; title: string } | null }>): Prog | null {
  if (p.digital_products.type !== "elearning") return null;
  const lang = p.digital_products.language?.toLowerCase().trim();
  if (!lang) return null;
  const pr = byLang[lang];
  if (!pr || pr.total === 0) return null;
  const pct = Math.round((pr.done / pr.total) * 100);
  return { pct, done: pr.done, total: pr.total, resume: pr.resume, nextIndex: Math.min(pr.done + 1, pr.total) };
}

/* ---------------- small UI atoms ---------------- */
function TypeBadge({ type }: { type: ProductType }) {
  const Icon = type === "ebook" ? BookOpen : Film;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-[#12172B] shadow-sm">
      <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />
      {type === "ebook" ? "E-Book" : "E-Learning"}
    </span>
  );
}

function AccessChip({ a }: { a: Access }) {
  if (a.kind === "forever")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#12A37E]/10 px-2.5 py-1 text-[11px] font-bold text-[#0C8163]">
        <InfinityIcon className="h-3.5 w-3.5" strokeWidth={2.4} /> Selamanya
      </span>
    );
  if (a.kind === "expired")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600">
        <Clock className="h-3.5 w-3.5" strokeWidth={2.4} /> Akses Berakhir
      </span>
    );
  if (a.kind === "soon")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-600">
        <Clock className="h-3.5 w-3.5" strokeWidth={2.4} /> Sisa {a.days} hari
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
      <CalendarClock className="h-3.5 w-3.5" strokeWidth={2.4} /> s/d {fmtDate(a.until)}
    </span>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.max(pct, 3)}%`, background: "linear-gradient(90deg,#1FA98A,#0C8163)" }}
      />
    </div>
  );
}

/* ---------------- main ---------------- */
const BM_KEY = "linguo_pustaka_bookmarks";

export default function LibraryView({ userId, supabase }: { userId: string; supabase: SupabaseClient }) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [byLang, setByLang] = useState<Record<string, { total: number; done: number; resume: { id: string; title: string } | null }>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const [tab, setTab] = useState<"all" | "elearning" | "ebook">("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [q, setQ] = useState("");
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

  /* bookmarks (localStorage — tanpa ubah skema DB) */
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(BM_KEY) || "[]");
      if (Array.isArray(raw)) setBookmarks(new Set(raw));
    } catch {}
  }, []);
  function toggleBookmark(id: string, title: string) {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); toast(`Dihapus dari simpanan`); }
      else { next.add(id); toast.success(`Disimpan: ${title}`); }
      try { localStorage.setItem(BM_KEY, JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  /* fetch */
  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, [userId]);

  async function fetchAll() {
    setLoading(true);
    const purchasesReq = supabase
      .from("digital_purchases")
      .select(`
        id, payment_status, access_granted, expires_at, download_count, created_at,
        digital_products (
          id, type, title, slug, cover_url, file_url, video_playlist_url,
          language, level, pages, modules_count, total_duration_min
        ),
        digital_product_pricing ( display_label, duration_days )
      `)
      .eq("auth_user_id", userId)
      .eq("payment_status", "Lunas")
      .order("created_at", { ascending: false });

    // best-effort progress (kalau tabel/akses gak ada → diabaikan, progress=0)
    const modReq = supabase.from("lms_modules").select("id,language,sort_order").order("sort_order");
    const lessReq = supabase.from("lms_lessons").select("id,module_id,title,sort_order").order("sort_order");
    const progReq = supabase.from("lms_progress").select("lesson_id,status").eq("user_id", userId);

    const [pRes, mRes, lRes, prRes] = await Promise.all([purchasesReq, modReq, lessReq, progReq]);

    if (pRes.error) {
      console.error("Gagal memuat perpustakaan:", pRes.error);
      toast.error("Gagal memuat perpustakaan.");
      setPurchases([]);
    } else {
      setPurchases((pRes.data ?? []) as unknown as Purchase[]);
    }

    if (!mRes.error && !lRes.error) {
      const doneSet = new Set<string>(
        (((prRes.data as { lesson_id: string; status: string }[]) || []) || [])
          .filter((x) => x.status === "completed")
          .map((x) => x.lesson_id)
      );
      setByLang(buildProgressByLang((mRes.data as any) || [], (lRes.data as any) || [], doneSet));
    }
    setLoading(false);
  }

  /* open / download */
  async function openProduct(p: Purchase) {
    const prod = p.digital_products;
    if (accessInfo(p).kind === "expired") { toast.error("Akses produk ini sudah berakhir."); return; }

    // Produk dikirim sebagai LINK (YouTube / Google Drive / dll) → buka langsung.
    const link = externalLinkFor(prod);
    if (link) {
      if (prod.type === "ebook") {
        // catat akses (best-effort, tak memblokir buka link)
        supabase
          .from("digital_purchases")
          .update({ download_count: (p.download_count || 0) + 1, last_downloaded_at: new Date().toISOString() })
          .eq("id", p.id)
          .then(() => setTimeout(fetchAll, 800));
      }
      toast.success(`Membuka ${prod.title}…`);
      window.open(link, "_blank", "noopener,noreferrer");
      return;
    }

    if (prod.type === "elearning") {
      toast("Membuka materi belajar…");
      window.location.href = "/akun?menu=materi";
      return;
    }

    // ebook tanpa link eksternal → file di storage (signed PDF url, perilaku lama)
    if (!isStoragePath(prod.file_url)) { toast.error("File e-book belum tersedia."); return; }
    setBusy(p.id);
    try {
      const { data, error } = await supabase.storage.from("ebook-files").createSignedUrl(prod.file_url!, 7 * 24 * 60 * 60);
      if (error || !data) { toast.error("Gagal membuat link unduhan."); return; }
      await supabase
        .from("digital_purchases")
        .update({ download_count: (p.download_count || 0) + 1, last_downloaded_at: new Date().toISOString() })
        .eq("id", p.id);
      toast.success("Membuka e-book…");
      window.open(data.signedUrl, "_blank");
      setTimeout(fetchAll, 800);
    } catch {
      toast.error("Terjadi kesalahan saat membuka e-book.");
    } finally {
      setBusy(null);
    }
  }

  /* derived */
  const stats = useMemo(() => {
    let running = 0, certs = 0;
    for (const p of purchases) {
      const pr = progFor(p, byLang);
      if (pr && pr.pct > 0 && pr.pct < 100) running++;
      if (pr && pr.pct >= 100) certs++;
    }
    return { total: purchases.length, running, certs };
  }, [purchases, byLang]);

  const counts = useMemo(() => ({
    all: purchases.length,
    elearning: purchases.filter((p) => p.digital_products.type === "elearning").length,
    ebook: purchases.filter((p) => p.digital_products.type === "ebook").length,
  }), [purchases]);

  const hero = useMemo(() => {
    for (const p of purchases) {
      const pr = progFor(p, byLang);
      if (pr && pr.pct > 0 && pr.pct < 100) return { p, pr };
    }
    return null;
  }, [purchases, byLang]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return purchases.filter((p) => {
      if (tab !== "all" && p.digital_products.type !== tab) return false;
      if (needle && !p.digital_products.title.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [purchases, tab, q]);

  /* ---------------- render ---------------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-7 w-7 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* ===== HEADER ===== */}
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[12px] font-bold text-slate-400">
            <span>Dashboard</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-[#12A37E]">Perpustakaan Saya</span>
          </p>
          <h1 className="font-heading mt-1 text-[28px] font-extrabold leading-tight text-[#12172B] sm:text-[32px]">
            Perpustakaan Saya
          </h1>
          <p className="mt-1 text-[14px] font-medium text-slate-500">
            E-Book &amp; E-Learning yang sudah kamu beli · buka kapan saja
          </p>

          {/* stats chips */}
          <div className="mt-4 flex flex-wrap gap-2.5">
            <StatChip icon={<BookOpen className="h-4 w-4" strokeWidth={2.2} />} label={`${stats.total} produk`} />
            <StatChip icon={<Flame className="h-4 w-4 text-[#12A37E]" strokeWidth={2.2} />} label={`${stats.running} sedang berjalan`} />
            <StatChip icon={<GraduationCap className="h-4 w-4" strokeWidth={2.2} />} label={`${stats.certs} sertifikat`} />
          </div>
        </div>

        {/* bookmark counter */}
        <div className="relative shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#12A37E] shadow-sm">
            <Bookmark className="h-5 w-5" strokeWidth={2.2} fill={bookmarks.size ? "currentColor" : "none"} />
          </div>
          {bookmarks.size > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#12A37E] px-1 text-[11px] font-bold text-white">
              {bookmarks.size}
            </span>
          )}
        </div>
      </header>

      {/* ===== CONTINUE HERO ===== */}
      {hero && (
        <section className="overflow-hidden rounded-3xl border border-[#12A37E]/15 bg-[#12A37E]/[0.04] p-4 sm:p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {/* cover */}
            <button
              onClick={() => openProduct(hero.p)}
              className="group relative h-[150px] w-full shrink-0 overflow-hidden rounded-2xl sm:h-[170px] sm:w-[200px]"
              style={{ background: gradFor(hero.p.digital_products.id) }}
            >
              <span className="absolute -bottom-3 right-2 text-[88px] font-black leading-none text-white/15">
                {glyphFor(hero.p.digital_products)}
              </span>
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-[#0C8163] shadow-lg transition group-hover:scale-105">
                  <Play className="ml-0.5 h-6 w-6" fill="currentColor" />
                </span>
              </span>
            </button>

            {/* body */}
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-wide text-[#0C8163]">
                <Flame className="h-4 w-4" strokeWidth={2.4} /> Lanjutkan belajar
              </p>
              <h2 className="font-heading mt-1 truncate text-[22px] font-extrabold text-[#12172B] sm:text-[26px]">
                {hero.p.digital_products.title}
              </h2>
              <p className="mt-0.5 text-[14px] font-medium text-slate-500">
                Pelajaran {hero.pr.nextIndex}
                {hero.pr.resume ? ` · ${hero.pr.resume.title}` : ""}
              </p>

              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1"><ProgressBar pct={hero.pr.pct} /></div>
                <span className="shrink-0 text-[13px] font-bold text-slate-500">
                  {hero.pr.pct}% · {hero.pr.done}/{hero.pr.total} pelajaran
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => openProduct(hero.p)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#12A37E] px-5 py-3 text-[14px] font-bold text-white shadow-sm transition hover:bg-[#0C8163] active:scale-[0.98]"
                >
                  <Play className="h-4 w-4" fill="currentColor" /> Lanjut Nonton
                </button>
                <AccessChip a={accessInfo(hero.p)} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== CONTROLS ===== */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex items-center gap-1 rounded-2xl bg-slate-100 p-1">
          {([["all", "Semua"], ["elearning", "E-Learning"], ["ebook", "E-Book"]] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-bold transition ${
                tab === k ? "bg-white text-[#12172B] shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {label}
              <span className={`rounded-full px-1.5 py-0.5 text-[11px] ${tab === k ? "bg-[#12A37E]/10 text-[#0C8163]" : "bg-slate-200 text-slate-500"}`}>
                {counts[k]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-[280px] sm:flex-none">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari produk…"
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-[14px] font-medium text-[#12172B] outline-none transition placeholder:text-slate-400 focus:border-[#12A37E] focus:ring-2 focus:ring-[#12A37E]/10"
            />
          </div>
          <div className="hidden items-center gap-1 rounded-2xl bg-slate-100 p-1 sm:flex">
            <button onClick={() => setView("grid")} aria-label="Grid" className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${view === "grid" ? "bg-white text-[#12172B] shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
              <LayoutGrid className="h-4 w-4" strokeWidth={2.2} />
            </button>
            <button onClick={() => setView("list")} aria-label="List" className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${view === "list" ? "bg-white text-[#12172B] shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
              <List className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </div>

      {/* ===== EMPTY ===== */}
      {purchases.length === 0 ? (
        <EmptyState />
      ) : shown.length === 0 ? (
        <div className="rounded-3xl border border-slate-100 bg-white py-16 text-center">
          <p className="text-[14px] font-semibold text-slate-500">Tidak ada produk yang cocok.</p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((p) => (
            <ProductCard
              key={p.id}
              p={p}
              prog={progFor(p, byLang)}
              busy={busy === p.id}
              bookmarked={bookmarks.has(p.digital_products.id)}
              onToggleBookmark={() => toggleBookmark(p.digital_products.id, p.digital_products.title)}
              onOpen={() => openProduct(p)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((p) => (
            <ProductRow
              key={p.id}
              p={p}
              prog={progFor(p, byLang)}
              busy={busy === p.id}
              bookmarked={bookmarks.has(p.digital_products.id)}
              onToggleBookmark={() => toggleBookmark(p.digital_products.id, p.digital_products.title)}
              onOpen={() => openProduct(p)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- sub-components ---------------- */
function StatChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-bold text-slate-600">
      {icon}
      {label}
    </span>
  );
}

function Cover({ p, prog, big }: { p: DProduct; prog: Prog | null; big?: boolean }) {
  const resuming = prog && prog.pct > 0 && prog.pct < 100;
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden" style={{ background: gradFor(p.id) }}>
      {p.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.cover_url} alt={p.title} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span className={`absolute -bottom-4 right-3 font-black leading-none text-white/15 ${big ? "text-[120px]" : "text-[96px]"}`}>
          {glyphFor(p)}
        </span>
      )}
      {/* play / book center */}
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/60 text-white">
          {p.type === "ebook" ? <BookOpen className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" fill="currentColor" />}
        </span>
      </span>
      {/* lang label bottom-left */}
      {p.language && (
        <span className="absolute bottom-2.5 left-3 text-[13px] font-bold text-white/90">{p.language}</span>
      )}
      {/* resume tag */}
      {resuming && (
        <span className="absolute bottom-2.5 right-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-bold text-[#0C8163] shadow-sm">
          <Play className="h-3 w-3" fill="currentColor" /> Lanjut
        </span>
      )}
    </div>
  );
}

function ProductCard({
  p, prog, busy, bookmarked, onToggleBookmark, onOpen,
}: {
  p: Purchase; prog: Prog | null; busy: boolean; bookmarked: boolean;
  onToggleBookmark: () => void; onOpen: () => void;
}) {
  const prod = p.digital_products;
  const a = accessInfo(p);
  const expired = a.kind === "expired";
  const isExternal = !!externalLinkFor(prod);
  const verb = accessVerb(prod);
  const label = prod.type === "elearning" && prog && prog.pct > 0 ? "Lanjut" : verb;
  const BtnIcon = prod.type === "ebook" && !isExternal ? Download : verb === "Buka" ? ExternalLink : Play;

  return (
    <div className={`group flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_18px_40px_-30px_rgba(18,23,43,0.5)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-30px_rgba(18,23,43,0.55)] ${expired ? "opacity-70" : ""}`}>
      {/* cover (clickable) */}
      <button onClick={onOpen} disabled={expired} className="relative block text-left disabled:cursor-not-allowed">
        <Cover p={prod} prog={prog} />
        <span className="absolute left-3 top-3"><TypeBadge type={prod.type} /></span>
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); onToggleBookmark(); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onToggleBookmark(); } }}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 text-[#12A37E] shadow-sm transition hover:scale-105"
        >
          {bookmarked ? <BookmarkCheck className="h-[18px] w-[18px]" fill="currentColor" /> : <Bookmark className="h-[18px] w-[18px]" />}
        </span>
      </button>

      {/* body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold text-slate-400">Dibeli {fmtDate(p.created_at)}</span>
        </div>
        <h3 className="line-clamp-2 min-h-[44px] text-[16px] font-extrabold leading-snug text-[#12172B]">{prod.title}</h3>

        <p className="text-[12px] font-medium text-slate-500">
          {prod.type === "ebook"
            ? `${prod.pages ? `${prod.pages} halaman` : "PDF"}`
            : `${prog ? `${prog.total} pelajaran` : prod.modules_count ? `${prod.modules_count} modul` : "Materi video"}`}
        </p>

        {prog && (
          <div className="flex items-center gap-2">
            <div className="flex-1"><ProgressBar pct={prog.pct} /></div>
            <span className="shrink-0 text-[11px] font-bold text-slate-400">{prog.pct}%</span>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <AccessChip a={a} />
          {expired ? (
            <a href="/toko" className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-[13px] font-bold text-white transition hover:bg-amber-600">
              Perpanjang
            </a>
          ) : (
            <button
              onClick={onOpen}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#12A37E] px-3.5 py-2 text-[13px] font-bold text-white transition hover:bg-[#0C8163] active:scale-[0.98] disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BtnIcon className="h-4 w-4" fill={BtnIcon === Play ? "currentColor" : undefined} />}
              {label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductRow({
  p, prog, busy, bookmarked, onToggleBookmark, onOpen,
}: {
  p: Purchase; prog: Prog | null; busy: boolean; bookmarked: boolean;
  onToggleBookmark: () => void; onOpen: () => void;
}) {
  const prod = p.digital_products;
  const a = accessInfo(p);
  const expired = a.kind === "expired";
  const isExternal = !!externalLinkFor(prod);
  const verb = accessVerb(prod);
  const BtnIcon = prod.type === "ebook" && !isExternal ? Download : verb === "Buka" ? ExternalLink : Play;
  return (
    <div className={`flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-3 transition hover:border-[#12A37E]/30 ${expired ? "opacity-70" : ""}`}>
      <button onClick={onOpen} disabled={expired} className="relative h-16 w-28 shrink-0 overflow-hidden rounded-xl disabled:cursor-not-allowed" style={{ background: gradFor(prod.id) }}>
        {prod.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={prod.cover_url} alt={prod.title} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-2xl font-black text-white/25">{glyphFor(prod)}</span>
        )}
      </button>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <TypeBadge type={prod.type} />
          {prog && <span className="text-[11px] font-bold text-slate-400">{prog.pct}%</span>}
        </div>
        <h3 className="truncate text-[15px] font-extrabold text-[#12172B]">{prod.title}</h3>
        <p className="text-[12px] font-medium text-slate-400">Dibeli {fmtDate(p.created_at)}</p>
      </div>
      <div className="hidden sm:block"><AccessChip a={a} /></div>
      <button
        onClick={(e) => { e.stopPropagation(); onToggleBookmark(); }}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#12A37E] transition hover:bg-[#12A37E]/10"
      >
        {bookmarked ? <BookmarkCheck className="h-[18px] w-[18px]" fill="currentColor" /> : <Bookmark className="h-[18px] w-[18px]" />}
      </button>
      {expired ? (
        <a href="/toko" className="shrink-0 rounded-xl bg-amber-500 px-3.5 py-2 text-[13px] font-bold text-white transition hover:bg-amber-600">Perpanjang</a>
      ) : (
        <button onClick={onOpen} disabled={busy} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#12A37E] px-3.5 py-2 text-[13px] font-bold text-white transition hover:bg-[#0C8163] disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BtnIcon className="h-4 w-4" fill={BtnIcon === Play ? "currentColor" : undefined} />}
          {verb}
        </button>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white px-6 py-16 text-center shadow-[0_24px_50px_-34px_rgba(18,23,43,0.5)]">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#12A37E]/10 text-4xl">📚</div>
      <h3 className="font-heading text-[20px] font-extrabold text-[#12172B]">Perpustakaan masih kosong</h3>
      <p className="mx-auto mt-1 max-w-sm text-[14px] font-medium text-slate-500">
        Kamu belum punya E-Book atau E-Learning. Jelajahi toko untuk mulai belajar mandiri kapan saja.
      </p>
      <a
        href="/toko"
        className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#12A37E] px-6 py-3 text-[14px] font-bold text-white transition hover:bg-[#0C8163] active:scale-[0.98]"
      >
        <ShoppingBag className="h-4 w-4" /> Jelajahi Toko Digital
      </a>
    </div>
  );
}
