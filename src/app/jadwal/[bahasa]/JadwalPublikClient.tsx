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
// [jadwal-pola-mingguan-v1] Grid = POLA mingguan (Senin–Minggu, tanpa tanggal). Data 14 hari
// digabung per "hari-jam": hijau kalau ada pengajar kosong di jam itu pada salah satu pekan.
// Tanggal mulai disepakati bareng pengajar sesudah daftar, jadi teks preferensi tak lagi
// memuat "(mulai …)". Siswa juga memilih pola Tetap (jam yang sama tiap minggu) atau
// Fleksibel (atur per sesi sendiri di /akun lewat atur-jadwal) — keduanya tetap 1 pengajar.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarCheck, CalendarClock, Check, MessageCircle, Repeat, RefreshCw, UserCheck } from "lucide-react";
import { hhmm, wibOf } from "@/lib/aturJadwal";
import { levelFunnel, profilDariQuery, teksProfil, type ProfilBelajar } from "@/lib/profilBelajar";

const WA_NUMBER = "6282116859493";
const DURASI = [30, 45, 60, 90];
const MAKS_PILIH = 5;
const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const HARI_PENDEK = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
// 1 sub-level = 16 sesi (saran, bukan minimum) — dipakai untuk perkiraan lama belajar.
const SESI_SUBLEVEL = 16;
// Sama dengan SESSION_OPTS di /daftar (FunnelFlow) & create-funnel-invoice.
const SESI_OPTS = [4, 8, 12, 16, 24];

type Hasil = { slot: number[]; guru?: number[][]; terisi?: number[]; adaPengajar: boolean; durasi: number };
type Pola = "tetap" | "fleksibel";
/** Satu sel pola mingguan, kunci "dow-menit". guru = pengajar yang kosong di jam itu
 *  pada salah satu pekan; kosong + ada terisi = merah. */
type Sel = { s: "kosong" | "terisi"; guru: Set<number> };
type Pilihan = { dow: number; menit: number };
const kunci = (dow: number, menit: number) => `${dow}-${menit}`;

const irisan = (a: Set<number>, b: Set<number>) => new Set([...a].filter((x) => b.has(x)));
const rentangHari = (dows: number[]) => {
  const u = [...new Set(dows)].sort((a, b) => a - b);
  const runtut = u.length > 2 && u.every((d, i) => i === 0 || d === u[i - 1] + 1);
  return runtut ? `${HARI_PENDEK[u[0]]}–${HARI_PENDEK[u[u.length - 1]]}` : u.map((d) => HARI_PENDEK[d]).join(", ");
};

const titik = (menit: number) => hhmm(menit % (24 * 60)).replace(":", ".");
const urutkan = (pilih: Pilihan[]) => [...pilih].sort((a, b) => a.dow - b.dow || a.menit - b.menit);

/** Teks → leads.schedule_preference → registrations.preferred_schedule. Jam ditulis
 *  "Selasa 19.00-20.00, Kamis 19.00-20.00" (format yang dibaca form pendataan), lalu
 *  pola & catatan tanggal di belakang " · ". */
function teksPreferensi(pilih: Pilihan[], durasi: number, pola: Pola) {
  const jam = urutkan(pilih).map((p) => `${HARI[p.dow]} ${titik(p.menit)}-${titik(p.menit + durasi)}`).join(", ");
  if (pola === "fleksibel") {
    return [jam, "Jadwal fleksibel, atur per sesi di dashboard siswa"].filter(Boolean).join(" · ");
  }
  return jam ? `${jam} · Tetap tiap minggu · Tanggal mulai disepakati dengan pengajar` : "";
}

/** "2 sesi/minggu → 16 sesi ± 8 minggu". */
function perkiraanLama(perMinggu: number, sesi: number) {
  if (!perMinggu) return "";
  return `${perMinggu} sesi/minggu → ${sesi} sesi ± ${Math.ceil(sesi / perMinggu)} minggu`;
}

function ketSesi(sesi: number) {
  if (sesi < SESI_SUBLEVEL) return `${sesi} sesi belum menuntaskan 1 sub-level — sisanya bisa ditambah nanti tanpa mulai ulang.`;
  if (sesi === SESI_SUBLEVEL) return "Pas 1 sub-level (mis. A1.1), sampai siap naik ke level berikutnya.";
  return `${sesi} sesi ≈ ${(sesi / SESI_SUBLEVEL).toLocaleString("id-ID", { maximumFractionDigits: 1 })} sub-level.`;
}

export default function JadwalPublikClient({ slug, langId }: { slug: string; langEn: string; langId: string }) {
  const [durasi, setDurasi] = useState(60);
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [gagal, setGagal] = useState(false);
  const [pola, setPola] = useState<Pola>("tetap");
  const [sesi, setSesi] = useState(SESI_SUBLEVEL);
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

  // Data 14 hari ke depan → pola mingguan. Sel = gabungan semua pekan per "hari-jam".
  const { pola7, barisMenit } = useMemo(() => {
    const pola7 = new Map<string, Sel>();
    let min = Infinity, max = -Infinity;
    const ambil = (t: number) => {
      const w = wibOf(t);
      const menit = w.hh * 60 + w.mi;
      min = Math.min(min, menit);
      max = Math.max(max, menit);
      const k = kunci(w.dow, menit);
      if (!pola7.has(k)) pola7.set(k, { s: "terisi", guru: new Set() });
      return pola7.get(k)!;
    };
    for (const t of hasil?.terisi ?? []) ambil(t);
    (hasil?.slot ?? []).forEach((t, i) => {
      const sel = ambil(t);
      sel.s = "kosong";
      for (const g of hasil?.guru?.[i] ?? []) sel.guru.add(g);
    });
    const barisMenit: number[] = [];
    if (Number.isFinite(min)) {
      // Rapikan ke jam bulat supaya grid mulai & berakhir di jam penuh.
      for (let m = Math.floor(min / 60) * 60; m <= max; m += 30) barisMenit.push(m);
    }
    return { pola7, barisMenit };
  }, [hasil]);
  // Per pengajar: kumpulan "hari-jam" yang dia kosong.
  const jamGuru = useMemo(() => {
    const jamGuru = new Map<number, Set<string>>();
    for (const [k, sel] of pola7) {
      if (sel.s !== "kosong") continue;
      for (const g of sel.guru) {
        if (!jamGuru.has(g)) jamGuru.set(g, new Set());
        jamGuru.get(g)!.add(k);
      }
    }
    return jamGuru;
  }, [pola7]);

  const daftarPilih = [...pilih.values()];
  // Pengajar yang bisa memegang semua pilihan; null = belum memilih (semua boleh).
  const calon = useMemo(() => {
    let c: Set<number> | null = null;
    for (const k of pilih.keys()) {
      const g = pola7.get(k)?.guru ?? new Set<number>();
      c = c ? irisan(c, g) : new Set(g);
    }
    return c;
  }, [pilih, pola7]);
  const cocok = (k: string) => !calon || [...(pola7.get(k)?.guru ?? [])].some((g) => calon.has(g));

  // Hari yang sebelumnya punya jam hijau tapi sekarang buntu karena saringan.
  const hariBuntu = useMemo(() => {
    if (!calon) return [];
    const dipilih = new Set(daftarPilih.map((p) => p.dow));
    const ada = new Set<number>(), bisa = new Set<number>();
    for (const [k, sel] of pola7) {
      const d = Number(k.split("-")[0]);
      if (sel.s !== "kosong" || dipilih.has(d)) continue;
      ada.add(d);
      if (cocok(k)) bisa.add(d);
    }
    return [...ada].filter((d) => !bisa.has(d)).sort((a, b) => a - b);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calon, pola7, pilih]);

  // Jam (menit-hari) yang dipegang SATU pengajar di semua hari pilihan + hari buntu.
  const saran = useMemo(() => {
    if (!lihatSaran || !daftarPilih.length) return [];
    const dows = [...new Set([...daftarPilih.map((p) => p.dow), ...hariBuntu])].sort((a, b) => a - b);
    const hasilSaran = new Set<number>();
    for (const jam of jamGuru.values()) {
      for (const k of jam) {
        const menit = Number(k.split("-")[1]);
        if (!hasilSaran.has(menit) && dows.every((d) => jam.has(kunci(d, menit)))) hasilSaran.add(menit);
      }
    }
    const pusat = daftarPilih[0].menit;
    return [...hasilSaran]
      .sort((a, b) => Math.abs(a - pusat) - Math.abs(b - pusat))
      .slice(0, 3)
      .map((menit) => ({ menit, dows }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lihatSaran, pilih, hariBuntu, jamGuru]);

  useEffect(() => { setLihatSaran(false); }, [pilih]);

  const pakaiSaran = (dows: number[], menit: number) => {
    const baru = new Map<string, Pilihan>();
    dows.slice(0, MAKS_PILIH).forEach((dow) => baru.set(kunci(dow, menit), { dow, menit }));
    setPilih(baru);
  };

  const adaSlot = (hasil?.slot.length ?? 0) > 0;
  const adaGrid = barisMenit.length > 0;

  const toggle = (dow: number, menit: number) => {
    const key = kunci(dow, menit);
    setPilih((lama) => {
      const baru = new Map(lama);
      if (baru.has(key)) baru.delete(key);
      else if (baru.size < MAKS_PILIH) baru.set(key, { dow, menit });
      return baru;
    });
  };

  const preferensi = [teksPreferensi(daftarPilih, durasi, pola), profil ? teksProfil(profil) : ""].filter(Boolean).join(" · ");
  const hrefDaftar = `/daftar/${slug}/private?durasi=${durasi}`
    + `&sesi=${sesi}`
    + (profil ? `&level=${levelFunnel(profil.level)}` : "")
    + (preferensi ? `&jadwal=${encodeURIComponent(preferensi)}` : "");
  const waText = `Halo Linguo, saya mau Kelas Private Bahasa ${langId}.` + (profil ? ` ${teksProfil(profil)}.` : "") + ` Jam yang saya mau: `;

  return (
    <>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-500">Durasi per sesi</span>
        {DURASI.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDurasi(d)}
            className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold transition-colors ${durasi === d ? "border-[#1A9E9E] bg-[#1A9E9E] text-white" : "border-slate-200 bg-white text-slate-600 hover:border-[#1A9E9E]/50"}`}
          >
            {d} menit
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-500">Jumlah sesi</span>
        {SESI_OPTS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setSesi(n)}
            className={`relative whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold transition-colors ${sesi === n ? "border-[#1A9E9E] bg-[#1A9E9E] text-white" : "border-slate-200 bg-white text-slate-600 hover:border-[#1A9E9E]/50"}`}
          >
            {n} sesi
            {n === SESI_SUBLEVEL && (
              <span className="absolute -top-2 right-0 rounded-full bg-amber-400 px-1 text-[8px] font-extrabold uppercase leading-3 text-white">Saran</span>
            )}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-xs text-slate-500">{ketSesi(sesi)} Bisa diubah lagi di langkah daftar.</p>

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
                ? `Jam pengajar Bahasa ${langId} untuk ${durasi} menit sedang penuh.`
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
          {/* [jadwal-pola-mingguan-v1] Tetap = jam sama tiap minggu; Fleksibel = atur per sesi di /akun. */}
          <div className="mt-5 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Pola jadwal">
            {([
              { key: "tetap", Icon: Repeat, judul: "Jadwal tetap tiap minggu", ket: "Pilih jam di bawah, misalnya tiap Selasa & Kamis 19.00. Tanggal mulai disepakati bareng pengajar." },
              { key: "fleksibel", Icon: CalendarClock, judul: "Fleksibel, atur per sesi", ket: "Jam boleh beda tiap minggu. Sesudah lunas, kamu pesan/pindah sesi sendiri di dashboard siswa (paling lambat H-1)." },
            ] as const).map(({ key, Icon, judul, ket }) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={pola === key}
                onClick={() => setPola(key)}
                className={`flex gap-2.5 rounded-2xl border-2 p-3 text-left transition-colors ${pola === key ? "border-[#1A9E9E] bg-[#1A9E9E]/5" : "border-slate-100 bg-white hover:border-[#1A9E9E]/40"}`}
              >
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${pola === key ? "text-[#1A9E9E]" : "text-slate-400"}`} />
                <span>
                  <span className="block text-sm font-bold text-slate-900">{judul}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{ket}</span>
                </span>
              </button>
            ))}
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
            {pola === "tetap"
              ? <>Ini pola mingguan, bukan tanggal. Klik blok hijau untuk memilih jam mulai (sampai {MAKS_PILIH}), mis. tiap Selasa 19.00, bersama satu pengajar tetap. Sesudah memilih, blok yang tidak bisa dipegang pengajar yang sama jadi bergaris. Tanggal mulai disepakati bareng pengajar sesudah daftar.</>
              : <>Ini gambaran jam yang biasanya kosong tiap minggu. Pilih jam yang paling sering cocok untukmu (boleh dilewati) supaya kami carikan pengajar yang pas, lalu sesinya kamu atur sendiri tiap minggu.</>}{" "}
            Semua jam dalam WIB.
          </p>

          {/* [jadwal-grid-italki-v1] grid kotak rapat bergaris 1px ala italki: tanpa rounded & tanpa teks
              jam di dalam blok; hari, jam & durasi muncul di tooltip saat hover. */}
          <div className="mt-3 max-h-[70vh] overflow-auto rounded-2xl border border-slate-100 bg-white p-2 shadow-sm">
            <div className="grid min-w-[340px] grid-cols-[2.75rem_repeat(7,minmax(0,1fr))] sm:grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]">
              <div className="sticky top-0 z-30 bg-white" />
              {HARI_PENDEK.map((h) => (
                <div key={h} className="sticky top-0 z-30 bg-white pb-1.5 text-center">
                  <p className="text-xs font-extrabold text-slate-900 sm:text-sm">{h}</p>
                </div>
              ))}
              {barisMenit.map((menit, i) => (
                <Baris key={menit} menit={menit} durasi={durasi} awalBaris={i === 0} pola7={pola7} pilih={pilih} cocok={cocok} onToggle={toggle} />
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
                      <button key={s.menit} type="button" onClick={() => pakaiSaran(s.dows, s.menit)} className="rounded-lg border border-emerald-300 bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-200">
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
        <li className="flex gap-2"><CalendarCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#1A9E9E]" /> Jadwal &amp; tanggal mulai dikonfirmasi bareng pengajar lewat WhatsApp setelah pembayaran.</li>
        <li className="flex gap-2"><Repeat className="mt-0.5 h-4 w-4 shrink-0 text-[#1A9E9E]" /> Disarankan {SESI_SUBLEVEL} sesi untuk menuntaskan 1 sub-level (mis. A1.1). Boleh ambil lebih sedikit dulu, lalu tambah sesi kapan saja.</li>
      </ul>

      {(pilih.size > 0 || (pola === "fleksibel" && hasil && adaGrid)) && (
        // pr-24: tombol chat Ling (fixed kanan-bawah, 64px) jangan menutupi "Lanjut daftar".
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 py-3 pl-4 pr-24 lg:pr-4 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {pola === "tetap" ? "Tetap" : "Fleksibel"} · {sesi} sesi × {durasi} mnt
              </p>
              <p className="truncate text-sm font-bold text-slate-900">
                {daftarPilih.length
                  ? urutkan(daftarPilih).map((p) => `${HARI_PENDEK[p.dow]} ${titik(p.menit)}`).join(" · ")
                  : "Atur per sesi sesudah lunas"}
              </p>
              {pola === "tetap" && (
                <p className="truncate text-[11px] text-slate-500">{perkiraanLama(daftarPilih.length, sesi)}</p>
              )}
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

function Baris({ menit, durasi, awalBaris, pola7, pilih, cocok, onToggle }: {
  menit: number;
  durasi: number;
  awalBaris: boolean;
  pola7: Map<string, Sel>;
  pilih: Map<string, Pilihan>;
  cocok: (k: string) => boolean;
  onToggle: (dow: number, menit: number) => void;
}) {
  const jamBulat = menit % 60 === 0;
  // Garis grid: tiap sel punya garis kanan & bawah; kolom pertama + baris pertama menambah kiri/atas.
  const garis = `border-b border-r border-slate-200 ${awalBaris ? "border-t" : ""}`;
  return (
    <>
      <div className={`pr-1.5 text-right text-[10px] leading-7 tabular-nums sm:text-[11px] ${jamBulat ? "font-semibold text-slate-500" : "text-transparent"}`}>
        {titik(menit)}
      </div>
      {HARI.map((namaHari, dow) => {
        const k = kunci(dow, menit);
        const c = pola7.get(k);
        const tepi = `${garis} ${dow === 0 ? "border-l" : ""}`;
        const label = `Tiap ${namaHari} · ${titik(menit)}–${titik(menit + durasi)} (${durasi} menit)`;
        // Tooltip di bawah untuk baris teratas (supaya tidak tertutup header lengket), selain itu di atas.
        const tip = (ket: string) => (
          <span
            className={`pointer-events-none absolute z-20 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 ${awalBaris ? "top-full mt-1.5" : "bottom-full mb-1.5"} ${dow >= 5 ? "right-0" : dow <= 1 ? "left-0" : "left-1/2 -translate-x-1/2"}`}
          >
            {label}
            <span className="block text-[10px] font-medium text-slate-300">{ket}</span>
          </span>
        );
        if (!c) return <div key={dow} className={`h-7 bg-white ${tepi}`} />;
        if (c.s === "terisi") {
          return <div key={dow} className={`group relative h-7 bg-rose-200 ${tepi}`}>{tip("Sudah terisi")}</div>;
        }
        const aktif = pilih.has(k);
        if (!aktif && !cocok(k)) {
          return (
            <div key={dow} className={`group relative h-7 bg-[repeating-linear-gradient(45deg,#f1f5f9_0_3px,#e2e8f0_3px_6px)] ${tepi}`}>
              {tip("Beda pengajar dengan pilihanmu")}
            </div>
          );
        }
        const penuh = !aktif && pilih.size >= MAKS_PILIH;
        return (
          <button
            key={dow}
            type="button"
            disabled={penuh}
            onClick={() => onToggle(dow, menit)}
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
