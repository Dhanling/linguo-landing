"use client";

// [kelas-detail-page-v1] Route detail kelas → /akun/kelas/[id]?tab=<overview|jadwal|...>.
// Pengganti ClassDetailModal (popup di beranda): konten 5 tab + flow reschedule/cancel
// kelewat berat buat modal. Reuse StudentShell (rail + panel) yang sama dengan /akun,
// pola persis /akun/perpustakaan. Rail nav → balik ke /akun?menu=<tab>.
//
// [kelas-detail-resilient-v1] Anti "diklik malah balik ke beranda":
//   • Card beranda menitipkan data reg via sessionStorage → render INSTAN tanpa
//     nunggu query (klik dari beranda tak mungkin gagal karena jaringan/RLS/token).
//   • Query verifikasi dibedakan ERROR vs BUKAN-PEMILIK: error transien (401 saat
//     token lagi di-refresh, jaringan kedip) di-retry sekali lalu tampil UI
//     "Coba Lagi" — JANGAN lempar user ke beranda; redirect hanya kalau query
//     sukses tapi reg terbukti bukan miliknya / tidak ada.

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import StudentShell, { type AkunTab } from "@/components/akun/StudentShell";
import ClassDetailView from "@/components/akun/ClassDetailView";

// Kunci handoff dari card beranda (lihat onClick Link card di /akun page.tsx).
// (Bukan export — page App Router hanya boleh export default + route config.)
const regHandoffKey = (id: string) => `linguo_reg_${id}`;

function KelasDetailInner() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [reg, setReg] = useState<any>(null);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0); // tombol "Coba Lagi" → jalankan ulang effect

  useEffect(() => {
    let alive = true;
    (async () => {
      // 0) Handoff dari beranda: card sudah punya data reg lengkap → tampil duluan.
      //    Query di bawah tetap jalan sebagai verifikasi + penyegar di background.
      let handoff: any = null;
      try {
        handoff = JSON.parse(sessionStorage.getItem(regHandoffKey(params.id)) || "null");
      } catch {}
      if (handoff && handoff.id === params.id && alive) setReg(handoff);

      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email;
      if (!email) {
        // belum login → dashboard (yang nampung UI login). Kalau ada handoff
        // (baru saja klik dari beranda, sesi kemungkinan cuma telat pulih) biarkan
        // konten tampil — data lanjutan toh tetap dijaga RLS.
        if (!handoff) router.replace("/akun");
        return;
      }

      // Verifikasi kepemilikan: registration harus milik student dgn email login ini.
      const load = () =>
        Promise.all([
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

      let [sRes, rRes] = await load();
      // Retry sekali: error paling sering transien (token habis pas di-refresh,
      // jaringan kedip) — kasih napas sebentar lalu ulang.
      if ((sRes.error || rRes.error) && alive) {
        await new Promise((r) => setTimeout(r, 1200));
        if (!alive) return;
        [sRes, rRes] = await load();
      }
      if (!alive) return;

      if (sRes.error || rRes.error) {
        console.warn(
          "[kelas-detail] query verifikasi gagal:",
          sRes.error?.message || "-",
          rRes.error?.message || "-"
        );
        // Ada handoff → sudah tampil, biarkan. Tanpa handoff → UI retry, bukan redirect.
        if (!handoff) setLoadError(true);
        return;
      }

      const student = sRes.data;
      const regData = rRes.data;
      if (!regData || !student || regData.student_id !== student.id) {
        // Query SUKSES tapi reg tak terlihat/bukan miliknya. Kalau user baru saja
        // klik card miliknya di beranda (handoff ada), jangan usir — tampilkan
        // data handoff & catat buat debug (kemungkinan besar RLS/data lagi aneh).
        if (handoff) {
          console.warn("[kelas-detail] verifikasi kepemilikan tidak lolos, pakai data handoff beranda", {
            regFound: !!regData,
            studentFound: !!student,
          });
          return;
        }
        router.replace("/akun");
        return;
      }

      setReg(regData);
      try {
        sessionStorage.setItem(regHandoffKey(params.id), JSON.stringify(regData));
      } catch {}
    })();
    return () => { alive = false; };
  }, [params.id, router, attempt]);

  const goTab = (t: AkunTab) => router.push(`/akun?menu=${t}`);

  return (
    <StudentShell active="beranda" onTabChange={goTab}>
      {reg ? (
        <ClassDetailView reg={reg} initialTab={searchParams.get("tab")} />
      ) : loadError ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <div className="text-[15px] font-semibold text-slate-700">Gagal memuat detail kelas</div>
          <div className="max-w-xs text-[13px] text-slate-500">
            Koneksi atau sesi lagi bermasalah. Coba muat ulang — kalau masih gagal, balik ke beranda dulu ya.
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setLoadError(false); setAttempt((n) => n + 1); }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#16796E] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0F5A52]"
            >
              <RefreshCw className="h-4 w-4" strokeWidth={2.5} /> Coba Lagi
            </button>
            <button
              onClick={() => router.push("/akun")}
              className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-200"
            >
              Ke Beranda
            </button>
          </div>
        </div>
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
