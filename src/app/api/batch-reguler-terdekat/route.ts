// [bar-batch-reguler-v1] Data ringkas buat pita hitung mundur di paling atas
// SEMUA halaman publik (komponen BatchRegulerTopBar).
//
// Kenapa lewat route ini, bukan query Supabase langsung dari komponen bar:
// barnya nempel di layout root, jadi ikut ke-render di tiap halaman. Query
// langsung = satu hit Supabase per kunjungan halaman. Route ini di-cache CDN
// 5 menit, jadi DB cuma kena sekali per 5 menit per edge.
//
// Kalau query gagal / tidak ada batch yang masih buka, sengaja mengembalikan
// { batch: null } dan barnya TIDAK tampil. Tidak ada cadangan tanggal statik di
// sini: pita hitung mundur yang tanggalnya basi lebih merusak dari pita yang
// tidak muncul sama sekali.
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 300;

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data, error } = await supabase
      .from("v_regular_batches_summary")
      .select(
        "batch_month, language, level, start_date, closes_at, price_regular, current_price_per_student, max_capacity, actual_enrolled",
      )
      .eq("is_published", true)
      .in("status", ["Open", "Confirmed"])
      .order("start_date", { ascending: true });

    if (error) throw error;

    const now = Date.now();
    // Batas pendaftaran = closes_at kalau diisi, kalau tidak jatuh ke tanggal
    // mulai kelas (batch lawas tidak punya closes_at). Sama persis dengan
    // regDeadline() di halaman /jadwal-kelas-reguler biar angkanya tidak beda.
    const deadline = (b: any) => new Date(b.closes_at || b.start_date).getTime();
    const buka = (data || []).filter(
      (b: any) => b.actual_enrolled < b.max_capacity && deadline(b) > now,
    );

    if (buka.length === 0) {
      return NextResponse.json(
        { batch: null },
        { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
      );
    }

    const terdekat = buka.slice().sort((a: any, b: any) => deadline(a) - deadline(b))[0];
    const hargaTermurah = Math.min(
      ...buka.map((b: any) => Number(b.current_price_per_student || b.price_regular) || 0),
    );

    return NextResponse.json(
      {
        batch: {
          batchMonth: terdekat.batch_month,
          closesAt: new Date(deadline(terdekat)).toISOString(),
          startDate: terdekat.start_date,
          price: hargaTermurah,
          // Dipakai buat copy "13 bahasa" — dihitung dari batch yang benar-benar
          // masih bisa didaftar, bukan dari daftar bahasa di landing.
          languages: new Set(buka.map((b: any) => b.language)).size,
        },
      },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
    );
  } catch (e) {
    console.error("[batch-reguler-terdekat]", e);
    return NextResponse.json({ batch: null }, { status: 200 });
  }
}
