// [ling-chat-jadwal-pdf-v1] PDF jadwal Kelas Reguler & ETP (TOEFL/IELTS), live
// dari DB. Link inilah yang dikirim chat web Ling (bot maupun admin Chat Minling)
// saat pengunjung menanyakan jadwal — lihat src/lib/jadwalKelasPdf.ts.
import { buildJadwalKelasPdf, fetchJadwalKelas, jadwalPdfFileName } from "@/lib/jadwalKelasPdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchJadwalKelas();
    const pdf = buildJadwalKelasPdf(data);
    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${jadwalPdfFileName(data)}"`,
        // Sisa kuota ikut berubah — cukup segar 5 menit di CDN.
        "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (e) {
    console.error("[jadwal-kelas-pdf]", e);
    return Response.redirect("https://linguo.id/jadwal-kelas-reguler", 302);
  }
}
