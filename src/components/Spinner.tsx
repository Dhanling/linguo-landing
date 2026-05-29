'use client';

import dynamic from 'next/dynamic';
import spinnerData from '@/assets/spinner-data';

// lottie-react bergantung pada lottie-web yang menyentuh `document`,
// jadi di-load client-only (ssr:false) biar aman dari error SSR Next.js.
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

export function Spinner({
  size = 64,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Memuat"
    >
      <Lottie
        animationData={spinnerData}
        loop
        autoplay
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}

export function PageLoader({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 py-12">
      <Spinner size={64} />
      {label ? <p className="text-sm text-gray-500">{label}</p> : null}
    </div>
  );
}

export default Spinner;
