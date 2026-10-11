// ⚠️ KEMBAR: salinan verbatim dari linguo-admin-dashboard/src/lib/videoClass/mp4Seekable.ts
// (modul bebas DOM/Supabase; satu-satunya beda: literal `0n` → `BigInt(0)` karena tsconfig
// landing target ES2017). Dipakai penyambung rekaman sisi server
// (src/lib/recordingsFinalize.ts). Kalau yang di dashboard berubah, salin ulang ke sini.

// [vc-mp4seek-v1] Rekaman MediaRecorder (MP4) dibuat BISA DI-SEEK sebelum diunggah.
//
// Laporan (Rini, 10 Sep 2026): "recording terus loading, tidak bisa dimajukan ke
// menit tertentu". Diperiksa dari berkasnya sendiri (ffprobe + pembaca box):
// MediaRecorder Chrome menulis **fragmented MP4** — `moov` di depan berisi
// `mvex`, lalu ratusan pasang `moof`/`mdat` (±15 detik per fragmen). Dua hal
// yang bikin pemutar browser mati langkah:
//
//   1. `mvhd.duration = 0`, dan `tkhd`/`mdhd` cuma mencatat durasi FRAGMEN
//      PERTAMA (16 detik untuk rekaman 4½ menit). `<video>` percaya header:
//      `video.duration` = 16 s → garis waktu, `currentTime`, dan `seekable`
//      terkunci di 16 detik. Melompat ke menit 30 diclamp balik.
//   2. Tidak ada indeks fragmen (`sidx`). Tanpa itu, seek ke bagian yang belum
//      terunduh berarti browser harus mengunduh & mem-parse semua fragmen
//      sebelumnya dulu — itulah "loading terus" begitu garis waktu diklik.
//
// Perbaikannya murni menulis ulang KEPALA berkas, tanpa transcode:
//   • durasi `mvhd`/`tkhd`/`mdhd` diisi dari `tfdt` fragmen terakhir (+ durasi
//     sampelnya), jadi `video.duration` benar sejak byte pertama;
//   • box `sidx` disisipkan tepat sebelum `moof` pertama — SATU PER TRACK
//     (video lalu audio), berurutan seperti berkas DASH: daftar (ukuran byte,
//     durasi) tiap fragmen, jadi Chrome/Safari/Firefox bisa melompat ke
//     fragmen mana pun lewat Range request tanpa membaca yang di antaranya.
//     Harus per track: demuxer FFmpeg (Chrome) baru memakai indeks fragmen
//     kalau SEMUA stream punya sidx (`frag_index.complete`); satu sidx untuk
//     video saja membuat seek stream audio jatuh ke awal berkas — diukur:
//     seek ke menit 40 = Chrome mengunduh 70 MB dari byte nol.
//
// [vc-mp4safari-v1] 25 Sep 2026 — rekaman 34 menit (Wendy Icelandic) tampil
// 1:08:03 di Safari/QuickTime. Diukur lewat AVFoundation (mesin Safari):
//   • Apple MENJUMLAHKAN `mdhd.duration` (dianggap sampel di dalam moov) dengan
//     durasi fragmen. Untuk fragmented MP4 moov tidak berisi sampel, jadi
//     `mdhd` WAJIB 0 — versi pertama pembenah ini mengisinya → durasi ganda.
//     `mvhd`/`tkhd` tidak ikut dijumlah, tetap diisi untuk Chrome.
//   • Durasi sampel TERAKHIR tiap fragmen ditulis MediaRecorder sebagai angka
//     tebakan (±1000 tick); waktu aslinya cuma ada di `tfdt` fragmen berikutnya.
//     Chrome/FFmpeg memakai tfdt, Apple menjumlahkan `trun` → kelas 34 menit
//     kurang ±30 detik dan gambar/suara makin geser. Durasi sampel terakhir
//     sekarang ditambal supaya tfdt + Σtrun = tfdt fragmen berikutnya.
//
// Aman disisipkan karena semua `tfhd` MediaRecorder memakai
// `default-base-is-moof` (offset data relatif ke moof-nya sendiri, bukan ke awal
// berkas). Kalau ada traf yang memakai `base_data_offset` absolut, berkas
// dikembalikan apa adanya — jangan pernah merusak rekaman demi seek.
//
// Dipakai di dua tempat: `uploadRecording` (rekaman baru & pemulihan potongan)
// dan skrip `scripts/perbaiki-rekaman-seek.mjs` (rekaman lama di bucket).
// Modul ini sengaja bebas DOM/Supabase supaya bisa jalan di Node.

export interface Mp4SeekResult {
  blob: Blob;
  /** true = kepala berkas ditulis ulang; false = tidak disentuh (lihat `reason`). */
  changed: boolean;
  /** Durasi film (detik) hasil pembacaan fragmen — 0 kalau tidak diubah. */
  durationSec: number;
  fragments: number;
  reason?: string;
}

interface Box { off: number; len: number; type: string; hdr: number }

const TE = new TextDecoder("latin1");
const typeAt = (dv: DataView, o: number) => TE.decode(new Uint8Array(dv.buffer, dv.byteOffset + o, 4));

/** Daftar box langsung di bawah [start, end) dari sebuah DataView. */
function childBoxes(dv: DataView, start: number, end: number): Box[] {
  const out: Box[] = [];
  let o = start;
  while (o + 8 <= end) {
    let len = dv.getUint32(o);
    const type = typeAt(dv, o + 4);
    let hdr = 8;
    if (len === 1) { len = Number(dv.getBigUint64(o + 8)); hdr = 16; }
    else if (len === 0) len = end - o;
    if (len < hdr || o + len > end) break; // box rusak → berhenti, jangan menebak
    out.push({ off: o, len, type, hdr });
    o += len;
  }
  return out;
}

async function view(blob: Blob, off: number, len: number): Promise<DataView> {
  const buf = await blob.slice(off, off + len).arrayBuffer();
  return new DataView(buf);
}

/** Box tingkat atas seluruh berkas, dibaca 16 byte per kepala. */
async function topLevel(blob: Blob): Promise<Box[]> {
  const out: Box[] = [];
  let off = 0;
  const size = blob.size;
  while (off + 8 <= size) {
    const dv = await view(blob, off, Math.min(16, size - off));
    let len = dv.getUint32(0);
    const type = typeAt(dv, 4);
    let hdr = 8;
    if (len === 1) {
      if (dv.byteLength < 16) break;
      len = Number(dv.getBigUint64(8)); hdr = 16;
    } else if (len === 0) len = size - off;
    if (len < hdr || off + len > size) break;
    out.push({ off, len, type, hdr });
    off += len;
  }
  return out;
}

interface TrackInfo {
  id: number;
  handler: string;
  timescale: number;
  trexDefaultDur: number;
  /** offset absolut (dalam blob) ke field duration tkhd & mdhd + versinya */
  tkhdDurOff: number; tkhdV: number;
  mdhdDurOff: number; mdhdV: number;
}

interface FragTrack {
  time: number;
  dur: number;
  /** offset (relatif ke awal moof) field durasi sampel terakhir; -1 = tak bisa ditambal */
  lastDurOff: number;
  lastDur: number;
}

/** Baca satu moof: per track → baseMediaDecodeTime & jumlah durasi sampel. */
function parseMoof(dv: DataView, moof: Box, tracks: Map<number, TrackInfo>): { perTrack: Map<number, FragTrack>; absoluteBase: boolean } {
  const perTrack = new Map<number, FragTrack>();
  let absoluteBase = false;
  for (const traf of childBoxes(dv, moof.hdr, moof.len).filter((b) => b.type === "traf")) {
    const kids = childBoxes(dv, traf.off + traf.hdr, traf.off + traf.len);
    const tfhd = kids.find((b) => b.type === "tfhd");
    if (!tfhd) continue;
    let p = tfhd.off + tfhd.hdr;
    const tfFlags = dv.getUint32(p) & 0xffffff; p += 4;
    const trackId = dv.getUint32(p); p += 4;
    if (tfFlags & 0x1) { absoluteBase = true; p += 8; }              // base_data_offset absolut
    if (tfFlags & 0x2) p += 4;                                         // sample_description_index
    let defDur = 0;
    if (tfFlags & 0x8) { defDur = dv.getUint32(p); p += 4; }           // default_sample_duration
    if (!(tfFlags & 0x20000) && !(tfFlags & 0x1)) {
      // Tanpa default-base-is-moof dan tanpa base_data_offset: basis = awal moof
      // PERTAMA di berkas (aturan lama) — menyisipkan sidx menggeser semuanya.
      absoluteBase = true;
    }
    if (!defDur) defDur = tracks.get(trackId)?.trexDefaultDur ?? 0;

    const tfdt = kids.find((b) => b.type === "tfdt");
    let time = 0;
    if (tfdt) {
      const v = dv.getUint8(tfdt.off + tfdt.hdr);
      time = v === 1 ? Number(dv.getBigUint64(tfdt.off + tfdt.hdr + 4)) : dv.getUint32(tfdt.off + tfdt.hdr + 4);
    }

    let dur = 0;
    let lastDurOff = -1;
    let lastDur = 0;
    for (const trun of kids.filter((b) => b.type === "trun")) {
      let q = trun.off + trun.hdr;
      const flags = dv.getUint32(q) & 0xffffff; q += 4;
      const count = dv.getUint32(q); q += 4;
      if (flags & 0x1) q += 4;   // data_offset
      if (flags & 0x4) q += 4;   // first_sample_flags
      const hasDur = !!(flags & 0x100);
      const per = (flags & 0x100 ? 4 : 0) + (flags & 0x200 ? 4 : 0) + (flags & 0x400 ? 4 : 0) + (flags & 0x800 ? 4 : 0);
      if (hasDur) {
        for (let i = 0; i < count; i++) {
          lastDurOff = q; lastDur = dv.getUint32(q);
          dur += lastDur; q += per;
        }
      } else {
        dur += count * defDur;
        if (count) lastDurOff = -1;
      }
    }
    const prev = perTrack.get(trackId);
    if (prev) { prev.dur += dur; prev.lastDurOff = lastDurOff; prev.lastDur = lastDur; }
    else perTrack.set(trackId, { time, dur, lastDurOff, lastDur });
  }
  return { perTrack, absoluteBase };
}

function setDuration(dv: DataView, off: number, version: number, value: number): boolean {
  if (version === 1) { dv.setBigUint64(off, BigInt(Math.round(value))); return true; }
  if (value > 0xffffffff) return false;
  dv.setUint32(off, Math.round(value));
  return true;
}

export async function makeMp4Seekable(blob: Blob): Promise<Mp4SeekResult> {
  const unchanged = (reason: string): Mp4SeekResult => ({ blob, changed: false, durationSec: 0, fragments: 0, reason });
  if (blob.size < 64) return unchanged("terlalu kecil");

  const boxes = await topLevel(blob);
  const ftyp = boxes[0];
  if (!ftyp || ftyp.type !== "ftyp") return unchanged("bukan MP4 (tanpa ftyp)");
  const moov = boxes.find((b) => b.type === "moov");
  if (!moov) return unchanged("tanpa moov");
  const moofs = boxes.filter((b) => b.type === "moof");
  if (!moofs.length) return unchanged("bukan fragmented MP4 (tanpa moof)");
  if (moofs.length > 65535) return unchanged("fragmen terlalu banyak untuk satu sidx");
  const firstMoof = moofs[0];
  if (firstMoof.off < moov.off + moov.len) return unchanged("moof mendahului moov");

  // ── moov ────────────────────────────────────────────────────────────────────
  const moovBuf = await blob.slice(moov.off, moov.off + moov.len).arrayBuffer();
  const mv = new DataView(moovBuf);
  const mkids = childBoxes(mv, moov.hdr, moov.len);
  const mvhd = mkids.find((b) => b.type === "mvhd");
  if (!mvhd) return unchanged("tanpa mvhd");
  const mvhdV = mv.getUint8(mvhd.off + mvhd.hdr);
  const mvhdTs = mv.getUint32(mvhd.off + mvhd.hdr + (mvhdV === 1 ? 20 : 12));
  const mvhdDurOff = mvhd.off + mvhd.hdr + (mvhdV === 1 ? 24 : 16);

  const tracks = new Map<number, TrackInfo>();
  const mvex = mkids.find((b) => b.type === "mvex");
  const trexDefault = new Map<number, number>();
  if (mvex) {
    for (const trex of childBoxes(mv, mvex.off + mvex.hdr, mvex.off + mvex.len).filter((b) => b.type === "trex")) {
      const p = trex.off + trex.hdr + 4;
      trexDefault.set(mv.getUint32(p), mv.getUint32(p + 8));
    }
  }
  for (const trak of mkids.filter((b) => b.type === "trak")) {
    const tk = childBoxes(mv, trak.off + trak.hdr, trak.off + trak.len);
    const tkhd = tk.find((b) => b.type === "tkhd");
    const mdia = tk.find((b) => b.type === "mdia");
    if (!tkhd || !mdia) continue;
    const tkhdV = mv.getUint8(tkhd.off + tkhd.hdr);
    const id = mv.getUint32(tkhd.off + tkhd.hdr + (tkhdV === 1 ? 20 : 12));
    const md = childBoxes(mv, mdia.off + mdia.hdr, mdia.off + mdia.len);
    const mdhd = md.find((b) => b.type === "mdhd");
    const hdlr = md.find((b) => b.type === "hdlr");
    if (!mdhd) continue;
    const mdhdV = mv.getUint8(mdhd.off + mdhd.hdr);
    tracks.set(id, {
      id,
      handler: hdlr ? typeAt(mv, hdlr.off + hdlr.hdr + 8) : "",
      timescale: mv.getUint32(mdhd.off + mdhd.hdr + (mdhdV === 1 ? 20 : 12)),
      trexDefaultDur: trexDefault.get(id) ?? 0,
      tkhdDurOff: tkhd.off + tkhd.hdr + (tkhdV === 1 ? 28 : 20), tkhdV,
      mdhdDurOff: mdhd.off + mdhd.hdr + (mdhdV === 1 ? 24 : 16), mdhdV,
    });
  }
  if (!tracks.size) return unchanged("tanpa trak");
  // sidx lama (mis. versi pertama pembenah ini yang cuma menulis satu sidx
  // untuk video) dibuang dan dibangun ulang; kalau sudah lengkap satu per
  // track, berkasnya dibiarkan.
  const oldSidx = boxes.filter((b) => b.type === "sidx" && b.off >= moov.off + moov.len && b.off < firstMoof.off);
  if (boxes.some((b) => b.type === "sidx" && !oldSidx.includes(b))) return unchanged("sidx di posisi tak dikenal");
  const sidxComplete = oldSidx.length >= tracks.size;
  const mdhdDirty = [...tracks.values()].some((t) =>
    t.mdhdV === 1 ? mv.getBigUint64(t.mdhdDurOff) !== BigInt(0) : mv.getUint32(t.mdhdDurOff) !== 0);

  // ── moof: waktu & durasi per fragmen ────────────────────────────────────────
  type Frag = { off: number; size: number; moofLen: number; moof: DataView; perTrack: Map<number, FragTrack> };
  const frags: Frag[] = [];
  for (let i = 0; i < moofs.length; i++) {
    const m = moofs[i];
    const next = moofs[i + 1];
    const dv = await view(blob, m.off, m.len);
    const parsed = parseMoof(dv, { ...m, off: 0 }, tracks);
    if (parsed.absoluteBase) return unchanged("traf memakai base_data_offset absolut");
    // Segmen = moof + semua box sampai moof berikutnya (mdat, kadang free).
    const end = next ? next.off : blob.size;
    frags.push({ off: m.off, size: end - m.off, moofLen: m.len, moof: dv, perTrack: parsed.perTrack });
  }

  // [vc-mp4safari-v1] Tambal durasi sampel terakhir tiap fragmen dari tfdt
  // berikutnya (lihat catatan di atas). Fragmen terakhir tidak punya acuan →
  // dibiarkan.
  let gapsFixed = 0;
  for (let i = 0; i + 1 < frags.length; i++) {
    for (const [id, cur] of frags[i].perTrack) {
      const nxt = frags[i + 1].perTrack.get(id);
      if (!nxt || cur.lastDurOff < 0) continue;
      const gap = nxt.time - (cur.time + cur.dur);
      if (!gap) continue;
      const fixed = cur.lastDur + gap;
      if (fixed <= 0 || fixed > 0xffffffff) continue;
      frags[i].moof.setUint32(cur.lastDurOff, fixed);
      cur.dur += gap; cur.lastDur = fixed;
      gapsFixed++;
    }
  }
  if (sidxComplete && !mdhdDirty && !gapsFixed) return unchanged("sudah seekable & rapi");

  // Durasi tiap fragmen PER TRACK: selisih tfdt dengan fragmen berikutnya
  // (paling akurat), fragmen terakhir memakai jumlah durasi sampelnya.
  const fragDur = (trackId: number, i: number): number => {
    const cur = frags[i].perTrack.get(trackId);
    const nxt = frags[i + 1]?.perTrack.get(trackId);
    if (!cur) return 0;
    return nxt && nxt.time > cur.time ? nxt.time - cur.time : cur.dur;
  };

  // Durasi total per track (unit timescale track).
  const trackTotal = new Map<number, number>();
  for (const f of frags) {
    for (const [id, ft] of f.perTrack) trackTotal.set(id, Math.max(trackTotal.get(id) ?? 0, ft.time + ft.dur));
  }
  let movieSec = 0;
  for (const [id, total] of trackTotal) {
    const t = tracks.get(id);
    if (t?.timescale) movieSec = Math.max(movieSec, total / t.timescale);
  }
  if (!(movieSec > 0)) return unchanged("durasi fragmen tidak terbaca");

  // ── Tulis ulang kepala ──────────────────────────────────────────────────────
  const patched = new DataView(moovBuf.slice(0));
  if (!setDuration(patched, mvhdDurOff, mvhdV, movieSec * mvhdTs)) return unchanged("durasi melebihi mvhd 32-bit");
  for (const [id, total] of trackTotal) {
    const t = tracks.get(id);
    if (!t) continue;
    setDuration(patched, t.tkhdDurOff, t.tkhdV, (total / t.timescale) * mvhdTs);
    // [vc-mp4safari-v1] 0, BUKAN total: Safari menambahkannya ke durasi fragmen.
    setDuration(patched, t.mdhdDurOff, t.mdhdV, 0);
  }

  const n = frags.length;
  // Urutan: video dulu (track acuan pemutar), lalu sisanya.
  const sidxTracks = [...tracks.values()]
    .filter((t) => trackTotal.has(t.id))
    .sort((a, b) => (a.handler === "vide" ? 0 : 1) - (b.handler === "vide" ? 0 : 1));
  const sidxSize = 40 + 12 * n;
  const sidxBoxes: ArrayBuffer[] = sidxTracks.map((t, k) => {
    const sidx = new DataView(new ArrayBuffer(sidxSize));
    sidx.setUint32(0, sidxSize);
    new Uint8Array(sidx.buffer, 4, 4).set([0x73, 0x69, 0x64, 0x78]); // 'sidx'
    sidx.setUint8(8, 1);                       // version 1 (waktu 64-bit), flags 0
    sidx.setUint32(12, t.id);                  // reference_ID
    sidx.setUint32(16, t.timescale);           // timescale
    const firstTime = frags[0].perTrack.get(t.id)?.time ?? 0;
    sidx.setBigUint64(20, BigInt(firstTime));  // earliest_presentation_time
    // first_offset: jarak dari ujung sidx ini ke moof pertama = sidx-sidx sesudahnya.
    sidx.setBigUint64(28, BigInt((sidxTracks.length - 1 - k) * sidxSize));
    sidx.setUint16(36, 0);                     // reserved
    sidx.setUint16(38, n);                     // reference_count
    for (let i = 0; i < n; i++) {
      const o = 40 + 12 * i;
      sidx.setUint32(o, frags[i].size & 0x7fffffff);       // reference_type 0 | referenced_size
      sidx.setUint32(o + 4, fragDur(t.id, i));              // subsegment_duration
      sidx.setUint32(o + 8, 0x90000000);                    // starts_with_SAP 1, SAP_type 1, delta 0
    }
    return sidx.buffer;
  });

  // Isi di antara moov dan moof pertama, TANPA sidx lama.
  const between: Blob[] = [];
  let cursor = moov.off + moov.len;
  for (const b of oldSidx) { if (b.off > cursor) between.push(blob.slice(cursor, b.off)); cursor = b.off + b.len; }
  if (firstMoof.off > cursor) between.push(blob.slice(cursor, firstMoof.off));

  const out = new Blob(
    [
      blob.slice(0, moov.off),                            // ftyp (+ apa pun sebelum moov)
      patched.buffer,                                     // moov dengan durasi benar
      ...between,                                         // box di antara (biasanya kosong)
      ...sidxBoxes,
      // Seluruh fragmen: moof (durasi sampel terakhir sudah ditambal) + mdat utuh.
      ...frags.flatMap((f) => [
        new Uint8Array(f.moof.buffer, f.moof.byteOffset, f.moofLen),
        blob.slice(f.off + f.moofLen, f.off + f.size),
      ]),
    ],
    { type: blob.type || "video/mp4" },
  );
  return { blob: out, changed: true, durationSec: movieSec, fragments: n };
}
