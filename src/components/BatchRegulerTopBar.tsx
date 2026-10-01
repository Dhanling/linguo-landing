"use client";

// [bar-batch-reguler-v1] Pita hitung mundur paling atas — penerus PromoTopBar
// (Promo Merdeka) yang jendelanya sudah lewat. Isinya: batas pendaftaran batch
// Kelas Reguler terdekat + harga coret, mengarah ke /jadwal-kelas-reguler.
//
// Mekanisme tingginya sama persis dengan PromoTopBar: bar ini `fixed`, jadi
// tingginya diumumkan ke CSS lewat --promo-bar-h supaya <body> dan semua
// nav/header `sticky top-[var(--promo-bar-h,0px)]` ikut turun. Variabel itu
// sengaja DIPAKAI ULANG (bukan bikin variabel baru) supaya semua halaman yang
// sudah memakainya langsung ikut, tanpa disentuh satu-satu.
//
// Datanya dari /api/batch-reguler-terdekat (cache CDN 5 menit). Kalau tidak ada
// batch yang masih buka, barnya tidak muncul sama sekali.
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Hourglass } from "lucide-react";
import { isPromoActive } from "@/lib/promoMerdeka";

// Halaman ber-chrome sendiri (dashboard siswa, laporan, form, pengerjaan kuis)
// dilewati — daftar yang sama dengan PromoTopBar.
const EXCLUDED = [
  "/akun", "/student", "/laporan-b2b", "/pendataan", "/payment", "/kuis",
  "/alquran", // [quran-reader-v1] layar baca penuh
];

// Harga normal yang dicoret. Sinkron dengan PRICE_STRIKE di halaman
// /jadwal-kelas-reguler — kalau salah satu diubah, ubah dua-duanya.
const PRICE_STRIKE = 500000;

type BatchBar = {
  batchMonth: string | null;
  closesAt: string;
  startDate: string;
  price: number;
  languages: number;
};

const rp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

function labelBulan(batchMonth: string | null): string {
  if (!batchMonth) return "Batch Terdekat";
  const d = new Date(`${String(batchMonth).slice(0, 10)}T00:00:00`);
  if (isNaN(d.getTime())) return "Batch Terdekat";
  return `Batch ${d.toLocaleDateString("id-ID", { month: "long" })}`;
}

function hitungMundur(ms: number): string {
  const total = Math.floor(ms / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return d > 0 ? `${d} hari ${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// Versi ringkas untuk HP: "Rp500rb" & "3h 12:34:56" — biar bar muat 2 baris.
const rpPendek = (n: number) =>
  n % 1000 === 0 ? `Rp${(n / 1000).toLocaleString("id-ID")}rb` : rp(n);

function hitungMundurPendek(ms: number): string {
  const total = Math.floor(ms / 1000);
  const d = Math.floor(total / 86400);
  const pad = (n: number) => String(n).padStart(2, "0");
  const jam = `${pad(Math.floor((total % 86400) / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
  return d > 0 ? `${d}h ${jam}` : jam;
}

export default function BatchRegulerTopBar() {
  const pathname = usePathname() || "/";
  const ref = useRef<HTMLDivElement | null>(null);
  const [batch, setBatch] = useState<BatchBar | null>(null);
  const [sisa, setSisa] = useState(0);

  const dilewati = EXCLUDED.some((p) => pathname.startsWith(p));

  useEffect(() => {
    // Promo Merdeka menang kalau jendelanya kebetulan buka: dua bar `fixed`
    // akan saling menimpa DAN berebut --promo-bar-h.
    if (dilewati || isPromoActive()) return;
    let batal = false;
    fetch("/api/batch-reguler-terdekat")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!batal && j?.batch) setBatch(j.batch as BatchBar);
      })
      .catch(() => {});
    return () => {
      batal = true;
    };
  }, [dilewati]);

  // Detik-detikan: bar juga menutup dirinya sendiri kalau halamannya dibiarkan
  // terbuka melewati batas pendaftaran.
  useEffect(() => {
    if (!batch) return;
    const akhir = new Date(batch.closesAt).getTime();
    const tick = () => setSisa(Math.max(0, akhir - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [batch]);

  const hidden = dilewati || !batch || sisa <= 0;

  useEffect(() => {
    const root = document.documentElement;
    if (hidden) {
      root.style.setProperty("--promo-bar-h", "0px");
      return;
    }
    const el = ref.current;
    if (!el) return;
    const sync = () => root.style.setProperty("--promo-bar-h", `${el.offsetHeight}px`);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      ro.disconnect();
      // Wajib direset: tanpa ini halaman berikutnya mewarisi padding-top hantu
      // sebesar bar yang sudah tak ada.
      root.style.setProperty("--promo-bar-h", "0px");
    };
  }, [hidden]);

  if (hidden || !batch) return null;

  return (
    <div
      ref={ref}
      className="fixed inset-x-0 top-0 z-[70] bg-gradient-to-r from-[#0F7A7A] via-[#1A9E9E] to-[#0F7A7A] text-white shadow-md"
    >
      {/* [home-prefetch-off-v1] prefetch dimatikan: pita ini tampil di layar
          pertama, jadi Next langsung mem-prefetch JS /jadwal-kelas-reguler —
          termasuk set bendera lengkap 406 KB — saat beranda HP masih dimuat. */}
      {/* [bar-batch-reguler-hp-v1] HP: dipadatkan jadi 2 baris — dulu flex-wrap
          bikin bar 4 baris & makan seperempat layar. */}
      <Link
        href="/jadwal-kelas-reguler"
        prefetch={false}
        className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-center text-[12px] font-semibold leading-tight sm:hidden"
      >
        <span className="flex max-w-full items-center gap-1.5 whitespace-nowrap">
          <Hourglass className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate font-extrabold uppercase tracking-wide">
            Reguler {labelBulan(batch.batchMonth)}
          </span>
          {batch.price < PRICE_STRIKE && (
            <span className="text-[11px] text-white/70 line-through">{rpPendek(PRICE_STRIKE)}</span>
          )}
          <span className="text-[14px] font-extrabold text-[#FFD43B]">{rp(batch.price)}</span>
        </span>
        <span className="flex items-center gap-2 whitespace-nowrap">
          <span className="tabular-nums text-white/90">
            Tutup <span className="font-bold">{hitungMundurPendek(sisa)}</span> lagi
          </span>
          <span className="inline-flex items-center gap-0.5 rounded-full bg-[#FFD43B] px-2.5 py-0.5 text-[11px] font-extrabold text-slate-900">
            Lihat Jadwal <ArrowRight className="h-3 w-3" />
          </span>
        </span>
      </Link>

      <Link
        href="/jadwal-kelas-reguler"
        prefetch={false}
        className="mx-auto hidden w-full max-w-7xl sm:flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-[13px] font-semibold sm:text-sm"
      >
        <span className="inline-flex items-center gap-1.5">
          <Hourglass className="h-4 w-4 shrink-0" />
          <span className="font-extrabold uppercase tracking-wide">
            Kelas Reguler {labelBulan(batch.batchMonth)}
          </span>
        </span>

        <span className="inline-flex items-center gap-1.5">
          <span className="hidden sm:inline">{batch.languages} bahasa</span>
          {batch.price < PRICE_STRIKE && (
            <span className="text-white/70 line-through">{rp(PRICE_STRIKE)}</span>
          )}
          <span className="text-base font-extrabold text-[#FFD43B] sm:text-lg">
            {rp(batch.price)}
          </span>
        </span>

        {/* tabular-nums: tanpa ini lebar angka berubah tiap detik & barnya bergoyang */}
        <span className="tabular-nums text-white/90">
          Pendaftaran ditutup <span className="font-bold">{hitungMundur(sisa)}</span> lagi
        </span>

        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#FFD43B] px-3.5 py-1 text-[12px] font-extrabold text-slate-900 transition-transform duration-200 hover:scale-110 sm:text-[13px]">
          Lihat Jadwal <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </Link>
    </div>
  );
}
