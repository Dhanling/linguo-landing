'use client';

// [kelas-level-switcher-v1] Pindah antar LEVEL di bahasa yang sama, langsung dari
// halaman detail kelas (/akun/kelas/[id]) — strip chip di atas banner.
//
// Kenapa: siswa yang sudah lama belajar punya banyak registrasi di bahasa yang sama
// (Zayyan: Russian A1.1 → A1.2 → ... → A2.2). Buat lihat materi/kuis sesi level
// sebelumnya dia harus balik ke Beranda, scroll cari kartu level lama (yang bahkan
// tak muncul di "Kelas Live" karena sudah diarsipkan), baru klik. Strip ini
// memotong perjalanan itu jadi satu klik, tanpa keluar dari tab yang sedang dibuka.
//
// Catatan: baris level lama BOLEH archived_at — justru itu yang dicari. Yang dibuang
// cuma yang dibatalkan admin & yang belum pernah dibayar (bukan kelas beneran).

import Link from 'next/link';
import { Check, Layers } from 'lucide-react';
import { useT } from '@/lib/uiLang'; // [ui-lang-switcher-v1]

export interface SwitcherReg {
  id: string;
  level?: string | null;
  product?: string | null;
  language?: string | null;
  sessions_total?: number | null;
  sessions_used?: number | null;
  archived_at?: string | null;
  [k: string]: any;
}

const BAND_ORDER: Record<string, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };

// "A2.2" → 202, "B1" → 300, level tak dikenal → 900 (dibuang ke belakang).
export function levelRank(level?: string | null): number {
  const m = /([ABC][12])(?:\s*\.\s*(\d+))?/i.exec(String(level || '').trim());
  if (!m) return 900;
  return (BAND_ORDER[m[1].toUpperCase()] || 8) * 100 + (m[2] ? Number(m[2]) : 0);
}

// Urut menaik dari level terendah — arah baca perjalanan belajar siswa.
export function urutkanLevel<T extends SwitcherReg>(regs: T[]): T[] {
  return [...regs].sort((a, b) => {
    const d = levelRank(a.level) - levelRank(b.level);
    if (d !== 0) return d;
    // Level sama persis (mis. paket lanjutan di level yang sama) → yang lebih tua dulu.
    return String(a.registration_date || a.created_at || '').localeCompare(
      String(b.registration_date || b.created_at || ''),
    );
  });
}

const selesai = (r: SwitcherReg) =>
  !!r.archived_at || ((r.sessions_total || 0) > 0 && (r.sessions_used || 0) >= (r.sessions_total || 0));

interface Props {
  regs: SwitcherReg[];       // semua kelas siswa di bahasa ini (termasuk yang aktif)
  currentId: string;
  activeTab?: string;        // tab yang sedang dibuka → ikut terbawa saat pindah level
  previewStudentId?: string | null;
}

export default function ClassLevelSwitcher({ regs, currentId, activeTab, previewStudentId = null }: Props) {
  const t = useT(); // [ui-lang-switcher-v1]
  const items = urutkanLevel(regs);
  // Cuma satu level → strip-nya tak menawarkan apa pun, jangan makan tempat.
  if (items.length < 2) return null;

  const href = (id: string) => {
    const qs = new URLSearchParams();
    if (activeTab && activeTab !== 'materi') qs.set('tab', activeTab);
    if (previewStudentId) qs.set('preview', previewStudentId);
    const q = qs.toString();
    return `/akun/kelas/${id}${q ? `?${q}` : ''}`;
  };

  return (
    <div className="mt-4">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
        <Layers className="h-3.5 w-3.5" strokeWidth={2.2} /> {t('Level di bahasa ini')}
      </div>
      <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
        <div className="flex min-w-max items-center gap-2 pb-1">
          {items.map((r) => {
            const aktif = r.id === currentId;
            const beres = selesai(r);
            return (
              <Link
                key={r.id}
                href={href(r.id)}
                prefetch={false}
                aria-current={aktif ? 'page' : undefined}
                title={`${t(r.product || 'Kelas')} · ${r.level || 'TBD'}`}
                // Handoff sama seperti kartu beranda: halaman tujuan render instan
                // tanpa nunggu query (lihat regHandoffKey di /akun/kelas/[id]).
                onClick={() => { try { sessionStorage.setItem(`linguo_reg_${r.id}`, JSON.stringify(r)); } catch {} }}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-bold transition ${
                  aktif
                    ? 'bg-[#16796E] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                }`}
              >
                {beres && !aktif ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                {r.level || 'TBD'}
                {aktif ? <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-white/90" /> : null}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
