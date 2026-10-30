'use client';

// [kelas-tab-v1] Tab Rapor di detail kelas siswa.
// Rapor = SNAPSHOT resmi yang DITERBITKAN pengajar (beda dgn tab Progress yang
// live): class_reports berisi rapor berkala tiap 4 sesi (s4, s8, … —
// [rapor-berkala-v1], cermin src/lib/raporBerkala.ts di dashboard admin), rapor
// tengah gaya lama (mid) & akhir (final), masing-masing skor 4 skill + ringkasan
// kehadiran + komentar pengajar.
// RLS memastikan siswa cuma bisa baca yang published_at-nya terisi — draft
// pengajar tak pernah sampai ke sini.
// Rapor bisa dicetak/simpan PDF; kalau rapor AKHIR sudah terbit, tombol
// Sertifikat ikut muncul (window cetak, pola sama printProgressNote pengajar).

import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import RaporPaper from './RaporPaper';
import { TTD_RINI } from './simulasi/CertificateSheet';
import { prepareCertificatePrintImages } from '@/lib/certificateImages';
import { supabase } from '@/lib/supabase-client';
import { cefr } from '@/components/akun/ClassProgressTab';
import { BarChart2, Award, Printer, Mic, Headphones, BookOpen, PenLine, type LucideIcon } from 'lucide-react';
import { useT, useUiLang } from '@/lib/uiLang'; // [ui-lang-switcher-v1]
import { sapaan } from "@/lib/teacherName"; // [panggilan-pengajar-v1]

const SKILLS: { key: string; label: string; Icon: LucideIcon }[] = [
  { key: 'speaking', label: 'Speaking', Icon: Mic },
  { key: 'listening', label: 'Listening', Icon: Headphones },
  { key: 'reading', label: 'Reading', Icon: BookOpen },
  { key: 'writing', label: 'Writing', Icon: PenLine },
];

const TYPE_LABEL: Record<string, string> = { mid: 'Rapor Tengah', final: 'Rapor Akhir' };
// "s8" → sesi 8; null untuk mid/final.
const raporSesi = (type: string): number | null => { const m = /^s(\d+)$/.exec(type || ''); return m ? Number(m[1]) : null; };

type SkillEntry = { score?: number; note?: string; nilai?: number };

// [rapor-nilai-v1] Nilai 0–100 per skill + ringkasan nilai akhir, disimpan pengajar di
// class_reports.skills (skills.<skill>.nilai & skills.ringkasan). Cermin dari
// linguo-admin-dashboard/src/lib/raporNilai.ts — rapor lama tanpa nilai tetap tampil
// seperti dulu (CEFR saja).
type Ringkasan = {
  nilai_akhir: number; rata_skill: number;
  kuis: { rata: number; jumlah: number } | null;
  pr: { dikumpulkan: number; diberikan: number; persen: number } | null;
  hadir: { persen: number } | null;
  bobot: { skill: number; kuis: number; pr: number; hadir: number };
  status?: 'lulus' | 'bersyarat' | 'ulang';
};
const ringkasanDari = (skills: any): Ringkasan | null => {
  const r = skills?.ringkasan;
  return r && Number.isFinite(r.nilai_akhir) ? r : null;
};
function predikat(n: number): { huruf: string; label: string } {
  if (n >= 85) return { huruf: 'A', label: 'Sangat Baik' };
  if (n >= 70) return { huruf: 'B', label: 'Baik' };
  if (n >= 55) return { huruf: 'C', label: 'Cukup' };
  return { huruf: 'D', label: 'Perlu Latihan' };
}
const STATUS_LABEL: Record<string, string> = {
  lulus: 'Lulus — siap lanjut ke level berikutnya',
  bersyarat: 'Lulus bersyarat — disarankan penguatan dulu',
  ulang: 'Disarankan mengulang level ini',
};

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Cetak memakai kertas yang sama dengan halaman rapor pada unduhan sertifikat.
function printReport(opts: { report: any; studentName: string; reg: any; teacherName?: string }) {
  const { report, studentName, reg, teacherName } = opts;
  const w = window.open('', '_blank', 'width=1180,height=880');
  if (!w) { alert('Popup diblokir. Izinkan popup untuk mencetak rapor.'); return; }
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Rapor — ${esc(studentName)}</title><style>
    * { box-sizing: border-box; } body { margin: 0; background: #fff9e8; }
    .cert-paper { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .no-print { padding: 16px; text-align: center; }
    button { padding: 10px 24px; border: 0; border-radius: 8px; background: #1A9E9E; color: white; cursor: pointer; }
    @page { size: A4 landscape; margin: 0; }
    @media print { .no-print { display: none; } }
  </style></head><body><div id="report-root"></div></body></html>`);
  w.document.close();
  const root = createRoot(w.document.getElementById('report-root')!);
  const print = async () => {
    try {
      const paper = w.document.querySelector<HTMLElement>('[data-rapor-paper]');
      if (!paper) return;
      await prepareCertificatePrintImages(paper);
      await Promise.all(Array.from(paper.querySelectorAll('img')).map(img => img.decode()));
      w.focus();
      w.print();
    } catch {
      w.alert('Gambar rapor belum siap. Coba cetak lagi setelah gambar selesai dimuat.');
    }
  };
  root.render(<>
    <div className="no-print"><button onClick={print}>Cetak / Simpan PDF</button></div>
    <div style={{ width: 1120 }}>
      <RaporPaper report={report} name={studentName} language={reg.language || ''} level={reg.level || ''} programme={reg.programme || reg.class_type || ''} teacher={teacherName || '—'} signature={TTD_RINI.src} signer={{ name: TTD_RINI.nama, role: TTD_RINI.jabatan }} />
    </div>
  </>);
  w.addEventListener('beforeunload', () => root.unmount(), { once: true });
}

// [rapor-ke-sertifikat-v1] Dulu tombol ini mencetak sertifikat versi lama di jendela baru
// (nama "Siswa", tanpa rapor) — beda dari menu Sertifikat (sertifikat + rapor 2 halaman).
// Sekarang satu pintu: menu Sertifikat dengan kelas ini terpilih.
function bukaSertifikat(reg: any, onOpen?: () => void) {
  if (onOpen) { onOpen(); return; }
  const sp = new URLSearchParams();
  const preview = new URLSearchParams(window.location.search).get('preview');
  if (preview) sp.set('preview', preview);
  sp.set('menu', 'sertifikat');
  sp.set('cert', String(reg.id));
  window.location.href = `/akun?${sp.toString()}`;
}

// [teacher-sapaan-v1] `teacherName` = sapaan buat layar ("Kak Dhani"),
// `teacherFullName` = nama lengkap (dulu dicetak di rapor). [panggilan-pengajar-v1]
// Owner 18 Okt 2026: nama lengkap pengajar tak pernah tampil ke siswa, termasuk
// dokumen cetak — rapor kini memakai sapaan juga.
// [rapor-ke-sertifikat-v1] `onOpenSertifikat` = buka menu Sertifikat in-shell dengan kelas ini
// terpilih. Tanpa itu (halaman /akun/kelas/[id]) tombol pindah ke /akun?menu=sertifikat&cert=<id>.
export default function ClassRaporTab({ reg, teacherName, teacherFullName, onOpenSertifikat }: { reg: any; teacherName?: string; teacherFullName?: string; onOpenSertifikat?: () => void }) {
  const t = useT(); // [ui-lang-switcher-v1]
  const uiLang = useUiLang();
  const dateLocale = uiLang === 'en' ? 'en-GB' : 'id-ID';
  const [reports, setReports] = useState<any[] | null>(null); // null = loading
  const [studentName, setStudentName] = useState<string>('');

  useEffect(() => {
    let alive = true;
    // [rapor-pratinjau-v1] Pratinjau POV staf tak punya sesi siswa → query
    // class_reports di klien kena RLS (role anon) dan pulang NOL baris, jadi rapor
    // yang sudah terbit tampil "Belum ada rapor" (kasus Anita Marliani 17 Okt 2026).
    // /api/preview-student sudah mengirim barisnya di reg.class_reports — pakai itu.
    if (Array.isArray(reg?.class_reports)) {
      const rows = [...reg.class_reports]
        .filter((r: any) => r.published_at)
        .sort((a: any, b: any) => String(a.published_at).localeCompare(String(b.published_at)));
      setReports(rows);
      const nm = reg?.students?.name || reg?.student_name;
      if (nm) setStudentName(nm);
      return () => { alive = false; };
    }
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
  }, [reg.id, reg.student_id, reg?.class_reports]);

  if (reports === null) {
    return <div className="py-10 text-center text-gray-400">{t('Memuat…')}</div>;
  }

  const finalReport = reports.find((r) => r.report_type === 'final');

  if (reports.length === 0) {
    return (
      <div className="py-14 text-center text-gray-400">
        <BarChart2 className="mx-auto mb-2 h-9 w-9" strokeWidth={1.5} />
        <div className="text-sm text-gray-500">{t('Belum ada rapor yang diterbitkan')}</div>
        <div className="mt-1 text-xs">{t('Pengajar menerbitkan rapor tiap 4 sesi dan Rapor Akhir di akhir program')}</div>
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
            <div className="text-sm font-bold" style={{ color: '#12172B' }}>{t('Sertifikat Penyelesaian')}</div>
            <div className="text-xs" style={{ color: '#6B7280' }}>{t('Selamat! 🎉 Program')} {reg.language} {reg.level || ''} {t('sudah selesai — sertifikat & rapor akhirmu ada di menu Sertifikat.')}</div>
          </div>
          <button
            onClick={() => bukaSertifikat(reg, onOpenSertifikat)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-600"
          >
            <Award className="h-4 w-4" strokeWidth={2.5} /> {t('Lihat Sertifikat')}
          </button>
        </div>
      )}

      {[...reports].reverse().map((r) => {
        const skills = (r.skills || {}) as Record<string, SkillEntry>;
        const att = r.attendance || {};
        const rated = SKILLS.filter((s) => skills[s.key]?.score);
        const avg = rated.length ? rated.reduce((a, s) => a + (skills[s.key].score || 0), 0) / rated.length : 0;
        const rk = ringkasanDari(r.skills);
        const adaNilai = SKILLS.some(({ key }) => Number.isFinite(skills[key]?.nilai));
        return (
          <div key={r.id} className="rounded-2xl bg-white p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold ${r.report_type === 'final' ? 'bg-[#16796E] text-white' : 'bg-[#16796E]/10 text-[#16796E]'}`}>
                  {raporSesi(r.report_type) ? `${t('Rapor Sesi')} ${raporSesi(r.report_type)}` : t(TYPE_LABEL[r.report_type] || 'Rapor')}
                </span>
                <div className="mt-1.5 text-xs text-gray-400">
                  {t('Diterbitkan')} {new Date(r.published_at).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <button
                onClick={() => printReport({ report: r, studentName: studentName || 'Siswa', reg, teacherName: teacherName || (teacherFullName ? sapaan(teacherFullName) : undefined) })}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
              >
                <Printer className="h-3.5 w-3.5" strokeWidth={2.5} /> {t('Cetak')}
              </button>
            </div>

            {/* [rapor-nilai-v1] Nilai akhir */}
            {rk && (
              <div className="mt-4 flex items-center gap-4 rounded-2xl bg-[#F0FAF8] p-4">
                <div className="shrink-0 text-center">
                  <div className="text-4xl font-extrabold leading-none text-[#16796E]">{rk.nilai_akhir}</div>
                  <div className="mt-1 text-[11px] font-bold text-gray-700">{predikat(rk.nilai_akhir).huruf} · {t(predikat(rk.nilai_akhir).label)}</div>
                </div>
                <div className="min-w-0 flex-1 text-[11.5px] leading-relaxed text-gray-600">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#16796E]">{t('Nilai Akhir')}</div>
                  <div>
                    {t('Skill')} {rk.rata_skill}
                    {rk.kuis ? <> · {t('Kuis')} {rk.kuis.rata}</> : null}
                    {rk.pr ? <> · PR {rk.pr.dikumpulkan}/{rk.pr.diberikan}</> : null}
                    {rk.hadir ? <> · {t('Kehadiran')} {rk.hadir.persen}%</> : null}
                  </div>
                  {rk.status && (
                    <div className={`mt-1 font-bold ${rk.status === 'ulang' ? 'text-red-600' : rk.status === 'bersyarat' ? 'text-amber-600' : 'text-[#16796E]'}`}>
                      {t(STATUS_LABEL[rk.status] || '')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Skor skill */}
            <div className="mt-4 space-y-2.5">
              {SKILLS.map(({ key, label, Icon }) => {
                const v = skills[key]?.score || 0;
                const n = skills[key]?.nilai;
                if (adaNilai) {
                  const nv = Number.isFinite(n) ? (n as number) : 0;
                  return (
                    <div key={key}>
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-gray-800">
                          <Icon className="h-4 w-4 text-[#16796E]" strokeWidth={2} /> {label}
                        </span>
                        {Number.isFinite(n) ? (
                          <span className="text-[13px] font-bold text-[#16796E]">
                            {v ? <span className="mr-1.5 rounded bg-[#16796E]/10 px-1.5 py-0.5 text-xs">{cefr(v).band}</span> : null}
                            {nv} <span className="text-xs text-gray-500">· {predikat(nv).huruf}</span>
                          </span>
                        ) : <span className="text-xs text-gray-400">-</span>}
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#16796E] to-emerald-500" style={{ width: `${nv}%` }} />
                      </div>
                      {skills[key]?.note && <div className="mt-0.5 text-[11px] text-gray-500">{skills[key].note}</div>}
                    </div>
                  );
                }
                return (
                  <div key={key}>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-gray-800">
                        <Icon className="h-4 w-4 text-[#16796E]" strokeWidth={2} /> {label}
                      </span>
                      {v ? (
                        <span className="text-[13px] font-bold text-[#16796E]">
                          <span className="mr-1.5 rounded bg-[#16796E]/10 px-1.5 py-0.5 text-xs">{cefr(v).band}</span>
                          {t(cefr(v).name)}
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
              {avg > 0 && !adaNilai && (
                <div className="pt-1 text-right text-xs font-semibold text-gray-500">
                  {t('Rata-rata')} <span className="text-[#16796E]">{avg.toFixed(1)}/5.0 · ≈ {cefr(avg).band} {t(cefr(avg).name)}</span>
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
                    <div className="text-[10px] text-gray-500">{t(x.l)}</div>
                  </div>
                ))}
              </div>
            )}

            {r.teacher_comment && (
              <div className="mt-4 rounded-xl border-l-[3px] border-[#16796E] bg-[#F0FAF8] px-4 py-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#16796E]">{t('Komentar Pengajar')}</div>
                <div className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-gray-700">{r.teacher_comment}</div>
              </div>
            )}
            {r.recommendation && (
              <div className="mt-2.5 rounded-xl border-l-[3px] border-amber-400 bg-amber-50 px-4 py-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600">{t('Rekomendasi')}</div>
                <div className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-gray-700">{r.recommendation}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
