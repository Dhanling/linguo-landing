// [pustaka-sampul-kecil-v1] Sampul e-book di Storage diunggah ukuran asli
// (240–840 KB per berkas), padahal kartu rak cuma ±210 px. Pustaka memuat 141
// kartu sekaligus → puluhan MB, sampul muncul lambat. Helper ini minta versi
// kecil lewat optimizer Next — baik sampul di Storage Supabase maupun foto stok
// bahasa lokal (/lang/*.jpg).
// `lebar` = lebar CSS × 2 (layar retina). Next hanya menerima lebar dari
// deviceSizes/imageSizes, jadi dibulatkan ke atas ke daftar itu.
const LEBAR_NEXT = [16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080];

export function sampulKecil(url: string | null | undefined, lebar: number): string {
  if (!url) return "";
  const w = LEBAR_NEXT.find((x) => x >= lebar) ?? 1080;
  // [sampul-tanpa-transform-supabase-v1] Dulu sampul Storage lewat
  // /storage/v1/render/image Supabase — kuota Pro cuma 100 gambar asli per
  // siklus, dan ±141 sampul saja sudah menjebolnya (171/100, Sep 2026). Sekarang
  // lewat optimizer Next (domain Supabase sudah di remotePatterns next.config),
  // sama seperti cover blog. Kalau optimizer gagal (mis. kuota Vercel Hobby),
  // <img onError={sampulGagal(asli)}> jatuh ke berkas asli.
  const bolehNext =
    (url.startsWith("/") && !url.startsWith("//")) ||
    url.startsWith("https://jbtgciepdmqxxcjflrxz.supabase.co/storage/v1/object/public/");
  if (bolehNext && /\.(jpe?g|png|webp)(\?.*)?$/i.test(url)) {
    return `/_next/image?url=${encodeURIComponent(url)}&w=${w}&q=75`; // Next 16: qualities default cuma [75], selain itu 400
  }
  return url;
}

// onError untuk <img src={sampulKecil(asli, …)}>: coba berkas asli sekali,
// kalau itu pun gagal baru disembunyikan (latar gradien tetap tampil).
export function sampulGagal(asli: string | null | undefined) {
  return (e: { currentTarget: HTMLImageElement }) => {
    const img = e.currentTarget;
    if (asli && img.dataset.asli !== "1") {
      img.dataset.asli = "1";
      img.src = asli;
    } else {
      img.style.display = "none";
    }
  };
}
