"use client";
/* [boot-splash-v1] Pemuat yang ikut MENAHAN tirai muat-ulang (src/lib/bootSplash.ts).
   - <BootLoader/>  : pemuat layar penuh (spinner Lottie di atas gradasi teal) —
                      pengganti markup lama di /akun (authLoading/dataLoading) dan
                      fallback Suspense subhalaman.
   - <BootHold/>    : pembungkus transparan untuk pemuat DI DALAM shell (Loader2 di
                      kanvas Perpustakaan/Grup/Kelas) — tirai baru dibuka setelah
                      halaman itu benar-benar siap, bukan saat spinnernya terpaint. */
import type { ReactNode } from "react";
import { Spinner } from "@/components/Spinner";
import { useBootHold } from "@/lib/bootSplash";

export default function BootLoader({ size = 160 }: { size?: number }) {
  useBootHold();
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center">
      <Spinner size={size} />
    </div>
  );
}

export function BootHold({ children }: { children: ReactNode }) {
  useBootHold();
  return <>{children}</>;
}
