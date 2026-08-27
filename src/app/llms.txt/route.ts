// [aeo-llms-txt-v1] /llms.txt — ringkasan situs dalam teks polos untuk mesin
// jawaban. Di-prerender jadi berkas statis saat build (force-static), jadi
// biayanya sama dengan berkas di public/ tapi isinya dibangkitkan dari data
// bahasa & pricelist yang sama dengan halaman web — tidak bisa basi sendiri.
import { buildLlmsTxt } from "@/lib/llms-txt";

export const dynamic = "force-static";

export function GET() {
  return new Response(buildLlmsTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
