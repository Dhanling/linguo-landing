import { useEffect, useId, useState, type CSSProperties, type ReactNode } from 'react';
import { UsersRound, Volume2 } from 'lucide-react';
import type { MateriSlide } from '@/lib/materiSlides';
import type { NumberTheme } from '@/data/numberSlideThemes';
import { personalPronouns, PERSON_TABS, type PersonTab } from '@/lib/personalPronouns';
import { bukaKunciAudio, hentikanEbookTts, ucapkanEbook, bisaDibunyikan } from '@/lib/ebookTts';
import styles from './PersonalPronounSlide.module.css';
const PAGE_SIZE = 4;
export default function PersonalPronounSlide({ slide, theme, lang, renderSpeech }: {
  slide: MateriSlide; theme: NumberTheme; lang?: string | null; renderSpeech: (text: string) => ReactNode;
}) {
  const all = personalPronouns(slide);
  const tabs = PERSON_TABS.filter(tab => all.some(entry => entry.tab === tab.id));
  const [selected, setSelected] = useState<PersonTab>(tabs[0]?.id || 'related');
  const [page, setPage] = useState(0);
  const id = useId();
  const active = tabs.find(tab => tab.id === selected) || tabs[0] || PERSON_TABS[3];
  const entries = all.filter(entry => entry.tab === active.id);
  const pages = Math.ceil(entries.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(0, pages - 1));
  const visible = entries.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  const code = lang || theme.code;
  useEffect(() => () => hentikanEbookTts(), []);
  const speak = (text: string) => {
    if (!bisaDibunyikan(code)) return;
    bukaKunciAudio(); hentikanEbookTts(); void ucapkanEbook(text, code);
  };
  const select = (next: PersonTab, read: boolean) => {
    setSelected(next); setPage(0); hentikanEbookTts();
    if (read) speak(all.filter(entry => entry.tab === next).map(entry => entry.item.term).join(', '));
  };
  return <section className={styles.scene} aria-label={`Kata ganti orang bahasa ${theme.label}`}>
    <div className={styles.panel}>
      <span className={styles.label}>Kosakata · {theme.label}</span>
      <h3 className={styles.heading}>Kata ganti orang</h3>
      <p className={styles.subtitle}>Kenali siapa yang berbicara, diajak bicara, dan dibicarakan.</p>
      <div className={styles.tabs} role="tablist" aria-label="Peran kata ganti">
        {tabs.map((tab, i) => <button key={tab.id} type="button" role="tab" id={`${id}-tab-${i}`}
          aria-selected={active.id === tab.id} aria-controls={`${id}-panel`} tabIndex={active.id === tab.id ? 0 : -1}
          className={styles.tab} onClick={() => select(tab.id, true)}
          onKeyDown={event => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault(); event.stopPropagation();
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (i + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
            select(tabs[next].id, false); document.getElementById(`${id}-tab-${next}`)?.focus();
          }}><Volume2 aria-hidden="true" />{tab.label}<span>{all.filter(entry => entry.tab === tab.id).length}</span></button>)}
      </div>
      <div className={styles.groupDescription}>{active.description}</div>
      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${tabs.indexOf(active)}`} tabIndex={0} className={styles.content}>
        <ul key={`${active.id}:${safePage}`} className={styles.grid} style={{ '--rows': Math.ceil(visible.length / 2) } as CSSProperties}>
          {visible.map(({ item, index }) => <li key={index} className={styles.card} data-tone={active.tone}>
            <div className={styles.identity} aria-hidden="true"><UsersRound /><span>{active.person}</span></div>
            <div className={styles.word}>
              <div className={styles.role}>{active.label}</div>
              <div className={styles.arabic} dir="auto" style={{ fontSize: `${Math.max(1.15, Math.min(2.1, 22 / Math.max(1, item.term.length)))}cqw` }}>{renderSpeech(item.term)}</div>
              {item.translit && <div className={styles.translit}>/{item.translit}/</div>}
              <p className={styles.meaning}>{item.meaning}</p>
              {item.example && <p className={styles.example}><span dir="auto">{renderSpeech(item.example)}</span>{item.example_translit && <span>/{item.example_translit}/</span>}{item.example_meaning && <span>{item.example_meaning}</span>}</p>}
            </div>
            {bisaDibunyikan(code) && <button type="button" className={styles.sound} aria-label={`Dengarkan ${item.term}`} onClick={() => speak(item.term)}><Volume2 /></button>}
          </li>)}
        </ul>
      </div>
      <div className={styles.note}><span>Klik tab atau ikon suara untuk mendengar.</span>{pages > 1 && <div className={styles.pager}>
        <button type="button" disabled={safePage === 0} aria-label="Bentuk sebelumnya" onClick={() => { hentikanEbookTts(); setPage(safePage - 1); }}>‹</button>
        <span aria-live="polite">{safePage + 1} / {pages}</span>
        <button type="button" disabled={safePage >= pages - 1} aria-label="Bentuk berikutnya" onClick={() => { hentikanEbookTts(); setPage(safePage + 1); }}>›</button>
      </div>}</div>
      {(slide.subheading || slide.note) && <details className={styles.sourceNote}><summary>Catatan materi</summary>{slide.subheading && <p>{slide.subheading}</p>}{slide.note && <p>{slide.note}</p>}</details>}
    </div>
  </section>;
}
