"use client";

// Ilustrasi arsitektur melengkapi latar cat air; komposisi stabil untuk setiap bahasa.
export default function CertificateLandscape({ code, language }: { code: string | null; language: string }) {
  const seed = Array.from(language).reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);
  const east = ['hk', 'cn', 'jp', 'kr', 'th', 'vn', 'kh', 'la', 'mm'].includes(code || '');
  const dome = ['sa', 'ae', 'ir', 'tr', 'pk', 'af', 'uz', 'kz', 'az', 'bd', 'in'].includes(code || '');
  return <svg aria-hidden="true" viewBox="0 0 1120 792" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
    <defs><filter id={`brush-${seed}`} x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".06" numOctaves="3" seed={seed % 100} result="grain" /><feDisplacementMap in="SourceGraphic" in2="grain" scale="2.5" xChannelSelector="R" yChannelSelector="G" /></filter><pattern id={`windows-${seed}`} width="12" height="17" patternUnits="userSpaceOnUse"><rect x="4" y="4" width="3" height="8" fill="#fff3d5" opacity=".7" /></pattern></defs>
    <g filter={`url(#brush-${seed})`} opacity=".88" fill="#56b6b0" stroke="#c1e5d4" strokeWidth="1.5">
      {Array.from({ length: 9 }, (_, i) => {
        const height = 35 + ((seed >>> (i * 3)) % 95);
        return <g key={i}><rect x={i * 18 - 10} y={560 - height} width="17" height={height} /><rect x={i * 18 - 10} y={560 - height} width="17" height={height} fill={`url(#windows-${seed})`} /><path d={`M${i * 18 - 10} ${560 - height}l8 -12 9 12`} /></g>;
      })}
    </g>
    <g filter={`url(#brush-${seed})`} transform={`translate(955 ${440 + seed % 30})`} stroke="#328e8d" strokeWidth="3" strokeLinejoin="round">
      {code === 'id' ? <>
        <path d="M15 110V40h110v70Z" fill="#ffc394" stroke="#f39869" strokeWidth="7" />
        <path d={`M0 45Q30 35 45 ${-15-seed%25}H95Q110 35 145 45Z`} fill="#279d9a" />
        <path d="M35 110V60h25v50m35 0V60h20v50" fill="#fff3d5" />
      </> : east ? <>
        <path d="M20 100V35h100v65M35 100V40m70 60V40" fill="#ffc394" stroke="#f39869" strokeWidth="9" />
        {[0, 1, 2].map(i => <path key={i} d={`M${5+i*12} ${40-i*27}Q65 ${50-i*27} ${135-i*12} ${40-i*27}L${115-i*10} ${20-i*27}Q65 ${32-i*27} ${25+i*10} ${20-i*27}Z`} fill="#279d9a" />)}
        <path d="M0 105h140v13H0z" fill="#f9dab1" />
      </> : dome ? <>
        <path d="M20 100V20h100v80Z" fill="#f9dab1" /><path d="M15 20Q10 -5 70 -40Q130 -5 125 20Z" fill="#4eb5a9" />
        <path d="M2 100V-25m136 125V-25" strokeWidth="10" /><path d="M55 100V65Q70 43 85 65v35" fill="#328e8d" />
      </> : code === 'nl' ? <>
        <path d="M40 110l15 -95h30l15 95Z" fill="#f3c49b" /><path d="M45 15L70 -12 95 15Z" fill="#25918d" /><path d="M70 30L20 -20m50 50 50 50M70 30l50 -50M70 30L20 80" stroke="#ec9365" strokeWidth="12" />
      </> : code === 'fr' ? <>
        <path d="M20 115Q60 50 65 -45h10q5 95 45 160H90L70 75l-20 40Z" fill="#379e9b" /><path d="M35 80h70M45 40h50M60 -8h20" stroke="#f6bf8a" strokeWidth="5" />
      </> : <>
        {[0,1,2].map(i => <g key={i} transform={`translate(${i*43} ${i===1 ? -35 : 0})`}><path d="M0 110V0h35v110Z" fill={i===1 ? '#55b2ab' : '#f7ceaa'} /><path d="M-4 0L17 -25 39 0Z" fill="#289d99" /><path d="M10 25h15m-15 20h15m-15 20h15" stroke="#fff3d5" strokeWidth="8" /></g>)}
      </>}
    </g>
    {code === 'hk' && <g transform="translate(25 610)"><path d="M0 20Q70 45 145 15L120 50H30Z" fill="#135660" /><path d="M65 -100V20M110 -75V20" stroke="#145c60" strokeWidth="3" /><path d="M61 -100L10 0h51ZM105 -75L72 0h33Z" fill="#ffad78" stroke="#e88658" strokeWidth="2" /></g>}
  </svg>;
}
