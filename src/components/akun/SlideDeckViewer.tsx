'use client';

// [materi-slide-v1] Penonton slide materi kelas — sisi SISWA.
//
// ⚠️ SALINAN dari linguo-admin-dashboard/src/components/materi/SlideDeckViewer.tsx.
// Pengajar menyusun deknya di sana, siswa menontonnya di sini, dan keduanya
// membaca baris `class_materials` yang sama. Kalau tata letak satu jenis slide
// diubah di repo dashboard, salin lagi ke sini — kalau tidak, materi yang sama
// tampil beda antara yang diajarkan pengajar dan yang dibuka siswa.

import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import {
  ChevronLeft, ChevronRight, X, Maximize2, Minimize2, Eye, EyeOff, Volume2,
} from "lucide-react";
import type { MateriSlide, SlideType } from "@/lib/materiSlides";
import { useT } from "@/lib/uiLang"; // [ui-lang-switcher-v1]
import { SLIDE_TYPE_LABEL } from "@/lib/materiSlides";
// [slide-tts-v1] Mesin & cache TTS yang SAMA dengan reader e-book new edition
// (memori → Cache API → CDN bucket `tts-cache` → /api/tts). Kata yang pernah
// dibunyikan siapa pun — di e-book maupun di slide — tidak disintesis ulang.
import {
  bisaDibunyikan, bukaKunciAudio, hentikanEbookTts, siapkanEbook, ucapkanEbook,
} from "@/lib/ebookTts";

const TEAL = "#1A9E9E";
/** Ada di /public kedua repo (dashboard & landing). */
const LOGO = "/logo-icon.png";

/* ── [slide-tema-v1] Tema warna per jenis slide ──────────────────────────────
   Dulu semua slide putih polos. Tiap jenis kini punya warna aksen sendiri (latar
   gradasi lembut + dua lingkaran dekor), supaya pergantian bagian — kosakata,
   dialog, kuis — terasa di layar. Teal brand tetap jadi benang merah: pembuka,
   poin, footer, dan logo. Warna ditulis inline (bukan kelas Tailwind) supaya
   mode gelap /akun tidak ikut menimpanya — slide selalu terang. */
type Tema = { aksen: string; lembut: string; bg: string };
const TEMA: Record<SlideType, Tema> = {
  title:    { aksen: "#1A9E9E", lembut: "#D5F1EF", bg: "linear-gradient(135deg,#0E7C7B 0%,#1A9E9E 45%,#35C6B4 100%)" },
  points:   { aksen: "#1A9E9E", lembut: "#D5F1EF", bg: "linear-gradient(135deg,#ECFBF9 0%,#FFFFFF 55%,#F0F9FF 100%)" },
  vocab:    { aksen: "#6D5BD0", lembut: "#E6E1FB", bg: "linear-gradient(135deg,#F3F0FF 0%,#FFFFFF 55%,#ECFBF9 100%)" },
  pattern:  { aksen: "#D97706", lembut: "#FDECC8", bg: "linear-gradient(135deg,#FFF7E6 0%,#FFFFFF 55%,#ECFBF9 100%)" },
  dialog:   { aksen: "#0284C7", lembut: "#D6EEFB", bg: "linear-gradient(135deg,#EAF6FE 0%,#FFFFFF 55%,#ECFBF9 100%)" },
  practice: { aksen: "#E11D62", lembut: "#FCDCE8", bg: "linear-gradient(135deg,#FFF0F5 0%,#FFFFFF 55%,#FFF7E6 100%)" },
  quiz:     { aksen: "#A21CAF", lembut: "#F3D9F7", bg: "linear-gradient(135deg,#FBEFFD 0%,#FFFFFF 55%,#EAF6FE 100%)" },
  recap:    { aksen: "#059669", lembut: "#D3F3E5", bg: "linear-gradient(135deg,#EAFBF3 0%,#FFFFFF 55%,#FFF7E6 100%)" },
};

/* ── [slide-tts-v1] Teks bahasa target yang bisa diklik ──────────────────────
   Klik satu kata → kata itu dibunyikan; ikon pengeras suara → seluruh kalimat.
   Kursor yang singgah di kata menyiapkan audionya dari cache (TANPA sintesis),
   jadi kliknya biasanya langsung berbunyi. Tanpa kode bahasa yang dikenal,
   teksnya tampil biasa — lebih baik bisu daripada dilafalkan suara yang salah. */

const TEPI = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;

function Ucap({ teks, lang, kalimat = true }: { teks: string; lang?: string | null; kalimat?: boolean }) {
  const [aktif, setAktif] = useState<number | null>(null);
  if (!lang || !bisaDibunyikan(lang)) return <>{teks}</>;

  const bunyikan = (apa: string, idx: number) => (e: ReactMouseEvent) => {
    e.stopPropagation();
    bukaKunciAudio();
    setAktif(idx);
    void ucapkanEbook(apa, lang).finally(() => setTimeout(() => setAktif((a) => (a === idx ? null : a)), 700));
  };
  // Pemisah tampilan ("·", "/", "→") dibaca sebagai jeda, bukan dieja.
  const utuh = teks.replace(/\s*[·/→]\s*/g, ", ").replace(/[()]/g, " ").trim();

  return (
    <span>
      {teks.split(/(\s+)/).map((b, i) => {
        const kata = b.replace(TEPI, "");
        if (!/\p{L}/u.test(kata)) return b;
        return (
          <span key={i} role="button" tabIndex={-1}
            onMouseEnter={() => siapkanEbook(kata, lang)}
            onClick={bunyikan(kata, i)}
            className="cursor-pointer rounded-[0.25em] transition-colors hover:bg-teal-100/80"
            style={aktif === i ? { background: "#99E6DC" } : undefined}>
            {b}
          </span>
        );
      })}
      {kalimat && /\s/.test(utuh) && (
        <button type="button" onClick={bunyikan(utuh, -1)} title="Dengarkan kalimat"
          className="ml-[0.4em] inline-flex translate-y-[0.12em] rounded-full p-[0.15em] opacity-50 transition hover:bg-teal-100 hover:opacity-100"
          style={{ color: aktif === -1 ? "#0E7C7B" : TEAL }}>
          <Volume2 className="h-[0.95em] w-[0.95em]" />
        </button>
      )}
    </span>
  );
}

/* ── [dek-siap-pakai-v1] Kuis pilihan ganda ─────────────────────────────────
   Diklik langsung di layar (pengajar share screen, siswa menyebut jawabannya):
   opsi yang dipilih menyala hijau/merah dan jawaban benar ikut ditandai. Tombol
   kunci (ikon mata) menandai semua jawaban benar sekaligus. */

const HURUF = ["A", "B", "C", "D", "E", "F"];

function KuisPilihan({ s, kunci, aksen }: { s: MateriSlide; kunci?: boolean; aksen: string }) {
  const [pilih, setPilih] = useState<Record<number, number>>({});
  return (
    <ol className="space-y-[1.5cqh]">
      {(s.quiz || []).map((q, qi) => {
        const p = pilih[qi];
        const terjawab = p != null;
        return (
          <li key={qi}>
            <div className="flex gap-2 font-semibold text-gray-900">
              <span className="shrink-0" style={{ color: aksen }}>{qi + 1}.</span>
              <span>{q.q}</span>
            </div>
            <div className="mt-[0.5cqh] flex flex-wrap gap-x-[1cqw] gap-y-[0.6cqh] pl-[1.6em]">
              {q.options.map((o, oi) => {
                const benar = oi === q.answer;
                const nyala = (terjawab || kunci) && benar;
                const salah = terjawab && p === oi && !benar;
                return (
                  <button key={oi} type="button"
                    onClick={() => setPilih((x) => ({ ...x, [qi]: oi }))}
                    className={`rounded-lg border px-[0.7em] py-[0.25em] text-left shadow-sm transition ${
                      nyala ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                        : salah ? "border-rose-400 bg-rose-50 text-rose-700 line-through"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"}`}>
                    <span className="mr-1 font-bold">{HURUF[oi] || oi + 1}.</span>{o}
                  </button>
                );
              })}
            </div>
            {(terjawab || kunci) && q.explain && (
              <div className="mt-[0.4cqh] pl-[1.6em] text-[0.88em] text-gray-500">{q.explain}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* ── Isi satu slide ──────────────────────────────────────────────────────── */

export function SlideBody({ s, kunci, lang }: { s: MateriSlide; kunci?: boolean; lang?: string | null }) {
  const tema = TEMA[s.type] || TEMA.points;

  if (s.type === "title") {
    return (
      <div className="flex h-full flex-col items-center justify-center px-[8%] text-center">
        <img src={LOGO} alt="Linguo" className="mb-[3%] h-[14%] w-auto rounded-[22%] bg-white/95 p-[0.8%] shadow-lg" />
        <h2 className="text-[clamp(1.4rem,3.8cqw,2.8rem)] font-extrabold leading-tight text-white drop-shadow-sm">{s.heading}</h2>
        {s.subheading && <p className="mt-3 text-[clamp(0.8rem,1.8cqw,1.2rem)] font-medium text-white/85">{s.subheading}</p>}
        {s.note && (
          <p className="mt-5 rounded-2xl bg-white/95 px-[2.2%] py-[1%] text-[clamp(0.7rem,1.4cqw,0.95rem)] font-semibold shadow-md" style={{ color: "#0E7C7B" }}>
            {s.note}
          </p>
        )}
      </div>
    );
  }

  /* Jarak vertikal memakai cqh (tinggi kartu), bukan persen: persen pada
     margin/padding vertikal dihitung dari LEBAR, jadi di kartu 16:9 jaraknya
     hampir dua kali lipat dan isi slide terpotong. */
  const kartu = "rounded-xl border border-white bg-white/85 px-[2.2cqw] py-[1.1cqh] shadow-sm";
  /* Slide yang isinya banyak dikecilkan sedikit supaya tetap muat tanpa gulir. */
  const n = s.items?.length || s.lines?.length || s.quiz?.length || s.examples?.length || s.points?.length || s.questions?.length || 0;
  const skala = s.type === "dialog" ? (n > 6 ? 0.9 : 1)
    : s.type === "quiz" ? (n > 5 ? 0.88 : 1)
    : s.type === "vocab" ? (n > 6 ? 0.9 : 1)
    : n > 6 ? 0.88 : 1;

  return (
    <div className="flex h-full flex-col px-[6cqw] pb-[1.5cqh] pt-[5cqh]">
      <div className="shrink-0 pr-[9%]">
        <span className="inline-block rounded-full px-[0.9em] py-[0.2em] text-[clamp(0.5rem,1cqw,0.7rem)] font-extrabold uppercase tracking-[0.12em] text-white"
          style={{ background: tema.aksen }}>
          {SLIDE_TYPE_LABEL[s.type]}
        </span>
        <h3 className="mt-[0.8cqh] text-[clamp(1rem,2.4cqw,1.7rem)] font-extrabold leading-snug text-gray-900">{s.heading}</h3>
        {s.subheading && <p className="mt-0.5 text-[clamp(0.68rem,1.4cqw,0.95rem)] text-gray-500">{s.subheading}</p>}
        <div className="mt-[1cqh] h-[0.3cqw] w-[9%] rounded-full" style={{ background: tema.aksen }} />
      </div>

      <div className="mt-[2cqh] min-h-0 flex-1 overflow-y-auto pr-1" style={{ fontSize: `clamp(${0.66 * skala}rem, ${1.5 * skala}cqw, ${1.05 * skala}rem)` }}>
        {s.type === "vocab" && (
          <ul className={`grid gap-x-[1.6cqw] gap-y-[1.2cqh] ${(s.items || []).length > 4 ? "grid-cols-2" : "grid-cols-1"}`}>
            {(s.items || []).map((it, i) => (
              <li key={i} className={kartu} style={{ borderLeft: `0.35em solid ${tema.aksen}` }}>
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="font-bold text-gray-900"><Ucap teks={it.term} lang={lang} /></span>
                  {it.translit && <span className="text-gray-400">/{it.translit}/</span>}
                  <span className="text-gray-600">— {it.meaning}</span>
                </div>
                {it.example && (
                  <div className="mt-1 border-l-2 pl-2 text-[0.92em] italic text-gray-600" style={{ borderColor: tema.aksen }}>
                    <Ucap teks={it.example} lang={lang} />
                    {it.example_meaning && <span className="not-italic text-gray-400"> ({it.example_meaning})</span>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {s.type === "pattern" && (
          <div className="space-y-[1.4cqh]">
            {s.pattern && (
              <div className="rounded-xl px-[2.2cqw] py-[1.5cqh] text-center font-bold text-white shadow-md"
                style={{ background: `linear-gradient(90deg, ${tema.aksen}, #F59E0B)` }}>
                {s.pattern}
              </div>
            )}
            <ul className={`grid gap-x-[1.6cqw] gap-y-[1.1cqh] ${(s.examples || []).length > 4 ? "grid-cols-2" : "grid-cols-1"}`}>
              {(s.examples || []).map((e, i) => (
                <li key={i} className={kartu}>
                  <div className="font-semibold text-gray-900"><Ucap teks={e.target} lang={lang} /></div>
                  {e.meaning && <div className="text-gray-500">{e.meaning}</div>}
                </li>
              ))}
            </ul>
            {s.note && <p className="rounded-xl border border-amber-200 bg-amber-50 px-[2.2cqw] py-[1.1cqh] text-[0.92em] text-amber-800">{s.note}</p>}
          </div>
        )}

        {s.type === "dialog" && (
          // Dialog panjang (> 6 baris) dibagi dua kolom supaya muat tanpa gulir.
          <div className={(s.lines || []).length > 6 ? "columns-2 gap-x-[2.5cqw]" : ""}>
            {(s.lines || []).map((l, i) => {
              // Pembicara pertama di kiri, yang lain di kanan — seperti gelembung chat.
              const kiri = !l.speaker || l.speaker === s.lines?.[0]?.speaker;
              return (
                <div key={i} className={`mb-[1cqh] flex break-inside-avoid ${kiri ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[86%] rounded-2xl px-[2cqw] py-[0.9cqh] shadow-sm ${kiri ? "rounded-bl-sm bg-white" : "rounded-br-sm"}`}
                    style={kiri ? undefined : { background: tema.lembut }}>
                    <div className="font-semibold text-gray-900">
                      {l.speaker && <span className="mr-[0.5em] text-[0.8em] font-extrabold" style={{ color: kiri ? TEAL : tema.aksen }}>{l.speaker}</span>}
                      <Ucap teks={l.text} lang={lang} />
                    </div>
                    {l.meaning && <div className="text-[0.88em] text-gray-500">{l.meaning}</div>}
                  </div>
                </div>
              );
            })}
            {s.note && <p className="rounded-xl border border-amber-200 bg-amber-50 px-[2.2cqw] py-[1.1cqh] text-[0.92em] text-amber-800">{s.note}</p>}
          </div>
        )}

        {s.type === "quiz" && <KuisPilihan s={s} kunci={kunci} aksen={tema.aksen} />}

        {(s.type === "points" || s.type === "recap") && (
          <ul className="space-y-[1.3cqh]">
            {(s.points || []).map((p, i) => (
              <li key={i} className={`flex items-start gap-[0.8em] ${kartu}`}>
                <span className="mt-[0.1em] grid h-[1.5em] w-[1.5em] shrink-0 place-items-center rounded-full text-[0.8em] font-bold text-white"
                  style={{ background: tema.aksen }}>{i + 1}</span>
                <span className="text-gray-700">{p}</span>
              </li>
            ))}
          </ul>
        )}

        {s.type === "practice" && (
          <ol className="space-y-[1.3cqh]">
            {(s.questions || []).map((q, i) => (
              <li key={i} className={`flex items-start gap-[0.8em] ${kartu}`}>
                <span className="shrink-0 font-extrabold" style={{ color: tema.aksen }}>{i + 1}.</span>
                <span className="text-gray-700">{q}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      {s.type === "recap" && s.homework && (
        <div className="mt-[1.4cqh] shrink-0 rounded-xl px-[2.2cqw] py-[1.3cqh] text-[clamp(0.68rem,1.4cqw,0.95rem)] text-white shadow-md"
          style={{ background: `linear-gradient(90deg, ${TEAL}, ${tema.aksen})` }}>
          <span className="font-extrabold">PR: </span>
          <span>{s.homework}</span>
        </div>
      )}
    </div>
  );
}

/** Panel kunci jawaban — sengaja terpisah supaya bisa disembunyikan saat mengajar. */
function KunciJawaban({ s }: { s: MateriSlide }) {
  const jawab = (s.answers || []).filter(Boolean);
  if (s.type !== "practice" || !jawab.length) return null;
  return (
    <div className="relative border-t border-gray-200 bg-white/90 px-[6cqw] py-[1.2cqh] text-[clamp(0.62rem,1.25cqw,0.85rem)]">
      <div className="mb-1 font-bold text-gray-500">Kunci jawaban</div>
      <ol className="flex flex-wrap gap-x-4 gap-y-1">
        {jawab.map((a, i) => (
          <li key={i} className="text-gray-700"><span className="font-semibold">{i + 1}.</span> {a}</li>
        ))}
      </ol>
    </div>
  );
}

/* ── Kartu slide 16:9 ────────────────────────────────────────────────────── */

export function SlideCard({ s, showAnswers, lang, className = "" }: {
  s: MateriSlide; showAnswers?: boolean; lang?: string | null; className?: string;
}) {
  const tema = TEMA[s.type] || TEMA.points;
  const judul = s.type === "title";
  return (
    // `container-type: size` bikin clamp(...cqw) menskala ikut LEBAR KARTU, bukan
    // lebar layar — itu yang bikin teks slide ikut membesar saat fullscreen.
    <div className={`relative flex flex-col overflow-hidden text-left ${className}`}
      style={{ containerType: "size", background: tema.bg }}>
      {/* [slide-tema-v1] Dekor: dua lingkaran warna + watermark logo. Semuanya
          pointer-events-none supaya kata & opsi kuis di atasnya tetap bisa diklik. */}
      <div aria-hidden className="pointer-events-none absolute -right-[7%] -top-[16%] aspect-square w-[30%] rounded-full"
        style={{ background: judul ? "rgba(255,255,255,0.14)" : tema.lembut, opacity: judul ? 1 : 0.75 }} />
      <div aria-hidden className="pointer-events-none absolute -bottom-[22%] -left-[8%] aspect-square w-[34%] rounded-full"
        style={{ background: judul ? "rgba(255,255,255,0.10)" : tema.lembut, opacity: judul ? 1 : 0.5 }} />
      <div aria-hidden className="pointer-events-none absolute right-[16%] top-[9%] aspect-square w-[5%] rounded-full"
        style={{ background: judul ? "rgba(255,255,255,0.18)" : tema.aksen, opacity: judul ? 1 : 0.16 }} />
      {/* [slide-watermark-v1] Tanda air: logo besar pudar + tulisan miring berulang.
          Ikut terekam di tangkapan layar/rekaman, tapi tidak mengganggu baca. */}
      <img aria-hidden src={LOGO} alt=""
        className="pointer-events-none absolute left-1/2 top-1/2 w-[34%] -translate-x-1/2 -translate-y-1/2 select-none"
        style={{ opacity: judul ? 0.07 : 0.05, filter: judul ? "brightness(0) invert(1)" : undefined }} />
      <div aria-hidden className="pointer-events-none absolute inset-0 select-none overflow-hidden">
        {[18, 50, 82].map((top, r) => (
          <div key={r} className="absolute whitespace-nowrap text-[clamp(0.6rem,1.5cqw,1.1rem)] font-extrabold uppercase tracking-[0.5em]"
            style={{
              top: `${top}%`, left: "-10%", transform: "rotate(-18deg)",
              color: judul ? "#fff" : tema.aksen, opacity: judul ? 0.06 : 0.045,
            }}>
            {Array.from({ length: 8 }).map(() => "linguo.id").join("   ·   ")}
          </div>
        ))}
      </div>
      {!judul && (
        <img src={LOGO} alt="Linguo" className="absolute right-[3%] top-[4.5%] h-[9%] w-auto select-none" />
      )}

      <div className="relative min-h-0 flex-1"><SlideBody s={s} kunci={showAnswers} lang={lang} /></div>
      {showAnswers && <KunciJawaban s={s} />}

      <div className="relative flex shrink-0 items-center justify-between px-[6cqw] py-[1.2cqh] text-[clamp(0.5rem,1.05cqw,0.72rem)] font-semibold"
        style={judul
          ? { color: "rgba(255,255,255,0.85)" }
          : { color: "#0E7C7B", background: "rgba(255,255,255,0.6)", borderTop: `1px solid ${tema.lembut}` }}>
        <span className="inline-flex items-center gap-[0.5em]">
          {judul ? null : <img src={LOGO} alt="" className="h-[1.3em] w-auto" />}
          Linguo · Online Language School
        </span>
        <span>linguo.id</span>
      </div>
    </div>
  );
}

/* ── Slideshow ───────────────────────────────────────────────────────────── */

export function SlideDeckViewer({
  slides, title, subtitle, lang, onClose,
}: {
  slides: MateriSlide[];
  /** [slide-tts-v1] Kode bahasa target ("es") — tanpa ini kata tidak bisa diklik. */
  lang?: string | null;
  title: string;
  subtitle?: string;
  onClose: () => void;
}) {
  const t = useT(); // [ui-lang-switcher-v1]
  const [i, setI] = useState(0);
  const [fs, setFs] = useState(false);
  const [kunci, setKunci] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sentuh = useRef<number | null>(null);

  const total = slides.length;
  const maju = useCallback(() => setI((c) => Math.min(c + 1, total - 1)), [total]);
  const mundur = useCallback(() => setI((c) => Math.max(c - 1, 0)), []);

  /* Fullscreen ASLI (Fullscreen API), bukan sekadar kartu dibesarkan: pengajar
     memakai ini sambil share screen, jadi bilah browser harus benar-benar hilang. */
  const toggleFs = useCallback(async () => {
    const el = wrapRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await el.requestFullscreen();
    } catch {
      // Safari/iOS kadang menolak tanpa gestur langsung — biarkan mode jendela.
    }
  }, []);

  useEffect(() => {
    const sync = () => setFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") { e.preventDefault(); maju(); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); mundur(); }
      else if (e.key === "f" || e.key === "F") toggleFs();
      // Saat fullscreen, Esc dipakai browser untuk keluar fullscreen dulu —
      // jangan sekalian menutup slideshow-nya.
      else if (e.key === "Escape" && !document.fullscreenElement) onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [maju, mundur, toggleFs, onClose]);

  /* [slide-tts-v1] Pindah slide / menutup = suara yang masih berjalan dihentikan. */
  useEffect(() => { hentikanEbookTts(); }, [i]);
  useEffect(() => () => { hentikanEbookTts(); }, []);
  const bisaTts = !!lang && bisaDibunyikan(lang);

  const s = slides[i];
  if (!s) return null;

  return (
    <div
      ref={wrapRef}
      className="fixed inset-0 z-[120] flex flex-col bg-gray-950"
      onTouchStart={(e) => { sentuh.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (sentuh.current == null) return;
        const d = e.changedTouches[0].clientX - sentuh.current;
        if (Math.abs(d) > 50) (d < 0 ? maju : mundur)();
        sentuh.current = null;
      }}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-800 bg-gray-900/80 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <img src={LOGO} alt="Linguo" className="h-6 w-6 shrink-0 rounded-md bg-white object-contain p-0.5" />
          <span className="truncate text-sm font-semibold text-white/90">{title}</span>
          {subtitle && <span className="hidden truncate text-xs text-gray-400 sm:inline">· {subtitle}</span>}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {bisaTts && (
            <span className="mr-1 hidden items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-gray-300 md:inline-flex">
              <Volume2 size={12} /> Klik kata untuk dengar
            </span>
          )}
          {(s.type === "practice" || s.type === "quiz") && (
            <button onClick={() => setKunci((k) => !k)} title={kunci ? "Sembunyikan kunci jawaban" : "Tampilkan kunci jawaban"}
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-800 hover:text-white">
              {kunci ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
          <span className="px-1 text-xs tabular-nums text-gray-500">{i + 1} / {total}</span>
          <button onClick={toggleFs} title={fs ? "Keluar layar penuh (F)" : "Layar penuh (F)"}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-800 hover:text-white">
            {fs ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button onClick={onClose} title={t("Tutup")} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-800 hover:text-white">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center p-3 sm:p-6">
        <button onClick={mundur} disabled={i === 0} aria-label={t("Slide sebelumnya")}
          className="absolute left-2 z-10 rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20 disabled:opacity-20 sm:left-4 sm:p-3">
          <ChevronLeft size={22} />
        </button>
        <SlideCard key={i} s={s} showAnswers={kunci} lang={lang} className="aspect-[16/9] max-h-full w-full max-w-[min(1100px,92vw)] rounded-2xl shadow-2xl" />
        <button onClick={maju} disabled={i === total - 1} aria-label={t("Slide berikutnya")}
          className="absolute right-2 z-10 rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20 disabled:opacity-20 sm:right-4 sm:p-3">
          <ChevronRight size={22} />
        </button>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-center gap-1.5 bg-gray-900/80 py-3">
        {slides.map((_, n) => (
          <button key={n} onClick={() => setI(n)} aria-label={`Slide ${n + 1}`}
            className={`rounded-full transition-all ${n === i ? "h-2 w-6" : "h-2 w-2 bg-gray-600 hover:bg-gray-500"}`}
            style={n === i ? { background: TEAL } : undefined} />
        ))}
      </div>
    </div>
  );
}
