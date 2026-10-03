'use client';

// [cek-level-berkala-v1] Cek Level mandiri — kartu di Beranda /akun dan bagian di
// tab Progress detail kelas.
//
// Skor skill & rapor di dashboard semuanya diisi pengajar; kalau pengajarnya
// belum menilai, siswa tak punya satu pun angka untuk menjawab "aku sudah sampai
// mana". Placement Test sebenarnya bisa diulang kapan saja, tapi hasilnya cuma
// lewat di email — tak ada riwayat, tak ada pembanding, tak ada ajakan mengulang.
// Blok ini menaruh ketiganya di dashboard:
//   • level terakhir + tanggalnya + naik/turun dari tes sebelumnya
//   • grafik riwayat per bahasa (termasuk tes sebelum mendaftar)
//   • tanda "waktunya tes ulang" begitu lewat JEDA_CEK_LEVEL_HARI + tombol tes
//
// Tautan /akun?cek-level=<slug> (dipakai pengingat lonceng/WA) langsung membuka
// tesnya atas nama siswa yang login.

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Target, ArrowUpRight, ArrowDownRight, Minus, RotateCcw, Play } from 'lucide-react';
import {
  fetchPlacementHistory, cachedPlacementHistory, placementSlugFor, namaBahasaSlug,
  levelValue, hariSejak, CEFR_BANDS, JEDA_CEK_LEVEL_HARI, type PlacementRow,
} from '@/lib/placementHistory';
import { useT, useUiLang } from '@/lib/uiLang'; // [ui-lang-switcher-v1]

type RegLite = { id: string; language?: string | null };

type Titik = { row: PlacementRow; v: number };

// Grafik garis riwayat level. Sumbu Y = pita CEFR; X = urutan tes (bukan waktu —
// dua tes di hari yang sama tetap harus terbaca sebagai dua titik).
function GrafikLevel({ titik, dateLocale }: { titik: Titik[]; dateLocale: string }) {
  const W = 320, H = 132, L = 30, R = 14, T = 22, B = 22;
  const vs = titik.map((p) => p.v);
  const lo = Math.floor(Math.min(...vs));
  const hi = Math.max(lo + 1, Math.ceil(Math.max(...vs) + 0.001));
  const x = (i: number) => (titik.length === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (titik.length - 1));
  const y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const tgl = (iso: string) => new Date(iso).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' });
  const bands: number[] = [];
  for (let b = lo; b <= hi; b++) bands.push(b);
  const akhir = titik.length - 1;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img"
      aria-label={`Riwayat level: ${titik.map((p) => p.row.level).join(' → ')}`}>
      {bands.map((b) => (
        <g key={b}>
          <line x1={L} x2={W - R} y1={y(b)} y2={y(b)} stroke="#E2E8F0" strokeWidth={1} strokeDasharray={b === lo ? undefined : '3 4'} />
          <text x={L - 7} y={y(b) + 3.5} textAnchor="end" fontSize={10} fontWeight={700} fill="#94A3B8">{CEFR_BANDS[b] || ''}</text>
        </g>
      ))}
      {titik.length > 1 && (
        <polyline
          fill="none" stroke="#16796E" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round"
          points={titik.map((p, i) => `${x(i)},${y(p.v)}`).join(' ')}
        />
      )}
      {titik.map((p, i) => (
        <g key={p.row.id}>
          <circle cx={x(i)} cy={y(p.v)} r={i === akhir ? 5.5 : 4} fill={i === akhir ? '#16796E' : '#fff'} stroke="#16796E" strokeWidth={2.5}>
            <title>{`${p.row.level} · ${new Date(p.row.createdAt).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })}`}</title>
          </circle>
          {(i === akhir || i === 0 || titik.length <= 5) && (
            <text x={x(i)} y={y(p.v) - 10} textAnchor={i === 0 && titik.length > 1 ? 'start' : i === akhir && titik.length > 1 ? 'end' : 'middle'}
              fontSize={10.5} fontWeight={800} fill={i === akhir ? '#16796E' : '#64748B'}>{p.row.level}</text>
          )}
          {(i === akhir || i === 0) && (
            <text x={x(i)} y={H - 6} textAnchor={titik.length === 1 ? 'middle' : i === 0 ? 'start' : 'end'}
              fontSize={9.5} fontWeight={600} fill="#94A3B8">{tgl(p.row.createdAt)}</text>
          )}
        </g>
      ))}
    </svg>
  );
}

export default function CekLevel({
  regs,
  studentId,
  previewStudentId = null,
  displayLanguage,
  variant = 'beranda',
}: {
  regs: RegLite[];
  studentId?: string | null;
  // POV staf ("Lihat sebagai Siswa"): riwayat dibaca atas nama siswa itu, tombol
  // tes disembunyikan supaya staf tidak menulis hasil ke riwayat siswa.
  previewStudentId?: string | null;
  displayLanguage?: (lang: string) => string;
  // 'beranda' = semua bahasa siswa (kelas aktif + yang pernah dites);
  // 'kelas'   = hanya bahasa registrasi yang sedang dibuka.
  variant?: 'beranda' | 'kelas';
}) {
  const t = useT();
  const uiLang = useUiLang();
  const dateLocale = uiLang === 'en' ? 'en-GB' : 'id-ID';
  const router = useRouter();
  const [rows, setRows] = useState<PlacementRow[] | undefined>(() => cachedPlacementHistory(previewStudentId));

  useEffect(() => {
    let alive = true;
    fetchPlacementHistory(previewStudentId).then((r) => { if (alive) setRows(r); });
    return () => { alive = false; };
  }, [previewStudentId, studentId]);

  const mulaiTes = (slug: string) => {
    if (!studentId || previewStudentId) return;
    router.push(`/silabus/${slug}/coba?ref=akun&sid=${encodeURIComponent(studentId)}`);
  };

  // Tautan pengingat: /akun?cek-level=<slug> → langsung ke tesnya.
  useEffect(() => {
    if (variant !== 'beranda' || !studentId || previewStudentId) return;
    const slug = new URLSearchParams(window.location.search).get('cek-level');
    if (slug && placementSlugFor(slug)) mulaiTes(slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, previewStudentId, variant]);

  const regKey = regs.map((r) => `${r.id}:${r.language || ''}`).join('|');
  const daftar = useMemo(() => {
    const perSlug = new Map<string, Titik[]>();
    (rows || []).forEach((row) => {
      const v = levelValue(row.level);
      if (!row.slug || v === null) return; // IELTS/TOEFL: bukan level CEFR
      if (!perSlug.has(row.slug)) perSlug.set(row.slug, []);
      perSlug.get(row.slug)!.push({ row, v });
    });
    const slugs: string[] = [];
    regs.forEach((r) => {
      const s = placementSlugFor(r.language);
      if (s && !slugs.includes(s)) slugs.push(s);
    });
    if (variant === 'beranda') perSlug.forEach((_, s) => { if (!slugs.includes(s)) slugs.push(s); });
    return slugs.map((slug) => ({ slug, titik: (perSlug.get(slug) || []).slice(-8) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, regKey, variant]);

  // Selagi riwayat belum datang jangan gambar kartu "belum pernah tes" — untuk
  // siswa yang sudah pernah tes itu jadi kedipan yang salah.
  if (rows === undefined || daftar.length === 0) return null;

  const namaBahasa = (slug: string) => {
    const reg = regs.find((r) => placementSlugFor(r.language) === slug);
    return reg?.language && displayLanguage ? displayLanguage(reg.language) : namaBahasaSlug(slug);
  };
  const bolehTes = !!studentId && !previewStudentId;
  const adaJatuhTempo = daftar.some((d) => d.titik.length > 0 && hariSejak(d.titik[d.titik.length - 1].row.createdAt) >= JEDA_CEK_LEVEL_HARI);

  const kartu = daftar.map(({ slug, titik }) => {
    const akhir = titik[titik.length - 1] || null;
    const sebelum = titik.length > 1 ? titik[titik.length - 2] : null;
    const hari = akhir ? hariSejak(akhir.row.createdAt) : null;
    const jatuhTempo = hari !== null && hari >= JEDA_CEK_LEVEL_HARI;
    const sisa = hari !== null ? JEDA_CEK_LEVEL_HARI - hari : null;
    const arah = akhir && sebelum ? Math.sign(akhir.v - sebelum.v) : null;
    const kapan = hari === null ? '' : hari === 0 ? t('hari ini') : hari === 1 ? t('kemarin') : `${hari} ${t('hari lalu')}`;

    return (
      <div key={slug} className="rounded-3xl bg-white p-4 ring-1 ring-slate-200/70">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-[12px] font-bold uppercase tracking-wide text-gray-400">{namaBahasa(slug)}</div>
            {akhir ? (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-[28px] font-extrabold leading-none text-[#12172B]">{akhir.row.level}</span>
                {arah !== null && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-bold ${
                    arah > 0 ? 'bg-emerald-50 text-emerald-700' : arah < 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-gray-500'}`}>
                    {arah > 0 ? <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={3} /> : arah < 0 ? <ArrowDownRight className="h-3.5 w-3.5" strokeWidth={3} /> : <Minus className="h-3.5 w-3.5" strokeWidth={3} />}
                    {arah > 0 ? t('Naik dari') : arah < 0 ? t('Turun dari') : t('Sama dengan')} {sebelum!.row.level}
                  </span>
                )}
              </div>
            ) : (
              <div className="mt-1 text-[16px] font-extrabold text-[#12172B]">{t('Belum pernah cek level')}</div>
            )}
            <p className="mt-1.5 text-[12px] font-medium text-gray-500">
              {akhir ? (
                <>
                  {t('Tes terakhir')} {new Date(akhir.row.createdAt).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' })} · {kapan}
                  {akhir.row.score !== null && akhir.row.maxScore ? ` · ${t('skor')} ${akhir.row.score}/${akhir.row.maxScore}` : ''}
                </>
              ) : t('Tes 5 menit untuk tahu level CEFR kamu sekarang — hasilnya jadi titik awal grafik perkembanganmu.')}
            </p>
          </div>
          {jatuhTempo && (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              {t('Waktunya tes ulang')}
            </span>
          )}
        </div>

        {titik.length > 0 && (
          <div className="mt-3">
            <GrafikLevel titik={titik} dateLocale={dateLocale} />
            {titik.length === 1 && (
              <p className="mt-1 text-center text-[11.5px] font-medium text-gray-400">
                {t('Grafik perkembangan muncul setelah tes kedua.')}
              </p>
            )}
          </div>
        )}

        {bolehTes && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11.5px] font-medium text-gray-400">
              {!akhir ? t('Gratis, bisa diulang kapan saja')
                : jatuhTempo ? t('Sudah lewat 4 minggu sejak tes terakhir')
                : `${t('Tes ulang dianjurkan')} ${sisa} ${t('hari lagi')}`}
            </span>
            <button
              type="button"
              onClick={() => mulaiTes(slug)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-bold transition ${
                !akhir || jatuhTempo
                  ? 'bg-[#16796E] text-white hover:bg-[#12665D]'
                  : 'bg-[#16796E]/10 text-[#16796E] hover:bg-[#16796E]/15'}`}
            >
              {akhir ? <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.6} /> : <Play className="h-3.5 w-3.5" strokeWidth={2.6} />}
              {akhir ? t('Tes ulang') : t('Mulai cek level')}
            </button>
          </div>
        )}
      </div>
    );
  });

  if (variant === 'kelas') {
    return (
      <section>
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">{t('Cek Level Mandiri')}</h2>
          <span className="text-[11px] text-gray-400">{t('dianjurkan tiap 4 minggu')}</span>
        </div>
        {kartu}
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-[18px] font-extrabold text-[#12172B]">
          <Target className="h-5 w-5 text-[#16796E]" strokeWidth={2.5} />
          {t('Cek Level')}
        </h2>
        {adaJatuhTempo && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[12px] font-bold text-amber-700">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            {t('Waktunya tes ulang')}
          </span>
        )}
      </div>
      <div className={`grid grid-cols-1 gap-4 ${kartu.length > 1 ? 'lg:grid-cols-2' : ''}`}>{kartu}</div>
    </div>
  );
}
