"use client";

// [lingbook-phase1-v1] Route library Lingbook → /akun/lingbook.
// Reuse StudentShell (rail + panel) yang sama dengan /akun.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { canAccessLingbook } from "@/lib/materiGate"; // [dev-gate-lingbook-v1]
import StudentShell, { type AkunTab } from "@/components/akun/StudentShell";
import BookLibrary from "@/components/lingbook/BookLibrary";

export default function LingbookLibraryPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!alive) return;
      if (!session?.user?.id) {
        router.replace("/akun");
        return;
      }
      // [dev-gate-lingbook-v1] Lingbook masih development → non-allowlist dilempar balik
      if (!canAccessLingbook(session.user.email)) {
        router.replace("/akun");
        return;
      }
      setReady(true);
    });
    return () => { alive = false; };
  }, [router]);

  const goTab = (t: AkunTab) => {
    router.push(`/akun?menu=${t}`);
  };

  return (
    <StudentShell active={"lingbook" as AkunTab} onTabChange={goTab}>
      <main className="mx-auto w-full max-w-[1200px] px-5 pb-16 pt-6 sm:px-8 lg:py-9">
        {ready ? (
          <BookLibrary />
        ) : (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-7 w-7 animate-spin text-slate-300" />
          </div>
        )}
      </main>
    </StudentShell>
  );
}
