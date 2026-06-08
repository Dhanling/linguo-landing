"use client";

// ============================================================================
// RekeningForm — Affiliate payout bank-account form
// Affiliate Program — Phase 3B + searchable bank picker
// linguo-patch:afiliator-bank-dropdown-v1
// linguo-patch:afiliator-bank-search-v1
// ----------------------------------------------------------------------------
// Bank dipilih lewat modal full-screen (di-portal ke <body>) yang punya kotak
// SEARCH. Backdrop gelap + blur nutup SELURUH layar (bukan cuma kartu), karena
// modal-nya pakai createPortal langsung ke document.body.
//
// Daftar bank live dari /api/affiliate/payout-channels (fallback ke daftar bank
// besar kalau API gagal/kosong). channel_code yang kesimpen = yang Xendit dukung.
// ============================================================================

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Wallet, Check, ChevronDown, Search, X } from "lucide-react";
import { supabase } from "@/lib/supabase-client";

type Aff = {
  bank_name: string | null;
  bank_account_no: string | null;
  bank_account_name: string | null;
  bank_code?: string | null;
};

type BankChannel = { code: string; name: string };

// Fallback daftar bank besar (dipakai HANYA kalau /payout-channels gagal/kosong).
// Kode mengikuti channel_code Xendit untuk Indonesia (prefix ID_).
const FALLBACK_BANKS: BankChannel[] = [
  { code: "ID_BCA", name: "BCA" },
  { code: "ID_MANDIRI", name: "Mandiri" },
  { code: "ID_BNI", name: "BNI" },
  { code: "ID_BRI", name: "BRI" },
  { code: "ID_BTN", name: "BTN" },
  { code: "ID_CIMB", name: "CIMB Niaga" },
  { code: "ID_PERMATA", name: "Permata" },
  { code: "ID_DANAMON", name: "Danamon" },
  { code: "ID_BSI", name: "Bank Syariah Indonesia (BSI)" },
  { code: "ID_JAGO", name: "Bank Jago" },
];

export default function RekeningForm({ aff }: { aff: Aff }) {
  const [banks, setBanks] = useState<BankChannel[]>(FALLBACK_BANKS);
  const [bankCode, setBankCode] = useState(aff.bank_code ?? "");
  const [accountNo, setAccountNo] = useState(aff.bank_account_no ?? "");
  const [accountName, setAccountName] = useState(aff.bank_account_name ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- state modal picker ---
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const hasBank = Boolean(
    aff.bank_code && aff.bank_account_no && aff.bank_account_name
  );

  // Ambil daftar bank yang didukung Xendit (live).
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/affiliate/payout-channels");
        if (!res.ok) return;
        const json = await res.json().catch(() => null);
        const list: BankChannel[] = Array.isArray(json?.banks) ? json.banks : [];
        if (alive && list.length) {
          // Bank yang udah kesimpen tetep ada di daftar walau API ga balikin.
          const merged = [...list];
          if (aff.bank_code && !merged.some((b) => b.code === aff.bank_code)) {
            merged.unshift({
              code: aff.bank_code,
              name: aff.bank_name || aff.bank_code,
            });
          }
          setBanks(merged);
        }
      } catch {
        /* biarin pakai fallback */
      }
    })();
    return () => {
      alive = false;
    };
  }, [aff.bank_code, aff.bank_name]);

  // Lock scroll + tutup pakai ESC selama modal kebuka.
  useEffect(() => {
    if (!pickerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPickerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [pickerOpen]);

  const selectedName = useMemo(() => {
    const found = banks.find((b) => b.code === bankCode)?.name;
    if (found) return found;
    return bankCode ? aff.bank_name || bankCode : "";
  }, [banks, bankCode, aff.bank_name]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return banks;
    return banks.filter(
      (b) =>
        b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q)
    );
  }, [banks, query]);

  function openPicker() {
    setQuery("");
    setPickerOpen(true);
  }

  function chooseBank(code: string) {
    setBankCode(code);
    setPickerOpen(false);
    setQuery("");
  }

  async function save() {
    setError(null);
    if (!bankCode) {
      setError("Pilih bank dari daftar.");
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
    const bankName =
      banks.find((b) => b.code === bankCode)?.name || aff.bank_name || bankCode;
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
          bank_code: bankCode,
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

        {/* === Pemilih bank: tombol yang buka modal search === */}
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-600">
            Bank
          </span>
          <button
            type="button"
            onClick={openPicker}
            className={`${inputCls} flex items-center justify-between text-left ${
              selectedName ? "text-slate-800" : "text-slate-400"
            }`}
          >
            <span className="truncate">{selectedName || "Pilih bank…"}</span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
          </button>
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

      {/* === MODAL PILIH BANK (portal ke <body> -> blur full-screen) === */}
      {mounted &&
        pickerOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
            role="dialog"
            aria-modal="true"
          >
            {/* backdrop gelap + blur, nutup seluruh layar */}
            <div
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setPickerOpen(false)}
            />

            {/* kartu modal */}
            <div className="relative z-10 flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <h3 className="text-sm font-bold text-slate-700">Pilih Bank</h3>
                <button
                  type="button"
                  onClick={() => setPickerOpen(false)}
                  className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Tutup"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="border-b border-slate-100 p-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    autoFocus
                    className={`${inputCls} pl-9`}
                    placeholder="Cari bank… (mis. Jago, BCA)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto py-1">
                {filtered.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-slate-400">
                    Bank “{query}” tidak ditemukan.
                  </p>
                ) : (
                  filtered.map((b) => {
                    const active = b.code === bankCode;
                    return (
                      <button
                        key={b.code}
                        type="button"
                        onClick={() => chooseBank(b.code)}
                        className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition hover:bg-slate-50 ${
                          active
                            ? "font-semibold text-[#1A9E9E]"
                            : "text-slate-700"
                        }`}
                      >
                        <span className="truncate">{b.name}</span>
                        {active && (
                          <Check className="ml-2 h-4 w-4 shrink-0 text-[#1A9E9E]" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
