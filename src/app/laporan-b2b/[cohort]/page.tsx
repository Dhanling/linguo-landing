"use client";

// [linguo-patch:b2b-progress-report-v1]
// Form publik "Laporan Progress Kelas B2B" — dibagikan ke pengajar lewat link,
// tanpa login. Hasil masuk tabel `b2b_progress_reports` dan dibaca admin di
// dashboard (Kurikulum → Laporan B2B).
//
// Rute: /laporan-b2b/<slug> (mis. linguo.id/laporan-b2b/alfamart-vietnam)
// Cohort didefinisikan di src/lib/b2bReport.ts.
// Draft disimpan otomatis di localStorage — 17 peserta gak realistis diisi sekali duduk.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
// [fix:gotrue-client-tunggal-v1] pakai client kanonik, jangan bikin instance GoTrue baru
import { supabase } from "@/lib/supabase-client";
import {
  getCohort, makeRow, avgScore, attendancePct, scoreBand, scoreOptionLabel,
  SCORE_OPTIONS, SCORE_ASPECTS, SCALE_LEGEND,
  type ParticipantRow, type CohortConfig,
} from "@/lib/b2bReport";
import {
  fetchAttendanceSync, applyAttendanceSync, matchPerson, type AttendanceSync,
} from "@/lib/b2bAttendanceSync";
import {
  ArrowLeft, ArrowRight, Check, CircleCheck, ClipboardList, Loader2, Users,
  UserRound, CalendarRange, Star, FileText, Send, AlertTriangle, Info, PartyPopper,
  ChevronDown, ChevronUp, Save, RefreshCw, CloudDownload,
} from "lucide-react";

const TEAL = "#16796E";
const YELLOW = "#F2CB05";

type Evaluation = {
  achievement: string;
  competency: string;
  workplace: string;
  engagement: string;
  operational_note: string;
};

const EMPTY_EVAL: Evaluation = {
  achievement: "",
  competency: "",
  workplace: "",
  engagement: "",
  operational_note: "",
};

const STEPS = [
  { label: "Identitas", icon: UserRound },
  { label: "Presensi", icon: CalendarRange },
  { label: "Penilaian", icon: Star },
  { label: "Evaluasi", icon: FileText },
  { label: "Kirim", icon: Send },
];

export default function B2BProgressReportPage() {
  const params = useParams<{ cohort: string }>();
  const slug = String(params?.cohort || "");
  const cohort = getCohort(slug);

  if (!cohort) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="max-w-sm rounded-3xl border border-slate-100 bg-white p-7 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
          <h1 className="mt-3 text-lg font-extrabold text-slate-900">Link laporan tidak dikenal</h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
            Cohort <b>{slug || "—"}</b> belum terdaftar. Minta link yang benar ke admin Linguo ya.
          </p>
        </div>
      </div>
    );
  }

  return <ReportForm cohort={cohort} />;
}

function ReportForm({ cohort }: { cohort: CohortConfig }) {
  const DRAFT_KEY = `b2b-report-draft:${cohort.slug}:v1`;

  const [step, setStep] = useState(-1); // -1 intro · 0..4 langkah · 5 selesai
  const [teacherName, setTeacherName] = useState(cohort.defaultTeacherName);
  const [teacherEmail, setTeacherEmail] = useState(cohort.defaultTeacherEmail);
  const [reportType, setReportType] = useState<"mid" | "final">("mid");
  const [periodLabel, setPeriodLabel] = useState("");
  const [sessionsDone, setSessionsDone] = useState<number | null>(null);
  const [grouped, setGrouped] = useState(false);
  const [rows, setRows] = useState<ParticipantRow[]>(() => cohort.roster.map((p) => makeRow(p, null)));
  const [evaluation, setEvaluation] = useState<Evaluation>(EMPTY_EVAL);
  const [topics, setTopics] = useState("");
  const [challenges, setChallenges] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [recommendation, setRecommendation] = useState("");

  const [open, setOpen] = useState<string | null>(null); // kartu peserta yang terbuka
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // ── [linguo-patch:b2b-report-presensi-sync-v1] presensi dari dashboard ──
  const [sync, setSync] = useState<AttendanceSync | null>(null);
  const [syncState, setSyncState] = useState<"idle" | "loading" | "ready" | "empty" | "error">("idle");
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const autoApplied = useRef(false);

  // ── muat draft ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.teacherName) setTeacherName(d.teacherName);
        if (d.teacherEmail) setTeacherEmail(d.teacherEmail);
        if (d.reportType) setReportType(d.reportType);
        if (d.periodLabel) setPeriodLabel(d.periodLabel);
        if (typeof d.sessionsDone === "number") setSessionsDone(d.sessionsDone);
        if (typeof d.grouped === "boolean") setGrouped(d.grouped);
        if (Array.isArray(d.rows) && d.rows.length) setRows(mergeRoster(cohort, d.rows));
        if (d.evaluation) setEvaluation({ ...EMPTY_EVAL, ...d.evaluation });
        if (d.topics) setTopics(d.topics);
        if (d.challenges) setChallenges(d.challenges);
        if (d.conclusion) setConclusion(d.conclusion);
        if (d.recommendation) setRecommendation(d.recommendation);
        if (d.savedAt) setSavedAt(d.savedAt);
      }
    } catch {
      /* draft rusak — abaikan, mulai bersih */
    }
    setDraftLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── simpan draft otomatis ──
  useEffect(() => {
    if (!draftLoaded || step >= 5) return;
    const t = setTimeout(() => {
      const stamp = new Date().toISOString();
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({
            teacherName, teacherEmail, reportType, periodLabel, sessionsDone,
            grouped, rows, evaluation, topics, challenges, conclusion, recommendation,
            savedAt: stamp,
          })
        );
        setSavedAt(stamp);
      } catch {
        /* storage penuh / private mode — form tetap jalan */
      }
    }, 600);
    return () => clearTimeout(t);
  }, [
    draftLoaded, step, DRAFT_KEY, teacherName, teacherEmail, reportType, periodLabel,
    sessionsDone, grouped, rows, evaluation, topics, challenges, conclusion, recommendation,
  ]);

  const activeRows = useMemo(() => rows.filter((r) => r.active), [rows]);

  const patch = (idx: number, p: Partial<ParticipantRow>) =>
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...p } : r)));

  // ── tarik presensi dari dashboard ──
  // Pertama kali: isi otomatis kolom yang masih kosong (draft pengajar menang).
  // "Tarik ulang": timpa hadir/izin dengan angka dashboard.
  const pullAttendance = useCallback(
    async (force: boolean) => {
      if (!cohort.leadId) { setSyncState("empty"); return; }
      setSyncState("loading");
      const data = await fetchAttendanceSync(cohort.leadId);
      if (!data) { setSyncState("error"); return; }
      setSync(data);
      if (!data.participants.length || !data.sessions_recorded) { setSyncState("empty"); return; }
      setRows((prev) => applyAttendanceSync(prev, data, force).rows);
      setSessionsDone((prev) => (force || prev == null ? (data.sessions_completed || data.sessions_recorded) : prev));
      setSyncState("ready");
      setSyncedAt(new Date().toISOString());
    },
    [cohort.leadId]
  );

  // Tarik sekali setelah draft dibaca — biar isian yang sudah ada tidak ketiban.
  useEffect(() => {
    if (!draftLoaded || autoApplied.current) return;
    autoApplied.current = true;
    void pullAttendance(false);
  }, [draftLoaded, pullAttendance]);

  /** Peserta yang tidak ketemu di dashboard — presensinya tetap manual. */
  const unmatched = useMemo(
    () => (sync ? activeRows.filter((r) => !matchPerson(sync, r.name)).map((r) => titleCase(r.name)) : []),
    [sync, activeRows]
  );

  // ── kelengkapan ──
  const presensiDone = (r: ParticipantRow) =>
    !!r.sessions_total && r.attended != null && r.excused_work != null && r.sick != null;
  const nilaiDone = (r: ParticipantRow) => avgScore(r) != null && r.observation.trim().length >= 10;

  const presensiCount = activeRows.filter(presensiDone).length;
  const nilaiCount = activeRows.filter(nilaiDone).length;

  const missing = useMemo(() => {
    const list: string[] = [];
    if (!teacherName.trim()) list.push("Nama pengajar belum diisi.");
    if (!sessionsDone) list.push("Jumlah sesi yang sudah terlaksana belum diisi.");
    if (!periodLabel.trim()) list.push("Periode laporan belum diisi.");
    if (presensiCount < activeRows.length)
      list.push(`Presensi belum lengkap untuk ${activeRows.length - presensiCount} peserta.`);
    if (nilaiCount < activeRows.length)
      list.push(`Penilaian/catatan observasi belum lengkap untuk ${activeRows.length - nilaiCount} peserta.`);
    if (!evaluation.achievement.trim()) list.push("Evaluasi umum: pencapaian program belum diisi.");
    if (!conclusion.trim()) list.push("Kesimpulan belum diisi.");
    if (!recommendation.trim()) list.push("Rekomendasi belum diisi.");
    return list;
  }, [
    teacherName, sessionsDone, periodLabel, presensiCount, nilaiCount,
    activeRows.length, evaluation.achievement, conclusion, recommendation,
  ]);

  // isi cepat: samakan jumlah sesi semua peserta
  function applySessionsToAll(n: number) {
    setRows((prev) => prev.map((r) => (r.active ? { ...r, sessions_total: n } : r)));
  }

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    const payloadRows = rows.map((r) => ({
      ...r,
      attendance_pct: attendancePct(r),
      avg_score: avgScore(r),
    }));

    const { error } = await supabase.from("b2b_progress_reports").insert({
      cohort_slug: cohort.slug,
      cohort_label: cohort.label,
      lead_id: cohort.leadId,
      company_name: cohort.companyName,
      language: cohort.language,
      level: cohort.level,
      report_type: reportType,
      period_label: periodLabel.trim() || null,
      sessions_total: cohort.sessionsTotal,
      sessions_done: sessionsDone,
      grouped,
      teacher_id: cohort.teacherId,
      teacher_name: teacherName.trim(),
      teacher_email: teacherEmail.trim() || null,
      participants: payloadRows,
      evaluation,
      topics_covered: topics.trim() || null,
      challenges: challenges.trim() || null,
      conclusion: conclusion.trim() || null,
      recommendation: recommendation.trim() || null,
    });

    setSubmitting(false);
    if (error) {
      setSubmitError("Gagal mengirim. Cek koneksi lalu coba lagi — jawaban kamu masih tersimpan di perangkat ini.");
      return;
    }
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* abaikan */ }
    setStep(5);
  }

  const pct = step < 0 ? 0 : Math.round(((step + 1) / STEPS.length) * 100);

  // Header menempel di atas, jadi tiap pindah langkah wajib balik ke puncak —
  // kalau tidak, langkah baru terbuka di tengah-tengah scroll langkah sebelumnya.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const compact = useStickyCompact();

  return (
    <div className="min-h-screen w-full bg-slate-50 antialiased">
      <style>{`
        @keyframes b2b-fade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @keyframes b2b-pop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
        .b2b-fade{animation:b2b-fade .3s ease both}
        .b2b-pop{animation:b2b-pop .5s cubic-bezier(.2,.8,.2,1) both}
        button{-webkit-tap-highlight-color:transparent}
        .b2b-noscroll::-webkit-scrollbar{display:none}
      `}</style>

      {/* header floating — tetap kelihatan waktu pengajar scroll daftar peserta yang panjang */}
      <header
        className="sticky top-0 z-30 w-full border-b transition-[padding,box-shadow,background-color] duration-200"
        style={{
          background: compact ? "rgba(248,250,252,.88)" : "#f8fafc",
          backdropFilter: compact ? "saturate(180%) blur(10px)" : undefined,
          WebkitBackdropFilter: compact ? "saturate(180%) blur(10px)" : undefined,
          borderColor: compact ? "rgba(148,163,184,.28)" : "transparent",
          boxShadow: compact ? "0 10px 24px -22px rgba(15,23,42,.6)" : "none",
        }}
      >
        <div className={`mx-auto max-w-[720px] px-4 ${compact ? "pb-2 pt-2" : "pb-3 pt-5"} transition-all duration-200`}>
          <div className="flex items-center gap-3">
            <img
              src="/FULL_LOGO_LINGUO_HIJAU.png"
              alt="Linguo"
              className={`${compact ? "h-5" : "h-7"} w-auto transition-all duration-200`}
            />
            {!compact && (
              <span
                className="ml-1 rounded-md px-2 py-0.5 text-[10px] font-bold"
                style={{ background: "rgba(242,203,5,0.18)", color: "#9a7a06" }}
              >
                LAPORAN PROGRESS
              </span>
            )}
            <span className="ml-auto truncate text-[11px] font-bold text-slate-400">
              {compact && step >= 0 && step <= 4 ? `Langkah ${step + 1}/${STEPS.length} · ${STEPS[step].label}` : cohort.label}
            </span>
          </div>

          {step >= 0 && step <= 4 && (
            <div className={compact ? "mt-2" : "mt-3"}>
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: TEAL }} />
                </div>
                <span className="text-[11px] font-bold text-slate-400">{pct}%</span>
              </div>
              {!compact && (
                <div className="b2b-noscroll mt-2 flex items-center gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
                  {STEPS.map((s, i) => {
                    const Icon = s.icon;
                    const on = i === step;
                    const past = i < step;
                    return (
                      <button
                        key={s.label}
                        onClick={() => setStep(i)}
                        className="flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition"
                        style={{
                          background: on ? TEAL : past ? "rgba(22,121,110,.10)" : "#fff",
                          color: on ? "#fff" : past ? TEAL : "#94a3b8",
                          border: `1px solid ${on ? TEAL : "rgba(148,163,184,.35)"}`,
                        }}
                      >
                        {past ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-[720px] px-4 pb-8 pt-4">
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_18px_50px_-24px_rgba(15,23,42,0.25)] sm:p-6">
          {/* ── intro ── */}
          {step === -1 && (
            <div className="b2b-fade">
              <div className="mb-4 h-14 w-14 overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5">
                <CohortFlag flag={cohort.flag} companyName={cohort.companyName} />
              </div>
              <h1 className="text-[24px] font-extrabold leading-tight text-slate-900">
                Laporan Progress Kelas
              </h1>
              <p className="mt-1.5 text-[12px] font-bold leading-snug" style={{ color: TEAL }}>
                {cohort.companyName} · {cohort.language} · {cohort.level}
              </p>
              <p className="mt-2.5 text-[14px] leading-relaxed text-slate-500">
                Halo, {firstName(cohort.defaultTeacherName)}! Isian ini dipakai buat laporan progress
                yang dikirim ke klien di tengah program. Ada {cohort.roster.length} peserta — presensi,
                skor, dan catatan observasi per orang.
              </p>

              <div className="mt-4 space-y-2">
                <IntroPoint icon={Save} text="Jawaban tersimpan otomatis di perangkat ini. Boleh ditinggal dulu, lanjut kapan saja." />
                <IntroPoint icon={CloudDownload} text="Presensi (hadir & izin) ditarik otomatis dari klik presensimu di dashboard — tinggal dicek." />
                <IntroPoint icon={ClipboardList} text="Yang perlu kamu tulis: skor tiap peserta, catatan observasi, dan evaluasi umum." />
                <IntroPoint icon={Star} text="Skor pakai skala 1–5 (boleh setengah, mis. 4.5). Panduannya ada di dalam form." />
              </div>

              {savedAt && (
                <div
                  className="mt-4 flex items-start gap-2.5 rounded-2xl border p-3"
                  style={{ borderColor: "rgba(22,121,110,.35)", background: "rgba(22,121,110,.06)" }}
                >
                  <Info className="mt-0.5 h-4.5 w-4.5 shrink-0" style={{ color: TEAL }} />
                  <p className="text-[13px] font-semibold leading-relaxed" style={{ color: "#0F5A52" }}>
                    Ada draft tersimpan ({fmtWhen(savedAt)}). Lanjut isi dari terakhir kali.
                  </p>
                </div>
              )}

              <button
                onClick={() => setStep(0)}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-extrabold text-white transition active:scale-[.99]"
                style={{ background: TEAL }}
              >
                {savedAt ? "Lanjut isi laporan" : "Mulai isi laporan"} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ── 0. identitas ── */}
          {step === 0 && (
            <div className="b2b-fade space-y-5">
              <StepTitle n={1} title="Identitas & konteks laporan" />

              <Field label="Nama pengajar" required>
                <input
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className={inputCls}
                  placeholder="Nama lengkap"
                />
              </Field>

              <Field label="Email pengajar" hint="Buat konfirmasi kalau ada yang perlu ditanya admin.">
                <input
                  value={teacherEmail}
                  onChange={(e) => setTeacherEmail(e.target.value)}
                  className={inputCls}
                  placeholder="nama@email.com"
                  inputMode="email"
                />
              </Field>

              <Field label="Jenis laporan" required>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { v: "mid", t: "Tengah program", d: "Progress report di tengah kelas" },
                    { v: "final", t: "Akhir program", d: "Laporan penutup program" },
                  ] as const).map((o) => (
                    <button
                      key={o.v}
                      onClick={() => setReportType(o.v)}
                      className="rounded-2xl border p-3 text-left transition"
                      style={{
                        borderColor: reportType === o.v ? TEAL : "rgba(148,163,184,.4)",
                        background: reportType === o.v ? "rgba(22,121,110,.06)" : "#fff",
                      }}
                    >
                      <div className="text-[13px] font-extrabold text-slate-800">{o.t}</div>
                      <div className="mt-0.5 text-[11px] font-semibold text-slate-400">{o.d}</div>
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Periode laporan" required hint='Contoh: "Juni 2026 – Juli 2026" atau "Sesi 1–27".'>
                <input
                  value={periodLabel}
                  onChange={(e) => setPeriodLabel(e.target.value)}
                  className={inputCls}
                  placeholder="Juni 2026 – Juli 2026"
                />
              </Field>

              <Field
                label="Sesi yang sudah terlaksana"
                required
                hint={
                  syncState === "ready"
                    ? `Terisi otomatis dari dashboard. Dari total ${cohort.sessionsTotal} sesi kontrak.`
                    : `Dari total ${cohort.sessionsTotal} sesi kontrak. Angka ini jadi acuan default presensi.`
                }
              >
                <div className="flex items-center gap-2">
                  <input
                    value={sessionsDone ?? ""}
                    onChange={(e) => setSessionsDone(clampInt(e.target.value, 0, cohort.sessionsTotal))}
                    className={`${inputCls} max-w-[120px]`}
                    inputMode="numeric"
                    placeholder="0"
                  />
                  <span className="text-[13px] font-bold text-slate-400">/ {cohort.sessionsTotal} sesi</span>
                </div>
              </Field>

              <Field label="Kelas dibagi jadi beberapa grup?" hint="Kalau ya, nanti tiap peserta bisa ditandai grupnya (Kelas A / B / C).">
                <div className="flex gap-2">
                  {[
                    { v: true, t: "Ya, dibagi grup" },
                    { v: false, t: "Tidak, satu kelas" },
                  ].map((o) => (
                    <button
                      key={String(o.v)}
                      onClick={() => setGrouped(o.v)}
                      className="rounded-xl border px-3.5 py-2 text-[12px] font-extrabold transition"
                      style={{
                        borderColor: grouped === o.v ? TEAL : "rgba(148,163,184,.4)",
                        background: grouped === o.v ? "rgba(22,121,110,.06)" : "#fff",
                        color: grouped === o.v ? TEAL : "#64748b",
                      }}
                    >
                      {o.t}
                    </button>
                  ))}
                </div>
              </Field>

              <Field
                label="Peserta yang masih mengikuti kelas"
                hint="Hilangkan centang buat peserta yang sudah berhenti — dia gak akan diminta presensi/nilai."
              >
                <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
                  {rows.map((r, i) => (
                    <label key={r.name} className="flex cursor-pointer items-center gap-3 px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={r.active}
                        onChange={(e) => patch(i, { active: e.target.checked })}
                        className="h-4 w-4 shrink-0 accent-teal-700"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12.5px] font-bold text-slate-800">{titleCase(r.name)}</div>
                        {r.department && (
                          <div className="truncate text-[10.5px] font-semibold text-slate-400">{r.department}</div>
                        )}
                      </div>
                      {grouped && (
                        <select
                          value={r.group_label}
                          onChange={(e) => patch(i, { group_label: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-600"
                        >
                          <option value="">Grup…</option>
                          {cohort.groupOptions.map((g) => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      )}
                    </label>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] font-bold text-slate-400">
                  {activeRows.length} dari {rows.length} peserta aktif
                </p>
              </Field>

              <NavRow onBack={() => setStep(-1)} onNext={() => setStep(1)} nextLabel="Lanjut ke presensi" />
            </div>
          )}

          {/* ── 1. presensi ── */}
          {step === 1 && (
            <div className="b2b-fade space-y-4">
              <StepTitle n={2} title="Presensi peserta" />
              <p className="text-[13px] leading-relaxed text-slate-500">
                Angka <b>hadir</b> & <b>izin</b> ditarik otomatis dari presensi yang kamu klik di
                dashboard. Tinggal cek, pindahkan yang izin karena <b>sakit</b> ke kolomnya, lalu lanjut.
              </p>

              <SyncPanel
                state={syncState}
                sync={sync}
                syncedAt={syncedAt}
                unmatched={unmatched}
                onPull={() => pullAttendance(true)}
              />

              {sessionsDone ? (
                <button
                  onClick={() => applySessionsToAll(sessionsDone)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-[12px] font-extrabold transition"
                  style={{ borderColor: TEAL, color: TEAL, background: "rgba(22,121,110,.05)" }}
                >
                  <Check className="h-3.5 w-3.5" /> Set semua peserta ke {sessionsDone} sesi
                </button>
              ) : (
                <Warn text="Jumlah sesi terlaksana belum diisi di langkah 1 — isi dulu biar persentase kehadiran bisa dihitung." />
              )}

              <ProgressPill done={presensiCount} total={activeRows.length} label="peserta terisi" />

              <div className="space-y-2.5">
                {rows.map((r, i) => {
                  if (!r.active) return null;
                  const pctv = attendancePct(r);
                  const sum = (r.attended || 0) + (r.excused_work || 0) + (r.sick || 0);
                  const over = !!r.sessions_total && sum > r.sessions_total;
                  const isOpen = open === `p-${i}`;
                  return (
                    <PersonCard
                      key={r.name}
                      row={r}
                      grouped={grouped}
                      open={isOpen}
                      onToggle={() => setOpen(isOpen ? null : `p-${i}`)}
                      done={presensiDone(r)}
                      badge={pctv != null ? `${pctv}%` : null}
                      badgeTone={pctv == null ? "#94a3b8" : pctv >= 75 ? "#15803d" : pctv >= 50 ? "#b45309" : "#dc2626"}
                    >
                      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                        <NumField
                          label="Total sesi"
                          value={r.sessions_total}
                          onChange={(v) => patch(i, { sessions_total: v })}
                          max={cohort.sessionsTotal}
                        />
                        <NumField label="Hadir" value={r.attended} onChange={(v) => patch(i, { attended: v })} max={cohort.sessionsTotal} />
                        <NumField label="Izin kerja" value={r.excused_work} onChange={(v) => patch(i, { excused_work: v })} max={cohort.sessionsTotal} />
                        <NumField label="Sakit" value={r.sick} onChange={(v) => patch(i, { sick: v })} max={cohort.sessionsTotal} />
                      </div>
                      {over && (
                        <p className="mt-2 text-[11.5px] font-bold text-amber-600">
                          Hadir + izin + sakit ({sum}) lebih banyak dari total sesi ({r.sessions_total}). Cek lagi ya.
                        </p>
                      )}
                      {pctv != null && (
                        <p className="mt-2 text-[12px] font-bold text-slate-500">
                          Kehadiran: <span style={{ color: pctv >= 75 ? "#15803d" : pctv >= 50 ? "#b45309" : "#dc2626" }}>{pctv}%</span>
                        </p>
                      )}
                      <PersonSyncNote person={matchPerson(sync, r.name)} />
                      {grouped && (
                        <div className="mt-2.5">
                          <GroupSelect value={r.group_label} options={cohort.groupOptions} onChange={(v) => patch(i, { group_label: v })} />
                        </div>
                      )}
                    </PersonCard>
                  );
                })}
              </div>

              <NavRow onBack={() => setStep(0)} onNext={() => setStep(2)} nextLabel="Lanjut ke penilaian" />
            </div>
          )}

          {/* ── 2. penilaian ── */}
          {step === 2 && (
            <div className="b2b-fade space-y-4">
              <StepTitle n={3} title="Penilaian & catatan observasi" />
              <p className="text-[13px] leading-relaxed text-slate-500">
                Beri skor 3 aspek per peserta, lalu tulis 1–3 kalimat observasi. Catatan ini yang
                dibaca langsung oleh HR klien, jadi tulis konkret dan apresiatif.
              </p>

              <details className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                <summary className="cursor-pointer text-[12px] font-extrabold text-slate-700">
                  Panduan skala penilaian
                </summary>
                <div className="mt-2 space-y-1.5">
                  {SCALE_LEGEND.map((l) => (
                    <div key={l.range} className="text-[11.5px] leading-snug text-slate-500">
                      <b className="text-slate-700">{l.range} · {l.label}</b> — {l.desc}
                    </div>
                  ))}
                </div>
              </details>

              <ProgressPill done={nilaiCount} total={activeRows.length} label="peserta dinilai" />

              <div className="space-y-2.5">
                {rows.map((r, i) => {
                  if (!r.active) return null;
                  const avg = avgScore(r);
                  const band = scoreBand(avg);
                  const isOpen = open === `s-${i}`;
                  return (
                    <PersonCard
                      key={r.name}
                      row={r}
                      grouped={grouped}
                      open={isOpen}
                      onToggle={() => setOpen(isOpen ? null : `s-${i}`)}
                      done={nilaiDone(r)}
                      badge={avg != null ? avg.toFixed(1) : null}
                      badgeTone={band.tone}
                    >
                      <div className="space-y-2.5">
                        {SCORE_ASPECTS.map((a) => (
                          <div key={a.key} className="flex items-center gap-2.5">
                            <div className="min-w-0 flex-1">
                              <div className="text-[12.5px] font-bold text-slate-700">{a.label}</div>
                              <div className="text-[10.5px] font-semibold leading-snug text-slate-400">{a.hint}</div>
                            </div>
                            <select
                              value={r[a.key] ?? ""}
                              onChange={(e) =>
                                patch(i, { [a.key]: e.target.value === "" ? null : Number(e.target.value) } as Partial<ParticipantRow>)
                              }
                              className="shrink-0 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[12px] font-bold text-slate-700"
                            >
                              <option value="">Pilih…</option>
                              {SCORE_OPTIONS.map((v) => (
                                <option key={v} value={v}>{scoreOptionLabel(v)}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>

                      {avg != null && (
                        <div
                          className="mt-3 rounded-xl px-3 py-2 text-[12px] font-extrabold"
                          style={{ background: "rgba(22,121,110,.07)", color: band.tone }}
                        >
                          Rata-rata skor {avg.toFixed(1)} · {band.label}
                        </div>
                      )}

                      <div className="mt-3">
                        <div className="mb-1 text-[12px] font-extrabold text-slate-700">Catatan observasi performa</div>
                        <textarea
                          value={r.observation}
                          onChange={(e) => patch(i, { observation: e.target.value })}
                          rows={4}
                          className={`${inputCls} resize-y`}
                          placeholder="Contoh: Konsisten hadir dan aktif bertanya. Penguasaan kosakata dasar sudah kuat, mulai berani menyusun kalimat spontan saat roleplay di toko."
                        />
                        <p className="mt-1 text-[10.5px] font-bold text-slate-400">
                          {r.observation.trim().length} karakter (minimal 10)
                        </p>
                      </div>
                    </PersonCard>
                  );
                })}
              </div>

              <NavRow onBack={() => setStep(1)} onNext={() => setStep(3)} nextLabel="Lanjut ke evaluasi umum" />
            </div>
          )}

          {/* ── 3. evaluasi umum ── */}
          {step === 3 && (
            <div className="b2b-fade space-y-4">
              <StepTitle n={4} title="Evaluasi umum & kesimpulan" />

              <TextField
                label="Pencapaian & progress program"
                required
                hint="Gambaran besar: kurikulum jalan sesuai rencana? apa yang sudah tercapai?"
                value={evaluation.achievement}
                onChange={(v) => setEvaluation((p) => ({ ...p, achievement: v }))}
                placeholder="Secara keseluruhan program berjalan sesuai kurikulum A1.1 yang direncanakan…"
              />
              <TextField
                label="Perkembangan kompetensi"
                hint="Skill mana yang paling maju (listening/speaking/reading), mana yang masih perlu didorong."
                value={evaluation.competency}
                onChange={(v) => setEvaluation((p) => ({ ...p, competency: v }))}
                placeholder="Kemampuan reseptif seperti listening dan reading jadi area dengan kemajuan paling stabil…"
              />
              <TextField
                label="Relevansi dengan pekerjaan"
                hint="Sejauh mana materi kepakai di konteks kerja peserta."
                value={evaluation.workplace}
                onChange={(v) => setEvaluation((p) => ({ ...p, workplace: v }))}
                placeholder="Peserta mulai memakai kosakata Vietnam yang relevan dengan operasional harian…"
              />
              <TextField
                label="Keterlibatan belajar"
                hint="Suasana kelas, keaktifan diskusi, dinamika grup."
                value={evaluation.engagement}
                onChange={(v) => setEvaluation((p) => ({ ...p, engagement: v }))}
                placeholder="Tingkat keaktifan saat di dalam kelas sangat memuaskan, diskusi berjalan interaktif…"
              />
              <TextField
                label="Catatan operasional"
                hint="Mis. pola ketidakhadiran karena tugas kerja, kendala jadwal, permintaan klien."
                value={evaluation.operational_note}
                onChange={(v) => setEvaluation((p) => ({ ...p, operational_note: v }))}
                placeholder="Mayoritas ketidakhadiran disebabkan komitmen kerja (professional duties)…"
              />

              <TextField
                label="Materi yang sudah dibahas"
                hint="Topik/unit yang sudah selesai sampai laporan ini dibuat."
                value={topics}
                onChange={setTopics}
                placeholder="Sapaan & perkenalan, angka & harga, kosakata toko/gudang, percakapan transaksi dasar…"
              />
              <TextField
                label="Kendala di kelas"
                hint="Hal yang menghambat & butuh dukungan dari perusahaan/Linguo."
                value={challenges}
                onChange={setChallenges}
                placeholder="Kehadiran naik-turun karena jadwal meeting; sebagian peserta perlu sesi repetisi…"
              />

              <TextField
                label="Kesimpulan"
                required
                value={conclusion}
                onChange={setConclusion}
                placeholder="Program pelatihan ini efektif dalam meningkatkan awareness dan skill bahasa Vietnam karyawan…"
              />
              <TextField
                label="Rekomendasi"
                required
                hint="Saran konkret buat perusahaan & kelanjutan program."
                value={recommendation}
                onChange={setRecommendation}
                placeholder="Mendorong praktik singkat di lingkungan kerja; menjaga ritme kehadiran agar kompetensi terus berkembang…"
              />

              <NavRow onBack={() => setStep(2)} onNext={() => setStep(4)} nextLabel="Lihat ringkasan" />
            </div>
          )}

          {/* ── 4. review & kirim ── */}
          {step === 4 && (
            <div className="b2b-fade space-y-4">
              <StepTitle n={5} title="Periksa & kirim" />

              <div className="grid grid-cols-2 gap-2.5">
                <SummaryTile label="Peserta aktif" value={String(activeRows.length)} />
                <SummaryTile label="Sesi terlaksana" value={`${sessionsDone ?? "—"} / ${cohort.sessionsTotal}`} />
                <SummaryTile label="Rata-rata kehadiran" value={avgAttendanceLabel(activeRows)} />
                <SummaryTile label="Rata-rata skor kelas" value={avgClassScoreLabel(activeRows)} />
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full min-w-[520px] text-left text-[11.5px]">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-2.5 py-2 font-extrabold">Peserta</th>
                      <th className="px-2 py-2 text-center font-extrabold">Hadir</th>
                      <th className="px-2 py-2 text-center font-extrabold">%</th>
                      <th className="px-2 py-2 text-center font-extrabold">Skor</th>
                      <th className="px-2 py-2 text-center font-extrabold">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.filter((r) => r.active).map((r) => {
                      const a = attendancePct(r);
                      const s = avgScore(r);
                      return (
                        <tr key={r.name}>
                          <td className="px-2.5 py-2">
                            <div className="font-bold text-slate-800">{titleCase(r.name)}</div>
                            {grouped && r.group_label && (
                              <div className="text-[10px] font-bold text-slate-400">{r.group_label}</div>
                            )}
                          </td>
                          <td className="px-2 py-2 text-center font-bold text-slate-600">
                            {r.attended ?? "—"}/{r.sessions_total ?? "—"}
                          </td>
                          <td className="px-2 py-2 text-center font-extrabold" style={{ color: a == null ? "#94a3b8" : a >= 75 ? "#15803d" : a >= 50 ? "#b45309" : "#dc2626" }}>
                            {a == null ? "—" : `${a}%`}
                          </td>
                          <td className="px-2 py-2 text-center font-extrabold" style={{ color: scoreBand(s).tone }}>
                            {s == null ? "—" : s.toFixed(1)}
                          </td>
                          <td className="px-2 py-2 text-center">
                            {r.observation.trim().length >= 10
                              ? <Check className="mx-auto h-3.5 w-3.5 text-teal-700" />
                              : <span className="text-slate-300">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {missing.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
                  <div className="flex items-center gap-2 text-[12.5px] font-extrabold text-amber-800">
                    <AlertTriangle className="h-4 w-4" /> Masih ada yang belum lengkap
                  </div>
                  <ul className="mt-1.5 list-disc space-y-1 pl-5 text-[12px] font-semibold text-amber-800/90">
                    {missing.map((m) => <li key={m}>{m}</li>)}
                  </ul>
                  <p className="mt-2 text-[11.5px] font-bold text-amber-700">
                    Laporan tetap bisa dikirim, tapi bagian yang kosong akan ditanyakan lagi oleh admin.
                  </p>
                </div>
              )}

              {submitError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-[12.5px] font-bold text-rose-700">
                  {submitError}
                </div>
              )}

              <div className="flex gap-2.5">
                <button
                  onClick={() => setStep(3)}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3.5 text-[13px] font-extrabold text-slate-500"
                >
                  <ArrowLeft className="h-4 w-4" /> Kembali
                </button>
                <button
                  onClick={submit}
                  disabled={submitting || !teacherName.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-extrabold text-white transition active:scale-[.99] disabled:opacity-60"
                  style={{ background: TEAL }}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {submitting ? "Mengirim…" : "Kirim laporan"}
                </button>
              </div>
            </div>
          )}

          {/* ── 5. selesai ── */}
          {step === 5 && (
            <div className="b2b-fade py-4 text-center">
              <div className="b2b-pop mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "rgba(22,121,110,.10)" }}>
                <PartyPopper className="h-8 w-8" style={{ color: TEAL }} />
              </div>
              <h2 className="mt-4 text-[21px] font-extrabold text-slate-900">Laporan terkirim!</h2>
              <p className="mx-auto mt-2 max-w-[380px] text-[13.5px] leading-relaxed text-slate-500">
                Terima kasih, {firstName(teacherName)}. Laporan {cohort.label} sudah masuk ke dashboard
                Linguo dan akan dirapikan tim akademik sebelum dikirim ke {cohort.companyName.split("(")[0].trim()}.
              </p>
              <div className="mx-auto mt-4 flex max-w-[380px] items-start gap-2.5 rounded-2xl border p-3 text-left"
                style={{ borderColor: "rgba(22,121,110,.35)", background: "rgba(22,121,110,.06)" }}>
                <CircleCheck className="mt-0.5 h-4.5 w-4.5 shrink-0" style={{ color: TEAL }} />
                <p className="text-[12.5px] font-semibold leading-relaxed" style={{ color: "#0F5A52" }}>
                  Kalau ada koreksi, isi ulang form ini — versi terbaru yang dipakai, versi lama tetap
                  tersimpan sebagai riwayat.
                </p>
              </div>
            </div>
          )}
        </div>

        {step >= 0 && step <= 4 && savedAt && (
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-400">
            <Save className="h-3 w-3" /> Draft tersimpan otomatis · {fmtWhen(savedAt)}
          </p>
        )}
        <p className="mt-2 text-center text-[10.5px] font-bold text-slate-300">
          Linguo.id · form internal pengajar
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────── komponen kecil ───────────────────────────

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13.5px] font-semibold text-slate-800 outline-none transition placeholder:font-medium placeholder:text-slate-300 focus:border-teal-600";

function StepTitle({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="flex h-7 w-7 items-center justify-center rounded-xl text-[12px] font-extrabold text-white"
        style={{ background: TEAL }}
      >
        {n}
      </span>
      <h2 className="text-[17px] font-extrabold text-slate-900">{title}</h2>
    </div>
  );
}

function Field({
  label, hint, required, children,
}: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5">
        <div className="text-[12.5px] font-extrabold text-slate-700">
          {label} {required && <span style={{ color: YELLOW }}>*</span>}
        </div>
        {hint && <div className="mt-0.5 text-[11px] font-semibold leading-snug text-slate-400">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function TextField({
  label, hint, required, value, onChange, placeholder,
}: {
  label: string; hint?: string; required?: boolean;
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <Field label={label} hint={hint} required={required}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className={`${inputCls} resize-y`}
        placeholder={placeholder}
      />
    </Field>
  );
}

function NumField({
  label, value, onChange, max,
}: { label: string; value: number | null; onChange: (v: number | null) => void; max: number }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10.5px] font-extrabold uppercase tracking-wide text-slate-400">{label}</span>
      <input
        value={value ?? ""}
        onChange={(e) => onChange(clampInt(e.target.value, 0, max))}
        inputMode="numeric"
        placeholder="0"
        className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-center text-[14px] font-extrabold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-teal-600"
      />
    </label>
  );
}

function GroupSelect({
  value, options, onChange,
}: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-[11px] font-extrabold text-slate-500">Grup</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11.5px] font-bold text-slate-700"
      >
        <option value="">Belum dipilih</option>
        {options.map((g) => <option key={g} value={g}>{g}</option>)}
      </select>
    </label>
  );
}

function PersonCard({
  row, grouped, open, onToggle, done, badge, badgeTone, children,
}: {
  row: ParticipantRow; grouped: boolean; open: boolean; onToggle: () => void;
  done: boolean; badge: string | null; badgeTone: string; children: React.ReactNode;
}) {
  return (
    <div
      className="overflow-hidden rounded-2xl border transition"
      style={{ borderColor: done ? "rgba(22,121,110,.45)" : "rgba(148,163,184,.35)", background: done ? "rgba(22,121,110,.03)" : "#fff" }}
    >
      <button onClick={onToggle} className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold"
          style={{ background: done ? TEAL : "rgba(148,163,184,.18)", color: done ? "#fff" : "#64748b" }}
        >
          {done ? <Check className="h-3.5 w-3.5" /> : initials(row.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-extrabold text-slate-800">{titleCase(row.name)}</span>
          <span className="block truncate text-[10.5px] font-semibold text-slate-400">
            {[grouped && row.group_label, row.department].filter(Boolean).join(" · ") || "—"}
          </span>
        </span>
        {badge && (
          <span className="shrink-0 rounded-lg px-2 py-0.5 text-[11.5px] font-extrabold" style={{ background: "rgba(148,163,184,.12)", color: badgeTone }}>
            {badge}
          </span>
        )}
        {open ? <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" /> : <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />}
      </button>
      {open && <div className="border-t border-slate-100 px-3.5 py-3">{children}</div>}
    </div>
  );
}

/** Header nyusut begitu halaman di-scroll: chip langkah disembunyikan, tinggal
 *  bar progres + "Langkah 2/5 · Presensi" biar tidak makan layar HP. */
function useStickyCompact(threshold = 24) {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return compact;
}

/** [linguo-patch:b2b-report-presensi-sync-v1] status tarik presensi dari dashboard */
function SyncPanel({
  state, sync, syncedAt, unmatched, onPull,
}: {
  state: "idle" | "loading" | "ready" | "empty" | "error";
  sync: AttendanceSync | null;
  syncedAt: string | null;
  unmatched: string[];
  onPull: () => void;
}) {
  if (state === "idle" || state === "loading") {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-[12px] font-bold text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" style={{ color: TEAL }} />
        Menarik presensi dari dashboard…
      </div>
    );
  }

  if (state === "empty" || state === "error") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-[12px] font-bold leading-relaxed text-amber-800">
            {state === "empty"
              ? "Belum ada presensi tercatat di dashboard untuk kelas ini — isi manual di bawah. Kalau kamu sudah mengeklik presensinya di dashboard, coba tarik ulang."
              : "Gagal menarik presensi dari dashboard. Isi manual dulu, atau coba tarik ulang."}
          </p>
        </div>
        <button
          onClick={onPull}
          className="mt-2.5 flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-[11.5px] font-extrabold text-amber-700"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Tarik ulang
        </button>
      </div>
    );
  }

  const gap = sync ? sync.sessions_completed - sync.sessions_recorded : 0;
  return (
    <div className="rounded-2xl border p-3.5" style={{ borderColor: "rgba(22,121,110,.35)", background: "rgba(22,121,110,.06)" }}>
      <div className="flex items-start gap-2.5">
        <CloudDownload className="mt-0.5 h-4.5 w-4.5 shrink-0" style={{ color: TEAL }} />
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-extrabold" style={{ color: "#0F5A52" }}>
            Presensi ditarik dari dashboard · {sync?.sessions_recorded ?? 0} sesi tercatat
          </p>
          <p className="mt-1 text-[11.5px] font-semibold leading-relaxed" style={{ color: "#0F5A52", opacity: 0.85 }}>
            Kolom <b>Hadir</b> & <b>Izin kerja</b> sudah terisi dari klik presensimu di dashboard.
            Dashboard cuma punya status Hadir/Izin/Alfa — kalau ada yang izin karena <b>sakit</b>,
            geser angkanya ke kolom Sakit.
          </p>
          {gap > 0 && (
            <p className="mt-1.5 text-[11.5px] font-bold text-amber-700">
              Sesi berjalan di dashboard {sync?.sessions_completed} sesi, tapi baru {sync?.sessions_recorded} sesi
              yang dipresensi — {gap} sesi sisanya belum diklik. Lengkapi di dashboard lalu tarik ulang, atau
              betulkan angkanya manual di bawah.
            </p>
          )}
          {unmatched.length > 0 && (
            <p className="mt-1.5 text-[11.5px] font-bold text-amber-700">
              Tidak ketemu di presensi dashboard: {unmatched.join(", ")} — isi manual.
            </p>
          )}
        </div>
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <button
          onClick={onPull}
          className="flex items-center gap-1.5 rounded-xl border bg-white px-3 py-1.5 text-[11.5px] font-extrabold"
          style={{ borderColor: "rgba(22,121,110,.35)", color: TEAL }}
        >
          <RefreshCw className="h-3.5 w-3.5" /> Tarik ulang (timpa angka)
        </button>
        {syncedAt && <span className="text-[10.5px] font-bold text-slate-400">Terakhir: {fmtWhen(syncedAt)}</span>}
      </div>
    </div>
  );
}

function PersonSyncNote({ person }: { person: { sessions_recorded: number; hadir: number; izin: number; alfa: number } | null }) {
  if (!person) return null;
  return (
    <p className="mt-1.5 text-[10.5px] font-bold text-slate-400">
      Dashboard: {person.hadir} hadir · {person.izin} izin · {person.alfa} alfa dari {person.sessions_recorded} sesi tercatat
    </p>
  );
}

function ProgressPill({ done, total, label }: { done: number; total: number; label: string }) {
  const full = total > 0 && done === total;
  return (
    <div
      className="flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-extrabold"
      style={{ background: full ? "rgba(22,121,110,.08)" : "rgba(148,163,184,.12)", color: full ? TEAL : "#64748b" }}
    >
      <Users className="h-3.5 w-3.5" /> {done}/{total} {label}
      {full && <Check className="ml-auto h-3.5 w-3.5" />}
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-3">
      <div className="text-[10.5px] font-extrabold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 text-[17px] font-extrabold text-slate-800">{value}</div>
    </div>
  );
}

function IntroPoint({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: TEAL }} />
      <p className="text-[12.5px] font-semibold leading-relaxed text-slate-500">{text}</p>
    </div>
  );
}

function Warn({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <p className="text-[12px] font-bold leading-relaxed text-amber-800">{text}</p>
    </div>
  );
}

function NavRow({ onBack, onNext, nextLabel }: { onBack: () => void; onNext: () => void; nextLabel: string }) {
  return (
    <div className="flex gap-2.5 pt-1">
      <button
        onClick={onBack}
        className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3.5 text-[13px] font-extrabold text-slate-500"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali
      </button>
      <button
        onClick={onNext}
        className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-[14px] font-extrabold text-white transition active:scale-[.99]"
        style={{ background: TEAL }}
      >
        {nextLabel} <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Bendera bahasa cohort. Cohort tanpa bendera (atau kode yang belum punya SVG)
 *  jatuh ke inisial perusahaan, jangan pernah bendera bahasa cohort lain. */
function CohortFlag({ flag, companyName }: { flag: CohortConfig["flag"]; companyName: string }) {
  if (flag === "vn") return <VietnamFlag />;
  if (flag === "us") return <USFlag />;
  return (
    <div
      className="grid h-full w-full place-items-center text-[15px] font-extrabold text-white"
      style={{ background: TEAL }}
    >
      {initials(companyName.replace(/^PT\.?\s+/i, ""))}
    </div>
  );
}

function VietnamFlag() {
  return (
    <svg viewBox="0 0 60 40" preserveAspectRatio="xMidYMid slice" className="h-full w-full" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Bendera Vietnam">
      <rect width="60" height="40" fill="#DA251D" />
      <polygon points="30,9 32.59,16.44 40.46,16.6 34.18,21.36 36.47,28.9 30,24.4 23.53,28.9 25.82,21.36 19.54,16.6 27.41,16.44" fill="#FFFF00" />
    </svg>
  );
}

// 13 lajur + kanton 9 baris (6-5-6…) = 50 bintang. Di kotak 56px bintang digambar
// bulat kecil — polygon bintang di ukuran ini cuma jadi noda putih.
const US_STRIPE_H = 40 / 13;
const US_CANTON_W = 24;
const US_CANTON_H = US_STRIPE_H * 7;
const US_STAR_ROWS = Array.from({ length: 9 }, (_, row) => {
  const long = row % 2 === 0;                       // baris ganjil isi 6 bintang
  const count = long ? 6 : 5;
  const step = US_CANTON_W / 6;                     // 4 → jarak antar bintang
  return Array.from({ length: count }, (_, i) => ({
    cx: step * (long ? i + 0.5 : i + 1),
    cy: (US_CANTON_H / 9) * (row + 0.5),
  }));
}).flat();

function USFlag() {
  return (
    <svg viewBox="0 0 60 40" preserveAspectRatio="xMidYMid slice" className="h-full w-full" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Bendera Amerika Serikat">
      <rect width="60" height="40" fill="#FFFFFF" />
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={i} y={i * 2 * US_STRIPE_H} width="60" height={US_STRIPE_H} fill="#B22234" />
      ))}
      <rect width={US_CANTON_W} height={US_CANTON_H} fill="#3C3B6E" />
      {US_STAR_ROWS.map((s, i) => (
        <circle key={i} cx={s.cx} cy={s.cy} r="0.72" fill="#FFFFFF" />
      ))}
    </svg>
  );
}

// ─────────────────────────── util ───────────────────────────

function clampInt(raw: string, min: number, max: number): number | null {
  const digits = raw.replace(/[^\d]/g, "");
  if (digits === "") return null;
  return Math.max(min, Math.min(max, parseInt(digits, 10)));
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function titleCase(s: string) {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w.length <= 1 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

function firstName(s: string) {
  return (s.trim().split(/\s+/)[0] || "Kak").replace(/,$/, "");
}

function fmtWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function avgAttendanceLabel(rows: ParticipantRow[]) {
  const vals = rows.map(attendancePct).filter((v): v is number => v != null);
  if (!vals.length) return "—";
  return `${Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)}%`;
}

function avgClassScoreLabel(rows: ParticipantRow[]) {
  const vals = rows.map(avgScore).filter((v): v is number => v != null);
  if (!vals.length) return "—";
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
}

/** Draft lama + roster terbaru: pertahankan isian, ikuti daftar peserta terkini */
function mergeRoster(cohort: CohortConfig, saved: ParticipantRow[]): ParticipantRow[] {
  const byId = new Map(saved.map((r) => [r.participant_id || r.name, r]));
  return cohort.roster.map((p) => {
    const prev = byId.get(p.id) || byId.get(p.name);
    const base = makeRow(p, null);
    return prev ? { ...base, ...prev, name: p.name, department: p.department || "" } : base;
  });
}
