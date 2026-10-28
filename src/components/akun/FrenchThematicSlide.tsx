import { useEffect, useId, useState, type CSSProperties, type ReactNode } from 'react';
import { Volume2 } from 'lucide-react';
import type { MateriSlide } from '@/lib/materiSlides';
import type { FrenchThematicTheme } from '@/data/frenchThematicThemes';
import { bukaKunciAudio, hentikanEbookTts, ucapkanEbook } from '@/lib/ebookTts';
import { FRENCH_THEMATIC_FRAMES } from '@/data/frenchThematicFrames';
import styles from './FrenchThematicSlide.module.css';
const GROUP_SIZE = 8;
const TONES = ['purple', 'mint', 'amber', 'coral', 'blue'];
const COLORS = ['#e95855','#3996df','#52ae72','#f6d45b','#323844','#f7f7f1','#f4a444','#f498bd','#9573cc','#a4a9b4','#9b7356','#a9d9f5','#dab255','#c5cbd5','#dfcdb0','#58c6bd'];
const SHAPES = ['circle', 'square', 'triangle', 'rectangle', 'oval', 'heart', 'star', 'diamond'];
function WordIllustration({ theme, index }: { theme: FrenchThematicTheme; index: number }) {
  if (theme.key === 'warna-bentuk') {
    return <span aria-hidden="true" className={styles.iconBox}><span className={styles.shape} data-shape={index < 16 ? 'circle' : SHAPES[index - 16]} style={{ '--color': COLORS[index < 16 ? index : (index - 16) % 5] } as CSSProperties} /></span>;
  }
  const sheet = FRENCH_THEMATIC_FRAMES[theme.key];
  const frame = sheet?.frames[index];
  const crop: CSSProperties = frame ? { backgroundSize: `${sheet.width / frame.size * 100}% ${sheet.height / frame.size * 100}%`, backgroundPosition: `${frame.x / (sheet.width - frame.size) * 100}% ${frame.y / (sheet.height - frame.size) * 100}%` } : {};
  return <span aria-hidden="true" className={styles.iconBox}><span className={styles.sprite} style={{ backgroundImage: `url("${theme.sprite}")`, backgroundPosition: `${index % 6 * 20}% ${Math.floor(index / 6) * 100 / 3}%`, ...crop }} /></span>;
}
export function FrenchThematicTitle({ theme }: { theme: FrenchThematicTheme }) {
  return <section className={`${styles.scene} ${styles.titleScene}`} aria-label={`Tema ${theme.label} bahasa Prancis`}><div className={styles.panel}>
    <span className={styles.label}>Kosakata · Bahasa Prancis</span>
    <h2 className={styles.title}>{theme.title}</h2><p className={styles.titleMeaning}>Tema {theme.label}</p>
    <div className={styles.line} /><p className={styles.intro}>24 kosakata · 3 kelompok · pola kalimat & latihan</p>
    <ul className={styles.groupList}>{theme.groups.map((group, index) => <li key={group}><span className={styles.groupNumber}>{index + 1}</span><strong>{group}</strong><WordIllustration theme={theme} index={index * GROUP_SIZE} /></li>)}</ul>
    <p className={styles.hint}>Klik kata atau ikon suara untuk mendengar pengucapan.</p>
  </div></section>;
}
export default function FrenchThematicSlide({ slide, theme, renderSpeech }: { slide: MateriSlide; theme: FrenchThematicTheme; renderSpeech: (text: string) => ReactNode }) {
  const [group, setGroup] = useState(0);
  const id = useId();
  const items = slide.items || [];
  const groups = theme.groups.filter((_, index) => items.length > index * GROUP_SIZE);
  const active = Math.min(group, Math.max(0, groups.length - 1));
  const visible = items.slice(active * GROUP_SIZE, (active + 1) * GROUP_SIZE);
  const speak = (text: string) => { bukaKunciAudio(); hentikanEbookTts(); void ucapkanEbook(text, 'fr'); };
  useEffect(() => () => hentikanEbookTts(), []);
  const select = (index: number, read: boolean) => {
    setGroup(index); hentikanEbookTts();
    if (read) speak(items.slice(index * GROUP_SIZE, (index + 1) * GROUP_SIZE).map(item => item.term).join(', '));
  };
  return <section className={styles.scene} aria-label={`Kosakata ${theme.label} bahasa Prancis`}><div className={styles.panel}>
    <span className={styles.label}>Kosakata · Bahasa Prancis</span>
    <h3 className={styles.heading}><span>Tema</span> {theme.label}</h3>
    <p className={styles.subtitle}>{theme.title} · Kata {active * GROUP_SIZE + 1}–{Math.min((active + 1) * GROUP_SIZE, items.length)} dari {items.length}</p>
    <div className={styles.line} />
    <div className={styles.tabs} role="tablist" aria-label="Kelompok kosakata">
      {groups.map((name, index) => <button type="button" role="tab" key={name} id={`${id}-tab-${index}`} aria-selected={active === index} aria-controls={`${id}-panel`} tabIndex={active === index ? 0 : -1} className={styles.tab} onClick={() => select(index, true)}
        onKeyDown={event => {
          if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
          event.preventDefault(); event.stopPropagation();
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? groups.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + groups.length) % groups.length;
          select(next, false); document.getElementById(`${id}-tab-${next}`)?.focus();
        }}><Volume2 aria-hidden="true" />{name}</button>)}
    </div>
    <div className={styles.content} id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${active}`} tabIndex={0}>
      <ol className={styles.grid} key={active} start={active * GROUP_SIZE + 1} style={{ '--rows': Math.ceil(visible.length / 2) } as CSSProperties}>
        {visible.map((item, localIndex) => {
          const index = active * GROUP_SIZE + localIndex;
          return <li key={index} className={styles.card} data-tone={TONES[index % TONES.length]}>
            <span className={styles.number} aria-hidden="true">{index + 1}</span>
            <div className={styles.word}><div className={styles.term}>{renderSpeech(item.term)}</div><p className={styles.meaning}>— {item.meaning}</p>{item.example && <p className={styles.example}>{renderSpeech(item.example)}{item.example_meaning && <span>{item.example_meaning}</span>}</p>}</div>
            <button type="button" className={styles.illustrationButton} aria-label={`Dengarkan ${item.term}`} onClick={() => speak(item.term)}><WordIllustration theme={theme} index={index} /><Volume2 className={styles.sound} aria-hidden="true" /></button>
          </li>;
        })}
      </ol>
    </div>
    <p className={styles.hint}>Klik tab, kata, atau gambar untuk mendengar pengucapannya.</p>
  </div></section>;
}
