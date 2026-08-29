"use client";

// [life-dashboard-v1] "Bisnis apa saja yang jalan" — satu batang per lini
// (magnitudo, jadi batang horizontal berlabel langsung), plus rincian angka
// bulan ini / bulan lalu / YTD / sepanjang masa di kolom kanan.
import { useState } from "react";
import type { Lini } from "../lib/tipe";
import { rupiah, rupiahRingkas, tanggalPendek, selisihHari } from "../lib/format";
import { warnaSlot, Delta, Lencana } from "./dasar";

type Urut = "bulanIni" | "ytd" | "sepanjangMasa";

const LABEL_URUT: Record<Urut, string> = {
  bulanIni: "Bulan ini",
  ytd: "Tahun berjalan",
  sepanjangMasa: "Sepanjang masa",
};

export default function PetaBisnis({ lini }: { lini: Lini[] }) {
  const [urut, setUrut] = useState<Urut>("bulanIni");
  const daftar = [...lini].sort((a, b) => b[urut] - a[urut]);
  const maks = Math.max(1, ...daftar.map((l) => l[urut]));

  return (
    <div className="life-kartu p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold" style={{ color: "var(--life-text)" }}>
          {daftar.length} lini bisnis tercatat
        </h3>
        <div className="flex gap-1.5">
          {(Object.keys(LABEL_URUT) as Urut[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setUrut(k)}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium transition"
              style={{
                background: urut === k ? "var(--life-brand)" : "var(--life-surface-2)",
                border: `1px solid ${urut === k ? "var(--life-brand)" : "var(--life-line)"}`,
                color: urut === k ? "#fff" : "var(--life-text-2)",
              }}
            >
              {LABEL_URUT[k]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {daftar.map((l) => {
          const nilai = l[urut];
          const hari = selisihHari(l.terakhirTransaksi);
          return (
            <div key={l.key}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                    style={{ background: warnaSlot(l.slot) }}
                    aria-hidden
                  />
                  <span className="truncate text-sm font-medium" style={{ color: "var(--life-text)" }}>
                    {l.nama}
                  </span>
                  {l.manual && <Lencana anak="manual" />}
                  {!l.aktif && !l.manual && <Lencana anak="dorman" />}
                </div>
                <div className="flex items-center gap-2">
                  <span className="life-angka text-sm font-semibold" style={{ color: "var(--life-text)" }}>
                    {rupiah(nilai)}
                  </span>
                  {urut === "bulanIni" && <Delta kini={l.bulanIni} banding={l.bulanLalu} />}
                </div>
              </div>

              <div
                className="mt-1.5 h-2 w-full overflow-hidden rounded-full"
                style={{ background: "var(--life-surface-2)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(nilai > 0 ? 1.5 : 0, (nilai / maks) * 100)}%`,
                    background: warnaSlot(l.slot),
                  }}
                />
              </div>

              <p className="mt-1 text-[11px]" style={{ color: "var(--life-text-3)" }}>
                {l.kategori}
                {" · "}
                {l.transaksiBulanIni} transaksi bulan ini
                {" · YTD "}
                {rupiahRingkas(l.ytd)}
                {" · total "}
                {rupiahRingkas(l.sepanjangMasa)}
                {l.terakhirTransaksi
                  ? ` · terakhir ${tanggalPendek(l.terakhirTransaksi)}${hari !== null && hari > 0 ? ` (${hari} hari lalu)` : ""}`
                  : ""}
              </p>
            </div>
          );
        })}
        {daftar.length === 0 && (
          <p className="text-sm" style={{ color: "var(--life-text-3)" }}>
            Belum ada lini bisnis dengan uang masuk.
          </p>
        )}
      </div>
    </div>
  );
}
