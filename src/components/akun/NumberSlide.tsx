import { useEffect, useId, useState, type CSSProperties, type ReactNode } from 'react';
import { Volume2 } from 'lucide-react';
import type { MateriSlide } from '@/lib/materiSlides';
import type { NumberTheme } from '@/data/numberSlideThemes';
import { NUMBER_CATALOG } from '@/data/numberSlideCatalog';
import { numberEntries, numberGroup, numberItems, numberSpeech, numberSystem, parseNumberItem, type NumberEntry } from '@/lib/numberSlides';
import { bisaDibunyikan, bukaKunciAudio, hentikanEbookTts, ucapkanEbook } from '@/lib/ebookTts';
import styles from './NumberSlide.module.css';

export function prepareNumberSlide(slide: MateriSlide, theme: NumberTheme) {
  const own = numberEntries(slide);
  const supplement = own.every(entry => entry.value <= 20)
    ? NUMBER_CATALOG[`${theme.slug}:${numberSystem(slide)}`] || [] : [];
  const entries: NumberEntry[] = [...own];
  for (const entry of supplement) if (!entries.some(local => local.value === entry.value)) entries.push(entry);
  entries.sort((a, b) => a.value - b.value);
  const fromTwenty = own.every(entry => entry.value >= 20) && own.some(entry => entry.value > 20);
  const groupFor = (value: number) => fromTwenty && value >= 20 && value <= 100 ? '20–100' : numberGroup(value);
  const labels = [...new Set(entries.map(entry => groupFor(entry.value)))];
  return { entries, labels, groupFor, initial: own[0] ? groupFor(own[0].value) : labels[0] };
}

export default function NumberSlide({ slide, theme, lang, renderSpeech }: {
  slide: MateriSlide; theme: NumberTheme; lang?: string | null;
  renderSpeech: (text: string) => ReactNode;
}) {
  const { entries, labels, initial, groupFor } = prepareNumberSlide(slide, theme);
  const [selected, setSelected] = useState(initial);
  const id = useId();
  const active = labels.includes(selected) ? selected : labels[0];
  const visible = entries.filter(entry => groupFor(entry.value) === active);
  const code = lang || theme.code;
  const canSpeak = bisaDibunyikan(code);
  useEffect(() => () => hentikanEbookTts(), []);
  const speak = (text: string) => {
    if (!canSpeak) return;
    bukaKunciAudio();
    hentikanEbookTts();
    void ucapkanEbook(text, code);
  };
  const select = (label: string, read: boolean) => {
    setSelected(label);
    hentikanEbookTts();
    if (read) speak(entries.filter(entry => groupFor(entry.value) === label).map(entry => numberSpeech(entry.term)).join(', '));
  };
  const extras = numberItems(slide).filter(item => parseNumberItem(item).length !== 1);
  const hasNotes = !!(slide.subheading || slide.note || slide.pattern || extras.length);
  const systemLabel = numberSystem(slide) === 'native' ? ' · Asli' : numberSystem(slide) === 'borrowed' ? ' · Sistem Spanyol' : numberSystem(slide) === 'personal' ? ' · Orang' : /sino/i.test(slide.heading) ? ' · Sino' : '';
  return <section className={styles.scene} aria-label={`Materi angka ${theme.label}`}>
    <div className={styles.panel}>
      <span className={styles.label}>Kosakata · {theme.label}{systemLabel}</span>
      <h3 className={styles.heading}><span>{theme.label}</span> — angka {active}</h3>
      <p className={styles.subtitle}>{canSpeak ? 'Klik tab untuk dengar semua angka, atau klik angka untuk dengar satu kata.' : slide.heading}</p>
      <div className={styles.tabs} role="tablist" aria-label="Rentang angka">
        {labels.map((label, index) => <button key={label} id={`${id}-tab-${index}`} type="button" role="tab"
          aria-selected={active === label} aria-controls={`${id}-panel`} tabIndex={active === label ? 0 : -1}
          className={styles.tab} onClick={() => select(label, true)}
          onKeyDown={event => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault(); event.stopPropagation();
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? labels.length - 1
              : (index + (event.key === 'ArrowRight' ? 1 : -1) + labels.length) % labels.length;
            select(labels[next], false);
            document.getElementById(`${id}-tab-${next}`)?.focus();
          }}>{canSpeak && <Volume2 aria-hidden="true" />}{label}</button>)}
      </div>
      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${labels.indexOf(active)}`} className={styles.content} tabIndex={0}>
        <ol key={active} className={styles.grid} style={{ '--rows': Math.ceil(visible.length / 2) } as CSSProperties}>
          {visible.map((entry, index) => <li key={`${entry.value}-${entry.term}`} className={styles.card}>
            <button type="button" className={styles.number} data-tone={index % 5} disabled={!canSpeak}
              style={{ fontSize: `${Math.min(2.6, 6 / String(entry.value).length)}cqw` }}
              aria-label={`Dengarkan ${entry.value}: ${entry.term}`} onClick={() => speak(numberSpeech(entry.term))}>{entry.value}</button>
            <div className={styles.word}>
              <div><strong dir="auto">{renderSpeech(entry.term)}</strong><span className={styles.meaning}> — {entry.meaning}</span></div>
              {entry.translit && <div className={styles.translit} dir="auto">{entry.translit}</div>}
              {entry.example && <div className={styles.example} dir="auto">{renderSpeech(entry.example)}{entry.example_translit && <span> /{entry.example_translit}/</span>}{entry.example_meaning && <span> ({entry.example_meaning})</span>}</div>}
            </div>
          </li>)}
        </ol>
      </div>
      {hasNotes && <details className={styles.notes}><summary>Catatan materi</summary>
        {slide.subheading && <p>{slide.subheading}</p>}
        {slide.pattern && <p>{slide.pattern}</p>}
        {slide.note && <p>{slide.note}</p>}
        {extras.map((item, index) => <p key={index}><strong dir="auto">{renderSpeech(item.term)}</strong>{item.translit && ` /${item.translit}/`} — {item.meaning}
          {item.example && <span> · {renderSpeech(item.example)}{item.example_translit && ` /${item.example_translit}/`}{item.example_meaning && ` (${item.example_meaning})`}</span>}</p>)}
      </details>}
    </div>
  </section>;
}
