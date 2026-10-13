// [reguler-buka-dari-batch-v1] Bahasa Kelas Reguler yang SEDANG dibuka, dibaca
// dari tabel `regular_batches` — bukan dari daftar statis REGULER_LANGS.
//
// Bug Tracker e384f3be (Faujiah, 13 Okt 2026): Batch Oktober hanya membuka
// Mandarin, Prancis, dan Jerman (batch bahasa lain disembunyikan dari website),
// tapi seorang siswa tetap bisa mendaftar dan membayar Kelas Reguler Tagalog.
// REGULER_LANGS menjawab "bahasa ini PERNAH punya batch reguler", dan semua
// jalur daftar + gerbang API memakainya — jadi menyembunyikan batch di dashboard
// tidak menutup pendaftarannya. Perbaikan 12 Okt (ef1eca0f) baru menyaring
// daftar batch yang DITAMPILKAN di wizard /akun; tombol bayarnya tetap terbuka.
//
// Aturan "masih dibuka" disamakan dengan /jadwal-kelas-reguler dan wizard /akun:
// dipublikasikan, status Open/Confirmed, dan batas daftar belum lewat
// (closes_at kalau diisi, kalau tidak akhir hari mulai kelas WIB).
import { createClient } from "@supabase/supabase-js";
import { canonLangName, canonProgram, langNameIdShort, REGULER_LANGS } from "@/lib/programLanguages";

const TTL_MS = 60_000;
let cache: { at: number; langs: string[] } | null = null;

/**
 * Nama kanonik (Inggris) bahasa yang batch regulernya masih dibuka.
 * null = daftar tidak bisa dibaca (DB bermasalah) — pemanggil jatuh ke aturan
 * statis supaya gangguan DB tidak menutup seluruh pendaftaran reguler.
 */
export async function fetchOpenRegulerLangs(): Promise<string[] | null> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.langs;
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data, error } = await supabase
      .from("v_regular_batches_summary")
      .select("language, start_date, closes_at, status")
      .eq("is_published", true)
      .in("status", ["Open", "Confirmed"]);
    if (error) throw error;
    const now = Date.now();
    const masihBuka = (b: any) =>
      (b.closes_at
        ? new Date(b.closes_at).getTime()
        : new Date(`${String(b.start_date).slice(0, 10)}T23:59:59+07:00`).getTime()) >= now;
    const langs = [
      ...new Set(
        (data || [])
          .filter(masihBuka)
          .map((b: any) => canonLangName(b.language))
          .filter((l: string) => !!l && REGULER_LANGS.includes(l)),
      ),
    ] as string[];
    cache = { at: Date.now(), langs };
    return langs;
  } catch (e) {
    console.error("[reguler-buka] gagal membaca batch:", e);
    return null;
  }
}

/**
 * Bahasa reguler dari teks apa pun. Modal di /jadwal-kelas-reguler mengirim nama
 * batch utuh ("German A1.1 (GER-A11-OCT26)"), jadi selain nama kanonik dicoba
 * juga pencocokan awalan. null = bukan bahasa reguler yang dikenal.
 */
function regulerLangOf(raw?: string | null): string | null {
  const c = canonLangName(raw);
  if (c && REGULER_LANGS.includes(c)) return c;
  const t = String(raw || "").trim().toLowerCase();
  return REGULER_LANGS.find((l) => t.startsWith(l.toLowerCase())) || null;
}

/**
 * Pesan tolakan untuk API kalau Kelas Reguler bahasa ini tidak sedang dibuka.
 * null = boleh (bukan reguler, bahasanya dibuka, atau daftarnya tak terbaca).
 * Dipanggil SESUDAH programLangRejection (gerbang statis program × bahasa).
 */
export async function regulerClosedRejection(
  program?: string | null,
  language?: string | null,
): Promise<string | null> {
  if (canonProgram(program) !== "Kelas Reguler") return null;
  const lang = regulerLangOf(language);
  // Bahasanya tak terbaca dari teks → bukan urusan gerbang ini.
  if (!lang) return null;
  const open = await fetchOpenRegulerLangs();
  if (!open || open.includes(lang)) return null;
  const nama = langNameIdShort(lang);
  const dibuka = open.map((l) => langNameIdShort(l)).join(", ");
  return (
    `Kelas Reguler bahasa ${nama} sedang tidak dibuka untuk batch ini. ` +
    (dibuka
      ? `Saat ini Kelas Reguler dibuka untuk: ${dibuka} (lihat linguo.id/jadwal-kelas-reguler). `
      : `Saat ini belum ada batch Kelas Reguler yang dibuka. `) +
    `Untuk ${nama}, pilih Kelas Private atau Semi Private ya.`
  );
}
