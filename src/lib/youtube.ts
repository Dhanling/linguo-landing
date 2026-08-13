// [linguo-patch:produk-digital-link-v1] Parser URL YouTube → URL embed.
//
// Rini menempelkan link apa adanya dari bilah alamat YouTube (playlist, watch,
// youtu.be, shorts, bahkan link "share" ber-ekor `?si=`). Semua bentuk itu harus
// jadi satu URL `/embed/…` supaya bisa diputar langsung di dashboard & di
// pustaka siswa — membuka tab YouTube itu justru bug yang mau dihilangkan.
//
// Kembarannya di repo admin: `linguo-admin-dashboard/src/lib/youtube.ts`. Kalau
// salah satu diubah, ubah keduanya.

export type YouTubeRef = {
  videoId: string | null;
  listId: string | null;
  /** URL siap dipasang di <iframe src>. */
  embedUrl: string;
  /** URL kanonik buat tombol "buka di YouTube". */
  watchUrl: string;
};

function pickId(v: string | null | undefined): string | null {
  const s = (v ?? "").trim();
  return s.length > 0 ? s : null;
}

/**
 * null = bukan URL YouTube (atau tak ada id yang bisa dipakai). Pemanggilnya
 * boleh tetap memperlakukannya sebagai link biasa (Drive dll).
 */
export function parseYouTube(raw: string | null | undefined): YouTubeRef | null {
  const s = (raw ?? "").trim();
  if (!s) return null;

  let u: URL;
  try {
    u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
  } catch {
    return null;
  }

  const host = u.hostname.replace(/^www\./i, "").toLowerCase();
  const isShort = host === "youtu.be";
  const isYt = isShort || host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com" || host === "youtube-nocookie.com";
  if (!isYt) return null;

  const seg = u.pathname.split("/").filter(Boolean);
  let videoId: string | null = null;

  if (isShort) {
    videoId = pickId(seg[0]);
  } else if (seg[0] === "watch") {
    videoId = pickId(u.searchParams.get("v"));
  } else if (seg[0] === "embed" || seg[0] === "shorts" || seg[0] === "live" || seg[0] === "v") {
    // /embed/videoseries?list=… itu playlist, bukan video
    videoId = seg[1] && seg[1] !== "videoseries" ? pickId(seg[1]) : null;
  }

  const listId = pickId(u.searchParams.get("list"));
  if (!videoId && !listId) return null;

  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${encodeURIComponent(videoId)}${listId ? `?list=${encodeURIComponent(listId)}` : ""}`
    : `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(listId!)}`;

  const watchUrl = videoId
    ? `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}${listId ? `&list=${encodeURIComponent(listId)}` : ""}`
    : `https://www.youtube.com/playlist?list=${encodeURIComponent(listId!)}`;

  return { videoId, listId, embedUrl, watchUrl };
}

export function isYouTubeUrl(raw: string | null | undefined): boolean {
  return parseYouTube(raw) !== null;
}

/** Thumbnail playlist/video — dipakai buat kartu pratinjau. */
export function youTubeThumb(ref: YouTubeRef | null): string | null {
  if (!ref?.videoId) return null;
  return `https://i.ytimg.com/vi/${encodeURIComponent(ref.videoId)}/hqdefault.jpg`;
}
