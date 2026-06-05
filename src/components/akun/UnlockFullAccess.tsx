'use client';

// Panel "Unlock full access" ala Coursera — render kartu harga dari lms-pricing.ts.
// Dipakai di branch locked LessonPlayer (sesi terkunci & user belum entitled).
// CTA -> onSelectPlan(plan); wiring ke checkout Xendit nyusul setelah SKU dikonfirmasi.

import { Lock, Check } from 'lucide-react';
import {
  LMS_PLANS,
  formatRupiah,
  showCoret,
  hargaFinal,
  type LmsPlan,
  type LmsPlanId,
} from '../../data/lms-pricing';

const TEAL = '#16796E';
const DEEP = '#0F5A52';
const INK = '#12172B';
const YELLOW = '#F2CB05';

const VALUE_PROPS = [
  'Akses semua level dari A2 sampai B2',
  'Audio pelafalan native + kuis di tiap sesi',
  'Materi bisa diakses kapan aja selama masa aktif',
  'Belajar terstruktur dengan urutan ala kelas',
];

// 3 kartu utama; opsi 1 bulan tampil kecil di bawah.
const CARD_PLANS: LmsPlanId[] = ['6m', '12m', 'lifetime'];

export default function UnlockFullAccess({
  language,
  onSelectPlan,
}: {
  language?: string;
  onSelectPlan?: (plan: LmsPlanId) => void;
}) {
  const cards = CARD_PLANS.map((id) => LMS_PLANS.find((p) => p.plan === id)).filter(
    (p): p is LmsPlan => Boolean(p)
  );
  const oneMonth = LMS_PLANS.find((p) => p.plan === '1m');
  const langLabel = language ? ` Bahasa ${language}` : '';

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '32px 20px', textAlign: 'center' }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 999,
          margin: '0 auto 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(22,121,110,0.10)',
        }}
      >
        <Lock size={28} color={TEAL} />
      </div>

      <h2 style={{ fontSize: 24, fontWeight: 800, color: INK, margin: '0 0 8px' }}>
        Buka akses penuh{langLabel}
      </h2>
      <p style={{ fontSize: 15, color: '#5B6477', margin: '0 0 24px', lineHeight: 1.5 }}>
        Level A1 gratis buat dicoba. Lanjut ke A2–B2 dengan akses penuh — sekali bayar, bukan
        langganan kartu otomatis.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 10,
          textAlign: 'left',
          maxWidth: 640,
          margin: '0 auto 28px',
        }}
      >
        {VALUE_PROPS.map((v) => (
          <div key={v} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <Check size={18} color={TEAL} style={{ flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: 14, color: INK }}>{v}</span>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
          maxWidth: 720,
          margin: '0 auto',
        }}
      >
        {cards.map((p) => {
          const highlight = p.highlight;
          return (
            <div
              key={p.plan}
              style={{
                position: 'relative',
                border: highlight ? `2px solid ${TEAL}` : '1px solid #E2E6EC',
                borderRadius: 16,
                padding: '22px 16px 18px',
                background: '#FFFFFF',
                boxShadow: highlight ? '0 8px 24px rgba(22,121,110,0.15)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {p.badge && (
                <span
                  style={{
                    position: 'absolute',
                    top: -11,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: highlight ? TEAL : YELLOW,
                    color: highlight ? '#FFFFFF' : INK,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 0.3,
                    padding: '3px 10px',
                    borderRadius: 999,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p.badge}
                </span>
              )}

              <div style={{ fontSize: 15, fontWeight: 700, color: INK }}>{p.label}</div>

              {showCoret(p) && p.harga_normal != null && (
                <div style={{ fontSize: 13, color: '#9AA1AE', textDecoration: 'line-through' }}>
                  {formatRupiah(p.harga_normal)}
                </div>
              )}

              <div style={{ fontSize: 24, fontWeight: 800, color: DEEP }}>
                {formatRupiah(hargaFinal(p))}
              </div>

              {p.efektifPerBulan != null ? (
                <div style={{ fontSize: 12, color: '#5B6477' }}>
                  ≈ {formatRupiah(p.efektifPerBulan)}/bulan
                </div>
              ) : (
                <div style={{ fontSize: 12, color: '#5B6477' }}>akses selamanya</div>
              )}

              {p.hematLabel && (
                <div style={{ fontSize: 12, fontWeight: 700, color: TEAL }}>{p.hematLabel}</div>
              )}

              <button
                type="button"
                onClick={() => onSelectPlan?.(p.plan)}
                style={{
                  marginTop: 10,
                  cursor: 'pointer',
                  background: highlight ? TEAL : '#FFFFFF',
                  color: highlight ? '#FFFFFF' : TEAL,
                  border: highlight ? 'none' : `1.5px solid ${TEAL}`,
                  fontWeight: 700,
                  fontSize: 14,
                  padding: '10px 12px',
                  borderRadius: 10,
                }}
              >
                Pilih paket
              </button>
            </div>
          );
        })}
      </div>

      {oneMonth && (
        <p style={{ fontSize: 13, color: '#5B6477', marginTop: 18 }}>
          Atau coba dulu{' '}
          <button
            type="button"
            onClick={() => onSelectPlan?.('1m')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: TEAL,
              fontWeight: 700,
              textDecoration: 'underline',
            }}
          >
            1 bulan {formatRupiah(oneMonth.harga)}
          </button>
        </p>
      )}
    </div>
  );
}
