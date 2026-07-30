"use client";

// [student-group-chat-v1] Route "Grup Kelas" siswa → /akun/grup.
// Reuse StudentShell (rail + panel) yang sama dengan /akun; rail nav → /akun?menu=<tab>.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import StudentShell, { type AkunTab } from "@/components/akun/StudentShell";
import StudentGroupChat from "@/components/akun/StudentGroupChat";

export default function GrupKelasPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!alive) return;
      if (!session?.user?.id) {
        // belum login → arahkan ke dashboard (yang nampung UI login)
        router.replace("/akun");
        return;
      }
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, [router]);

  const goTab = (t: AkunTab) => {
    router.push(`/akun?menu=${t}`);
  };

  return (
    <StudentShell active="grup" onTabChange={goTab}>
      <main className="mx-auto w-full max-w-[1200px] px-5 pb-16 pt-6 sm:px-8 lg:py-9">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Grup Kelas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Ngobrol dengan pengajarmu di grup WhatsApp kelas — tanpa keluar dari dashboard.
          </p>
        </div>
        {ready ? (
          <StudentGroupChat />
        ) : (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-7 w-7 animate-spin text-gray-300" />
          </div>
        )}
      </main>
    </StudentShell>
  );
}
