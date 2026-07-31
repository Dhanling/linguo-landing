// [sr-kuis-spaced-repetition-v1] Pemanggil Edge Function kuis.
//
// SENGAJA pakai fetch mentah, BUKAN supabase.functions.invoke(): klien
// supabase-js membatalkan request di detik ke-10, sementara panggilan model
// (generate bank soal, koreksi terjemahan) rutin lebih lama dari itu. Lewat
// invoke(), sesi yang sebenarnya sukses tetap terlihat gagal di sisi kita.
//
// Autentikasinya secret bersama di header `x-quiz-secret`, bukan Authorization:
// service key project ini model baru (`sb_secret_…`) yang bukan JWT, jadi
// gerbang JWT bawaan Edge Function selalu menolaknya — karena itu kedua fungsi
// di-deploy dengan --no-verify-jwt dan menjaga pintunya sendiri.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const FN_SECRET = process.env.QUIZ_FN_SECRET || "";

/** Batas tunggu panggilan Edge Function (ms). Koreksi 10 soal biasanya < 20 detik. */
const TIMEOUT_MS = 60_000;

export async function callQuizFunction<T>(
  name: "quiz-generate-bank" | "quiz-grade",
  body: unknown,
  timeoutMs = TIMEOUT_MS
): Promise<T> {
  if (!FN_SECRET) throw new Error("QUIZ_FN_SECRET belum diset.");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-quiz-secret": FN_SECRET },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();

    // quiz-generate-bank menjawab sebagai ALIRAN: baris kosong tiap 10 detik
    // sebagai denyut nadi (gerbang Supabase memutus request yang 150 detik sunyi),
    // lalu JSON hasilnya sebagai BARIS TERAKHIR. Fungsi lain menjawab JSON biasa —
    // mengambil baris terakhir yang tidak kosong menangani keduanya.
    const lastLine = text.split("\n").map((l) => l.trim()).filter(Boolean).pop() ?? "";

    let parsed: unknown;
    try {
      parsed = JSON.parse(lastLine);
    } catch {
      throw new Error(`${name}: respons bukan JSON (${res.status}) — ${text.slice(-200)}`);
    }
    // Karena responsnya dialirkan, statusnya selalu 200 — kegagalan dibaca dari
    // field `error`, bukan dari kode status.
    const err = (parsed as { error?: string })?.error;
    if (!res.ok || err) throw new Error(`${name}: ${err || `HTTP ${res.status}`}`);
    return parsed as T;
  } finally {
    clearTimeout(timer);
  }
}
