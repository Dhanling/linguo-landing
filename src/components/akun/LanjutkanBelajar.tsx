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

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { getWatchHistory, youtubeThumb, youtubeThumbMax } from "@/lib/immersion";
import { useT } from "@/lib/uiLang";
import { GraduationCap, BookMarked, Clapperboard, BookText, ArrowRight, type LucideIcon } from "lucide-react";

export interface MandiriResume {
  native: string; label: string; photo: string | null; slug: string;
  total: number; done: number; pct: number;
  resumeId: string; resumeTitle: string; fresh: boolean; ts: number;
}

export interface ProdukDigital {
  id: string; purchaseId: string;
  type: "ebook" | "elearning";
  title: string; language: string | null; link: string | null;
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
  pct: number | null;
  run: () => void;
};

/** Posisi baca e-book, dari localStorage yang ditulis EbookReader. */
function bacaanEbook(purchaseId: string): { page: number; total: number; ts: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const mentah = localStorage.getItem(`ebook-hal:${purchaseId}`);
    if (!mentah) return null;
    const [halTeks, totalTeks] = mentah.split("/");
    const page = Number(halTeks);
    const total = Number(totalTeks);
    if (!Number.isFinite(page) || page < 2) return null; // masih di sampul = belum dibaca
    const ts = Number(localStorage.getItem(`ebook-hal-ts:${purchaseId}`) || 0);
    return { page, total: Number.isFinite(total) ? total : 0, ts: Number.isFinite(ts) ? ts : 0 };
  } catch {
    return null;
  }
}

export default function LanjutkanBelajar({
  mandiri,
  produkDigital,
  lingbookOk,
  onOpenSesi,
  onOpenPustaka,
}: {
  mandiri: MandiriResume | null;
  produkDigital: ProdukDigital[];
  lingbookOk: boolean;
  onOpenSesi: (lessonId: string) => void;
  onOpenPustaka: () => void;
}) {
  const t = useT();
  const router = useRouter();

  /* Bab Lingbook terakhir disentuh. Tabel `lingbook_progress` boleh belum ada
     (migrasinya opsional) — gagal apa pun = sumber ini diam saja. */
  const [lingbook, setLingbook] = useState<{ book: string; chapter: string; ts: number } | null>(null);
  useEffect(() => {
    if (!lingbookOk) { setLingbook(null); return; }
    let alive = true;
    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth?.user?.id;
        if (!uid) return;
        const { data, error } = await supabase
          .from("lingbook_progress")
          .select("book_slug,chapter_slug,updated_at")
          .eq("user_id", uid)
          .order("updated_at", { ascending: false })
          .limit(1);
        if (!alive || error || !data?.length) return;
        const row = data[0] as any;
        setLingbook({
          book: row.book_slug,
          chapter: row.chapter_slug,
          ts: new Date(row.updated_at).getTime() || 0,
        });
      } catch {
        /* tabel belum ada / RLS — abaikan */
      }
    })();
    return () => { alive = false; };
  }, [lingbookOk]);

  /* Riwayat tonton hidup di localStorage (lihat lib/immersion). Dibaca sesudah
     mount supaya render server & klien tidak berbeda. */
  const [watch, setWatch] = useState<
    { videoId: string; title: string; thumbnail: string | null; lang: string; ts: number } | null
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
    });
  }, []);

  const items = useMemo<Item[]>(() => {
    const out: Item[] = [];

    if (mandiri && mandiri.ts > 0) {
      out.push({
        key: "mandiri",
        ts: mandiri.ts,
        kind: t("Belajar Mandiri"),
        title: `${mandiri.native} · ${mandiri.label}`,
        sub: `${mandiri.fresh ? t("Lanjut") : t("Ulangi")}: ${mandiri.resumeTitle}`,
        icon: GraduationCap,
        photo: mandiri.photo,
        pct: mandiri.pct,
        run: () => onOpenSesi(mandiri.resumeId),
      });
    }

    produkDigital.forEach((d) => {
      if (d.type !== "ebook") return;
      const b = bacaanEbook(d.purchaseId);
      if (!b) return;
      out.push({
        key: `ebook-${d.purchaseId}`,
        ts: b.ts,
        /* [lingbook-nama-ebook-v1] Kartu e-book memakai nama produknya: "Lingbook".
           Sumber datanya tetap produk digital bertipe `ebook`. */
        kind: "Lingbook",
        title: d.title,
        sub: b.total ? `${t("Halaman")} ${b.page}/${b.total}` : `${t("Halaman")} ${b.page}`,
        icon: BookMarked,
        photo: null,
        pct: b.total ? Math.min(100, Math.round((b.page / b.total) * 100)) : null,
        // E-Book dibaca di dalam Perpustakaan (EbookReader), bukan lewat tautan luar.
        run: onOpenPustaka,
      });
    });

    if (lingbook) {
      out.push({
        key: "lingbook",
        ts: lingbook.ts,
        /* [lingbook-nama-ebook-v1] Nama "Lingbook" sekarang milik e-book, jadi
           bacaan CMS bab-per-bab dipanggil "Interaktif" — sama persis dengan
           nama raknya di Perpustakaan, supaya kartu dan rak saling menunjuk. */
        kind: "Interaktif",
        title: lingbook.book.replace(/-/g, " "),
        sub: `${t("Bab")} ${lingbook.chapter.replace(/-/g, " ")}`,
        icon: BookText,
        photo: null,
        pct: null,
        run: () => router.push(`/akun/lingbook/${lingbook.book}/${lingbook.chapter}`),
      });
    }

    if (watch) {
      out.push({
        key: "watch",
        ts: watch.ts,
        kind: "Watch & Learn",
        title: watch.title,
        sub: t("Lanjut menonton"),
        icon: Clapperboard,
        /* Thumbnail video asli — sama seperti layar diam waktu videonya dijeda.
           Riwayat lama kadang menyimpan thumbnail null → rakit sendiri dari
           videoId, jangan jatuh ke kotak ikon polos. */
        photo: watch.thumbnail || youtubeThumbMax(watch.videoId),
        wide: true,
        pct: null,
        /* Mendarat di BERANDA Watch & Learn, bukan langsung memutar videonya:
           rail "Keep Watching" di sana sudah memuat video ini di posisi pertama,
           sekalian siswa bisa memilih tontonan lain. */
        run: () => router.push("/watch"),
      });
    }

    return out.sort((a, b) => b.ts - a.ts).slice(0, 3);
  }, [mandiri, produkDigital, lingbook, watch, onOpenSesi, onOpenPustaka, router, t]);

  if (items.length === 0) return null;

  return (
    <section className="mb-5">
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
              className="group flex items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:ring-[#16796E]/40"
            >
              <span
                className={`relative isolate flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#EEF1F4] ${
                  it.wide ? "h-14 w-[5.75rem]" : "h-14 w-14"
                }`}
              >
                {it.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={it.photo}
                    alt=""
                    className="relative z-10 h-full w-full object-cover"
                    /* maxresdefault sering 404 → turun ke hqdefault dulu; kalau
                       itu pun gagal, biarkan ikon di belakangnya yang kelihatan */
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      const hq = it.wide && watch ? youtubeThumb(watch.videoId) : "";
                      if (hq && img.src !== hq) img.src = hq;
                      else img.style.opacity = "0";
                    }}
                  />
                ) : null}
                <Icon className="absolute -z-0 h-5 w-5 text-[#16796E]" strokeWidth={2.4} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-bold uppercase tracking-wide text-[#16796E]">{it.kind}</span>
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
