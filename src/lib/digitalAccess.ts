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

/** YouTube → "Tonton", link lain / drive → "Buka", file storage → "Download". */
export function accessVerb(p: ProductLink): "Tonton" | "Buka" | "Download" {
  const link = externalLinkFor(p);
  if (link) return /youtu\.?be/i.test(link) ? "Tonton" : "Buka";
  return p.type === "ebook" ? "Download" : "Tonton";
}
