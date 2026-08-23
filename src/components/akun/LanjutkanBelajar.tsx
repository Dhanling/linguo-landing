"use client";

/* [lanjutkan-belajar-v1] Satu baris di paling atas Beranda: "lanjutkan yang terakhir
   kamu kerjakan", tanpa peduli barangnya tersimpan di menu yang mana.

   Kenapa ada: dashboard siswa punya banyak pintu — Kelas & Materi, Perpustakaan,
   Watch & Learn, Lingbook — dan tiap kali siswa mau melanjutkan belajar dia harus
   ingat DULU barangnya tadi dibuka dari menu yang mana. Blok ini menghapus
   pertanyaan itu: kartu paling kiri selalu hal terakhir yang dia sentuh.

   Aturan urut: murni berdasar waktu aktivitas terakhir (paling baru di kiri).
   Sumber yang tak punya jejak aktivitas TIDAK ikut — blok ini menjanjikan
   "lanjutkan", bukan "coba mulai". Jadi tanpa riwayat apa pun, dia diam. */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { getImmersionLang, getWatchHistory, youtubeThumb, youtubeThumbMax } from "@/lib/immersion";
import { getLangPhoto, LANG_FLAGS } from "@/lib/lang-visuals";
import { baseLanguage } from "@/lib/classLanguage";
import { CEFR_STYLE, type CefrLevel } from "@/lib/cefr";
import { FLAG_CODE_BY_SLUG, RectFlag } from "@/components/RectFlag";
import { useT } from "@/lib/uiLang";
import { BookMarked, Clapperboard, ArrowRight, type LucideIcon } from "lucide-react";

export interface ProdukDigital {
  id: string; purchaseId: string;
  type: "ebook" | "elearning";
  title: string; language: string | null; link: string | null;
  /** Sampul produk (`digital_products.cover_url`); null → foto stok bahasa. */
  cover?: string | null;
}

type Item = {
  key: string;
  ts: number;
  kind: string;
  title: string;
  sub: string;
  icon: LucideIcon;
  photo: string | null;
  /** Gambar lebar 16:9 (thumbnail video) — dipakai ganti kotak ikon persegi. */
  wide?: boolean;
  /** Sampul buku itu potret — dipotong dari ATAS supaya judul di sampulnya tetap terbaca. */
  fitTop?: boolean;
  /** Ada isinya = kartu ini bisa memutar pratinjau bisu saat kursor menetap. */
  videoId?: string;
  pct: number | null;
  /** [lanjutkan-bendera-level-v1] Kode negara ISO-2 buat bendera rounded-rect. */
  flag?: string | null;
  /** Level CEFR materinya — digambar sebagai chip di sebelah nama sumber. */
  level?: CefrLevel | null;
  run: () => void;
};

/* [lanjutkan-bendera-level-v1] Bahasa e-book datang sebagai slug katalog
   ("spanish") ATAU nama kelas ("Spanish", "English - Conversation"), jadi dua peta
   dicoba berurutan sebelum menyerah. Menyerah = tak menggambar apa-apa: bendera
   yang salah lebih membingungkan daripada tak ada bendera. */
function benderaBahasa(language: string | null | undefined): string | null {
  const raw = (language || "").trim();
  if (!raw) return null;
  return FLAG_CODE_BY_SLUG[raw.toLowerCase()] || LANG_FLAGS[baseLanguage(raw)] || null;
}

/* Level modul biasanya cuma tertulis di judulnya ("English 101 A1 …") — e-book tak
   punya kolom level sendiri di `digital_products`. */
function levelDariJudul(judul: string): CefrLevel | null {
  const m = judul.match(/\b(A1|A2|B1|B2|C1)\b/i);
  return m ? (m[1].toUpperCase() as CefrLevel) : null;
}

/** Detik → "7:12" / "1:04:30". Dipakai label "Lanjut dari …" kartu Watch & Learn. */
function jamMenit(detik: number): string {
  const d = Math.max(0, Math.floor(detik));
  const j = Math.floor(d / 3600);
  const m = Math.floor((d % 3600) / 60);
  const s = d % 60;
  const dua = (n: number) => String(n).padStart(2, "0");
  return j > 0 ? `${j}:${dua(m)}:${dua(s)}` : `${m}:${dua(s)}`;
}

/** Sampul modul (halaman 1 yang dititipkan EbookReader saat dibaca). */
function sampulEbook(purchaseId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(`ebook-sampul:${purchaseId}`);
  } catch {
    return null;
  }
}

/** Posisi baca e-book, dari localStorage yang ditulis EbookReader. */
function bacaanEbook(purchaseId: string): { page: number; total: number; ts: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const mentah = localStorage.getItem(`ebook-hal:${purchaseId}`);
    if (!mentah) return null;
    const [halTeks, totalTeks] = mentah.split("/");
    const page = Number(halTeks);
    const total = Number(totalTeks);
    if (!Number.isFinite(page) || page < 1) return null;
    /* [lanjutkan-ebook-halaman-satu-v1] Stempel waktu = buktinya readernya PERNAH
       dibuka (EbookReader menulisnya begitu PDF-nya siap, termasuk di halaman 1).
       Dulu halaman 1 dianggap "masih di sampul, belum dibaca" dan kartunya tak
       pernah lahir — padahal modul yang barusan dibuka justru yang paling ingin
       dilanjutkan siswa. */
    const ts = Number(localStorage.getItem(`ebook-hal-ts:${purchaseId}`) || 0);
    if (!Number.isFinite(ts) || ts <= 0) return null;
    return { page, total: Number.isFinite(total) ? total : 0, ts };
  } catch {
    return null;
  }
}

/* [lanjutkan-ebook-jejak-lokal-v1] E-book yang PERNAH dibuka di perangkat ini,
   dipungut dari jejak localStorage (`ebook-hal-ts:<purchaseId>`) — bukan dari daftar
   pembelian. Kenapa perlu: daftar pembelian di Beranda pernah lebih ketat daripada
   Perpustakaan, jadi modul yang barusan dibaca bisa tak punya pasangan di sana dan
   kartunya lenyap tanpa jejak. Judul & bahasanya dititipkan EbookReader lewat
   `ebook-jejak:<purchaseId>`. */
type JejakEbook = { purchaseId: string; title: string | null; language: string | null };
function jejakEbookLokal(): JejakEbook[] {
  if (typeof window === "undefined") return [];
  const out: JejakEbook[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith("ebook-hal-ts:")) continue;
      const purchaseId = k.slice("ebook-hal-ts:".length);
      if (!purchaseId) continue;
      let title: string | null = null;
      let language: string | null = null;
      try {
        const j = JSON.parse(localStorage.getItem(`ebook-jejak:${purchaseId}`) || "null");
        if (j && typeof j.title === "string" && j.title.trim()) title = j.title;
        if (j && typeof j.language === "string" && j.language.trim()) language = j.language;
      } catch { /* jejak rusak → judulnya nanti dicari di daftar pembelian */ }
      out.push({ purchaseId, title, language });
    }
  } catch { /* localStorage diblokir → tak ada yang bisa dilanjutkan dari perangkat ini */ }
  return out;
}

/* [lanjutkan-watch-preview-v2] Pratinjau hover memakai BINGKAI video (mq1–mq3 =
   cuplikan di 1/4, 1/2, 3/4 durasi), bukan player YouTube yang ditanam.
   Kenapa bukan iframe: embed YouTube menggambar tombol pause besar miliknya
   sendiri di tengah, dan dari luar iframe itu tak bisa dimatikan — pratinjau
   jadi kotor. Bingkai mq* berukuran 320×180 (16:9 tanpa pita hitam), publik,
   dan tak menyeret unduhan player. */
const FRAMES = [1, 2, 3] as const;
function youtubeFrame(videoId: string, n: number): string {
  return `https://i.ytimg.com/vi/${videoId}/mq${n}.jpg`;
}

export default function LanjutkanBelajar({
  produkDigital,
  onOpenEbook,
}: {
  produkDigital: ProdukDigital[];
  /** Buka reader e-book itu langsung (Perpustakaan yang menampungnya). */
  onOpenEbook: (purchaseId: string) => void;
}) {
  const t = useT();
  const router = useRouter();

  /* [lingbook-rak-buku-tunggal-v1] Sumber "Lingbook interaktif" (buku contoh CMS
     Hajime no Ippo / Paso a Paso) DICABUT dari blok ini. Yang disebut Lingbook
     sekarang cuma satu: e-book berkas yang benar-benar dibeli siswa — kartunya
     dirakit dari `produkDigital` di bawah. */

  /* Riwayat tonton hidup di localStorage (lihat lib/immersion). Dibaca sesudah
     mount supaya render server & klien tidak berbeda. */
  const [watch, setWatch] = useState<
    {
      videoId: string;
      title: string;
      thumbnail: string | null;
      lang: string;
      ts: number;
      position: number;
      level: CefrLevel | null;
    } | null
  >(null);
  useEffect(() => {
    const h = getWatchHistory();
    if (!h.length) return;
    setWatch({
      videoId: h[0].videoId,
      title: h[0].title,
      thumbnail: h[0].thumbnail,
      lang: h[0].lang,
      ts: h[0].ts || 0,
      // [watch-lanjut-menit-v1] entri lama tak punya `position` → mulai dari awal
      position: typeof h[0].position === "number" && h[0].position > 5 ? h[0].position : 0,
      // [lanjutkan-bendera-level-v1] Entri riwayat lama tak punya level → tanpa chip.
      level: h[0].level || null,
    });
  }, []);

  /* Jejak baca dibaca sesudah mount — localStorage tak ada di server. */
  const [jejak, setJejak] = useState<JejakEbook[]>([]);
  useEffect(() => { setJejak(jejakEbookLokal()); }, []);

  /* [lanjutkan-watch-preview-v1] Pratinjau bisu ala YouTube: kursor menetap
     sebentar di kartu → thumbnail digantikan video yang jalan tanpa suara.
     Jeda 700 ms itu sengaja — tanpa itu, kursor yang cuma lewat sudah cukup
     untuk menyuruh browser mengunduh player YouTube. */
  const [preview, setPreview] = useState<string | null>(null);
  const [frame, setFrame] = useState(0);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  function bersihkanTimer() {
    if (previewTimer.current) { clearTimeout(previewTimer.current); previewTimer.current = null; }
    if (frameTimer.current) { clearInterval(frameTimer.current); frameTimer.current = null; }
  }
  useEffect(() => bersihkanTimer, []);

  function mulaiPratinjau(key: string, videoId: string) {
    bersihkanTimer();
    previewTimer.current = setTimeout(() => {
      // Bingkai dimuat dulu di belakang layar supaya pergantiannya tak berkedip.
      FRAMES.forEach((n) => { const im = new window.Image(); im.src = youtubeFrame(videoId, n); });
      setFrame(0);
      setPreview(key);
      frameTimer.current = setInterval(() => setFrame((f) => (f + 1) % FRAMES.length), 900);
    }, 450);
  }
  function setopPratinjau() {
    bersihkanTimer();
    setPreview(null);
    setFrame(0);
  }

  const items = useMemo<Item[]>(() => {
    const out: Item[] = [];

    /* [lanjutkan-tanpa-kartu-mandiri-v1] Belajar Mandiri TIDAK ikut di sini:
       kartunya sudah berdiri sendiri (dan jauh lebih informatif) di tab
       "Self-Study" tepat di bawah blok ini — dua kartu yang sama persis, satu di
       atas yang lain, cuma membuang baris teratas Beranda. */

    /* Gabungan dua sumber: jejak lokal (bukti modulnya benar-benar dibuka) +
       daftar pembelian (judul rapi, sampul resmi, bahasa). Yang tak punya jejak
       baca tidak ikut — blok ini menjanjikan "lanjutkan", bukan "coba mulai". */
    const kandidat = new Map<string, { title: string | null; language: string | null; cover: string | null }>();
    jejak.forEach((j) => kandidat.set(j.purchaseId, { title: j.title, language: j.language, cover: null }));
    produkDigital.forEach((d) => {
      if (d.type !== "ebook") return;
      const lama = kandidat.get(d.purchaseId);
      kandidat.set(d.purchaseId, {
        title: d.title || lama?.title || null,
        language: d.language || lama?.language || null,
        cover: d.cover || null,
      });
    });

    /* [lanjutkan-satu-lingbook-v1] Berapa pun Lingbook yang pernah dibuka, blok ini
       cuma memuat SATU: yang terakhir dibuka. Baris ini janjinya "lanjutkan yang tadi",
       bukan rak buku — dua kartu Lingbook berjajar cuma menggeser sumber lain (Watch &
       Learn) keluar layar. Rak lengkapnya ada di menu Perpustakaan. */
    const kartuEbook: Item[] = [];
    kandidat.forEach((m, purchaseId) => {
      const b = bacaanEbook(purchaseId);
      if (!b || !m.title) return;
      kartuEbook.push({
        key: `ebook-${purchaseId}`,
        ts: b.ts,
        /* [lingbook-nama-ebook-v1] Kartu e-book memakai nama produknya: "Lingbook".
           Sumber datanya tetap produk digital bertipe `ebook`. */
        kind: "Lingbook",
        title: m.title,
        /* Sudah sampai mana — halaman DAN persennya. Angka halaman saja tak
           menjawab "tinggal berapa lagi" kalau modulnya 130 halaman. */
        sub: b.total
          ? `${t("Halaman")} ${b.page} ${t("dari")} ${b.total} \u00B7 ${Math.min(100, Math.round((b.page / b.total) * 100))}%`
          : `${t("Halaman")} ${b.page}`,
        icon: BookMarked,
        /* [lingbook-sampul-kartu-v1] Sampul bukunya sendiri, bukan ikon buku generik:
           siswa yang punya beberapa Lingbook perlu tahu YANG MANA yang tadi dibaca —
           judulnya saja terpotong di kartu selebar ini. Urutannya: sampul yang
           ditangkap reader dari halaman 1, lalu `cover_url` produk (kosong di semua
           e-book hari ini), terakhir foto stok bahasa — masih lebih menjelaskan
           daripada kotak kosong. */
        photo: sampulEbook(purchaseId) || m.cover || (m.language ? getLangPhoto(m.language) : null),
        fitTop: true,
        pct: b.total ? Math.min(100, Math.round((b.page / b.total) * 100)) : null,
        flag: benderaBahasa(m.language),
        level: levelDariJudul(m.title),
        /* [lanjutkan-ebook-buka-langsung-v1] Langsung ke readernya, bukan ke
           daftar Perpustakaan: kartunya menjanjikan SATU modul yang tadi dibaca. */
        run: () => onOpenEbook(purchaseId),
      });
    });
    kartuEbook.sort((a, b) => b.ts - a.ts);
    if (kartuEbook[0]) out.push(kartuEbook[0]);

    if (watch) {
      out.push({
        key: "watch",
        ts: watch.ts,
        kind: "Watch & Learn",
        title: watch.title,
        sub: watch.position > 0 ? `${t("Lanjut dari")} ${jamMenit(watch.position)}` : t("Lanjut menonton"),
        icon: Clapperboard,
        /* Thumbnail video asli — sama seperti layar diam waktu videonya dijeda.
           Riwayat lama kadang menyimpan thumbnail null → rakit sendiri dari
           videoId, jangan jatuh ke kotak ikon polos. */
        photo: watch.thumbnail || youtubeThumbMax(watch.videoId),
        wide: true,
        videoId: watch.videoId,
        pct: null,
        flag: getImmersionLang(watch.lang)?.country || null,
        level: watch.level,
        /* [watch-lanjut-menit-v1] Langsung memutar videonya: `?v=` (plus `vl=`
           bahasa) memang dibaca WatchAndLearn saat boot, dan `t=` menaruh jarumnya
           di detik terakhir yang tercatat — jadi tak ada yang perlu diulang. */
        run: () =>
          router.push(
            `/watch?v=${encodeURIComponent(watch.videoId)}&vl=${encodeURIComponent(watch.lang || "en")}` +
              (watch.position > 0 ? `&t=${Math.floor(watch.position)}` : "")
          ),
      });
    }

    return out.sort((a, b) => b.ts - a.ts).slice(0, 3);
  }, [produkDigital, jejak, watch, onOpenEbook, router, t]);

  if (items.length === 0) return null;

  return (
    <section className="mb-5">
      {/* Bingkai pratinjau muncul melembut, bukan berkedip. Ditulis global karena
          dipakai gambar yang lahir-mati mengikuti kursor. */}
      <style jsx global>{`
        @keyframes lanjutFade { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
      <div className="mb-2.5 flex items-center gap-2">
        <ArrowRight className="h-4 w-4 text-[#16796E]" strokeWidth={2.6} />
        <h2 className="text-[15px] font-extrabold text-[#12172B]">{t("Lanjutkan Belajar")}</h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <button
              key={it.key}
              onClick={it.run}
              onMouseEnter={it.videoId ? () => mulaiPratinjau(it.key, it.videoId!) : undefined}
              onMouseLeave={it.videoId ? setopPratinjau : undefined}
              className="group flex items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:ring-[#16796E]/40"
            >
              <span
                className={`relative isolate flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#EEF1F4] ${
                  it.wide ? "h-14 w-[6.25rem]" : "h-14 w-14"
                }`}
              >
                {it.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={it.photo}
                    alt=""
                    className={`relative z-10 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110 motion-reduce:transform-none ${it.fitTop ? "object-top" : ""}`}
                    /* maxresdefault sering 404 → turun ke hqdefault dulu; kalau
                       itu pun gagal, biarkan ikon di belakangnya yang kelihatan */
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      const hq = it.videoId ? youtubeThumb(it.videoId) : "";
                      if (hq && img.src !== hq) img.src = hq;
                      else img.style.opacity = "0";
                    }}
                  />
                ) : null}
                <Icon className="absolute -z-0 h-5 w-5 text-[#16796E]" strokeWidth={2.4} />

                {/* Pratinjau bisu: bingkai video berganti tiap 0,9 detik selama
                    kursor menetap. Sengaja tanpa tombol apa pun di atasnya —
                    gambarnya sendiri yang bergerak, itu cukup jadi tanda. */}
                {it.videoId && preview === it.key && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={frame}
                    src={youtubeFrame(it.videoId, FRAMES[frame])}
                    alt=""
                    className="pointer-events-none absolute inset-0 z-20 h-full w-full scale-110 object-cover opacity-0 animate-[lanjutFade_.35s_ease-out_forwards] motion-reduce:transform-none"
                    /* bingkai tak tersedia → biarkan thumbnail di bawahnya */
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0"; }}
                  />
                )}
              </span>

              <span className="min-w-0 flex-1">
                {/* [lanjutkan-bendera-level-v1] Bendera + nama sumber + chip level dalam
                    satu baris: sekali lirik siswa tahu ini bahasa apa dan setingkat apa,
                    tanpa harus membaca judulnya yang sudah terpotong di kartu sesempit ini. */}
                <span className="flex items-center gap-1.5">
                  {it.flag ? <RectFlag code={it.flag} h={11} className="shadow-sm" /> : null}
                  <span className="truncate text-[11px] font-bold uppercase tracking-wide text-[#16796E]">{it.kind}</span>
                  {it.level ? (
                    <span
                      className="shrink-0 rounded-md px-1.5 py-[1px] text-[9px] font-extrabold leading-[14px] tracking-wide"
                      style={{ backgroundColor: CEFR_STYLE[it.level].bg, color: CEFR_STYLE[it.level].fg }}
                    >
                      {it.level}
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 block truncate text-[14px] font-extrabold text-[#12172B]">{it.title}</span>
                <span className="mt-0.5 block truncate text-[12px] font-medium text-gray-500">{it.sub}</span>
                {it.pct != null && (
                  <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-[#E8EAEE]">
                    <span className="block h-full rounded-full bg-[#16796E]" style={{ width: `${Math.max(4, it.pct)}%` }} />
                  </span>
                )}
              </span>

              <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-[#16796E]" strokeWidth={2.6} />
            </button>
          );
        })}
      </div>
    </section>
  );
}
