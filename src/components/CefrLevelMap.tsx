"use client";

// [placement-cefr-map-v1] Peta level CEFR di hasil placement test — versi kartu
// (bukan popup) dari "Tentang CEFR" di tab Sertifikat (SertifikatTab.tsx), supaya
// calon siswa langsung melihat posisinya di tangga A1.1–B2.7.
// ANGKA SUBLEVEL WAJIB SAMA dengan silabus, SertifikatTab & admin (CEFR_BANDS):
// A1=3, A2=4, B1=5, B2=7 — 19 sublevel × 16 sesi = 304 sesi.
import { useMemo } from "react";
import { GraduationCap } from "lucide-react";

type Lvl = { code: string; name: string; en: string; subs: number; blurb: string; c: string };
const LEVELS: Lvl[] = [
  { code: "A1", name: "Pemula", en: "Beginner", subs: 3, blurb: "Perkenalan diri, angka, dan kalimat sehari-hari yang sangat dasar.", c: "#9FDCD6" },
  { code: "A2", name: "Dasar", en: "Elementary", subs: 4, blurb: "Ngobrol topik rutin: keluarga, belanja, pekerjaan, arah jalan.", c: "#5FC2B8" },
  { code: "B1", name: "Menengah", en: "Intermediate", subs: 5, blurb: "Cerita pengalaman & rencana, cukup mandiri saat traveling.", c: "#2A9187" },
  { code: "B2", name: "Mahir", en: "Upper Intermediate", subs: 7, blurb: "Diskusi topik abstrak, debat, presentasi. B2.7 = persiapan tes.", c: "#16796E" },
];
const SESI = 16;
const TEAL = "#16796E";

export default function CefrLevelMap({ sublevel }: { sublevel?: string }) {
  const bars = useMemo(() => {
    const out: { code: string; lvl: Lvl; i: number }[] = [];
    LEVELS.forEach((lvl) => { for (let i = 1; i <= lvl.subs; i++) out.push({ code: `${lvl.code}.${i}`, lvl, i: i - 1 }); });
    return out;
  }, []);
  const here = sublevel ? bars.findIndex((b) => b.code === sublevel.trim().toUpperCase()) : -1;
  const total = bars.length;
  const hereLvl = here >= 0 ? bars[here].lvl : null;
  const sisaSub = here >= 0 ? total - here : 0;

  // Geometri SVG. Antar-level diberi jeda (GAP) supaya label kelompok A1 yang
  // sempit tak menabrak label A2 — di popup lama "48 sesi" & "4 sublevel" sempat bertumpuk.
  // [cefr-map-responsive-v1] Dua varian: lebar (sm+) seperti semula, ringkas (HP) yang
  // mengecil pas lebar layar tanpa gulir samping — font di viewBox diperbesar supaya
  // tetap terbaca setelah diskalakan, label balok cukup angka sublevel (1, 2, 3…).
  const PAD = 10, COL = 22, STEP = 30, GAP = 14;
  const H0: Record<string, number> = { A1: 40, A2: 66, B1: 96, B2: 130 };
  const xs = useMemo(() => {
    let x = PAD, prev = "";
    return bars.map((b, idx) => {
      if (idx > 0) x += STEP + (b.lvl.code !== prev ? GAP : 0);
      prev = b.lvl.code;
      return x;
    });
  }, [bars]);
  const VB_W = xs[xs.length - 1] + COL + PAD;

  const chart = (compact: boolean) => {
    const k = compact ? 1.25 : 1;
    const BASE = Math.round(186 * k);
    const hOf = (b: { lvl: Lvl; i: number }) => (H0[b.lvl.code] + b.i * 6) * k;
    const f = compact
      ? { bar: 17, pill: 17, pillH: 30, pillW: 150, code: 22, name: 17, meta: 15 }
      : { bar: 9.5, pill: 10, pillH: 18, pillW: 84, code: 12.5, name: 10, meta: 10 };
    // Pil "Kamu di sini" lebih lebar dari satu balok → naik di atas balok tertinggi yang ditimpanya.
    const pill = here >= 0 ? (() => {
      const cx = xs[here] + COL / 2;
      const px = Math.min(Math.max(cx - f.pillW / 2, 0), VB_W - f.pillW);
      const tallest = Math.max(...bars.map((b, i) => (xs[i] + COL > px && xs[i] < px + f.pillW ? hOf(b) : 0)));
      return { px, y: BASE - tallest - f.bar - f.pillH - 8 };
    })() : null;
    const top = Math.min(0, pill ? pill.y - 4 : 0);
    const bottom = compact ? BASE + 76 : 240;
    return (
      <svg viewBox={`0 ${top} ${VB_W} ${bottom - top}`} className={"w-full " + (compact ? "block sm:hidden" : "hidden sm:block")} role="img"
        aria-label={`Grafik level CEFR A1 sampai B2${here >= 0 ? `, posisi kamu di ${bars[here].code}` : ""}`}>
        <line x1="0" y1={BASE + 0.5} x2={VB_W} y2={BASE + 0.5} stroke="#E8EAEE" strokeWidth="1" />
        {bars.map((b, i) => {
          const h = hOf(b), x = xs[i], y = BASE - h, isHere = i === here;
          return (
            <g key={b.code}>
              <rect x={x} y={y} width={COL} height={h} rx="6" fill={b.lvl.c} opacity={here < 0 || i <= here ? 1 : 0.3} />
              {isHere && <rect x={x - 2.5} y={y - 2.5} width={COL + 5} height={h + 5} rx="8" fill="none" stroke={TEAL} strokeWidth="2.5" />}
              <text x={x + COL / 2} y={y - 7} textAnchor="middle" fontSize={f.bar} fontWeight="700" fill={isHere ? TEAL : "#6B7280"}>{compact ? b.i + 1 : b.code}</text>
            </g>
          );
        })}
        {pill && (
          <g>
            <rect x={pill.px} y={pill.y} width={f.pillW} height={f.pillH} rx={f.pillH / 2} fill={TEAL} />
            <text x={pill.px + f.pillW / 2} y={pill.y + f.pillH / 2 + f.pill * 0.36} textAnchor="middle" fontSize={f.pill} fontWeight="800" fill="#fff">Kamu di sini</text>
          </g>
        )}
        {LEVELS.map((lvl) => {
          const start = bars.findIndex((b) => b.lvl.code === lvl.code);
          const x1 = xs[start], x2 = xs[start + lvl.subs - 1] + COL, cx = (x1 + x2) / 2;
          return (
            <g key={lvl.code}>
              <line x1={x1} y1={BASE + 8} x2={x2} y2={BASE + 8} stroke={lvl.c} strokeWidth="3" strokeLinecap="round" />
              {compact ? (
                <>
                  <text x={cx} y={BASE + 32} textAnchor="middle" fontSize={f.code} fontWeight="800" fill="#12172B">{lvl.code}</text>
                  <text x={cx} y={BASE + 52} textAnchor="middle" fontSize={f.name} fontWeight="700" fill="#374151">{lvl.name}</text>
                  <text x={cx} y={BASE + 70} textAnchor="middle" fontSize={f.meta} fontWeight="600" fill="#6B7280">{lvl.subs * SESI} sesi</text>
                </>
              ) : (
                <>
                  <text x={cx} y={BASE + 25} textAnchor="middle" fontSize={f.code} fontWeight="800" fill="#12172B">{lvl.code} · {lvl.name}</text>
                  <text x={cx} y={BASE + 39} textAnchor="middle" fontSize={f.name} fontWeight="600" fill="#6B7280">{lvl.subs} sublevel</text>
                  <text x={cx} y={BASE + 52} textAnchor="middle" fontSize={f.meta} fontWeight="600" fill="#6B7280">{lvl.subs * SESI} sesi</text>
                </>
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="bg-white rounded-[28px] p-5 md:p-7 shadow-[0_10px_40px_-12px_rgba(15,60,90,0.14)] ring-1 ring-slate-900/[0.04] mb-6">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: "#16796E14" }}>
          <GraduationCap className="h-5 w-5" style={{ color: TEAL }} />
        </span>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest font-semibold mb-0.5" style={{ color: TEAL }}>Posisi kamu di skala CEFR</p>
          <h3 className="text-lg md:text-xl font-bold text-gray-900 leading-snug">
            {hereLvl ? <>{bars[here].code} · {hereLvl.code} {hereLvl.name} <span className="text-gray-400 font-semibold">({hereLvl.en})</span></> : "Peta level di Linguo"}
          </h3>
        </div>
      </div>
      <p className="mt-3 text-sm text-gray-600 leading-relaxed">
        CEFR (Common European Framework of Reference) adalah standar internasional untuk mengukur kemampuan berbahasa — dari A1 (pemula) sampai C2 (setara penutur asli). Linguo memakai standar yang sama, lalu memecah tiap level jadi <strong className="text-gray-900">sublevel berisi {SESI} sesi</strong>.
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { n: "A1–B2", l: "Level tersedia" },
          { n: String(total), l: "Sublevel" },
          { n: here >= 0 ? `${sisaSub * SESI}` : `${total * SESI}`, l: here >= 0 ? "Sesi sampai B2 tuntas" : "Total sesi" },
        ].map((k) => (
          <div key={k.l} className="min-w-0 rounded-2xl bg-slate-50 px-2 py-3 text-center">
            <p className="text-lg font-bold text-gray-900 leading-tight whitespace-nowrap">{k.n}</p>
            <p className="mt-1 text-[11px] font-medium text-gray-500 leading-tight">{k.l}</p>
          </div>
        ))}
      </div>

      <p className="mt-5 text-xs font-medium text-gray-500">Tiap balok = 1 sublevel = {SESI} sesi. Semakin tinggi baloknya, semakin dalam materinya.</p>
      <div className="mt-2">
        {chart(true)}
        {chart(false)}
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {LEVELS.map((lvl) => {
          const mine = hereLvl?.code === lvl.code;
          return (
            <div key={lvl.code} className={"flex items-start gap-3 rounded-2xl p-3 " + (mine ? "bg-teal-50 ring-1 ring-teal-200" : "bg-slate-50")}>
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold" style={{ background: lvl.c, color: lvl.code.startsWith("B") ? "#fff" : "#0B2B28" }}>{lvl.code}</span>
              <span className="min-w-0 flex-1">
                {/* Judul satu baris: rentang sublevel yang mengalah (terpotong …) kalau sempit, pil tak pernah pecah. */}
                <span className="flex items-center gap-1.5 text-sm font-bold text-gray-900 whitespace-nowrap">
                  <span className="shrink-0">{lvl.name}</span>
                  <span className="min-w-0 truncate text-xs font-semibold text-gray-400">· {lvl.code}.1–{lvl.code}.{lvl.subs}</span>
                  {mine && <span className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: TEAL }}>Level kamu</span>}
                </span>
                <span className="mt-0.5 block text-xs text-gray-600 leading-relaxed">{lvl.blurb}</span>
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-gray-500 leading-relaxed">
        Begitu {SESI} sesi di satu sublevel tuntas, kamu langsung naik ke sublevel berikutnya dan dapat sertifikat — misal selesai A1.1 lanjut A1.2. Kalau evaluasi pengajar menyatakan kamu sudah mampu, sublevel boleh dilompati.
      </p>
    </div>
  );
}
