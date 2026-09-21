import { describe, it, expect } from "vitest";
import { gabungSesiBeruntun, akhirBlokMs, type NormSession } from "@/components/akun/jadwalShared";

/** Sesi tiruan seperlunya: yang dibaca penggabung cuma kelas, jam, dan durasinya. */
function sesi(id: string, jam: string, menit = 60, extra: Partial<NormSession> = {}): NormSession {
  const d = new Date(`2026-09-22T${jam}:00`);
  return {
    id,
    scheduledAt: d.toISOString(),
    durationMinutes: menit,
    language: "Bosnia",
    level: "A1.1",
    teacher: "Michael",
    status: "scheduled",
    _d: d,
    _iso: "2026-09-22",
    _time: jam,
    _end: null,
    _weekday: "Selasa",
    _past: false,
    _joinable: true,
    _live: false,
    ...extra,
  } as NormSession;
}

describe("gabungSesiBeruntun", () => {
  it("melebur dua sesi berurutan jadi satu blok", () => {
    const blok = gabungSesiBeruntun([sesi("a", "09:15", 30), sesi("b", "09:45", 30)]);
    expect(blok).toHaveLength(1);
    expect(akhirBlokMs(blok[0])).toBe(new Date("2026-09-22T10:15:00").getTime());
  });

  // [jadwal-blok-gabung-v3] kasus Wendy: satu pertemuan 1 jam yang dihitung 2 sesi,
  // dua barisnya tersimpan di jam mulai yang SAMA → dulu jadi dua kartu kembar.
  it("melebur dua sesi yang jam mulainya kembar", () => {
    const blok = gabungSesiBeruntun([sesi("a", "09:15", 60), sesi("b", "09:15", 60)]);
    expect(blok).toHaveLength(1);
    expect(blok[0]).toHaveLength(2);
    expect(akhirBlokMs(blok[0])).toBe(new Date("2026-09-22T10:15:00").getTime());
  });

  it("melebur sesi yang dipisah jeda kecil (≤ 20 menit)", () => {
    const blok = gabungSesiBeruntun([sesi("a", "09:00", 60), sesi("b", "10:15", 60)]);
    expect(blok).toHaveLength(1);
  });

  it("tidak melebur sesi yang jaraknya jauh", () => {
    expect(gabungSesiBeruntun([sesi("a", "09:00", 60), sesi("b", "15:00", 60)])).toHaveLength(2);
  });

  it("tidak melebur kelas yang berbeda di jam yang sama", () => {
    const blok = gabungSesiBeruntun([
      sesi("a", "09:15", 60),
      sesi("b", "09:15", 60, { language: "Spanyol", teacher: "Iwan" }),
    ]);
    expect(blok).toHaveLength(2);
  });

  it("sesi batal tidak menempel ke sesi yang masih terjadwal", () => {
    const blok = gabungSesiBeruntun([
      sesi("a", "09:15", 60),
      sesi("b", "10:15", 60, { status: "cancelled" }),
    ]);
    expect(blok).toHaveLength(2);
  });
});
