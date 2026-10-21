"use client";

import { forwardRef, useEffect, useRef, useState, type ReactNode } from 'react';
import { Award } from 'lucide-react';
import CertWatermark from './CertWatermark';
import { certificatePreviewUrl } from '@/lib/certificateImages';
import { courseCertificateTheme } from '@/lib/courseCertificateTheme';

export const COURSE_CERT_WIDTH = 1120;
export const COURSE_CERT_HEIGHT = 792;

type Props = {
  code: string | null; language: string; badge: ReactNode; name: string;
  heading: string; body: ReactNode; level: ReactNode; qr: string | null;
  signature: string; signer: { name: string; role: string };
  teacher: string; date: string; number?: string | null;
  labels: { recipient: string; scan: string; issued: string; teacher: string; number: string };
};

// Kertas berukuran tetap; hanya pratinjau yang diperkecil mengikuti lebar layar.
export default forwardRef<HTMLDivElement, Props>(function CourseCertificatePaper(p, ref) {
  const outer = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = outer.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setScale(Math.min(1, el.clientWidth / COURSE_CERT_WIDTH)));
    setScale(Math.min(1, el.clientWidth / COURSE_CERT_WIDTH));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const theme = courseCertificateTheme(p.code, p.language);
  return <div ref={outer} style={{ width: '100%', maxWidth: COURSE_CERT_WIDTH, height: COURSE_CERT_HEIGHT * scale, overflow: 'hidden', borderRadius: 12, boxShadow: '0 8px 36px #123a3b14' }}>
    <div ref={ref} className="cert-paper" data-course-certificate data-theme={theme} style={{ position: 'relative', width: COURSE_CERT_WIDTH, height: COURSE_CERT_HEIGHT, transform: `scale(${scale})`, transformOrigin: 'top left', overflow: 'hidden', background: '#fff9e8', color: '#103f4b', fontFamily: "Inter, Arial, sans-serif" }}>
      <img src={certificatePreviewUrl(p.code, p.language)} data-certificate-print-src={`/images/certificates/${theme}.webp`} fetchPriority="high" decoding="async" width={1120} height={792} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <svg aria-hidden="true" viewBox="0 0 1120 792" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <path d="M130 110Q180 90 250 101Q540 65 820 104Q940 88 990 112Q970 195 960 255Q945 350 980 425Q955 485 960 550Q965 610 1005 682Q965 736 870 729Q560 750 240 727Q155 748 115 691Q165 620 162 550Q165 485 148 417Q165 345 153 270Q155 180 130 110Z" fill="#fff9e8" fillOpacity=".95" />
      </svg>
      <CertWatermark logoOpacity={0.025} textOpacity={0.025} />
      <div style={{ position: 'absolute', top: 26, left: 30, right: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ display: 'inline-flex', padding: '8px 12px', borderRadius: 12, background: '#fff9e8e6' }}><img src="/images/certificates/logo-v1.webp" data-certificate-print-src="/images/full-logo-linguo-hijau.png" alt="Linguo" style={{ width: 146, height: 'auto' }} /></span>{p.badge}
      </div>
      <div style={{ position: 'absolute', top: 143, left: 185, right: 185, textAlign: 'center' }}>
        <h2 style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: 28, letterSpacing: 2.5, textTransform: 'uppercase' }}>CERTIFICATE OF {p.heading}</h2>
        <div style={{ margin: '14px auto 25px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, color: '#f18d57' }}><span style={{ width: 155, height: 1, background: '#f18d57' }} />◆<span style={{ width: 155, height: 1, background: '#f18d57' }} /></div>
        <p style={{ margin: '0 0 9px', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: '#50777a' }}>{p.labels.recipient}</p>
        <div style={{ height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: p.name.length > 100 ? 20 : p.name.length > 70 ? 25 : p.name.length > 55 ? 30 : p.name.length > 32 ? 40 : 59, lineHeight: 1.1, fontWeight: 700, overflowWrap: 'anywhere' }}>{p.name}</p>
        </div>
        <div style={{ width: 48, height: 4, background: '#f18d57', borderRadius: 4, margin: '13px auto 22px' }} />
        <div style={{ fontSize: 17, lineHeight: 1.65 }}>{p.body}</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 19, padding: '10px 24px', border: '1px solid #f6b58e', borderRadius: 40, color: '#ed702f', background: '#fff0dc', fontSize: 23, fontWeight: 700 }}><Award size={27} />{p.level}</div>
      </div>
      <div style={{ position: 'absolute', bottom: 91, left: 168, right: 168, height: 133, display: 'grid', gridTemplateColumns: '1fr 160px 1fr', alignItems: 'end', gap: 25 }}>
        <div style={{ textAlign: 'center' }}>
          <img src={p.signature} alt={`${p.signer.name} — ${p.signer.role}`} style={{ display: 'block', height: 90, width: 185, objectFit: 'contain', margin: '0 auto 2px', mixBlendMode: 'multiply' }} />
          <p style={{ margin: '0 0 6px', fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700 }}>{p.signer.name}</p>
          <p style={{ margin: 0, paddingTop: 8, borderTop: '1px solid #83afac', fontSize: 10, letterSpacing: 1.6 }}>{p.signer.role.toUpperCase()}</p>
        </div>
        <div style={{ textAlign: 'center', borderLeft: '1px solid #f4bd99', borderRight: '1px solid #f4bd99' }}>
          {p.qr ? <img src={p.qr} alt={p.labels.scan} style={{ display: 'block', margin: '0 auto', width: 88, height: 88, padding: 5, border: '1px solid #f4bd99', borderRadius: 5, background: '#fff' }} /> : <Award size={60} color="#ef742e" style={{ margin: '0 auto' }} />}
          <p style={{ margin: '7px 0 0', fontSize: 9, letterSpacing: 1.5 }}>{p.qr ? p.labels.scan : 'LINGUO'}</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 21, fontWeight: 700, margin: '0 0 6px' }}>{p.date}</p>
          <p style={{ margin: '0 0 13px', fontSize: 10, letterSpacing: 1.6 }}>{p.labels.issued}</p>
          <p style={{ margin: 0, paddingTop: 8, borderTop: '1px solid #83afac', fontSize: 12 }}>{p.labels.teacher}: <b style={{ overflowWrap: 'anywhere' }}>{p.teacher}</b></p>
        </div>
      </div>
      {p.number && <p style={{ position: 'absolute', bottom: 61, left: 100, right: 100, textAlign: 'center', fontSize: 10, letterSpacing: 1.5, margin: 0 }}>{p.labels.number} · {p.number}</p>}
    </div>
  </div>;
});
