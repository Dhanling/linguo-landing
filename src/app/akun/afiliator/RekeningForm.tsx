"use client";

// ============================================================================
// RekeningForm — Affiliate payout bank-account form
// Affiliate Program — Phase 3B (B1)
// ----------------------------------------------------------------------------
// Rendered inside the /akun/afiliator dashboard. Lets an affiliate save the
// bank account their commission is paid out to. Saves via POST
// /api/affiliate/bank (service-role update on affiliates.bank_*).
// ============================================================================

import { useState } from "react";
import { Wallet, Check } from "lucide-react";
import { supabase } from "@/lib/supabase-client";

type Aff = {
  bank_name: string | null;
  bank_account_no: string | null;
  bank_account_name: string | null;
};

export default function RekeningForm({ aff }: { aff: Aff }) {
  const [bankName, setBankName] = useState(aff.bank_name ?? "");
  const [accountNo, setAccountNo] = useState(aff.bank_account_no ?? "");
  const [accountName, setAccountName] = useState(aff.bank_account_name ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasBank = Boolean(
    aff.bank_name && aff.bank_account_no && aff.bank_account_name
  );

  async function save() {
    setError(null);
    if (bankName.trim().length < 2) {
      setError("Nama bank wajib diisi.");
      return;
    }
    if (!/^\d{6,20}$/.test(accountNo.replace(/[\s-]/g, ""))) {
      setError("Nomor rekening tidak valid (6-20 digit angka).");
      return;
    }
    if (accountName.trim().length < 2) {
      setError("Nama pemilik rekening wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError("Sesi habis. Coba refresh halaman.");
        setSaving(false);
        return;
      }
      const res = await fetch("/api/affiliate/bank", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bank_name: bankName,
          bank_account_no: accountNo,
          bank_account_name: accountName,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error || "Gagal menyimpan rekening. Coba lagi.");
        setSaving(false);
        return;
      }
      setSaved(true);
      setSaving(false);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Gagal terhubung ke server. Coba lagi.");
      setSaving(false);
    }
  }

  const inputCls =
    "h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1A9E9E] focus:bg-white focus:ring-2 focus:ring-[#1A9E9E]/20";

  return (
    <div>
      <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-700">
        <Wallet className="h-4 w-4 text-slate-400" />
        Rekening Pencairan
      </h2>
      <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <p className="text-xs leading-relaxed text-slate-500">
          Komisi yang sudah disetujui bisa dicairkan ke rekening ini kapan saja
          (minimal Rp 10.000). Pastikan datanya benar dan atas nama kamu
          sendiri.
        </p>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-600">
            Nama bank
          </span>
          <input
            className={inputCls}
            placeholder="Contoh: BCA, Mandiri, BRI"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-600">
            Nomor rekening
          </span>
          <input
            inputMode="numeric"
            className={inputCls}
            placeholder="Hanya angka"
            value={accountNo}
            onChange={(e) => setAccountNo(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-600">
            Nama pemilik rekening
          </span>
          <input
            className={inputCls}
            placeholder="Sesuai buku tabungan"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
          />
        </label>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
            {error}
          </div>
        )}

        <button
          onClick={save}
          disabled={saving}
          className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-60 ${
            saved ? "bg-emerald-500" : "bg-[#1A9E9E] hover:bg-[#147878]"
          }`}
        >
          {saving ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : saved ? (
            <>
              <Check className="h-4 w-4" />
              Tersimpan
            </>
          ) : hasBank ? (
            "Perbarui Rekening"
          ) : (
            "Simpan Rekening"
          )}
        </button>
      </div>
    </div>
  );
}
