"use client";

// [tagihan-rapi-v1] Pop-up "Lihat semua" — daftar panjang (paket, riwayat
// tagihan, riwayat saldo) cukup tampil 5 di halaman, sisanya dibuka di sini
// biar Tagihan & Saldo tidak memanjang ke bawah.

import type { ReactNode } from "react";
import { X } from "lucide-react";

export const BATAS_TAMPIL = 5;

export function LihatSemuaButton({ total, onClick, label }: { total: number; onClick: () => void; label: string }) {
  if (total <= BATAS_TAMPIL) return null;
  return (
    <button type="button" onClick={onClick}
      className="mt-3 h-10 w-full rounded-xl bg-[#F5F6F8] text-[13px] font-bold text-[#16796E] transition hover:brightness-95">
      {label} ({total}) →
    </button>
  );
}

export default function LihatSemuaDialog({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <h3 className="text-[17px] font-extrabold text-[#12172B]">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto px-6 py-2">{children}</div>
      </div>
    </div>
  );
}
