'use client';

/* [konfirmasi-hadir-v2] Kartu "Konfirmasi kehadiran" di Beranda /akun.

   Laporan d17e4f68 (Victoria → Mita/Pramita, 4 Nov 2026; dibuka ulang 9 Nov):
   "Tombol kehadiran masih belum bisa ditampilkan". Perbaikan pertama (v1, 5 Nov)
   menaruh tombol "Konfirmasi hadir" HANYA sebagai pil kecil di Kelas & Materi →
   tab "Sesi & Rekaman" — tiga klik dari Beranda, di antara chip status lain. Data
   Mita lengkap (sesi 2 `completed`, token ada, `student_confirmed` NULL), jadi
   tombolnya memang ada di sana; siswa saja yang tak pernah sampai ke situ. Siswa
   membuka Beranda atau halaman detail kelas → tab Progress, bukan tab itu.

   Kartu ini naik ke layar pertama: setiap sesi selesai ≤ 30 hari terakhir yang
   belum dikonfirmasi siswa, dengan tombol langsung ke /kelas/konfirmasi/<token>
   (halaman yang sama dengan link WA pengajar; aksi "attend" di edge function
   schedule-public). Sesi yang presensinya izin/sakit/alpa tidak ditawarkan.
   Menyembunyikan diri kalau tak ada yang perlu dikonfirmasi. */

import { CheckCircle2, ChevronRight } from 'lucide-react';
import { useT } from '@/lib/uiLang';

type Sesi = {
  id: string;
  registration_id: string;
  scheduled_at: string;
  status?: string | null;
  attendance_status?: string | null;
  student_confirmed?: boolean | null;
  confirmation_token?: string | null;
};

type Reg = { id: string; language?: string | null; level?: string | null; __b2b?: boolean };

const JENDELA_HARI = 30;

/** Sesi selesai yang masih menunggu konfirmasi kehadiran siswa. */
export function sesiBelumDikonfirmasi<T extends Sesi>(rows: T[], regIds: Set<string>, now = Date.now()): T[] {
  const batas = now - JENDELA_HARI * 86_400_000;
  return (rows || [])
    .filter((s) => {
      if (!s?.confirmation_token || s.student_confirmed) return false;
      if (s.status !== 'completed' || !regIds.has(s.registration_id)) return false;
      const att = String(s.attendance_status || '').toLowerCase();
      if (att && att !== 'hadir') return false;
      const t = new Date(s.scheduled_at).getTime();
      return Number.isFinite(t) && t <= now && t >= batas;
    })
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());
}

export default function KonfirmasiHadirCard({
  schedules,
  regs,
  nomorSesi,
  labelKelas,
}: {
  schedules: Sesi[];
  regs: Reg[];
  nomorSesi?: Map<string, number | null>;
  labelKelas: (reg: Reg) => string;
}) {
  const t = useT();
  const regById = new Map((regs || []).filter((r) => r && !r.__b2b).map((r) => [r.id, r]));
  const daftar = sesiBelumDikonfirmasi(schedules, new Set(regById.keys()));
  if (daftar.length === 0) return null;
  const tampil = daftar.slice(0, 4);

  return (
    <section className="rounded-3xl bg-white p-4 ring-1 ring-amber-200 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <CheckCircle2 className="h-5 w-5" strokeWidth={2.4} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[16px] font-extrabold text-[#12172B]">
            {t('Konfirmasi kehadiran')}
            <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-100 px-1.5 align-middle text-[11px] font-bold text-amber-700">
              {daftar.length}
            </span>
          </h2>
          <p className="mt-0.5 text-[12.5px] font-medium text-gray-500">
            {t('Sesi berikut sudah selesai. Konfirmasi bahwa kamu hadir — dipakai untuk verifikasi kelas bersama pengajarmu.')}
          </p>
        </div>
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {tampil.map((s) => {
          const reg = regById.get(s.registration_id);
          const no = nomorSesi?.get(s.id);
          const d = new Date(s.scheduled_at);
          return (
            <li key={s.id} className="flex flex-wrap items-center gap-2 rounded-2xl bg-[#F5F6F8] px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-[#12172B]">
                  {reg ? labelKelas(reg) : t('Kelas')}{no ? ` · ${t('Sesi')} ${no}` : ''}
                </p>
                <p className="text-[11.5px] font-medium text-gray-500">
                  {d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' })}
                  {' · '}
                  {d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Jakarta' }).replace('.', ':')} WIB
                </p>
              </div>
              <a
                href={`/kelas/konfirmasi/${s.confirmation_token}`}
                className="inline-flex h-9 shrink-0 items-center gap-1 rounded-xl bg-[#16796E] px-3.5 text-[12.5px] font-bold text-white transition hover:bg-[#12665d]"
              >
                {t('Konfirmasi hadir')} <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.6} />
              </a>
            </li>
          );
        })}
      </ul>
      {daftar.length > tampil.length && (
        <p className="mt-2 text-[12px] font-medium text-gray-500">
          +{daftar.length - tampil.length} {t('sesi lain — lihat di Kelas & Materi → Sesi & Rekaman')}
        </p>
      )}
    </section>
  );
}
