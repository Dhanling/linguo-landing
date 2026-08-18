"use client";

/* [kuis-domain-linguo-v1] Halaman pengerjaan kuis pengajar — siswa, tanpa login.
   Route: linguo.id/kuis/isi/<token>. Ambil soal via edge fn quiz-public (tanpa
   kunci jawaban), siswa isi jawaban → submit → dikoreksi AI di server → skor.

   Pindahan dari dashboard admin (teach.linguo.id/kuis/isi/<token>). Link kuis
   dikirim ke grup WhatsApp kelas, dan alamat lama membawa siswa masuk ke aplikasi
   staf: bundel besar berisi seluruh dashboard beserta klien auth yang menunggu
   sesi login yang tidak akan pernah ada. Rute lama sengaja DIBIARKAN hidup di
   sana supaya link yang sudah terkirim ke grup tidak mati.

   Jangan tertukar dengan /kuis/<token> (satu segmen) — itu kuis harian spaced
   repetition, tabel & alur yang sama sekali berbeda.

   [kuis-translit-dua-bagian-v1] Halaman ini sekarang punya dua bagian:
     Bagian 1 (objektif) — seperti sebelumnya.
     Bagian 2 (uraian)   — siswa memilih: MENGETIK jawabannya, atau MEMOTRET tulisan
                           tangannya. Fotonya dibaca AI waktu koreksi.
   Ditambah tombol tampil/sembunyi transliterasi untuk kuis beraksara non-Latin.

   [kuis-durasi-pengerjaan-v1] Halaman ini juga yang memegang jamnya. Dua hal yang
   berbeda: BATAS waktu (opsional, dari pengajar — hitung mundur & kirim otomatis
   saat habis) dan LAMA pengerjaan (selalu direkam, ikut terkirim waktu submit).
   Yang kedua itu yang dibaca pengajar: dua siswa sama-sama 100% tapi 5 menit vs
   40 menit bukan dua siswa dengan penguasaan yang sama.

   [kuis-per-soal-v1] Soalnya ditampilkan SATU PER LAYAR, bukan sebagai satu gulungan
   panjang. Kuis ini dikerjakan dari HP di 15 menit awal kelas: daftar 20 soal
   sekaligus membuat siswa menggulir mencari nomor yang belum diisi, dan soal
   beraksara non-Latin (yang tiap soalnya dua baris — aksara + alih aksara) jadi
   dinding teks. Urutannya: kartu nama → soal 1..N → halaman periksa → kirim.
   Halaman periksa itu yang menggantikan "melihat semuanya sekaligus": di sana
   nomor yang masih kosong ditandai dan bisa diklik untuk kembali. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  Loader2, CheckCircle2, Send, ClipboardList,
  Languages, Camera, Keyboard, X, ImageIcon,
  ArrowLeft, ArrowRight, ListChecks, Play, HelpCircle, Volume2, Minimize2, Maximize2,
} from "lucide-react";
import {
  loadPublicQuiz, submitPublicQuiz, uploadHandwriting,
  type PublicQuiz, type PublicQuizQuestion, type EssayResponse,
  type GradeResult, type QuizAnalysis,
} from "@/lib/quizPublic";
import { toLangCode } from "@/lib/quiz/language";
import { bisaTts, teksUntukTts, ucapkan, hentikanTts } from "@/lib/quizTts";
import ImeTextarea from "@/components/kuis/ImeTextarea";
import HasilKuis from "@/components/kuis/HasilKuis";

const BRAND = "#1A9E9E";

function isMC(q: { type: string; options?: any[] }): boolean {
  return q.type === "multiple_choice" || (q.type === "hots" && Array.isArray(q.options) && q.options.length >= 2);
}

function partOf(q: PublicQuizQuestion): 1 | 2 {
  return q.part === 2 ? 2 : 1;
}

/** Sudah terisi? Jawaban bagian 2 bisa berupa objek {text} atau {image_url}, jadi
 *  "ada isinya" tidak bisa lagi dinilai dari String(v) — objek kosong pun jadi
 *  "[object Object]" dan akan terhitung terisi. */
function isAnswered(v: any): boolean {
  if (v === undefined || v === null) return false;
  if (typeof v === "object") {
    const e = v as EssayResponse;
    return !!(e.tidak_tahu || e.image_url || String(e.text ?? "").trim());
  }
  return String(v).trim() !== "";
}

/* [kuis-tidak-tahu-v1] "Tidak tahu" sebagai jawaban yang bisa dipilih, di kedua
   bagian. Tanpa tombol ini satu-satunya cara maju dari soal yang tidak dikuasai
   adalah menebak — dan tebakan yang kebetulan benar membuat pengajar melihat
   penguasaan yang tidak ada, sementara rapor AI-nya ikut salah menyimpulkan apa
   yang perlu diulang. Jujur "belum tahu" nilainya sama-sama 0, tapi datanya benar.

   Disimpan sebagai objek `{ tidak_tahu: true }` untuk KEDUA bagian supaya cuma
   ada satu bentuk yang perlu diperiksa; baru saat dikirim ia jadi teks biasa. */
const TIDAK_TAHU_TEKS = "TIDAK TAHU";

function isTidakTahu(v: any): boolean {
  return !!(v && typeof v === "object" && (v as EssayResponse).tidak_tahu);
}

/* [kuis-layar-penuh-v1] Kuis dikerjakan sambil kelas berjalan, sering di HP atau
   laptop pinjaman: bilah tab & bookmark di atas layar itu godaan sekaligus jalan
   pintas ke tab lain. Layar penuh menutupnya selama pengerjaan.

   Semua dibungkus try/catch dan `.catch()`: Safari di iPhone tidak punya
   Fullscreen API sama sekali, dan browser lain menolak permintaan yang tidak
   berasal dari klik. Penolakan TIDAK boleh menghentikan kuisnya. */
type FsElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type FsDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenElement?: Element | null;
};

function masukLayarPenuh() {
  if (typeof document === "undefined") return;
  const el = document.documentElement as FsElement;
  try {
    const hasil = el.requestFullscreen ? el.requestFullscreen() : el.webkitRequestFullscreen?.();
    if (hasil && typeof (hasil as Promise<void>).catch === "function") {
      (hasil as Promise<void>).catch(() => { /* ditolak browser — abaikan */ });
    }
  } catch { /* API tidak ada */ }
}

function keluarLayarPenuh() {
  if (typeof document === "undefined") return;
  const d = document as FsDocument;
  if (!d.fullscreenElement && !d.webkitFullscreenElement) return;
  try {
    const hasil = d.exitFullscreen ? d.exitFullscreen() : d.webkitExitFullscreen?.();
    if (hasil && typeof (hasil as Promise<void>).catch === "function") {
      (hasil as Promise<void>).catch(() => { /* abaikan */ });
    }
  } catch { /* API tidak ada */ }
}

export default function QuizTakePage() {
  // useParams Next mengembalikan string | string[]; token kita selalu satu segmen.
  const params = useParams<{ token: string | string[] }>();
  const token = String(Array.isArray(params?.token) ? params.token[0] : (params?.token ?? ""));
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<PublicQuiz | null>(null);
  const [loadErr, setLoadErr] = useState<{ msg: string; code?: string } | null>(null);

  const [name, setName] = useState("");
  // nilai-per-pertemuan-v1: kalau kuis terikat pertemuan, siswa memilih namanya dari
  // daftar peserta. Nama ketikan bebas tidak bisa dipetakan ke siswa mana pun, jadi
  // nilainya berhenti di /kuis dan tidak pernah muncul di dashboard siswa.
  const [studentId, setStudentId] = useState("");
  const [responses, setResponses] = useState<Record<number, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    total: number; max: number; results: GradeResult[];
    analysis?: QuizAnalysis | null; duration_sec?: number | null;
  } | null>(null);
  // Transliterasi menyala default: kuis ini memang dibuat dengan alih aksara justru
  // karena siswanya belum lancar membaca aksara aslinya. Yang sudah lancar bisa
  // mematikannya untuk melatih diri.
  const [showTranslit, setShowTranslit] = useState(true);
  /* [kuis-per-soal-v1] Langkah yang sedang dibuka: -1 = kartu nama, 0..N-1 = soal,
     N = halaman periksa. Satu angka, bukan beberapa boolean — "sedang di soal 3"
     dan "sedang memeriksa" tidak mungkin terjadi bersamaan. */
  const [step, setStep] = useState(-1);
  const advanceRef = useRef<number | null>(null);

  /* [kuis-durasi-pengerjaan-v1] Jam pengerjaan. `startedAt` = epoch ms saat tombol
     "Mulai Kerjakan" ditekan; `elapsed` cuma turunannya yang berdetak tiap detik.
     Waktu mulainya dititipkan ke localStorage supaya halaman yang ter-reload (HP
     kehabisan memori, tab ketutup) tidak memberi hadiah waktu baru. Ini pagar
     terhadap KECELAKAAN, bukan pengawas ujian: kuis awal kelas memang tidak
     diproktor, dan jam yang dipakai tetap jam HP siswa. */
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const autoSentRef = useRef(false);
  const startKey = `linguo-kuis-mulai-${token}`;

  useEffect(() => {
    (async () => {
      setLoading(true);
      const r = await loadPublicQuiz(token);
      if (r.quiz) setQuiz(r.quiz);
      else setLoadErr({ msg: r.error || "Kuis tidak ditemukan", code: r.code });
      setLoading(false);
    })();
  }, [token]);

  const answeredCount = useMemo(
    () => Object.values(responses).filter(isAnswered).length,
    [responses],
  );

  const roster = quiz?.roster ?? [];
  /* [kuis-siswa-terkunci-v1] Kuis yang memang cuma untuk satu siswa tidak lagi
     menanyakan siapa yang mengerjakan. Kelas private = satu nama; menyodorkan
     dropdown berisi satu pilihan (atau lebih buruk: berisi nama teman sekelas
     yang kuisnya bukan ini) hanya menambah satu langkah yang bisa salah — dan
     salah pilih nama berarti nilainya mendarat di pertemuan siswa lain. */
  useEffect(() => {
    if (roster.length !== 1 || studentId) return;
    setStudentId(roster[0].id);
    setName(roster[0].name);
  }, [roster, studentId]);
  // Tombol transliterasi hanya berguna kalau memang ADA alih aksaranya. Model
  // sesekali mengembalikan null untuk semua soal (mis. teksnya ternyata sudah
  // Latin) — tombol yang tidak mengubah apa pun lebih buruk daripada tidak ada.
  const hasTranslit = useMemo(
    () => (quiz?.questions ?? []).some((q) => q.prompt_translit || (q.options_translit ?? []).some(Boolean)),
    [quiz],
  );
  const parts = useMemo(() => {
    const set = new Set((quiz?.questions ?? []).map(partOf));
    return { multi: set.size > 1 };
  }, [quiz]);
  /* [kuis-tts-chirp-v1] Kode bahasa target untuk tombol dengar. `target_lang`
     turun sebagai NAMA ("Spanish"), jadi harus lewat toLangCode dulu; bahasa yang
     tak punya suara Chirp menghasilkan null → tombolnya tidak pernah dirender. */
  const ttsLang = useMemo(() => {
    const kode = toLangCode(quiz?.target_lang);
    return bisaTts(kode) ? kode : null;
  }, [quiz]);

  const questions = quiz?.questions ?? [];
  const total = questions.length;
  /* Batas waktu dalam detik; 0 = tanpa hitung mundur (durasinya tetap direkam).
     [kuis-tanpa-countdown-v1] Jamnya tetap BERJALAN — auto-kirim saat habis dan
     lama pengerjaan tetap terekam — tapi angkanya TIDAK lagi ditampilkan selama
     mengerjakan. Hitung mundur yang berdetak di sudut layar membuat siswa
     mengerjakan sambil melihat jam, bukan sambil membaca soal; batas waktunya
     sendiri sudah diberitahukan di kartu pembuka sebelum tombol Mulai ditekan. */
  const limitSec = Math.max(0, Math.round(Number(quiz?.time_limit_min) || 0) * 60);

  /* Sambung lagi jam yang sedang berjalan sesudah reload. Kalau catatannya sudah
     lewat batas (atau lewat 12 jam untuk kuis tanpa batas), catatan itu dibuang:
     siswa yang membuka link lama besok paginya harus dapat kuis yang utuh, bukan
     kuis yang waktunya sudah habis sebelum ia menekan apa pun. */
  useEffect(() => {
    if (!quiz || startedAt) return;
    const saved = Number(window.localStorage.getItem(startKey) || 0);
    if (!saved) return;
    const lewat = (Date.now() - saved) / 1000;
    const basi = limitSec ? lewat >= limitSec : lewat >= 12 * 3600;
    if (basi) { window.localStorage.removeItem(startKey); return; }
    setStartedAt(saved);
    setElapsed(Math.round(lewat));
  }, [quiz, startedAt, startKey, limitSec]);

  // Satu detak per detik, cuma selama kuisnya benar-benar sedang dikerjakan.
  useEffect(() => {
    if (!startedAt || result) return;
    const tick = () => setElapsed(Math.round((Date.now() - startedAt) / 1000));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [startedAt, result]);
  // [kuis-layar-penuh-v1] Layar penuh dilepas begitu hasil keluar atau halaman
  // ditinggalkan: halaman hasil punya tombol unduh & tautan keluar yang wajar
  // dibaca di browser normal, dan siswa tidak boleh terkunci di sana.
  useEffect(() => { if (result) keluarLayarPenuh(); }, [result]);
  useEffect(() => () => keluarLayarPenuh(), []);

  // Soal pertama bagian 2 — di situlah spanduk "Bagian 2" muncul, sekali saja.
  const firstOfPart2 = useMemo(() => questions.findIndex((q) => partOf(q) === 2), [questions]);

  const goto = useCallback((next: number) => {
    if (advanceRef.current) { window.clearTimeout(advanceRef.current); advanceRef.current = null; }
    // [kuis-tts-chirp-v1] Suara soal lama dibungkam saat pindah soal — kalimat
    // bahasa asing yang masih berbunyi di atas soal berikutnya bikin salah kira
    // itu bunyi soal yang sekarang.
    hentikanTts();
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => () => { if (advanceRef.current) window.clearTimeout(advanceRef.current); }, []);

  /* Pilihan ganda melompat sendiri ke soal berikutnya — HANYA saat soal itu
     dijawab untuk pertama kalinya. Kalau lompatan juga terjadi waktu siswa
     mengganti jawaban, memperbaiki satu huruf berarti terlempar dari soal yang
     sedang dipikirkan. Jedanya menahan sebentar supaya pilihan yang barusan
     ditekan sempat terlihat menyala. */
  function pickOption(i: number, nilai: any) {
    const firstTime = !isAnswered(responses[i]);
    setResponses((s) => ({ ...s, [i]: nilai }));
    if (!firstTime || i >= total - 1) return;
    if (advanceRef.current) window.clearTimeout(advanceRef.current);
    advanceRef.current = window.setTimeout(() => {
      advanceRef.current = null;
      setStep((s) => (s === i ? s + 1 : s));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 420);
  }

  /* "Tidak tahu" bisa DIBATALKAN dengan menekannya lagi — siswa sering memilihnya
     lebih dulu supaya bisa maju, lalu teringat jawabannya di soal berikutnya. */
  function toggleTidakTahu(i: number) {
    if (isTidakTahu(responses[i])) {
      setResponses((s) => { const n = { ...s }; delete n[i]; return n; });
      return;
    }
    pickOption(i, { tidak_tahu: true });
  }

  function startQuiz() {
    // [kuis-layar-penuh-v1] Layar penuh diminta DI SINI, di dalam penanganan klik:
    // browser cuma mengabulkan Fullscreen API kalau dipicu gerakan pengguna, jadi
    // memanggilnya dari useEffect setelah state berubah selalu ditolak. Kalau
    // ditolak (Safari iPhone tidak punya API-nya sama sekali), kuisnya tetap jalan
    // seperti biasa — ini penambah fokus, bukan syarat.
    masukLayarPenuh();
    if (!total) { window.alert("Kuis ini belum berisi soal. Hubungi pengajarmu ya."); return; }
    if (roster.length > 0 && !studentId) { window.alert("Pilih nama kamu dulu ya."); return; }
    if (roster.length === 0 && !name.trim()) { window.alert("Isi nama kamu dulu ya."); return; }
    // Jam mulai dicatat di sini, bukan saat halaman terbuka: siswa sering membuka
    // link duluan lalu menunggu aba-aba pengajar, dan waktu tunggu itu bukan waktu
    // mengerjakan. Kalau ada catatan lama yang masih hidup, itu yang dipakai.
    if (!startedAt) {
      const now = Date.now();
      setStartedAt(now);
      setElapsed(0);
      try { window.localStorage.setItem(startKey, String(now)); } catch { /* mode privat */ }
    }
    goto(0);
  }

  /** @param auto true = waktunya habis, bukan siswa yang menekan Kirim. */
  async function handleSubmit(auto = false) {
    if (!quiz || submitting) return;
    if (roster.length > 0 && !studentId) { window.alert("Pilih nama kamu dulu ya."); return; }
    if (roster.length === 0 && !name.trim()) { window.alert("Isi nama kamu dulu ya."); return; }
    // Waktu habis TIDAK bertanya apa-apa: dialog konfirmasi yang menunggu jawaban
    // justru menahan jawaban yang sudah diisi di layar siswa.
    if (!auto && answeredCount < quiz.questions.length) {
      if (!window.confirm(`Baru ${answeredCount}/${quiz.questions.length} soal terisi. Kirim sekarang?`)) return;
    }
    setSubmitting(true);
    const dipakai = startedAt ? Math.round((Date.now() - startedAt) / 1000) : null;
    // [kuis-tidak-tahu-v1] Penanda internal → teks biasa, tepat sebelum berangkat.
    const terkirim = Object.fromEntries(
      Object.entries(responses).map(([k, v]) => [k, isTidakTahu(v) ? TIDAK_TAHU_TEKS : v]),
    );
    const r = await submitPublicQuiz(token, name.trim(), terkirim, studentId || null, dipakai);
    setSubmitting(false);
    if ("error" in r) {
      window.alert("Gagal mengirim: " + r.error);
      /* Penjaga `autoSentRef` sengaja TIDAK dibuka lagi: waktunya sudah lewat, jadi
         syarat kirim-otomatis selalu terpenuhi — membukanya berarti mencoba ulang
         tiap detik, lengkap dengan alert-nya. Siswa dilempar ke halaman periksa
         supaya tombol "Kirim Jawaban" ada di depan matanya. */
      if (auto) goto(total);
      return;
    }
    try { window.localStorage.removeItem(startKey); } catch { /* mode privat */ }
    setResult({ ...r, duration_sec: r.duration_sec ?? dipakai ?? null });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* [kuis-durasi-pengerjaan-v1] Waktu habis → kirim apa adanya, sekali saja.
     Diletakkan sebagai efek terpisah dari detaknya supaya pengiriman tidak ikut
     terpanggil tiap detik kalau submit-nya gagal. */
  useEffect(() => {
    if (!limitSec || !startedAt || result || submitting || autoSentRef.current) return;
    if (elapsed < limitSec) return;
    autoSentRef.current = true;
    handleSubmit(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, limitSec, startedAt, result, submitting]);

  // ── States ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Shell>
        <div className="grid place-items-center py-24">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: BRAND }} />
        </div>
      </Shell>
    );
  }

  if (loadErr) {
    const closed = loadErr.code === "closed";
    return (
      <Shell>
        <div className="mx-auto max-w-md py-20 text-center">
          <h1 className="text-lg font-bold text-slate-800">{closed ? "Kuis sedang ditutup" : "Kuis tidak ditemukan"}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {closed ? "Link kuis ini sedang dinonaktifkan oleh pengajar." : "Pastikan kamu memakai link terbaru dari pengajar Linguo."}
          </p>
        </div>
      </Shell>
    );
  }

  /* [kuis-rapor-grafik-v1] Seluruh layar hasil pindah ke <HasilKuis>: skor,
     grafik penguasaan per materi, poin per soal, rapor AI, pembahasan tiap soal,
     dan tombol simpan PDF. Dulu blok ini menampilkan prompt + satu kalimat
     feedback per soal — tanpa kunci jawaban, tanpa pengelompokan materi, dan
     tanpa apa pun yang bisa dibawa pulang siswa yang belum punya akun. */
  if (result && quiz) {
    return (
      <Shell title={quiz.title}>
        <HasilKuis
          quiz={quiz}
          name={name}
          total={result.total}
          max={result.max}
          results={result.results}
          analysis={result.analysis ?? null}
          durationSec={result.duration_sec ?? null}
          showTranslit={showTranslit}
          responses={responses}
        />
      </Shell>
    );
  }

  // ── Form isi kuis — satu soal per layar ───────────────────────────────────
  const subtitle = quiz
    ? [quiz.source_lang, quiz.target_lang].filter(Boolean).join(" → ") + (quiz.difficulty ? ` · ${quiz.difficulty}` : "")
    : "";
  const cur = step >= 0 && step < total ? questions[step] : null;
  const count1 = questions.filter((q) => partOf(q) === 1).length;
  const count2 = total - count1;
  const missing = questions.map((_, i) => i).filter((i) => !isAnswered(responses[i]));

  // Judul kuis cuma dipasang di kartu pembuka & halaman periksa. Di layar soal,
  // ruang paling atas milik nomor soal — judul di sana hanya menggeser soalnya
  // turun tanpa memberi tahu apa pun yang baru.
  return (
    <Shell
      title={step === -1 || step === total ? quiz?.title : undefined}
      subtitle={step === -1 ? subtitle : undefined}
    >
      <div className="mx-auto max-w-2xl">
        {/* ── Kartu nama (sebelum mulai) ─────────────────────────────────── */}
        {step === -1 && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nama kamu</label>
              {roster.length === 1 ? (
                /* Satu peserta = tidak ada yang perlu dipilih. Namanya tetap
                   DITAMPILKAN, bukan disembunyikan: siswa harus bisa langsung tahu
                   kalau linknya ternyata punya orang lain. */
                <>
                  <div className="mt-1.5 flex items-center gap-2.5 rounded-xl px-3.5 py-3"
                    style={{ background: "#f0fdfa", border: `2px solid ${BRAND}` }}>
                    <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: BRAND }} />
                    <span className="text-lg font-extrabold text-slate-800">{roster[0].name}</span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    Kuis ini memang untukmu — nilainya masuk ke {quiz?.session_label || "pertemuan ini"} di dashboard kamu.
                  </p>
                </>
              ) : roster.length > 0 ? (
                <>
                  <select value={studentId}
                    onChange={(e) => {
                      setStudentId(e.target.value);
                      setName(roster.find((s) => s.id === e.target.value)?.name || "");
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[color:var(--brand)]"
                    style={{ ["--brand" as any]: BRAND }}>
                    <option value="">— pilih namamu —</option>
                    {roster.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    Pilih nama yang benar ya — nilaimu masuk ke {quiz?.session_label || "pertemuan ini"} di dashboard kamu.
                  </p>
                </>
              ) : (
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tulis nama lengkap"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[color:var(--brand)]"
                  style={{ ["--brand" as any]: BRAND }} />
              )}
            </div>

            {hasTranslit && <TranslitToggle on={showTranslit} onToggle={() => setShowTranslit((v) => !v)} />}

            {/* Apa yang akan dihadapi — siswa perlu tahu ada bagian menulis SEBELUM
                mulai, supaya kertas & pulpennya disiapkan dulu, bukan dicari
                waktu sudah sampai soal terakhir. */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-bold text-slate-800">{total} soal</p>
              <ul className="mt-2 space-y-1.5 text-[13px] text-slate-600">
                {count1 > 0 && (
                  <li className="flex gap-2">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: BRAND }} />
                    <span><b>Bagian 1 · {count1} soal</b> — pilihan ganda, pilih satu jawaban yang paling tepat.</span>
                  </li>
                )}
                {count2 > 0 && (
                  <li className="flex gap-2">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: BRAND }} />
                    <span>
                      <b>Bagian 2 · {count2} soal</b> — jawabannya ditulis sendiri.{" "}
                      {quiz?.part2_allow_upload !== false
                        ? "Boleh diketik langsung, atau ditulis tangan di kertas lalu difoto & diunggah."
                        : "Ditulis dengan kalimat lengkap."}
                    </span>
                  </li>
                )}
                <li className="flex gap-2">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: BRAND }} />
                  <span>Soalnya muncul satu per satu. Bisa mundur & mengubah jawaban sebelum dikirim.</span>
                </li>
                {/* [kuis-tidak-tahu-v1] Diberitahukan di depan, bukan ditemukan
                    sendiri di soal ke-7: siswa yang tidak tahu tombol ini ada akan
                    menebak dari soal pertama. */}
                <li className="flex gap-2">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: BRAND }} />
                  <span>
                    Belum tahu jawabannya? Tekan <b>Tidak tahu</b> — lebih baik daripada menebak,
                    supaya pengajar tahu persis bagian mana yang perlu diulang.
                  </span>
                </li>
                {/* Batas waktu harus terbaca SEBELUM tombol Mulai — begitu ditekan,
                    hitung mundurnya jalan dan tidak bisa dijeda. */}
                <li className="flex gap-2">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: BRAND }} />
                  <span>
                    {limitSec > 0
                      ? <><b>Waktu {Math.round(limitSec / 60)} menit</b> — mulai berjalan begitu kamu tekan
                        tombol di bawah, dan jawabanmu terkirim otomatis saat waktunya habis.</>
                      : <>Tanpa batas waktu, tapi lama pengerjaanmu tercatat untuk pengajar.</>}
                  </span>
                </li>
              </ul>
            </div>

            <button onClick={startQuiz}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white"
              style={{ background: BRAND }}>
              <Play className="h-4 w-4" /> Mulai Kerjakan
            </button>
          </div>
        )}

        {/* ── Satu soal ──────────────────────────────────────────────────── */}
        {cur && (
          <>
            <KuisNavBar
              total={total}
              step={step}
              answeredCount={answeredCount}
              isFilled={(i) => isAnswered(responses[i])}
              isTidakTahu={(i) => isTidakTahu(responses[i])}
              partOfIndex={(i) => partOf(questions[i])}
              multiPart={parts.multi}
              onJump={goto}
              hasTranslit={hasTranslit}
              showTranslit={showTranslit}
              onToggleTranslit={() => setShowTranslit((v) => !v)}
            />

            {/* Spanduk bagian muncul sekali, tepat di soal pertama bagian itu —
                pergantian aturan main (dari memilih ke menulis) harus terbaca
                sebagai batas, bukan sebagai soal yang tiba-tiba beda bentuk. */}
            {parts.multi && (step === 0 || step === firstOfPart2) && (
              <div className="mb-4 rounded-2xl px-5 py-4" style={{ background: "#e7f6f5", borderLeft: `6px solid ${BRAND}` }}>
                <p className="text-lg font-extrabold" style={{ color: "#0f766e" }}>
                  {partOf(cur) === 1 ? "Bagian 1 — Pilihan Ganda" : "Bagian 2 — Menulis Jawaban"}
                </p>
                <p className="mt-0.5 text-sm font-medium text-slate-600">
                  {partOf(cur) === 1
                    ? "Pilih satu jawaban yang paling tepat."
                    : quiz?.part2_allow_upload !== false
                      ? "Tulis jawabanmu langsung di sini, atau potret tulisan tanganmu lalu unggah."
                      : "Tulis jawabanmu dengan kalimat lengkap."}
                </p>
              </div>
            )}

            {/* [kuis-tampilan-besar-v1] Kartu soal ala Quizizz: satu soal memenuhi
                layar, huruf besar & tebal. Kuis ini dikerjakan dari HP sambil kelas
                berjalan — teks 15px yang muat rapi di monitor pengajar justru yang
                paling sering bikin siswa salah baca soalnya sendiri. */}
            <div className="rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-lg sm:p-7">
              <div className="mb-3 flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl text-base font-extrabold text-white"
                  style={{ background: BRAND }}>
                  {step + 1}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                  {cur.points} poin
                </span>
              </div>
              <div className="flex items-start gap-2">
                <p className="min-w-0 flex-1 text-xl font-extrabold leading-snug text-slate-900 sm:text-2xl">{cur.prompt}</p>
                <TombolDengar teks={cur.prompt} lang={ttsLang} besar />
              </div>
              {showTranslit && cur.prompt_translit && (
                <p className="mt-1.5 text-base font-medium italic text-slate-500">{cur.prompt_translit}</p>
              )}

              <div className="mt-5">
                {isMC(cur) ? (
                  <div className="grid gap-3">
                    {cur.options.map((opt, oi) => {
                      const active = Number(responses[step]) === oi;
                      const tl = showTranslit ? cur.options_translit?.[oi] : "";
                      return (
                        /* [kuis-hover-animasi-v1] Kartu terangkat sedikit saat disentuh
                           kursor dan mengecil saat ditekan. Di kuis ini pilihan jawaban
                           adalah satu-satunya hal yang benar-benar diklik siswa, dan
                           kartu putih besar tanpa reaksi apa pun sering dikira teks
                           biasa — terutama di laptop, di mana tidak ada umpan balik
                           sentuhan sama sekali. Semua di balik `motion-safe:`: siswa
                           yang mematikan animasi di sistemnya tidak ikut kena. */
                        <button key={oi} type="button" onClick={() => pickOption(step, oi)}
                          className="flex items-center gap-3.5 rounded-2xl border-2 px-4 py-4 text-left transition-all duration-200 ease-out active:scale-[0.98] motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.015] motion-safe:hover:shadow-lg sm:px-5"
                          style={{
                            borderColor: active ? BRAND : "#e2e8f0",
                            background: active ? "#f0fdfa" : "#fff",
                            // Non-aktif sengaja `undefined`, bukan "none": bayangan hover
                            // datang dari kelas Tailwind, dan style inline mengalahkannya.
                            boxShadow: active ? `0 0 0 3px ${BRAND}22` : undefined,
                          }}>
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-base font-extrabold"
                            style={{
                              background: active ? BRAND : "#f1f5f9",
                              color: active ? "#fff" : "#64748b",
                            }}>
                            {String.fromCharCode(65 + oi)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-lg font-bold leading-snug text-slate-800">{opt}</span>
                            {tl && <span className="block text-sm font-medium italic text-slate-400">{tl}</span>}
                          </span>
                          <TombolDengar teks={opt} lang={ttsLang} />
                          {active && <CheckCircle2 className="h-6 w-6 shrink-0" style={{ color: BRAND }} />}
                        </button>
                      );
                    })}
                  </div>
                ) : isTidakTahu(responses[step]) ? (
                  /* Kotak jawaban disembunyikan selama "tidak tahu" aktif: dua isian
                     yang sama-sama hidup (teks DAN pernyataan tidak tahu) hanya bikin
                     bingung soal mana yang sebetulnya dikirim. */
                  <p className="rounded-2xl border-2 border-dashed border-slate-300 px-4 py-6 text-center text-base font-semibold text-slate-500">
                    Kamu menjawab <b className="text-slate-700">tidak tahu</b> untuk soal ini.
                  </p>
                ) : partOf(cur) === 2 && quiz?.part2_allow_upload !== false ? (
                  /* `key` per soal: pilihan ketik/foto disimpan di dalam komponen,
                     dan tanpa remount soal berikutnya mewarisi tab soal sebelumnya
                     — tab "foto" terbuka padahal jawabannya masih kosong. */
                  <Part2Answer
                    key={step}
                    token={token}
                    bahasa={quiz?.target_lang}
                    value={(responses[step] as EssayResponse) ?? {}}
                    onChange={(v) => setResponses((s) => ({ ...s, [step]: v }))}
                  />
                ) : (
                  /* Jalur tanpa unggah foto. Bentuk jawabannya string polos di
                     sini — begitu konversi aksara dipakai, ia naik jadi objek
                     supaya penandanya ikut tersimpan; grade-quiz sudah bisa
                     membaca dua-duanya. */
                  <ImeTextarea
                    value={typeof responses[step] === "object" ? (responses[step]?.text ?? "") : (responses[step] ?? "")}
                    bahasa={quiz?.target_lang}
                    onChange={(teks, dibantu) =>
                      setResponses((s) => ({ ...s, [step]: dibantu ? { text: teks, ime: true } : teks }))}
                    placeholder="Tulis jawaban kamu…"
                    className="min-h-[140px] w-full resize-y rounded-2xl border-2 border-slate-300 px-4 py-3 text-lg font-semibold text-slate-800 outline-none focus:border-[color:var(--brand)]"
                    style={{ ["--brand" as any]: BRAND }} />
                )}

                {/* [kuis-tidak-tahu-v1] Sengaja dipisah garis dari pilihan/kotak
                    jawaban di atasnya: ini bukan "opsi E", tapi jalan keluar yang
                    jujur. Gayanya pun beda — abu/amber, bukan teal seperti jawaban. */}
                <button type="button" onClick={() => toggleTidakTahu(step)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-3.5 text-base font-bold transition"
                  style={
                    isTidakTahu(responses[step])
                      ? { borderColor: "#f59e0b", background: "#fffbeb", color: "#b45309", borderStyle: "solid" }
                      : { borderColor: "#cbd5e1", background: "#fff", color: "#64748b" }
                  }>
                  <HelpCircle className="h-5 w-5" />
                  {isTidakTahu(responses[step]) ? "Tidak tahu — ketuk lagi buat menjawab" : "Tidak tahu"}
                </button>
              </div>
            </div>

            {/* [kuis-tanpa-lanjut-part1-v1] Di Bagian 1 tombol "Lanjut" dihapus:
                memilih jawaban SUDAH melompat sendiri ke soal berikutnya, jadi
                tombolnya cuma jalan kedua untuk hal yang sama — dan yang terjadi
                di lapangan, siswa menekannya duluan lalu melewati soal tanpa
                menjawab. Yang tetap ada:
                - soal TERAKHIR keseluruhan, apa pun bagiannya → "Periksa
                  Jawaban", satu-satunya jalan ke halaman kirim;
                - seluruh Bagian 2, yang jawabannya diketik dan tidak punya
                  pemicu lompat otomatis.
                Untuk pindah soal setelah mengganti jawaban (lompatan otomatis
                sengaja tidak diulang), nomor soal di bilah atas tetap bisa
                diketuk. */}
            {(() => {
              const soalTerakhir = step === total - 1;
              const sembunyikanLanjut = partOf(cur) === 1 && !soalTerakhir;
              return (
                <div className="sticky bottom-0 mt-4 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
                  <div className="flex items-center gap-2.5">
                    <button onClick={() => goto(step - 1)}
                      className={`flex items-center gap-1.5 rounded-xl border-2 border-slate-300 px-4 py-3.5 text-base font-bold text-slate-600 sm:px-5 ${
                        sembunyikanLanjut ? "flex-1 justify-center" : ""
                      }`}>
                      <ArrowLeft className="h-5 w-5" /> {step === 0 ? "Nama" : "Sebelumnya"}
                    </button>
                    {!sembunyikanLanjut && (
                      <button onClick={() => goto(step + 1)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-base font-extrabold text-white"
                        style={{ background: BRAND }}>
                        {soalTerakhir
                          ? <><ListChecks className="h-5 w-5" /> Periksa Jawaban</>
                          : <>Lanjut <ArrowRight className="h-5 w-5" /></>}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </>
        )}

        {/* Waktu habis bisa mengirim dari layar soal mana pun — tanpa tirai ini
            layarnya diam saja padahal jawaban sedang dikoreksi, dan siswa menekan
            tombol lain sambil mengira aplikasinya menggantung. */}
        {submitting && step < total && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 px-6 backdrop-blur-sm">
            <div className="w-full max-w-xs rounded-2xl bg-white p-5 text-center shadow-xl">
              <Loader2 className="mx-auto h-7 w-7 animate-spin" style={{ color: BRAND }} />
              <p className="mt-2 text-sm font-bold text-slate-800">Waktu habis</p>
              <p className="mt-0.5 text-[12.5px] text-slate-500">
                Jawabanmu sedang dikirim & dikoreksi. Jangan tutup halaman ini ya.
              </p>
            </div>
          </div>
        )}

        {/* ── Halaman periksa ────────────────────────────────────────────── */}
        {step === total && total > 0 && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-base font-bold text-slate-800">Periksa dulu sebelum dikirim</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">
                {answeredCount} dari {total} soal sudah terisi
                {missing.length > 0 && <span className="font-semibold text-amber-600"> · {missing.length} masih kosong</span>}.
                {" "}Klik nomornya untuk kembali ke soal itu.
              </p>
              <div className="mt-3 grid grid-cols-6 gap-2 sm:grid-cols-10">
                {questions.map((_, i) => {
                  const ragu = isTidakTahu(responses[i]);
                  const filled = isAnswered(responses[i]);
                  const gaya = ragu
                    ? { borderColor: "#fbbf24", background: "#fffbeb", color: "#b45309" }
                    : filled
                      ? { borderColor: BRAND, background: "#f0fdfa", color: "#0f766e" }
                      : { borderColor: "#fca5a5", background: "#fef2f2", color: "#b91c1c" };
                  return (
                    <button key={i} onClick={() => goto(i)}
                      className="grid h-11 place-items-center rounded-xl border-2 text-base font-extrabold transition"
                      style={gaya}>
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded" style={{ background: "#ccfbf1", border: `1px solid ${BRAND}` }} /> terisi
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded" style={{ background: "#fef3c7", border: "1px solid #fbbf24" }} /> tidak tahu
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded" style={{ background: "#fef2f2", border: "1px solid #fca5a5" }} /> masih kosong
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => goto(total - 1)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-600">
                <ArrowLeft className="h-4 w-4" /> Soal terakhir
              </button>
              <button onClick={() => handleSubmit()} disabled={submitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
                style={{ background: BRAND }}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {submitting ? "Mengoreksi…" : "Kirim Jawaban"}
              </button>
            </div>
            <p className="pb-4 text-center text-[11px] text-slate-400">
              Sekali dikirim, jawaban langsung dikoreksi dan tidak bisa diubah lagi.
            </p>
          </div>
        )}
      </div>
    </Shell>
  );
}

/* [kuis-navbar-soal-v1] Bilah nomor soal, sama pola dengan runner simulasi TOEFL
   (`/akun/simulasi/[id]`): blok nomor disusun HORIZONTAL dan bisa digeser, jadi
   kolom soalnya tetap dapat lebar penuh di HP.

   Sebelumnya nomor-nomor ini cuma ada di halaman periksa — artinya siswa yang mau
   balik ke soal 3 dari soal 17 harus menekan "Sebelumnya" 14 kali atau menjelajah
   sampai ujung dulu. Statusnya dibedakan bertiga (sedang dibuka / terisi / kosong)
   supaya "mana yang belum" terbaca tanpa membuka halaman lain. */
function KuisNavBar({
  total, step, answeredCount, isFilled, isTidakTahu: unknownAt, partOfIndex, multiPart,
  onJump, hasTranslit, showTranslit, onToggleTranslit,
}: {
  total: number;
  step: number;
  answeredCount: number;
  isFilled: (i: number) => boolean;
  isTidakTahu: (i: number) => boolean;
  partOfIndex: (i: number) => 1 | 2;
  multiPart: boolean;
  onJump: (i: number) => void;
  hasTranslit: boolean;
  showTranslit: boolean;
  onToggleTranslit: () => void;
}) {
  const stripRef = useRef<HTMLDivElement>(null);

  // Geser strip ke nomor yang sedang dikerjakan tiap ganti soal. `block:"nearest"`
  // supaya halaman soalnya sendiri tidak ikut melompat.
  useEffect(() => {
    const el = stripRef.current?.querySelector<HTMLElement>(`[data-soal="${step}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [step]);

  return (
    <div className="sticky top-0 z-20 -mx-4 mb-4 border-b border-slate-200 bg-slate-100/95 px-4 pb-2 pt-2.5 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
      <div className="mb-2 flex items-center gap-2">
        <span className="shrink-0 text-sm font-extrabold text-slate-700">
          Soal {step + 1}<span className="font-semibold text-slate-400"> / {total}</span>
        </span>
        {/* Legenda ala CBT — cuma di layar lebar; di HP ruangnya dipakai nomor. */}
        <div className="ml-auto hidden items-center gap-x-3 text-[11px] font-semibold text-slate-500 md:flex">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#0f766e" }} />Soal ini
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: BRAND }} />Terisi
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#f59e0b" }} />Tidak tahu
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full border border-slate-300 bg-white" />Kosong
          </span>
        </div>
        <span className="ml-auto shrink-0 text-xs font-bold tabular-nums text-slate-600 md:ml-0">
          <span style={{ color: BRAND }}>{answeredCount}</span>/{total} terisi
        </span>
        {hasTranslit && (
          <button onClick={onToggleTranslit}
            title={showTranslit ? "Sembunyikan cara baca" : "Tampilkan cara baca"}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border-2"
            style={{
              borderColor: showTranslit ? BRAND : "#cbd5e1",
              background: showTranslit ? BRAND : "#fff",
              color: showTranslit ? "#fff" : "#64748b",
            }}>
            <Languages className="h-4 w-4" />
          </button>
        )}
        <TombolLayarPenuh />
        {/* [kuis-tanpa-lanjut-part1-v1] Tombol "Periksa" dicabut dari bilah ini.
            Dari soal ke-2 ia melompat ke halaman kirim, dan tempatnya persis di
            atas deretan nomor — terlalu gampang tertekan waktu siswa sebenarnya
            mau pindah soal. Jalan ke halaman kirim tinggal satu dan jelas:
            tombol "Periksa Jawaban" di soal terakhir. */}
      </div>

      <div ref={stripRef} className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {Array.from({ length: total }, (_, i) => {
          const filled = isFilled(i);
          const ragu = unknownAt(i);
          const current = i === step;
          // Sekat tipis di pergantian bagian — batas "memilih" vs "menulis" harus
          // terbaca juga dari deretan nomornya, bukan cuma dari spanduk di soal.
          const sekat = multiPart && i > 0 && partOfIndex(i) !== partOfIndex(i - 1);
          return (
            <span key={i} className="flex shrink-0 items-center gap-1.5">
              {sekat && <span className="mx-1 h-7 w-px shrink-0 bg-slate-300" />}
              {/* [kuis-hover-animasi-v1] Nomor membesar saat disentuh kursor —
                  petak 36px yang berjejer rapat perlu menunjukkan mana yang
                  sedang dibidik sebelum diklik, kalau tidak siswa mendarat di
                  soal sebelahnya. */}
              <button type="button" data-soal={i} onClick={() => onJump(i)}
                title={`Soal ${i + 1} · ${ragu ? "dijawab tidak tahu" : filled ? "terisi" : "kosong"}`}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border-2 text-sm font-extrabold tabular-nums transition-all duration-150 ease-out active:scale-95 motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-110 motion-safe:hover:shadow-md"
                style={
                  current
                    ? { background: "#0f766e", borderColor: "#0f766e", color: "#fff" }
                    : ragu
                      ? { background: "#fffbeb", borderColor: "#f59e0b", color: "#b45309" }
                      : filled
                        ? { background: BRAND, borderColor: BRAND, color: "#fff" }
                        : { background: "#fff", borderColor: "#cbd5e1", color: "#64748b" }
                }>
                {i + 1}
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
}

/** Saklar cara baca di kartu pembuka. Bentuk panjangnya sengaja beda dari tombol
 *  ikon di header soal: di sini siswa belum tahu fitur ini ada. */
/* [kuis-tts-chirp-v1] Tombol dengar. Ditaruh di dalam kartu soal DAN di tiap
   pilihan karena yang ingin didengar siswa justru bunyi opsi yang sedang ia timbang.
   Elemennya <span role="button">, bukan <button>: baris pilihan itu sendiri sudah
   sebuah <button>, dan tombol bersarang di dalam tombol tidak sah — di Safari ia
   membuat seluruh baris berhenti bisa diklik. Klik ditahan (stopPropagation)
   supaya menekan ikon suara tidak sekaligus memilih jawaban itu.

   Tidak dirender sama sekali kalau bahasanya tak punya suara Chirp atau kalau
   teksnya ternyata kalimat pengantar berbahasa Indonesia (lihat teksUntukTts) —
   ikon suara yang membacakan soal dengan logat asing lebih membingungkan
   daripada tidak ada tombolnya. */
function TombolDengar({ teks, lang, besar }: { teks?: string | null; lang: string | null; besar?: boolean }) {
  const [sibuk, setSibuk] = useState(false);
  const bisa = !!lang && !!teksUntukTts(teks);
  if (!bisa) return null;
  const ukuran = besar ? "h-10 w-10" : "h-9 w-9";
  return (
    <span
      role="button"
      tabIndex={0}
      aria-label="Dengarkan pelafalan"
      title="Dengarkan pelafalan"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        setSibuk(true);
        ucapkan(teks, lang).finally(() => setSibuk(false));
      }}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.stopPropagation();
        e.preventDefault();
        setSibuk(true);
        ucapkan(teks, lang).finally(() => setSibuk(false));
      }}
      className={`grid ${ukuran} shrink-0 cursor-pointer place-items-center rounded-xl border-2 transition-all duration-150 active:scale-90 motion-safe:hover:scale-110`}
      style={{ borderColor: "#cbd5e1", background: "#f8fafc", color: BRAND }}
    >
      {sibuk ? <Loader2 className="h-5 w-5 animate-spin" /> : <Volume2 className="h-5 w-5" />}
    </span>
  );
}

/* [kuis-layar-penuh-keluar-v1] Jalan keluar dari layar penuh yang kelihatan.
   Sebelumnya satu-satunya cara keluar adalah menekan Esc — di HP tidak ada
   tombolnya sama sekali, dan siswa yang perlu membuka kamus atau sekadar melihat
   jam merasa terkunci di dalam kuis. Layar penuh di sini penahan gangguan, bukan
   pengawas ujian: tidak ada nilai yang berubah karena siswa keluar.

   Tombolnya sekaligus jalan MASUK kembali — sekali keluar (atau kalau permintaan
   layar penuh di awal ditolak browser), tanpa ini tidak ada cara balik lagi.
   Statusnya dibaca dari event `fullscreenchange`, bukan dari klik terakhir:
   keluar lewat Esc harus ikut mengubah ikonnya. */
function TombolLayarPenuh() {
  const [penuh, setPenuh] = useState(false);
  const [didukung, setDidukung] = useState(false);

  useEffect(() => {
    const d = document as FsDocument;
    const el = document.documentElement as FsElement;
    // Safari iPhone tidak punya Fullscreen API — tombol yang tak melakukan apa pun
    // lebih buruk daripada tidak ada tombolnya.
    setDidukung(!!(el.requestFullscreen || el.webkitRequestFullscreen));
    const sync = () => setPenuh(!!(d.fullscreenElement || d.webkitFullscreenElement));
    sync();
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  if (!didukung) return null;
  const Ikon = penuh ? Minimize2 : Maximize2;
  return (
    <button type="button" onClick={() => (penuh ? keluarLayarPenuh() : masukLayarPenuh())}
      title={penuh ? "Keluar dari layar penuh" : "Layar penuh"}
      aria-label={penuh ? "Keluar dari layar penuh" : "Layar penuh"}
      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border-2 border-slate-300 bg-white text-slate-500">
      <Ikon className="h-4 w-4" />
    </button>
  );
}

function TranslitToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      className="flex w-full items-center gap-2 rounded-xl border bg-white px-3 py-2.5 text-left text-sm shadow-sm"
      style={{ borderColor: on ? BRAND : "#e2e8f0" }}>
      <Languages className="h-4 w-4 shrink-0" style={{ color: BRAND }} />
      <span className="flex-1 font-medium text-slate-700">Cara baca (transliterasi)</span>
      <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
        style={{ background: on ? BRAND : "#e2e8f0", color: on ? "#fff" : "#64748b" }}>
        {on ? "TAMPIL" : "SEMBUNYI"}
      </span>
    </button>
  );
}

// [kuis-translit-dua-bagian-v1] Jawaban bagian 2: diketik, atau difoto.
//
// Dua mode dibuat SALING MENGGANTIKAN, bukan bisa dipakai bersama. Kalau siswa
// boleh mengisi keduanya, pengoreksi harus menebak mana yang dimaksud — dan foto
// yang terlanjur terunggah tapi diabaikan terasa seperti pekerjaan yang hilang.
// Berpindah mode karena itu ikut menghapus isi mode sebelumnya, terang-terangan.
function Part2Answer({
  token, value, onChange, bahasa,
}: {
  token: string;
  value: EssayResponse;
  onChange: (v: EssayResponse) => void;
  bahasa?: string | null;
}) {
  const [mode, setMode] = useState<"type" | "photo">(value.image_url ? "photo" : "type");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function switchMode(next: "type" | "photo") {
    if (next === mode) return;
    setMode(next);
    onChange(next === "type" ? { text: "" } : {});
  }

  async function handleFile(file?: File | null) {
    if (!file) return;
    setUploading(true);
    const r = await uploadHandwriting(token, file);
    setUploading(false);
    // Galat unggah harus terlihat: tanpa ini tombolnya cuma berhenti berputar dan
    // siswa mengira fotonya sudah masuk.
    if (r.error) window.alert("Gagal mengunggah: " + r.error);
    else if (r.url) onChange({ image_url: r.url });
    if (fileRef.current) fileRef.current.value = "";
  }

  const tabCls = "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold transition";

  return (
    <div>
      <div className="mb-2 flex gap-1 rounded-xl bg-slate-100 p-1">
        <button type="button" onClick={() => switchMode("type")} className={tabCls}
          style={{ background: mode === "type" ? "#fff" : "transparent", color: mode === "type" ? BRAND : "#64748b" }}>
          <Keyboard className="h-4 w-4" /> Ketik jawaban
        </button>
        <button type="button" onClick={() => switchMode("photo")} className={tabCls}
          style={{ background: mode === "photo" ? "#fff" : "transparent", color: mode === "photo" ? BRAND : "#64748b" }}>
          <Camera className="h-4 w-4" /> Foto tulisan tangan
        </button>
      </div>

      {mode === "type" ? (
        <ImeTextarea value={value.text ?? ""} bahasa={bahasa}
          onChange={(teks, dibantu) => onChange(dibantu ? { text: teks, ime: true } : { text: teks })}
          placeholder="Tulis jawaban kamu…"
          className="min-h-[96px] w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[color:var(--brand)]"
          style={{ ["--brand" as any]: BRAND }} />
      ) : value.image_url ? (
        <div className="rounded-lg border border-slate-200 p-2">
          <img src={value.image_url} alt="Jawaban tulisan tangan"
            className="max-h-72 w-full rounded object-contain" />
          <button type="button" onClick={() => { onChange({}); fileRef.current?.click(); }}
            className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: BRAND }}>
            <X className="h-3.5 w-3.5" /> Ganti foto
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          className="flex w-full flex-col items-center gap-1.5 rounded-lg border-2 border-dashed border-slate-300 px-3 py-7 text-center disabled:opacity-60">
          {uploading ? <Loader2 className="h-6 w-6 animate-spin" style={{ color: BRAND }} />
                     : <ImageIcon className="h-6 w-6 text-slate-400" />}
          <span className="text-[13px] font-semibold text-slate-600">
            {uploading ? "Mengunggah…" : "Potret / pilih foto jawabanmu"}
          </span>
          <span className="text-[11px] text-slate-400">JPG, PNG, atau WEBP · maks 8 MB</span>
        </button>
      )}

      {/* `capture` membuka kamera belakang langsung di HP; di desktop atribut ini
          diabaikan dan pemilih berkas biasa yang muncul. */}
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])} />

      {mode === "photo" && (
        <p className="mt-1.5 text-[11px] text-slate-400">
          Pastikan tulisannya terbaca jelas & tidak terpotong — jawabanmu dibaca dari foto ini.
        </p>
      )}
    </div>
  );
}

function Shell({ title, subtitle, children }: { title?: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div className="px-4 py-3 text-white" style={{ background: BRAND }}>
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          <span className="font-bold">Linguo · Kuis</span>
        </div>
      </div>
      {(title || subtitle) && (
        <div className="mx-auto max-w-2xl px-4 pt-5">
          {title && <h1 className="text-lg font-bold text-slate-800">{title}</h1>}
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      )}
      <div className="px-4 pb-16 pt-4">{children}</div>
    </div>
  );
}
