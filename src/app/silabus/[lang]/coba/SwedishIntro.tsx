"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Award, Check, Clock3, FileText, ListChecks, Mic, Sparkles } from "lucide-react";
import { RectFlag } from "@/components/RectFlag";
import { BookingButton, speakingTestPrice } from "./SpeakingTest";
import { formatRupiah } from "@/lib/trial-pricing";
import styles from "./SwedishIntro.module.css";

const bookingUrl = "https://wa.me/6282116859493?text=" + encodeURIComponent("Halo Linguo! Aku ingin booking speaking test Bahasa Swedia. Boleh info biaya dan jadwal yang tersedia?");

export default function SwedishIntro({ total, listening, onStart }: { total: number; listening: number; onStart: () => void }) {
  const price = speakingTestPrice("swedish", "Swedish");
  const duration = listening ? "~5 mnt" : "~2 mnt";
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link href="/silabus/swedish" className={styles.back}><ArrowLeft size={15} /> Kembali ke silabus</Link>
        <section className={styles.hero} aria-labelledby="placement-title">
          <div className={styles.copy}>
            <div className={styles.flag}><RectFlag code="SE" h={47} /></div>
            <h1 id="placement-title">Placement Test<br /><span>Bahasa Swedia</span></h1>
            <p>Kenali level CEFR kamu dan temukan titik awal belajar yang tepat.</p>
            <button type="button" onClick={onStart} className={styles.primary}>Mulai Test Gratis <ArrowRight size={21} /></button>
            <div className={styles.note}><Check size={15} /> Gratis · Hasil langsung keluar · Tanpa tekanan</div>
          </div>
          <div className={styles.art}>
            <Image src="/illustrations/placement/swedish-study-v1.webp" alt="Ilustrasi siswi belajar bahasa Swedia dengan laptop di depan jendela menghadap Stockholm" width={1536} height={1024} sizes="(max-width: 760px) 100vw, 55vw" priority />
            <div className={styles.caption}><Sparkles size={16} /> Små steg, stora möjligheter!<span>Langkah kecil, peluang besar.</span></div>
          </div>
        </section>
        <div className={styles.stats} aria-label="Ringkasan tes gratis">
          {[{ Icon: ListChecks, value: String(total), label: "SOAL" }, { Icon: Clock3, value: duration, label: "DURASI" }, { Icon: Award, value: "CEFR", label: "ACUAN LEVEL" }].map(({ Icon, value, label }) => <div className={styles.stat} key={label}><span><Icon size={26} /></span><div><strong>{value}</strong><small>{label}</small></div></div>)}
        </div>
        <section className={styles.paths} aria-labelledby="paths-title">
          <div className={styles.sectionHeading}><div><h2 id="paths-title">Pilih tes kamu</h2></div></div>
          <div className={styles.cards}>
            <article className={`${styles.card} ${styles.free}`}>
              <div className={styles.cardTop}><span className={styles.cardIcon}><FileText size={29} /></span><span className={styles.badge}>Gratis</span></div>
              <h3>Self-assessment</h3><p>Tes mandiri cepat untuk cek levelmu.</p>
              <div className={styles.cardBody}>
                <ul>{[listening ? "Grammar, reading & listening" : "Grammar & reading", `${listening ? "±5" : "±2"} menit`].map(t => <li key={t}><Check size={17} />{t}</li>)}</ul>
                <Image src="/illustrations/placement/self-assessment-v1.webp" alt="" width={640} height={560} sizes="(max-width: 760px) 50vw, 260px" className={styles.cardArt} />
              </div>
              <button type="button" onClick={onStart} className={styles.primary}>Mulai Test Gratis <ArrowRight size={20} /></button>
            </article>
            <article className={`${styles.card} ${styles.speaking}`}>
              <div className={styles.cardTop}><span className={styles.cardIcon}><Mic size={29} /></span><span className={styles.badge}>{formatRupiah(price)}</span></div>
              <h3>Speaking Test</h3><p>Tes live dengan pengajar untuk evaluasi lebih akurat.</p>
              <div className={styles.cardBody}>
                <ul>{["1-on-1 via video call", "60 menit"].map(t => <li key={t}><Check size={17} />{t}</li>)}</ul>
                <Image src="/illustrations/placement/speaking-test-v1.webp" alt="" width={640} height={560} sizes="(max-width: 760px) 50vw, 260px" className={styles.cardArt} />
              </div>
              <BookingButton slug="swedish" langFull="Swedish" langTitle="Bahasa Swedia" price={price} source="intro" label="Bayar & Booking" className={styles.secondary} />
              <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className={styles.admin}>Tanya admin dulu</a>
            </article>
          </div>
          <p className={styles.footnote}><Award size={15} /> Self-assessment memberi estimasi level untuk belajar, bukan sertifikasi resmi CEFR.</p>
        </section>
      </div>
    </div>
  );
}
