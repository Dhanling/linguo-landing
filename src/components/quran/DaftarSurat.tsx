"use client";
// [quran-reader-v1] Laci daftar surat & juz untuk loncat halaman di /alquran.
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { JUMLAH_HALAMAN, JUZ_MULAI, type Surat } from "@/lib/quran/sumber";
import { TombolPutarSurat, type PemutarSurat } from "./MushafReader";

const TEAL = "#1A9E9E";

// "Al-Baqarah" / "al baqoroh" / "baqarah" → sama-sama ketemu.
const normal = (s: string) =>
  s
    .toLowerCase()
    .replace(/^al[\s-]*/, "")
    .replace(/[^a-z0-9]/g, "")
    .replace(/o/g, "a")
    .replace(/(.)\1+/g, "$1");

export default function DaftarSurat({
  buka,
  onTutup,
  daftar,
  fontArab,
  pemutar,
  onPilihHalaman,
}: {
  buka: boolean;
  onTutup: () => void;
  daftar: Surat[];
  fontArab: string;
  pemutar: PemutarSurat;
  onPilihHalaman: (n: number) => void;
}) {
  const [tab, setTab] = useState<"surat" | "juz">("surat");
  const [cari, setCari] = useState("");
  const [halInput, setHalInput] = useState("");

  const hasil = useMemo(() => {
    const q = cari.trim();
    if (!q) return daftar;
    if (/^\d+$/.test(q)) return daftar.filter((s) => String(s.id).startsWith(q));
    const n = normal(q);
    return daftar.filter((s) => normal(s.nama).includes(n) || s.arti.toLowerCase().includes(q.toLowerCase()));
  }, [cari, daftar]);

  return (
    <AnimatePresence>
      {buka && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onTutup}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 36 }}
            className="fixed inset-y-0 left-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between px-4 pb-2 pt-4">
              <div className="flex rounded-xl bg-stone-100 p-1">
                {(["surat", "juz"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`rounded-lg px-4 py-1.5 text-sm font-semibold capitalize ${
                      tab === t ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <button onClick={onTutup} className="grid h-9 w-9 place-items-center rounded-full hover:bg-stone-100" aria-label="Tutup">
                <X size={20} />
              </button>
            </div>

            <div className="px-4 pb-3">
              {tab === "surat" ? (
                <label className="flex items-center gap-2 rounded-xl bg-stone-100 px-3 py-2.5">
                  <Search size={16} className="text-stone-400" />
                  <input
                    value={cari}
                    onChange={(e) => setCari(e.target.value)}
                    placeholder="Cari surat (nama / nomor / arti)"
                    className="w-full bg-transparent text-base outline-none placeholder:text-stone-400 sm:text-sm"
                  />
                </label>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const n = Number(halInput);
                    if (n >= 1 && n <= JUMLAH_HALAMAN) onPilihHalaman(n);
                  }}
                  className="flex gap-2"
                >
                  <input
                    value={halInput}
                    onChange={(e) => setHalInput(e.target.value.replace(/\D/g, ""))}
                    inputMode="numeric"
                    placeholder={`Ke halaman (1–${JUMLAH_HALAMAN})`}
                    className="w-full rounded-xl bg-stone-100 px-3 py-2.5 text-base outline-none sm:text-sm"
                  />
                  <button className="rounded-xl px-4 text-sm font-semibold text-white" style={{ background: TEAL }}>
                    Buka
                  </button>
                </form>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-6">
              {tab === "surat" ? (
                <ul>
                  {hasil.map((s) => (
                    <li key={s.id} className="group flex items-center rounded-xl pr-2 hover:bg-stone-50">
                      <button
                        onClick={() => onPilihHalaman(s.halaman[0])}
                        className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left"
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-stone-100 text-xs font-bold text-stone-600">
                          {s.id}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-stone-800">{s.nama}</span>
                          <span className="block truncate text-xs text-stone-500">
                            {s.arti} · {s.jumlahAyat} ayat · {s.tempat === "makkah" ? "Makkiyah" : "Madaniyah"}
                          </span>
                        </span>
                        <span dir="rtl" className={`${fontArab} shrink-0 text-xl text-stone-700`}>
                          {s.namaArab}
                        </span>
                      </button>
                      <TombolPutarSurat surat={s.id} pemutar={pemutar} />
                    </li>
                  ))}
                  {hasil.length === 0 && <li className="px-3 py-6 text-center text-sm text-stone-500">Surat tidak ditemukan.</li>}
                </ul>
              ) : (
                <div className="grid grid-cols-3 gap-2 px-2">
                  {JUZ_MULAI.map((hal, i) => (
                    <button
                      key={i}
                      onClick={() => onPilihHalaman(hal)}
                      className="rounded-xl bg-stone-50 px-2 py-3 text-center ring-1 ring-stone-200 hover:bg-stone-100"
                    >
                      <span className="block text-sm font-bold text-stone-800">Juz {i + 1}</span>
                      <span className="block text-[11px] text-stone-500">hal. {hal}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
