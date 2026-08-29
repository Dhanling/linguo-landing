"use client";

// [life-dashboard-v1] Potongan kecil yang dipakai berulang: kartu angka,
// judul bagian, lencana, dan penanda naik/turun.
import { rupiah, persen, deltaPersen } from "../lib/format";

export function Bagian({
  judul, keterangan, aksi, children,
}: {
  judul: string;
  keterangan?: string;
  aksi?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold" style={{ color: "var(--life-text)" }}>
            {judul}
          </h2>
          {keterangan && (
            <p className="mt-0.5 text-xs" style={{ color: "var(--life-text-3)" }}>
              {keterangan}
            </p>
          )}
        </div>
        {aksi}
      </div>
      {children}
    </section>
  );
}

/** Naik/turun. Netral kalau pembandingnya nol — bukan "+0%". */
export function Delta({ kini, banding, terbalik = false }: { kini: number; banding: number; terbalik?: boolean }) {
  const d = deltaPersen(kini, banding);
  if (d === null) {
    return <span className="text-xs" style={{ color: "var(--life-text-3)" }}>tak ada pembanding</span>;
  }
  const baik = terbalik ? d < 0 : d > 0;
  const warna = d === 0 ? "var(--life-text-3)" : baik ? "var(--life-baik)" : "var(--life-buruk)";
  return (
    <span className="life-angka text-xs font-medium" style={{ color: warna }}>
      {d > 0 ? "▲" : d < 0 ? "▼" : "•"} {persen(Math.abs(d), Math.abs(d) < 10 ? 1 : 0).replace("+", "")}
    </span>
  );
}

export function Kartu({
  label, nilai, sub, kaki, aksen, sorot = false,
}: {
  label: string;
  nilai: string;
  sub?: React.ReactNode;
  kaki?: React.ReactNode;
  aksen?: string;
  sorot?: boolean;
}) {
  return (
    <div className="life-kartu relative overflow-hidden p-4">
      {aksen && (
        <span
          className="absolute left-0 top-0 h-full w-[3px]"
          style={{ background: aksen }}
          aria-hidden
        />
      )}
      <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "var(--life-text-3)" }}>
        {label}
      </p>
      <p
        className={`life-angka mt-1.5 font-semibold ${sorot ? "text-[26px]" : "text-[20px]"}`}
        style={{ color: "var(--life-text)" }}
      >
        {nilai}
      </p>
      {sub && <div className="mt-1.5 flex items-center gap-2">{sub}</div>}
      {kaki && (
        <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--life-text-3)" }}>
          {kaki}
        </p>
      )}
    </div>
  );
}

export function Lencana({ anak, warna }: { anak: React.ReactNode; warna?: string }) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{
        background: "var(--life-surface-2)",
        border: "1px solid var(--life-line)",
        color: warna || "var(--life-text-2)",
      }}
    >
      {anak}
    </span>
  );
}

export function BarisNilai({ nama, nilai, catatan }: { nama: string; nilai: number; catatan?: string }) {
  return (
    <div
      className="flex items-baseline justify-between gap-4 py-2"
      style={{ borderBottom: "1px solid var(--life-line)" }}
    >
      <div className="min-w-0">
        <p className="truncate text-sm" style={{ color: "var(--life-text)" }}>{nama}</p>
        {catatan && <p className="text-xs" style={{ color: "var(--life-text-3)" }}>{catatan}</p>}
      </div>
      <p className="life-angka shrink-0 text-sm font-medium" style={{ color: "var(--life-text)" }}>
        {rupiah(nilai)}
      </p>
    </div>
  );
}

export const WARNA_SLOT = ["var(--s1)", "var(--s2)", "var(--s3)", "var(--s4)", "var(--s5)", "var(--s6)", "var(--s7)"];

/** Slot -1 = ekor "Lainnya" — abu-abu netral, bukan warna kategorikal kedelapan. */
export const WARNA_EKOR = "var(--life-line-kuat)";
export function warnaSlot(slot: number) {
  return slot < 0 ? WARNA_EKOR : WARNA_SLOT[slot % WARNA_SLOT.length];
}
