"use client";

// [life-dashboard-v1] Omzet 12 bulan terakhir, ditumpuk per lini bisnis.
//
// Kolom bertumpuk dipilih karena pertanyaannya dua sekaligus: "berapa total
// bulan itu" dan "dari mana datangnya". Sumbu tunggal — tidak ada sumbu kedua.
// Warna melekat pada lini (slot tetap), jadi menyaring lini tidak pernah
// mengecat ulang yang tersisa. Ada tampilan tabel karena dua slot warna terang
// tidak mencapai kontras 3:1 di permukaan terang.
import { useMemo, useState } from "react";
import type { Lini, TitikBulan } from "../lib/tipe";
import { rupiah, rupiahRingkas } from "../lib/format";
import { warnaSlot } from "./dasar";

const TINGGI = 240;

export default function GrafikOmzet({ seri, lini }: { seri: TitikBulan[]; lini: Lini[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [tabel, setTabel] = useState(false);

  // Lini berwarna (slot >= 0) tampil sendiri-sendiri; sisanya dilebur jadi satu
  // potongan "Lainnya" abu-abu — palet kategorikalnya tujuh warna, dan warna
  // kedelapan yang dikarang hanya akan menipu mata.
  const { liniTampil, seriPakai } = useMemo(() => {
    const EKOR = "__ekor";
    const total = new Map<string, number>();
    seri.forEach((t) => {
      Object.entries(t.perLini).forEach(([k, v]) => total.set(k, (total.get(k) || 0) + v));
    });
    const slotOf = new Map(lini.map((l) => [l.key, l.slot]));

    const berwarna = lini
      .filter((l) => l.slot >= 0 && (total.get(l.key) || 0) > 0)
      .sort((a, b) => (total.get(b.key) || 0) - (total.get(a.key) || 0));

    const adaEkor = lini.some((l) => l.slot < 0 && (total.get(l.key) || 0) > 0);
    const tampil = adaEkor
      ? [...berwarna, { key: EKOR, nama: "Lainnya", slot: -1 } as Lini]
      : berwarna;

    const pakai: TitikBulan[] = seri.map((t) => {
      const perLini: Record<string, number> = {};
      Object.entries(t.perLini).forEach(([k, v]) => {
        const kunci = (slotOf.get(k) ?? -1) >= 0 ? k : EKOR;
        perLini[kunci] = (perLini[kunci] || 0) + v;
      });
      return { ...t, perLini };
    });

    return { liniTampil: tampil, seriPakai: pakai };
  }, [seri, lini]);

  const maks = Math.max(1, ...seriPakai.map((t) => t.total));
  const tick = [0, 0.25, 0.5, 0.75, 1].map((f) => f * maks);

  if (tabel) {
    return (
      <div className="life-kartu p-4">
        <Kepala tabel={tabel} setTabel={setTabel} />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr style={{ color: "var(--life-text-3)" }}>
                <th className="py-2 text-left text-xs font-medium">Bulan</th>
                {liniTampil.map((l) => (
                  <th key={l.key} className="py-2 text-right text-xs font-medium">{l.nama}</th>
                ))}
                <th className="py-2 text-right text-xs font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {seriPakai.map((t) => (
                <tr key={t.key} style={{ borderTop: "1px solid var(--life-line)" }}>
                  <td className="py-2 text-left" style={{ color: "var(--life-text-2)" }}>{t.labelPanjang}</td>
                  {liniTampil.map((l) => (
                    <td key={l.key} className="life-angka py-2 text-right" style={{ color: "var(--life-text-2)" }}>
                      {t.perLini[l.key] ? rupiahRingkas(t.perLini[l.key]) : "—"}
                    </td>
                  ))}
                  <td className="life-angka py-2 text-right font-medium" style={{ color: "var(--life-text)" }}>
                    {rupiahRingkas(t.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="life-kartu p-4">
      <Kepala tabel={tabel} setTabel={setTabel} />

      <div className="mt-4 flex gap-3">
        {/* sumbu nilai — resesif, di belakang data */}
        <div className="relative w-14 shrink-0" style={{ height: TINGGI }}>
          {tick.map((v, i) => (
            <span
              key={i}
              className="life-angka absolute right-0 -translate-y-1/2 text-[10px]"
              style={{ bottom: `${(i / (tick.length - 1)) * 100}%`, color: "var(--life-text-3)" }}
            >
              {i === 0 ? "0" : rupiahRingkas(v).replace("Rp ", "")}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          {/* garis bantu */}
          <div className="pointer-events-none absolute inset-0" style={{ height: TINGGI }} aria-hidden>
            {tick.map((_, i) => (
              <div
                key={i}
                className="absolute w-full"
                style={{ bottom: `${(i / (tick.length - 1)) * 100}%`, borderTop: "1px solid var(--life-line)" }}
              />
            ))}
          </div>

          <div className="relative flex items-end gap-[6px]" style={{ height: TINGGI }}>
            {seriPakai.map((t, idx) => {
              const tinggiTotal = (t.total / maks) * TINGGI;
              const potongan = liniTampil
                .map((l) => ({ l, v: t.perLini[l.key] || 0 }))
                .filter((p) => p.v > 0);
              const aktif = hover === idx;
              return (
                <div
                  key={t.key}
                  className="relative flex h-full flex-1 cursor-default flex-col justify-end"
                  onMouseEnter={() => setHover(idx)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(idx)}
                  onBlur={() => setHover(null)}
                  tabIndex={0}
                  aria-label={`${t.labelPanjang}: ${rupiah(t.total)}`}
                >
                  {aktif && (
                    // Tooltip dijepit ke tepi pada dua kolom pertama & terakhir —
                    // kalau selalu dipusatkan, kolom tepi mendorongnya keluar kartu
                    // dan halaman jadi bisa digeser ke samping.
                    <div
                      className={`pointer-events-none absolute bottom-full z-20 mb-2 w-56 rounded-lg p-3 text-left shadow-lg ${
                        idx <= 1
                          ? "left-0"
                          : idx >= seriPakai.length - 2
                            ? "right-0"
                            : "left-1/2 -translate-x-1/2"
                      }`}
                      style={{
                        background: "var(--life-surface)",
                        border: "1px solid var(--life-line-kuat)",
                      }}
                    >
                      <p className="text-xs font-semibold" style={{ color: "var(--life-text)" }}>
                        {t.labelPanjang}
                      </p>
                      <p className="life-angka mt-0.5 text-sm font-semibold" style={{ color: "var(--life-text)" }}>
                        {rupiah(t.total)}
                      </p>
                      <div className="mt-2 space-y-1">
                        {potongan.length === 0 && (
                          <p className="text-[11px]" style={{ color: "var(--life-text-3)" }}>Tidak ada uang masuk.</p>
                        )}
                        {potongan
                          .slice()
                          .sort((a, b) => b.v - a.v)
                          .map((p) => (
                            <div key={p.l.key} className="flex items-center gap-2">
                              <span
                                className="h-2 w-2 shrink-0 rounded-[2px]"
                                style={{ background: warnaSlot(p.l.slot) }}
                                aria-hidden
                              />
                              <span className="min-w-0 flex-1 truncate text-[11px]" style={{ color: "var(--life-text-2)" }}>
                                {p.l.nama}
                              </span>
                              <span className="life-angka text-[11px]" style={{ color: "var(--life-text-2)" }}>
                                {rupiahRingkas(p.v)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* label langsung di kolom bulan berjalan */}
                  {idx === seriPakai.length - 1 && t.total > 0 && (
                    <span
                      className="life-angka absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold"
                      style={{ bottom: tinggiTotal + 6, color: "var(--life-text-2)" }}
                    >
                      {rupiahRingkas(t.total)}
                    </span>
                  )}

                  <div
                    className="flex w-full flex-col-reverse overflow-hidden rounded-t-[4px] transition-opacity"
                    style={{ height: Math.max(t.total > 0 ? 3 : 0, tinggiTotal), opacity: hover === null || aktif ? 1 : 0.55 }}
                  >
                    {potongan.map((p, i) => (
                      <div
                        key={p.l.key}
                        style={{
                          height: `${(p.v / t.total) * 100}%`,
                          background: warnaSlot(p.l.slot),
                          // jarak 2px antar potongan supaya batasnya terbaca
                          marginTop: i === potongan.length - 1 ? 0 : 2,
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-2 flex gap-[6px]">
            {seriPakai.map((t, i) => (
              <span
                key={t.key}
                className="flex-1 text-center text-[10px]"
                style={{ color: i === seriPakai.length - 1 ? "var(--life-text-2)" : "var(--life-text-3)" }}
              >
                {t.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* legenda selalu ada untuk >= 2 seri */}
      {liniTampil.length >= 2 && (
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2" style={{ borderTop: "1px solid var(--life-line)", paddingTop: 12 }}>
          {liniTampil.map((l) => (
            <span key={l.key} className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--life-text-2)" }}>
              <span
                className="h-2.5 w-2.5 rounded-[3px]"
                style={{ background: warnaSlot(l.slot) }}
                aria-hidden
              />
              {l.nama}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Kepala({ tabel, setTabel }: { tabel: boolean; setTabel: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold" style={{ color: "var(--life-text)" }}>
          Omzet 12 bulan terakhir
        </h3>
        <p className="mt-0.5 text-xs" style={{ color: "var(--life-text-3)" }}>
          Uang diakui pada tanggal bayar, dipecah per lini bisnis.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setTabel(!tabel)}
        className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium"
        style={{
          background: "var(--life-surface-2)",
          border: "1px solid var(--life-line)",
          color: "var(--life-text-2)",
        }}
      >
        {tabel ? "Grafik" : "Tabel"}
      </button>
    </div>
  );
}
