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
  Loader2, CheckCircle2, Send, ClipboardList, PartyPopper,
  Languages, Camera, Keyboard, X, ImageIcon,
  ArrowLeft, ArrowRight, ListChecks, Play,
} from "lucide-react";
import {
  loadPublicQuiz, submitPublicQuiz, uploadHandwriting,
  type PublicQuiz, type PublicQuizQuestion, type EssayResponse,
} from "@/lib/quizPublic";

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
    return !!(e.image_url || String(e.text ?? "").trim());
  }
  return String(v).trim() !== "";
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
  const [result, setResult] = useState<{ total: number; max: number; results: any[]; analysis?: any } | null>(null);
  // Transliterasi menyala default: kuis ini memang dibuat dengan alih aksara justru
  // karena siswanya belum lancar membaca aksara aslinya. Yang sudah lancar bisa
  // mematikannya untuk melatih diri.
  const [showTranslit, setShowTranslit] = useState(true);
  /* [kuis-per-soal-v1] Langkah yang sedang dibuka: -1 = kartu nama, 0..N-1 = soal,
     N = halaman periksa. Satu angka, bukan beberapa boolean — "sedang di soal 3"
     dan "sedang memeriksa" tidak mungkin terjadi bersamaan. */
  const [step, setStep] = useState(-1);
  const advanceRef = useRef<number | null>(null);

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

  const questions = quiz?.questions ?? [];
  const total = questions.length;
  // Soal pertama bagian 2 — di situlah spanduk "Bagian 2" muncul, sekali saja.
  const firstOfPart2 = useMemo(() => questions.findIndex((q) => partOf(q) === 2), [questions]);

  const goto = useCallback((next: number) => {
    if (advanceRef.current) { window.clearTimeout(advanceRef.current); advanceRef.current = null; }
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => () => { if (advanceRef.current) window.clearTimeout(advanceRef.current); }, []);

  /* Pilihan ganda melompat sendiri ke soal berikutnya — HANYA saat soal itu
     dijawab untuk pertama kalinya. Kalau lompatan juga terjadi waktu siswa
     mengganti jawaban, memperbaiki satu huruf berarti terlempar dari soal yang
     sedang dipikirkan. Jedanya menahan sebentar supaya pilihan yang barusan
     ditekan sempat terlihat menyala. */
  function pickOption(i: number, oi: number) {
    const firstTime = !isAnswered(responses[i]);
    setResponses((s) => ({ ...s, [i]: oi }));
    if (!firstTime || i >= total - 1) return;
    if (advanceRef.current) window.clearTimeout(advanceRef.current);
    advanceRef.current = window.setTimeout(() => {
      advanceRef.current = null;
      setStep((s) => (s === i ? s + 1 : s));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 420);
  }

  function startQuiz() {
    if (!total) { window.alert("Kuis ini belum berisi soal. Hubungi pengajarmu ya."); return; }
    if (roster.length > 0 && !studentId) { window.alert("Pilih nama kamu dulu ya."); return; }
    if (roster.length === 0 && !name.trim()) { window.alert("Isi nama kamu dulu ya."); return; }
    goto(0);
  }

  async function handleSubmit() {
    if (!quiz) return;
    if (roster.length > 0 && !studentId) { window.alert("Pilih nama kamu dulu ya."); return; }
    if (roster.length === 0 && !name.trim()) { window.alert("Isi nama kamu dulu ya."); return; }
    if (answeredCount < quiz.questions.length) {
      if (!window.confirm(`Baru ${answeredCount}/${quiz.questions.length} soal terisi. Kirim sekarang?`)) return;
    }
    setSubmitting(true);
    const r = await submitPublicQuiz(token, name.trim(), responses, studentId || null);
    setSubmitting(false);
    if ("error" in r) { window.alert("Gagal mengirim: " + r.error); return; }
    setResult(r);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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

  if (result) {
    const pct = result.max ? Math.round((result.total / result.max) * 100) : 0;
    const color = pct >= 70 ? "#059669" : pct >= 50 ? "#d97706" : "#dc2626";
    return (
      <Shell title={quiz?.title}>
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <PartyPopper className="mx-auto h-10 w-10" style={{ color: BRAND }} />
            <h1 className="mt-3 text-xl font-bold text-slate-800">Terima kasih, {name}!</h1>
            <p className="mt-1 text-sm text-slate-500">Jawaban kamu sudah dikoreksi otomatis.</p>
            <div className="mt-4 text-4xl font-extrabold" style={{ color }}>{pct}%</div>
            <p className="text-sm font-medium text-slate-600">Skor {result.total} / {result.max}</p>
          </div>

          {/* [kuis-sesi-analisis-v1] Rapor langsung sesudah kirim. Halaman ini
              dibuka TANPA login (link publik), jadi ini satu-satunya momen siswa
              yang belum punya akun /akun membaca kurangnya apa. Warnanya ditulis
              eksplisit, ikut halaman ini yang memang selalu terang. */}
          <QuizTakeAnalysis analysis={result.analysis} />

          <div className="mt-4 space-y-3">
            {quiz?.questions.map((q, i) => {
              const r = result.results.find((x: any) => x.index === i);
              const ok = r?.is_correct;
              return (
                <div key={i} className="rounded-xl border p-4"
                  style={{ borderColor: ok ? "#a7f3d0" : "#fde68a", background: ok ? "#f0fdf4" : "#fffbeb" }}>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{i + 1}</span>
                    <span className="ml-auto text-xs font-semibold" style={{ color: ok ? "#059669" : "#d97706" }}>
                      {r?.score ?? 0}/{q.points} poin
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-800">{q.prompt}</p>
                  {/* Kalau jawabannya difoto, tunjukkan teks yang BENAR-BENAR dibaca.
                      Tanpa ini, nilai jelek karena salah baca tidak bisa dibedakan
                      dari nilai jelek karena jawabannya memang salah. */}
                  {r?.transcript && (
                    <p className="mt-2 rounded-lg border border-slate-200 bg-white/70 p-2 text-[12.5px] text-slate-600">
                      <span className="font-semibold text-slate-500">Terbaca dari fotomu: </span>
                      <span className="italic">{r.transcript}</span>
                    </p>
                  )}
                  {r?.feedback && <p className="mt-2 rounded-lg bg-white/70 p-2 text-[13px] text-slate-600">{r.feedback}</p>}
                </div>
              );
            })}
          </div>
        </div>
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
              {roster.length > 0 ? (
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
                    <span><b>Bagian 1 · {count1} soal</b> — pilih satu jawaban yang paling tepat.</span>
                  </li>
                )}
                {count2 > 0 && (
                  <li className="flex gap-2">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: BRAND }} />
                    <span>
                      <b>Bagian 2 · {count2} soal</b> — uraian.{" "}
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
            <div className="sticky top-0 z-10 -mx-4 mb-3 border-b border-slate-200 bg-slate-100/95 px-4 py-2.5 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-slate-700">
                  Soal {step + 1}<span className="font-medium text-slate-400"> / {total}</span>
                </span>
                {parts.multi && (
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ background: "#e7f6f5", color: "#0f766e" }}>
                    Bagian {partOf(cur)}
                  </span>
                )}
                <span className="ml-auto text-[11px] text-slate-500">{answeredCount} terisi</span>
                {hasTranslit && (
                  <button onClick={() => setShowTranslit((v) => !v)}
                    title={showTranslit ? "Sembunyikan cara baca" : "Tampilkan cara baca"}
                    className="grid h-7 w-7 place-items-center rounded-lg border"
                    style={{
                      borderColor: showTranslit ? BRAND : "#cbd5e1",
                      background: showTranslit ? BRAND : "#fff",
                      color: showTranslit ? "#fff" : "#64748b",
                    }}>
                    <Languages className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${((step + 1) / Math.max(total, 1)) * 100}%`, background: BRAND }} />
              </div>
            </div>

            {/* Spanduk bagian muncul sekali, tepat di soal pertama bagian itu —
                pergantian aturan main (dari memilih ke menulis) harus terbaca
                sebagai batas, bukan sebagai soal yang tiba-tiba beda bentuk. */}
            {parts.multi && (step === 0 || step === firstOfPart2) && (
              <div className="mb-3 rounded-xl px-4 py-3" style={{ background: "#e7f6f5", borderLeft: `4px solid ${BRAND}` }}>
                <p className="text-sm font-bold" style={{ color: "#0f766e" }}>
                  {partOf(cur) === 1 ? "Bagian 1 — Objektif" : "Bagian 2 — Uraian & Menulis"}
                </p>
                <p className="text-[11.5px] text-slate-500">
                  {partOf(cur) === 1
                    ? "Pilih satu jawaban yang paling tepat."
                    : quiz?.part2_allow_upload !== false
                      ? "Tulis jawabanmu langsung di sini, atau potret tulisan tanganmu lalu unggah."
                      : "Tulis jawabanmu dengan kalimat lengkap."}
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {cur.points} poin
                </span>
              </div>
              <p className="text-[15px] font-medium leading-relaxed text-slate-800">{cur.prompt}</p>
              {showTranslit && cur.prompt_translit && (
                <p className="mt-1 text-[13px] italic text-slate-500">{cur.prompt_translit}</p>
              )}

              <div className="mt-4">
                {isMC(cur) ? (
                  <div className="grid gap-2">
                    {cur.options.map((opt, oi) => {
                      const active = Number(responses[step]) === oi;
                      const tl = showTranslit ? cur.options_translit?.[oi] : "";
                      return (
                        <button key={oi} type="button" onClick={() => pickOption(step, oi)}
                          className="flex items-start gap-2.5 rounded-xl border px-3 py-3 text-left text-sm transition"
                          style={{ borderColor: active ? BRAND : "#e2e8f0", background: active ? "#f0fdfa" : "#fff" }}>
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold"
                            style={{
                              background: active ? BRAND : "#f1f5f9",
                              color: active ? "#fff" : "#64748b",
                            }}>
                            {String.fromCharCode(65 + oi)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-slate-700">{opt}</span>
                            {tl && <span className="block text-[12px] italic text-slate-400">{tl}</span>}
                          </span>
                          {active && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: BRAND }} />}
                        </button>
                      );
                    })}
                  </div>
                ) : partOf(cur) === 2 && quiz?.part2_allow_upload !== false ? (
                  /* `key` per soal: pilihan ketik/foto disimpan di dalam komponen,
                     dan tanpa remount soal berikutnya mewarisi tab soal sebelumnya
                     — tab "foto" terbuka padahal jawabannya masih kosong. */
                  <Part2Answer
                    key={step}
                    token={token}
                    value={(responses[step] as EssayResponse) ?? {}}
                    onChange={(v) => setResponses((s) => ({ ...s, [step]: v }))}
                  />
                ) : (
                  <textarea
                    value={typeof responses[step] === "object" ? (responses[step]?.text ?? "") : (responses[step] ?? "")}
                    onChange={(e) => setResponses((s) => ({ ...s, [step]: e.target.value }))}
                    placeholder="Tulis jawaban kamu…"
                    className="min-h-[96px] w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[color:var(--brand)]"
                    style={{ ["--brand" as any]: BRAND }} />
                )}
              </div>
            </div>

            <div className="sticky bottom-0 mt-4 -mx-4 border-t border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
              <div className="flex items-center gap-2">
                <button onClick={() => goto(step - 1)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600">
                  <ArrowLeft className="h-4 w-4" /> {step === 0 ? "Nama" : "Sebelumnya"}
                </button>
                <button onClick={() => goto(step + 1)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-bold text-white"
                  style={{ background: BRAND }}>
                  {step === total - 1
                    ? <><ListChecks className="h-4 w-4" /> Periksa Jawaban</>
                    : <>Lanjut <ArrowRight className="h-4 w-4" /></>}
                </button>
              </div>
            </div>
          </>
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
                  const filled = isAnswered(responses[i]);
                  return (
                    <button key={i} onClick={() => goto(i)}
                      className="grid h-9 place-items-center rounded-lg border text-[13px] font-bold transition"
                      style={{
                        borderColor: filled ? BRAND : "#fbbf24",
                        background: filled ? "#f0fdfa" : "#fffbeb",
                        color: filled ? "#0f766e" : "#b45309",
                      }}>
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded" style={{ background: "#ccfbf1", border: `1px solid ${BRAND}` }} /> terisi
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded" style={{ background: "#fef3c7", border: "1px solid #fbbf24" }} /> masih kosong
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => goto(total - 1)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-600">
                <ArrowLeft className="h-4 w-4" /> Soal terakhir
              </button>
              <button onClick={handleSubmit} disabled={submitting}
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

/** Saklar cara baca di kartu pembuka. Bentuk panjangnya sengaja beda dari tombol
 *  ikon di header soal: di sini siswa belum tahu fitur ini ada. */
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
  token, value, onChange,
}: {
  token: string;
  value: EssayResponse;
  onChange: (v: EssayResponse) => void;
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
        <textarea value={value.text ?? ""} onChange={(e) => onChange({ text: e.target.value })}
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

// [kuis-sesi-analisis-v1] Rapor "kurangnya apa & perbaikannya apa" di halaman
// publik. Isinya sama persis dengan yang tersimpan di quiz_submissions.analysis
// dan nanti muncul lagi di dashboard siswa — ini cuma penayangan pertamanya.
//
// Tidak memakai QuizAnalysisCard: komponen itu memakai token tema (foreground/
// muted) yang ikut gelap kalau staf membuka link ini dengan tema gelap, padahal
// halaman publik ini sengaja selalu terang.
function QuizTakeAnalysis({ analysis }: { analysis: any }) {
  if (!analysis || typeof analysis !== "object") return null;
  const list = (v: any): string[] =>
    Array.isArray(v) ? v.map((x) => String(x ?? "").trim()).filter(Boolean) : [];

  const summary = String(analysis.summary ?? "").trim();
  const blocks: { title: string; items: string[]; border: string; bg: string; fg: string }[] = [
    { title: "Sudah bagus", items: list(analysis.strengths), border: "#a7f3d0", bg: "#f0fdf4", fg: "#047857" },
    { title: "Masih kurang", items: list(analysis.weaknesses), border: "#fde68a", bg: "#fffbeb", fg: "#b45309" },
    { title: "Perbaikannya", items: list(analysis.improvements), border: "#99f6e4", bg: "#f0fdfa", fg: "#0f766e" },
  ].filter((b) => b.items.length > 0);
  const topics = list(analysis.topics);

  if (!summary && !blocks.length) return null;

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: BRAND }}>
        Catatan buat kamu
      </p>
      {summary && <p className="mb-3 text-sm leading-relaxed text-slate-600">{summary}</p>}
      <div className="space-y-2.5">
        {blocks.map((b) => (
          <div key={b.title} className="rounded-xl border p-3" style={{ borderColor: b.border, background: b.bg }}>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: b.fg }}>{b.title}</p>
            <ul className="space-y-1">
              {b.items.map((t, i) => (
                <li key={i} className="flex gap-2 text-[13px] leading-snug text-slate-700">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: b.fg }} />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {topics.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500">Ulang lagi:</span>
          {topics.map((t, i) => (
            <span key={i} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}
