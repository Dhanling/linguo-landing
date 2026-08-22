// [ebook-reader-v1] Penyalur berkas e-book untuk reader di dashboard siswa.
//
// Kenapa tidak createSignedUrl 7 hari dari browser seperti dulu: URL sepanjang
// itu sampai ke klien apa adanya dan siapa pun yang memegangnya bisa mengunduh
// modul tanpa login — cukup satu siswa menyalinnya dari tab Network.
//
// [ebook-buka-cepat-v3] Sekarang ada DUA jalur, dua-duanya lewat pemeriksaan
// hak yang sama persis di bawah:
//   • `bagian: "url"` → balas URL bertanda tangan berumur 5 MENIT. Bytenya
//     ditarik browser LANGSUNG dari CDN Supabase, jadi modul 3,5 MB tidak lagi
//     melewati fungsi serverless kita dua kali (dan tidak menggerogoti egress).
//   • `bagian: "pdf"` → jalur lama: bytenya diteruskan server. Dipakai sebagai
//     cadangan kalau tarikan langsung gagal (proxy kantor, CORS aneh).
// Umur 5 menit itu tawar-menawar sadar: cukup untuk mengunduh sekali, terlalu
// pendek untuk jadi tautan bajakan yang bisa disebar.
//
// Urutan pemeriksaan:
//   1. token sesi Supabase valid → siapa pemanggilnya,
//   2. baris digital_purchases itu MILIK dia (auth_user_id / buyer_email),
//   3. statusnya Lunas, access_granted, belum lewat expires_at,
//   4. baru berkasnya diambil dengan service role.
//
// Balasannya sengaja no-store: jangan sampai proxy/CDN menyimpan modul berbayar.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isStoragePath } from "@/lib/digitalAccess";
import { buatTiket } from "@/lib/ebookToken";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const BUCKET = "ebook-files";

/** Umur URL bertanda tangan (detik) — lihat catatan kepala berkas. */
const UMUR_TANDA = 300;
/** Umur tiket potongan. Panjang: satu sesi baca bisa berjam-jam, dan tiket yang
    habis di tengah jalan berarti halaman berikutnya gagal dimuat. Tiketnya
    sendiri cuma berlaku untuk SATU berkas dan cuma bisa dipakai lewat domain
    kita. */
const UMUR_TIKET = 6 * 3600;

/** Jalur objek storage → potongan URL yang aman. */
const enc = (jalur: string) => jalur.split("/").map(encodeURIComponent).join("/");

// Berkas modul dibaca sekali lalu dipegang di memori browser; jangan pernah
// dianggap statis oleh perantara mana pun.
const NO_STORE = { "Cache-Control": "no-store, private, max-age=0" };

function tolak(pesan: string, status: number) {
  return NextResponse.json({ error: pesan }, { status, headers: NO_STORE });
}

export async function POST(req: NextRequest) {
  let purchaseId: string, accessToken: string, bagian: string;
  try {
    const body = await req.json();
    purchaseId = String(body.purchaseId ?? "");
    accessToken = String(body.accessToken ?? "");
    // [ebook-latihan-interaktif-v1] "latihan" → berkas soal pendamping, bukan
    // PDF-nya. Pemeriksaan haknya SAMA PERSIS: soal & kuncinya isi produk
    // berbayar juga, jadi tak boleh punya jalur yang lebih longgar.
    bagian = String(body.bagian ?? "pdf");
  } catch {
    return tolak("Permintaan tidak terbaca", 400);
  }
  if (!purchaseId || !accessToken) return tolak("purchaseId dan accessToken wajib diisi", 400);

  // ── 1. Siapa yang meminta? ────────────────────────────────────────────────
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // [ebook-reader-cepat-v2] Verifikasi sesi dan pembacaan baris pembelian
  // dijalankan BERBARENGAN. Dulu berurutan, jadi siswa menunggu dua perjalanan
  // ke Supabase sebelum berkasnya mulai diambil. Datanya tetap tidak bocor:
  // hasil query di bawah baru dipakai SETELAH pemeriksaan pemilik lolos.
  const [{ data: { user }, error: authErr }, { data: beli, error: beliErr }] = await Promise.all([
    userClient.auth.getUser(),
    admin
      .from("digital_purchases")
      .select("id, auth_user_id, buyer_email, payment_status, access_granted, expires_at, download_count, digital_products(id, type, title, file_url)")
      .eq("id", purchaseId)
      .maybeSingle(),
  ]);
  if (authErr || !user) return tolak("Sesi tidak valid atau sudah habis", 401);

  // ── 2. Pembelian ini memang miliknya? ─────────────────────────────────────
  if (beliErr) return tolak("Gagal membaca data pembelian", 500);
  if (!beli) return tolak("Pembelian tidak ditemukan", 404);

  // Pembelian lama sering belum ter-klaim ke akun (auth_user_id null) dan cuma
  // punya email pembeli — itu jalur sah, jadi email ikut diterima. Perbandingan
  // huruf kecil: alamat yang sama sering tercatat beda kapitalisasi.
  const emailSama =
    !!beli.buyer_email && !!user.email &&
    beli.buyer_email.trim().toLowerCase() === user.email.trim().toLowerCase();
  if (beli.auth_user_id !== user.id && !emailSama) return tolak("E-book ini bukan milik akunmu", 403);

  // ── 3. Aksesnya masih hidup? ──────────────────────────────────────────────
  if (beli.payment_status !== "Lunas") return tolak("Pembayaran e-book ini belum lunas", 402);
  if (beli.access_granted === false) return tolak("Akses e-book ini sedang ditahan", 403);
  if (beli.expires_at && new Date(beli.expires_at).getTime() < Date.now()) {
    return tolak("Masa akses e-book ini sudah berakhir", 403);
  }

  const prod = (Array.isArray(beli.digital_products) ? beli.digital_products[0] : beli.digital_products) as
    | { id: string; type: string; title: string; file_url: string | null }
    | null;
  if (!prod || prod.type !== "ebook") return tolak("Produk ini bukan e-book", 400);
  // Link eksternal (Drive dsb) tidak lewat sini — reader hanya untuk berkas milik kita.
  if (!isStoragePath(prod.file_url)) return tolak("E-book ini tidak disimpan sebagai berkas", 400);

  /** Catat akses — best-effort, jangan pernah menahan modul gara-gara statistik. */
  const catatAkses = () => {
    admin
      .from("digital_purchases")
      .update({ download_count: (beli.download_count || 0) + 1, last_downloaded_at: new Date().toISOString() })
      .eq("id", beli.id)
      .then(undefined, () => {});
  };

  // ── Jalur cepat: alamat bertanda tangan, bukan bytenya ────────────────────
  // [ebook-buka-cepat-v3] Satu permintaan ini melayani PDF sekaligus berkas
  // soalnya, jadi membuka modul cuma sekali membangunkan fungsi serverless —
  // dulu dua kali, dan tiap bangun harganya 1–1,5 detik sebelum byte pertama
  // berangkat.
  if (bagian === "url") {
    const jalurPdf = prod.file_url!;
    const jalurSoal = jalurPdf.replace(/\.pdf$/i, "") + ".latihan.json";
    const [tandaPdf, tandaSoal, kepala] = await Promise.all([
      admin.storage.from(BUCKET).createSignedUrl(jalurPdf, UMUR_TANDA),
      admin.storage.from(BUCKET).createSignedUrl(jalurSoal, UMUR_TANDA),
      // HEAD sekalian jadi dua hal: bukti berkasnya memang ada, dan `etag`-nya
      // dipakai klien untuk tahu simpanan di perangkatnya masih edisi terbaru.
      fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${enc(jalurPdf)}`, {
        method: "HEAD",
        headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
        cache: "no-store",
      }).catch(() => null),
    ]);
    if (!tandaPdf.data?.signedUrl || (kepala && !kepala.ok)) {
      return tolak("Berkas modul belum diunggah tim Linguo. Hubungi CS ya.", 404);
    }
    catatAkses();
    // Dua alamat, dua tugas:
    //   • `url` (langsung ke CDN Supabase) untuk menarik modul UTUH ke simpanan
    //     perangkat — tidak lewat server kita, jadi tidak makan egress Vercel;
    //   • `urlPotong` (domain sendiri) untuk pdf.js: potongan seperlunya saja,
    //     supaya bentangan pertama tampil sebelum berkasnya utuh.
    const tiket = buatTiket(jalurPdf, UMUR_TIKET);
    return NextResponse.json(
      {
        url: tandaPdf.data.signedUrl,
        urlPotong: `/api/ebook/berkas?p=${tiket.p}&exp=${tiket.exp}&sig=${encodeURIComponent(tiket.sig)}`,
        // Modul pihak ketiga tak punya berkas soal — URL-nya tetap dikirim,
        // yang menjawab 400 nanti cuma bikin tombol latihannya tidak muncul.
        urlSoal: tandaSoal.data?.signedUrl ?? null,
        versi: kepala?.headers.get("etag") ?? null,
        umur: UMUR_TANDA,
      },
      { headers: NO_STORE },
    );
  }

  if (bagian === "latihan") {
    const namaSoal = prod.file_url!.replace(/\.pdf$/i, "") + ".latihan.json";
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${enc(namaSoal)}`, {
      headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
      cache: "no-store",
    }).catch(() => null);
    // Modul pihak ketiga tak punya berkas soal — itu keadaan normal, bukan
    // galat: readernya cuma tidak menampilkan tombol latihan.
    if (!res?.ok) return NextResponse.json({ unit: [] }, { headers: NO_STORE });
    const isi = await res.text();
    return new NextResponse(isi, { headers: { ...NO_STORE, "Content-Type": "application/json" } });
  }

  // ── 4. Ambil berkasnya ────────────────────────────────────────────────────
  // [ebook-reader-cepat-v2] Diambil lewat REST storage lalu badan responsnya
  // DITERUSKAN apa adanya (streaming). `storage.download()` menunggu seluruh
  // berkas jadi Blob di memori server dulu, baru byte pertamanya berangkat ke
  // siswa — untuk modul 1 MB itu jeda yang percuma, dan memori Vercel ikut
  // kena. Yang penting tetap sama: URL bertanda tangan tak pernah ke browser.
  const berkas = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${enc(prod.file_url!)}`, {
    headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
    cache: "no-store",
  }).catch(() => null);
  if (!berkas || !berkas.ok || !berkas.body) {
    // Kasus nyata saat fitur ini dibuat: semua produk masih menunjuk
    // "placeholder.pdf" sementara buckernya kosong. Katakan apa adanya —
    // ini bukan salah siswanya dan bukan sesi kedaluwarsa.
    return tolak("Berkas modul belum diunggah tim Linguo. Hubungi CS ya.", 404);
  }

  catatAkses();

  const panjang = berkas.headers.get("content-length");
  return new NextResponse(berkas.body, {
    status: 200,
    headers: {
      ...NO_STORE,
      "Content-Type": "application/pdf",
      ...(panjang ? { "Content-Length": panjang } : {}),
      "Content-Disposition": `inline; filename="${prod.id}.pdf"`,
    },
  });
}
