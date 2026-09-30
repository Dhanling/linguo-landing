"use client";
// linguo-patch:scroll-reveal-v1 — lightweight scroll-reveal wrapper (fade + rise).
// Respects prefers-reduced-motion and animates only once per element.
//
// [reveal-lcp-v1] Isinya SELALU tampil di HTML server. Dulu `initial` opacity 0
// ditulis framer-motion ke HTML, jadi bagian yang sudah ada di layar pertama
// (mis. "Semua kebutuhan belajar bahasa…" di HP) baru kelihatan setelah seluruh
// JS halaman hydrate — Google mencatatnya sebagai LCP ±9 dtk. Sekarang animasi
// baru "dipersenjatai" saat mount, dan HANYA untuk elemen yang mulai di BAWAH
// layar: menyembunyikannya tak terlihat siapa pun, lalu dia muncul saat di-scroll
// seperti biasa. Elemen yang sudah di layar dibiarkan diam (tanpa kedip).
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

export default function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -80px 0px" });
  const [armed, setArmed] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el && el.getBoundingClientRect().top > window.innerHeight) setArmed(true);
  }, []);

  const hidden = armed && !inView;
  const dy = reduce ? 0 : y;
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={false}
      animate={hidden ? { opacity: 0, y: dy } : { opacity: 1, y: 0 }}
      transition={hidden ? { duration: 0 } : { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
