"use client";
// [jadwal-publik-v1] Kalender jam kosong per bahasa. Calon siswa memilih jam mingguan
// (mis. "Selasa 19.00") lalu dibawa ke /daftar/<bahasa>/private dengan ?jadwal= terisi.
// Jam tidak ditahan; pengajar ditugaskan tim sesudah lunas, jadi nama pengajar sengaja
// tidak ditampilkan.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarCheck, Check, MessageCircle, RefreshCw, UserCheck } from "lucide-react";
import { hhmm, wibInstant, wibOf } from "@/lib/aturJadwal";

const WA_NUMBER = "6282116859493";
const DURASI = [45, 60, 90];
const MAKS_PILIH = 5;
const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const HARI_PENDEK = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

type Hasil = { slot: number[]; adaPengajar: boolean; durasi: number };
type Pilihan = { dow: number; menit: number; pertama: number };

const titik = (menit: number) => hhmm(menit % (24 * 60)).replace(":", ".");
const tglPendek = (ms: number) => { const w = wibOf(ms); return `${w.d} ${BULAN[w.m]}`; };

/** Format yang sama dengan registrations.preferred_schedule yang sudah ada:
 *  "Selasa 19.00-20.00, Kamis 19.00-20.00 (mulai 21 Okt)". */
function teksPreferensi(pilih: Pilihan[], durasi: number) {
  if (!pilih.length) return "";
  const urut = [...pilih].sort((a, b) => a.dow - b.dow || a.menit - b.menit);
  const pertama = Math.min(...pilih.map((p) => p.pertama));
  return urut.map((p) => `${HARI[p.dow]} ${titik(p.menit)}-${titik(p.menit + durasi)}`).join(", ")
    + ` (mulai ${tglPendek(pertama)})`;
}

export default function JadwalPublikClient({ slug, langId }: { slug: string; langEn: string; langId: string }) {
  const [durasi, setDurasi] = useState(60);
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [gagal, setGagal] = useState(false);
  const [pekan, setPekan] = useState(0);
  const [pilih, setPilih] = useState<Map<string, Pilihan>>(new Map());

  useEffect(() => {
    let batal = false;
    setHasil(null);
    setGagal(false);
    fetch(`/api/jadwal-publik?bahasa=${encodeURIComponent(slug)}&durasi=${durasi}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: Hasil) => { if (!batal) setHasil(d); })
      .catch(() => { if (!batal) setGagal(true); });
    return () => { batal = true; };
  }, [slug, durasi]);

  // Ganti durasi = jam selesai berubah, pilihan lama belum tentu muat → kosongkan.
  useEffect(() => { setPilih(new Map()); }, [durasi]);

  // 14 hari mulai besok (jam ≥24 jam ke depan), dipecah dua pekan.
  const hari = useMemo(() => {
    const kini = wibOf(Date.now());
    const slotPerTgl = new Map<string, number[]>();
    for (const t of hasil?.slot ?? []) {
      const w = wibOf(t);
      const k = `${w.y}-${w.m}-${w.d}`;
      slotPerTgl.set(k, [...(slotPerTgl.get(k) ?? []), t]);
    }
    return Array.from({ length: 14 }, (_, i) => {
      const awal = wibInstant(kini.y, kini.m, kini.d + 1 + i);
      const w = wibOf(awal);
      return { awal, w, slot: slotPerTgl.get(`${w.y}-${w.m}-${w.d}`) ?? [] };
    });
  }, [hasil]);
  const tampil = hari.slice(pekan * 7, pekan * 7 + 7);
  const adaSlot = (hasil?.slot.length ?? 0) > 0;

  const toggle = (t: number) => {
    const w = wibOf(t);
    const menit = w.hh * 60 + w.mi;
    const key = `${w.dow}-${menit}`;
    setPilih((lama) => {
      const baru = new Map(lama);
      if (baru.has(key)) baru.delete(key);
      else if (baru.size < MAKS_PILIH) baru.set(key, { dow: w.dow, menit, pertama: t });
      return baru;
    });
  };

  const daftarPilih = [...pilih.values()];
  const preferensi = teksPreferensi(daftarPilih, durasi);
  const hrefDaftar = `/daftar/${slug}/private?durasi=${durasi}` + (preferensi ? `&jadwal=${encodeURIComponent(preferensi)}` : "");
  const waText = `Halo Linguo, saya mau Kelas Private Bahasa ${langId}. Jam yang saya mau: `;

  return (
    <>
      <div className="mt-5 flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-500">Durasi per sesi</span>
        {DURASI.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDurasi(d)}
            className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors ${durasi === d ? "border-[#1A9E9E] bg-[#1A9E9E] text-white" : "border-slate-200 bg-white text-slate-600 hover:border-[#1A9E9E]/50"}`}
          >
            {d} menit
          </button>
        ))}
      </div>

      {!hasil && !gagal && (
        <div className="mt-5 space-y-2">
          {Array.from({ length: 5 }, (_, i) => <div key={i} className="h-14 animate-pulse rounded-2xl bg-slate-200/60" />)}
        </div>
      )}

      {(gagal || (hasil && !adaSlot)) && (
        <div className="mt-5 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold text-slate-900">Jadwal fleksibel, atur bareng admin</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            {gagal
              ? "Jadwal belum bisa dimuat sekarang."
              : hasil?.adaPengajar
                ? `Jam pengajar Bahasa ${langId} untuk ${durasi} menit di 2 minggu ini sedang penuh.`
                : `Jam kosong pengajar Bahasa ${langId} belum dipasang di sini.`}{" "}
            Ceritakan jam yang kamu mau, admin carikan pengajar yang cocok.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waText)}`}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white hover:brightness-95"
            >
              <MessageCircle className="h-4 w-4" /> Chat admin
            </a>
            <Link href={hrefDaftar} className="inline-flex items-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:border-[#1A9E9E] hover:text-[#1A9E9E]">
              Daftar dulu
            </Link>
          </div>
        </div>
      )}

      {hasil && adaSlot && (
        <>
          <div className="mt-5 flex rounded-xl bg-slate-100 p-1">
            {[0, 1].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPekan(p)}
                className={`flex-1 rounded-lg py-2 text-xs font-bold transition-colors ${pekan === p ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
              >
                {tglPendek(hari[p * 7].awal)} – {tglPendek(hari[p * 7 + 6].awal)}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Pilih sampai {MAKS_PILIH} jam. Jam yang dipilih jadi jadwal mingguanmu (mis. tiap Selasa 19.00). Semua jam dalam WIB.
          </p>

          <div className="mt-3 space-y-2">
            {tampil.map(({ awal, w, slot }) => (
              <div key={awal} className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold text-slate-900">{HARI[w.dow]}</span>
                  <span className="text-xs text-slate-400">{HARI_PENDEK[w.dow]}, {w.d} {BULAN[w.m]}</span>
                </div>
                {slot.length === 0 ? (
                  <p className="mt-1.5 text-xs text-slate-400">Belum ada jam kosong</p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {slot.map((t) => {
                      const s = wibOf(t);
                      const menit = s.hh * 60 + s.mi;
                      const aktif = pilih.has(`${s.dow}-${menit}`);
                      const penuh = !aktif && pilih.size >= MAKS_PILIH;
                      return (
                        <button
                          key={t}
                          type="button"
                          disabled={penuh}
                          onClick={() => toggle(t)}
                          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold tabular-nums transition-colors ${aktif ? "border-[#1A9E9E] bg-[#1A9E9E] text-white" : "border-slate-200 text-slate-700 hover:border-[#1A9E9E] hover:text-[#1A9E9E] disabled:opacity-40"}`}
                        >
                          {aktif && <Check className="h-3 w-3" />}
                          {titik(menit)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <ul className="mt-6 space-y-2.5 text-sm text-slate-600">
        <li className="flex gap-2"><UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#1A9E9E]" /> Pengajar dicocokkan dengan level, tujuan belajar, dan jam pilihanmu.</li>
        <li className="flex gap-2"><RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-[#1A9E9E]" /> Kurang cocok dengan pengajarnya? Bisa minta ganti pengajar.</li>
        <li className="flex gap-2"><CalendarCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#1A9E9E]" /> Jadwal dikonfirmasi tim lewat WhatsApp setelah pembayaran.</li>
      </ul>

      {pilih.size > 0 && (
        // pr-24: tombol chat Ling (fixed kanan-bawah, 64px) jangan menutupi "Lanjut daftar".
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 py-3 pl-4 pr-24 lg:pr-4 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Jadwal pilihanmu · {durasi} menit</p>
              <p className="truncate text-sm font-bold text-slate-900">
                {[...daftarPilih].sort((a, b) => a.dow - b.dow || a.menit - b.menit).map((p) => `${HARI_PENDEK[p.dow]} ${titik(p.menit)}`).join(" · ")}
              </p>
            </div>
            <Link href={hrefDaftar} className="shrink-0 rounded-xl bg-[#1A9E9E] px-4 py-2.5 text-sm font-bold text-white hover:brightness-95">
              Lanjut daftar
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
