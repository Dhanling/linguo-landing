'use client';

// [rapor-tab-siswa-v1] Menu "Rapor" di sidebar /akun, tepat setelah Sertifikat.
// Rapor sudah ada di dalam detail tiap kelas (ClassRaporTab); menu ini jadi satu pintu
// untuk semua kelas siswa: pilih kelas → lihat rapor yang SUDAH diterbitkan pengajar
// (draft tidak pernah sampai ke sini, RLS class_reports membatasi published_at).

import { useEffect, useMemo, useState } from 'react';
import { BarChart2 } from 'lucide-react';
import ClassRaporTab from '@/components/akun/ClassRaporTab';
import { useT } from '@/lib/uiLang';

export default function RaporTab({ regs }: { regs: any[] }) {
  const t = useT();
  const kelas = useMemo(
    () => [...(regs || [])].sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || ''))),
    [regs],
  );
  const [selId, setSelId] = useState<string | null>(null);
  useEffect(() => {
    if (!kelas.length) { setSelId(null); return; }
    if (!selId || !kelas.some((r) => r.id === selId)) setSelId(kelas[0].id);
  }, [kelas, selId]);
  const sel = kelas.find((r) => r.id === selId) || null;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-4">
        <h2 className="text-[18px] font-extrabold text-[#12172B]">{t('Rapor')}</h2>
        <p className="mt-1 text-[13px] text-[#6B7280]">
          {t('Rapor hasil belajarmu dari pengajar: tiap 4 sesi dan di akhir program.')}
        </p>
      </div>

      {kelas.length === 0 ? (
        <div className="py-14 text-center text-gray-400">
          <BarChart2 className="mx-auto mb-2 h-9 w-9" strokeWidth={1.5} />
          <div className="text-sm text-gray-500">{t('Belum ada kelas aktif')}</div>
        </div>
      ) : (
        <>
          {kelas.length > 1 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {kelas.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelId(r.id)}
                  className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold transition ${r.id === selId ? 'bg-[#16796E] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                >
                  {r.language}{r.level ? ` ${r.level}` : ''}
                </button>
              ))}
            </div>
          )}
          {sel && (
            <ClassRaporTab
              key={sel.id}
              reg={sel}
              teacherName={sel.teachers?.nickname || sel.teachers?.name || undefined}
              teacherFullName={sel.teachers?.name || undefined}
            />
          )}
        </>
      )}
    </div>
  );
}
