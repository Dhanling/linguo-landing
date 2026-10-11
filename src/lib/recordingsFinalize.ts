// [rekaman-sambung-server-v1] 11 Okt 2026 — penyambung rekaman Kelas Video di SERVER.
//
// Latar: perekam browser (SessionRecorder di linguo-admin-dashboard) mengunggah
// rekaman per potongan 3 menit ke `video-recordings/<roomId>/<stamp>.parts/`.
// Kalau tab pengajar tertutup sebelum berkas utuhnya naik, potongan itu
// tertinggal dan Riwayat Kelas memajang banner "N rekaman belum selesai
// tersimpan" + tombol "Sambung & simpan" yang menyambung DI BROWSER pengajar
// (tarik ratusan MB, gabung, unggah lagi). Hampir tidak ada yang menekannya —
// 11 Okt 2026 ada 7 rekaman menggantung sampai 5 hari.
//
// Modul ini mengerjakan hal yang sama dari server (dipanggil pg_cron lewat
// /api/cron/recordings-finalize), tanpa menunggu pengajar:
//   1. pindai kedua bucket rekaman, cari folder `*.parts` yang manifest-nya
//      sudah basi (> STALE_MS — perekamnya pasti sudah mati) dan punya
//      potongan 0000 (kepala wadah; tanpa itu berkasnya tak bisa diputar);
//   2. unduh potongan berurutan ke /tmp (irisan byte dari satu aliran yang
//      sama — bukan transcode), tulis ulang kepala MP4 supaya bisa di-seek
//      (makeMp4Seekable, kembar dari dashboard), unggah lewat TUS 6 MB per
//      bagian supaya memori tetap kecil dan satu kedipan jaringan tak
//      membatalkan 400 MB;
//   3. tulis sidecar .json + katalog `class_recordings` + `schedules.recording_url`
//      persis seperti `uploadRecording` di dashboard, lalu buang folder potongan.
//
// Kunci `finalize-server.json` di dalam folder potongan mencatat percobaan
// (supaya dua pemanggilan cron tidak menggarap folder yang sama, dan folder yang
// rusak tidak ditarik ulang tiap 10 menit). Jalur browser tidak tersentuh:
// tombol "Sambung & simpan" tetap ada dan aman dipakai berbarengan — keduanya
// menulis ke kunci berkas yang sama dengan upsert.
//
// Batas yang dijaga: /tmp Vercel 500 MB → rekaman > MAX_BYTES dilewati dengan
// alasan jelas (tetap bisa disambung manual dari Riwayat); satu pemanggilan
// berhenti mengambil pekerjaan baru setelah TIME_BUDGET_MS supaya tidak
// menabrak maxDuration.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createWriteStream, openAsBlob } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { makeMp4Seekable } from "./mp4Seekable";

const BUCKETS = ["class-recordings", "class-materials"] as const; // privat (baru) + publik (lama)
const PREFIX = "video-recordings";
const LOCK_NAME = "finalize-server.json";
const STALE_MS = 20 * 60_000;           // manifest lebih muda = perekamnya mungkin masih jalan
const LOCK_FRESH_MS = 6 * 60_000;       // kunci lebih muda = pemanggilan lain sedang menggarap
const RETRY_AFTER_MS = 3 * 60 * 60_000; // jeda sesudah gagal
const MAX_ATTEMPTS = 6;
const MAX_BYTES = 470 * 1024 * 1024;    // /tmp Vercel 500 MB
const TUS_CHUNK = 6 * 1024 * 1024;      // Supabase mewajibkan 6 MB per bagian
const DASHBOARD_ORIGIN = "https://dashboard.linguo.id";

export interface RecordingMeta {
  roomId: string;
  title: string;
  topic?: string;
  teacher?: string;
  durationSec: number;
  participants: number;
  recordedAt: string;
  hostUserId?: string;
}
interface PartsManifest extends RecordingMeta { parts: number; updatedAt: string }
interface Lock { startedAt?: string; attempts: number; lastAttemptAt?: string; lastError?: string }

export interface Candidate {
  bucket: string;
  folder: string;
  meta: PartsManifest;
  partKeys: string[];
  expected: number;
  sizeBytes: number;
  updatedAt: string;
  lock: Lock | null;
  /** Kosong = layak digarap sekarang; selain itu alasan dilewati. */
  skip?: string;
}

export interface FinalizeResult {
  folder: string;
  ok: boolean;
  key?: string;
  sizeBytes?: number;
  durationSec?: number;
  seekable?: boolean;
  ms: number;
  error?: string;
}

type Entry = { name: string; id: string | null; metadata?: { size?: number } | null };

function adminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diset.");
  // createClient polos — BUKAN createServerClient (itu menyuntik cache Next.js
  // ke fetch; unduhan potongan & daftar folder tidak boleh di-cache).
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

async function listAll(sb: SupabaseClient, bucket: string, path: string): Promise<Entry[]> {
  const out: Entry[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await sb.storage.from(bucket).list(path, { limit: 1000, offset });
    if (error) throw new Error(`list ${bucket}/${path}: ${error.message}`);
    out.push(...((data ?? []) as Entry[]));
    if (!data || data.length < 1000) return out;
  }
}

async function readJson<T>(sb: SupabaseClient, bucket: string, key: string): Promise<T | null> {
  const { data } = await sb.storage.from(bucket).download(key);
  if (!data) return null;
  try { return JSON.parse(await data.text()) as T; } catch { return null; }
}

/** Semua folder potongan yang tertinggal, lengkap dengan alasan kalau belum layak digarap. */
export async function listCandidates(sb: SupabaseClient = adminClient()): Promise<Candidate[]> {
  const out: Candidate[] = [];
  for (const bucket of BUCKETS) {
    let rooms: Entry[];
    try { rooms = await listAll(sb, bucket, PREFIX); } catch { continue; } // bucket lama bisa saja sudah tak ada
    for (const room of rooms) {
      if (room.id !== null || !room.name) continue; // hanya folder room
      const roomPath = `${PREFIX}/${room.name}`;
      const entries = await listAll(sb, bucket, roomPath);
      // Berkas utuh yang sudah ada: folder potongan ber-stamp sama berarti
      // rekamannya SUDAH tersimpan (dropAll gagal) — sama seperti di dashboard.
      const done = new Set(
        entries.filter((e) => e.id !== null && /\.(mp4|webm)$/i.test(e.name)).map((e) => e.name.replace(/(-seek\d*)?\.(mp4|webm)$/i, "")),
      );
      for (const e of entries) {
        if (e.id !== null || !e.name.endsWith(".parts")) continue;
        const folder = `${roomPath}/${e.name}`;
        const stamp = e.name.replace(/\.parts$/, "");
        const files = await listAll(sb, bucket, folder);
        if (!files.length) continue;
        if (done.has(stamp)) {
          // Potongan yatim: berkas utuhnya sudah ada. Dibersihkan di sini juga
          // supaya tidak dipindai terus — dashboard pun tidak menawarkannya.
          out.push({ bucket, folder, meta: { roomId: room.name, title: "", durationSec: 0, participants: 0, recordedAt: "", parts: 0, updatedAt: "" }, partKeys: [], expected: 0, sizeBytes: 0, updatedAt: "", lock: null, skip: "berkas utuh sudah ada (yatim)" });
          continue;
        }
        if (!files.some((f) => f.name === "manifest.json")) continue;
        const meta = await readJson<PartsManifest>(sb, bucket, `${folder}/manifest.json`);
        if (!meta) continue;
        const parts = files.filter((f) => /^\d+\.(mp4|webm)$/i.test(f.name)).sort((a, b) => a.name.localeCompare(b.name));
        if (!parts.length) continue;
        const lock = files.some((f) => f.name === LOCK_NAME) ? await readJson<Lock>(sb, bucket, `${folder}/${LOCK_NAME}`) : null;
        const c: Candidate = {
          bucket,
          folder,
          meta,
          partKeys: parts.map((f) => `${folder}/${f.name}`),
          expected: meta.parts || parts.length,
          sizeBytes: parts.reduce((n, f) => n + (f.metadata?.size ?? 0), 0),
          updatedAt: meta.updatedAt || meta.recordedAt,
          lock,
        };
        const age = Date.now() - new Date(c.updatedAt).getTime();
        if (!(age > STALE_MS)) c.skip = "manifest masih segar — perekam mungkin masih jalan";
        else if (!/^0+\.(mp4|webm)$/i.test(parts[0].name)) c.skip = "potongan 0000 (kepala berkas) tidak ada";
        else if (c.sizeBytes > MAX_BYTES) c.skip = `terlalu besar untuk /tmp server (${Math.round(c.sizeBytes / 1048576)} MB) — sambung manual dari Riwayat`;
        else if (lock?.startedAt && Date.now() - new Date(lock.startedAt).getTime() < LOCK_FRESH_MS && !lock.lastError) c.skip = "sedang digarap pemanggilan lain";
        else if (lock && lock.attempts >= MAX_ATTEMPTS) c.skip = `sudah ${lock.attempts}× gagal: ${lock.lastError ?? "?"}`;
        else if (lock?.lastAttemptAt && Date.now() - new Date(lock.lastAttemptAt).getTime() < RETRY_AFTER_MS) c.skip = `baru gagal ${lock.lastAttemptAt}: ${lock.lastError ?? "?"}`;
        out.push(c);
      }
    }
  }
  // Yang paling lama menunggu dulu.
  return out.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
}

async function writeLock(sb: SupabaseClient, c: Candidate, lock: Lock): Promise<void> {
  await sb.storage.from(c.bucket).upload(`${c.folder}/${LOCK_NAME}`, new Blob([JSON.stringify(lock)], { type: "application/json" }), {
    contentType: "application/json", upsert: true,
  });
}

async function removeFolder(sb: SupabaseClient, bucket: string, folder: string): Promise<void> {
  const files = await listAll(sb, bucket, folder);
  const paths = files.filter((f) => f.name).map((f) => `${folder}/${f.name}`);
  for (let i = 0; i < paths.length; i += 100) {
    const { error } = await sb.storage.from(bucket).remove(paths.slice(i, i + 100));
    if (error) throw new Error(`hapus folder potongan: ${error.message}`);
  }
}

/* Unggah TUS (resumable) ke Supabase Storage: bagian 6 MB dengan Content-Length
 * jelas, bisa diulang per bagian. Unggahan satu PUT 400 MB lewat fetch Node
 * harus memegang seluruh badan di memori atau memakai chunked transfer yang
 * belum tentu diterima — TUS adalah jalur resmi untuk berkas besar. */
async function tusUpload(blob: Blob, opts: { bucket: string; key: string; contentType: string }): Promise<void> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const auth = { Authorization: `Bearer ${key}`, apikey: key, "Tus-Resumable": "1.0.0" };
  const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64");
  const create = await fetch(`${base}/storage/v1/upload/resumable`, {
    method: "POST",
    headers: {
      ...auth,
      "x-upsert": "true",
      "Upload-Length": String(blob.size),
      "Upload-Metadata": [
        `bucketName ${b64(opts.bucket)}`,
        `objectName ${b64(opts.key)}`,
        `contentType ${b64(opts.contentType)}`,
        `cacheControl ${b64("31536000")}`, // rekaman tak pernah berubah — sama dengan uploadRecording
      ].join(","),
    },
  });
  if (create.status !== 201) throw new Error(`TUS create ${create.status}: ${(await create.text()).slice(0, 200)}`);
  const loc = create.headers.get("Location");
  if (!loc) throw new Error("TUS create tanpa Location");
  const url = loc.startsWith("http") ? loc : `${base}${loc}`;

  const reader = blob.stream().getReader();
  let offset = 0;
  let buf = Buffer.alloc(0);
  let eof = false;
  const patch = async (chunk: Buffer) => {
    for (let attempt = 0; ; attempt++) {
      try {
        const r = await fetch(url, {
          method: "PATCH",
          headers: { ...auth, "Upload-Offset": String(offset), "Content-Type": "application/offset+octet-stream", "Content-Length": String(chunk.length) },
          body: new Uint8Array(chunk),
        });
        if (r.status === 204) { offset = Number(r.headers.get("Upload-Offset") ?? offset + chunk.length); return; }
        if (r.status === 409) {
          // Offset server berbeda (bagian sebelumnya ternyata mendarat) — sinkronkan.
          const h = await fetch(url, { method: "HEAD", headers: auth });
          const so = Number(h.headers.get("Upload-Offset"));
          if (Number.isFinite(so) && so === offset + chunk.length) { offset = so; return; }
          throw new Error(`TUS offset tak sinkron (server ${so}, kita ${offset})`);
        }
        throw new Error(`TUS patch ${r.status}: ${(await r.text()).slice(0, 200)}`);
      } catch (e) {
        if (attempt >= 3) throw e;
        await new Promise((res) => setTimeout(res, 2000 * (attempt + 1)));
      }
    }
  };
  while (!eof) {
    while (buf.length < TUS_CHUNK && !eof) {
      const { value, done } = await reader.read();
      if (done) { eof = true; break; }
      buf = buf.length ? Buffer.concat([buf, Buffer.from(value)]) : Buffer.from(value);
    }
    while (buf.length >= TUS_CHUNK) {
      await patch(buf.subarray(0, TUS_CHUNK));
      buf = buf.subarray(TUS_CHUNK);
    }
    if (eof && buf.length) { await patch(buf); buf = Buffer.alloc(0); }
  }
  if (offset !== blob.size) throw new Error(`TUS selesai di offset ${offset}, ukuran ${blob.size}`);
}

function scheduleIdFromRoom(roomId: string): string | null {
  const m = /^sched-([0-9a-f-]{36})$/i.exec(roomId);
  return m ? m[1] : null;
}

/** Sambung satu folder potongan jadi rekaman utuh. Tidak melempar — hasilnya dilaporkan. */
export async function finalizeOne(c: Candidate, sb: SupabaseClient = adminClient()): Promise<FinalizeResult> {
  const t0 = Date.now();
  const lock: Lock = { startedAt: new Date().toISOString(), attempts: (c.lock?.attempts ?? 0) + 1 };
  const ext = /\.webm$/i.test(c.partKeys[0]) ? "webm" : "mp4";
  const tmp = join(tmpdir(), `vc-finalize-${randomUUID()}.${ext}`);
  try {
    await writeLock(sb, c, lock);

    // 1. Unduh potongan berurutan ke /tmp (memori cuma sebesar satu potongan).
    const ws = createWriteStream(tmp);
    let written = 0;
    for (const key of c.partKeys) {
      const { data, error } = await sb.storage.from(c.bucket).download(key);
      if (error || !data) throw new Error(`potongan ${key} tidak bisa dibaca: ${error?.message ?? "kosong"}`);
      const bytes = Buffer.from(await data.arrayBuffer());
      written += bytes.length;
      if (!ws.write(bytes)) await new Promise<void>((res) => ws.once("drain", res));
    }
    await new Promise<void>((res, rej) => { ws.once("error", rej); ws.end(res); });
    if (!written) throw new Error("semua potongan kosong");

    // 2. Kepala MP4 ditulis ulang supaya bisa di-seek (tanpa transcode).
    const mime = ext === "mp4" ? "video/mp4" : "video/webm";
    const input = await openAsBlob(tmp, { type: mime });
    let out: Blob = input;
    let durationSec = c.meta.durationSec > 0 ? c.meta.durationSec : 0;
    let seekable = false;
    if (ext === "mp4") {
      try {
        const r = await makeMp4Seekable(input);
        if (r.changed) { out = r.blob; seekable = true; if (r.durationSec > 0) durationSec = Math.round(r.durationSec); }
      } catch (e) {
        console.warn("[rekaman-sambung-server] pembenah seek gagal — unggah apa adanya", e);
      }
    }

    // 3. Unggah ke kunci yang sama dengan jalur browser: <prefix>/<roomId>/<stamp>.<ext>
    const stamp = new Date(c.meta.recordedAt).getTime();
    const basePath = `${PREFIX}/${c.meta.roomId}/${stamp}`;
    const videoKey = `${basePath}.${ext}`;
    await tusUpload(out, { bucket: c.bucket, key: videoKey, contentType: mime });

    // 4. Sidecar + katalog + tulis-balik jadwal — cermin uploadRecording (dashboard).
    const isLegacy = c.bucket === "class-materials";
    const sidecar = {
      ...(({ parts: _p, updatedAt: _u, ...m }) => m)(c.meta),
      durationSec,
      key: videoKey,
      bucket: c.bucket,
      url: isLegacy ? sb.storage.from(c.bucket).getPublicUrl(videoKey).data.publicUrl : "",
      sizeBytes: out.size,
      finalizedBy: "server",
    };
    await sb.storage.from(c.bucket).upload(`${basePath}.json`, new Blob([JSON.stringify(sidecar)], { type: "application/json" }), {
      contentType: "application/json", upsert: true,
    });
    const { error: catErr } = await sb.from("class_recordings").upsert({
      room_id: c.meta.roomId,
      schedule_id: scheduleIdFromRoom(c.meta.roomId),
      bucket: c.bucket,
      key: videoKey,
      title: c.meta.title,
      topic: c.meta.topic ?? null,
      teacher: c.meta.teacher ?? null,
      host_user_id: c.meta.hostUserId ?? null,
      duration_sec: durationSec,
      participants: c.meta.participants ?? 0,
      size_bytes: out.size,
      recorded_at: c.meta.recordedAt,
    }, { onConflict: "bucket,key" });
    if (catErr) console.warn("[rekaman-sambung-server] katalog gagal ditulis", catErr.message);

    const scheduleId = scheduleIdFromRoom(c.meta.roomId);
    if (scheduleId) {
      // Hanya mengisi yang masih kosong: tab mati = saveClassOutcome tak sempat
      // jalan, dan tanpa recording_url siswa tidak melihat tombol Tonton Recording.
      const { data: cur } = await sb.from("schedules").select("id, recording_url").eq("id", scheduleId).maybeSingle();
      if (cur && !cur.recording_url) {
        await sb.from("schedules").update({ recording_url: `${DASHBOARD_ORIGIN}/kelas?tab=riwayat&room=${encodeURIComponent(c.meta.roomId)}` }).eq("id", scheduleId);
      }
    }

    // 5. Potongan tidak berguna lagi.
    await removeFolder(sb, c.bucket, c.folder);
    return { folder: c.folder, ok: true, key: videoKey, sizeBytes: out.size, durationSec, seekable, ms: Date.now() - t0 };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    try { await writeLock(sb, c, { ...lock, startedAt: undefined, lastAttemptAt: new Date().toISOString(), lastError: error.slice(0, 300) }); } catch { /* biarkan */ }
    return { folder: c.folder, ok: false, ms: Date.now() - t0, error };
  } finally {
    await rm(tmp, { force: true }).catch(() => {});
  }
}

/** Satu putaran: garap kandidat yang layak sampai anggaran waktu habis. */
export async function finalizeRound(opts: { budgetMs: number; max?: number }): Promise<{ candidates: Candidate[]; results: FinalizeResult[] }> {
  const sb = adminClient();
  const t0 = Date.now();
  const candidates = await listCandidates(sb);
  const results: FinalizeResult[] = [];
  // Potongan yatim (berkas utuh sudah ada) cukup dibuang.
  for (const c of candidates) {
    if (c.skip?.startsWith("berkas utuh sudah ada")) {
      try { await removeFolder(sb, c.bucket, c.folder); results.push({ folder: c.folder, ok: true, ms: 0, error: "potongan yatim dibuang" }); }
      catch (e) { results.push({ folder: c.folder, ok: false, ms: 0, error: e instanceof Error ? e.message : String(e) }); }
    }
  }
  for (const c of candidates) {
    if (c.skip) continue;
    if (results.filter((r) => r.key).length >= (opts.max ?? 2)) break;
    // Jangan mulai pekerjaan baru kalau sisa waktu tak cukup untuk ukuran ini
    // (≈ 3 MB/dtk konservatif: unduh + unggah lintas region).
    const need = Math.max(30_000, (c.sizeBytes / (3 * 1024 * 1024)) * 1000 * 2);
    if (Date.now() - t0 + need > opts.budgetMs) { results.push({ folder: c.folder, ok: false, ms: 0, error: "ditunda — sisa waktu pemanggilan tidak cukup" }); continue; }
    results.push(await finalizeOne(c, sb));
  }
  return { candidates, results };
}
