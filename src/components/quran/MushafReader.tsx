"use client";
// [quran-reader-v1] Pembaca mushaf digital /alquran.
//
// - Tata letak mengikuti mushaf Madinah 15 baris (nomor baris per kata dari
//   Quran.com), jadi halaman 1–604 sama persis dengan mushaf cetak di rumah.
// - Geser (swipe) untuk ganti halaman dengan animasi balik kertas. Arahnya
//   KANAN-KE-KIRI seperti mushaf asli: geser ke kanan = halaman berikutnya,
//   panah ← di keyboard = berikutnya.
// - Ketuk kata → PanelKata (arti, audio, sharaf, i'rab ayat).
// - Mode "Terjemah" menampilkan per ayat + terjemah Kemenag.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, List, BookOpen, Languages, Loader2, RotateCcw, Hand } from "lucide-react";
import type { Ayat, Halaman, Kata, Surat } from "@/lib/quran/sumber";
import { JUMLAH_HALAMAN } from "@/lib/quran/sumber";
import { muatHalaman, muatMorfologi } from "./data";
import PanelKata from "./PanelKata";
import DaftarSurat from "./DaftarSurat";

const TEAL = "#1A9E9E";
const KUNCI_HAL = "linguo:alquran:hal";
const KUNCI_TIPS = "linguo:alquran:tips";
const BASMALAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

type Mode = "mushaf" | "terjemah";
type Pilihan = { kata: Kata; ayat: Ayat };

/** Baris mushaf: kata-kata satu baris, atau kepala surat (nama + basmalah). */
type Baris =
  | { jenis: "kata"; no: number; kata: { k: Kata; a: Ayat }[] }
  | { jenis: "kepala"; surat: number };

function susunBaris(h: Halaman): Baris[] {
  const perBaris = new Map<number, { k: Kata; a: Ayat }[]>();
  const kepala = new Map<number, number>(); // baris pertama surat → nomor surat
  for (const a of h.ayat) {
    a.kata.forEach((k, i) => {
      if (a.ayat === 1 && i === 0) kepala.set(k.baris, a.surat);
      const b = perBaris.get(k.baris) ?? [];
      b.push({ k, a });
      perBaris.set(k.baris, b);
    });
  }
  const out: Baris[] = [];
  for (const no of [...perBaris.keys()].sort((x, y) => x - y)) {
    const s = kepala.get(no);
    if (s) out.push({ jenis: "kepala", surat: s });
    out.push({ jenis: "kata", no, kata: perBaris.get(no)! });
  }
  return out;
}

const angkaArab = (n: number) => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);

export default function MushafReader({
  daftarSurat,
  halamanAwal,
  fontArab,
}: {
  daftarSurat: Surat[];
  halamanAwal: number | null;
  fontArab: string;
}) {
  const [hal, setHal] = useState(halamanAwal ?? 1);
  const [arah, setArah] = useState(0); // +1 maju, -1 mundur (untuk animasi)
  const [data, setData] = useState<Halaman | null>(null);
  const [gagal, setGagal] = useState(false);
  const [mode, setMode] = useState<Mode>("mushaf");
  const [pilihan, setPilihan] = useState<Pilihan | null>(null);
  const [daftarBuka, setDaftarBuka] = useState(false);
  const [tips, setTips] = useState(false);

  // Halaman terakhir dibaca (per perangkat) — hanya kalau URL tak menyebut halaman.
  useEffect(() => {
    if (halamanAwal) return;
    try {
      const n = Number(localStorage.getItem(KUNCI_HAL));
      if (n >= 1 && n <= JUMLAH_HALAMAN) setHal(n);
    } catch {}
    try {
      if (!localStorage.getItem(KUNCI_TIPS)) setTips(true);
    } catch {}
  }, [halamanAwal]);

  useEffect(() => {
    let batal = false;
    setGagal(false);
    muatHalaman(hal)
      .then((d) => {
        if (batal) return;
        setData(d);
        // Morfologi surat di halaman ini diambil duluan supaya ketukan kata instan.
        new Set(d.ayat.map((a) => a.surat)).forEach((s) => void muatMorfologi(s));
      })
      .catch(() => !batal && setGagal(true));
    // Halaman tetangga diambil duluan → geseran berikutnya tanpa menunggu.
    if (hal < JUMLAH_HALAMAN) void muatHalaman(hal + 1).catch(() => {});
    if (hal > 1) void muatHalaman(hal - 1).catch(() => {});
    try {
      localStorage.setItem(KUNCI_HAL, String(hal));
    } catch {}
    const url = new URL(window.location.href);
    url.searchParams.set("hal", String(hal));
    window.history.replaceState(null, "", url);
    return () => {
      batal = true;
    };
  }, [hal]);

  const pergi = useCallback((n: number) => {
    const t = Math.min(JUMLAH_HALAMAN, Math.max(1, n));
    setHal((cur) => {
      if (t === cur) return cur;
      setArah(t > cur ? 1 : -1);
      return t;
    });
    setPilihan(null);
  }, []);

  const tutupTips = () => {
    setTips(false);
    try {
      localStorage.setItem(KUNCI_TIPS, "1");
    } catch {}
  };

  // Keyboard: arah mushaf kanan-ke-kiri → ← maju, → mundur.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (daftarBuka || (e.target as HTMLElement)?.closest("input,textarea")) return;
      if (e.key === "ArrowLeft") pergi(hal + 1);
      else if (e.key === "ArrowRight") pergi(hal - 1);
      else if (e.key === "Escape") setPilihan(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hal, pergi, daftarBuka]);

  // Audio tunggal untuk kata & ayat — memutar yang baru menghentikan yang lama.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioAktif, setAudioAktif] = useState<string | null>(null);
  const audio = useMemo(
    () => ({
      aktif: audioAktif,
      putar: (url: string, id: string) => {
        audioRef.current?.pause();
        const el = new Audio(url);
        audioRef.current = el;
        setAudioAktif(id);
        el.onended = () => setAudioAktif((a) => (a === id ? null : a));
        el.play().catch(() => setAudioAktif(null));
      },
      berhenti: () => {
        audioRef.current?.pause();
        setAudioAktif(null);
      },
    }),
    [audioAktif],
  );

  const suratIni = data?.ayat[0] ? daftarSurat.find((s) => s.id === data.ayat[0].surat) : undefined;
  const namaSurat = (id: number) => daftarSurat.find((s) => s.id === id)?.nama ?? `Surat ${id}`;

  // Geser: framer drag horizontal. Setelah menyeret, klik yang ikut terpicu
  // di akhir gestur diabaikan supaya tidak membuka panel kata tanpa sengaja.
  const barusDiseret = useRef(false);
  const onDragEnd = (_: unknown, info: PanInfo) => {
    const jauh = Math.abs(info.offset.x) > 70 || Math.abs(info.velocity.x) > 450;
    if (jauh) {
      if (tips) tutupTips();
      pergi(info.offset.x > 0 ? hal + 1 : hal - 1);
    }
    setTimeout(() => (barusDiseret.current = false), 50);
  };

  const pilih = (k: Kata, a: Ayat) => {
    if (barusDiseret.current || k.akhir) return;
    setPilihan({ kata: k, ayat: a });
    if (k.audio) audio.putar(`https://audio.qurancdn.com/${k.audio}`, k.lok);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#F4EFE3] text-stone-900">
      {/* Bilah atas */}
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-[#F4EFE3]/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-2.5">
          <Link href="/bahasa-arab-quran" className="flex shrink-0 items-center gap-2" aria-label="Linguo — Bahasa Arab Al-Qur'an">
            <img src="/logo-icon.png" alt="" className="h-8 w-8 rounded-lg" />
          </Link>
          <button
            onClick={() => setDaftarBuka(true)}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2 py-1.5 text-left hover:bg-white/70"
          >
            <List size={18} className="shrink-0 text-stone-500" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">
                {suratIni ? `${suratIni.id}. ${suratIni.nama}` : "Al-Qur'an"}
              </span>
              <span className="block text-xs text-stone-500">
                Juz {data?.ayat[0]?.juz ?? "–"} · Halaman {hal}
              </span>
            </span>
          </button>
          <div className="flex shrink-0 rounded-xl bg-white/80 p-1 ring-1 ring-stone-200">
            {(
              [
                ["mushaf", BookOpen, "Mushaf"],
                ["terjemah", Languages, "Terjemah"],
              ] as const
            ).map(([m, Ikon, label]) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                  mode === m ? "text-white" : "text-stone-600 hover:bg-stone-100"
                }`}
                style={mode === m ? { background: TEAL } : undefined}
                aria-pressed={mode === m}
              >
                <Ikon size={14} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Desktop: panel kata menempel di kanan → mushaf bergeser ke kiri, tak tertutup. */}
      <main
        className={`relative mx-auto flex w-full max-w-5xl flex-1 items-start justify-center px-3 py-4 transition-[padding] duration-300 sm:px-6 ${
          pilihan ? "lg:pr-[452px]" : ""
        }`}
      >
        {/* Tombol samping (desktop). Kiri = berikutnya karena mushaf dibaca kanan-ke-kiri. */}
        <button
          onClick={() => pergi(hal + 1)}
          disabled={hal >= JUMLAH_HALAMAN}
          className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/80 p-2.5 text-stone-600 shadow ring-1 ring-stone-200 hover:bg-white disabled:opacity-30 md:grid"
          aria-label="Halaman berikutnya"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          onClick={() => pergi(hal - 1)}
          disabled={hal <= 1}
          className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/80 p-2.5 text-stone-600 shadow ring-1 ring-stone-200 hover:bg-white disabled:opacity-30 md:grid"
          aria-label="Halaman sebelumnya"
        >
          <ChevronRight size={22} />
        </button>

        <div className="relative w-full max-w-[560px]" style={{ perspective: 1600 }}>
          <AnimatePresence initial={false} custom={arah} mode="popLayout">
            <motion.div
              key={hal}
              custom={arah}
              variants={{
                // Maju: halaman baru datang dari KIRI (mushaf kanan-ke-kiri), yang lama
                // terlipat ke kanan dengan poros di tepi punggung buku.
                masuk: (d: number) => ({ x: d > 0 ? "-40%" : "40%", rotateY: d > 0 ? -35 : 35, opacity: 0 }),
                diam: { x: 0, rotateY: 0, opacity: 1 },
                keluar: (d: number) => ({ x: d > 0 ? "45%" : "-45%", rotateY: d > 0 ? 55 : -55, opacity: 0 }),
              }}
              initial="masuk"
              animate="diam"
              exit="keluar"
              transition={{ type: "spring", stiffness: 260, damping: 30, mass: 0.9 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.35}
              dragDirectionLock
              onDragStart={() => (barusDiseret.current = true)}
              onDragEnd={onDragEnd}
              style={{ touchAction: "pan-y", transformOrigin: arah > 0 ? "right center" : "left center" }}
              className="w-full"
            >
              <div className="relative rounded-[20px] border border-[#E2D6B8] bg-[#FFFDF6] px-3 pb-4 pt-5 shadow-[0_10px_30px_-12px_rgba(90,70,30,.35)] sm:px-6">
                {/* garis bingkai mushaf */}
                <div className="pointer-events-none absolute inset-2 rounded-[14px] border border-[#EADFC4]" />
                {gagal ? (
                  <div className="grid min-h-[60vh] place-items-center text-center">
                    <div>
                      <p className="text-sm text-stone-600">Halaman gagal dimuat.</p>
                      <button
                        onClick={() => {
                          setGagal(false);
                          muatHalaman(hal).then(setData).catch(() => setGagal(true));
                        }}
                        className="mt-3 inline-flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white"
                      >
                        <RotateCcw size={14} /> Coba lagi
                      </button>
                    </div>
                  </div>
                ) : !data || data.halaman !== hal ? (
                  <div className="grid min-h-[60vh] place-items-center">
                    <Loader2 className="animate-spin text-stone-400" />
                  </div>
                ) : mode === "mushaf" ? (
                  <HalamanMushaf
                    data={data}
                    fontArab={fontArab}
                    pilihan={pilihan}
                    onPilih={pilih}
                    namaSurat={namaSurat}
                    daftarSurat={daftarSurat}
                  />
                ) : (
                  <HalamanTerjemah
                    data={data}
                    fontArab={fontArab}
                    pilihan={pilihan}
                    onPilih={pilih}
                    namaSurat={namaSurat}
                    daftarSurat={daftarSurat}
                  />
                )}
                <p className="relative mt-3 text-center text-xs font-semibold text-stone-400">{angkaArab(hal)}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {tips && (
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                onClick={tutupTips}
                className="absolute inset-x-4 bottom-16 z-20 flex items-center gap-3 rounded-2xl bg-stone-900/90 px-4 py-3 text-left text-sm text-white shadow-lg"
              >
                <Hand size={20} className="shrink-0" />
                <span>
                  Geser ke <b>kanan</b> untuk halaman berikutnya (seperti mushaf). Ketuk kata untuk arti & analisa
                  grammarnya.
                </span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Navigasi bawah (mobile) */}
      <nav className="sticky bottom-0 z-20 border-t border-stone-200/80 bg-[#F4EFE3]/95 backdrop-blur md:hidden">
        <div className="flex items-center justify-between px-4 py-2">
          <button
            onClick={() => pergi(hal + 1)}
            disabled={hal >= JUMLAH_HALAMAN}
            className="flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold text-stone-700 disabled:opacity-30"
          >
            <ChevronLeft size={18} /> Berikutnya
          </button>
          <span className="text-xs text-stone-500">
            {hal} / {JUMLAH_HALAMAN}
          </span>
          <button
            onClick={() => pergi(hal - 1)}
            disabled={hal <= 1}
            className="flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold text-stone-700 disabled:opacity-30"
          >
            Sebelumnya <ChevronRight size={18} />
          </button>
        </div>
      </nav>

      {/* Panel kata: bottom sheet di HP, panel kanan di desktop */}
      <AnimatePresence>
        {pilihan && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/20 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPilihan(null)}
            />
            <motion.aside
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[78dvh] overflow-hidden rounded-t-3xl bg-white shadow-2xl lg:inset-x-auto lg:right-4 lg:top-20 lg:bottom-4 lg:max-h-none lg:w-[420px] lg:rounded-3xl"
            >
              <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-stone-200 lg:hidden" />
              <div className="h-[calc(78dvh-14px)] lg:h-full">
                <PanelKata
                  kata={pilihan.kata}
                  ayat={pilihan.ayat}
                  namaSurat={namaSurat(pilihan.ayat.surat)}
                  fontArab={fontArab}
                  onTutup={() => setPilihan(null)}
                  onPilihKata={(k) => setPilihan({ kata: k, ayat: pilihan.ayat })}
                  audio={audio}
                />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <DaftarSurat
        buka={daftarBuka}
        onTutup={() => setDaftarBuka(false)}
        daftar={daftarSurat}
        fontArab={fontArab}
        onPilihHalaman={(n) => {
          pergi(n);
          setDaftarBuka(false);
        }}
      />
    </div>
  );
}

type PropsHalaman = {
  data: Halaman;
  fontArab: string;
  pilihan: Pilihan | null;
  onPilih: (k: Kata, a: Ayat) => void;
  namaSurat: (id: number) => string;
  daftarSurat: Surat[];
};

function KepalaSurat({ surat, fontArab, daftarSurat }: { surat: number; fontArab: string; daftarSurat: Surat[] }) {
  const s = daftarSurat.find((x) => x.id === surat);
  return (
    <div className="my-2 text-center">
      <div className="mx-auto flex items-center justify-center gap-3 rounded-xl border border-[#D9C79A] bg-[#F7EFD8] px-4 py-1.5">
        <span dir="rtl" className={`${fontArab} text-[1.35em] leading-[1.6] text-[#6B5320]`}>
          سُورَةُ {s?.namaArab ?? ""}
        </span>
      </div>
      {/* Al-Fatihah: basmalah = ayat 1 (sudah ada di teks); At-Taubah tanpa basmalah. */}
      {surat !== 1 && surat !== 9 && (
        <p dir="rtl" className={`${fontArab} mt-1 text-[1.05em] leading-[2]`}>
          {BASMALAH}
        </p>
      )}
    </div>
  );
}

function PenandaAyat({ n }: { n: string }) {
  return (
    <span className="mx-[0.12em] inline-grid h-[1.9em] min-w-[1.9em] shrink-0 place-items-center self-center rounded-full border border-[#B8964A] px-[0.15em] align-middle font-sans text-[0.5em] font-semibold leading-none text-[#8A6A22]">
      {n}
    </span>
  );
}

function HalamanMushaf({ data, fontArab, pilihan, onPilih, daftarSurat }: PropsHalaman) {
  const baris = useMemo(() => susunBaris(data), [data]);
  const wadah = useRef<HTMLDivElement>(null);
  const [ukuran, setUkuran] = useState<number | null>(null);
  const tengah = data.halaman <= 2; // Al-Fatihah & awal Al-Baqarah: baris pendek di tengah

  // Pas-kan ukuran huruf ke lebar kertas: mulai dari tebakan, ukur baris terlebar,
  // lalu kecilkan sekali supaya tak ada baris yang meluber (lebar glyph Utsmani
  // tak bisa ditebak dari jumlah huruf).
  useLayoutEffect(() => {
    const el = wadah.current;
    if (!el) return;
    const hitung = () => {
      const lebar = el.clientWidth;
      const semua = [...el.querySelectorAll<HTMLElement>("[data-baris]")];
      const ukur = () => semua.map((b) => lebar / Math.max(lebar, b.scrollWidth));
      // 1) Ukuran bersama: pas untuk sebagian besar baris (kuantil 15%), supaya
      //    satu baris super-padat tak mengecilkan seluruh halaman.
      const tebak = Math.min(34, lebar / 15.5);
      el.style.fontSize = `${tebak}px`;
      semua.forEach((b) => (b.style.fontSize = ""));
      const rasio = ukur().sort((a, b) => a - b);
      const dasar = Math.floor(tebak * (rasio[Math.floor(rasio.length * 0.15)] ?? 1) * 0.98 * 10) / 10;
      el.style.fontSize = `${dasar}px`;
      // 2) Baris yang masih meluber dikecilkan sendiri-sendiri.
      ukur().forEach((r, i) => {
        if (r < 1) semua[i].style.fontSize = `${Math.floor(r * 0.98 * 1000) / 1000}em`;
      });
      setUkuran(dasar);
    };
    hitung();
    // Font Amiri Quran dimuat `swap`: ukuran pertama bisa terukur dengan font
    // cadangan yang lebih sempit → hitung ulang begitu font aslinya siap.
    let hidup = true;
    void document.fonts?.ready.then(() => hidup && hitung());
    const ro = new ResizeObserver(hitung);
    ro.observe(el);
    return () => {
      hidup = false;
      ro.disconnect();
    };
  }, [data]);

  return (
    <div
      ref={wadah}
      dir="rtl"
      className={`${fontArab} relative select-none leading-[2.05]`}
      style={ukuran ? { fontSize: ukuran } : undefined}
    >
      {baris.map((b) =>
        b.jenis === "kepala" ? (
          <KepalaSurat key={`k${b.surat}`} surat={b.surat} fontArab={fontArab} daftarSurat={daftarSurat} />
        ) : (
          <div
            key={b.no}
            data-baris
            className={`flex whitespace-nowrap ${tengah ? "justify-center gap-[0.3em]" : "justify-between"}`}
          >
            {b.kata.map(({ k, a }) =>
              k.akhir ? (
                <PenandaAyat key={k.lok} n={k.ar} />
              ) : (
                <button
                  key={k.lok}
                  onClick={() => onPilih(k, a)}
                  className={`rounded-md px-[0.04em] transition-colors ${
                    pilihan?.kata.lok === k.lok
                      ? "bg-[#1A9E9E]/20 text-[#0E6B6B]"
                      : pilihan?.ayat.key === a.key
                        ? "bg-[#1A9E9E]/[.07]"
                        : "hover:bg-[#1A9E9E]/10"
                  }`}
                >
                  {k.ar}
                </button>
              ),
            )}
          </div>
        ),
      )}
    </div>
  );
}

function HalamanTerjemah({ data, fontArab, pilihan, onPilih, daftarSurat }: PropsHalaman) {
  return (
    <div className="relative space-y-5 px-1">
      {data.ayat.map((a) => (
        <div key={a.key}>
          {a.ayat === 1 && (
            <div className="text-[26px]">
              <KepalaSurat surat={a.surat} fontArab={fontArab} daftarSurat={daftarSurat} />
            </div>
          )}
          <p dir="rtl" className={`${fontArab} text-[26px] leading-[2.1]`}>
            {a.kata.map((k) =>
              k.akhir ? (
                <PenandaAyat key={k.lok} n={k.ar} />
              ) : (
                <button
                  key={k.lok}
                  onClick={() => onPilih(k, a)}
                  className={`mx-[0.08em] rounded-md transition-colors ${
                    pilihan?.kata.lok === k.lok ? "bg-[#1A9E9E]/20 text-[#0E6B6B]" : "hover:bg-[#1A9E9E]/10"
                  }`}
                >
                  {k.ar}
                </button>
              ),
            )}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-stone-600">
            <span className="mr-1.5 font-semibold text-stone-400">{a.ayat}.</span>
            {a.terjemah}
          </p>
        </div>
      ))}
    </div>
  );
}
