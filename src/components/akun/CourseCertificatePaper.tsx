"use client";

import { forwardRef, useEffect, useRef, useState, type ReactNode } from 'react';
import { Award } from 'lucide-react';
import { courseCertificateTheme } from '@/lib/courseCertificateTheme';

// Ukuran kertas tetap supaya tata letak HP dan PDF sama dengan desktop.
export const COURSE_CERT_WIDTH = 1120;
export const COURSE_CERT_HEIGHT = 792;

type Props = {
  code: string | null;
  badge: ReactNode;
  name: string;
  heading: string;
  body: ReactNode;
  level: ReactNode;
  qr: string | null;
  signature: string;
  signer: { name: string; role: string };
  teacher: string;
  date: string;
  number?: string | null;
  labels: { recipient: string; scan: string; issued: string; teacher: string; number: string };
};

const CourseCertificatePaper = forwardRef<HTMLDivElement, Props>(function CourseCertificatePaper(p, ref) {
  const outer = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = outer.current;
    if (!el) return;
    const read = () => setScale(Math.min(1, el.clientWidth / COURSE_CERT_WIDTH));
    read();
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const theme = courseCertificateTheme(p.code);
  const size = p.name.length > 45 ? 34 : p.name.length > 30 ? 44 : 64;
  return (
    <div ref={outer} style={{ width: '100%', maxWidth: COURSE_CERT_WIDTH, height: COURSE_CERT_HEIGHT * scale, overflow: 'hidden', borderRadius: 8, boxShadow: '0 8px 36px #12172b12' }}>
      <div ref={ref} data-course-certificate data-theme={theme} className="cert-paper" style={{ position: 'relative', width: COURSE_CERT_WIDTH, height: COURSE_CERT_HEIGHT, transform: `scale(${scale})`, transformOrigin: 'top left', overflow: 'hidden', background: '#fff', color: '#12172B', fontFamily: "'Inter', Arial, sans-serif" }}>
        <img src={`/images/certificates/${theme}.webp`} alt="" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
        <div style={{ position: 'absolute', inset: '48px 70px auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src="/images/full-logo-linguo-hijau.png" alt="Linguo" style={{ height: 50, width: 'auto' }} />
          {p.badge}
        </div>
        <div style={{ position: 'absolute', top: 87, left: 160, right: 160, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 20, letterSpacing: 5, color: '#60697d' }}>CERTIFICATE OF</p>
          <h2 style={{ margin: '8px -60px 0', fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700, fontSize: p.heading.length > 18 ? 49 : 68, lineHeight: 1.12, color: '#101526' }}>{p.heading}</h2>
          <div style={{ width: 55, height: 3, background: '#ef510b', borderRadius: 5, margin: '16px auto 0' }} />
          <p style={{ margin: '28px 0 8px', fontSize: 20, color: '#535f77' }}>{p.labels.recipient}</p>
          <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ margin: 0, maxWidth: 790, overflowWrap: 'anywhere', fontFamily: "Georgia, 'Times New Roman', serif", fontSize: size, fontWeight: 700, lineHeight: 1.12 }}>{p.name}</p>
          </div>
          <div style={{ margin: '14px auto 0', maxWidth: 800, fontSize: 20, lineHeight: 1.5, color: '#58647b' }}>{p.body}</div>
          <div style={{ display: 'inline-flex', gap: 10, alignItems: 'center', marginTop: 22, padding: '12px 28px', borderRadius: 40, border: '1px solid #ffbc99', background: '#fff5e9', color: '#df4b09', fontSize: 24, fontWeight: 700 }}><Award size={29} />{p.level}</div>
        </div>
        <div style={{ position: 'absolute', left: 85, right: 85, bottom: 88, height: 145, display: 'grid', gridTemplateColumns: '1fr 220px 1fr', alignItems: 'center', gap: 30 }}>
          <div style={{ textAlign: 'left' }}>
            <img src={p.signature} alt={`${p.signer.name} — ${p.signer.role} signature`} style={{ display: 'block', height: 82, width: 170, objectFit: 'contain', objectPosition: 'left center', marginBottom: 4 }} />
            <p style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: 23, fontWeight: 700 }}>{p.signer.name}</p>
            <p style={{ margin: '6px 0 0', paddingTop: 9, borderTop: '1px solid #b6c2d0', fontSize: 12, letterSpacing: 2.5, color: '#606b80' }}>{p.signer.role.toUpperCase()}</p>
          </div>
          <div style={{ textAlign: 'center', borderLeft: '1px solid #ffd2b8', borderRight: '1px solid #ffd2b8', padding: '0 15px' }}>
            {p.qr ? <img src={p.qr} alt="Certificate verification QR code" style={{ display: 'block', margin: '0 auto', width: 103, height: 103, padding: 5, border: '1px solid #ffbc99', borderRadius: 6, background: '#fff' }} /> : <Award size={72} color="#e95b16" style={{ margin: '0 auto' }} />}
            <p style={{ margin: '8px 0 0', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: '#606b80' }}>{p.qr ? p.labels.scan : 'LINGUO'}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 23, fontWeight: 700 }}>{p.date}</p>
            <p style={{ margin: '6px 0 20px', color: '#606b80', fontSize: 12, letterSpacing: 2.5 }}>{p.labels.issued}</p>
            <p style={{ margin: 0, paddingTop: 12, borderTop: '1px solid #b6c2d0', fontSize: 14, color: '#606b80' }}>{p.labels.teacher}: <b style={{ color: '#12172b', overflowWrap: 'anywhere' }}>{p.teacher}</b></p>
          </div>
        </div>
        {p.number && <p style={{ position: 'absolute', bottom: 32, left: 60, right: 60, textAlign: 'center', margin: 0, fontSize: 12, letterSpacing: 1.5, color: '#606b80' }}>{p.labels.number} · {p.number}</p>}
      </div>
    </div>
  );
});

export default CourseCertificatePaper;
