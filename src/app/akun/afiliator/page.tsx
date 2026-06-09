"use client";

// ============================================================================
// /akun/afiliator — Affiliate Dashboard
// Affiliate Program — Phase 2A · 2C
// ----------------------------------------------------------------------------
// Reads /api/affiliate/me (service-role). See that route for the RLS gotcha
// (migrated affiliates have user_id = NULL).
//
// Phase 2C step 3a — dashboard redesign (logout, reveals, count-up, chart grow).
// Phase 2C step 3b — Link Generator + Materi Promosi sections.
//   - Link Generator: one referral code → many destination links. ?ref= is
//     captured by middleware on ALL content routes, so any path works.
//   - Materi Promosi: ready-to-paste promo copy with the ref link embedded.
//   Both are pure-frontend (build strings from referral_code) — no API/DB.
//
// ELEARNING_PATH is the single source of truth for the e-learning landing
// page; if that route ever changes, edit it in ONE place.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom"; // linguo-patch:afiliator-payout-modal-portal-v1
import { supabase } from "@/lib/supabase-client";
import RekeningForm from "./RekeningForm";
import KomisiKalkulator from "@/components/afiliator/KomisiKalkulator";
import { tierKeyFromDb } from "@/lib/affiliate-komisi";
import type { Session } from "@supabase/supabase-js";
import {
  Copy,
  Check,
  Share2,
  MousePointerClick,
  ShoppingBag,
  Wallet,
  Mail,
  Lock,
  BarChart3,
  LogOut,
  RefreshCw,
  Link2,
  Megaphone,
  MessageCircle,
  Camera,
  Sparkles,
  LayoutGrid,
  Trophy,
  Coins,
  Clock,
  History,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
type Conversion = {
  id: string;
  product: string;
  language: string | null;
  level: string | null;
  gross_amount: number;
  commission_amount: number;
  status: string;
  created_at: string;
  customer_name: string | null;
  customer_email: string | null;
};

type DailyPoint = {
  date: string; // 'YYYY-MM-DD' (WIB)
  clicks: number;
  conversions: number;
};

type ApiResponse = {
  affiliate: {
    referral_code: string;
    tier: string;
    status: string;
    name: string;
    bank_name: string | null;
    bank_account_no: string | null;
    bank_account_name: string | null;
  } | null;
  stats?: {
    clicks: number;
    conversions_total: number;
    commission_pending: number;
    commission_approved: number;
    commission_paid: number;
  };
  daily?: DailyPoint[];
  conversions?: Conversion[];
};

// ── Maps ───────────────────────────────────────────────────────────────────
const TIER_LABEL: Record<string, string> = {
  standard: "Standard",
  lingfluencer_bronze: "Bronze",
  lingfluencer_silver: "Silver",
  lingfluencer_gold: "Gold",
};

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  pending: { label: "Menunggu", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  approved: { label: "Disetujui", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  paid: { label: "Dibayar", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Ditolak", cls: "bg-rose-50 text-rose-700 border-rose-200" },
};

const PRODUCT_LABEL: Record<string, string> = {
  private: "Kelas Private",
  reguler: "Kelas Reguler",
  kids: "Kelas Kids",
  elearning: "E-Learning",
  ebook: "E-Book",
  toefl: "TOEFL Prep",
  ielts: "IELTS Prep",
  b2b: "Corporate B2B",
};

const MONTH_ID = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

// ── Promo config ───────────────────────────────────────────────────────────
// Single source of truth for the e-learning landing route.
const ELEARNING_PATH = "/toko/paket-elearning";

// Link Generator preset destinations.
const DESTINATIONS: {
  key: string;
  label: string;
  desc: string;
  path: string;
  earns?: boolean;
}[] = [
  {
    key: "elearning",
    label: "Halaman E-Learning",
    desc: "Paket belajar 12+ bahasa — halaman yang menghasilkan komisi.",
    path: ELEARNING_PATH,
    earns: true,
  },
  {
    key: "home",
    label: "Beranda Linguo",
    desc: "Halaman utama linguo.id — cocok untuk pengenalan umum.",
    path: "/",
  },
  {
    key: "toko",
    label: "Toko Linguo",
    desc: "Etalase semua produk digital Linguo.",
    path: "/toko",
  },
];

// Materi Promosi templates. {{LINK}} is replaced with the affiliate's ref link.
const PROMO: {
  key: string;
  title: string;
  icon: typeof MessageCircle;
  text: string;
}[] = [
  {
    key: "wa",
    title: "Pesan WhatsApp (japri)",
    icon: MessageCircle,
    text: `Halo! 👋 Aku lagi belajar bahasa di Linguo.id — ada 60+ bahasa, materinya berupa video terstruktur, jadi bisa belajar kapan aja sesuai ritme sendiri.

Paket E-Learning-nya mulai Rp29.000 aja udah bisa akses 12+ bahasa sekaligus. Kalau kamu mau coba, daftar lewat link aku ya 🌏

{{LINK}}`,
  },
  {
    key: "ig",
    title: "Caption Instagram",
    icon: Camera,
    text: `Belajar bahasa baru nggak harus mahal & ribet ✨🎬

Di Linguo.id ada 60+ bahasa dengan materi video terstruktur level A1–B2 — belajar fleksibel kapan pun kamu mau.

Paket E-Learning mulai Rp29.000 → akses 12+ bahasa sekaligus.
Cobain lewat link ini yuk 👇
{{LINK}}

#belajarbahasa #linguoid #kursusbahasaonline #belajarbahasaasing`,
  },
  {
    key: "status",
    title: "Status Singkat (WA / Story)",
    icon: Sparkles,
    text: `Lagi seru belajar bahasa di Linguo.id 🌏 60+ bahasa, materi video, mulai Rp29.000 aja. Cobain juga yuk 👉 {{LINK}}`,
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────
const rupiah = (n: number) => "Rp " + Math.round(n || 0).toLocaleString("id-ID");

// Pencairan
const MIN_PAYOUT = 10_000; // saldo minimal sebelum boleh ajukan pencairan
const PAYOUT_FEE = 2500; // biaya admin disbursement, ditanggung afiliator

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

// Mask an email for privacy: keep first char + domain → "a***@gmail.com".
// Short/edge inputs degrade gracefully; null/empty → null.
function maskEmail(email: string | null): string | null {
  if (!email) return null;
  const at = email.indexOf("@");
  if (at < 1) return "***";
  const local = email.slice(0, at);
  const domain = email.slice(at); // includes "@"
  const head = local[0];
  return `${head}${"*".repeat(Math.max(2, local.length - 1))}${domain}`;
}

function parseYmd(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return { y, m: m - 1, d };
}
function shortLabel(ymd: string) {
  const { m, d } = parseYmd(ymd);
  return `${d} ${MONTH_ID[m] ?? "?"}`;
}
function niceCeil(n: number) {
  const steps = [5, 10, 20, 30, 50, 80, 100, 150, 200, 300, 500];
  for (const s of steps) if (n <= s) return s;
  return Math.ceil(n / 500) * 500;
}

// Build a referral link from a code + a path. Tolerates a pasted full URL or
// a path missing its leading slash, and strips any existing query/hash.
function buildLink(code: string, rawPath: string) {
  let p = (rawPath || "").trim();
  p = p.replace(/^https?:\/\/[^/]+/i, ""); // drop domain if a full URL was pasted
  p = p.split(/[?#]/)[0]; // drop existing query/hash
  if (!p.startsWith("/")) p = "/" + p;
  if (p === "/") return `https://linguo.id/?ref=${code}`;
  return `https://linguo.id${p}?ref=${code}`;
}

// Count a number up from 0 → target with an easeOutCubic curve.
function useCountUp(target: number, durationMs = 950) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target || target <= 0) {
      setVal(0);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => {
      const p = Math.min(1, (now - t0) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) raf = requestAnimationFrame(loop);
      else setVal(target);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return val;
}

// Clipboard copy with a transient "copied" flag, keyed so multiple buttons can
// share one hook instance.
function useCopy() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  async function copy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(
        () => setCopiedKey((k) => (k === key ? null : k)),
        1800
      );
    } catch {
      /* clipboard unavailable — ignore */
    }
  }
  return { copiedKey, copy };
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function AfiliatorPage() {
  const [authLoading, setAuthLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  // Active dashboard view. The sidebar (desktop) and MobileNav (mobile) both
  // drive this single piece of state; the data is fetched ONCE and kept in
  // memory, so switching views is instant — no refetch, no skeleton.
  const [view, setView] = useState("sec-ringkasan");

  const goView = useCallback((id: string) => {
    setView(id);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, []);

  // ── SWR cache key (per-user) ───────────────────────────────────────────
  // Scoped to the user id so a shared device never crosses caches. Bump the
  // version suffix if the payload shape changes (invalidates old entries).
  const cacheKey = session?.user?.id
    ? `aff_cache_v1_${session.user.id}`
    : null;

  // ── Auth: initial getSession + live onAuthStateChange ──────────────────
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setSession(s);
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ── Data: fetch /api/affiliate/me ──────────────────────────────────────
  // Load awal pakai skeleton; refetch latar (focus / interval / tombol
  // Refresh) jalan "silent" — update angka tanpa nge-flash skeleton, dan
  // kalau gagal JANGAN timpa data lama dengan layar error.
  // (Dulu cuma fetch sekali pas token berubah → data bisa stale kalau
  //  conversion masuk pas tab udah kebuka. Ini yang bikin Intan liat 0.)
  const loadData = useCallback(
    async (opts?: { silent?: boolean }) => {
      const token = session?.access_token;
      if (!token) {
        setData(null);
        return;
      }

      // SWR: on a foreground load, paint the last cached payload INSTANTLY so
      // a hard refresh never shows the skeleton when we have something to
      // show. The fetch below then revalidates in the background. The skeleton
      // only appears on a first-ever load (no cache yet).
      let paintedFromCache = false;
      if (!opts?.silent && cacheKey && typeof window !== "undefined") {
        try {
          const raw = window.localStorage.getItem(cacheKey);
          if (raw) {
            setData(JSON.parse(raw) as ApiResponse);
            paintedFromCache = true;
          }
        } catch {
          /* corrupt/blocked cache — ignore, fall back to skeleton */
        }
      }

      // If we already have something on screen (cache or prior data), the
      // revalidation is silent. Only a true cold load flashes the skeleton.
      const silent = opts?.silent || paintedFromCache;
      if (silent) setRefreshing(true);
      else setDataLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/affiliate/me", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json: ApiResponse = await res.json();
        setData(json);
        if (cacheKey && typeof window !== "undefined") {
          try {
            window.localStorage.setItem(cacheKey, JSON.stringify(json));
          } catch {
            /* quota/private mode — caching is best-effort */
          }
        }
      } catch {
        if (!silent)
          setError("Gagal memuat data afiliator. Coba refresh halaman.");
      } finally {
        if (silent) setRefreshing(false);
        else setDataLoading(false);
      }
    },
    [session?.access_token, cacheKey]
  );

  // Load awal + tiap token berubah (skeleton).
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Jaga tetap fresh: refetch pas tab di-focus/visible + poll ringan 45 dtk.
  useEffect(() => {
    if (!session?.access_token) return;
    const refetch = () => {
      if (document.visibilityState === "visible") loadData({ silent: true });
    };
    window.addEventListener("focus", refetch);
    document.addEventListener("visibilitychange", refetch);
    const iv = window.setInterval(refetch, 45000);
    return () => {
      window.removeEventListener("focus", refetch);
      document.removeEventListener("visibilitychange", refetch);
      window.clearInterval(iv);
    };
  }, [loadData, session?.access_token]);

  const aff = data?.affiliate ?? null;
  const refLink = aff ? `https://linguo.id/?ref=${aff.referral_code}` : "";

  // Avatar source: only present for Google-login users. Supabase stores the
  // provider photo under `avatar_url` (and Google also sends `picture`) — try
  // both. Email/password accounts (e.g. Intan) have neither → Header falls
  // back to an initial.
  const userMeta = (session?.user?.user_metadata ?? {}) as Record<string, unknown>;
  const avatarUrl =
    (typeof userMeta.avatar_url === "string" && userMeta.avatar_url) ||
    (typeof userMeta.picture === "string" && userMeta.picture) ||
    "";
  const userEmail = session?.user?.email ?? "";

  const waText = `Yuk belajar bahasa di Linguo.id! 🌏 60+ bahasa, kelas online bareng pengajar berpengalaman. Daftar lewat link aku ini ya: ${refLink}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(waText)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(refLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  async function logout() {
    setLoggingOut(true);
    // Drop the cached payload (holds unmasked customer emails) before the
    // session goes away, so nothing personal lingers on a shared device.
    if (cacheKey && typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(cacheKey);
      } catch {
        /* ignore */
      }
    }
    await supabase.auth.signOut();
    // onAuthStateChange flips session → null → AfiliatorLogin renders.
  }

  // ── Initial auth check ─────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-[#1A9E9E] border-t-transparent" />
      </div>
    );
  }

  // ── Logged out → centered login card ───────────────────────────────────
  if (!session) {
    return <AfiliatorLogin />;
  }

  // ── Logged in → dashboard ──────────────────────────────────────────────
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F5F7F8]">
      {/* Atmospheric background glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[#1A9E9E]/12 blur-3xl" />
        <div className="absolute top-48 -right-24 h-72 w-72 rounded-full bg-amber-300/12 blur-3xl" />
        <div className="absolute bottom-0 -left-24 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" />
      </div>

      <div className="flex min-h-screen">
        <Sidebar active={view} onNavigate={goView} onLogout={logout} loggingOut={loggingOut} />
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1080px] px-4 py-6 lg:px-8 lg:py-8">
            <Header name={aff?.name} email={userEmail} avatarUrl={avatarUrl} onLogout={logout} loggingOut={loggingOut} onRefresh={() => loadData({ silent: true })} refreshing={refreshing} />

        {dataLoading && <SkeletonBlock />}

        {!dataLoading && error && (
          <CenteredCard title="Ada kendala" desc={error} />
        )}

        {!dataLoading && !error && !aff && (
          <CenteredCard
            title="Kamu belum jadi afiliator"
            desc="Akun ini belum terdaftar di Program Afiliator Linguo. Hubungi tim Linguo kalau kamu ingin bergabung."
          />
        )}

        {!dataLoading && !error && aff && (
          <>
            <MobileNav active={view} onNavigate={goView} />
            <Dashboard
              view={view}
              aff={aff}
              stats={data!.stats!}
              conversions={data!.conversions ?? []}
              daily={data!.daily ?? []}
              refLink={refLink}
              waUrl={waUrl}
              copied={copied}
              onCopy={copyLink}
              onRefresh={() => loadData({ silent: true })}
            />
          </>
        )}
          </div>
        </main>
      </div>

      {/* ── Motion: page-load reveals + hero shimmer (CSS only) ──────────── */}
      <style jsx global>{`
        @keyframes affReveal {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .aff-reveal {
          opacity: 0;
          animation: affReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes affSweep {
          to {
            transform: translateX(130%);
          }
        }
        .aff-shimmer {
          transform: translateX(-130%);
          background: linear-gradient(
            110deg,
            transparent 38%,
            rgba(255, 255, 255, 0.22) 50%,
            transparent 62%
          );
          animation: affSweep 1.5s cubic-bezier(0.22, 1, 0.36, 1) 0.5s 1 forwards;
        }
        /* View switching: the dashboard shows ONE view at a time now. The old
           per-element load stagger (large animation-delays) was tuned for a
           single long scroll, so inside a view we disable it and instead fade
           each view in as a whole on switch — snappy, no "nothing then pop". */
        .aff-views .aff-reveal {
          animation: none;
          opacity: 1;
          transform: none;
        }
        .aff-viewfade {
          animation: affReveal 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .aff-reveal {
            animation: none;
            opacity: 1;
          }
          .aff-shimmer {
            animation: none;
            display: none;
          }
          .aff-viewfade {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

// ── Header (greeting + logout) ─────────────────────────────────────────────
function Header({
  name,
  email,
  avatarUrl,
  onLogout,
  loggingOut,
  onRefresh,
  refreshing,
}: {
  name?: string;
  email?: string;
  avatarUrl?: string;
  onLogout: () => void;
  loggingOut: boolean;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const first = (name || "").trim().split(/\s+/)[0];
  const initial = (first || email || "?").charAt(0).toUpperCase();

  // Account menu (avatar dropdown). Logout lives here now.
  const [menuOpen, setMenuOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const showImg = !!avatarUrl && !imgError;

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <header
      className="aff-reveal mb-6 flex items-start justify-between gap-3"
      style={{ animationDelay: "40ms" }}
    >
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-800">
          Program Afiliator
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {first ? `Hai, ${first} 👋 Senang kamu kembali.` : "Pantau performa & komisimu."}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 backdrop-blur transition hover:border-[#1A9E9E]/40 hover:bg-teal-50 hover:text-[#147878] disabled:opacity-50"
          aria-label="Perbarui data"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>

        {/* Account avatar → dropdown (logout inside) */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white/80 backdrop-blur transition hover:border-[#1A9E9E]/40 hover:ring-2 hover:ring-[#1A9E9E]/20"
            aria-label="Menu akun"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            {showImg ? (
              // Plain <img> (not next/image) to avoid domain whitelist config.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-[#1A9E9E] text-sm font-bold text-white">
                {initial}
              </span>
            )}
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-12 z-30 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5"
            >
              <div className="border-b border-slate-100 px-3.5 py-2.5">
                <div className="truncate text-xs font-semibold text-slate-700">
                  {name || "Afiliator"}
                </div>
                {email && (
                  <div className="truncate text-[11px] text-slate-400">{email}</div>
                )}
              </div>
              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                disabled={loggingOut}
                className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-xs font-semibold text-slate-600 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
              >
                {loggingOut ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                ) : (
                  <LogOut className="h-3.5 w-3.5" />
                )}
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// ── Login (inline, centered) — unchanged ───────────────────────────────────
function AfiliatorLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function loginGoogle() {
    setErr(null);
    setGoogleBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/akun/afiliator` },
    });
    if (error) {
      setErr(error.message);
      setGoogleBusy(false);
    }
  }

  async function loginEmail() {
    if (!email || !password) return;
    setErr(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setErr(
        error.message === "Invalid login credentials"
          ? "Email atau password salah."
          : error.message
      );
      setBusy(false);
    }
  }

  const inputCls =
    "h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1A9E9E] focus:bg-white focus:ring-2 focus:ring-[#1A9E9E]/20";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-teal-50/70 via-white to-slate-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="rounded-3xl border border-slate-200/70 bg-white p-8 shadow-[0_12px_48px_-16px_rgba(20,120,120,0.22)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1A9E9E] to-[#147878] shadow-lg shadow-[#1A9E9E]/25">
            <Wallet className="h-7 w-7 text-white" strokeWidth={2} />
          </div>

          <h1 className="mt-4 text-center text-xl font-bold text-slate-800">
            Dashboard Afiliator
          </h1>
          <p className="mt-1.5 text-center text-sm text-slate-500">
            Masuk untuk lihat komisi &amp; link referral kamu
          </p>

          <button
            onClick={loginGoogle}
            disabled={googleBusy || busy}
            className="mt-6 flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
          >
            {googleBusy ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Masuk dengan Google
              </>
            )}
          </button>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              atau
            </span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loginEmail()}
                className={inputCls}
              />
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loginEmail()}
                className={inputCls}
              />
            </div>

            {err && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
                {err}
              </p>
            )}

            <button
              onClick={loginEmail}
              disabled={busy || googleBusy || !email || !password}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-[#1A9E9E] text-sm font-semibold text-white shadow-lg shadow-[#1A9E9E]/25 transition hover:bg-[#147878] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              {busy ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                "Masuk"
              )}
            </button>
          </div>

          <p className="mt-5 text-center text-xs text-slate-400">
            Gunakan email yang terdaftar sebagai afiliator Linguo.
          </p>
        </div>

        <p className="mt-6 text-center">
          <a
            href="/"
            className="text-xs text-slate-400 transition hover:text-slate-600"
          >
            Kembali ke Linguo.id
          </a>
        </p>
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────
// linguo-patch:afiliator-payout-modal-v1
// ── PayoutModal ─ self-service "Cairkan Semua" (Xendit disbursement) ─────
// Calls POST /api/affiliate/payout with the caller's access token. v1 cairkan
// SELURUH saldo (no partial). Fee Rp2.500 ditanggung afiliator -> kirim = saldo
// - fee. onDone() me-refresh saldo di latar; modal tetap buka nampilin sukses.
function PayoutModal({
  aff,
  available,
  onClose,
  onDone,
}: {
  aff: NonNullable<ApiResponse["affiliate"]>;
  available: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ diterima: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const diterima = Math.max(0, available - PAYOUT_FEE);

  async function submit() {
    setError(null);
    setSubmitting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError("Sesi habis. Coba refresh halaman.");
        setSubmitting(false);
        return;
      }
      const res = await fetch("/api/affiliate/payout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        setError(json?.error || "Gagal mengajukan pencairan. Coba lagi.");
        setSubmitting(false);
        return;
      }
      setResult({ diterima: typeof json.diterima === "number" ? json.diterima : diterima });
      setSubmitting(false);
      onDone();
    } catch {
      setError("Gagal terhubung ke server. Coba lagi.");
      setSubmitting(false);
    }
  }

  if (!mounted) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-gradient-to-br from-[#1A9E9E] to-[#0F6B6B] px-5 py-4 text-white">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Wallet className="h-4 w-4" /> Cairkan Komisi
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            aria-label="Tutup"
            className="rounded-full px-2 py-0.5 text-white/80 transition hover:bg-white/15 hover:text-white disabled:opacity-40"
          >
            ✕
          </button>
        </div>

        {result ? (
          <div className="space-y-3 px-5 py-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="h-6 w-6" />
            </div>
            <div className="text-base font-bold text-slate-800">Pencairan diproses!</div>
            <p className="text-sm leading-relaxed text-slate-500">
              {rupiah(result.diterima)} lagi diproses ke rekening kamu. Biasanya
              masuk dalam beberapa menit sampai 1 hari kerja. Status bisa dipantau
              di halaman ini.
            </p>
            <button
              onClick={onClose}
              className="mt-2 h-11 w-full rounded-xl bg-[#1A9E9E] text-sm font-bold text-white transition hover:bg-[#147878]"
            >
              Selesai
            </button>
          </div>
        ) : (
          <div className="space-y-4 px-5 py-5">
            <div>
              <span className="mb-1 block text-xs font-semibold text-slate-500">
                Jumlah dicairkan
              </span>
              <input
                readOnly
                value={rupiah(available)}
                className="h-12 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-lg font-extrabold text-slate-800 outline-none"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Untuk sekarang pencairan menarik seluruh saldo yang tersedia.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50 px-4 py-3 text-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span>Saldo</span>
                <span className="font-semibold text-slate-700">{rupiah(available)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-slate-500">
                <span>Biaya admin</span>
                <span className="font-semibold text-slate-700">− {rupiah(PAYOUT_FEE)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2">
                <span className="font-semibold text-slate-700">Kamu terima</span>
                <span className="text-base font-extrabold text-[#1A9E9E]">{rupiah(diterima)}</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-xs text-slate-500">
              Ke rekening <b className="text-slate-700">{aff.bank_name ?? "-"}</b>{" "}
              {aff.bank_account_no ?? "-"}{" "}
              <span className="text-slate-400">(a.n. {aff.bank_account_name ?? "-"})</span>
            </div>

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                {error}
              </div>
            )}

            <button
              onClick={submit}
              disabled={submitting || available < MIN_PAYOUT}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1A9E9E] text-sm font-bold text-white shadow-sm transition hover:bg-[#147878] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Memproses…
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4" /> Cairkan Semua {rupiah(available)}
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-slate-400">
              Dengan klik Cairkan, kamu setuju biaya admin {rupiah(PAYOUT_FEE)} dipotong dari saldo.
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

function Dashboard({
  view,
  aff,
  stats,
  conversions,
  daily,
  refLink,
  waUrl,
  copied,
  onCopy,
  onRefresh,
}: {
  view: string;
  aff: NonNullable<ApiResponse["affiliate"]>;
  stats: NonNullable<ApiResponse["stats"]>;
  conversions: Conversion[];
  daily: DailyPoint[];
  refLink: string;
  waUrl: string;
  copied: boolean;
  onCopy: () => void;
  onRefresh: () => void;
}) {
  const totalKomisi =
    stats.commission_pending + stats.commission_approved + stats.commission_paid;

  // ── Pencairan: cuma komisi "Disetujui" (approved) yang bisa ditarik ──
  const available = stats.commission_approved;
  const hasRekening = !!(aff.bank_account_no && aff.bank_account_name);
  const canRequest =
    aff.status === "active" && available >= MIN_PAYOUT && hasRekening;
  const kurang = Math.max(0, MIN_PAYOUT - available);

  // Sparkline trends derived from the real daily series (last 14 WIB days).
  const last14 = daily.slice(-14);
  const klikSpark = last14.map((d) => d.clicks);
  const konvSpark = last14.map((d) => d.conversions);
  let _cum = 0;
  const komisiSpark = last14.map((d) => (_cum += d.conversions));

  const [payoutOpen, setPayoutOpen] = useState(false);

  return (
    <div className="aff-views space-y-6">
      {/* Status notice if not active */}
      {aff.status !== "active" && (
        <div
          className="aff-reveal rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          style={{ animationDelay: "90ms" }}
        >
          Status akun afiliator kamu:{" "}
          <b>{aff.status === "pending_review" ? "menunggu review" : aff.status}</b>
          . Komisi tetap tercatat, tapi pencairan baru bisa setelah akun aktif.
        </div>
      )}

      <div key={view} className="aff-viewfade space-y-6">
      {view === "sec-ringkasan" && (
      <>
      {/* RINGKASAN: hero + tier */}
      <section id="sec-ringkasan" className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div
          className="aff-reveal relative h-full overflow-hidden rounded-3xl bg-gradient-to-br from-[#1FB3B3] via-[#1A9E9E] to-[#0F6B6B] p-6 text-white shadow-[0_22px_55px_-22px_rgba(15,107,107,0.7)] lg:col-span-7"
          style={{ animationDelay: "110ms" }}
        >
          <div className="pointer-events-none absolute -right-12 -top-14 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-emerald-300/15 blur-2xl" />
          <div className="aff-shimmer pointer-events-none absolute inset-0" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
                Kode Referral
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold ring-1 ring-white/20 backdrop-blur">
                ★ Tier {TIER_LABEL[aff.tier] ?? aff.tier}
              </span>
            </div>
            <div className="mt-2 font-mono text-[2rem] font-extrabold leading-none tracking-[0.16em]">
              {aff.referral_code}
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-black/15 px-3 py-2.5 ring-1 ring-white/10">
              <Link2 className="h-4 w-4 shrink-0 text-white/55" />
              <span className="truncate text-sm text-white/90">{refLink}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <button
                onClick={onCopy}
                className="flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-bold text-[#147878] shadow-sm transition hover:bg-white/90 active:scale-[0.98]"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Tersalin!" : "Salin Link"}
              </button>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-600 active:scale-[0.98]"
              >
                <Share2 className="h-4 w-4" />
                Share WA
              </a>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <TierCard tier={aff.tier} />
        </div>
      </section>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={<MousePointerClick className="h-4 w-4" />} label="Klik" value={stats.clicks} tone="teal" spark={klikSpark} sparkColor="#1A9E9E" delay="180ms" />
        <StatCard icon={<ShoppingBag className="h-4 w-4" />} label="Konversi" value={stats.conversions_total} tone="amber" spark={konvSpark} sparkColor="#EAB308" delay="225ms" />
        <StatCard icon={<Wallet className="h-4 w-4" />} label="Total Komisi" value={totalKomisi} tone="indigo" money spark={komisiSpark} sparkColor="#6366F1" delay="270ms" />
        <StatCard icon={<Coins className="h-4 w-4" />} label="Saldo Siap Cair" value={available} tone="emerald" money spark={komisiSpark} sparkColor="#10B981" delay="315ms" />
      </div>

      {/* Status segmented */}
      <div className="aff-reveal grid grid-cols-3 divide-x divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm" style={{ animationDelay: "345ms" }}>
        <KomisiCol dot="bg-amber-400" label="Menunggu" amount={stats.commission_pending} tone="text-amber-700" />
        <KomisiCol dot="bg-blue-400" label="Disetujui" amount={stats.commission_approved} tone="text-blue-700" />
        <KomisiCol dot="bg-emerald-400" label="Dibayar" amount={stats.commission_paid} tone="text-emerald-700" />
      </div>

      {/* SIMULASI POTENSI: kalkulator komisi terkunci ke tier user */}
      <section className="aff-reveal" style={{ animationDelay: "375ms" }}>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-700">
          <span className="h-4 w-1 rounded bg-[#1A9E9E]" />
          Simulasi Potensi
        </h2>
        <KomisiKalkulator lockedTier={tierKeyFromDb(aff.tier)} />
      </section>

      </>
      )}
      {view === "sec-performa" && (
      <>
      {/* PERFORMA: chart + donut */}
      <section id="sec-performa" className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="aff-reveal lg:col-span-8" style={{ animationDelay: "400ms" }}>
          <ActivityChart daily={daily} />
        </div>
        <div className="aff-reveal lg:col-span-4" style={{ animationDelay: "430ms" }}>
          <Donut pending={stats.commission_pending} approved={stats.commission_approved} paid={stats.commission_paid} total={totalKomisi} />
        </div>
      </section>

      </>
      )}
      {view === "sec-pencairan" && (
      <>
      {/* PENCAIRAN: payout + rekening */}
      <section id="sec-pencairan">
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-700">
          <span className="h-4 w-1 rounded bg-[#1A9E9E]" />
          Pencairan
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="aff-reveal overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm lg:col-span-5" style={{ animationDelay: "460ms" }}>
            <div className="bg-gradient-to-br from-[#1A9E9E] to-[#0F6B6B] px-5 py-4 text-white">
              <div className="flex items-center gap-2 text-xs font-medium text-teal-50/90">
                <Wallet className="h-4 w-4" /> Saldo siap dicairkan
              </div>
              <div className="mt-1 text-2xl font-extrabold tracking-tight">{rupiah(available)}</div>
              {stats.commission_pending > 0 && (
                <div className="mt-1 text-[11px] text-teal-50/80">
                  +{rupiah(stats.commission_pending)} masih menunggu disetujui
                </div>
              )}
            </div>
            <div className="space-y-3 px-5 py-4">
              {aff.status !== "active" ? (
                <p className="text-xs text-slate-500">
                  Pencairan aktif setelah akun afiliator kamu disetujui.
                </p>
              ) : !hasRekening ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Lengkapi data rekening dulu di bagian <b>Rekening Pencairan</b> (samping) sebelum mengajukan pencairan.
                </div>
              ) : available < MIN_PAYOUT ? (
                <>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-[#1A9E9E] transition-all" style={{ width: `${Math.min(100, (available / MIN_PAYOUT) * 100)}%` }} />
                  </div>
                  <p className="text-xs text-slate-500">
                    Minimal pencairan <b>{rupiah(MIN_PAYOUT)}</b>. Kurang <b className="text-slate-700">{rupiah(kurang)}</b> lagi.
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-500">
                  Saldo kamu udah cukup. Klik tombol di bawah buat ajukan pencairan ke admin.
                </p>
              )}

              {canRequest ? (
                <button onClick={() => setPayoutOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1A9E9E] py-2.5 text-sm font-semibold text-white transition hover:bg-[#147878]">
                  <Wallet className="h-4 w-4" /> Cairkan {rupiah(available)}
                </button>
              ) : (
                <button disabled className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-400">
                  <Wallet className="h-4 w-4" /> Cairkan Komisi
                </button>
              )}

              <p className="text-center text-[11px] text-slate-400">
                Komisi disetujui otomatis 14 hari setelah pembayaran. Pencairan bisa kapan saja, minimal Rp 10.000.
              </p>
            </div>
          </div>

          <div className="aff-reveal lg:col-span-7" style={{ animationDelay: "500ms" }}>
            <RekeningForm aff={aff} />
          </div>
        </div>
      </section>

      {payoutOpen && (
        <PayoutModal
          aff={aff}
          available={available}
          onClose={() => setPayoutOpen(false)}
          onDone={onRefresh}
        />
      )}

      </>
      )}
      {view === "sec-promosi" && (
      <>
      {/* PROMOSI: link generator + materi */}
      <section id="sec-promosi">
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-700">
          <span className="h-4 w-1 rounded bg-[#1A9E9E]" />
          Alat Promosi
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="aff-reveal" style={{ animationDelay: "540ms" }}>
            <LinkGenerator code={aff.referral_code} />
          </div>
          <div className="aff-reveal" style={{ animationDelay: "580ms" }}>
            <MateriPromosi code={aff.referral_code} />
          </div>
        </div>
      </section>

      </>
      )}
      {view === "sec-aktivitas" && (
      <>
      {/* AKTIVITAS: riwayat konversi (table) */}
      <section id="sec-aktivitas" className="aff-reveal" style={{ animationDelay: "620ms" }}>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-700">
          <History className="h-4 w-4 text-slate-400" />
          Riwayat Konversi
        </h2>
        {conversions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-9 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
              <ShoppingBag className="h-5 w-5 text-slate-400" />
            </div>
            <p className="mx-auto mt-3 max-w-xs text-sm text-slate-500">
              Belum ada konversi. Sebarkan link referral kamu untuk mulai dapat komisi.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[580px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-2.5 font-semibold">Tanggal</th>
                    <th className="px-4 py-2.5 font-semibold">Produk</th>
                    <th className="px-4 py-2.5 font-semibold">Diajak</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Komisi</th>
                  </tr>
                </thead>
                <tbody>
                  {conversions.map((c) => {
                    const st = STATUS_STYLE[c.status] ?? {
                      label: c.status,
                      cls: "bg-slate-50 text-slate-600 border-slate-200",
                    };
                    return (
                      <tr key={c.id} className="border-b border-slate-50 transition last:border-0 hover:bg-slate-50/60">
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-500">{fmtDate(c.created_at)}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {PRODUCT_LABEL[c.product] ?? c.product}
                          {c.language ? ` · ${c.language}` : ""}
                          {c.level ? ` ${c.level}` : ""}
                        </td>
                        <td className="px-4 py-3">
                          {c.customer_name || c.customer_email ? (
                            <div className="leading-tight">
                              <div className="font-medium text-slate-700">
                                {c.customer_name ?? "—"}
                              </div>
                              {c.customer_email && (
                                <div className="text-[11px] text-slate-400">
                                  {maskEmail(c.customer_email)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${st.cls}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold tabular-nums text-[#147878]">{rupiah(c.commission_amount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="border-t border-slate-50 px-4 py-2.5 text-center text-[11px] text-slate-400">
              Hanya konversi yang dicatat per-baris. Klik dihitung agregat (lihat grafik di atas).
            </p>
          </div>
        )}
      </section>

      </>
      )}
      </div>

      <p className="pt-1 text-center text-xs text-slate-400">
        Komisi disetujui otomatis 14 hari setelah pembayaran. Pencairan bisa kapan saja, minimal Rp 10.000.
      </p>
    </div>
  );
}

// ── Link Generator ─────────────────────────────────────────────────────────
function LinkGenerator({ code }: { code: string }) {
  const { copiedKey, copy } = useCopy();
  const [customPath, setCustomPath] = useState("");

  const customLink = customPath.trim() ? buildLink(code, customPath) : "";

  return (
    <div>
      <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-700">
        <Link2 className="h-4 w-4 text-slate-400" />
        Link Generator
      </h2>
      <div className="space-y-2.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <p className="text-xs text-slate-500">
          Satu kode{" "}
          <span className="font-mono font-semibold text-slate-700">{code}</span>
          , banyak link tujuan. Pilih halaman, salin, lalu sebarkan.
        </p>

        {DESTINATIONS.map((d) => {
          const link = buildLink(code, d.path);
          const isCopied = copiedKey === d.key;
          return (
            <div key={d.key} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800">
                  {d.label}
                </span>
                {d.earns && (
                  <span className="rounded-full bg-[#1A9E9E]/10 px-2 py-0.5 text-[10px] font-bold text-[#147878]">
                    ★ Paling Cuan
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-slate-500">{d.desc}</p>
              <div className="mt-2 flex items-center gap-2">
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 flex-1 truncate rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600 ring-1 ring-slate-100 transition hover:text-[#147878]"
                >
                  {link}
                </a>
                <button
                  onClick={() => copy(d.key, link)}
                  className="flex shrink-0 items-center gap-1 rounded-lg bg-[#1A9E9E] px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-[#147878] active:scale-95"
                >
                  {isCopied ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {isCopied ? "Tersalin" : "Salin"}
                </button>
              </div>
            </div>
          );
        })}

        {/* Custom path */}
        <div className="rounded-xl border border-dashed border-slate-300 p-3">
          <span className="text-sm font-semibold text-slate-700">
            Halaman lain
          </span>
          <p className="mt-0.5 text-xs text-slate-500">
            Tempel path halaman linguo.id mana pun — contoh:{" "}
            <span className="font-mono">/silabus</span>.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <input
              value={customPath}
              onChange={(e) => setCustomPath(e.target.value)}
              placeholder="/silabus"
              className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-[#1A9E9E] focus:bg-white"
            />
            <button
              onClick={() => customLink && copy("custom", customLink)}
              disabled={!customLink}
              className="flex shrink-0 items-center gap-1 rounded-lg bg-[#1A9E9E] px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-[#147878] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {copiedKey === "custom" ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copiedKey === "custom" ? "Tersalin" : "Salin"}
            </button>
          </div>
          {customLink && (
            <a
              href={customLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block truncate rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600 ring-1 ring-slate-100 transition hover:text-[#147878]"
            >
              {customLink}
            </a>
          )}
        </div>

        <p className="text-[11px] leading-relaxed text-slate-400">
          💡 Komisi dihitung saat pengunjung dari link kamu membeli paket
          E-Learning. Cookie referral berlaku 60 hari sejak link diklik.
        </p>
      </div>
    </div>
  );
}

// ── Materi Promosi ─────────────────────────────────────────────────────────
function MateriPromosi({ code }: { code: string }) {
  const { copiedKey, copy } = useCopy();
  const link = buildLink(code, ELEARNING_PATH);

  return (
    <div>
      <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-700">
        <Megaphone className="h-4 w-4 text-slate-400" />
        Materi Promosi
      </h2>
      <div className="space-y-2.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <p className="text-xs text-slate-500">
          Teks siap pakai — tinggal salin &amp; tempel. Link referral kamu sudah
          otomatis ada di dalamnya.
        </p>

        {PROMO.map((p) => {
          const Icon = p.icon;
          const text = p.text.replace(/\{\{LINK\}\}/g, link);
          const isCopied = copiedKey === p.key;
          return (
            <div key={p.key} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Icon className="h-4 w-4 text-[#1A9E9E]" />
                  <span className="text-sm font-semibold text-slate-800">
                    {p.title}
                  </span>
                </div>
                <button
                  onClick={() => copy(p.key, text)}
                  className="flex shrink-0 items-center gap-1 rounded-lg bg-[#1A9E9E] px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-[#147878] active:scale-95"
                >
                  {isCopied ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {isCopied ? "Tersalin" : "Salin"}
                </button>
              </div>
              <div className="mt-2 whitespace-pre-line rounded-lg bg-slate-50 p-2.5 text-xs leading-relaxed text-slate-600 ring-1 ring-slate-100">
                {text}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Activity chart (overlaid bars: clicks + conversions) ───────────────────
type ChartBar = {
  label: string;
  fullLabel: string;
  clicks: number;
  conversions: number;
};

function ActivityChart({ daily }: { daily: DailyPoint[] }) {
  const [mode, setMode] = useState<"harian" | "mingguan">("harian");
  const [sel, setSel] = useState<number | null>(null);
  const [grown, setGrown] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setGrown(true), 80);
    return () => clearTimeout(t);
  }, []);

  const bars: ChartBar[] = useMemo(() => {
    if (!daily.length) return [];

    if (mode === "harian") {
      return daily.slice(-14).map((p) => ({
        label: String(parseYmd(p.date).d),
        fullLabel: shortLabel(p.date),
        clicks: p.clicks,
        conversions: p.conversions,
      }));
    }

    const last28 = daily.slice(-28);
    const out: ChartBar[] = [];
    for (let i = 0; i < last28.length; i += 7) {
      const chunk = last28.slice(i, i + 7);
      if (!chunk.length) continue;
      const first = chunk[0].date;
      const last = chunk[chunk.length - 1].date;
      const fp = parseYmd(first);
      const lp = parseYmd(last);
      out.push({
        label: `${fp.d}–${lp.d} ${MONTH_ID[lp.m] ?? ""}`,
        fullLabel: `${shortLabel(first)} – ${shortLabel(last)}`,
        clicks: chunk.reduce((t, c) => t + c.clicks, 0),
        conversions: chunk.reduce((t, c) => t + c.conversions, 0),
      });
    }
    return out;
  }, [daily, mode]);

  if (!daily.length) return null;

  const peak = Math.max(1, ...bars.map((b) => Math.max(b.clicks, b.conversions)));
  const ceil = niceCeil(peak);
  const pct = (v: number) => `${Math.min(100, (v / ceil) * 100)}%`;

  const totalClicks = bars.reduce((t, b) => t + b.clicks, 0);
  const totalConv = bars.reduce((t, b) => t + b.conversions, 0);

  const active = sel !== null && sel >= 0 && sel < bars.length ? bars[sel] : null;
  const ctxLabel = active
    ? active.fullLabel
    : mode === "harian"
    ? "14 hari terakhir"
    : "4 minggu terakhir";
  const ctxClicks = active ? active.clicks : totalClicks;
  const ctxConv = active ? active.conversions : totalConv;

  function switchMode(m: "harian" | "mingguan") {
    setMode(m);
    setSel(null);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
          <BarChart3 className="h-4 w-4 text-slate-400" />
          Grafik Aktivitas
        </h2>
        <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs">
          <button
            onClick={() => switchMode("harian")}
            className={
              mode === "harian"
                ? "rounded-lg bg-white px-3 py-1 font-bold text-[#147878] shadow-sm"
                : "rounded-lg px-3 py-1 font-medium text-slate-500 transition hover:text-slate-700"
            }
          >
            Harian
          </button>
          <button
            onClick={() => switchMode("mingguan")}
            className={
              mode === "mingguan"
                ? "rounded-lg bg-white px-3 py-1 font-bold text-[#147878] shadow-sm"
                : "rounded-lg px-3 py-1 font-medium text-slate-500 transition hover:text-slate-700"
            }
          >
            Mingguan
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#1A9E9E]" />
            Klik
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#EAB308]" />
            Konversi
          </span>
        </div>

        <div className="flex gap-2">
          <div className="flex h-[132px] w-5 flex-col justify-between text-right text-[9px] leading-none text-slate-300">
            <span>{ceil}</span>
            <span>{ceil / 2}</span>
            <span>0</span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="relative h-[132px]">
              <div className="absolute inset-x-0 top-0 border-t border-slate-100" />
              <div className="absolute inset-x-0 top-1/2 border-t border-slate-100" />
              <div className="absolute inset-x-0 bottom-0 border-t border-slate-200" />

              <div className="absolute inset-0 flex items-end gap-[3px]">
                {bars.map((b, i) => {
                  const dim = sel !== null && sel !== i;
                  const grow =
                    "height 0.7s cubic-bezier(0.16,1,0.3,1), opacity 0.2s ease";
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSel(sel === i ? null : i)}
                      className="group relative flex h-full flex-1 items-end justify-center"
                      aria-label={`${b.fullLabel}: ${b.clicks} klik, ${b.conversions} konversi`}
                    >
                      <div
                        className={`absolute bottom-0 w-[58%] rounded-t-[3px] bg-[#1A9E9E] ${
                          dim ? "opacity-30" : "opacity-100"
                        }`}
                        style={{
                          height: grown ? pct(b.clicks) : "0%",
                          minHeight: grown && b.clicks > 0 ? 3 : 0,
                          transition: grow,
                          transitionDelay: `${i * 26}ms`,
                        }}
                      />
                      <div
                        className={`absolute bottom-0 w-[26%] rounded-t-[3px] bg-[#EAB308] ${
                          dim ? "opacity-30" : "opacity-100"
                        }`}
                        style={{
                          height: grown ? pct(b.conversions) : "0%",
                          minHeight: grown && b.conversions > 0 ? 3 : 0,
                          transition: grow,
                          transitionDelay: `${i * 26 + 60}ms`,
                        }}
                      />
                      {sel === i && (
                        <div className="absolute -top-1 h-1 w-1 rounded-full bg-slate-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-1.5 flex gap-[3px]">
              {bars.map((b, i) => (
                <div
                  key={i}
                  className={`flex-1 truncate text-center text-[9px] leading-tight ${
                    sel === i ? "font-bold text-slate-600" : "text-slate-400"
                  }`}
                >
                  {b.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
          <span className="text-xs font-semibold text-slate-600">
            {ctxLabel}
          </span>
          <span className="flex items-center gap-3 text-xs">
            <span className="font-bold text-[#147878]">{ctxClicks} klik</span>
            <span className="font-bold text-amber-600">{ctxConv} konversi</span>
          </span>
        </div>

        <p className="mt-2 text-center text-[11px] text-slate-400">
          Ketuk batang untuk lihat detail tanggalnya.
        </p>
      </div>
    </div>
  );
}

// ── Small components ───────────────────────────────────────────────────────
const STAT_TONE: Record<string, string> = {
  teal: "bg-[#1A9E9E]/12 text-[#1A9E9E]",
  amber: "bg-amber-100 text-amber-600",
  indigo: "bg-indigo-100 text-indigo-600",
  emerald: "bg-emerald-100 text-emerald-600",
};

function StatCard({
  icon,
  label,
  value,
  tone,
  money,
  delay,
  spark,
  sparkColor = "#1A9E9E",
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone: "teal" | "amber" | "indigo" | "emerald";
  money?: boolean;
  delay: string;
  spark?: number[];
  sparkColor?: string;
}) {
  const animated = useCountUp(value);
  const display = money
    ? rupiah(animated)
    : Math.round(animated).toLocaleString("id-ID");

  return (
    <div
      className="aff-reveal group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
      style={{ animationDelay: delay }}
    >
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${STAT_TONE[tone]}`}
      >
        {icon}
      </div>
      {spark && spark.length > 1 && (
        <div className="absolute right-3 top-3 h-7 w-16 opacity-50">
          <Sparkline data={spark} color={sparkColor} />
        </div>
      )}
      <div className="mt-2.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div
        className={`mt-0.5 font-extrabold tabular-nums text-slate-800 ${
          money ? "text-[15px]" : "text-xl"
        }`}
      >
        {display}
      </div>
    </div>
  );
}

// ── Sparkline (tiny SVG trend line) ────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const W = 64;
  const H = 28;
  const max = Math.max(1, ...data);
  const step = data.length > 1 ? W / (data.length - 1) : W;
  const pts = data
    .map((v, i) => `${i * step},${H - (v / max) * (H - 4) - 2}`)
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="h-full w-full"
    >
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function KomisiCol({
  dot,
  label,
  amount,
  tone,
}: {
  dot: string;
  label: string;
  amount: number;
  tone: string;
}) {
  const animated = useCountUp(amount);
  return (
    <div className="px-2.5 py-3 text-center">
      <div className="flex items-center justify-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
          {label}
        </span>
      </div>
      <div className={`mt-1 text-xs font-bold tabular-nums ${tone}`}>
        {rupiah(animated)}
      </div>
    </div>
  );
}

function SkeletonBlock() {
  return (
    <div className="space-y-4">
      <div className="h-48 animate-pulse rounded-3xl bg-slate-200" />
      <div className="grid grid-cols-3 gap-3">
        <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
      </div>
      <div className="h-16 animate-pulse rounded-2xl bg-slate-200" />
      <div className="h-56 animate-pulse rounded-2xl bg-slate-200" />
    </div>
  );
}

function CenteredCard({
  title,
  desc,
  actionLabel,
  actionHref,
}: {
  title: string;
  desc: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="aff-reveal rounded-3xl border border-slate-200/80 bg-white px-6 py-12 text-center shadow-sm">
      <h2 className="text-base font-bold text-slate-800">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">{desc}</p>
      {actionLabel && actionHref && (
        <a
          href={actionHref}
          className="mt-4 inline-block rounded-lg bg-[#1A9E9E] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#147878]"
        >
          {actionLabel}
        </a>
      )}
    </div>
  );
}

// ── Sidebar rail (desktop only; mobile keeps single column) ────────────────
const NAV: { id: string; label: string; icon: typeof LayoutGrid }[] = [
  { id: "sec-ringkasan", label: "Ringkasan", icon: LayoutGrid },
  { id: "sec-performa", label: "Performa", icon: BarChart3 },
  { id: "sec-pencairan", label: "Pencairan", icon: Wallet },
  { id: "sec-promosi", label: "Promosi", icon: Megaphone },
  { id: "sec-aktivitas", label: "Aktivitas", icon: History },
];

function Sidebar({
  active,
  onNavigate,
  onLogout,
  loggingOut,
}: {
  active: string;
  onNavigate: (id: string) => void;
  onLogout: () => void;
  loggingOut: boolean;
}) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[72px] shrink-0 flex-col items-center gap-2 border-r border-slate-200/70 bg-white/70 py-5 backdrop-blur lg:flex">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1FB3B3] to-[#0F6B6B] font-extrabold text-white shadow-lg shadow-[#1A9E9E]/30">
        L
      </div>
      {NAV.map(({ id, label, icon: Icon }) => {
        const on = active === id;
        return (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            title={label}
            aria-label={label}
            className={`grid h-11 w-11 place-items-center rounded-xl transition ${
              on
                ? "bg-[#1A9E9E] text-white shadow-lg shadow-[#1A9E9E]/40"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            <Icon className="h-5 w-5" />
          </button>
        );
      })}
      <button
        onClick={onLogout}
        disabled={loggingOut}
        title="Keluar"
        aria-label="Keluar"
        className="mt-auto grid h-11 w-11 place-items-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50"
      >
        {loggingOut ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
        ) : (
          <LogOut className="h-5 w-5" />
        )}
      </button>
    </aside>
  );
}

// ── Mobile nav (horizontal tabs; replaces the desktop rail on small screens) ─
function MobileNav({
  active,
  onNavigate,
}: {
  active: string;
  onNavigate: (id: string) => void;
}) {
  return (
    <nav className="mb-5 flex gap-1.5 overflow-x-auto pb-1 lg:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {NAV.map(({ id, label, icon: Icon }) => {
        const on = active === id;
        return (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
              on
                ? "bg-[#1A9E9E] text-white shadow-sm shadow-[#1A9E9E]/30"
                : "border border-slate-200 bg-white text-slate-600"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}
    </nav>
  );
}

// ── Tier card (honest: real tier + real facts, no fabricated threshold) ────
function TierCard({ tier }: { tier: string }) {
  const label = TIER_LABEL[tier] ?? tier;
  const perks: { icon: typeof Coins; t: string; s: string }[] = [
    { icon: Coins, t: "Komisi per konversi E-Learning", s: "otomatis tercatat tiap pembelian" },
    { icon: Wallet, t: "Min. cair Rp 10.000", s: "cair kapan saja, otomatis" },
    { icon: Clock, t: "Cookie referral 60 hari", s: "komisi tetap kehitung walau beli nanti" },
  ];
  return (
    <div
      className="aff-reveal flex h-full flex-col rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm"
      style={{ animationDelay: "150ms" }}
    >
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-100 text-amber-600">
          <Trophy className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-extrabold text-slate-800">Tier {label}</div>
          <div className="text-xs text-slate-500">Status diatur tim Linguo</div>
        </div>
      </div>
      <div className="mt-4 space-y-2.5">
        {perks.map((p, i) => {
          const Icon = p.icon;
          return (
            <div key={i} className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#1A9E9E]/10 text-[#147878]">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-slate-700">{p.t}</div>
                <div className="text-[11px] text-slate-400">{p.s}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Donut (commission status breakdown) ────────────────────────────────────
function Donut({
  pending,
  approved,
  paid,
  total,
}: {
  pending: number;
  approved: number;
  paid: number;
  total: number;
}) {
  const segs = [
    { value: pending, color: "#FBBF24", label: "Menunggu", text: "text-amber-700" },
    { value: approved, color: "#1A9E9E", label: "Disetujui", text: "text-[#147878]" },
    { value: paid, color: "#34D399", label: "Dibayar", text: "text-emerald-700" },
  ];
  let acc = 0;
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="mb-1 text-sm font-bold text-slate-700">Status Komisi</div>
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <svg width="104" height="104" viewBox="0 0 42 42">
            <circle cx="21" cy="21" r="15.9155" fill="none" stroke="#EEF2F1" strokeWidth="6" />
            {total > 0 &&
              segs.map((s, i) => {
                const len = (s.value / total) * 100;
                if (len <= 0) return null;
                const off = 25 - acc;
                acc += len;
                return (
                  <circle
                    key={i}
                    cx="21"
                    cy="21"
                    r="15.9155"
                    fill="none"
                    stroke={s.color}
                    strokeWidth="6"
                    strokeDasharray={`${len} ${100 - len}`}
                    strokeDashoffset={off}
                    strokeLinecap="butt"
                  />
                );
              })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[9px] uppercase tracking-wide text-slate-400">Total</div>
            <div className="text-[13px] font-extrabold text-slate-800">{rupiah(total)}</div>
          </div>
        </div>
        <div className="flex-1 space-y-2 text-xs">
          {segs.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
              <span className="flex-1 text-slate-500">{s.label}</span>
              <span className={`font-bold tabular-nums ${s.text}`}>{rupiah(s.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
