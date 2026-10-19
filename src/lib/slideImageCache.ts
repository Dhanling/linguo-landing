/** Cache kecil untuk unduh + decode cover sebelum kartu ditampilkan. */
type Entri = { image: HTMLImageElement; promise: Promise<void>; ready: boolean };
const cache = new Map<string, Entri>();
// [slide-cepat-v1] Cukup untuk beberapa dek sekaligus (tiap dek ±3 gambar unik);
// entri yang terbuang memaksa slide menunggu lagi walau berkasnya sudah di cache HTTP.
const BATAS = 40;

export function slideImageReady(src?: string): boolean {
  return !src || cache.get(src)?.ready === true;
}

export function preloadSlideImage(src?: string, priority: "high" | "low" = "low"): Promise<void> {
  if (!src || typeof Image === "undefined") return Promise.resolve();
  const cached = cache.get(src);
  if (cached) {
    if (priority === "high") cached.image.fetchPriority = "high";
    cache.delete(src);
    cache.set(src, cached);
    return cached.promise;
  }
  const image = new Image();
  image.decoding = "async";
  image.fetchPriority = priority;
  let done!: () => void;
  const promise = new Promise<void>((resolve) => { done = resolve; });
  const entry: Entri = { image, promise, ready: false };
  cache.set(src, entry);
  while (cache.size > BATAS) cache.delete(cache.keys().next().value!);
  const finish = (ready: boolean) => {
    entry.ready = ready;
    image.onload = image.onerror = null;
    if (!ready && cache.get(src) === entry) cache.delete(src);
    done(); // Gagal gambar tidak boleh mengunci isi materi.
  };
  image.onload = () => {
    if (image.decode) void image.decode().then(() => finish(true), () => finish(true));
    else finish(true);
  };
  image.onerror = () => finish(false);
  image.src = src;
  return promise;
}

/** [slide-cepat-v1] Panaskan seluruh gambar satu dek sebelum viewer dibuka
 *  (hover/fokus tombol slide): dua gambar pertama didahulukan. */
export function preloadDekSlides(slides?: Array<{ cover?: string | null }> | null): void {
  if (!slides?.length) return;
  const unik = [...new Set(slides.map((s) => s.cover).filter(Boolean) as string[])];
  unik.forEach((src, n) => { void preloadSlideImage(src, n < 2 ? "high" : "low"); });
}
