// [progress-share-v1] Bagikan / cetak kartu progres skill siswa.
//
// Dua jalur, sengaja dipisah:
//   • shareProgress()      → teks ringkas (Web Share API di HP, clipboard di desktop)
//   • printProgressCard()  → kartu cetak berkop Linguo, siswa simpan PDF / screenshot
// Pola window.open + document.write-nya sama persis dengan printReport di
// ClassRaporTab supaya tidak perlu dependensi baru.

import { cefrBand, scorePct, type SkillDelta } from "@/lib/studentInsights";

const SKILL_LABEL: Record<string, string> = {
  speaking: "Speaking",
  listening: "Listening",
  reading: "Reading",
  writing: "Writing",
};

export type ProgressShareData = {
  studentName: string;
  language: string;
  level?: string | null;
  skills: SkillDelta[];
  avg: number;
  avgBefore: number | null;
  periodStart: string | null;
  periodEnd: string | null;
};

function esc(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const fmtTgl = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "";

/**
 * Label periode siap pakai (frasa utuh, bukan potongan) supaya pemanggilnya
 * tidak perlu menempel kata "Periode" sendiri dan kebablasan jadi
 * "Periode per 11 Juli".
 *   ada pembanding  → "Periode 11 Juni – 11 Juli 2026"
 *   belum ada       → "Dinilai 11 Juli 2026"
 */
export function periodLabel(start: string | null, end: string | null): string {
  if (!end) return "";
  if (!start) return `Dinilai ${fmtTgl(end)}`;
  const a = new Date(start);
  const b = new Date(end);
  const sameYear = a.getFullYear() === b.getFullYear();
  const aStr = a.toLocaleDateString("id-ID", { day: "numeric", month: "long", ...(sameYear ? {} : { year: "numeric" }) });
  return `Periode ${aStr} – ${fmtTgl(end)}`;
}

/** Ringkasan teks buat dibagikan ke WhatsApp/medsos. */
export function progressSummaryText(d: ProgressShareData): string {
  const head = `Progres belajar ${d.language}${d.level ? ` (${d.level})` : ""} — ${d.studentName}`;
  const periode = periodLabel(d.periodStart, d.periodEnd);
  const baris = d.skills
    .filter((s) => s.score > 0)
    .map((s) => {
      const panah = s.delta && s.delta > 0 ? ` (naik dari ${cefrBand(s.before as number).band})` : "";
      return `• ${SKILL_LABEL[s.key] || s.key}: ${cefrBand(s.score).band} · ${scorePct(s.score)}%${panah}`;
    });
  const rata = d.avg
    ? `Rata-rata: ${d.avg.toFixed(1)}/5.0 (≈ ${cefrBand(d.avg).band} ${cefrBand(d.avg).name})`
    : "";
  return [head, periode, "", ...baris, "", rata, "", "Belajar di Linguo.id — 60+ bahasa, kelas online."]
    .filter((x) => x !== undefined)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

export type ShareResult = "shared" | "copied" | "failed";

/**
 * Bagikan ringkasan progres. Web Share API dulu (HP), kalau tak ada jatuh ke
 * clipboard. Batal-share oleh user (AbortError) TIDAK dianggap gagal.
 */
export async function shareProgress(d: ProgressShareData): Promise<ShareResult> {
  const text = progressSummaryText(d);
  const nav = typeof navigator !== "undefined" ? (navigator as any) : null;
  if (nav?.share) {
    try {
      await nav.share({ title: `Progres ${d.language} — ${d.studentName}`, text });
      return "shared";
    } catch (e: any) {
      if (e?.name === "AbortError") return "shared"; // user batal, jangan tampilkan error
      // lanjut ke clipboard
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}

/** Kartu progres siap cetak / simpan PDF. */
export function printProgressCard(d: ProgressShareData): void {
  const w = window.open("", "_blank");
  if (!w) {
    alert("Popup diblokir. Izinkan popup untuk membuka kartu progres.");
    return;
  }
  const periode = periodLabel(d.periodStart, d.periodEnd);
  const rows = d.skills
    .map((s) => {
      const pct = scorePct(s.score);
      const beforePct = s.before !== null ? scorePct(s.before) : null;
      const naik = s.delta !== null && s.delta > 0;
      const turun = s.delta !== null && s.delta < 0;
      const badge = naik
        ? `<span class="up">&#9650; naik ${Math.abs(pct - (beforePct as number))}%</span>`
        : turun
        ? `<span class="down">&#9660; turun ${Math.abs(pct - (beforePct as number))}%</span>`
        : "";
      const before =
        beforePct !== null
          ? `<div class="row sub"><div class="sn"></div><div class="bar"><div class="fill old" style="width:${beforePct}%"></div></div><div class="val old">${beforePct}% sebelumnya</div></div>`
          : "";
      return (
        `<div class="row"><div class="sn">${esc(SKILL_LABEL[s.key] || s.key)}</div>` +
        `<div class="bar"><div class="fill" style="width:${pct}%"></div></div>` +
        `<div class="val">${s.score ? `${pct}% &middot; ${cefrBand(s.score).band}` : "-"} ${badge}</div></div>` +
        before
      );
    })
    .join("");

  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Progres ${esc(d.language)} — ${esc(d.studentName)}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',-apple-system,sans-serif; padding:40px; color:#12172B; max-width:760px; margin:0 auto; }
  .header { display:flex; align-items:center; justify-content:space-between; border-bottom:3px solid #1A9E9E; padding-bottom:18px; margin-bottom:24px; }
  .logo { font-size:26px; font-weight:700; color:#1A9E9E; } .logo span { color:#F5A623; }
  .subtitle { font-size:11px; color:#888; }
  .badge { background:#1A9E9E; color:white; padding:4px 14px; border-radius:20px; font-size:12px; font-weight:600; }
  .info { background:#f8fffe; border:1px solid #e0f5f5; border-radius:12px; padding:18px; margin-bottom:22px; }
  .name { font-size:22px; font-weight:700; } .detail { font-size:13px; color:#666; margin-top:4px; }
  .st { font-size:13px; font-weight:700; color:#1A9E9E; margin-bottom:12px; text-transform:uppercase; letter-spacing:.5px; }
  .row { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
  .row.sub { margin-top:-6px; margin-bottom:12px; }
  .sn { width:100px; font-size:13px; font-weight:600; }
  .bar { flex:1; height:8px; background:#eee; border-radius:4px; overflow:hidden; }
  .fill { height:100%; background:#1A9E9E; border-radius:4px; }
  .fill.old { background:#cbd5e1; height:4px; margin-top:2px; }
  .val { width:190px; text-align:right; font-size:12px; font-weight:700; color:#1A9E9E; }
  .val.old { color:#94a3b8; font-weight:600; }
  .up { color:#059669; font-weight:700; margin-left:4px; }
  .down { color:#dc2626; font-weight:700; margin-left:4px; }
  .avg { margin-top:20px; background:linear-gradient(135deg,#16796E,#059669); color:white; border-radius:14px; padding:18px 22px; display:flex; align-items:center; justify-content:space-between; }
  .avg .num { font-size:34px; font-weight:800; line-height:1; }
  .avg .lbl { font-size:11px; opacity:.85; text-transform:uppercase; letter-spacing:1px; }
  .footer { border-top:2px solid #eee; padding-top:14px; margin-top:28px; display:flex; justify-content:space-between; font-size:11px; color:#aaa; }
  @media print { body { padding:20px; } .no-print { display:none; } }
</style></head><body>
  <div class="no-print" style="text-align:center;margin-bottom:18px;">
    <button onclick="window.print()" style="background:#1A9E9E;color:white;border:none;padding:10px 30px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">Cetak / Simpan PDF</button>
  </div>
  <div class="header">
    <div><div class="logo">Linguo<span>.id</span></div><div class="subtitle">Online Language School</div></div>
    <div class="badge">PROGRES BELAJAR</div>
  </div>
  <div class="info">
    <div class="name">${esc(d.studentName)}</div>
    <div class="detail">${esc(d.language)}${d.level ? " — Level " + esc(d.level) : ""}</div>
    ${periode ? `<div class="detail" style="margin-top:2px;">${esc(periode)}</div>` : ""}
  </div>
  <div class="st">Kemampuan 4 Skill &middot; Standar CEFR</div>
  ${rows}
  ${
    d.avg
      ? `<div class="avg"><div><div class="lbl">Rata-rata</div><div class="num">${d.avg.toFixed(1)}<span style="font-size:15px;font-weight:600;">/5.0</span></div></div>
         <div style="text-align:right;"><div class="lbl">Setara</div><div style="font-size:20px;font-weight:800;">${cefrBand(d.avg).band} &middot; ${cefrBand(d.avg).name}</div>
         ${d.avgBefore ? `<div style="font-size:12px;opacity:.85;margin-top:4px;">sebelumnya ${d.avgBefore.toFixed(1)} &middot; ${cefrBand(d.avgBefore).band}</div>` : ""}</div></div>`
      : ""
  }
  <div class="footer"><div>Linguo.id — Online Language School</div><div>Dicetak ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div></div>
</body></html>`);
  w.document.close();
}
