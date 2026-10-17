"use client";
// [jadwal-publik-v1] Kalender jam kosong per bahasa. Calon siswa memilih jam mingguan
// (mis. "Selasa 19.00") lalu dibawa ke /daftar/<bahasa>/private dengan ?jadwal= terisi.
// Jam tidak ditahan; pengajar ditugaskan tim sesudah lunas, jadi nama pengajar sengaja
// tidak ditampilkan.
// [jadwal-blok-v1] Tampilan grid mingguan ala italki: kolom = hari, baris = jam per 30
// menit. Hijau = masih kosong (bisa dipilih), merah = dibuka pengajar tapi sudah terisi
// sesi/batch, abu = tidak dibuka. Semua dihitung dari Availability dashboard pengajar.
// [jadwal-satu-guru-v1] Private = satu pengajar per siswa. Sesudah klik pertama, blok hijau
// hanya jam yang kosong di pengajar yang juga kosong di SEMUA pilihan sebelumnya; sisanya
// abu bergaris. Kalau ada hari yang jadi buntu, "Coba jam lain" menawarkan satu jam yang
// dipegang satu pengajar di semua hari itu.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarCheck, Check, ChevronLeft, ChevronRight, MessageCircle, RefreshCw, UserCheck } from "lucide-react";
import { hhmm, wibInstant, wibOf } from "@/lib/aturJadwal";
import { levelFunnel, profilDariQuery, teksProfil, type ProfilBelajar } from "@/lib/profilBelajar";

const WA_NUMBER = "6282116859493";
const DURASI = [30, 45, 60, 90];
const MAKS_PILIH = 5;
const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const HARI_PENDEK = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

type Hasil = { slot: number[]; guru?: number[][]; terisi?: number[]; adaPengajar: boolean; durasi: number };
type Sel = "kosong" | "terisi" | null;
type Pilihan = { dow: number; menit: number; pertama: number };

const irisan = (a: Set<number>, b: Set<number>) => new Set([...a].filter((x) => b.has(x)));
const rentangHari = (dows: number[]) => {
  const u = [...new Set(dows)].sort((a, b) => a - b);
  const runtut = u.length > 2 && u.every((d, i) => i === 0 || d === u[i - 1] + 1);
  return runtut ? `${HARI_PENDEK[u[0]]}–${HARI_PENDEK[u[u.length - 1]]}` : u.map((d) => HARI_PENDEK[d]).join(", ");
};

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
  const [lihatSaran, setLihatSaran] = useState(false);
  // [cek-jadwal-profil-v1] level/tujuan/minat dari pop-up Cek Jadwal (null kalau buka langsung).
  const [profil, setProfil] = useState<ProfilBelajar | null>(null);
  useEffect(() => { setProfil(profilDariQuery(window.location.search)); }, []);

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
  // Slot → pengajar yang kosong, dan per pengajar: "dow-menit" → kemunculan pertama.
  const { guruDi, jamGuru } = useMemo(() => {
    const guruDi = new Map<number, Set<number>>();
    const jamGuru = new Map<number, Map<string, number>>();
    (hasil?.slot ?? []).forEach((t, i) => {
      const g = hasil?.guru?.[i] ?? [];
      guruDi.set(t, new Set(g));
      const w = wibOf(t);
      const k = `${w.dow}-${w.hh * 60 + w.mi}`;
      for (const no of g) {
        if (!jamGuru.has(no)) jamGuru.set(no, new Map());
        const m = jamGuru.get(no)!;
        if (!m.has(k) || m.get(k)! > t) m.set(k, t);
      }
    });
    return { guruDi, jamGuru };
  }, [hasil]);

  const daftarPilih = [...pilih.values()];
  // Pengajar yang bisa memegang semua pilihan; null = belum memilih (semua boleh).
  const calon = useMemo(() => {
    let c: Set<number> | null = null;
    for (const p of pilih.values()) {
      const g = guruDi.get(p.pertama) ?? new Set<number>();
      c = c ? irisan(c, g) : new Set(g);
    }
    return c;
  }, [pilih, guruDi]);
  const cocok = (t: number) => !calon || [...(guruDi.get(t) ?? [])].some((g) => calon.has(g));

  // Hari yang sebelumnya punya jam hijau tapi sekarang buntu karena saringan.
  const hariBuntu = useMemo(() => {
    if (!calon) return [];
    const dipilih = new Set(daftarPilih.map((p) => p.dow));
    const ada = new Set<number>(), bisa = new Set<number>();
    for (const t of hasil?.slot ?? []) {
      const d = wibOf(t).dow;
      if (dipilih.has(d)) continue;
      ada.add(d);
      if (cocok(t)) bisa.add(d);
    }
    return [...ada].filter((d) => !bisa.has(d)).sort((a, b) => a - b);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calon, hasil, pilih]);

  // Jam (menit-hari) yang dipegang SATU pengajar di semua hari pilihan + hari buntu.
  const saran = useMemo(() => {
    if (!lihatSaran || !daftarPilih.length) return [];
    const dows = [...new Set([...daftarPilih.map((p) => p.dow), ...hariBuntu])].sort((a, b) => a - b);
    const hasilSaran = new Map<number, number[]>(); // menit → [kemunculan pertama per hari]
    for (const jam of jamGuru.values()) {
      const menitSet = new Set([...jam.keys()].map((k) => Number(k.split("-")[1])));
      for (const menit of menitSet) {
        if (hasilSaran.has(menit)) continue;
        const ts = dows.map((d) => jam.get(`${d}-${menit}`));
        if (ts.every((t) => t !== undefined)) hasilSaran.set(menit, ts as number[]);
      }
    }
    const pusat = daftarPilih[0].menit;
    return [...hasilSaran.entries()]
      .sort(([a], [b]) => Math.abs(a - pusat) - Math.abs(b - pusat))
      .slice(0, 3)
      .map(([menit, ts]) => ({ menit, dows, ts }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lihatSaran, pilih, hariBuntu, jamGuru]);

  useEffect(() => { setLihatSaran(false); }, [pilih]);

  const pakaiSaran = (dows: number[], menit: number, ts: number[]) => {
    const baru = new Map<string, Pilihan>();
    dows.slice(0, MAKS_PILIH).forEach((dow, i) => baru.set(`${dow}-${menit}`, { dow, menit, pertama: ts[i] }));
    setPilih(baru);
  };

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

  const preferensi = [teksPreferensi(daftarPilih, durasi), profil ? teksProfil(profil) : ""].filter(Boolean).join(" · ");
  const hrefDaftar = `/daftar/${slug}/private?durasi=${durasi}`
    + (profil ? `&level=${levelFunnel(profil.level)}` : "")
    + (preferensi ? `&jadwal=${encodeURIComponent(preferensi)}` : "");
  const waText = `Halo Linguo, saya mau Kelas Private Bahasa ${langId}.` + (profil ? ` ${teksProfil(profil)}.` : "") + ` Jam yang saya mau: `;

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
            <span className="flex items-center gap-1.5"><i className="h-3 w-3 bg-[#8BC34A]" /> Tersedia</span>
            <span className="flex items-center gap-1.5"><i className="h-3 w-3 bg-rose-200" /> Sudah terisi</span>
            <span className="flex items-center gap-1.5"><i className="h-3 w-3 border border-slate-200 bg-white" /> Tidak tersedia</span>
            <span className="flex items-center gap-1.5"><i className="h-3 w-3 bg-[#1A9E9E]" /> Pilihanmu</span>
            {calon && (
              <span className="flex items-center gap-1.5"><i className="h-3 w-3 border border-slate-200 bg-[repeating-linear-gradient(45deg,#f1f5f9_0_3px,#e2e8f0_3px_6px)]" /> Beda pengajar</span>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Arahkan kursor ke blok untuk melihat jamnya, klik blok hijau untuk memilih jam mulai (sampai {MAKS_PILIH}). Jam yang dipilih jadi jadwal mingguanmu, mis. tiap Selasa 19.00, bersama satu pengajar tetap. Sesudah memilih, blok yang tidak bisa dipegang pengajar yang sama jadi bergaris. Semua jam dalam WIB.
          </p>

          {/* [jadwal-grid-italki-v1] grid kotak rapat bergaris 1px ala italki: tanpa rounded & tanpa teks
              jam di dalam blok; hari, jam & durasi muncul di tooltip saat hover. */}
          <div className="mt-3 max-h-[70vh] overflow-auto rounded-2xl border border-slate-100 bg-white p-2 shadow-sm">
            <div className="grid min-w-[340px] grid-cols-[2.75rem_repeat(7,minmax(0,1fr))] sm:grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]">
              <div className="sticky top-0 z-30 bg-white" />
              {tampil.map(({ awal, w }) => (
                <div key={awal} className="sticky top-0 z-30 bg-white pb-1.5 text-center">
                  <p className="text-[10px] font-semibold uppercase text-slate-400 sm:text-[11px]">{HARI_PENDEK[w.dow]}</p>
                  <p className="text-sm font-extrabold text-slate-900 sm:text-base">{w.d}</p>
                </div>
              ))}
              {barisMenit.map((menit, i) => (
                <Baris key={menit} menit={menit} durasi={durasi} awalBaris={i === 0} tampil={tampil} pilih={pilih} cocok={cocok} onToggle={toggle} />
              ))}
            </div>
          </div>
          {!adaSlot && (
            <p className="mt-2 text-xs text-rose-500">Semua jam yang dibuka pengajar untuk {durasi} menit sedang terisi.</p>
          )}
          {hariBuntu.length > 0 && (
            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <p>
                <b>{hariBuntu.map((d) => HARI[d]).join(", ")}</b> belum ada jam yang bisa dipegang pengajar yang sama dengan pilihanmu.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" onClick={() => setPilih(new Map())} className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100">
                  Mulai ulang pilihan
                </button>
                <button type="button" onClick={() => setLihatSaran(true)} className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:brightness-95">
                  Coba jam lain
                </button>
              </div>
              {lihatSaran && (
                saran.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {saran.map((s) => (
                      <button key={s.menit} type="button" onClick={() => pakaiSaran(s.dows, s.menit, s.ts)} className="rounded-lg border border-emerald-300 bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-200">
                        {rentangHari(s.dows)} {titik(s.menit)} → Pakai jam ini
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs">
                    Belum ada satu pengajar yang kosong di jam yang sama untuk semua hari itu.{" "}
                    <a href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener" className="font-bold underline">Chat admin</a> untuk dicarikan.
                  </p>
                )
              )}
            </div>
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

function Baris({ menit, durasi, awalBaris, tampil, pilih, cocok, onToggle }: {
  menit: number;
  durasi: number;
  awalBaris: boolean;
  tampil: { awal: number; w: { dow: number; d: number; m: number }; sel: Map<number, { t: number; s: Sel }> }[];
  pilih: Map<string, Pilihan>;
  cocok: (t: number) => boolean;
  onToggle: (t: number) => void;
}) {
  const jamBulat = menit % 60 === 0;
  // Garis grid: tiap sel punya garis kanan & bawah; kolom pertama + baris pertama menambah kiri/atas.
  const garis = `border-b border-r border-slate-200 ${awalBaris ? "border-t" : ""}`;
  return (
    <>
      <div className={`pr-1.5 text-right text-[10px] leading-7 tabular-nums sm:text-[11px] ${jamBulat ? "font-semibold text-slate-500" : "text-transparent"}`}>
        {titik(menit)}
      </div>
      {tampil.map(({ awal, w: hari, sel }, kol) => {
        const c = sel.get(menit);
        const tepi = `${garis} ${kol === 0 ? "border-l" : ""}`;
        const label = `${HARI[hari.dow]}, ${hari.d} ${BULAN[hari.m]} · ${titik(menit)}–${titik(menit + durasi)} (${durasi} menit)`;
        // Tooltip di bawah untuk baris teratas (supaya tidak tertutup header lengket), selain itu di atas.
        const tip = (ket: string) => (
          <span
            className={`pointer-events-none absolute z-20 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 ${awalBaris ? "top-full mt-1.5" : "bottom-full mb-1.5"} ${kol >= 5 ? "right-0" : kol <= 1 ? "left-0" : "left-1/2 -translate-x-1/2"}`}
          >
            {label}
            <span className="block text-[10px] font-medium text-slate-300">{ket}</span>
          </span>
        );
        if (!c) return <div key={awal} className={`h-7 bg-white ${tepi}`} />;
        if (c.s === "terisi") {
          return <div key={awal} className={`group relative h-7 bg-rose-200 ${tepi}`}>{tip("Sudah terisi")}</div>;
        }
        const wc = wibOf(c.t);
        const aktif = pilih.has(`${wc.dow}-${menit}`);
        if (!aktif && !cocok(c.t)) {
          return (
            <div key={awal} className={`group relative h-7 bg-[repeating-linear-gradient(45deg,#f1f5f9_0_3px,#e2e8f0_3px_6px)] ${tepi}`}>
              {tip("Beda pengajar dengan pilihanmu")}
            </div>
          );
        }
        const penuh = !aktif && pilih.size >= MAKS_PILIH;
        return (
          <button
            key={awal}
            type="button"
            disabled={penuh}
            onClick={() => onToggle(c.t)}
            aria-label={label}
            className={`group relative flex h-7 items-center justify-center transition-colors hover:z-10 ${tepi} ${aktif
              ? "bg-[#1A9E9E] text-white"
              : "bg-[#8BC34A] hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"}`}
          >
            {aktif && <Check className="h-3.5 w-3.5" />}
            {tip(aktif ? "Pilihanmu · klik untuk batal" : penuh ? `Maksimal ${MAKS_PILIH} jam` : "Tersedia · klik untuk memilih")}
          </button>
        );
      })}
    </>
  );
}
