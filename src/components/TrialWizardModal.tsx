"use client";

// =============================================================================
// TrialWizardModal.tsx
// [linguo-patch:trial-wizard-v1]
// Popup modal global untuk TrialWizard. Di-mount sekali di layout.tsx.
// Tombol mana pun bisa membuka wizard via: window.__openTrialWizard()
//
// linguo-patch:trial-discard-guard-v1 — konfirmasi "Buang perubahan?" saat klik
// di luar area popup / tombol X KALAU form sudah keisi (dirty), biar progres
// pendaftaran ga ilang gara-gara salah klik. Kalau form masih kosong → tutup
// langsung tanpa nanya. Status dirty dilaporin TrialWizard via onDirtyChange.
// =============================================================================

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useOverlayLock } from "@/lib/overlayStore";

// Lazy: the heavy wizard (form + libphonenumber-js + supabase) only downloads
// when the modal is actually opened, not on every page's initial load.
const TrialWizard = dynamic(() => import("@/components/TrialWizard"), { ssr: false });

const TEAL = "#1A9E9E";

export default function TrialWizardModal() {
  const [open, setOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  useEffect(() => {
    (window as any).__openTrialWizard = () => setOpen(true);
    return () => {
      try {
        delete (window as any).__openTrialWizard;
      } catch {
        /* noop */
      }
    };
  }, []);

  // Kunci scroll body saat modal terbuka
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // [ling-hide-fab-overlay-v1] daftarin overlay global → sembunyiin FAB WhatsApp
  useOverlayLock(open);

  // Tutup beneran + reset state guard
  const doClose = () => {
    setConfirmClose(false);
    setDirty(false);
    setOpen(false);
  };

  // Klik luar / X: ada isian → konfirmasi dulu; kosong → tutup langsung
  const requestClose = () => {
    if (dirty) setConfirmClose(true);
    else doClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/60 sm:p-4"
      onClick={requestClose}
    >
      <div
        className="w-full sm:w-auto sm:max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <TrialWizard onClose={requestClose} onDirtyChange={setDirty} />
      </div>

      {/* linguo-patch:trial-discard-guard-v1 — dialog konfirmasi buang perubahan */}
      {confirmClose && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            e.stopPropagation();
            setConfirmClose(false);
          }}
        >
          <div
            className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-gray-900">
              Buang perubahan?
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Progres pendaftaran kamu belum tersimpan dan akan hilang kalau
              keluar sekarang.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setConfirmClose(false)}
                className="w-full rounded-xl px-4 py-3 text-sm font-bold text-white transition-opacity active:scale-95 hover:opacity-90"
                style={{ background: TEAL }}
              >
                Lanjut isi
              </button>
              <button
                type="button"
                onClick={doClose}
                className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
              >
                Buang & keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
