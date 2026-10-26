'use client';

import { useId, useState, type ReactNode } from 'react';
import type { MateriSlide } from '@/lib/materiSlides';
import styles from './DutchNumberSlide.module.css';

const ANGKA = [
  ['nul', 'nol'], ['een', 'satu'], ['twee', 'dua'], ['drie', 'tiga'],
  ['vier', 'empat'], ['vijf', 'lima'], ['zes', 'enam'], ['zeven', 'tujuh'],
  ['acht', 'delapan'], ['negen', 'sembilan'], ['tien', 'sepuluh'],
  ['elf', 'sebelas'], ['twaalf', 'dua belas'], ['dertien', 'tiga belas'],
  ['veertien', 'empat belas'], ['vijftien', 'lima belas'], ['zestien', 'enam belas'],
  ['zeventien', 'tujuh belas'], ['achttien', 'delapan belas'],
  ['negentien', 'sembilan belas'], ['twintig', 'dua puluh'],
];
const CONTOH: Record<number, [string, string]> = {
  1: ['Ik heb één broer.', 'Saya punya satu saudara laki-laki.'],
  5: ['Twee plus drie is vijf.', 'Dua tambah tiga sama dengan lima.'],
  10: ['Ik ben tien jaar.', 'Umur saya sepuluh tahun.'],
  11: ['Ik ben elf jaar.', 'Umur saya sebelas tahun.'],
  15: ['Ik heb vijftien boeken.', 'Saya punya lima belas buku.'],
  20: ['Ik ben twintig jaar.', 'Umur saya dua puluh tahun.'],
};

export function isDutchNumberSlide(s: MateriSlide, lang?: string | null) {
  return /^nl(?:-|$)/i.test(lang || '') && s.type === 'vocab'
    && /getallen|angka/i.test(s.heading)
    && !!s.items?.some(it => /^(nul|een|één|elf|twaalf|dertien|twintig)(\s|$|\/)/i.test(it.term))
    && !s.items.some(it => /honderd|duizend|miljoen/i.test(it.term));
}

export default function DutchNumberSlide({ slide, renderSpeech }: {
  slide: MateriSlide;
  renderSpeech: (text: string) => ReactNode;
}) {
  const [tab, setTab] = useState(/(?:11|13)\s*(?:–|-|sampai|tot)/i.test(slide.heading) ? 1 : 0);
  const id = useId();
  const start = tab === 0 ? 0 : 11;
  const numbers = ANGKA.slice(start, tab === 0 ? 11 : 21);
  return (
    <section className={styles.scene} aria-label="Belajar angka bahasa Belanda">
      <div className={styles.cloud} aria-hidden="true" />
      <div className={styles.decoration} aria-hidden="true"><span>🇳🇱</span><span>🌷</span></div>
      <div className={styles.panel}>
        <span className={styles.label}>Kosakata · Bahasa Belanda</span>
        <h3 className={styles.heading}><span>Getallen</span> — angka {tab === 0 ? '0 sampai 10' : '11 sampai 20'}</h3>
        <p className={styles.subtitle}>Kenali angkanya, lalu ketuk kata untuk mendengar pelafalan.</p>
        <div className={styles.tabs} role="tablist" aria-label="Rentang angka">
          {['0–10', '11–20'].map((label, index) => (
            <button key={label} id={`${id}-tab-${index}`} role="tab" type="button"
              aria-selected={tab === index} aria-controls={`${id}-panel`} tabIndex={tab === index ? 0 : -1}
              className={styles.tab} onClick={() => setTab(index)}
              onKeyDown={event => {
                if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
                  event.preventDefault();
                  event.stopPropagation();
                  const next = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - tab;
                  setTab(next);
                  document.getElementById(`${id}-tab-${next}`)?.focus();
                }
              }}>{label}</button>
          ))}
        </div>
        <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${tab}`} className={styles.content} tabIndex={0}>
          <ol key={tab} className={styles.grid} start={start}>
            {numbers.map(([term, meaning], index) => {
              const number = start + index;
              const saved = slide.items?.find(it => it.term === term || (number === 1 && it.term === 'één'));
              const example = saved?.example || CONTOH[number]?.[0];
              const translation = saved?.example_meaning || CONTOH[number]?.[1];
              return <li key={number} className={styles.card}>
                <span className={styles.number} data-tone={index % 5}>{number}</span>
                <div className={styles.word}>
                  <div><strong>{renderSpeech(term)}</strong><span className={styles.meaning}> — {meaning}</span></div>
                  {example && <div className={styles.example}>{renderSpeech(example)}{translation && <span> ({translation})</span>}</div>}
                </div>
              </li>;
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
