"use client";

// [linguo-patch:pustaka-page-v1] Route khusus "Perpustakaan Saya" → /akun/perpustakaan.
// Reuse StudentShell (rail + panel) yang sama dengan /akun. Rail nav → balik ke /akun?menu=<tab>.

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase, resolveSessionForGate, peekSessionUser } from "@/lib/supabase-client"; // [auth-gate-resilient-v1] [perf:pustaka-peek-gate-v1]
import StudentShell, { type AkunTab } from "@/components/akun/StudentShell";
import LibraryView from "@/components/akun/LibraryView";

function PerpustakaanInner() {
  const router = useRouter();
  // [preview-session-v1] POV siswa (staf) tak punya sesi login — dulu halaman ini
  // langsung memantul ke /akun, jadi menu "Perpustakaan" terasa mati waktu preview.
  const previewId = useSearchParams().get("preview");
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (previewId) { setReady(true); return; }
    let alive = true;
    /* [perf:pustaka-peek-gate-v1] Identitas dari COOKIE sesi dibaca duluan (sinkron,
       tanpa jaringan) → isi halaman langsung tampil. Dulu tiap buka Perpustakaan
       selalu kena spinner dulu sepanjang resolveSessionForGate() menunggu jawaban
       Auth, padahal 99% kasusnya sesi memang ada. Vonis sebenarnya tetap dihitung
       di bawah: kalau ternyata tak ada sesi, halaman tetap memantul ke /akun. */
    const peek = peekSessionUser();
    if (peek?.id) { setUserId(peek.id); setReady(true); }
    // [auth-gate-resilient-v1] getSession() polos bisa menjawab null sesaat (hard
    // refresh + token tukar, antrean Web Locks lintas-tab) → dulu itu langsung jadi
    // pantulan ke layar masuk alias "keluar akun sendiri". resolveSessionForGate()
    // baru menyerah kalau Auth server memang menolak tokennya.
    resolveSessionForGate().then((v) => {
      if (!alive) return;
      const uid = v.user?.id ?? null;
      if (!uid) {
        // belum login → arahkan ke dashboard (yang nampung UI login)
        router.replace("/akun");
        return;
      }
      if (uid === peek?.id) return; // vonis sama dgn tebakan cookie → jangan render ulang
      setUserId(uid);
      setReady(true);
    });
    return () => { alive = false; };
  }, [router, previewId]);

  // [perf:sidebar-nav-v1] router.push (client-side) — dulu window.location.href = full reload tiap balik ke tab lain
  const goTab = (t: AkunTab) => {
    if (t === "pustaka") return;
    router.push(`/akun?menu=${t}${previewId ? `&preview=${encodeURIComponent(previewId)}` : ""}`);
  };

  return (
    <StudentShell active="pustaka" onTabChange={goTab} previewStudentId={previewId}>
      <main className="mx-auto w-full max-w-[1560px] px-5 pb-16 pt-6 sm:px-8 lg:py-9">
        {previewId && (
          <div className="mb-4 rounded-xl bg-[#12172B] px-4 py-2 text-center text-[12px] font-bold text-amber-300">
            Preview POV Siswa — data real, read-only (tanpa login)
          </div>
        )}
        {ready && (userId || previewId) ? (
          <LibraryView userId={userId ?? ""} supabase={supabase} previewStudentId={previewId} />
        ) : (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-7 w-7 animate-spin text-slate-300" />
          </div>
        )}
      </main>
    </StudentShell>
  );
}

export default function PerpustakaanPage() {
  // useSearchParams butuh Suspense boundary di App Router (build error kalau tidak).
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-slate-300" /></div>}>
      <PerpustakaanInner />
    </Suspense>
  );
}
