"use client";

// [atur-jadwal-sendiri-v1] Siswa Private/Kids memesan, memindah, dan membatalkan
// sesinya sendiri dari jam tersedia pengajar — semua lewat /api/atur-jadwal (aturan
// H-1, bentrok, jatah sesi ditegakkan di server). Menggantikan modal booking lama di
// page.tsx yang tak pernah punya tombol pembuka.
//
//   <AturJadwalKartu>  kartu di atas kalender: daftar kelas yang bisa dipesan sendiri
//   <AturJadwalSheet>  lembar pilih jam — mode "pesan" (banyak jam) / "pindah" (satu jam + batal)

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarPlus, Check, Loader2, X, CalendarClock, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { useT } from "@/lib/uiLang";

export type KelasAturJadwal = {
  regId: string;
  label: string;
  pengajar: string | null;
  durasi: number;
  sisa: number;
  total: number;
  bisaPesan: boolean;
  bisaUbah: boolean;
  alasan: string | null;
};

export type SesiUbah = { id: string; registrationId: string; scheduledAt: string; durationMinutes?: number | null; label: string; sessionNumber?: number | null };

/** Sesi boleh diubah sendiri kalau kelasnya terdaftar & masih ≥ 24 jam lagi. */
export const BATAS_UBAH_MS = 24 * 3600_000;

async function panggil<T = any>(isi: Record<string, unknown>): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Sesi login habis, muat ulang halaman");
  const res = await fetch("/api/atur-jadwal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken: session.access_token, ...isi }),
    cache: "no-store",
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j?.error || "Gagal, coba lagi");
  return j as T;
}

/** Daftar kelas yang jadwalnya bisa diatur sendiri — dimuat sekali, bisa dimuat ulang. */
export function useKelasAturJadwal(aktif: boolean) {
  const [kelas, setKelas] = useState<KelasAturJadwal[]>([]);
  const muat = useCallback(async () => {
    try {
      const j = await panggil<{ kelas: KelasAturJadwal[] }>({ aksi: "kelas" });
      setKelas(Array.isArray(j.kelas) ? j.kelas : []);
    } catch { /* kartu cukup tak muncul */ }
  }, []);
  useEffect(() => { if (aktif) muat(); }, [aktif, muat]);
  return { kelas, muat };
}

export function AturJadwalKartu({ kelas, onPilih }: { kelas: KelasAturJadwal[]; onPilih: (k: KelasAturJadwal) => void }) {
  const tt = useT();
  const bisa = kelas.filter((k) => k.bisaPesan);
  if (!bisa.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-[#16796E]/[0.08] px-3.5 py-2.5">
      <CalendarPlus className="h-4 w-4 shrink-0 text-[#16796E]" strokeWidth={2.5} />
      <div className="min-w-[10rem] flex-1">
        <h3 className="text-[12.5px] font-bold leading-tight text-[#12172B]">{tt("Atur jadwal sendiri")}</h3>
        <p className="mt-0.5 text-[11.5px] font-medium text-slate-700">
          {tt("Pilih jam dari jadwal kosong pengajarmu, langsung masuk kalender.")}
        </p>
      </div>
      {bisa.map((k) => (
        <button
          key={k.regId}
          type="button"
          onClick={() => onPilih(k)}
          className="inline-flex h-7 shrink-0 items-center gap-1 rounded-lg bg-[#16796E] px-2.5 text-[11.5px] font-bold text-white transition hover:opacity-90"
        >
          <CalendarPlus className="h-3.5 w-3.5" strokeWidth={2.4} />
          {bisa.length > 1 ? k.label : tt("Pilih jadwal")} · {tt("sisa")} {k.sisa}
        </button>
      ))}
    </div>
  );
}

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
/** Bagian tanggal-jam dalam WIB, apa pun zona waktu perangkat siswa. */
function wib(ms: number) {
  const t = new Date(ms + 7 * 3600_000);
  return { key: t.toISOString().slice(0, 10), hari: HARI[t.getUTCDay()], d: t.getUTCDate(), m: BULAN[t.getUTCMonth()], jam: `${String(t.getUTCHours()).padStart(2, "0")}.${String(t.getUTCMinutes()).padStart(2, "0")}` };
}
const labelWib = (ms: number) => { const w = wib(ms); return `${w.hari}, ${w.d} ${w.m} · ${w.jam} WIB`; };

export function AturJadwalSheet({
  mode, kelas, sesi, onTutup, onSelesai,
}: {
  mode: "pesan" | "pindah";
  kelas: KelasAturJadwal;
  /** mode pindah: sesi yang dipindah / dibatalkan. */
  sesi?: SesiUbah | null;
  onTutup: () => void;
  onSelesai: (pesan: string) => void;
}) {
  const tt = useT();
  const [memuat, setMemuat] = useState(true);
  const [slot, setSlot] = useState<number[]>([]);
  const [tutup, setTutup] = useState(false);
  const [sisa, setSisa] = useState(kelas.sisa);
  const [durasi, setDurasi] = useState(kelas.durasi);
  const [pilih, setPilih] = useState<number[]>([]);
  const [kirim, setKirim] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [yakinBatal, setYakinBatal] = useState(false);

  const maks = mode === "pindah" ? 1 : Math.min(sisa, 8);

  const muat = useCallback(async () => {
    setMemuat(true); setGalat(null);
    try {
      const j = await panggil<{ slot: number[]; durasi: number; sisa: number; tutup: boolean }>({
        aksi: "slot", regId: kelas.regId, kecuali: sesi?.id ?? null,
      });
      setSlot(j.slot || []); setTutup(!!j.tutup); setSisa(j.sisa); setDurasi(mode === "pindah" ? (sesi?.durationMinutes || j.durasi) : j.durasi);
    } catch (e: any) { setGalat(e.message); }
    setMemuat(false);
  }, [kelas.regId, sesi?.id, sesi?.durationMinutes, mode]);
  useEffect(() => { muat(); }, [muat]);

  const perHari = useMemo(() => {
    const m = new Map<string, { label: string; slot: number[] }>();
    for (const s of slot) {
      const w = wib(s);
      if (!m.has(w.key)) m.set(w.key, { label: `${w.hari}, ${w.d} ${w.m}`, slot: [] });
      m.get(w.key)!.slot.push(s);
    }
    return Array.from(m.values());
  }, [slot]);

  // Jam yang dipilih tak boleh saling tumpuk (durasi > 30 menit).
  const tumpuk = (a: number) => pilih.some((p) => p !== a && Math.abs(p - a) < durasi * 60_000);

  const toggle = (s: number) => {
    setGalat(null);
    if (mode === "pindah") { setPilih([s]); return; }
    setPilih((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : prev.length >= maks ? prev : [...prev, s].sort((a, b) => a - b));
  };

  const simpan = async () => {
    if (!pilih.length) return;
    setKirim(true); setGalat(null);
    try {
      if (mode === "pesan") {
        const j = await panggil<{ dibuat: number }>({ aksi: "pesan", regId: kelas.regId, slot: pilih });
        onSelesai(`${j.dibuat} ${tt("sesi berhasil dijadwalkan. Pengajar sudah dikabari.")}`);
      } else {
        await panggil({ aksi: "pindah", scheduleId: sesi!.id, slot: pilih[0] });
        onSelesai(`${tt("Sesi dipindah ke")} ${labelWib(pilih[0])}. ${tt("Pengajar sudah dikabari.")}`);
      }
    } catch (e: any) {
      setGalat(e.message);
      muat(); // jam yang barusan diambil orang lain hilang dari pilihan
      setPilih([]);
    }
    setKirim(false);
  };

  const batalkan = async () => {
    setKirim(true); setGalat(null);
    try {
      await panggil({ aksi: "batal", scheduleId: sesi!.id });
      onSelesai(tt("Sesi dibatalkan dan jatahnya kembali. Pengajar sudah dikabari."));
    } catch (e: any) { setGalat(e.message); }
    setKirim(false); setYakinBatal(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={() => !kirim && onTutup()}>
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-gray-900">{mode === "pesan" ? tt("Pilih jadwal kelas") : tt("Pindah jadwal sesi")}</h3>
            <p className="mt-0.5 text-xs text-gray-500">
              {kelas.label}{kelas.pengajar ? ` · ${kelas.pengajar}` : ""} · {durasi} {tt("menit")}
              {mode === "pesan" && <> · {tt("sisa")} {sisa} {tt("sesi")}</>}
            </p>
            {mode === "pindah" && sesi && (
              <p className="mt-1 text-xs font-semibold text-gray-700">
                {tt("Jadwal sekarang")}: {sesi.sessionNumber ? `${tt("Sesi")} ${sesi.sessionNumber} · ` : ""}{labelWib(new Date(sesi.scheduledAt).getTime())}
              </p>
            )}
          </div>
          <button onClick={() => !kirim && onTutup()} aria-label={tt("Tutup")} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">
            <X className="h-4 w-4" strokeWidth={2.4} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {memuat ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> {tt("Memuat jam kosong pengajar…")}</div>
          ) : tutup || slot.length === 0 ? (
            <div className="py-12 text-center">
              <CalendarClock className="mx-auto mb-2 h-8 w-8 text-slate-300" strokeWidth={1.8} />
              <p className="text-sm font-medium text-gray-700">{tutup ? tt("Jadwal pengajar belum dibuka untuk dipesan sendiri") : tt("Belum ada jam kosong dalam 2 minggu ke depan")}</p>
              <p className="mt-1 text-xs text-gray-500">{tt("Atur jamnya bersama pengajar di grup WhatsApp kelas ya.")}</p>
            </div>
          ) : (
            <>
              <p className="mb-3 text-xs text-gray-500">
                {mode === "pesan"
                  ? `${tt("Pilih sampai")} ${maks} ${tt("jam (WIB). Pemesanan, pindah, dan pembatalan paling lambat 24 jam sebelum kelas.")}`
                  : tt("Pilih satu jam pengganti (WIB). Pindah atau batal paling lambat 24 jam sebelum kelas.")}
              </p>
              <div className="flex flex-col gap-3">
                {perHari.map((h) => (
                  <div key={h.label} className="rounded-xl bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-semibold text-gray-700">{h.label}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {h.slot.map((s) => {
                        const dipilih = pilih.includes(s);
                        const mati = !dipilih && (tumpuk(s) || (mode === "pesan" && pilih.length >= maks));
                        return (
                          <button
                            key={s}
                            type="button"
                            disabled={mati}
                            onClick={() => toggle(s)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                              dipilih ? "bg-[#16796E] text-white"
                                : mati ? "cursor-not-allowed bg-gray-100 text-gray-400"
                                : "border border-[#16796E]/30 bg-white text-[#16796E] hover:bg-[#16796E]/[0.06]"
                            }`}
                          >
                            {wib(s).jam}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {galat && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{galat}</p>}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-4">
          {mode === "pindah" ? (
            yakinBatal ? (
              <span className="flex items-center gap-2 text-xs font-semibold text-rose-700">
                {tt("Batalkan sesi ini?")}
                <button onClick={batalkan} disabled={kirim} className="rounded-lg bg-rose-600 px-2.5 py-1 text-white disabled:opacity-50">{tt("Ya, batalkan")}</button>
                <button onClick={() => setYakinBatal(false)} disabled={kirim} className="rounded-lg bg-gray-100 px-2.5 py-1 text-gray-700">{tt("Tidak")}</button>
              </span>
            ) : (
              <button onClick={() => setYakinBatal(true)} disabled={kirim} className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700">
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2.4} /> {tt("Batalkan sesi")}
              </button>
            )
          ) : (
            <span className="flex min-w-0 items-center gap-1.5 truncate text-xs text-gray-500">
              {pilih.length > 0 ? <><Check className="h-3.5 w-3.5 shrink-0 text-[#16796E]" strokeWidth={2.5} />{pilih.length} {tt("sesi dipilih")}</> : tt("Belum ada jam dipilih")}
            </span>
          )}
          <button
            onClick={simpan}
            disabled={!pilih.length || kirim}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-[#16796E] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0F5A52] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {kirim && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "pesan" ? (pilih.length ? `${tt("Jadwalkan")} ${pilih.length} ${tt("sesi")}` : tt("Pilih jam dulu")) : tt("Pindah ke jam ini")}
          </button>
        </div>
      </div>
    </div>
  );
}
