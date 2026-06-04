"use client";

// [linguo-patch:pretest-vietnam-v1] Halaman publik pre-test cohort Alfamart × Vietnam Class
// Taruh di: src/app/pretest/vietnam/page.tsx — auto-route ke linguo.id/pretest/vietnam
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  ArrowLeft, ArrowRight, Check, HelpCircle, BookOpen, MessageSquare,
  Mic, Sparkles, PartyPopper, CircleCheck, User, Briefcase, Loader2, ChevronDown,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TEAL = "#16796E";
const YELLOW = "#F2CB05";
const COHORT = "Alfamart × Vietnam Class · Basic";

const KEY_A: Record<number, string> = { 1: "B", 2: "C", 3: "C", 4: "B", 5: "C" };
const A: { id: number; q: string; opts: string[] }[] = [
  { id: 1, q: "“Xin chào” artinya…", opts: ["Selamat tinggal", "Halo / Selamat datang", "Terima kasih", "Maaf"] },
  { id: 2, q: "“Cảm ơn” artinya…", opts: ["Permisi", "Tolong", "Terima kasih", "Iya"] },
  { id: 3, q: "“Bao nhiêu tiền?” artinya…", opts: ["Di mana?", "Apa ini?", "Berapa harganya?", "Kapan buka?"] },
  { id: 4, q: "“Cửa hàng” artinya…", opts: ["Gudang", "Toko / Minimarket", "Kantor", "Restoran"] },
  { id: 5, q: "“Nhân viên” artinya…", opts: ["Pelanggan", "Manajer", "Karyawan / Staf", "Supplier"] },
];
const B: { id: number; q: string }[] = [
  { id: 6, q: "“Tôi cần gặp quản lý.”" },
  { id: 7, q: "“Chúng tôi mở cửa lúc 7 giờ sáng.”" },
  { id: 8, q: "“Hàng này hết rồi, xin lỗi.”" },
  { id: 9, q: "“Bạn có thể giúp tôi không?”" },
  { id: 10, q: "“Kho hàng ở tầng hai.”" },
];
const D_SKILLS = [
  "Mendengar & memahami Bahasa Vietnam",
  "Berbicara dasar dalam Bahasa Vietnam",
  "Membaca tulisan Vietnam",
  "Menghitung & bertransaksi dalam Bahasa Vietnam",
  "Memahami budaya & etika kerja Vietnam",
];
const LETTERS = ["A", "B", "C", "D", "E"];

// Roster peserta cohort Alfamart × Vietnam Class
const NAMES = [
  "YUDI SOBARI",
  "MIRZANDA PITALOKA ARTONO",
  "ABDUL AZIZ",
  "BERNADETHE CLAUDIA RINDINA",
  "B. DIMAS SURYA WIRAWAN",
  "YOHANES ROYKE RAU",
  "YASON DOUGLAS SITORUS",
  "MUHLISHIN AKBAR",
  "GEDE DEANY JANUAR",
  "I GST PUTU AGUS YOGA MAHENDRA",
  "AJAT SUDRAJAT SPD I",
  "MARLA D SINAGA",
  "ANDRIAN TIRTA HIRAWAN",
  "M. ARIF KURNIAWAN",
  "MATHIAS ANGGER YUDISTIRA",
  "HANNIF ARDIANSYAH",
  "ADRIANUS HERI MULIAWAN TANUDJAJA",
];

type BAns = { text: string; dk: boolean };

export default function PreTestVietnamPage() {
  const [step, setStep] = useState(-1); // -1 intro · 0..4 A · 5..9 B · 10 info C · 11 D · 12 review · 13 done
  const [nama, setNama] = useState("");
  const [jabatan, setJabatan] = useState("");
  const [nameOpen, setNameOpen] = useState(false);
  const [aAns, setAans] = useState<Record<number, string>>({});
  const [bAns, setBans] = useState<Record<number, BAns>>({});
  const [dRate, setDrate] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const TOTAL = 13;
  const pct = Math.max(0, Math.min(100, Math.round(((step + 1) / TOTAL) * 100)));
  const scoreA = A.reduce((n, it) => n + (aAns[it.id] === KEY_A[it.id] ? 5 : 0), 0);
  const scoreD = Object.values(dRate).reduce((n, v) => n + (v || 0), 0);

  const go = (n: number) => setStep(n);
  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(-1, s - 1));
  const pickA = (item: { id: number }, letter: string) => {
    setAans((p) => ({ ...p, [item.id]: letter }));
    setTimeout(() => setStep((s) => s + 1), 220);
  };

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    const data = {
      cohort: COHORT,
      nama,
      jabatan,
      submitted_at: new Date().toISOString(),
      bagian_a: {
        answers: A.map((it) => ({ no: it.id, choice: aAns[it.id] || null, correct: aAns[it.id] === KEY_A[it.id] })),
        score: scoreA, max: 25, auto: true,
      },
      bagian_b: {
        answers: B.map((it) => ({ no: it.id, text: bAns[it.id]?.dk ? null : (bAns[it.id]?.text || ""), dont_know: !!bAns[it.id]?.dk })),
        score: null, max: 25, auto: false,
      },
      bagian_c: { score: null, max: 25, auto: false },
      bagian_d: { ratings: D_SKILLS.map((s, i) => ({ skill: s, value: dRate[i] || null })), score: scoreD, max: 25, auto: true },
      total_auto: scoreA + scoreD,
      status: "menunggu_penilaian",
    };
    const { error } = await supabase.from("pretest_submissions").insert({
      cohort: COHORT,
      nama,
      jabatan,
      answers: data,
      score_a: scoreA,
      score_d: scoreD,
      status: "menunggu_penilaian",
    });
    setSubmitting(false);
    if (error) {
      setSubmitError("Gagal mengirim. Cek koneksi lalu coba lagi ya.");
      return;
    }
    next();
  }

  const Shell = ({ children, pill, icon: Icon, sub }: any) => (
    <div className="ptw-fade">
      {pill && (
        <span className="inline-flex h-8 items-center gap-2 rounded-full px-3 text-[12px] font-bold"
          style={{ background: "rgba(22,121,110,0.10)", color: TEAL }}>
          <Icon className="h-4 w-4" />{pill}
        </span>
      )}
      {sub && <h2 className="mt-3 text-[22px] font-extrabold leading-tight text-slate-900">{sub}</h2>}
      {children}
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-slate-50 px-4 py-6 antialiased">
      <style>{`
        @keyframes ptw-fade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @keyframes ptw-pop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
        @keyframes ptw-fall{to{transform:translateY(420px) rotate(540deg);opacity:.85}}
        .ptw-fade{animation:ptw-fade .32s ease both}
        .ptw-pop{animation:ptw-pop .5s cubic-bezier(.2,.8,.2,1) both}
        .ptw-cf{position:absolute;width:8px;height:13px;border-radius:2px;top:-16px;animation:ptw-fall linear forwards}
      `}</style>

      <div className="mx-auto max-w-[560px]">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex items-baseline gap-1 text-[17px] font-extrabold">
            <span style={{ color: TEAL }}>linguo</span><span className="text-slate-900">.id</span>
          </div>
          <span className="ml-1 rounded-md px-2 py-0.5 text-[10px] font-bold"
            style={{ background: "rgba(242,203,5,0.18)", color: "#9a7a06" }}>PRE-TEST</span>
          <span className="ml-auto text-[11px] font-bold text-slate-400">Vietnam Class · Basic</span>
        </div>

        {step >= 0 && step <= 12 && (
          <div className="mb-5 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: TEAL }} />
            </div>
            <span className="text-[11px] font-bold text-slate-400">{pct}%</span>
          </div>
        )}

        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_18px_50px_-24px_rgba(15,23,42,0.25)]">

          {step === -1 && (
            <Shell>
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white" style={{ background: TEAL }}>
                <Sparkles className="h-7 w-7" />
              </div>
              <h1 className="text-[24px] font-extrabold leading-tight text-slate-900">Pre-Test Bahasa Vietnam</h1>
              <p className="mt-2 text-[14px] leading-relaxed text-slate-500">
                Tes ini buat ngukur kemampuan awal kamu sebelum program. Jawab apa adanya ya — tidak ada
                benar/salah yang memengaruhi keikutsertaan. Hasilnya dipakai buat nyesuain materi.
              </p>
              <div className="mt-4 flex items-start gap-3 rounded-2xl border p-3"
                style={{ borderColor: "rgba(22,121,110,.35)", background: "rgba(22,121,110,.06)" }}>
                <HelpCircle className="mt-0.5 h-5 w-5 shrink-0" style={{ color: TEAL }} />
                <p className="text-[13px] font-semibold leading-relaxed" style={{ color: "#0F5A52" }}>
                  Kalau belum tahu jawabannya, pilih <b>“Tidak tahu”</b> — jangan nebak. Jujur lebih membantu.
                </p>
              </div>
              <div className="mt-5 space-y-3">
                <div className="relative">
                  <span className="mb-1 flex items-center gap-1.5 text-[12px] font-bold text-slate-500"><User className="h-3.5 w-3.5" /> Nama</span>
                  <button type="button" onClick={() => setNameOpen((o) => !o)}
                    className="flex w-full items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-left text-[14px] font-semibold outline-none transition"
                    style={{ borderColor: nameOpen ? TEAL : "#e2e8f0" }}>
                    <span className={nama ? "text-slate-800" : "text-slate-400"}>{nama || "Pilih nama kamu"}</span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition" style={{ transform: nameOpen ? "rotate(180deg)" : "none" }} />
                  </button>
                  {nameOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setNameOpen(false)} />
                      <div className="absolute z-20 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-[0_18px_40px_-16px_rgba(15,23,42,0.35)]">
                        {NAMES.map((n) => (
                          <button key={n} type="button" onClick={() => { setNama(n); setNameOpen(false); }}
                            className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[13px] font-semibold text-slate-700 hover:bg-[#F0FAF8]"
                            style={nama === n ? { background: "rgba(22,121,110,.08)", color: "#0F5A52" } : undefined}>
                            <span className="flex-1">{n}</span>
                            {nama === n && <Check className="h-4 w-4 shrink-0" style={{ color: TEAL }} />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <label className="block">
                  <span className="mb-1 flex items-center gap-1.5 text-[12px] font-bold text-slate-500"><Briefcase className="h-3.5 w-3.5" /> Jabatan</span>
                  <input value={jabatan} onChange={(e) => setJabatan(e.target.value)} placeholder="mis. Staf Toko"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[14px] font-semibold text-slate-800 outline-none focus:border-[#16796E]" />
                </label>
              </div>
              <button onClick={() => go(0)} disabled={!nama.trim()}
                className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-extrabold text-white transition disabled:opacity-40"
                style={{ background: TEAL }}>
                Mulai tes <ArrowRight className="h-4 w-4" />
              </button>
            </Shell>
          )}

          {step >= 0 && step <= 4 && (() => {
            const item = A[step];
            return (
              <Shell pill={`Bagian A · Kosakata · Soal ${step + 1}/5`} icon={BookOpen} sub={item.q}>
                <div className="mt-5 flex flex-col gap-3">
                  {item.opts.map((o, i) => {
                    const L = LETTERS[i];
                    const chosen = aAns[item.id] === L;
                    return (
                      <button key={i} onClick={() => pickA(item, L)}
                        className="flex h-14 items-center gap-3 rounded-2xl border-2 px-4 text-left transition hover:border-[#16796E] hover:bg-[#F0FAF8]"
                        style={chosen ? { borderColor: TEAL, background: "#F0FAF8" } : { borderColor: "#e2e8f0" }}>
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[12px] font-extrabold text-slate-500">{L}</span>
                        <span className="text-[14px] font-bold text-slate-800">{o}</span>
                        {chosen && <Check className="ml-auto h-5 w-5" style={{ color: TEAL }} />}
                      </button>
                    );
                  })}
                  <button onClick={() => pickA(item, "E")}
                    className="flex h-14 items-center gap-3 rounded-2xl border-2 border-dashed px-4 text-left transition"
                    style={aAns[item.id] === "E" ? { borderColor: TEAL, background: "rgba(22,121,110,.08)" } : { borderColor: "#cbd5e1", background: "#f8fafc" }}>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-extrabold text-white" style={{ background: "#94a3b8" }}>E</span>
                    <span className="text-[14px] font-bold" style={{ color: TEAL }}>Tidak tahu</span>
                    {aAns[item.id] === "E" && <Check className="ml-auto h-5 w-5" style={{ color: TEAL }} />}
                  </button>
                </div>
              </Shell>
            );
          })()}

          {step >= 5 && step <= 9 && (() => {
            const item = B[step - 5];
            const cur = bAns[item.id] || { text: "", dk: false };
            const setCur = (patch: Partial<BAns>) => setBans((p) => ({ ...p, [item.id]: { ...cur, ...patch } }));
            const filled = cur.dk || cur.text.trim().length > 0;
            return (
              <Shell pill={`Bagian B · Pemahaman · Soal ${step - 4}/5`} icon={MessageSquare} sub={item.q}>
                <p className="mt-1.5 text-[13px] font-medium text-slate-500">Tulis artinya dalam Bahasa Indonesia.</p>
                <textarea rows={3} value={cur.text} disabled={cur.dk}
                  onChange={(e) => setCur({ text: e.target.value })}
                  placeholder="Ketik arti kalimat di sini…"
                  className="mt-3 w-full resize-none rounded-2xl border-2 border-slate-200 px-4 py-3 text-[14px] font-semibold text-slate-800 outline-none focus:border-[#16796E] disabled:bg-slate-50 disabled:text-slate-400" />
                <button onClick={() => setCur({ dk: !cur.dk, text: "" })}
                  className="mt-3 flex w-full items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-3 transition"
                  style={cur.dk ? { borderColor: TEAL, background: "rgba(22,121,110,.08)" } : { borderColor: "#cbd5e1", background: "#f8fafc" }}>
                  <span className="flex h-5 w-5 items-center justify-center rounded border-2" style={{ borderColor: cur.dk ? TEAL : "#94a3b8", background: cur.dk ? TEAL : "transparent" }}>
                    {cur.dk && <Check className="h-3.5 w-3.5 text-white" />}
                  </span>
                  <span className="text-[13px] font-bold" style={{ color: cur.dk ? TEAL : "#64748b" }}>Tidak tahu / belum bisa</span>
                </button>
                <div className="mt-5 flex items-center gap-3">
                  <button onClick={back} className="inline-flex h-12 items-center gap-2 rounded-2xl px-4 text-[14px] font-bold text-slate-500 hover:bg-slate-100">
                    <ArrowLeft className="h-4 w-4" /> Kembali
                  </button>
                  <button onClick={next} disabled={!filled}
                    className="ml-auto inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl text-[15px] font-extrabold text-white transition disabled:opacity-40"
                    style={{ background: TEAL }}>
                    Lanjut <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </Shell>
            );
          })()}

          {step === 10 && (
            <Shell pill="Bagian C · Percakapan Lisan" icon={Mic} sub="Bagian ini dinilai langsung oleh tutor">
              <p className="mt-2 text-[14px] leading-relaxed text-slate-500">
                Saat sesi pertama, tutor akan minta kamu memperkenalkan diri, menyapa, dan menyebutkan beberapa
                kosakata toko dalam Bahasa Vietnam. Nggak perlu diisi di sini — santai aja. 🙂
              </p>
              <div className="mt-5 flex items-center gap-3">
                <button onClick={back} className="inline-flex h-12 items-center gap-2 rounded-2xl px-4 text-[14px] font-bold text-slate-500 hover:bg-slate-100">
                  <ArrowLeft className="h-4 w-4" /> Kembali
                </button>
                <button onClick={next} className="ml-auto inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl text-[15px] font-extrabold text-white" style={{ background: TEAL }}>
                  Lanjut <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </Shell>
          )}

          {step === 11 && (
            <Shell pill="Bagian D · Self-Assessment" icon={Sparkles} sub="Seberapa bisa kamu sekarang?">
              <p className="mt-1.5 text-[13px] font-medium text-slate-500">1 = belum bisa · 5 = sangat bisa</p>
              <div className="mt-4 space-y-4">
                {D_SKILLS.map((s, i) => (
                  <div key={i}>
                    <p className="text-[13px] font-bold text-slate-700">{s}</p>
                    <div className="mt-2 flex gap-2">
                      {[1, 2, 3, 4, 5].map((v) => {
                        const on = dRate[i] === v;
                        return (
                          <button key={v} onClick={() => setDrate((p) => ({ ...p, [i]: v }))}
                            className="flex h-11 flex-1 items-center justify-center rounded-xl border-2 text-[14px] font-extrabold transition"
                            style={on ? { borderColor: TEAL, background: TEAL, color: "#fff" } : { borderColor: "#e2e8f0", color: "#94a3b8" }}>
                            {v}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-3">
                <button onClick={back} className="inline-flex h-12 items-center gap-2 rounded-2xl px-4 text-[14px] font-bold text-slate-500 hover:bg-slate-100">
                  <ArrowLeft className="h-4 w-4" /> Kembali
                </button>
                <button onClick={next} disabled={Object.keys(dRate).length < D_SKILLS.length}
                  className="ml-auto inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl text-[15px] font-extrabold text-white transition disabled:opacity-40"
                  style={{ background: TEAL }}>
                  Lihat ringkasan <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </Shell>
          )}

          {step === 12 && (
            <Shell pill="Ringkasan" icon={CircleCheck} sub="Cek dulu sebelum kirim">
              <div className="mt-4 space-y-2.5 text-[13px]">
                <Row k="Nama" v={nama || "—"} />
                <Row k="Jabatan" v={jabatan || "—"} />
                <Row k="Bagian A · Kosakata" v={`${A.filter((it) => aAns[it.id]).length}/5 dijawab`} />
                <Row k="Bagian B · Pemahaman" v={`${B.filter((it) => bAns[it.id] && (bAns[it.id].dk || bAns[it.id].text.trim())).length}/5 dijawab`} />
                <Row k="Bagian D · Self-assessment" v={`${Object.keys(dRate).length}/5 dinilai`} />
              </div>
              <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5 text-[12px] font-medium leading-relaxed text-slate-500">
                Skor Bagian A &amp; D dihitung otomatis. Bagian B &amp; C dinilai tutor untuk dapat total akhir /100.
              </p>
              {submitError && (
                <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2.5 text-[12px] font-bold text-rose-600">{submitError}</p>
              )}
              <div className="mt-5 flex items-center gap-3">
                <button onClick={back} disabled={submitting} className="inline-flex h-12 items-center gap-2 rounded-2xl px-4 text-[14px] font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-40">
                  <ArrowLeft className="h-4 w-4" /> Kembali
                </button>
                <button onClick={submit} disabled={submitting}
                  className="ml-auto inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl text-[15px] font-extrabold text-white transition disabled:opacity-60" style={{ background: TEAL }}>
                  {submitting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Mengirim…</>) : (<>Kirim jawaban <Check className="h-4 w-4" /></>)}
                </button>
              </div>
            </Shell>
          )}

          {step === 13 && (
            <div className="ptw-fade relative text-center">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1">
                {Array.from({ length: 16 }).map((_, i) => (
                  <span key={i} className="ptw-cf" style={{
                    left: `${(i * 6.2) % 100}%`,
                    background: [TEAL, YELLOW, "#34d399", "#f472b6"][i % 4],
                    animationDuration: `${1.5 + (i % 5) * 0.25}s`, animationDelay: `${(i % 6) * 0.08}s`,
                  }} />
                ))}
              </div>
              <div className="ptw-pop mx-auto mt-2 flex h-20 w-20 items-center justify-center rounded-3xl text-white" style={{ background: TEAL }}>
                <PartyPopper className="h-10 w-10" />
              </div>
              <h2 className="mt-5 text-[24px] font-extrabold text-slate-900">Selesai, makasih {nama.split(" ")[0] || ""}! 🎉</h2>
              <p className="mx-auto mt-2 max-w-[380px] text-[14px] leading-relaxed text-slate-500">
                Jawaban kamu udah kekirim. Tutor akan melengkapi penilaian Bagian B &amp; C, lalu materi disesuaikan dengan levelmu.
              </p>
              <div className="mx-auto mt-5 grid max-w-[320px] grid-cols-2 gap-3">
                <ScoreCard label="Bagian A · Kosakata" val={`${scoreA}/25`} />
                <ScoreCard label="Bagian D · Self" val={`${scoreD}/25`} />
              </div>
              <p className="mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold" style={{ background: "rgba(242,203,5,.16)", color: "#9a7a06" }}>
                Skor otomatis sementara: {scoreA + scoreD}/50
              </p>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-[11px] font-medium text-slate-400">
          linguo.id · Dokumen internal program — bersifat rahasia
        </p>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3.5 py-2.5">
      <span className="text-[12px] font-semibold text-slate-500">{k}</span>
      <span className="text-[13px] font-bold text-slate-800">{v}</span>
    </div>
  );
}
function ScoreCard({ label, val }: { label: string; val: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
      <div className="text-[20px] font-extrabold" style={{ color: TEAL }}>{val}</div>
      <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
    </div>
  );
}
