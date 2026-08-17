/* [kuis-domain-linguo-v1] Klien halaman pengerjaan kuis pengajar (/kuis/isi/<token>).
 *
 * Halaman ini pindah dari dashboard admin (teach.linguo.id) ke sini. Alasannya
 * bukan sekadar alamat yang enak dibaca: link kuis dikirim ke grup WhatsApp
 * kelas, dan siswa yang membukanya mendarat di aplikasi staf — satu bundel besar
 * berisi seluruh dashboard, lengkap dengan klien auth yang menunggu sesi login
 * yang memang tidak akan pernah ada. Di sini halamannya berdiri sendiri.
 *
 * Semua data lewat edge function `quiz-public` (deployed --no-verify-jwt), sama
 * seperti sebelumnya — kunci jawaban tidak pernah ikut turun ke browser.
 * Dipanggil LANGSUNG dari browser, bukan lewat route Next: unggahan foto tulisan
 * tangan bisa sampai 8 MB, sedangkan badan permintaan serverless Vercel dipotong
 * di ~4,5 MB.
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export type QuizQType = "multiple_choice" | "translation" | "fill_blank" | "hots" | "essay";

export interface PublicQuizQuestion {
  type: QuizQType;
  part: 1 | 2;
  prompt: string;
  prompt_translit?: string | null;
  options: string[];
  options_translit?: string[];
  points: number;
}

export interface PublicQuiz {
  title: string;
  difficulty: string | null;
  source_lang: string | null;
  target_lang: string | null;
  questions: PublicQuizQuestion[];
  translit?: boolean;
  part2_allow_upload?: boolean;
  /** [kuis-durasi-pengerjaan-v1] Batas waktu (menit). null/0 = tanpa hitung mundur. */
  time_limit_min?: number | null;
  roster?: { id: string; name: string }[];
  session_label?: string | null;
}

/** Jawaban bagian 2: diketik langsung, atau foto tulisan tangan yang diunggah.
 *  `tidak_tahu` = siswa menyatakan tidak tahu (kuis-tidak-tahu-v1). Penanda ini
 *  hanya hidup di browser — sebelum dikirim ia diubah jadi teks "TIDAK TAHU"
 *  supaya pengoreksi (kunci jawaban untuk bagian 1, AI untuk bagian 2) tidak
 *  perlu tahu bentuk internal apa pun. */
/** `ime: true` = aksaranya lahir dari bantuan konversi Latin → aksara di kotak
 *  jawaban, bukan diketik langsung. Ikut tersimpan ke `quiz_answers.response`
 *  (jsonb, jadi tak perlu kolom baru) dan ditampilkan sebagai penanda di hasil;
 *  `grade-quiz` hanya membaca `text`/`image_url`, jadi nilainya tak terpengaruh. */
export interface EssayResponse { text?: string; image_url?: string; tidak_tahu?: boolean; ime?: boolean }

export interface QuizAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  topics: string[];
}

export interface GradeResult {
  index: number;
  is_correct: boolean;
  score: number;
  feedback: string;
  /** Hasil baca foto tulisan tangan — kosong untuk jawaban yang diketik. */
  transcript?: string;
}

async function callQuizPublic<T = any>(
  body: unknown,
  timeoutMs: number,
): Promise<{ data: T | null; error: string | null }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/quiz-public`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify(body ?? {}),
      signal: controller.signal,
    });
    const text = await resp.text();
    let parsed: any = null;
    try { parsed = text ? JSON.parse(text) : null; } catch { /* non-JSON */ }
    if (!resp.ok) return { data: null, error: parsed?.error || text?.slice(0, 300) || `Error ${resp.status}` };
    return { data: parsed as T, error: null };
  } catch (err: any) {
    // Koreksi AI bisa 60 detik lebih; pesan "timeout" yang jujur lebih berguna
    // daripada "gagal" yang membuat siswa mengirim ulang jawabannya berkali-kali.
    return {
      data: null,
      error: err?.name === "AbortError"
        ? `timeout >${Math.round(timeoutMs / 1000)} detik — coba lagi ya`
        : (err?.message || "gagal menghubungi server"),
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function loadPublicQuiz(
  token: string,
): Promise<{ quiz?: PublicQuiz; error?: string; code?: string }> {
  const { data, error } = await callQuizPublic({ action: "load", token }, 30000);
  if (error) return { error };
  if (!data?.ok) return { error: data?.error || "Gagal memuat kuis", code: data?.code };
  return { quiz: data.quiz as PublicQuiz };
}

export async function submitPublicQuiz(
  token: string,
  studentName: string,
  responses: Record<number, any>,
  studentId?: string | null,
  /** [kuis-durasi-pengerjaan-v1] Lama pengerjaan (detik) sejak tombol "Mulai" ditekan. */
  durationSec?: number | null,
): Promise<
  | { total: number; max: number; results: GradeResult[]; analysis: QuizAnalysis | null; duration_sec: number | null }
  | { error: string }
> {
  const { data, error } = await callQuizPublic(
    {
      action: "submit", token, student_name: studentName, student_id: studentId ?? null, responses,
      duration_sec: durationSec ?? null,
    },
    180000,
  );
  if (error) return { error };
  if (!data?.ok) return { error: data?.error || "Gagal mengirim jawaban" };
  return {
    total: Number(data.total) || 0,
    max: Number(data.max) || 0,
    results: data.results ?? [],
    analysis: data.analysis && typeof data.analysis === "object" ? (data.analysis as QuizAnalysis) : null,
    duration_sec: Number(data.duration_sec) > 0 ? Number(data.duration_sec) : null,
  };
}

/** Unggah foto tulisan tangan (bagian 2). @returns URL publik, atau pesan galat. */
export async function uploadHandwriting(
  token: string,
  file: File,
): Promise<{ url?: string; error?: string }> {
  if (file.size > 8 * 1024 * 1024) return { error: "Ukuran foto maksimal 8 MB." };
  const dataBase64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
  if (!dataBase64) return { error: "Foto gagal dibaca." };
  const { data, error } = await callQuizPublic(
    { action: "upload", token, filename: file.name, content_type: file.type, data_base64: dataBase64 },
    120000,
  );
  if (error) return { error };
  if (!data?.ok) return { error: data?.error || "Gagal mengunggah foto" };
  return { url: String(data.url) };
}
