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
import { supabase, resolveSessionForGate, peekSessionUser } from "@/lib/supabase-client"; // [auth-gate-resilient-v1] [perf:grup-peek-gate-v1]
import StudentShell, { GROUP_NAV_KEY, type AkunTab } from "@/components/akun/StudentShell";
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
        .then(async (r) => ({ status: r.status, json: r.ok ? await r.json() : null }))
        .then(({ status, json }) => {
          if (!alive) return;
          if (status === 401 || status === 403) {
            // Cookie pratinjau tak ada/kedaluwarsa → kembalikan ke dashboard yang
            // memasang banner "Sesi pratinjau sudah habis".
            router.replace("/akun");
            return;
          }
          /* [grup-gagal-bukan-kosong-v1] Galat lain (jaringan/5xx) TIDAK memantulkan
             staf keluar halaman — StudentGroupChat menampilkan layar galatnya sendiri
             lengkap dengan tombol muat ulang. */
          setPreviewName(json?.identity?.display_name ?? null);
          setReady(true);
        })
        .catch(() => { if (alive) setReady(true); });
      return () => { alive = false; };
    }

    /* [perf:grup-peek-gate-v1] Kunjungan berikutnya di tab yang sama tak perlu
       menunggu Auth + RPC student_group_list() dari nol: kalau cookie sesi masih
       memegang identitas DAN sidebar sudah pernah memastikan siswa ini punya grup
       kelas, chat-nya langsung dirender. Pemeriksaan sungguhannya tetap jalan di
       bawah — kalau ternyata dia bukan (lagi) anggota grup, halaman tetap
       memantul ke /akun. */
    let optimistic = false;
    try {
      if (peekSessionUser()?.id && sessionStorage.getItem(GROUP_NAV_KEY) === "1") {
        optimistic = true;
        setReady(true);
      }
    } catch {}

    // [auth-gate-resilient-v1] jangan pantulkan user ke layar masuk hanya karena
    // getSession() menjawab null sesaat (lihat resolveSessionForGate).
    resolveSessionForGate().then(async (v) => {
      if (!alive) return;
      if (!v.user?.id) {
        // belum login → arahkan ke dashboard (yang nampung UI login)
        router.replace("/akun");
        return;
      }
      const { data, error } = await supabase.rpc("student_group_list");
      if (!alive) return;
      // Bukan siswa, atau siswa tanpa grup kelas → halaman ini bukan untuk dia.
      if (error || ((data as unknown[]) ?? []).length === 0) {
        try { sessionStorage.setItem(GROUP_NAV_KEY, "0"); } catch {}
        router.replace("/akun");
        return;
      }
      try { sessionStorage.setItem(GROUP_NAV_KEY, "1"); } catch {}
      if (!optimistic) setReady(true);
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
      {/* [grup-kanvas-penuh-siswa-v1] Sama dengan tab "grup" di /akun: panel chat
          full-bleed sampai tepi kanvas, cuma judulnya yang berpadding. */}
      <main className="w-full pt-5">
        <div className="mb-4 px-4 sm:px-6">
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
