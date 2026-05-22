// =============================================================================
// /kelas-trial
// [linguo-patch:trial-wizard-v1]
// Halaman Trial Class — server component (SEO metadata) yang menampilkan
// TrialWizard. Wizard yang sama juga dipakai sebagai popup via TrialWizardModal.
// =============================================================================

import type { Metadata } from "next";
import Link from "next/link";
import TrialWizard from "@/components/TrialWizard";

export const metadata: Metadata = {
  title: "Coba Kelas Trial — Linguo.id",
  description:
    "Daftar Trial Class Linguo: satu sesi Kelas Private atau Kids sebelum lanjut ke paket penuh. Pilih bahasa, durasi, dan jadwal kamu.",
};

export default function KelasTrialPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/60 to-white flex flex-col items-center px-4 py-8 sm:py-14">
      <div className="text-center mb-7 max-w-lg">
        <span
          className="inline-block text-xs font-bold tracking-wide px-3 py-1 rounded-full"
          style={{ background: "#1A9E9E1A", color: "#1A9E9E" }}
        >
          TRIAL CLASS
        </span>
        <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-gray-900">
          Coba Kelas Trial Linguo
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Satu sesi trial sebelum kamu lanjut ke paket penuh. Rasakan dulu
          cara belajar di Linguo bareng pengajar kami.
        </p>
      </div>

      <div className="w-full sm:max-w-lg">
        <TrialWizard />
      </div>

      <Link
        href="/"
        className="mt-6 text-sm text-gray-400 hover:text-gray-600"
      >
        ← Kembali ke beranda
      </Link>
    </div>
  );
}
