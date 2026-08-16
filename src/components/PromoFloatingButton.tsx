"use client";

// [promo-merdeka-v1] Sticker promo melayang (ala Ruangguru) → inbox WA CS.
//
// Posisinya KIRI-bawah, bukan kanan-bawah: ChatWidget sudah memakai kanan-bawah
// (launcher 64px di right/bottom 20px + gelembung teaser selebar 270px sampai
// bottom 96px). Menaruh sticker di sana akan saling menutupi.
//
// z-index 9985 → di bawah launcher chat (9990) dan panelnya (9998/9999), tapi
// di atas konten halaman biasa.
//
// TIDAK bisa ditutup — sengaja, promonya cuma 3 hari. Sebagai gantinya sticker
// BISA DIGESER ke mana saja kalau menghalangi, dan posisinya diingat selama tab
// masih terbuka.
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { PROMO, promoWaUrl } from "@/lib/promoMerdeka";
import { usePromoMerdeka } from "@/components/PromoMerdeka";

// Samakan dengan daftar di PromoTopBar — halaman ber-chrome sendiri dilewati.
const EXCLUDED = ["/akun", "/student", "/laporan-b2b", "/pendataan", "/payment"];

const POS_KEY = "linguo_promo_merdeka_pos";
const EDGE = 8; // jarak minimum dari tepi layar
const DRAG_SLOP = 5; // geseran di bawah ini masih dihitung sebagai klik biasa

type Pos = { left: number; bottom: number };

export default function PromoFloatingButton() {
  const pathname = usePathname() || "/";
  const { active } = usePromoMerdeka();
  const [preview, setPreview] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null); // null = posisi bawaan (kiri-bawah)
  const [dragging, setDragging] = useState(false);

  const ref = useRef<HTMLAnchorElement | null>(null);
  const posRef = useRef<Pos | null>(null); // cermin `pos` — dibaca handler tanpa kena closure basi
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const startRef = useRef({ px: 0, py: 0, left: 0, bottom: 0 });

  const visible =
    (active || preview) && !EXCLUDED.some((p) => pathname.startsWith(p));

  useEffect(() => {
    setPreview(new URLSearchParams(window.location.search).get("promo") === "preview");
  }, [pathname]);

  // Posisi disimpan sebagai jarak dari KIRI dan dari BAWAH (bukan top): dengan
  // begitu sticker tetap menempel di dekat dasar layar saat jendela diubah
  // ukurannya atau bilah alamat HP menyusut.
  const clamp = useCallback((p: Pos): Pos => {
    const el = ref.current;
    const w = el?.offsetWidth ?? 0;
    const h = el?.offsetHeight ?? 0;
    return {
      left: Math.min(Math.max(p.left, EDGE), Math.max(EDGE, window.innerWidth - w - EDGE)),
      bottom: Math.min(Math.max(p.bottom, EDGE), Math.max(EDGE, window.innerHeight - h - EDGE)),
    };
  }, []);

  const apply = useCallback((p: Pos) => {
    posRef.current = p;
    setPos(p);
  }, []);

  // Pulihkan posisi terakhir (per tab).
  useEffect(() => {
    if (!visible) return;
    try {
      const raw = sessionStorage.getItem(POS_KEY);
      if (!raw) return;
      const p = JSON.parse(raw);
      if (typeof p?.left === "number" && typeof p?.bottom === "number") apply(clamp(p));
    } catch {
      /* sessionStorage diblokir / JSON rusak → pakai posisi bawaan */
    }
  }, [visible, clamp, apply]);

  // Jendela mengecil → tarik kembali ke dalam layar supaya tak hilang di luar tepi.
  useEffect(() => {
    if (!visible) return;
    const onResize = () => {
      if (posRef.current) apply(clamp(posRef.current));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [visible, clamp, apply]);

  if (!visible) return null;

  // CATATAN PENTING: pointer handler, style, dan onClick WAJIB berada di SATU
  // elemen yang sama. setPointerCapture bikin Chromium me-retarget event `click`
  // ke elemen peng-capture — kalau onClick dipasang di anak (mis. <img>), klik
  // tak pernah terpanggil dan tak ada error apa pun yang muncul.
  const onPointerDown = (e: React.PointerEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el || e.button !== 0) return;
    const r = el.getBoundingClientRect();
    startRef.current = {
      px: e.clientX,
      py: e.clientY,
      left: r.left,
      bottom: window.innerHeight - r.bottom,
    };
    movedRef.current = false;
    draggingRef.current = true;
    setDragging(true);
    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - startRef.current.px;
    const dy = e.clientY - startRef.current.py;
    if (!movedRef.current) {
      if (Math.abs(dx) <= DRAG_SLOP && Math.abs(dy) <= DRAG_SLOP) return;
      movedRef.current = true;
    }
    apply(
      clamp({
        left: startRef.current.left + dx,
        bottom: startRef.current.bottom - dy, // y layar ke bawah, `bottom` ke atas
      }),
    );
  };

  const endDrag = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    try {
      ref.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* pointer sudah dilepas duluan */
    }
    if (movedRef.current && posRef.current) {
      try {
        sessionStorage.setItem(POS_KEY, JSON.stringify(posRef.current));
      } catch {
        /* tak apa — posisi cukup bertahan selama halaman ini hidup */
      }
    }
  };

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Habis digeser → jangan buka WA. Tanpa guard ini, setiap selesai menggeser
    // WhatsApp ikut terbuka.
    if (movedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const label = `${PROMO.badge} — Simulasi TOEFL Rp ${PROMO.price.toLocaleString("id-ID")}`;

  return (
    <a
      ref={ref}
      href={promoWaUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label}, tanya lewat WhatsApp. Bisa digeser.`}
      title="Klik untuk tanya via WhatsApp · tahan lalu geser untuk memindahkan"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClick={onClick}
      onDragStart={(e) => e.preventDefault()}
      // touchAction none: tanpa ini, geseran jari di atas sticker malah men-scroll
      // halaman dan sticker tak pernah ikut pindah.
      style={{ touchAction: "none", ...(pos ? { left: pos.left, bottom: pos.bottom } : {}) }}
      className={`fixed z-[9985] block select-none drop-shadow-[0_10px_24px_rgba(0,0,0,0.35)] ${
        pos ? "" : "bottom-4 left-4 sm:bottom-5 sm:left-5"
      } ${
        dragging
          ? "cursor-grabbing scale-105"
          : "cursor-grab transition-transform duration-200 hover:scale-105 active:scale-95 motion-safe:animate-[promoFloat_3s_ease-in-out_infinite]"
      }`}
    >
      <Image
        src="/promo-merdeka-sticker.png"
        alt={label}
        width={400}
        height={267}
        draggable={false}
        priority={false}
        className="pointer-events-none h-auto w-[132px] select-none sm:w-[168px]"
      />
    </a>
  );
}
