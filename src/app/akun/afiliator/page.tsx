"use client";

// ============================================================================
// /akun/afiliator — Affiliate Dashboard (minimal)
// Affiliate Program — Phase 2A
// ----------------------------------------------------------------------------
// Reads /api/affiliate/me (service-role). See that route for the RLS gotcha
// (migrated affiliates have user_id = NULL). Charts + promo materials are
// deferred to Phase 2C.
// ============================================================================

import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase-client";
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
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        if (!cancelled) {
          setAuthed(false);
          setLoading(false);
        }
        return;
      }
      if (!cancelled) setAuthed(true);

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
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

        {loading && <SkeletonBlock />}

        {!loading && authed === false && (
          <CenteredCard
            title="Login dulu yuk"
            desc="Kamu perlu masuk ke akun Linguo dulu buat lihat dashboard afiliator."
            actionLabel="Ke Halaman Akun"
            actionHref="/akun"
          />
        )}

        {!loading && authed && error && (
          <CenteredCard title="Ada kendala" desc={error} />
        )}

        {!loading && authed && !error && !aff && (
          <CenteredCard
            title="Kamu belum jadi afiliator"
            desc="Akun ini belum terdaftar di Program Afiliator Linguo. Hubungi tim Linguo kalau kamu ingin bergabung."
          />
        )}

        {!loading && authed && !error && aff && (
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
