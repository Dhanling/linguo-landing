"use client";

/* [ebook-panduan-tour-v1] Tur berpandu di dalam reader e-book.

   Kenapa ada: reader ini sudah menyimpan banyak hal yang tidak terlihat —
   ketuk kata untuk mendengar pelafalannya, angka persen yang bisa diketik,
   dan tombol "Kerjakan latihan" yang cuma muncul di halaman latihan. Semua itu
   tak berguna kalau siswa tak pernah tahu ada. Teks bantuan panjang di modal
   terpisah praktis tak dibaca; yang dibaca adalah kalimat pendek yang menunjuk
   LANGSUNG ke tombol yang dimaksud.

   Sorotannya SENGAJA tidak memakai mask SVG: latarnya disusun dari empat
   persegi (atas/kiri/kanan/bawah) yang mengelilingi target, jadi lubang di
   tengahnya benar-benar bolong — ketukan di dalam lubang mendarat di tombol
   aslinya, bukan tertahan lapisan gelap. Itu yang membuat langkah "coba klik
   tombolnya sekarang" bisa benar-benar dicoba, bukan cuma dibaca.

   Posisi target dihitung ulang berkala (bukan sekali waktu langkah dibuka):
   bilah atas reader menyempit sendiri waktu judulnya panjang, dan halaman PDF
   yang baru selesai diraster menggeser bilah bawah beberapa piksel. */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useT } from "@/lib/uiLang";
import { ChevronLeft, ChevronRight, X, Sparkles } from "lucide-react";

export type LangkahPanduan = {
  /** Selektor target; yang pertama ketemu yang dipakai. Kosong = kartu di tengah layar. */
  target?: string[];
  judul: string;
  isi: string;
  /** Baris kecil di bawah isi — biasanya pintasan papan tik. */
  tip?: string;
};

type Kotak = { atas: number; kiri: number; lebar: number; tinggi: number };

/** Jarak napas antara sorotan dan tepi elemen yang disorot. */
const SELA = 8;
/** Jarak kartu penjelasan dari sorotan. */
const JARAK_KARTU = 14;
const LEBAR_KARTU = 320;
const TEPI = 12;

function cariTarget(sel: string[] | undefined): HTMLElement | null {
  if (!sel?.length) return null;
  for (const s of sel) {
    const el = document.querySelector<HTMLElement>(s);
    // Elemen yang ada di DOM tapi disembunyikan (mis. tombol zoom di layar HP)
    // tidak boleh disorot: sorotannya akan jadi kotak nol di pojok kiri atas.
    if (el && el.getBoundingClientRect().width > 0) return el;
  }
  return null;
}

export default function EbookPanduan({
  langkah,
  onClose,
  mulaiDari = 0,
}: {
  langkah: LangkahPanduan[];
  onClose: () => void;
  mulaiDari?: number;
}) {
  const t = useT();
  const [i, setI] = useState(mulaiDari);
  const [kotak, setKotak] = useState<Kotak | null>(null);
  const kartuRef = useRef<HTMLDivElement | null>(null);
  const [tinggiKartu, setTinggiKartu] = useState(150);

  const kini = langkah[Math.min(i, langkah.length - 1)];
  const terakhir = i >= langkah.length - 1;

  const ukur = useCallback(() => {
    const el = cariTarget(kini?.target);
    if (!el) { setKotak(null); return; }
    const r = el.getBoundingClientRect();
    setKotak({
      atas: Math.max(0, r.top - SELA),
      kiri: Math.max(0, r.left - SELA),
      lebar: r.width + SELA * 2,
      tinggi: r.height + SELA * 2,
    });
  }, [kini]);

  useLayoutEffect(() => { ukur(); }, [ukur]);

  useEffect(() => {
    // Pengukuran berkala: lebih murah daripada memasang ResizeObserver ke tiap
    // kemungkinan target, dan tahan terhadap tata letak yang bergeser sendiri.
    const jam = window.setInterval(ukur, 400);
    window.addEventListener("resize", ukur);
    window.addEventListener("scroll", ukur, true);
    return () => {
      window.clearInterval(jam);
      window.removeEventListener("resize", ukur);
      window.removeEventListener("scroll", ukur, true);
    };
  }, [ukur]);

  useEffect(() => {
    if (kartuRef.current) setTinggiKartu(kartuRef.current.offsetHeight);
  }, [i, kini]);

  const maju = useCallback(() => {
    if (terakhir) onClose();
    else setI((v) => v + 1);
  }, [terakhir, onClose]);

  const mundur = useCallback(() => setI((v) => Math.max(0, v - 1)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); onClose(); }
      else if (e.key === "ArrowRight" || e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); maju(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); e.stopPropagation(); mundur(); }
    };
    // capture: reader punya pintasan panah sendiri untuk membalik halaman —
    // selama tur berjalan panah milik tur yang menang.
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [maju, mundur, onClose]);

  /* Kartu ditaruh di bawah sorotan kalau muat; kalau tidak, di atasnya. Waktu
     tak ada target sama sekali, kartunya melayang di tengah layar. */
  const gaya = useMemo(() => {
    const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
    const vh = typeof window !== "undefined" ? window.innerHeight : 768;
    const lebar = Math.min(LEBAR_KARTU, vw - TEPI * 2);
    if (!kotak) {
      return {
        kiri: (vw - lebar) / 2,
        atas: Math.max(TEPI, vh / 2 - tinggiKartu / 2),
        lebar,
        panah: null as null | { kiri: number; keBawah: boolean },
      };
    }
    const bawah = kotak.atas + kotak.tinggi;
    const muatBawah = bawah + JARAK_KARTU + tinggiKartu <= vh - TEPI;
    const atas = muatBawah
      ? bawah + JARAK_KARTU
      : Math.max(TEPI, kotak.atas - JARAK_KARTU - tinggiKartu);
    const tengah = kotak.kiri + kotak.lebar / 2;
    const kiri = Math.min(Math.max(TEPI, tengah - lebar / 2), vw - lebar - TEPI);
    return {
      kiri,
      atas,
      lebar,
      panah: { kiri: Math.min(Math.max(16, tengah - kiri), lebar - 16), keBawah: muatBawah },
    };
  }, [kotak, tinggiKartu]);

  if (!kini) return null;

  /* Latar gelap disusun dari empat persegi supaya lubang sorotannya benar-benar
     bolong — lihat catatan di kepala berkas. */
  const tirai = kotak
    ? [
        { top: 0, left: 0, width: "100%", height: kotak.atas },
        { top: kotak.atas, left: 0, width: kotak.kiri, height: kotak.tinggi },
        { top: kotak.atas, left: kotak.kiri + kotak.lebar, right: 0, height: kotak.tinggi },
        { top: kotak.atas + kotak.tinggi, left: 0, width: "100%", bottom: 0 },
      ]
    : [{ top: 0, left: 0, width: "100%", height: "100%" }];

  const isi = (
    <div className="ebook-panduan fixed inset-0 z-[130]">
      {tirai.map((s, n) => (
        <div
          key={n}
          onClick={maju}
          className="absolute bg-black/70 transition-[top,left,width,height] duration-200"
          style={s as React.CSSProperties}
        />
      ))}

      {kotak && (
        <div
          className="ebook-panduan-sorot pointer-events-none absolute rounded-xl transition-[top,left,width,height] duration-200"
          style={{ top: kotak.atas, left: kotak.kiri, width: kotak.lebar, height: kotak.tinggi }}
        />
      )}

      <div
        ref={kartuRef}
        className="ebook-panduan-kartu absolute rounded-2xl border border-white/10 bg-[#101010] p-4 shadow-2xl"
        style={{ top: gaya.atas, left: gaya.kiri, width: gaya.lebar }}
      >
        {gaya.panah && (
          <span
            className="absolute h-3 w-3 rotate-45 border-white/10 bg-[#101010]"
            style={
              gaya.panah.keBawah
                ? { top: -7, left: gaya.panah.kiri - 6, borderLeftWidth: 1, borderTopWidth: 1 }
                : { bottom: -7, left: gaya.panah.kiri - 6, borderRightWidth: 1, borderBottomWidth: 1 }
            }
          />
        )}

        <div className="flex items-start gap-2">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#3ED9C0]" />
          <h3 className="flex-1 text-[14px] font-extrabold leading-snug text-white">{kini.judul}</h3>
          <button
            onClick={onClose}
            className="-mr-1 -mt-1 rounded-lg p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
            aria-label={t("Tutup panduan")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-2 text-[13px] leading-relaxed text-white/70">{kini.isi}</p>
        {kini.tip && (
          <p className="mt-2 rounded-lg bg-white/[0.06] px-2.5 py-1.5 text-[11.5px] font-semibold leading-snug text-white/50">
            {kini.tip}
          </p>
        )}

        <div className="mt-3.5 flex items-center gap-2">
          <div className="flex flex-1 items-center gap-1.5" aria-hidden>
            {langkah.map((_, n) => (
              <span
                key={n}
                className={`h-1.5 rounded-full transition-all ${
                  n === i ? "w-4 bg-[#3ED9C0]" : "w-1.5 bg-white/20"
                }`}
              />
            ))}
          </div>
          {i > 0 && (
            <button
              onClick={mundur}
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[12px] font-bold text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {t("Kembali")}
            </button>
          )}
          <button
            onClick={maju}
            className="flex items-center gap-1 rounded-lg bg-[#3ED9C0] px-3 py-1.5 text-[12.5px] font-extrabold text-black transition hover:brightness-95"
          >
            {terakhir ? t("Mengerti") : t("Berikutnya")}
            {!terakhir && <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        </div>

        {!terakhir && (
          <button
            onClick={onClose}
            className="mt-1.5 w-full rounded-lg py-1 text-[11.5px] font-semibold text-white/35 transition hover:text-white/70"
          >
            {t("Lewati panduan")}
          </button>
        )}
      </div>

      <style jsx global>{`
        /* Cincin denyut. Dua lapis: garis tetap yang menandai batas tombol,
           dan gelombang yang melebar keluar supaya matanya tertarik ke sana
           walau tombolnya kecil. */
        .ebook-panduan-sorot {
          box-shadow: 0 0 0 2px #3ed9c0, 0 0 22px rgba(62, 217, 192, 0.45);
        }
        .ebook-panduan-sorot::after {
          content: "";
          position: absolute;
          inset: -3px;
          border-radius: inherit;
          border: 2px solid rgba(62, 217, 192, 0.85);
          animation: ebook-panduan-denyut 1.8s ease-out infinite;
        }
        @keyframes ebook-panduan-denyut {
          0% { transform: scale(1); opacity: 0.9; }
          70% { transform: scale(1.12); opacity: 0; }
          100% { transform: scale(1.12); opacity: 0; }
        }
        .ebook-panduan-kartu {
          animation: ebook-panduan-masuk 220ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes ebook-panduan-masuk {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ebook-panduan-sorot::after,
          .ebook-panduan-kartu { animation: none !important; }
        }
      `}</style>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(isi, document.body) : null;
}
