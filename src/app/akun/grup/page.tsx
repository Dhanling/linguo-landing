"use client";

// [student-group-chat-v1] Route "Grup Kelas" siswa → /akun/grup.
// Reuse StudentShell (rail + panel) yang sama dengan /akun; rail nav → /akun?menu=<tab>.
//
// [student-group-gate-v1] Halaman ini CUMA untuk siswa yang punya grup kelas.
// Sebelumnya cukup "ada sesi login" — padahal isinya dibaca langsung dari
// wa_groups yang policy-nya permissive, jadi user yang kebetulan juga pengajar
// atau owner/admin membuka menu siswa dan melihat seluruh grup kelas Linguo.
// Gerbangnya sekarang sama dengan sumber datanya: RPC student_group_list().
//
// [preview-session-v1] ?preview=<student_id> → mode POV siswa untuk staf
// (dibuka dari avatar dashboard admin). Tanpa sesi login; datanya lewat
// /api/preview-group yang dikunci cookie pratinjau, dan read-only.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import StudentShell, { type AkunTab } from "@/components/akun/StudentShell";
import StudentGroupChat from "@/components/akun/StudentGroupChat";

export default function GrupKelasPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const pid =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("preview")
        : null;
    if (pid) {
      setPreviewId(pid);
      fetch(`/api/preview-group?student=${encodeURIComponent(pid)}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          if (!alive) return;
          if (!j) {
            // Cookie pratinjau tak ada/kedaluwarsa → jangan biarkan halaman kosong
            // menggantung; kembalikan ke dashboard yang menjelaskan keadaannya.
            router.replace("/akun");
            return;
          }
          setPreviewName(j.identity?.display_name ?? null);
          setReady(true);
        })
        .catch(() => { if (alive) router.replace("/akun"); });
      return () => { alive = false; };
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!alive) return;
      if (!session?.user?.id) {
        // belum login → arahkan ke dashboard (yang nampung UI login)
        router.replace("/akun");
        return;
      }
      const { data, error } = await supabase.rpc("student_group_list");
      if (!alive) return;
      // Bukan siswa, atau siswa tanpa grup kelas → halaman ini bukan untuk dia.
      if (error || ((data as unknown[]) ?? []).length === 0) {
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
    router.push(`/akun?menu=${t}${previewId ? `&preview=${encodeURIComponent(previewId)}` : ""}`);
  };

  return (
    <StudentShell active="grup" onTabChange={goTab} previewStudentId={previewId}>
      {previewId && ready && (
        <div className="sticky top-0 z-[60] flex items-center justify-center gap-2 bg-[#12172B] px-4 py-2 text-center text-[12px] font-semibold text-white">
          <span className="inline-flex h-2 w-2 rounded-full bg-[#F2CB05]" />
          Preview POV Siswa · {previewName || "Siswa"} — data real, read-only
        </div>
      )}
      <main className="mx-auto w-full max-w-[1200px] px-5 pb-16 pt-6 sm:px-8 lg:py-9">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Grup Kelas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Ngobrol dengan pengajarmu di grup WhatsApp kelas — tanpa keluar dari dashboard.
          </p>
        </div>
        {ready ? (
          <StudentGroupChat previewStudentId={previewId} />
        ) : (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-7 w-7 animate-spin text-gray-300" />
          </div>
        )}
      </main>
    </StudentShell>
  );
}
