// [linguo-patch:pustaka-link-access-v1] Akses produk digital di Perpustakaan LMS lewat LINK.
// Model pengiriman: admin cukup paste URL penuh produk ke kolom digital_products —
//   - video / e-learning  → video_playlist_url (mis. YouTube playlist)
//   - e-book / file        → file_url (mis. tautan Google Drive)
// Kalau file_url masih berupa path object storage lama (mis. "modul.pdf"), dipakai
// signed URL bucket "ebook-files" (perilaku lama tetap jalan, backward-compatible).
// Single-source dipakai LibraryView.tsx & PerpustakaanSaya.tsx — jangan duplikasi rule.

export function isHttpUrl(s: string | null | undefined): boolean {
  return /^https?:\/\//i.test((s ?? "").trim());
}

export type ProductLink = {
  type: "ebook" | "elearning";
  file_url: string | null;
  video_playlist_url: string | null;
};

// [bug-fix:placeholder-link-guard-v1]
// Baris produk sering dibuat dulu dengan URL contekan ("…?list=PLACEHOLDER",
// "https://example.com/…") lalu diisi belakangan. Kalau URL semacam itu dibuka
// apa adanya, YouTube tidak menemukan playlist-nya dan membuang siswa ke beranda
// YouTube — laporan aslinya persis begitu: "sudah saya klik tapi munculnya cuman
// web yutub saja, bukan playlist". Dari sisi siswa itu terbaca sebagai produk
// yang dibeli tapi rusak, bukan sebagai materi yang belum siap.
const PLACEHOLDER_HINTS = /\b(placeholder|contoh|dummy|tbd|coming[-_ ]?soon|xxx+)\b|example\.com/i;

/** Link yang jelas-jelas belum diisi admin — jangan pernah dibuka ke siswa. */
export function isPlaceholderLink(s: string | null | undefined): boolean {
  const v = (s ?? "").trim();
  if (!v) return false;
  if (PLACEHOLDER_HINTS.test(v)) return true;
  // YouTube: id playlist asli selalu diawali PL/UU/OL/RD/FL dan panjang.
  // "?list=" kosong atau isian pendek = belum diisi.
  const m = /[?&]list=([^&]*)/i.exec(v);
  if (m && m[1].trim().length < 12) return true;
  return false;
}

/**
 * URL eksternal siap-buka (YouTube / Google Drive / dll) kalau ada.
 * Prioritas: video_playlist_url → file_url. null = tak ada link → pakai fallback.
 *
 * Link placeholder sengaja TIDAK disaring di sini: pemanggilnya perlu bisa
 * membedakan "belum ada link" (jatuh ke perilaku lama) dari "linknya ada tapi
 * belum benar" (harus bilang apa adanya ke siswa). Pakai `isPlaceholderLink`.
 */
export function externalLinkFor(p: ProductLink): string | null {
  if (isHttpUrl(p.video_playlist_url)) return p.video_playlist_url!.trim();
  if (isHttpUrl(p.file_url)) return p.file_url!.trim();
  return null;
}

/** file_url menunjuk object storage (path relatif, bukan URL) → perlu signed URL. */
export function isStoragePath(s: string | null | undefined): boolean {
  const v = (s ?? "").trim();
  return v.length > 0 && !isHttpUrl(v);
}

// ── [produk-digital-per-bahasa-v1] Materi per bahasa ──────────────────────
// "Paket E-Learning 12+ Bahasa" itu satu produk dengan 12 playlist berbeda,
// sedangkan digital_products cuma punya satu kolom link. Link per bahasanya
// tinggal di tabel `digital_product_langs` (diisi admin di /produk-digital),
// dan pembeli paket memilih bahasa dulu sebelum playlist-nya dibuka.
// Produk satu bahasa tak punya baris di sini → perilakunya persis seperti dulu.

export type ProductLang = {
  id: string;
  product_id: string;
  language: string;
  video_playlist_url: string | null;
  sort_order: number;
};

export const PRODUCT_LANG_SELECT = "id,product_id,language,video_playlist_url,sort_order";

/** Bahasa yang benar-benar bisa dibuka siswa (link ada & bukan placeholder). */
export function usableLangs(rows: ProductLang[] | undefined | null): ProductLang[] {
  return (rows ?? [])
    .filter((l) => isHttpUrl(l.video_playlist_url) && !isPlaceholderLink(l.video_playlist_url))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.language.localeCompare(b.language));
}

/** Ambil baris bahasa untuk sekumpulan produk → dikelompokkan per product_id. */
export async function fetchProductLangs(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  productIds: string[],
): Promise<Record<string, ProductLang[]>> {
  const ids = Array.from(new Set(productIds.filter(Boolean)));
  if (ids.length === 0) return {};
  const { data, error } = await supabase
    .from("digital_product_langs")
    .select(PRODUCT_LANG_SELECT)
    .in("product_id", ids)
    .eq("is_active", true)
    .order("sort_order");
  // Tabelnya baru: kalau belum ada / tak terbaca, jangan bikin Perpustakaan gagal.
  if (error || !data) return {};
  const out: Record<string, ProductLang[]> = {};
  for (const row of data as ProductLang[]) (out[row.product_id] ||= []).push(row);
  return out;
}

/**
 * [materi-belum-siap-v1] Materinya benar-benar bisa dibuka sekarang?
 *
 * Guard lama sudah menghentikan siswa mendarat di beranda YouTube, tapi baru
 * SETELAH tombolnya ditekan — jadi produk yang linknya belum dipasang tetap
 * tampil normal, dan yang membeli baru tahu setelah diklik. Dipakai kartu &
 * baris Perpustakaan untuk mengatakannya di muka.
 *
 * `langs` = baris digital_product_langs milik produk itu (paket multi-bahasa);
 * kosong/undefined berarti produk satu materi.
 */
export function materialReady(p: ProductLink, langs?: ProductLang[] | null): boolean {
  if (langs && langs.length > 0) return usableLangs(langs).length > 0;
  const link = externalLinkFor(p);
  if (link) return !isPlaceholderLink(link);
  // Tanpa link eksternal: e-learning jatuh ke modul LMS internal, e-book ke
  // berkas storage. Dua-duanya punya isi selama kolomnya tidak kosong.
  if (p.type === "elearning") return true;
  return isStoragePath(p.file_url);
}

/** YouTube → "Tonton", link lain / drive → "Buka", file storage → "Download". */
export function accessVerb(p: ProductLink): "Tonton" | "Buka" | "Download" {
  const link = externalLinkFor(p);
  if (link) return /youtu\.?be/i.test(link) ? "Tonton" : "Buka";
  return p.type === "ebook" ? "Download" : "Tonton";
}
