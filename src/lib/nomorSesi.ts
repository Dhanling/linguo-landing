// [sesi-nomor-sinkron-v1] Nomor sesi yang dipakai kartu "Sesi Mendatang" (Beranda)
// dan kalender tab Jadwal.
//
// Dulu keduanya menampilkan `schedules.session_number` apa adanya. Masalahnya kelas
// lawas sering TAK punya baris `schedules` untuk sesi-sesi awalnya — sesi itu cuma
// tercatat sebagai angka di `registrations.sessions_used`. Akibatnya kartu kelas
// bilang "Sesi 14/16" (tinggal 2 sesi) sementara jadwal berikutnya diberi label
// "#13" dan "#14": dua angka yang saling menyalahkan di satu layar.
//
// Aturannya disamakan dengan linimasa di halaman detail kelas (SesiTimeline):
// slot paket yang tak punya baris jadwal tetap dihitung sebagai sesi yang sudah
// jalan dan ditaruh SEBELUM baris jadwal nyata, jadi baris nyata melanjutkan
// nomornya dari situ (14 terpakai → jadwal berikutnya #15 & #16).

export type SesiRowNomor = {
  id: string;
  registration_id?: string | null;
  scheduled_at: string;
  status?: string | null;
  session_number?: number | null;
};

export type RegNomor = {
  id: string;
  sessions_total?: number | null;
  sessions_used?: number | null;
};

const MATI = new Set(["cancelled", "canceled", "hangus", "dibatalkan", "batal"]);
const sesiMati = (status?: string | null) => MATI.has(String(status || "").toLowerCase());

/**
 * Peta `schedules.id` → nomor sesi yang layak ditampilkan (null = jangan tampilkan).
 * Nomor > plafon paket dibuang: itu sisa presensi kotor (baris sintetis dobel bikin
 * penomoran lompat, mis. #24 di paket 16 sesi) dan lebih baik disembunyikan daripada
 * menyesatkan siswa.
 */
export function petaNomorSesi(
  schedules: SesiRowNomor[],
  regs: RegNomor[]
): Map<string, number | null> {
  const out = new Map<string, number | null>();
  const regById = new Map<string, RegNomor>();
  (regs || []).forEach((r) => { if (r?.id) regById.set(r.id, r); });

  const perReg = new Map<string, SesiRowNomor[]>();
  (schedules || []).forEach((s) => {
    if (!s?.id) return;
    const k = String(s.registration_id || "");
    if (!perReg.has(k)) perReg.set(k, []);
    perReg.get(k)!.push(s);
  });

  perReg.forEach((rows, regId) => {
    const reg = regById.get(regId);
    const total = Number(reg?.sessions_total) || 0;
    const dipakai = Math.max(0, Number(reg?.sessions_used) || 0);
    const layak = (n: number | null) =>
      n && n >= 1 && (total <= 0 || n <= total) ? n : null;

    const asc = rows
      .slice()
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
    // Sesi batal/hangus tak memakan jatah paket → jangan ikut menggeser penomoran;
    // nomor tersimpannya dipakai apa adanya.
    const hidup = asc.filter((s) => !sesiMati(s.status));
    asc.filter((s) => sesiMati(s.status)).forEach((s) => {
      out.set(s.id, layak(Number(s.session_number) || null));
    });

    const selesaiNyata = hidup.filter((s) => s.status === "completed").length;
    const kurang = Math.max(0, total - hidup.length);
    // Sesi yang terpakai tapi tak punya baris jadwal — pemakan nomor di depan.
    const semuSelesai = Math.max(0, Math.min(dipakai - selesaiNyata, kurang));
    // Kalau baris jadwalnya lengkap satu paket DAN semuanya bernomor, percaya
    // nomor dari admin: mencampur session_number dengan urutan kronologis gampang
    // bikin nomor kembar.
    const semuaBernomor =
      hidup.length > 0 && kurang === 0 && hidup.every((s) => Number.isFinite(Number(s.session_number)));

    hidup.forEach((s, i) => {
      const no = semuaBernomor ? Number(s.session_number) : semuSelesai + i + 1;
      out.set(s.id, layak(no));
    });
  });

  return out;
}
