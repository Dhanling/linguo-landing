import { useEffect, useId, useState, type CSSProperties, type ReactNode } from 'react';
import { UserRound, UsersRound, Volume2 } from 'lucide-react';
import type { MateriSlide } from '@/lib/materiSlides';
import { arabicPronouns, PRONOUN_GROUPS, type PronounGroup } from '@/lib/arabicPronouns';
import { bukaKunciAudio, hentikanEbookTts, ucapkanEbook } from '@/lib/ebookTts';
import styles from './ArabicPronounSlide.module.css';

export default function ArabicPronounSlide({ slide, renderSpeech }: {
  slide: MateriSlide; renderSpeech: (text: string) => ReactNode;
}) {
  const [group, setGroup] = useState<PronounGroup>('singular');
  const id = useId();
  const all = arabicPronouns(slide);
  const visible = all.filter(pronoun => pronoun.group === group);
  const index = PRONOUN_GROUPS.findIndex(item => item.id === group);
  const current = PRONOUN_GROUPS[index];
  useEffect(() => () => hentikanEbookTts(), []);
  const speak = (text: string) => {
    bukaKunciAudio(); hentikanEbookTts(); void ucapkanEbook(text, 'ar');
  };
  const select = (next: PronounGroup, read: boolean) => {
    setGroup(next); hentikanEbookTts();
    if (read) speak(all.filter(pronoun => pronoun.group === next).map(pronoun => pronoun.item.term).join('، '));
  };
  return <section className={styles.scene} aria-label="Kata ganti orang bahasa Arab MSA">
    <div className={styles.panel}>
      <span className={styles.label}>Kosakata · Arab MSA · {all.length} kata ganti</span>
      <h3 className={styles.heading}><bdi dir="rtl">اَلضَّمَائِرُ</bdi><span> — kata ganti orang</span></h3>
      <p className={styles.subtitle}>Kenali siapa yang berbicara, diajak bicara, dan dibicarakan.</p>
      <div className={styles.tabs} role="tablist" aria-label="Jumlah orang">
        {PRONOUN_GROUPS.map((tab, i) => <button key={tab.id} type="button" role="tab" id={`${id}-tab-${i}`}
          aria-selected={group === tab.id} aria-controls={`${id}-panel`} tabIndex={group === tab.id ? 0 : -1}
          className={styles.tab} onClick={() => select(tab.id, true)}
          onKeyDown={event => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault(); event.stopPropagation();
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (i + (event.key === 'ArrowRight' ? 1 : -1) + 3) % 3;
            select(PRONOUN_GROUPS[next].id, false);
            document.getElementById(`${id}-tab-${next}`)?.focus();
          }}><Volume2 aria-hidden="true" />{tab.label}<span>{all.filter(pronoun => pronoun.group === tab.id).length}</span></button>)}
      </div>
      <div className={styles.groupDescription}><strong>{current.label}</strong> · {current.description}<span>Klik kata Arab atau ikon suara untuk mendengar.</span></div>
      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${index}`} tabIndex={0} className={styles.content}>
        <ul key={group} className={styles.grid} style={{ '--rows': Math.ceil(visible.length / 2) } as CSSProperties}>
          {visible.map(pronoun => <li key={pronoun.key} className={styles.card} data-tone={pronoun.tone}>
            <div className={styles.identity} aria-hidden="true">
              {pronoun.group === 'singular' ? <UserRound /> : <UsersRound />}
              <span>{pronoun.count} orang</span>
            </div>
            <div className={styles.word}>
              <div className={styles.role}>{pronoun.role}</div>
              <div className={styles.arabic} dir="rtl">{renderSpeech(pronoun.item.term)}</div>
              {pronoun.item.translit && <div className={styles.translit}>/{pronoun.item.translit}/</div>}
              <p className={styles.meaning}>{pronoun.item.meaning}</p>
            </div>
            <button type="button" className={styles.sound} aria-label={`Dengarkan ${pronoun.item.term}`} onClick={() => speak(pronoun.item.term)}><Volume2 /></button>
          </li>)}
        </ul>
      </div>
      <div className={styles.note}>{group === 'plural'
        ? <><bdi dir="rtl">نَحْنُ</bdi> (kami/kita) dipakai untuk dua orang atau lebih. Bentuk jamak lainnya di sini untuk tiga orang atau lebih.</>
        : group === 'dual' ? <>Bentuk berdua dipakai untuk laki-laki maupun perempuan. Perhatikan perbedaan “kamu berdua” dan “mereka berdua”.</>
          : <>Laki-laki dan perempuan memakai <bdi dir="rtl">أَنَا</bdi> yang sama. “Kamu” dan “dia” memiliki bentuk berbeda sesuai gender.</>}</div>
      {(slide.subheading || slide.note) && <details className={styles.sourceNote}><summary>Catatan materi</summary>{slide.subheading && <p>{slide.subheading}</p>}{slide.note && <p>{slide.note}</p>}</details>}
    </div>
  </section>;
}
