"use client";

// [kelas-detail-page-v1] Route detail kelas → /akun/kelas/[id]?tab=<overview|jadwal|...>.
// Pengganti ClassDetailModal (popup di beranda): konten 5 tab + flow reschedule/cancel
// kelewat berat buat modal. Reuse StudentShell (rail + panel) yang sama dengan /akun,
// pola persis /akun/perpustakaan. Rail nav → balik ke /akun?menu=<tab>.

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import StudentShell, { type AkunTab } from "@/components/akun/StudentShell";
import ClassDetailView from "@/components/akun/ClassDetailView";

function KelasDetailInner() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [reg, setReg] = useState<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email;
      if (!email) {
        // belum login → dashboard (yang nampung UI login)
        router.replace("/akun");
        return;
      }

      // Verifikasi kepemilikan: registration harus milik student dgn email login ini.
      const [{ data: student }, { data: regData }] = await Promise.all([
        supabase.from("students").select("id").eq("email", email).maybeSingle(),
        supabase
          .from("registrations")
          .select(`
            id, student_id, product, language, level, status,
            sessions_total, sessions_used,
            duration, total_amount, payment_status,
            teacher_id, archived_at,
            teachers(name, title, avatar_url)
          `)
          .eq("id", params.id)
          .maybeSingle(),
      ]);
      if (!alive) return;

      if (!regData || !student || regData.student_id !== student.id) {
        router.replace("/akun");
        return;
      }
      setReg(regData);
      setReady(true);
    })();
    return () => { alive = false; };
  }, [params.id, router]);

  const goTab = (t: AkunTab) => router.push(`/akun?menu=${t}`);

  return (
    <StudentShell active="beranda" onTabChange={goTab}>
      {ready && reg ? (
        <ClassDetailView reg={reg} initialTab={searchParams.get("tab")} />
      ) : (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-7 w-7 animate-spin text-slate-300" />
        </div>
      )}
    </StudentShell>
  );
}

export default function KelasDetailPage() {
  // useSearchParams wajib dibungkus Suspense di App Router (CSR bailout saat build).
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#EEF1F4]">
          <Loader2 className="h-7 w-7 animate-spin text-slate-300" />
        </div>
      }
    >
      <KelasDetailInner />
    </Suspense>
  );
}
