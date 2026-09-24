"use client";

// [saldo-siswa-v1] Saldo Linguo — saldo mengendap milik siswa (Pengaturan › Tagihan & Paket).
// Buku besarnya tabel `student_wallet_entries` (RLS: baris milik email sesi);
// saldo = jumlah baris 'success'. Masuk dari top up Xendit (/api/saldo/topup),
// refund yang dijadikan saldo, atau penyesuaian admin; keluar lewat rpc
// `wallet_bayar_registrasi` (tombol "Bayar pakai Saldo" di tagihan).

import { useCallback, useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Clock, Loader2, Plus, Wallet, X } from "lucide-react";
import { useT } from "@/lib/uiLang";

export interface SaldoEntry {
  id: string;
  amount: number;
  kind: "topup" | "payment" | "refund" | "deposit" | "adjustment";
  status: "pending" | "success" | "cancelled";
  note: string | null;
  created_at: string;
}

const fmtRp = (n: number) => "Rp " + Math.round(Math.abs(n || 0)).toLocaleString("id-ID");
const fmtTgl = (d: string) =>
  new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

const LABEL: Record<SaldoEntry["kind"], string> = {
  topup: "Top up",
  payment: "Pembayaran",
  refund: "Refund jadi saldo",
  deposit: "Deposit kelas jadi saldo",
  adjustment: "Penyesuaian admin",
};

/** Saldo + riwayat milik sesi. `reload` dipanggil sesudah bayar pakai saldo. */
export function useSaldoLinguo(supabase: any, enabled: boolean) {
  const [entries, setEntries] = useState<SaldoEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const reload = useCallback(async () => {
    const { data, error } = await supabase
      .from("student_wallet_entries")
      .select("id, amount, kind, status, note, created_at")
      .neq("status", "cancelled")
      .order("created_at", { ascending: false })
      .limit(500);
    // Invoice Xendit berumur 24 jam; top up pending yang lebih tua = tak dibayar.
    const basi = Date.now() - 25 * 3600 * 1000;
    if (!error) setEntries((data || [])
      .map((e: any) => ({ ...e, amount: Number(e.amount) || 0 }))
      .filter((e: SaldoEntry) => e.status !== "pending" || new Date(e.created_at).getTime() > basi));
    setLoaded(true);
  }, [supabase]);
  useEffect(() => { if (enabled) reload(); }, [enabled, reload]);
  const saldo = entries.filter((e) => e.status === "success").reduce((a, e) => a + e.amount, 0);
  return { saldo, entries, loaded, reload };
}

export async function mulaiTopup(supabase: any, amount: number): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch("/api/saldo/topup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken: session?.access_token ?? "", amount }),
  });
  const j = await res.json().catch(() => ({}));
  if (j?.ok && j.invoice_url) return j.invoice_url as string;
  throw new Error(j?.error || "Gagal membuat invoice top up.");
}

const PRESET = [100_000, 250_000, 500_000, 1_000_000];

export function TopupDialog({ supabase, open, onClose, awal }: {
  supabase: any; open: boolean; onClose: () => void; awal?: number;
}) {
  const ts = useT();
  const [nominal, setNominal] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => {
    if (open) { setNominal(awal && awal > 0 ? String(Math.ceil(awal)) : ""); setErr(""); }
  }, [open, awal]);
  if (!open) return null;
  const angka = Number(nominal.replace(/\D/g, "")) || 0;
  const kirim = async () => {
    if (angka < 10_000) { setErr(ts("Minimal top up Rp 10.000")); return; }
    setBusy(true); setErr("");
    try {
      const url = await mulaiTopup(supabase, angka);
      if (url) window.location.href = url;
    } catch (e: any) {
      setErr(e?.message || ts("Gagal membuat invoice top up."));
      setBusy(false);
    }
  };
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={() => !busy && onClose()}>
      <div className="w-full max-w-md rounded-t-3xl bg-white p-6 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[18px] font-extrabold text-[#12172B]">{ts("Top up Saldo Linguo")}</h3>
            <p className="mt-1 text-[12px] font-medium text-[#6B7280]">{ts("Bayar via QRIS, VA, e-wallet, atau kartu. Saldo masuk otomatis setelah pembayaran berhasil.")}</p>
          </div>
          <button onClick={onClose} disabled={busy} aria-label="Tutup" className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          {PRESET.map((p) => (
            <button key={p} type="button" onClick={() => setNominal(String(p))}
              className="h-11 rounded-xl border text-[14px] font-bold transition"
              style={angka === p ? { borderColor: "#16796E", background: "#E8F4F2", color: "#16796E" } : { borderColor: "#E2E8F0", color: "#12172B" }}>
              {fmtRp(p)}
            </button>
          ))}
        </div>
        <label className="mt-4 block text-[13px] font-bold text-[#12172B]">{ts("Nominal lain")}</label>
        <div className="mt-1.5 flex h-12 items-center gap-2 rounded-xl border border-slate-200 px-4 focus-within:border-slate-300">
          <span className="text-[14px] font-bold text-[#6B7280]">Rp</span>
          <input inputMode="numeric" value={angka ? angka.toLocaleString("id-ID") : ""} placeholder="0"
            onChange={(e) => setNominal(e.target.value.replace(/\D/g, ""))}
            className="w-full bg-transparent text-[15px] font-bold outline-none placeholder:text-slate-400" />
        </div>
        {err ? <p className="mt-2 text-[12px] font-semibold text-rose-600">{err}</p> : null}
        <button onClick={kirim} disabled={busy || angka < 10_000}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-extrabold text-white transition hover:bg-[#0F5A52] disabled:opacity-50" style={{ background: "#16796E" }}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {busy ? ts("Membuat invoice…") : `${ts("Top up")} ${angka ? fmtRp(angka) : ""}`}
        </button>
      </div>
    </div>
  );
}

export default function SaldoLinguoCard({ saldo, entries, loaded, onTopup }: {
  saldo: number; entries: SaldoEntry[]; loaded: boolean; onTopup: () => void;
}) {
  const ts = useT();
  const [semua, setSemua] = useState(false);
  const tampil = semua ? entries : entries.slice(0, 5);
  return (
    <section className="overflow-hidden rounded-3xl bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 p-6" style={{ background: "linear-gradient(135deg,#12172B,#1F2A4A)" }}>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#F2CB05]"><Wallet className="h-5 w-5" /></span>
          <div>
            <p className="text-[12px] font-bold uppercase tracking-wide text-white/60">{ts("Saldo Linguo")}</p>
            <p className="text-[26px] font-extrabold leading-tight text-white">{loaded ? fmtRp(saldo) : "…"}</p>
          </div>
        </div>
        <button onClick={onTopup} className="flex h-11 items-center gap-2 rounded-xl px-5 text-[14px] font-extrabold text-[#12172B] transition hover:brightness-95" style={{ background: "#F2CB05" }}>
          <Plus className="h-4 w-4" /> {ts("Top up")}
        </button>
      </div>
      <div className="px-6 pb-5 pt-4">
        <p className="text-[12px] font-medium text-[#6B7280]">
          {ts("Saldo bisa dipakai membayar tagihan kelas (tombol \"Bayar pakai Saldo\"). Refund juga bisa dijadikan saldo — tinggal minta ke admin.")}
        </p>
        {loaded && entries.length > 0 ? (
          <div className="mt-3 flex flex-col">
            {tampil.map((e) => {
              const masuk = e.amount > 0;
              return (
                <div key={e.id} className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 last:border-0">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${e.status === "pending" ? "bg-amber-50 text-amber-500" : masuk ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                      {e.status === "pending" ? <Clock className="h-4 w-4" /> : masuk ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-bold text-[#12172B]">{e.kind === "topup" || e.kind === "refund" || e.kind === "deposit" ? ts(LABEL[e.kind]) : e.note || ts(LABEL[e.kind])}</p>
                      <p className="text-[12px] font-medium text-[#6B7280]">{e.status === "pending" ? ts("Menunggu pembayaran") : fmtTgl(e.created_at)}{e.kind === "adjustment" ? ` · ${ts("admin")}` : ""}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 text-[14px] font-extrabold ${e.status === "pending" ? "text-slate-400" : masuk ? "text-emerald-600" : "text-[#12172B]"}`}>
                    {masuk ? "+" : "−"}{fmtRp(e.amount)}
                  </span>
                </div>
              );
            })}
            {entries.length > 5 ? (
              <button onClick={() => setSemua((v) => !v)} className="mt-2 self-start text-[13px] font-bold text-[#16796E] hover:underline">
                {semua ? ts("Tampilkan lebih sedikit") : `${ts("Lihat semua")} (${entries.length})`}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
