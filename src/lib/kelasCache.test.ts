// Uji titipan daftar level dari beranda: strip pindah level di /akun/kelas/[id]
// harus tetap terisi walau rantai query-nya sendiri gagal.
import { describe, it, expect, beforeEach, beforeAll } from 'vitest';

// Node polos: cache-nya hidup di sessionStorage, jadi dipalsukan seadanya.
const store = new Map<string, string>();
(globalThis as any).window = globalThis;
(globalThis as any).sessionStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
  key: (i: number) => [...store.keys()][i] ?? null,
  get length() { return store.size; },
};

let simpanDaftarLevel: any, readCache: any, levelRegsKey: any, STUDENT_ID_KEY: string;
beforeAll(async () => {
  ({ simpanDaftarLevel, readCache, levelRegsKey, STUDENT_ID_KEY } = await import('./kelasCache'));
});

const SID = '4acf7421-bed5-4fb6-bfd5-e410912809bd';
const regs = [
  { id: 'r1', language: 'Russian', level: 'A1.1', payment_status: 'Lunas', pipeline_status: 'Aktif', archived_at: null },
  { id: 'r2', language: 'Russian', level: 'A1.2', payment_status: 'Lunas', pipeline_status: 'Aktif', archived_at: '2026-05-18T00:00:00Z' },
  { id: 'r3', language: 'Rusia', level: 'A2.1', payment_status: 'Cicilan', pipeline_status: 'Selesai', archived_at: null },
  { id: 'r4', language: 'Russian', level: 'A2.2', payment_status: 'Belum Lunas', pipeline_status: 'Aktif', archived_at: null },
  { id: 'r5', language: 'Russian', level: 'B1.1', payment_status: 'Lunas', pipeline_status: 'Batal', archived_at: null },
  { id: 'r6', language: 'Spanish', level: 'A1.1', payment_status: 'Lunas', pipeline_status: 'Aktif', archived_at: null },
];

beforeEach(() => sessionStorage.clear());

describe('simpanDaftarLevel', () => {
  it('menyimpan id siswa + daftar per bahasa, level lama yang diarsipkan tetap ikut', () => {
    simpanDaftarLevel(SID, regs);
    expect(readCache<string>(STUDENT_ID_KEY)).toBe(SID);
    const ru = readCache<any[]>(levelRegsKey(SID, 'Russian')) || [];
    expect(ru.map((r) => r.id).sort()).toEqual(['r1', 'r2', 'r3']); // "Rusia" masuk kunci yang sama
    expect(ru.some((r) => r.archived_at)).toBe(true);
  });

  it('membuang kelas batal & yang tak pernah dibayar', () => {
    simpanDaftarLevel(SID, regs);
    const ru = readCache<any[]>(levelRegsKey(SID, 'Russian')) || [];
    expect(ru.find((r) => r.id === 'r4')).toBeUndefined();
    expect(ru.find((r) => r.id === 'r5')).toBeUndefined();
  });

  it('bahasa lain disimpan terpisah', () => {
    simpanDaftarLevel(SID, regs);
    expect((readCache<any[]>(levelRegsKey(SID, 'Spanish')) || []).map((r) => r.id)).toEqual(['r6']);
  });

  it('daftar kosong / tanpa id tidak menimpa cache yang sudah ada', () => {
    simpanDaftarLevel(SID, regs);
    simpanDaftarLevel(SID, []);
    simpanDaftarLevel(null, regs);
    expect((readCache<any[]>(levelRegsKey(SID, 'Russian')) || []).length).toBe(3);
  });
});
