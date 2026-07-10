"use client";

// [simulasi-inshell-v1] Katalog simulasi versi in-shell (dipakai di tab /akun, sidebar tetap tampil).
// Sebelumnya cuma ada di route terpisah /akun/simulasi yang nutup sidebar.
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchPublishedSimulations, fetchMyEntitlements, getStudentInfo,
  TEST_TYPE_LABEL, testTypeLabel, type Simulation, type TestType,
} from "@/lib/simulations";
import {
  ClipboardCheck, ArrowRight, Layers, ListChecks, Clock, Globe, Loader2, Lock, Sparkles,
} from "lucide-react";

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

  useEffect(() => {
    let alive = true;
    (async () => {
      const info = await getStudentInfo();
      const [data, ents] = await Promise.all([
        fetchPublishedSimulations(),
        fetchMyEntitlements(),
      ]);
      simCache = { sims: data, owned: ents, authed: !!info };
      if (!alive) return;
      setAuthed(!!info);
      setSims(data);
      setOwned(ents);
      setLoading(false);
    })();
    return () => { alive = false; };
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
          {lockedTypes.map((t) => (
            <div key={`lock-${t}`} className="flex flex-col rounded-2xl border border-dashed border-slate-300 bg-white p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                  <Lock className="h-3 w-3" />{TEST_TYPE_LABEL[t]}
                </span>
              </div>
              <h2 className="font-bold text-slate-900">Simulasi {TEST_TYPE_LABEL[t]}</h2>
              <p className="mt-1 text-sm text-slate-500">4 skill lengkap. Beli sekali, akses selamanya.</p>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-xl font-extrabold text-slate-900">{formatRp(PRICE)}</span>
                <span className="text-xs text-slate-400">/ sekali bayar</span>
              </div>
              <Link href="/simulasi/paket" className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold text-white transition active:scale-95" style={{ background: TEAL }}>
                <Sparkles className="h-4 w-4" /> Beli Paket
              </Link>
            </div>
          ))}
          {sims.map((s) => (
            <Link
              key={s.id}
              href={`/akun/simulasi/${s.id}`}
              className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-teal-300 hover:shadow-md"
            >
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
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700">
                Mulai <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
          {sims.length === 0 && lockedTypes.length === 0 && (
            <div className="sm:col-span-2 xl:col-span-3 rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
              <ClipboardCheck className="mx-auto mb-3 h-8 w-8 opacity-50" />
              <p className="text-sm">Belum ada simulasi yang tersedia. Cek lagi nanti ya!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
