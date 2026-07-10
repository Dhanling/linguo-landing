"use client";

// [linguo-patch:pustaka-page-v1] Route khusus "Perpustakaan Saya" → /akun/perpustakaan.
// Reuse StudentShell (rail + panel) yang sama dengan /akun. Rail nav → balik ke /akun?menu=<tab>.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import StudentShell, { type AkunTab } from "@/components/akun/StudentShell";
import LibraryView from "@/components/akun/LibraryView";

export default function PerpustakaanPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!alive) return;
      const uid = session?.user?.id ?? null;
      if (!uid) {
        // belum login → arahkan ke dashboard (yang nampung UI login)
        router.replace("/akun");
        return;
      }
      setUserId(uid);
      setReady(true);
    });
    return () => { alive = false; };
  }, [router]);

  // [perf:sidebar-nav-v1] router.push (client-side) — dulu window.location.href = full reload tiap balik ke tab lain
  const goTab = (t: AkunTab) => {
    if (t === "pustaka") return;
    router.push(`/akun?menu=${t}`);
  };

  return (
    <StudentShell active="pustaka" onTabChange={goTab}>
      <main className="mx-auto w-full max-w-[1200px] px-5 pb-16 pt-6 sm:px-8 lg:py-9">
        {ready && userId ? (
          <LibraryView userId={userId} supabase={supabase} />
        ) : (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-7 w-7 animate-spin text-slate-300" />
          </div>
        )}
      </main>
    </StudentShell>
  );
}
