import { describe, expect, it } from "vitest";
import { AUTO_PRESENSI_NOTE, idSesiSintetis, tanpaSesiSintetis } from "./sesiSintetis";

// Kasus nyata: Moh. Zayyan (Russian A2.2), Rabu 2 Sep 2026. Dua kelas asli jam
// 07.00 & 08.00 WIB, plus tiga penambal auto-presensi jam 12.00 (detik 0,1,2).
const asli = [
  { id: "a1", registration_id: "r1", scheduled_at: "2026-09-02T00:00:00+00:00", status: "completed", session_number: 16, notes: null },
  { id: "a2", registration_id: "r1", scheduled_at: "2026-09-02T01:00:00+00:00", status: "completed", session_number: 17, notes: null },
];
const hantu = [
  { id: "h1", registration_id: "r1", scheduled_at: "2026-09-02T05:00:00+00:00", status: "completed", session_number: null },
  { id: "h2", registration_id: "r1", scheduled_at: "2026-09-02T05:00:01+00:00", status: "completed", session_number: null },
  { id: "h3", registration_id: "r1", scheduled_at: "2026-09-02T05:00:02+00:00", status: "completed", session_number: null },
];

describe("sesiSintetis", () => {
  it("mengenali penambal lewat kolom notes", () => {
    const rows = [...asli, ...hantu.map((h) => ({ ...h, notes: AUTO_PRESENSI_NOTE }))];
    expect([...idSesiSintetis(rows)].sort()).toEqual(["h1", "h2", "h3"]);
    expect(tanpaSesiSintetis(rows).map((r) => r.id)).toEqual(["a1", "a2"]);
  });

  it("tetap mengenali penambal walau payloadnya tak bawa notes", () => {
    // salinan lama (POV pratinjau kedaluwarsa / cache tab) — detik 1 & 2 jadi bukti,
    // baris detik 0 di menit yang sama ikut terbawa.
    const rows = [...asli, ...hantu];
    expect([...idSesiSintetis(rows)].sort()).toEqual(["h1", "h2", "h3"]);
  });

  it("tidak menyentuh kelas asli jam 12.00 yang berdiri sendiri", () => {
    const siang = [
      { id: "s1", registration_id: "r2", scheduled_at: "2026-09-02T05:00:00+00:00", status: "completed", session_number: null },
      { id: "s2", registration_id: "r2", scheduled_at: "2026-09-03T05:00:00+00:00", status: "completed", session_number: 4 },
    ];
    expect(idSesiSintetis(siang).size).toBe(0);
    expect(tanpaSesiSintetis(siang)).toHaveLength(2);
  });

  it("penambal satu registrasi tidak ikut menghapus registrasi lain di menit sama", () => {
    const rows = [
      ...hantu,
      { id: "lain", registration_id: "r9", scheduled_at: "2026-09-02T05:00:00+00:00", status: "completed", session_number: null },
    ];
    expect(idSesiSintetis(rows).has("lain")).toBe(false);
  });

  it("bentuk camelCase kalender ikut dikenali", () => {
    const rows = [
      { id: "h1", registrationId: "r1", scheduledAt: "2026-09-02T05:00:00+00:00", status: "completed", sessionNumber: null },
      { id: "h2", registrationId: "r1", scheduledAt: "2026-09-02T05:00:01+00:00", status: "completed", sessionNumber: null },
    ];
    expect(idSesiSintetis(rows).size).toBe(2);
  });
});
