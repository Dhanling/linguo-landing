// [pustaka-sampul-kecil-v1] Sampul e-book di Storage diunggah ukuran asli
// (240–840 KB per berkas), padahal kartu rak cuma ±210 px. Pustaka memuat 141
// kartu sekaligus → puluhan MB, sampul muncul lambat. Helper ini minta versi
// kecil: Storage Supabase lewat /render/image (transform bawaan, di-cache CDN),
// foto stok bahasa lokal (/lang/*.jpg) lewat optimizer Next.
// `lebar` = lebar CSS × 2 (layar retina). Next hanya menerima lebar dari
// deviceSizes/imageSizes, jadi dibulatkan ke atas ke daftar itu.
const LEBAR_NEXT = [16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080];

export function sampulKecil(url: string | null | undefined, lebar: number): string {
  if (!url) return "";
  const pub = "/storage/v1/object/public/";
  if (url.includes(pub) && url.includes(".supabase.co")) {
    const u = new URL(url.replace(pub, "/storage/v1/render/image/public/"));
    u.searchParams.set("width", String(lebar));
    u.searchParams.set("quality", "70");
    // WAJIB: mode bawaan Supabase "cover" mempertahankan tinggi asli kalau cuma
    // width yang dikirim (800×1139 → 440×1139), jadi sampul terpotong/ter-zoom.
    u.searchParams.set("resize", "contain");
    return u.toString();
  }
  if (url.startsWith("/") && !url.startsWith("//") && /\.(jpe?g|png|webp)$/i.test(url)) {
    const w = LEBAR_NEXT.find((x) => x >= lebar) ?? 1080;
    return `/_next/image?url=${encodeURIComponent(url)}&w=${w}&q=75`; // Next 16: qualities default cuma [75], selain itu 400
  }
  return url;
}
