// [aeo-llms-txt-v1] /llms-full.txt — blok fakta lengkap: identitas badan hukum,
// tabel harga seluruh program, daftar semua bahasa beserta URL-nya, metodologi,
// dan FAQ. Ini berkas yang dimaksudkan untuk dibaca utuh oleh mesin jawaban
// ketika /llms.txt tidak cukup.
import { buildLlmsFullTxt } from "@/lib/llms-txt";

export const dynamic = "force-static";

export function GET() {
  return new Response(buildLlmsFullTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
