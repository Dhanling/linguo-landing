// [threads-klik-v1] Link pendek di komentar Threads: linguo.id/t/<kode-lead>[/<halaman>].
// Kode = 6 karakter awal id threads_leads. Redirect ke halaman tujuan dengan UTM supaya
// AnalyticsTracker mencatatnya di landing_page_events (utm_source=threads,
// utm_medium=comment, utm_content=<kode>) — dashboard Leads Threads menghitung klik per lead.
import { NextRequest, NextResponse } from "next/server";

const ALLOWED = new Set(["interpreter", "translator"]);

export function GET(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  return params.then(({ slug }) => {
    const code = (slug?.[0] ?? "").toLowerCase();
    const page = (slug?.[1] ?? "").toLowerCase();
    const url = new URL(ALLOWED.has(page) ? `/${page}` : "/", req.nextUrl.origin);
    if (/^[0-9a-f]{6}$/.test(code)) {
      url.searchParams.set("utm_source", "threads");
      url.searchParams.set("utm_medium", "comment");
      url.searchParams.set("utm_content", code);
    }
    return NextResponse.redirect(url, 302);
  });
}
