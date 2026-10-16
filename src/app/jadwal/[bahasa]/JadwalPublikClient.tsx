"use client";
// [jadwal-publik-v1] Kalender jam kosong per bahasa. Calon siswa memilih jam mingguan
// (mis. "Selasa 19.00") lalu dibawa ke /daftar/<bahasa>/private dengan ?jadwal= terisi.
// Jam tidak ditahan; pengajar ditugaskan tim sesudah lunas, jadi nama pengajar sengaja
// tidak ditampilkan.
// [jadwal-blok-v1] Tampilan grid mingguan ala italki: kolom = hari, baris = jam per 30
// menit. Hijau = masih kosong (bisa dipilih), merah = dibuka pengajar tapi sudah terisi
// sesi/batch, abu = tidak dibuka. Semua dihitung dari Availability dashboard pengajar.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarCheck, Check, ChevronLeft, ChevronRight, MessageCircle, RefreshCw, UserCheck } from "lucide-react";
import { hhmm, wibInstant, wibOf } from "@/lib/aturJadwal";

const WA_NUMBER = "6282116859493";
const DURASI = [45, 60, 90];
const MAKS_PILIH = 5;
const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const HARI_PENDEK = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

type Hasil = { slot: number[]; terisi?: number[]; adaPengajar: boolean; durasi: number };
type Sel = "kosong" | "terisi" | null;
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

  // 14 hari mulai besok (jam ≥24 jam ke depan), dipecah dua pekan. Tiap hari memetakan
  // menit-hari → status sel.
  const { hari, barisMenit } = useMemo(() => {
    const kini = wibOf(Date.now());
    const sel = new Map<string, Map<number, { t: number; s: Sel }>>();
    let min = Infinity, max = -Infinity;
    const isi = (t: number, st: Sel) => {
      const w = wibOf(t);
      const k = `${w.y}-${w.m}-${w.d}`;
      const menit = w.hh * 60 + w.mi;
      if (!sel.has(k)) sel.set(k, new Map());
      sel.get(k)!.set(menit, { t, s: st });
      min = Math.min(min, menit);
      max = Math.max(max, menit);
    };
    for (const t of hasil?.terisi ?? []) isi(t, "terisi");
    for (const t of hasil?.slot ?? []) isi(t, "kosong");
    const hari = Array.from({ length: 14 }, (_, i) => {
      const awal = wibInstant(kini.y, kini.m, kini.d + 1 + i);
      const w = wibOf(awal);
      return { awal, w, sel: sel.get(`${w.y}-${w.m}-${w.d}`) ?? new Map<number, { t: number; s: Sel }>() };
    });
    const barisMenit: number[] = [];
    if (Number.isFinite(min)) {
      // Rapikan ke jam bulat supaya grid mulai & berakhir di jam penuh.
      for (let m = Math.floor(min / 60) * 60; m <= max; m += 30) barisMenit.push(m);
    }
    return { hari, barisMenit };
  }, [hasil]);
  const tampil = hari.slice(pekan * 7, pekan * 7 + 7);
  const adaSlot = (hasil?.slot.length ?? 0) > 0;
  const adaGrid = barisMenit.length > 0;

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

      {hasil && adaGrid && (
        <>
          <div className="mt-5 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setPekan(0)}
              disabled={pekan === 0}
              aria-label="Pekan sebelumnya"
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 hover:border-[#1A9E9E] hover:text-[#1A9E9E] disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-bold text-slate-900">
              {tglPendek(hari[pekan * 7].awal)} – {tglPendek(hari[pekan * 7 + 6].awal)} {wibOf(hari[pekan * 7 + 6].awal).y}
            </p>
            <button
              type="button"
              onClick={() => setPekan(1)}
              disabled={pekan === 1}
              aria-label="Pekan berikutnya"
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 hover:border-[#1A9E9E] hover:text-[#1A9E9E] disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
            <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-sm border border-emerald-300 bg-emerald-100" /> Tersedia</span>
            <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-sm border border-rose-200 bg-rose-100" /> Sudah terisi</span>
            <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-sm bg-slate-100" /> Tidak tersedia</span>
            <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-sm bg-[#1A9E9E]" /> Pilihanmu</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Klik blok hijau untuk memilih jam mulai (sampai {MAKS_PILIH}). Jam yang dipilih jadi jadwal mingguanmu, mis. tiap Selasa 19.00. Semua jam dalam WIB.
          </p>

          <div className="mt-3 max-h-[70vh] overflow-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="grid min-w-[340px] grid-cols-[2.75rem_repeat(7,minmax(0,1fr))] gap-[3px] p-2 sm:grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]">
              <div className="sticky top-0 z-10 bg-white" />
              {tampil.map(({ awal, w }) => (
                <div key={awal} className="sticky top-0 z-10 bg-white pb-1.5 text-center">
                  <p className="text-[10px] font-semibold uppercase text-slate-400 sm:text-[11px]">{HARI_PENDEK[w.dow]}</p>
                  <p className="text-sm font-extrabold text-slate-900 sm:text-base">{w.d}</p>
                </div>
              ))}
              {barisMenit.map((menit) => (
                <Baris key={menit} menit={menit} tampil={tampil} pilih={pilih} onToggle={toggle} />
              ))}
            </div>
          </div>
          {!adaSlot && (
            <p className="mt-2 text-xs text-rose-500">Semua jam yang dibuka pengajar untuk {durasi} menit sedang terisi.</p>
          )}
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
          <div className="mx-auto flex max-w-3xl items-center gap-3">
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

function Baris({ menit, tampil, pilih, onToggle }: {
  menit: number;
  tampil: { awal: number; sel: Map<number, { t: number; s: Sel }> }[];
  pilih: Map<string, Pilihan>;
  onToggle: (t: number) => void;
}) {
  const jamBulat = menit % 60 === 0;
  return (
    <>
      <div className={`pr-1 text-right text-[10px] tabular-nums leading-7 sm:text-[11px] ${jamBulat ? "font-semibold text-slate-500" : "text-slate-300"}`}>
        {titik(menit)}
      </div>
      {tampil.map(({ awal, sel }) => {
        const c = sel.get(menit);
        if (!c) return <div key={awal} className="h-7 rounded bg-slate-100/70" />;
        if (c.s === "terisi") {
          return <div key={awal} title={`${titik(menit)} sudah terisi`} className="h-7 rounded border border-rose-200 bg-rose-100" />;
        }
        const w = wibOf(c.t);
        const aktif = pilih.has(`${w.dow}-${menit}`);
        const penuh = !aktif && pilih.size >= MAKS_PILIH;
        return (
          <button
            key={awal}
            type="button"
            disabled={penuh}
            onClick={() => onToggle(c.t)}
            title={`${titik(menit)} tersedia`}
            className={`flex h-7 items-center justify-center rounded text-[10px] font-bold tabular-nums transition-colors sm:text-[11px] ${aktif
              ? "bg-[#1A9E9E] text-white shadow-sm"
              : "border border-emerald-300 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"}`}
          >
            {aktif ? <Check className="h-3.5 w-3.5" /> : <span className="hidden sm:inline">{titik(menit)}</span>}
          </button>
        );
      })}
    </>
  );
}
