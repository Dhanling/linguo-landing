"use client";

// [slide-bagikan-siswa-v1] Slide yang DIBAGIKAN pengajar ke siswa (bug fa7514b5:
// pengajar ingin mengirim slide yang dia paparkan di kelas, tapi tak ada menu
// unduh). Keputusan owner: slide TIDAK boleh diunduh, tapi boleh dibagikan — dan
// siswa wajib LOGIN dulu untuk membukanya.
//
// URL-nya dibuat dashboard pengajar (src/lib/bagikanSlide.ts di repo dashboard):
//   linguo.id/akun/slide/<kunci dek>/<nomor sesi>   mis. /akun/slide/english-a2-1/5
// Isinya dek siap pakai yang sama dengan tab Materi kelas (lib/dekSilabusSiswa),
// ditonton lewat SlideDeckViewer yang sama — mode baca saja: tanpa tombol unduh/
// ekspor, klik kanan, seret gambar, Ctrl+S/Ctrl+P, dan cetak dimatikan.
//
// Gerbang: belum login → /akun?next=<halaman ini> (alur ?next yang sudah ada,
// ikut terbawa lewat Google OAuth & magic link). Sudah login → harus punya
// registrasi kelas BAHASA yang sama. Kalau pemeriksaan registrasinya gagal
// (jaringan / policy), siswa yang sudah login tetap dibiarkan menonton — syarat
// minimal owner (wajib login) sudah terpenuhi, jangan kunci siswa karena galat.

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Lock, ArrowLeft, RefreshCw } from "lucide-react";
import { supabase, resolveSessionForGate } from "@/lib/supabase-client";
import { SlideDeckViewer } from "@/components/akun/SlideDeckViewer";
import { loadDekSiswa } from "@/lib/dekSilabusSiswa";
import { languageSlug } from "@/lib/languageSlug";
import { toLangCode } from "@/lib/quiz/language";
import { languages as CURRICULUM_LANGUAGES } from "@/data/curriculum/languages";
import type { MateriSlide } from "@/lib/materiSlides";

type Status =
  | { tahap: "memuat" }
  | { tahap: "tolak"; pesan: string }
  | { tahap: "galat"; pesan: string }
  | { tahap: "siap"; slides: MateriSlide[] };

/** "english-a2-1" → { slug: "english", code: "A2.1" } — pola sama dengan daftarDek() dashboard. */
function urai(kunci: string): { slug: string; code: string } | null {
  const m = /^([a-z-]+)-([abc][12])-(\d)$/.exec(String(kunci || "").toLowerCase());
  return m ? { slug: m[1], code: `${m[2].toUpperCase()}.${m[3]}` } : null;
}

/** Siswa yang login punya kelas bahasa ini? null = tak bisa dipastikan (galat). */
async function punyaKelasBahasa(email: string | null, slug: string): Promise<boolean | null> {
  if (!email) return null;
  try {
    // Email bisa punya dua baris students (lihat [akun-student-kembar-v1] di /akun)
    // — registrasi semua kembaran ikut dihitung.
    const { data: siswa, error: e1 } = await supabase.from("students").select("id").eq("email", email);
    if (e1) return null;
    const ids = ((siswa as any[]) || []).map((r) => r.id).filter(Boolean);
    if (!ids.length) return false;
    const { data: regs, error: e2 } = await supabase.from("registrations").select("language").in("student_id", ids);
    if (e2) return null;
    return ((regs as any[]) || []).some((r) => languageSlug(r.language) === slug);
  } catch {
    return null;
  }
}

export default function SlideDibagikanPage() {
  const router = useRouter();
  const params = useParams<{ kunci: string; sesi: string }>();
  const dek = useMemo(() => urai(params.kunci), [params.kunci]);
  const no = Number(params.sesi);
  const [status, setStatus] = useState<Status>({ tahap: "memuat" });
  const [ulang, setUlang] = useState(0);

  const namaBahasa = dek ? (CURRICULUM_LANGUAGES.find((l) => l.slug === dek.slug)?.name || dek.slug) : "";

  useEffect(() => {
    let alive = true;
    (async () => {
      setStatus({ tahap: "memuat" });
      if (!dek || !Number.isInteger(no) || no < 1) {
        setStatus({ tahap: "tolak", pesan: "Link slide ini tidak valid. Minta link baru ke pengajarmu." });
        return;
      }
      // [auth-gate-resilient-v1] jangan pantulkan user ke layar masuk hanya karena
      // getSession() menjawab null sesaat (lihat resolveSessionForGate).
      const v = await resolveSessionForGate();
      if (!alive) return;
      if (!v.user?.id) {
        if (v.uncertain) { setStatus({ tahap: "galat", pesan: "Sesi belum siap. Coba muat ulang halaman." }); return; }
        // Belum login → layar masuk /akun, lalu kembali ke slide ini.
        const sini = window.location.pathname + window.location.search;
        router.replace(`/akun?next=${encodeURIComponent(sini)}`);
        return;
      }
      const [boleh, d] = await Promise.all([
        punyaKelasBahasa(v.user.email, dek.slug),
        loadDekSiswa(dek.slug, dek.code),
      ]);
      if (!alive) return;
      if (boleh === false) {
        setStatus({ tahap: "tolak", pesan: `Slide ini khusus siswa kelas ${namaBahasa} Linguo. Pastikan kamu masuk dengan email yang terdaftar di kelasmu.` });
        return;
      }
      const slides = d?.[no];
      if (!slides?.length) {
        setStatus(d ? { tahap: "tolak", pesan: "Slide sesi ini belum tersedia." } : { tahap: "galat", pesan: "Slide gagal dimuat. Periksa koneksi lalu coba lagi." });
        return;
      }
      setStatus({ tahap: "siap", slides });
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.kunci, params.sesi, ulang]);

  // Mode baca saja: Ctrl/Cmd+S (simpan halaman) & Ctrl/Cmd+P (cetak → PDF) dimatikan.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (k === "s" || k === "p")) e.preventDefault();
    };
    window.addEventListener("keydown", h, true);
    return () => window.removeEventListener("keydown", h, true);
  }, []);

  const keAkun = () => router.push("/akun");

  if (status.tahap === "siap" && dek) {
    const judul = status.slides[0]?.heading;
    return (
      <div
        // Viewer-nya position:fixed, tapi event React tetap naik lewat pohon komponen
        // — klik kanan / seret gambar di slide mana pun tertangkap di sini.
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        onCopy={(e) => e.preventDefault()}
        style={{ userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" } as React.CSSProperties}
      >
        {/* Cetak (Ctrl+P lewat menu browser) → halaman kosong, bukan PDF berisi slide. */}
        <style>{`@media print{body *{visibility:hidden !important}}[data-slide-bagikan] img{-webkit-user-drag:none;user-select:none;}`}</style>
        <div data-slide-bagikan>
          <SlideDeckViewer
            slides={status.slides}
            title={judul ? `Sesi ${no} · ${judul}` : `Sesi ${no}`}
            subtitle={`Slide ${namaBahasa} ${dek.code}`}
            lang={toLangCode(dek.slug)}
            onClose={keAkun}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#EEF1F4] px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white px-6 py-8 text-center shadow-sm">
        {status.tahap === "memuat" ? (
          <>
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-slate-300" />
            <p className="mt-3 text-[13px] font-semibold text-gray-500">Membuka slide…</p>
          </>
        ) : (
          <>
            <Lock className="mx-auto mb-2 h-8 w-8 text-slate-300" strokeWidth={1.6} />
            <p className="text-[14px] font-bold text-[#12172B]">{status.tahap === "tolak" ? "Slide tidak bisa dibuka" : "Ada gangguan"}</p>
            <p className="mt-1 text-[12.5px] font-medium leading-relaxed text-gray-500">{"pesan" in status ? status.pesan : ""}</p>
            <div className="mt-5 flex flex-col gap-2">
              {status.tahap === "galat" && (
                <button onClick={() => setUlang((n) => n + 1)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#16796E] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0F5A52]">
                  <RefreshCw className="h-4 w-4" strokeWidth={2.5} /> Muat Ulang
                </button>
              )}
              <button onClick={keAkun}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-slate-50">
                <ArrowLeft className="h-4 w-4" strokeWidth={2.5} /> Ke Dashboard Siswa
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
