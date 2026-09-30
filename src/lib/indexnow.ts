// =============================================================================
// src/lib/indexnow.ts
// [aeo-indexnow-v1]
//
// IndexNow = protokol "halaman ini baru/berubah, tolong rayapi" yang dipakai
// Bing, Yandex, Seznam, Naver. Relevan untuk mesin jawaban karena ChatGPT Search
// dan Copilot mengambil hasil webnya dari indeks Bing: artikel yang belum
// dirayapi Bing tidak mungkin dikutip ChatGPT, sebagus apa pun isinya. Tanpa
// IndexNow, Bing menemukan halaman baru lewat sitemap dalam hitungan hari–minggu.
//
// Kunci = berkas public/<KEY>.txt berisi kunci itu sendiri. Mengganti kunci
// berarti mengganti NAMA DAN ISI berkas itu sekaligus.
// =============================================================================

export const INDEXNOW_KEY = "5be0cd6976f580a2da9772b4ddbd5c47";
const HOST = "linguo.id";
const ENDPOINT = "https://api.indexnow.org/indexnow";
/** Batas protokol per permintaan. */
const MAX_PER_REQUEST = 10000;

export type IndexNowResult = { submitted: number; status: number[] };

/**
 * Kirim URL ke IndexNow. URL di luar linguo.id dibuang (protokol menolak
 * seluruh batch kalau ada satu host yang beda). 200/202 = diterima.
 */
export async function submitIndexNow(urls: string[]): Promise<IndexNowResult> {
  const list = [...new Set(urls)].filter((u) => {
    try {
      return new URL(u).host === HOST;
    } catch {
      return false;
    }
  });
  const status: number[] = [];
  for (let i = 0; i < list.length; i += MAX_PER_REQUEST) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: HOST,
        key: INDEXNOW_KEY,
        keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
        urlList: list.slice(i, i + MAX_PER_REQUEST),
      }),
    });
    status.push(res.status);
  }
  return { submitted: list.length, status };
}
