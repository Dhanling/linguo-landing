"use client";

// [life-dashboard-v1] Susunan halaman /life.
//
// Urutannya sengaja: posisi (berapa yang saya punya) → aliran (berapa yang
// masuk) → mesinnya (bisnis apa saja) → biaya → operasional. Angka ditarik
// ulang tiap 90 detik dan tiap tab kembali aktif, jadi "live" bukan janji
// kosong; waktu perbaruan terakhir selalu tertulis di header.
import { useCallback, useEffect, useRef, useState } from "react";
import type { Ringkasan } from "../lib/tipe";
import { rupiah, rupiahRingkas, persen, tanggalPendek, jamMenit } from "../lib/format";
import { Bagian, Kartu, Delta, BarisNilai, WARNA_SLOT } from "./dasar";
import GrafikOmzet from "./GrafikOmzet";
import PetaBisnis from "./PetaBisnis";

const JEDA_SEGARKAN = 90_000;

export default function Dashboard({ pinBawaan }: { pinBawaan: boolean }) {
  const [data, setData] = useState<Ringkasan | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [muat, setMuat] = useState(true);
  const [segarPada, setSegarPada] = useState<Date | null>(null);
  const berjalan = useRef(false);

  const tarik = useCallback(async () => {
    if (berjalan.current) return;
    berjalan.current = true;
    try {
      const r = await fetch("/life/api/data", { cache: "no-store" });
      if (r.status === 401) {
        window.location.reload();
        return;
      }
      const j = await r.json();
      if (j.ok) {
        setData(j.data);
        setGalat(null);
        setSegarPada(new Date());
      } else {
        setGalat(j.pesan || "Gagal memuat data.");
      }
    } catch (e: any) {
      setGalat(e?.message || "Jaringan bermasalah.");
    } finally {
      berjalan.current = false;
      setMuat(false);
    }
  }, []);

  useEffect(() => {
    tarik();
    const t = setInterval(tarik, JEDA_SEGARKAN);
    const onVis = () => {
      if (document.visibilityState === "visible") tarik();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [tarik]);

  async function keluar() {
    await fetch("/life/api/masuk", { method: "DELETE" });
    window.location.reload();
  }

  if (muat && !data) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-16">
        <p className="text-sm" style={{ color: "var(--life-text-3)" }}>Menghitung posisi…</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-16">
        <p className="text-sm" style={{ color: "var(--life-buruk)" }}>{galat || "Data tidak tersedia."}</p>
        <button
          type="button"
          onClick={tarik}
          className="mt-4 rounded-lg px-3 py-2 text-sm font-medium text-white"
          style={{ background: "var(--life-brand)" }}
        >
          Coba lagi
        </button>
      </main>
    );
  }

  const { omzet, beban, laba, kas, posisi, operasional } = data;
  const capaianTarget = omzet.targetBulanan ? (omzet.bulanIni / omzet.targetBulanan) * 100 : null;
  const kekayaanTotal = posisi.kekayaanBersih;
  const bebanMaks = Math.max(1, ...beban.perKategoriBulanIni.map((b) => b.jumlah));

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 pb-20">
      {/* ── header ── */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--life-text)" }}>
            Dashboard Hidup
          </h1>
          <p className="mt-1 text-xs" style={{ color: "var(--life-text-3)" }}>
            Diperbarui {segarPada ? jamMenit(segarPada.toISOString()) : "—"} WIB · otomatis tiap 90 detik
            {galat ? ` · ${galat}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={tarik}
            className="rounded-lg px-3 py-1.5 text-xs font-medium"
            style={{ background: "var(--life-surface-2)", border: "1px solid var(--life-line)", color: "var(--life-text-2)" }}
          >
            Segarkan
          </button>
          <button
            type="button"
            onClick={keluar}
            className="rounded-lg px-3 py-1.5 text-xs font-medium"
            style={{ background: "var(--life-surface-2)", border: "1px solid var(--life-line)", color: "var(--life-text-2)" }}
          >
            Keluar
          </button>
        </div>
      </header>

      {(data.peringatan.length > 0 || pinBawaan) && (
        <div
          className="mt-5 rounded-xl p-3.5 text-xs leading-relaxed"
          style={{ background: "var(--life-surface-2)", border: "1px solid var(--life-line-kuat)", color: "var(--life-text-2)" }}
        >
          <p className="font-semibold" style={{ color: "var(--life-text)" }}>Perlu perhatian</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-4">
            {pinBawaan && <li>LIFE_PIN belum diset di Vercel — halaman ini masih memakai PIN bawaan.</li>}
            {data.peringatan.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
      )}

      {/* ── posisi ── */}
      <Bagian judul="Posisi sekarang" keterangan="Kekayaan bersih dari data manual; sisanya hidup dari database Linguo.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kartu
            sorot
            aksen="var(--s1)"
            label="Kekayaan bersih"
            nilai={rupiah(kekayaanTotal)}
            kaki={`Aset ${rupiahRingkas(posisi.totalAset)} − utang ${rupiahRingkas(posisi.totalUtang)}`}
          />
          <Kartu
            sorot
            aksen="var(--s3)"
            label="Kas & setara kas"
            nilai={rupiah(posisi.asetLikuid)}
            kaki={
              posisi.danaDaruratBulanTertutupi !== null
                ? `Menutup ${posisi.danaDaruratBulanTertutupi.toFixed(1).replace(".", ",")} bulan pengeluaran rutin`
                : "Isi beban rutin di pribadi.json untuk melihat daya tahan kas"
            }
          />
          <Kartu
            sorot
            aksen="var(--s2)"
            label="Omzet bulan ini"
            nilai={rupiah(omzet.bulanIni)}
            sub={<Delta kini={omzet.bulanIni} banding={omzet.bulanLalu} />}
            kaki={`Bulan lalu ${rupiahRingkas(omzet.bulanLalu)} · laju sebulan penuh ≈ ${rupiahRingkas(omzet.bulanIniProrata)}`}
          />
          <Kartu
            sorot
            aksen={laba.bulanIni >= 0 ? "var(--s1)" : "var(--s7)"}
            label="Laba bersih bulan ini"
            nilai={rupiah(laba.bulanIni)}
            sub={<Delta kini={laba.bulanIni} banding={laba.bulanLalu} />}
            kaki={`Margin ${laba.marginBulanIni === null ? "—" : persen(laba.marginBulanIni, 0).replace("+", "")} · beban ${rupiahRingkas(beban.bulanIni)}`}
          />
        </div>

        {capaianTarget !== null && (
          <div className="life-kartu mt-3 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium" style={{ color: "var(--life-text)" }}>
                Target omzet bulanan
              </p>
              <p className="life-angka text-sm" style={{ color: "var(--life-text-2)" }}>
                {rupiah(omzet.bulanIni)} / {rupiah(omzet.targetBulanan)}
                <span className="ml-2 font-semibold" style={{ color: capaianTarget >= 100 ? "var(--life-baik)" : "var(--life-text)" }}>
                  {capaianTarget.toFixed(0)}%
                </span>
              </p>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full" style={{ background: "var(--life-surface-2)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, Math.max(capaianTarget, capaianTarget > 0 ? 1.5 : 0))}%`,
                  background: capaianTarget >= 100 ? "var(--life-baik)" : "var(--life-brand)",
                }}
              />
            </div>
          </div>
        )}
      </Bagian>

      {/* ── aliran uang ── */}
      <Bagian judul="Uang masuk" keterangan="Diakui pada tanggal bayar, seluruh lini digabung.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kartu label="Hari ini" nilai={rupiah(omzet.hariIni)} sub={<Delta kini={omzet.hariIni} banding={omzet.kemarin} />} kaki={`Kemarin ${rupiahRingkas(omzet.kemarin)}`} />
          <Kartu label="7 hari terakhir" nilai={rupiah(omzet.tujuhHari)} kaki={`Rata-rata ${rupiahRingkas(omzet.tujuhHari / 7)}/hari`} />
          <Kartu label="Tahun berjalan" nilai={rupiah(omzet.ytd)} kaki={`Beban YTD ${rupiahRingkas(beban.ytd)} · laba ${rupiahRingkas(laba.ytd)}`} />
          <Kartu label="Sepanjang masa" nilai={rupiah(omzet.sepanjangMasa)} kaki={`Akumulasi laba historis ${rupiahRingkas(kas.akumulasiLabaHistoris)}`} />
        </div>
        <div className="mt-3">
          <GrafikOmzet seri={data.seriBulanan} lini={data.lini} />
        </div>
      </Bagian>

      {/* ── mesin bisnis ── */}
      <Bagian judul="Bisnis yang jalan" keterangan="Lini bertanda dorman belum ada uang masuk 60 hari terakhir.">
        <PetaBisnis lini={data.lini} />
      </Bagian>

      {/* ── beban ── */}
      <Bagian judul="Beban & kewajiban" keterangan="Pengeluaran buku Keuangan + transaksi manual + fee pengajar (dibebankan pada periodenya, cair maupun belum).">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
          <div className="life-kartu p-4">
            <h3 className="text-sm font-semibold" style={{ color: "var(--life-text)" }}>
              Pengeluaran bulan ini per kategori
            </h3>
            <p className="mt-0.5 text-xs" style={{ color: "var(--life-text-3)" }}>
              Total {rupiah(beban.bulanIni)} · bulan lalu {rupiahRingkas(beban.bulanLalu)}
            </p>
            <div className="mt-4 space-y-3">
              {beban.perKategoriBulanIni.map((b, i) => (
                <div key={b.kategori}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm" style={{ color: "var(--life-text)" }}>{b.kategori}</span>
                    <span className="life-angka text-sm font-medium" style={{ color: "var(--life-text)" }}>{rupiah(b.jumlah)}</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--life-surface-2)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(b.jumlah / bebanMaks) * 100}%`, background: WARNA_SLOT[(i + 1) % WARNA_SLOT.length] }}
                    />
                  </div>
                </div>
              ))}
              {beban.perKategoriBulanIni.length === 0 && (
                <p className="text-sm" style={{ color: "var(--life-text-3)" }}>Belum ada pengeluaran tercatat bulan ini.</p>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Kartu
              label="Fee pengajar cair bulan ini"
              nilai={rupiah(beban.feePengajarBulanIni)}
              kaki={`YTD ${rupiahRingkas(beban.feePengajarYtd)}`}
            />
            <Kartu
              label="Fee pengajar belum cair"
              nilai={rupiah(kas.feePengajarBelumCair)}
              aksen="var(--s4)"
              kaki="Sudah dibebankan di laba, tapi uangnya belum ditransfer."
            />
            <Kartu
              label="Piutang cicilan siswa"
              nilai={rupiah(kas.piutangCicilan)}
              kaki="Sisa tagihan registrasi berstatus Cicilan."
            />
          </div>
        </div>
      </Bagian>

      {/* ── neraca manual ── */}
      <Bagian
        judul="Aset & utang"
        keterangan="Diketik manual di src/app/life/data/pribadi.json (atau env LIFE_ASET_JSON)."
      >
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="life-kartu p-4">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold" style={{ color: "var(--life-text)" }}>Aset</h3>
              <span className="life-angka text-sm font-semibold" style={{ color: "var(--life-text)" }}>{rupiah(posisi.totalAset)}</span>
            </div>
            <div className="mt-3">
              {(["Kas", "Investasi", "Aset Tetap"] as const).map((kel) => {
                const isi = posisi.rincianAset.filter((a) => a.kelompok === kel);
                if (isi.length === 0) return null;
                return (
                  <div key={kel} className="mt-3 first:mt-0">
                    <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "var(--life-text-3)" }}>{kel}</p>
                    {isi.map((a, i) => <BarisNilai key={`${a.nama}-${i}`} nama={a.nama} nilai={a.nilai} catatan={a.jenis} />)}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="life-kartu p-4">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold" style={{ color: "var(--life-text)" }}>Utang</h3>
              <span className="life-angka text-sm font-semibold" style={{ color: "var(--life-text)" }}>{rupiah(posisi.totalUtang)}</span>
            </div>
            <div className="mt-3">
              {posisi.rincianUtang.map((u, i) => (
                <BarisNilai
                  key={`${u.nama}-${i}`}
                  nama={u.nama}
                  nilai={u.sisa}
                  catatan={u.angsuranBulanan ? `${u.jenis} · angsuran ${rupiahRingkas(u.angsuranBulanan)}/bln` : u.jenis}
                />
              ))}
              {posisi.rincianUtang.length === 0 && (
                <p className="text-sm" style={{ color: "var(--life-text-3)" }}>Tidak ada utang tercatat.</p>
              )}
            </div>
            <div className="mt-4 flex items-baseline justify-between" style={{ borderTop: "1px solid var(--life-line-kuat)", paddingTop: 12 }}>
              <span className="text-sm font-medium" style={{ color: "var(--life-text)" }}>Kekayaan bersih</span>
              <span
                className="life-angka text-base font-semibold"
                style={{ color: kekayaanTotal >= 0 ? "var(--life-baik)" : "var(--life-buruk)" }}
              >
                {rupiah(kekayaanTotal)}
              </span>
            </div>
          </div>
        </div>
      </Bagian>

      {/* ── operasional ── */}
      <Bagian judul="Denyut operasional" keterangan="Angka non-uang yang menentukan omzet bulan depan.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kartu label="Registrasi aktif" nilai={String(operasional.registrasiAktif)} kaki={`${operasional.siswaAktif} siswa berjalan`} />
          <Kartu label="Pengajar aktif" nilai={String(operasional.pengajarAktif)} />
          <Kartu
            label="Sesi bulan ini"
            nilai={String(operasional.sesiBulanIni)}
            kaki={`${operasional.sesiSelesaiBulanIni} sudah selesai`}
          />
          <Kartu
            label="Leads bulan ini"
            nilai={String(operasional.leadsBulanIni)}
            kaki={`${operasional.leadsBayarBulanIni} bayar · konversi ${
              operasional.leadsBulanIni ? ((operasional.leadsBayarBulanIni / operasional.leadsBulanIni) * 100).toFixed(0) : "0"
            }%`}
          />
        </div>
      </Bagian>

      {/* ── uang masuk terakhir ── */}
      <Bagian judul="Uang masuk terakhir">
        <div className="life-kartu p-4">
          {data.transaksiTerakhir.map((t, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 py-2.5"
              style={{ borderBottom: i === data.transaksiTerakhir.length - 1 ? "none" : "1px solid var(--life-line)" }}
            >
              <div className="min-w-0">
                <p className="truncate text-sm" style={{ color: "var(--life-text)" }}>{t.nama}</p>
                <p className="text-xs" style={{ color: "var(--life-text-3)" }}>
                  {t.lini} · {tanggalPendek(t.tanggal)}
                </p>
              </div>
              <span className="life-angka shrink-0 text-sm font-medium" style={{ color: "var(--life-text)" }}>
                {rupiah(t.jumlah)}
              </span>
            </div>
          ))}
          {data.transaksiTerakhir.length === 0 && (
            <p className="text-sm" style={{ color: "var(--life-text-3)" }}>Belum ada uang masuk tercatat.</p>
          )}
        </div>
      </Bagian>

      <p className="mt-8 text-[11px] leading-relaxed" style={{ color: "var(--life-text-3)" }}>
        Omzet B2B dihitung dari invoice korporat yang lunas, bukan dari baris registrasi berproduk
        “B2B Corporate” — supaya satu pembayaran tidak terhitung dua kali. Pembelian digital yang
        sudah dimigrasikan ke registrasi juga hanya dihitung sekali.
      </p>
    </main>
  );
}
