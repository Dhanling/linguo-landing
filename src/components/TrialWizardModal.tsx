"use client";

// =============================================================================
// TrialWizardModal.tsx
// [linguo-patch:trial-wizard-v1]
// Popup modal global untuk TrialWizard. Di-mount sekali di layout.tsx.
// Tombol mana pun bisa membuka wizard via: window.__openTrialWizard()
// =============================================================================

import { useEffect, useState } from "react";
import TrialWizard from "@/components/TrialWizard";

export default function TrialWizardModal() {
  const [open, setOpen] = useState(false);

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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/60 sm:p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full sm:w-auto sm:max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <TrialWizard onClose={() => setOpen(false)} />
      </div>
    </div>
  );
}
