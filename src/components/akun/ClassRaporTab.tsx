'use client';

// [kelas-tab-v1] Tab Rapor di detail kelas siswa.
// Rapor = SNAPSHOT resmi yang DITERBITKAN pengajar (beda dgn tab Progress yang
// live): class_reports berisi rapor tengah (mid, ± sesi 8) & akhir (final),
// masing-masing skor 4 skill + ringkasan kehadiran + komentar pengajar.
// RLS memastikan siswa cuma bisa baca yang published_at-nya terisi — draft
// pengajar tak pernah sampai ke sini.
// Rapor bisa dicetak/simpan PDF; kalau rapor AKHIR sudah terbit, tombol
// Sertifikat ikut muncul (window cetak, pola sama printProgressNote pengajar).

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { cefr } from '@/components/akun/ClassProgressTab';
import { BarChart2, Award, Printer, Mic, Headphones, BookOpen, PenLine, type LucideIcon } from 'lucide-react';

const SKILLS: { key: string; label: string; Icon: LucideIcon }[] = [
  { key: 'speaking', label: 'Speaking', Icon: Mic },
  { key: 'listening', label: 'Listening', Icon: Headphones },
  { key: 'reading', label: 'Reading', Icon: BookOpen },
  { key: 'writing', label: 'Writing', Icon: PenLine },
];

const TYPE_LABEL: Record<string, string> = { mid: 'Rapor Tengah', final: 'Rapor Akhir' };

type SkillEntry = { score?: number; note?: string };

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Cetak rapor: window print sederhana (siswa bisa "Simpan sebagai PDF").
function printReport(opts: { report: any; studentName: string; reg: any; teacherName?: string }) {
  const { report, studentName, reg, teacherName } = opts;
  const w = window.open('', '_blank');
  if (!w) { alert('Popup diblokir. Izinkan popup untuk mencetak rapor.'); return; }
  const skills = (report.skills || {}) as Record<string, SkillEntry>;
  const att = report.attendance || {};
  const date = new Date(report.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(TYPE_LABEL[report.report_type] || 'Rapor')} — ${esc(studentName)}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',-apple-system,sans-serif; padding:40px; color:#1a1a1a; max-width:820px; margin:0 auto; }
  .header { display:flex; align-items:center; justify-content:space-between; border-bottom:3px solid #1A9E9E; padding-bottom:18px; margin-bottom:26px; }
  .logo { font-size:26px; font-weight:700; color:#1A9E9E; } .logo span { color:#F5A623; }
  .subtitle { font-size:11px; color:#888; }
  .badge { background:#1A9E9E; color:white; padding:4px 14px; border-radius:20px; font-size:12px; font-weight:600; }
  .info { background:#f8fffe; border:1px solid #e0f5f5; border-radius:12px; padding:18px; margin-bottom:22px; }
  .name { font-size:22px; font-weight:700; } .detail { font-size:13px; color:#666; margin-top:4px; }
  .st { font-size:13px; font-weight:700; color:#1A9E9E; margin-bottom:10px; text-transform:uppercase; letter-spacing:.5px; }
  .row { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
  .sn { width:110px; font-size:13px; font-weight:600; }
  .bar { flex:1; height:8px; background:#eee; border-radius:4px; overflow:hidden; }
  .fill { height:100%; background:#1A9E9E; border-radius:4px; }
  .val { width:140px; text-align:right; font-size:12px; font-weight:700; color:#1A9E9E; }
  .att { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin:6px 0 22px; }
  .att-card { background:#fffef5; border:1px solid #f5e6a3; border-radius:10px; padding:12px; text-align:center; }
  .att-num { font-size:20px; font-weight:700; color:#F5A623; } .att-lbl { font-size:11px; color:#888; margin-top:2px; }
  .note { background:#f9f9f9; border-left:3px solid #1A9E9E; padding:13px 15px; border-radius:0 8px 8px 0; margin-bottom:14px; font-size:13px; color:#444; line-height:1.6; }
  .footer { border-top:2px solid #eee; padding-top:14px; margin-top:28px; display:flex; justify-content:space-between; font-size:11px; color:#aaa; }
  @media print { body { padding:20px; } .no-print { display:none; } }
</style></head><body>
  <div class="no-print" style="text-align:center;margin-bottom:18px;">
    <button onclick="window.print()" style="background:#1A9E9E;color:white;border:none;padding:10px 30px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">📄 Cetak / Simpan PDF</button>
  </div>
  <div class="header">
    <div><div class="logo">Linguo<span>.id</span></div><div class="subtitle">Online Language School</div></div>
    <div class="badge">${esc((TYPE_LABEL[report.report_type] || 'RAPOR').toUpperCase())}</div>
  </div>
  <div class="info">
    <div class="name">${esc(studentName)}</div>
    <div class="detail">${esc(reg.language || '')}${reg.level ? ' — Level ' + esc(reg.level) : ''}${teacherName ? ' • Pengajar: ' + esc(teacherName) : ''}</div>
    <div class="detail" style="margin-top:2px;">Diterbitkan: ${date}</div>
  </div>
  <div class="st">Kemampuan 4 Skill · Standar CEFR</div>
  ${SKILLS.map(({ key, label }) => {
    const v = skills[key]?.score || 0;
    return `<div class="row"><div class="sn">${label}</div><div class="bar"><div class="fill" style="width:${(v / 5) * 100}%"></div></div><div class="val">${v ? cefr(v).band + ' · ' + cefr(v).name : '-'}</div></div>` +
      (skills[key]?.note ? `<div style="font-size:11px;color:#777;margin:-6px 0 10px 120px;">${esc(skills[key]!.note!)}</div>` : '');
  }).join('')}
  <div class="st" style="margin-top:18px;">Kehadiran</div>
  <div class="att">
    <div class="att-card"><div class="att-num">${att.attended ?? '-'}/${att.total ?? '-'}</div><div class="att-lbl">Sesi hadir</div></div>
    <div class="att-card"><div class="att-num">${att.rate ?? '-'}%</div><div class="att-lbl">Tingkat kehadiran</div></div>
    <div class="att-card"><div class="att-num">${att.hangus ?? 0}</div><div class="att-lbl">Sesi hangus</div></div>
    <div class="att-card"><div class="att-num">${att.cancelled ?? 0}</div><div class="att-lbl">Sesi batal</div></div>
  </div>
  ${report.teacher_comment ? `<div class="st">Komentar Pengajar</div><div class="note">${esc(report.teacher_comment)}</div>` : ''}
  ${report.recommendation ? `<div class="st">Rekomendasi</div><div class="note" style="border-left-color:#F5A623;">${esc(report.recommendation)}</div>` : ''}
  <div class="footer"><div>Linguo.id — Online Language School</div><div>Dicetak ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div></div>
</body></html>`);
  w.document.close();
}

// Sertifikat penyelesaian — muncul kalau rapor AKHIR sudah terbit.
function printCertificate(opts: { studentName: string; reg: any; teacherName?: string; finalReport: any }) {
  const { studentName, reg, teacherName, finalReport } = opts;
  const w = window.open('', '_blank');
  if (!w) { alert('Popup diblokir. Izinkan popup untuk membuka sertifikat.'); return; }
  const certNo = `LNG-${String(reg.id || '').replace(/-/g, '').slice(0, 10).toUpperCase()}`;
  const date = new Date(finalReport.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Sertifikat — ${esc(studentName)}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Georgia',serif; background:#f4f6f6; padding:30px; }
  .cert { max-width:860px; margin:0 auto; background:white; border:3px solid #1A9E9E; border-radius:8px; padding:14px; }
  .inner { border:1px solid #c9e8e8; border-radius:4px; padding:52px 48px; text-align:center; position:relative; }
  .logo { font-family:'Inter',-apple-system,sans-serif; font-size:24px; font-weight:700; color:#1A9E9E; letter-spacing:.5px; }
  .logo span { color:#F5A623; }
  .title { font-size:34px; color:#1a1a1a; margin:26px 0 6px; letter-spacing:2px; }
  .sub { font-family:'Inter',sans-serif; font-size:12px; color:#888; text-transform:uppercase; letter-spacing:3px; }
  .name { font-size:38px; color:#1A9E9E; margin:28px 0 4px; border-bottom:2px solid #e0f0f0; display:inline-block; padding:0 30px 8px; }
  .desc { font-family:'Inter',sans-serif; font-size:14px; color:#555; line-height:1.8; margin-top:18px; }
  .desc b { color:#1a1a1a; }
  .meta { display:flex; justify-content:space-between; margin-top:56px; font-family:'Inter',sans-serif; font-size:12px; color:#666; }
  .sign { text-align:center; }
  .sign .line { border-top:1px solid #999; padding-top:6px; margin-top:36px; min-width:180px; font-weight:600; color:#1a1a1a; }
  .certno { position:absolute; top:18px; right:22px; font-family:'Inter',sans-serif; font-size:10px; color:#aab; }
  @media print { body { background:white; padding:0; } .no-print { display:none; } @page { size: landscape; margin: 8mm; } }
</style></head><body>
  <div class="no-print" style="text-align:center;margin-bottom:18px;">
    <button onclick="window.print()" style="background:#1A9E9E;color:white;border:none;padding:10px 30px;border-radius:8px;font-family:Inter,sans-serif;font-size:14px;font-weight:600;cursor:pointer;">📄 Cetak / Simpan PDF</button>
  </div>
  <div class="cert"><div class="inner">
    <div class="certno">No: ${certNo}</div>
    <div class="logo">Linguo<span>.id</span></div>
    <div class="title">SERTIFIKAT</div>
    <div class="sub">Penyelesaian Program Belajar</div>
    <div class="name">${esc(studentName)}</div>
    <div class="desc">
      telah menyelesaikan program pembelajaran<br/>
      <b>Bahasa ${esc(reg.language || '')}${reg.level ? ' — Level ' + esc(reg.level) : ''}</b><br/>
      sebanyak <b>${reg.sessions_total || '-'} sesi</b> di Linguo.id Online Language School
    </div>
    <div class="meta">
      <div class="sign"><div class="line">${esc(teacherName || 'Pengajar')}</div><div>Pengajar</div></div>
      <div style="align-self:end; color:#888;">Diterbitkan ${date}</div>
      <div class="sign"><div class="line">Linguo.id</div><div>Online Language School</div></div>
    </div>
  </div></div>
</body></html>`);
  w.document.close();
}

export default function ClassRaporTab({ reg, teacherName }: { reg: any; teacherName?: string }) {
  const [reports, setReports] = useState<any[] | null>(null); // null = loading
  const [studentName, setStudentName] = useState<string>('');

  useEffect(() => {
    let alive = true;
    (async () => {
      const [repRes, stuRes] = await Promise.all([
        supabase
          .from('class_reports')
          .select('id, report_type, skills, attendance, teacher_comment, recommendation, published_at')
          .eq('registration_id', reg.id)
          .not('published_at', 'is', null)
          .order('published_at', { ascending: true }),
        reg.student_id
          ? supabase.from('students').select('name').eq('id', reg.student_id).maybeSingle()
          : Promise.resolve({ data: null } as any),
      ]);
      if (!alive) return;
      if (repRes.error) {
        // Tabel belum dimigrasi / policy belum ada → empty state, jangan crash.
        console.warn('[kelas-rapor] gagal load class_reports:', repRes.error.message);
        setReports([]);
      } else {
        setReports(repRes.data || []);
      }
      if (stuRes?.data?.name) setStudentName(stuRes.data.name);
    })();
    return () => { alive = false; };
  }, [reg.id, reg.student_id]);

  if (reports === null) {
    return <div className="py-10 text-center text-gray-400">Memuat…</div>;
  }

  const finalReport = reports.find((r) => r.report_type === 'final');

  if (reports.length === 0) {
    return (
      <div className="py-14 text-center text-gray-400">
        <BarChart2 className="mx-auto mb-2 h-9 w-9" strokeWidth={1.5} />
        <div className="text-sm text-gray-500">Belum ada rapor yang diterbitkan</div>
        <div className="mt-1 text-xs">Pengajar menerbitkan Rapor Tengah (± sesi 8) dan Rapor Akhir di akhir program</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Sertifikat — hanya setelah rapor akhir terbit */}
      {finalReport && (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 sm:flex-row sm:items-center">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Award className="h-6 w-6" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-gray-900">Sertifikat Penyelesaian</div>
            <div className="text-xs text-gray-500">Selamat! 🎉 Program {reg.language} {reg.level || ''} sudah selesai — sertifikatmu siap diunduh.</div>
          </div>
          <button
            onClick={() => printCertificate({ studentName: studentName || 'Siswa', reg, teacherName, finalReport })}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-600"
          >
            <Award className="h-4 w-4" strokeWidth={2.5} /> Unduh Sertifikat
          </button>
        </div>
      )}

      {[...reports].reverse().map((r) => {
        const skills = (r.skills || {}) as Record<string, SkillEntry>;
        const att = r.attendance || {};
        const rated = SKILLS.filter((s) => skills[s.key]?.score);
        const avg = rated.length ? rated.reduce((a, s) => a + (skills[s.key].score || 0), 0) / rated.length : 0;
        return (
          <div key={r.id} className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold ${r.report_type === 'final' ? 'bg-[#16796E] text-white' : 'bg-[#16796E]/10 text-[#16796E]'}`}>
                  {TYPE_LABEL[r.report_type] || 'Rapor'}
                </span>
                <div className="mt-1.5 text-xs text-gray-400">
                  Diterbitkan {new Date(r.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <button
                onClick={() => printReport({ report: r, studentName: studentName || 'Siswa', reg, teacherName })}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
              >
                <Printer className="h-3.5 w-3.5" strokeWidth={2.5} /> Cetak
              </button>
            </div>

            {/* Skor skill */}
            <div className="mt-4 space-y-2.5">
              {SKILLS.map(({ key, label, Icon }) => {
                const v = skills[key]?.score || 0;
                return (
                  <div key={key}>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-gray-800">
                        <Icon className="h-4 w-4 text-[#16796E]" strokeWidth={2} /> {label}
                      </span>
                      {v ? (
                        <span className="text-[13px] font-bold text-[#16796E]">
                          <span className="mr-1.5 rounded bg-[#16796E]/10 px-1.5 py-0.5 text-xs">{cefr(v).band}</span>
                          {cefr(v).name}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#16796E] to-emerald-500" style={{ width: `${(v / 5) * 100}%` }} />
                    </div>
                    {skills[key]?.note && <div className="mt-0.5 text-[11px] text-gray-500">{skills[key].note}</div>}
                  </div>
                );
              })}
              {avg > 0 && (
                <div className="pt-1 text-right text-xs font-semibold text-gray-500">
                  Rata-rata <span className="text-[#16796E]">{avg.toFixed(1)}/5.0 · ≈ {cefr(avg).band} {cefr(avg).name}</span>
                </div>
              )}
            </div>

            {/* Kehadiran */}
            {(att.total || att.attended) && (
              <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                {[
                  { v: `${att.attended ?? '-'}/${att.total ?? '-'}`, l: 'Hadir' },
                  { v: `${att.rate ?? '-'}%`, l: 'Kehadiran' },
                  { v: att.hangus ?? 0, l: 'Hangus' },
                  { v: att.cancelled ?? 0, l: 'Batal' },
                ].map((x, i) => (
                  <div key={i} className="rounded-xl bg-gray-50 py-2.5">
                    <div className="text-sm font-bold text-gray-900">{x.v}</div>
                    <div className="text-[10px] text-gray-500">{x.l}</div>
                  </div>
                ))}
              </div>
            )}

            {r.teacher_comment && (
              <div className="mt-4 rounded-xl border-l-[3px] border-[#16796E] bg-[#F0FAF8] px-4 py-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#16796E]">Komentar Pengajar</div>
                <div className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-gray-700">{r.teacher_comment}</div>
              </div>
            )}
            {r.recommendation && (
              <div className="mt-2.5 rounded-xl border-l-[3px] border-amber-400 bg-amber-50 px-4 py-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Rekomendasi</div>
                <div className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-gray-700">{r.recommendation}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
