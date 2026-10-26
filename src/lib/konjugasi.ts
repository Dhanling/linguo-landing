// [konjugasi-animasi-v1] Muat data tabel konjugasi per bahasa + cocokkan ke sesi silabus.
import type { KonjugasiBahasa, TabelKonjugasi } from "@/data/konjugasi/types";

const cache = new Map<string, Promise<KonjugasiBahasa | null>>();

/** null = bahasa ini belum punya (atau memang tak punya) tabel konjugasi. */
export function muatKonjugasi(slug: string): Promise<KonjugasiBahasa | null> {
  if (!slug || slug === "types") return Promise.resolve(null);
  let p = cache.get(slug);
  if (!p) {
    p = import(`../data/konjugasi/${slug}`)
      .then((m: any) => {
        const d = m?.default as KonjugasiBahasa | undefined;
        return d && Array.isArray(d.tabel) && d.tabel.length ? d : null;
      })
      .catch(() => null);
    cache.set(slug, p);
  }
  return p;
}

/** Tabel yang dibahas sesi ini. Judul sesi lebih menentukan daripada topik:
 *  kalau judulnya sudah kena, topik tidak ikut menambah tabel lain. */
export function tabelUntukSesi(
  data: KonjugasiBahasa | null,
  sesi: { title: string; topics?: string[] }
): TabelKonjugasi[] {
  if (!data) return [];
  const kena = (teks: string) => data.tabel.filter((t) => t.cocok.some((r) => r.test(teks)));
  const dariJudul = kena(sesi.title);
  if (dariJudul.length) return dariJudul;
  return kena((sesi.topics || []).join(" | "));
}
