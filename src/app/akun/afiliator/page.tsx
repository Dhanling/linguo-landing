"use client";

// ============================================================================
// /akun/afiliator — Affiliate Dashboard
// Affiliate Program — Phase 2A
// ----------------------------------------------------------------------------
// Reads /api/affiliate/me (service-role). See that route for the RLS gotcha
// (migrated affiliates have user_id = NULL). Charts + promo materials are
// deferred to Phase 2C.
//
// afiliator-login-v1: logged-out state is now a real inline login form
// (Google + email/password) instead of a redirect-to-/akun card. Auth uses
// onAuthStateChange so login transitions straight into the dashboard.
// ============================================================================

import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase-client";
import type { Session } from "@supabase/supabase-js";
import {
  ArrowLeft,
  Copy,
  Check,
  Share2,
  MousePointerClick,
  ShoppingBag,
  Wallet,
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
};

type ApiResponse = {
  affiliate: {
    referral_code: string;
    tier: string;
    status: string;
    name: string;
  } | null;
  stats?: {
    clicks: number;
    conversions_total: number;
    commission_pending: number;
    commission_approved: number;
    commission_paid: number;
  };
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
  toefl: "TOEFL Prep",
  ielts: "IELTS Prep",
  b2b: "Corporate B2B",
};

// ── Helpers ────────────────────────────────────────────────────────────────
const rupiah = (n: number) => "Rp " + Math.round(n || 0).toLocaleString("id-ID");

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

// ── Page ───────────────────────────────────────────────────────────────────
export default function AfiliatorPage() {
  const [authLoading, setAuthLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ── Auth: initial getSession + live onAuthStateChange ──────────────────
  // Don't rely on a single getSession() — subscribe so a login (or token
  // refresh) flows straight into the dashboard without a manual refresh.
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

  // ── Data: fetch /api/affiliate/me whenever we have a session ───────────
  useEffect(() => {
    if (!session) {
      setData(null);
      return;
    }
    let cancelled = false;
    setDataLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch("/api/affiliate/me", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json: ApiResponse = await res.json();
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled)
          setError("Gagal memuat data afiliator. Coba refresh halaman.");
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.access_token]);

  const aff = data?.affiliate ?? null;
  const refLink = aff ? `https://linguo.id/?ref=${aff.referral_code}` : "";
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

  const showSkeleton = authLoading || (session && dataLoading);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Top bar */}
        <div className="mb-6 flex items-center gap-3">
          <a
            href="/akun"
            aria-label="Kembali"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
          </a>
          <h1 className="text-lg font-bold text-slate-800">Program Afiliator</h1>
        </div>

        {showSkeleton && <SkeletonBlock />}

        {/* Logged out → inline login form */}
        {!authLoading && !session && <AfiliatorLogin />}

        {!showSkeleton && session && error && (
          <CenteredCard title="Ada kendala" desc={error} />
        )}

        {!showSkeleton && session && !error && !aff && (
          <CenteredCard
            title="Kamu belum jadi afiliator"
            desc="Akun ini belum terdaftar di Program Afiliator Linguo. Hubungi tim Linguo kalau kamu ingin bergabung."
          />
        )}

        {!showSkeleton && session && !error && aff && (
          <Dashboard
            aff={aff}
            stats={data!.stats!}
            conversions={data!.conversions ?? []}
            refLink={refLink}
            waUrl={waUrl}
            copied={copied}
            onCopy={copyLink}
          />
        )}
      </div>
    </div>
  );
}

// ── Login (inline) ─────────────────────────────────────────────────────────
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
    // on success the browser redirects to Google
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
    // on success: parent's onAuthStateChange takes over and renders the dashboard
  }

  return (
    <div className="mx-auto max-w-sm">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Branded header */}
        <div className="bg-gradient-to-br from-[#1A9E9E] to-[#147878] px-6 py-7 text-center text-white">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
            <Wallet className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold">Dashboard Afiliator</h2>
          <p className="mt-1 text-sm text-white/75">
            Masuk untuk lihat komisi &amp; link referral kamu
          </p>
        </div>

        {/* Form */}
        <div className="px-6 py-6">
          <button
            onClick={loginGoogle}
            disabled={googleBusy || busy}
            className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border-2 border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
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

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-2 text-xs uppercase tracking-wide text-slate-400">
                atau
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loginEmail()}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#1A9E9E]"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loginEmail()}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#1A9E9E]"
            />

            {err && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
                {err}
              </p>
            )}

            <button
              onClick={loginEmail}
              disabled={busy || googleBusy || !email || !password}
              className="flex h-11 w-full items-center justify-center rounded-xl bg-[#1A9E9E] text-sm font-semibold text-white transition hover:bg-[#147878] disabled:opacity-50"
            >
              {busy ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                "Masuk"
              )}
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-slate-400">
            Gunakan email yang terdaftar sebagai afiliator Linguo.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────
function Dashboard({
  aff,
  stats,
  conversions,
  refLink,
  waUrl,
  copied,
  onCopy,
}: {
  aff: NonNullable<ApiResponse["affiliate"]>;
  stats: NonNullable<ApiResponse["stats"]>;
  conversions: Conversion[];
  refLink: string;
  waUrl: string;
  copied: boolean;
  onCopy: () => void;
}) {
  const totalKomisi =
    stats.commission_pending + stats.commission_approved + stats.commission_paid;

  return (
    <div className="space-y-5">
      {/* Status notice if not active */}
      {aff.status !== "active" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Status akun afiliator kamu:{" "}
          <b>
            {aff.status === "pending_review"
              ? "menunggu review"
              : aff.status}
          </b>
          . Komisi tetap tercatat, tapi pencairan baru bisa setelah akun aktif.
        </div>
      )}

      {/* Referral hero */}
      <div className="rounded-2xl bg-gradient-to-br from-[#1A9E9E] to-[#147878] p-5 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-white/70">
            Kode Referral
          </span>
          <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold">
            Tier {TIER_LABEL[aff.tier] ?? aff.tier}
          </span>
        </div>
        <div className="mt-1 font-mono text-3xl font-bold tracking-[0.15em]">
          {aff.referral_code}
        </div>

        <div className="mt-4 break-all rounded-lg bg-white/10 px-3 py-2 text-sm text-white/90">
          {refLink}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={onCopy}
            className="flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-2.5 text-sm font-semibold text-[#147878] transition hover:bg-white/90"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Tersalin" : "Salin Link"}
          </button>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            <Share2 className="h-4 w-4" />
            Share WhatsApp
          </a>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<MousePointerClick className="h-4 w-4" />}
          label="Klik"
          value={String(stats.clicks)}
        />
        <StatCard
          icon={<ShoppingBag className="h-4 w-4" />}
          label="Konversi"
          value={String(stats.conversions_total)}
        />
        <StatCard
          icon={<Wallet className="h-4 w-4" />}
          label="Total Komisi"
          value={rupiah(totalKomisi)}
          small
        />
      </div>

      {/* Commission breakdown */}
      <div className="grid grid-cols-3 gap-2">
        <KomisiPill
          label="Menunggu"
          amount={stats.commission_pending}
          cls="text-amber-700"
        />
        <KomisiPill
          label="Disetujui"
          amount={stats.commission_approved}
          cls="text-blue-700"
        />
        <KomisiPill
          label="Dibayar"
          amount={stats.commission_paid}
          cls="text-emerald-700"
        />
      </div>

      {/* Conversions */}
      <div>
        <h2 className="mb-2 text-sm font-bold text-slate-700">
          Riwayat Konversi
        </h2>
        {conversions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
            Belum ada konversi. Sebarkan link referral kamu untuk mulai dapat
            komisi.
          </div>
        ) : (
          <div className="space-y-2">
            {conversions.map((c) => {
              const st = STATUS_STYLE[c.status] ?? {
                label: c.status,
                cls: "bg-slate-50 text-slate-600 border-slate-200",
              };
              return (
                <div
                  key={c.id}
                  className="rounded-xl border border-slate-200 bg-white p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-800">
                        {PRODUCT_LABEL[c.product] ?? c.product}
                        {c.language ? ` · ${c.language}` : ""}
                        {c.level ? ` ${c.level}` : ""}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {fmtDate(c.created_at)}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${st.cls}`}
                    >
                      {st.label}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-sm">
                    <span className="text-slate-500">Komisi</span>
                    <span className="font-bold text-[#147878]">
                      {rupiah(c.commission_amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="pt-2 text-center text-xs text-slate-400">
        Komisi disetujui otomatis 14 hari setelah pembayaran. Pencairan tiap
        tanggal 25, minimal Rp 100.000.
      </p>
    </div>
  );
}

// ── Small components ───────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  small,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-1.5 text-slate-400">
        {icon}
        <span className="text-[11px] font-medium">{label}</span>
      </div>
      <div
        className={`mt-1 font-bold text-slate-800 ${
          small ? "text-base" : "text-xl"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function KomisiPill({
  label,
  amount,
  cls,
}: {
  label: string;
  amount: number;
  cls: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-center">
      <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className={`mt-0.5 text-xs font-bold ${cls}`}>{rupiah(amount)}</div>
    </div>
  );
}

function SkeletonBlock() {
  return (
    <div className="space-y-4">
      <div className="h-44 animate-pulse rounded-2xl bg-slate-200" />
      <div className="grid grid-cols-3 gap-3">
        <div className="h-20 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-20 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-20 animate-pulse rounded-xl bg-slate-200" />
      </div>
      <div className="h-32 animate-pulse rounded-xl bg-slate-200" />
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
    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
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
