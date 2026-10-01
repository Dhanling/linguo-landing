"use client";
// [silabus-pte-v1] Pemilih paket (8 / 12 / 16 sesi) + daftar sesi silabus PTE.
// Satu-satunya bagian halaman /persiapan-tes/pte yang butuh state; sisanya
// komponen server. Render awal (HTML untuk crawler) = paket 16 sesi, karena di
// situ tiap modul tampil utuh. `?paket=12` memilih paket lain — dipakai tautan
// "Lihat silabus" dari modal checkout.
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Clock } from "lucide-react";
import {
  getTestPrepProduct, privatePerSessionFor, formatRupiah, SESSION_MINUTES,
} from "@/lib/testPrep";
import {
  PTE_PLANS, PTE_SKILL_LABEL, DEFAULT_PTE_PLAN, getPteModule, getPtePlan,
  type PteModule, type PteSkill, type PtePlanSessions,
} from "@/lib/pteSyllabus";

const TEAL = "#1A9E9E";

// Kelas ditulis utuh (bukan dirakit) supaya terbaca pemindai Tailwind.
const SKILL_STYLE: Record<PteSkill, { badge: string; dot: string }> = {
  orientasi: { badge: "bg-slate-100 text-slate-700", dot: "bg-slate-400" },
  speaking: { badge: "bg-violet-100 text-violet-700", dot: "bg-violet-500" },
  writing: { badge: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
  reading: { badge: "bg-teal-100 text-teal-700", dot: "bg-teal-500" },
  listening: { badge: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  mock: { badge: "bg-rose-100 text-rose-700", dot: "bg-rose-500" },
};

export default function SilabusPaket() {
  const [sessions, setSessions] = useState<PtePlanSessions>(DEFAULT_PTE_PLAN);

  useEffect(() => {
    const n = Number(new URLSearchParams(window.location.search).get("paket"));
    const cocok = PTE_PLANS.find((p) => p.sessions === n);
    if (cocok) setSessions(cocok.sessions);
  }, []);

  const product = getTestPrepProduct("pte");
  const perSesi = product ? privatePerSessionFor(product, product.levels[0]?.id ?? "") : 0;
  const plan = getPtePlan(sessions);
  const totalJam = (plan.sessions * SESSION_MINUTES) / 60;

  return (
    <div>
      {/* Pemilih paket */}
      <div className="grid gap-3 sm:grid-cols-3">
        {PTE_PLANS.map((p) => {
          const on = p.sessions === sessions;
          return (
            <button
              key={p.sessions}
              onClick={() => setSessions(p.sessions)}
              aria-pressed={on}
              className={`rounded-2xl border-2 p-4 text-left transition ${on ? "border-teal-500 bg-teal-50" : "border-slate-200 bg-white hover:border-teal-300"}`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-lg font-extrabold text-slate-900">{p.sessions} sesi</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${on ? "bg-teal-500 text-white" : "bg-slate-100 text-slate-600"}`}>{p.label}</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {(p.sessions * SESSION_MINUTES) / 60} jam belajar{perSesi > 0 && <> · {formatRupiah(perSesi * p.sessions)}</>}
              </p>
            </button>
          );
        })}
      </div>

      {/* Untuk siapa paket ini */}
      <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
        <p><b className="text-slate-900">Cocok untuk:</b> {plan.cocok}</p>
        <p className="mt-1.5 text-slate-600"><b className="text-slate-900">Catatan:</b> {plan.catatan}</p>
      </div>

      {/* Daftar sesi */}
      <ol className="mt-6 space-y-3">
        {plan.plan.map((s, i) => {
          const mods = s.modules.map(getPteModule).filter((m): m is PteModule => !!m);
          if (!mods.length) return null;
          const judul = s.title ?? mods[0].title;
          const skills = Array.from(new Set(mods.map((m) => m.skill)));
          return (
            <li key={i} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white" style={{ background: TEAL }}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {skills.map((sk) => (
                      <span key={sk} className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${SKILL_STYLE[sk].badge}`}>{PTE_SKILL_LABEL[sk]}</span>
                    ))}
                    <span className="flex items-center gap-1 text-[11px] text-slate-400"><Clock className="h-3 w-3" /> {SESSION_MINUTES} menit</span>
                  </div>
                  <h3 className="mt-1 text-[15px] font-bold leading-snug text-slate-900">{judul}</h3>
                </div>
              </div>

              <div className="mt-3 space-y-3 sm:pl-12">
                {mods.map((m) => (
                  <div key={m.id}>
                    {mods.length > 1 && (
                      <p className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <span className={`h-1.5 w-1.5 rounded-full ${SKILL_STYLE[m.skill].dot}`} /> {m.title}
                      </p>
                    )}
                    <ul className="space-y-1">
                      {m.points.map((pt) => (
                        <li key={pt} className="flex gap-2 text-[13px] leading-relaxed text-slate-600">
                          <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-teal-500" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                    {mods.length === 1 && (
                      <p className="mt-2 text-[13px] leading-relaxed text-slate-500"><b className="text-slate-700">Hasil:</b> {m.hasil}</p>
                    )}
                  </div>
                ))}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {Array.from(new Set(mods.flatMap((m) => m.itemTypes))).map((t) => (
                    <span key={t} className="rounded-lg border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-500">{t}</span>
                  ))}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Aksi */}
      <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-teal-200 bg-teal-50 p-4 sm:flex-row sm:items-center sm:p-5">
        <div>
          <p className="text-sm font-bold text-slate-900">
            Paket {plan.label} · {plan.sessions} sesi @{SESSION_MINUTES} menit ({totalJam} jam)
          </p>
          <p className="text-xs text-slate-600">
            Private 1-on-1{perSesi > 0 && <> · {formatRupiah(perSesi * plan.sessions)} ({formatRupiah(perSesi)}/sesi)</>} · jadwal diatur bersama pengajar
          </p>
        </div>
        <Link
          href={`/persiapan-tes?produk=pte&sesi=${plan.sessions}`}
          className="flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow"
          style={{ background: TEAL }}
        >
          Daftar paket {plan.sessions} sesi <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
