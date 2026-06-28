"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchPublishedSimulations, fetchMyEntitlements, getStudentInfo,
  TEST_TYPE_LABEL, type Simulation, type TestType,
} from "@/lib/simulations";
import {
  ClipboardCheck, ArrowLeft, ArrowRight, Layers, ListChecks, Clock, Globe, Loader2, Lock, Sparkles,
} from "lucide-react";

const TEAL = "#1A9E9E";
const TEAL_DEEP = "#0F6E56";
const PRICE = 79000;
const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;
const ALL_TYPES: TestType[] = ["toefl", "ielts"];

export default function SimulasiKatalogPage() {
  const [sims, setSims] = useState<Simulation[]>([]);
  const [owned, setOwned] = useState<TestType[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const info = await getStudentInfo();
      setAuthed(!!info);
      const [data, ents] = await Promise.all([
        fetchPublishedSimulations(),
        fetchMyEntitlements(),
      ]);
      setSims(data);
      setOwned(ents);
      setLoading(false);
    })();
  }, []);

  // Jenis tes yang belum dimiliki → tampilkan kartu teaser terkunci.
  const lockedTypes = ALL_TYPES.filter((t) => !owned.includes(t));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3.5 sm:px-6">
          <Link href="/akun" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg text-white" style={{ background: TEAL_DEEP }}>
            <ClipboardCheck className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-base font-bold text-slate-900">Simulasi Tes</h1>
            <p className="text-xs text-slate-500">TOEFL &amp; IELTS — latihan dengan penilaian AI</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : authed === false ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-sm text-slate-600">Kamu perlu masuk dulu untuk mengerjakan simulasi.</p>
            <Link href="/akun" className="mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white" style={{ background: TEAL }}>
              Masuk / Daftar <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Paket terkunci (belum dibeli) → CTA ke halaman checkout */}
            {lockedTypes.map((t) => (
              <div key={`lock-${t}`} className="flex flex-col rounded-2xl border border-dashed border-slate-300 bg-white p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                    <Lock className="h-3 w-3" />{TEST_TYPE_LABEL[t]}
                  </span>
                </div>
                <h2 className="font-bold text-slate-900">Simulasi {TEST_TYPE_LABEL[t]}</h2>
                <p className="mt-1 text-sm text-slate-500">4 skill lengkap, Writing &amp; Speaking dinilai AI. Beli sekali, akses selamanya.</p>
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
                    <Globe className="h-3 w-3" />{TEST_TYPE_LABEL[s.test_type]}
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
              <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
                <ClipboardCheck className="mx-auto mb-3 h-8 w-8 opacity-50" />
                <p className="text-sm">Belum ada simulasi yang tersedia. Cek lagi nanti ya!</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
