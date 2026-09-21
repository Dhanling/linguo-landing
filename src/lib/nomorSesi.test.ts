import { describe, it, expect } from "vitest";
import { petaNomorSesi, type SesiRowNomor } from "@/lib/nomorSesi";

const REG = "reg-1";

/** Baris jadwal tiruan: yang dibaca penomoran cuma jam, status, dan nomor tersimpannya. */
function baris(id: string, tanggalJam: string, nomor: number | null, status = "scheduled"): SesiRowNomor {
  return {
    id,
    registration_id: REG,
    scheduled_at: new Date(tanggalJam).toISOString(),
    status,
    session_number: nomor,
  };
}

const nomorDari = (rows: SesiRowNomor[], total: number, dipakai = 0) => {
  const peta = petaNomorSesi(rows, [{ id: REG, sessions_total: total, sessions_used: dipakai }]);
  return rows.map((r) => peta.get(r.id) ?? null);
};

describe("petaNomorSesi", () => {
  it("memercayai nomor tersimpan yang urut rapat & lengkap satu paket", () => {
    const rows = [
      baris("a", "2026-09-22T09:15", 1),
      baris("b", "2026-09-22T10:15", 2),
      baris("c", "2026-09-29T09:15", 3),
      baris("d", "2026-09-29T10:15", 4),
    ];
    expect(nomorDari(rows, 4)).toEqual([1, 2, 3, 4]);
  });

  // [nomor-sesi-rapat-v1] Bosnia Private 09:15–10:15: dua baris satu pertemuan yang
  // nomor tersimpannya berlubang (1 & 4) bikin badge kartu kalender jadi "#1–4" —
  // rentang yang terbaca seperti empat pertemuan padahal cuma dua sesi.
  it("menomori ulang kronologis kalau nomor tersimpan berlubang", () => {
    const rows = [
      baris("a", "2026-09-22T09:15", 1),
      baris("b", "2026-09-22T09:15", 4),
    ];
    expect(nomorDari(rows, 0)).toEqual([1, 2]);
    expect(nomorDari(rows, 2)).toEqual([1, 2]);
  });

  it("menomori ulang kronologis kalau nomor tersimpan tertukar urutannya", () => {
    const rows = [
      baris("a", "2026-09-22T09:15", 3),
      baris("b", "2026-09-22T10:15", 1),
      baris("c", "2026-09-29T09:15", 2),
    ];
    expect(nomorDari(rows, 3)).toEqual([1, 2, 3]);
  });

  it("paket lawas tanpa plafon: nomor tersimpan yang rapat tetap dihormati", () => {
    const rows = [
      baris("a", "2026-09-22T09:15", 13),
      baris("b", "2026-09-29T09:15", 14),
    ];
    expect(nomorDari(rows, 0)).toEqual([13, 14]);
  });

  it("sesi terpakai yang tak punya baris jadwal tetap memakan nomor di depan", () => {
    const rows = [
      baris("a", "2026-09-22T09:15", 13),
      baris("b", "2026-09-29T09:15", 14),
    ];
    expect(nomorDari(rows, 16, 10)).toEqual([11, 12]);
  });

  it("baris batal memakai nomor tersimpannya dan tak menggeser yang hidup", () => {
    const rows = [
      baris("x", "2026-09-22T08:00", 9, "cancelled"),
      baris("a", "2026-09-22T09:15", 1),
      baris("b", "2026-09-22T10:15", 2),
    ];
    expect(nomorDari(rows, 2)).toEqual([null, 1, 2]);
  });

  it("nomor tersimpan di luar plafon paket dibuang", () => {
    const rows = [baris("a", "2026-09-22T09:15", 24, "cancelled")];
    expect(nomorDari(rows, 16, 20)).toEqual([null]);
  });

  it("nomor tersimpan yang melompati plafon diturunkan ulang dari presensi", () => {
    const rows = [
      baris("a", "2026-09-22T09:15", 24),
      baris("b", "2026-09-22T10:15", 27),
    ];
    // paket 16 sesi, presensi 20 (kotor) → sisa slot kosong 14 di depan, jadi #15 & #16
    expect(nomorDari(rows, 16, 20)).toEqual([15, 16]);
  });
});
