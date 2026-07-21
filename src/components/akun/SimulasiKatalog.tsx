"use client";

// [simulasi-inshell-v1] Katalog simulasi versi in-shell (dipakai di tab /akun, sidebar tetap tampil).
// Sebelumnya cuma ada di route terpisah /akun/simulasi yang nutup sidebar.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchPublishedSimulations, fetchMyEntitlements, getStudentInfo,
  TEST_TYPE_LABEL, testTypeLabel, type Simulation, type TestType,
} from "@/lib/simulations";
import {
  ClipboardCheck, ArrowRight, Layers, ListChecks, Clock, Globe, Loader2, Lock, Sparkles, PlayCircle,
} from "lucide-react";
import SimulasiBeliModal from "./SimulasiBeliModal";
import { testTypeHasAvailable } from "@/lib/simulasiPakets";
import { readProgress, readAnyProgress, answeredCount } from "@/lib/simProgress";

const TEAL = "#1A9E9E";
const TEAL_DEEP = "#0F6E56";
const PRICE = 79000;
const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;
const ALL_TYPES: TestType[] = ["toefl", "ielts"];

// [perf:simulasi-cache-v1] cache module-level: pindah tab lalu balik → render instan
// dari cache (tanpa spinner), data tetap di-refresh di belakang layar.
let simCache: { sims: Simulation[]; owned: TestType[]; authed: boolean } | null = null;

export default function SimulasiKatalog() {
  const [sims, setSims] = useState<Simulation[]>(simCache?.sims ?? []);
  const [owned, setOwned] = useState<TestType[]>(simCache?.owned ?? []);
  const [loading, setLoading] = useState(!simCache);
  const [authed, setAuthed] = useState<boolean | null>(simCache ? simCache.authed : null);
  // Popup "Beli Paket": simpan jenis tes yang mau dibeli (null = tertutup).
  const [beliType, setBeliType] = useState<TestType | null>(null);
  // Progres berjalan yang tersimpan lokal (per simulasi): utk progress bar "Lanjut".
  const [uid, setUid] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, { answered: number; total: number }>>({});

  const refresh = async () => {
    const info = await getStudentInfo();
    const [data, ents] = await Promise.all([
      fetchPublishedSimulations(),
      fetchMyEntitlements(),
    ]);
    simCache = { sims: data, owned: ents, authed: !!info };
    setAuthed(!!info);
    setUid(info?.user_id ?? null);
    setSims(data);
    setOwned(ents);
    setLoading(false);
  };

  // Baca progres tersimpan (localStorage) → peta { answered, total } per simulasi.
  const reloadProgress = useCallback(() => {
    const m: Record<string, { answered: number; total: number }> = {};
    for (const s of sims) {
      // Coba key uid saat ini dulu; kalau tak ketemu (tersimpan di bawah identitas
      // lain krn race auth / sesi tamu), fallback pindai semua key sim ini.
      const p = readProgress(s.id, uid) ?? readAnyProgress(s.id);
      if (p) m[s.id] = { answered: answeredCount(p), total: s.question_count ?? 0 };
    }
    setProgressMap(m);
  }, [sims, uid]);

  // Baca ulang tiap kali daftar sim / user berubah, DAN tiap kali halaman ini
  // kembali aktif. Runner ujian dibuka di tab lain / lewat tombol back (bfcache),
  // jadi tanpa ini progres yang baru disimpan di sana tak pernah terbaca di kartu.
  useEffect(() => {
    reloadProgress();
    const onVisible = () => { if (!document.hidden) reloadProgress(); };
    const onStorage = (e: StorageEvent) => { if (!e.key || e.key.startsWith("sim-progress:")) reloadProgress(); };
    const onPageShow = () => reloadProgress(); // pemulihan bfcache (tombol back)
    window.addEventListener("focus", reloadProgress);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("storage", onStorage);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("focus", reloadProgress);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [reloadProgress]);

  useEffect(() => {
    let alive = true;
    (async () => { if (alive) await refresh(); })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Jenis tes yang belum dimiliki → tampilkan kartu teaser terkunci.
  const lockedTypes = ALL_TYPES.filter((t) => !owned.includes(t));

  return (
    <div className="w-full">
      {/* Header (tanpa tombol back — sidebar shell tetap tampil) */}
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ background: TEAL_DEEP }}>
          <ClipboardCheck className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-[20px] font-extrabold leading-tight text-[#12172B]">Simulasi Tes</h1>
          <p className="text-[13px] text-gray-500">TOEFL &amp; IELTS — latihan dengan penilaian AI</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : authed === false ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-600">Kamu perlu masuk dulu untuk mengerjakan simulasi.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {/* Paket terkunci (belum dibeli) → CTA ke halaman checkout */}
          {lockedTypes.map((t) => {
            const comingSoon = !testTypeHasAvailable(t); // semua paket jenis tes ini masih "soon"
            return (
            <div key={`lock-${t}`} className={`flex flex-col overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-white ${comingSoon ? "opacity-90" : ""}`}>
              {/* Cover — gradasi teal ala menu Simulasi Tes (halaman /simulasi) */}
              <div className="relative overflow-hidden px-5 py-6 text-white" style={{ background: `linear-gradient(135deg, ${TEAL_DEEP}, ${TEAL})` }}>
                <ClipboardCheck className="pointer-events-none absolute -right-3 -bottom-4 h-24 w-24 opacity-15" />
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">
                    <Lock className="h-3 w-3" />{TEST_TYPE_LABEL[t]}
                  </span>
                  {comingSoon && (
                    <span className="inline-flex items-center rounded-full bg-amber-400/90 px-2.5 py-1 text-[11px] font-bold text-amber-950">Segera</span>
                  )}
                </div>
                <h2 className="mt-2 text-lg font-extrabold">Simulasi {TEST_TYPE_LABEL[t]}</h2>
                <p className="text-[13px] text-white/80">4 skill lengkap · penilaian AI</p>
              </div>
              <div className="flex flex-1 flex-col p-5">
                {comingSoon ? (
                  <>
                    <p className="text-sm text-slate-500">Masih dalam pengembangan. Segera hadir!</p>
                    <button disabled
                      className="mt-4 inline-flex cursor-not-allowed items-center justify-center gap-1.5 rounded-xl bg-slate-200 py-2.5 text-sm font-bold text-slate-500">
                      Segera Hadir
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-slate-500">Beli sekali, akses selamanya.</p>
                    <div className="mt-3 flex items-baseline gap-1.5">
                      <span className="text-xl font-extrabold text-slate-900">{formatRp(PRICE)}</span>
                      <span className="text-xs text-slate-400">/ sekali bayar</span>
                    </div>
                    <button
                      onClick={() => setBeliType(t)}
                      className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold text-white transition active:scale-95"
                      style={{ background: TEAL }}
                    >
                      <Sparkles className="h-4 w-4" /> Beli Paket
                    </button>
                  </>
                )}
              </div>
            </div>
            );
          })}
          {sims.map((s) => {
            const prog = progressMap[s.id];
            const pct = prog && prog.total > 0 ? Math.min(100, Math.round((prog.answered / prog.total) * 100)) : 0;
            return (
            <Link
              key={s.id}
              href={`/akun/simulasi/${s.id}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-teal-300 hover:shadow-md"
            >
              {/* Cover — pakai gambar dari admin (cover_url); fallback gradasi teal + ikon */}
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
                {s.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.cover_url}
                    alt={s.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center" style={{ background: `linear-gradient(135deg, ${TEAL_DEEP}, ${TEAL})` }}>
                    <ClipboardCheck className="h-12 w-12 text-white/40" />
                  </div>
                )}
                {prog && (
                  <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-teal-600/95 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm backdrop-blur">
                    <PlayCircle className="h-3 w-3" />Sedang dikerjakan
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col p-5">
              <div className="mb-3 flex items-center gap-2">
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"
                  style={{ background: s.test_type === "toefl" ? "#2563eb" : "#e11d48" }}
                >
                  <Globe className="h-3 w-3" />{testTypeLabel(s.test_type, s.test_variant)}
                </span>
                {s.level && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">{s.level}</span>}
              </div>
              <h2 className="font-bold text-slate-900 group-hover:text-teal-700">{s.title}</h2>
              {s.description && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{s.description}</p>}
              <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" />{s.section_count} bagian</span>
                <span className="flex items-center gap-1"><ListChecks className="h-3.5 w-3.5" />{s.question_count} soal</span>
                {s.duration_minutes > 0 && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{s.duration_minutes}m</span>}
              </div>

              {/* Progress bar — muncul bila ada sesi tersimpan yang belum dikumpulkan. */}
              {prog && (
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-[11px] font-medium">
                    <span className="text-teal-700">Progres tersimpan</span>
                    <span className="tabular-nums text-slate-500">{prog.answered}/{prog.total} soal · {pct}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full transition-[width]" style={{ width: `${pct}%`, background: TEAL }} />
                  </div>
                </div>
              )}

              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700">
                {prog ? "Lanjutkan" : "Mulai"} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
              </div>
            </Link>
            );
          })}
          {sims.length === 0 && lockedTypes.length === 0 && (
            <div className="sm:col-span-2 xl:col-span-3 rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
              <ClipboardCheck className="mx-auto mb-3 h-8 w-8 opacity-50" />
              <p className="text-sm">Belum ada simulasi yang tersedia. Cek lagi nanti ya!</p>
            </div>
          )}
        </div>
      )}

      <SimulasiBeliModal
        open={beliType !== null}
        onClose={() => setBeliType(null)}
        testType={beliType ?? undefined}
        onGranted={() => { setBeliType(null); refresh(); }}
      />
    </div>
  );
}
