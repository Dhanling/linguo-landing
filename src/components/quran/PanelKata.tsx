"use client";
// [quran-reader-v1] Panel analisa kata: arti, audio per kata, bedah sharaf per
// segmen (awalan/batang/akhiran), lalu i'rab satu ayat penuh lewat AI.
import { useEffect, useState } from "react";
import { Volume2, X, Sparkles, Loader2, Play, Pause, RotateCcw } from "lucide-react";
import type { Ayat, HasilIrab, Kata } from "@/lib/quran/sumber";
import { AUDIO_AYAT, AUDIO_KATA } from "@/lib/quran/sumber";
import { eja, ringkasKata, romawi, uraiSegmen, type Segmen } from "@/lib/quran/morfologi";
import { morfologiKata } from "./data";

const TEAL = "#1A9E9E";

const WARNA_JENIS: Record<Segmen["jenis"], string> = {
  isim: "bg-sky-50 text-sky-700 ring-sky-200",
  "fi'il": "bg-rose-50 text-rose-700 ring-rose-200",
  harf: "bg-amber-50 text-amber-800 ring-amber-200",
};

const irabCache = new Map<string, HasilIrab>();

export default function PanelKata({
  kata,
  ayat,
  namaSurat,
  fontArab,
  onTutup,
  onPilihKata,
  audio,
}: {
  kata: Kata;
  ayat: Ayat;
  namaSurat: string;
  fontArab: string;
  onTutup: () => void;
  onPilihKata: (k: Kata) => void;
  audio: {
    putar: (url: string, id: string) => void;
    berhenti: () => void;
    aktif: string | null;
  };
}) {
  const [segmen, setSegmen] = useState<Segmen[] | null>(null);
  const [irab, setIrab] = useState<{ status: "idle" | "muat" | "gagal" | "ok"; data?: HasilIrab }>({
    status: "idle",
  });

  useEffect(() => {
    let batal = false;
    setSegmen(null);
    morfologiKata(kata.lok)
      .then((s) => !batal && setSegmen(s ? s.map(uraiSegmen) : []))
      .catch(() => !batal && setSegmen([]));
    return () => {
      batal = true;
    };
  }, [kata.lok]);

  // I'rab milik ayat, bukan kata — tetap tampil saat pengguna pindah kata di ayat yang sama.
  useEffect(() => {
    const c = irabCache.get(ayat.key);
    setIrab(c ? { status: "ok", data: c } : { status: "idle" });
  }, [ayat.key]);

  const muatIrab = async () => {
    setIrab({ status: "muat" });
    try {
      const r = await fetch(`/api/quran/irab?ayat=${ayat.key}`);
      if (!r.ok) throw new Error();
      const data: HasilIrab = await r.json();
      irabCache.set(ayat.key, data);
      setIrab({ status: "ok", data });
    } catch {
      setIrab({ status: "gagal" });
    }
  };

  const nomorKata = Number(kata.lok.split(":")[2]);
  const kataAyat = ayat.kata.filter((k) => !k.akhir);
  const urlAyat = `${AUDIO_AYAT}Alafasy/mp3/${String(ayat.surat).padStart(3, "0")}${String(ayat.ayat).padStart(3, "0")}.mp3`;
  const idAyat = `ayat-${ayat.key}`;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-stone-200 px-5 pb-4 pt-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
            QS {namaSurat} {ayat.ayat} · kata ke-{nomorKata}
          </p>
          <div className="mt-1 flex items-center gap-3">
            <span dir="rtl" className={`${fontArab} text-4xl leading-[1.6] text-stone-900`}>
              {kata.ar}
            </span>
            {kata.audio && (
              <button
                onClick={() => audio.putar(AUDIO_KATA + kata.audio, kata.lok)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white transition active:scale-95"
                style={{ background: TEAL }}
                aria-label="Dengarkan kata"
              >
                <Volume2 size={17} />
              </button>
            )}
          </div>
          <p className="text-sm italic text-stone-500">{kata.latin}</p>
          <p className="mt-1 text-lg font-semibold text-stone-800">{kata.arti}</p>
        </div>
        <button
          onClick={onTutup}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-stone-500 hover:bg-stone-100"
          aria-label="Tutup"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        {/* Bedah sharaf */}
        <section>
          <h3 className="text-sm font-bold text-stone-800">Analisa sharaf</h3>
          {segmen === null ? (
            <div className="mt-3 h-24 animate-pulse rounded-xl bg-stone-100" />
          ) : segmen.length === 0 ? (
            <p className="mt-2 text-sm text-stone-500">Data morfologi kata ini belum tersedia.</p>
          ) : (
            <>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{ringkasKata(segmen)}</p>
              <ol className="mt-3 space-y-2">
                {segmen.map((s, i) => (
                  <li key={i} className="rounded-xl border border-stone-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${WARNA_JENIS[s.jenis]}`}
                        >
                          {s.peran === "batang" ? s.jenis : `${s.peran} · ${s.jenis}`}
                        </span>
                        <p className="mt-1.5 text-sm font-semibold text-stone-800">{s.label}</p>
                        <p dir="rtl" className={`${fontArab} text-right text-sm text-stone-500 sm:text-left`}>
                          {s.labelArab}
                        </p>
                      </div>
                      <span dir="rtl" className={`${fontArab} shrink-0 text-3xl leading-[1.5] text-stone-900`}>
                        {s.bentuk}
                      </span>
                    </div>
                    {(s.ciri.length > 0 || s.akar || s.wazan) && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {s.ciri.map((c) => (
                          <span
                            key={c}
                            className={`rounded-md px-2 py-0.5 text-xs ${
                              c === s.irab ? "bg-teal-50 font-semibold text-teal-800" : "bg-stone-100 text-stone-600"
                            }`}
                          >
                            {c}
                          </span>
                        ))}
                        {s.akar && (
                          <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                            akar <b dir="rtl" className={`${fontArab} text-sm`}>{eja(s.akar)}</b>
                          </span>
                        )}
                        {s.wazan && (
                          <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                            bab {romawi(s.wazan.nomor)}{" "}
                            <b dir="rtl" className={`${fontArab} text-sm`}>{s.wazan.pola}</b>
                          </span>
                        )}
                        {s.lema && s.peran === "batang" && (
                          <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                            bentuk dasar <b dir="rtl" className={`${fontArab} text-sm`}>{s.lema}</b>
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>

        {/* Ayat */}
        <section className="rounded-2xl bg-stone-50 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-stone-800">
              Ayat {ayat.ayat} — terjemah Kemenag
            </h3>
            <button
              onClick={() => (audio.aktif === idAyat ? audio.berhenti() : audio.putar(urlAyat, idAyat))}
              className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 ring-1 ring-stone-200 hover:bg-stone-100"
            >
              {audio.aktif === idAyat ? <Pause size={13} /> : <Play size={13} />}
              Murattal
            </button>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-stone-700">{ayat.terjemah}</p>
        </section>

        {/* I'rab AI */}
        <section>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-stone-800">I&apos;rab ayat</h3>
            {irab.status === "ok" && <span className="text-[11px] text-stone-400">dibantu AI · cek ke pengajar</span>}
          </div>
          {irab.status === "idle" && (
            <button
              onClick={muatIrab}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition active:scale-[.98]"
              style={{ background: TEAL }}
            >
              <Sparkles size={16} /> Analisa i&apos;rab ayat ini
            </button>
          )}
          {irab.status === "muat" && (
            <div className="mt-2 flex items-center gap-2 rounded-xl bg-stone-50 px-4 py-3 text-sm text-stone-500">
              <Loader2 size={16} className="animate-spin" /> Menguraikan kedudukan tiap kata…
            </div>
          )}
          {irab.status === "gagal" && (
            <button
              onClick={muatIrab}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-stone-100 px-4 py-3 text-sm font-semibold text-stone-700"
            >
              <RotateCcw size={15} /> Gagal memuat — coba lagi
            </button>
          )}
          {irab.status === "ok" && irab.data && (
            <div className="mt-2 space-y-3">
              {irab.data.struktur && (
                <p className="rounded-xl bg-teal-50 p-3 text-sm leading-relaxed text-teal-900">{irab.data.struktur}</p>
              )}
              <ol className="divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200 bg-white">
                {irab.data.kata.map((r) => {
                  const k = kataAyat[r.no - 1];
                  const aktif = r.no === nomorKata;
                  return (
                    <li key={r.no}>
                      <button
                        onClick={() => k && onPilihKata(k)}
                        className={`flex w-full items-start gap-3 px-3 py-2.5 text-left transition ${
                          aktif ? "bg-teal-50" : "hover:bg-stone-50"
                        }`}
                      >
                        <span dir="rtl" className={`${fontArab} w-20 shrink-0 text-right text-xl leading-[1.7] text-stone-900`}>
                          {k?.ar ?? r.ar}
                        </span>
                        <span className="min-w-0 text-sm">
                          <span className="block font-semibold text-stone-800">{r.irab}</span>
                          <span className="block text-stone-500">{r.fungsi}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
              {irab.data.catatan.length > 0 && (
                <ul className="space-y-1.5 text-sm text-stone-600">
                  {irab.data.catatan.map((c, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: TEAL }} />
                      {c}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>

        <p className="pb-2 text-[11px] leading-relaxed text-stone-400">
          Teks, terjemah & audio: Quran.com. Morfologi: Quranic Arabic Corpus (corpus.quran.com, GNU GPL).
        </p>
      </div>
    </div>
  );
}
