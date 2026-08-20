"use client";

/* [ebook-latihan-interaktif-v1] Latihan modul yang bisa DIKERJAKAN, bukan cuma
   dibaca.

   Kenapa ada: latihan di dalam PDF menuntut siswa menyiapkan kertas, dan kunci
   jawabannya menganggur dua halaman di bawahnya — praktisnya hampir tak pernah
   dikerjakan. Bahannya datang dari berkas `<modul>.latihan.json` yang dirakit
   bareng PDF-nya (lihat scripts/build-ebook-pdf.mjs), jadi soal & kuncinya
   persis sama dengan yang tercetak.

   Tiga bentuk soal, ditentukan dari bentuk soalnya sendiri:
   - `susun`   → kata-katanya jadi kepingan yang diketuk berurutan,
   - `isian`   → satu isian; kalau seluruh kuncinya satu kata, kepingan pilihan
                 ikut muncul (tetap boleh diketik),
   - `terjemah`→ diketik bebas.

   Penilaiannya SENGAJA longgar: huruf besar, tanda baca, dan aksen diabaikan.
   Terjemahan bebas tak punya satu jawaban benar, jadi waktu jawaban tak sama
   persis siswa boleh menyatakan jawabannya juga benar — reader ini alat belajar,
   bukan alat menilai. */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useT } from "@/lib/uiLang";
import { Check, X, ChevronRight, RotateCcw, Delete, PenLine } from "lucide-react";

export type SoalLatihan = { teks: string; kunci: string };
export type Latihan = {
  perintah: string;
  tipe: "terjemah" | "isian" | "susun";
  soal: SoalLatihan[];
  pilihan?: string[];
};
export type UnitLatihan = {
  no: number;
  judul: string;
  hal: number | null;
  sampai: number | null;
  halLatihan: number | null;
  latihan: Latihan[];
};
export type BerkasLatihan = { slug?: string; halaman?: number; unit: UnitLatihan[] };

type Butir = { latihan: Latihan; soal: SoalLatihan };

/** Huruf besar, tanda baca, dan aksen dibuang — "¿Cómo te llamas?" = "como te llamas". */
const samakan = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Acakan yang TETAP untuk soal yang sama — kalau tidak, kepingannya lompat-lompat tiap render. */
function acak<T>(arr: T[], benih: number): T[] {
  const out = [...arr];
  let x = benih * 9301 + 49297;
  for (let i = out.length - 1; i > 0; i--) {
    x = (x * 9301 + 49297) % 233280;
    const j = Math.floor((x / 233280) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const BLANK = /_{2,}/g;

export default function EbookLatihan({ unit, onClose }: { unit: UnitLatihan; onClose: () => void }) {
  const t = useT();

  const semua = useMemo<Butir[]>(
    () => unit.latihan.flatMap((l) => l.soal.map((s) => ({ latihan: l, soal: s }))),
    [unit]
  );

  /* Antrean soal disimpan sebagai indeks, bukan salinan butirnya: "ulangi yang
     salah" tinggal menyusun ulang antreannya tanpa menyentuh sumbernya. */
  const [antre, setAntre] = useState<number[]>(() => semua.map((_, i) => i));
  const [ke, setKe] = useState(0);
  const [ketik, setKetik] = useState("");
  const [keping, setKeping] = useState<number[]>([]);
  const [nilai, setNilai] = useState<"benar" | "salah" | null>(null);
  const [benar, setBenar] = useState<Set<number>>(new Set());
  const [salah, setSalah] = useState<Set<number>>(new Set());

  const idx = antre[ke];
  const butir = semua[idx];
  const selesai = ke >= antre.length;

  const kepingan = useMemo(() => {
    if (!butir || butir.latihan.tipe !== "susun") return [];
    return acak(
      butir.soal.teks.split("/").map((x) => x.trim()).filter(Boolean),
      idx + 1
    );
  }, [butir, idx]);

  const jawaban = butir?.latihan.tipe === "susun" ? keping.map((k) => kepingan[k]).join(" ") : ketik;

  const periksa = useCallback(() => {
    if (!butir || nilai || !jawaban.trim()) return;
    const cocok = samakan(jawaban) === samakan(butir.soal.kunci);
    setNilai(cocok ? "benar" : "salah");
    (cocok ? setBenar : setSalah)((s) => new Set(s).add(idx));
    if (cocok) setSalah((s) => { const n = new Set(s); n.delete(idx); return n; });
  }, [butir, nilai, jawaban, idx]);

  /** Terjemahan bebas: siswa boleh menyatakan jawabannya juga sah. */
  const akuiBenar = useCallback(() => {
    setNilai("benar");
    setBenar((s) => new Set(s).add(idx));
    setSalah((s) => { const n = new Set(s); n.delete(idx); return n; });
  }, [idx]);

  const lanjut = useCallback(() => {
    setNilai(null);
    setKetik("");
    setKeping([]);
    setKe((k) => k + 1);
  }, []);

  const ulangiSalah = useCallback(() => {
    const sisa = [...salah];
    if (!sisa.length) return;
    setAntre(sisa);
    setKe(0);
    setNilai(null);
    setKetik("");
    setKeping([]);
  }, [salah]);

  // Enter = periksa, lalu Enter lagi = lanjut. Soal ketik dikerjakan dengan dua
  // tangan di papan ketik; memaksa pindah ke tetikus tiap soal itu yang bikin
  // latihan terasa lambat.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Enter" || selesai) return;
      e.preventDefault();
      if (nilai) lanjut();
      else periksa();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nilai, selesai, periksa, lanjut, onClose]);

  const total = semua.length;
  const skor = benar.size;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
      {/* Tinggi mengikuti isi (max-h, bukan h): soal terjemahan cuma butuh
            sepertiga layar, dan kartu setinggi 86vh membuat tombol Periksa
            terdampar jauh di bawah pertanyaannya. */}
        <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#101314] shadow-2xl sm:max-h-[86vh] sm:rounded-3xl">
        {/* kepala */}
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <PenLine className="h-4 w-4 shrink-0 text-[#3ED9C0]" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold text-white">
              {t("Latihan")} · Unit {unit.no}
            </p>
            <p className="truncate text-[11px] font-semibold text-white/40">{unit.judul}</p>
          </div>
          <span className="shrink-0 rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] font-bold tabular-nums text-white/50">
            {Math.min(ke + 1, antre.length)}/{antre.length}
          </span>
          <button
            onClick={onClose}
            aria-label={t("Tutup")}
            className="shrink-0 rounded-lg p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* bilah kemajuan */}
        <div className="h-1 bg-white/[0.06]">
          <div
            className="h-full bg-[#3ED9C0] transition-[width] duration-300"
            style={{ width: `${antre.length ? (Math.min(ke, antre.length) / antre.length) * 100 : 0}%` }}
          />
        </div>

        {selesai ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-[44px] font-extrabold tabular-nums text-[#3ED9C0]">
              {skor}/{total}
            </p>
            <p className="text-[13px] font-semibold leading-relaxed text-white/60">
              {salah.size
                ? t("Yang belum pas bukan gagal — itu justru daftar yang paling layak diulang.")
                : t("Semua benar. Lanjut ke unit berikutnya.")}
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              {salah.size > 0 && (
                <button
                  onClick={ulangiSalah}
                  className="flex items-center gap-2 rounded-xl bg-[#3ED9C0] px-4 py-2.5 text-[13px] font-bold text-black transition hover:brightness-95"
                >
                  <RotateCcw className="h-4 w-4" />
                  {t("Ulangi yang salah")} ({salah.size})
                </button>
              )}
              <button
                onClick={onClose}
                className="rounded-xl bg-white/10 px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-white/20"
              >
                {t("Kembali membaca")}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#3ED9C0]">
                {butir.latihan.perintah}
              </p>

              {/* Soal isian ditulis ulang dengan jawaban yang sudah diketik di
                  tempat titik-titiknya, supaya kalimatnya terbaca utuh. */}
              <p className="mt-3 text-[19px] font-bold leading-relaxed text-white">
                {butir.latihan.tipe === "isian"
                  ? butir.soal.teks.split(BLANK).map((bagian, i, arr) => (
                      <span key={i}>
                        {bagian}
                        {i < arr.length - 1 && (
                          <span className="mx-0.5 border-b-2 border-[#3ED9C0]/60 px-1 text-[#3ED9C0]">
                            {(i === 0 && ketik.trim()) || " "}
                          </span>
                        )}
                      </span>
                    ))
                  : butir.soal.teks}
              </p>

              {butir.latihan.tipe === "susun" ? (
                <div className="mt-5">
                  {/* baris jawaban */}
                  <div className="flex min-h-[52px] flex-wrap content-start items-start gap-2 rounded-2xl border border-dashed border-white/15 p-2.5">
                    {keping.length === 0 && (
                      <span className="px-1 py-1 text-[12.5px] font-semibold text-white/30">
                        {t("Ketuk kata di bawah untuk menyusun kalimat")}
                      </span>
                    )}
                    {keping.map((k, urut) => (
                      <button
                        key={`${k}-${urut}`}
                        disabled={!!nilai}
                        onClick={() => setKeping((s) => s.filter((_, i) => i !== urut))}
                        className="rounded-xl bg-[#3ED9C0]/15 px-3 py-1.5 text-[14px] font-bold text-[#3ED9C0] transition hover:bg-[#3ED9C0]/25 disabled:opacity-60"
                      >
                        {kepingan[k]}
                      </button>
                    ))}
                  </div>
                  {/* bank kata */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {kepingan.map((kata, k) =>
                      keping.includes(k) ? (
                        <span
                          key={k}
                          aria-hidden
                          className="rounded-xl border border-white/5 px-3 py-1.5 text-[14px] font-bold text-transparent"
                        >
                          {kata}
                        </span>
                      ) : (
                        <button
                          key={k}
                          disabled={!!nilai}
                          onClick={() => setKeping((s) => [...s, k])}
                          className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[14px] font-bold text-white transition hover:bg-white/[0.12] disabled:opacity-50"
                        >
                          {kata}
                        </button>
                      )
                    )}
                    {keping.length > 0 && !nilai && (
                      <button
                        onClick={() => setKeping((s) => s.slice(0, -1))}
                        aria-label={t("Hapus satu kata")}
                        className="rounded-xl border border-white/10 px-3 py-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
                      >
                        <Delete className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-5">
                  <input
                    autoFocus
                    value={ketik}
                    disabled={!!nilai}
                    onChange={(e) => setKetik(e.target.value)}
                    placeholder={t("Ketik jawabanmu…")}
                    className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-[15px] font-semibold text-white outline-none transition placeholder:font-medium placeholder:text-white/25 focus:border-[#3ED9C0]/60 disabled:opacity-70"
                  />
                  {!!butir.latihan.pilihan?.length && !nilai && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {butir.latihan.pilihan.map((p) => (
                        <button
                          key={p}
                          onClick={() => setKetik(p)}
                          className={`rounded-xl border px-3 py-1.5 text-[14px] font-bold transition ${
                            samakan(ketik) === samakan(p)
                              ? "border-[#3ED9C0]/60 bg-[#3ED9C0]/15 text-[#3ED9C0]"
                              : "border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.12]"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* kaki: periksa / hasil */}
            <div
              className={`border-t px-5 py-4 transition-colors ${
                nilai === "benar"
                  ? "border-[#3ED9C0]/25 bg-[#3ED9C0]/10"
                  : nilai === "salah"
                    ? "border-red-400/25 bg-red-500/10"
                    : "border-white/10"
              }`}
            >
              {nilai && (
                <div className="mb-3 flex items-start gap-2.5">
                  {nilai === "benar" ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#3ED9C0]" />
                  ) : (
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-[13px] font-extrabold ${nilai === "benar" ? "text-[#3ED9C0]" : "text-red-300"}`}
                    >
                      {nilai === "benar" ? t("Benar") : t("Belum pas")}
                    </p>
                    <p className="mt-0.5 text-[13px] font-semibold leading-relaxed text-white/75">
                      {butir.soal.kunci}
                    </p>
                    {nilai === "salah" && butir.latihan.tipe === "terjemah" && (
                      <button
                        onClick={akuiBenar}
                        className="mt-1.5 text-[11.5px] font-bold text-white/45 underline underline-offset-2 transition hover:text-white/80"
                      >
                        {t("Jawabanku juga benar")}
                      </button>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={nilai ? lanjut : periksa}
                disabled={!nilai && !jawaban.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#3ED9C0] px-4 py-3 text-[14px] font-extrabold text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
              >
                {nilai ? t("Lanjut") : t("Periksa")}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
