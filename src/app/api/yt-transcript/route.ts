// [watch-yt-transcript-v1] Pengambil caption YouTube untuk Watch & Learn.
//
// Kenapa route ini ada: Edge Function `yt-transcript` (Supabase/Deno) sering
// diblokir YouTube karena IP datacenter-nya (balik LOGIN_REQUIRED, tanpa caption)
// — persis kenapa app mobile fetch caption ON-DEVICE. Di web, browser tak bisa
// fetch timedtext langsung (CORS). Jadi kita fetch dari server Next (IP Vercel,
// beda dari Supabase) pakai trik InnerTube client IOS + visitorData, lalu balikin
// cue mentah. Terjemahan ke Indonesia tetap lewat Edge Function `yt-transcript`
// mode translate-only (Mode A) di client — reuse infra AI yang sudah ada.
//
// Best-effort: balikin { cues: [] } saat gagal/tanpa caption biar player fallback
// ke subtitle bawaan YouTube.

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const INNERTUBE_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";

interface InnerTubeClient {
  ctx: Record<string, unknown>;
  ua: string;
}

// Client InnerTube yang caption track-nya punya timedtext baseUrl yang bisa
// difetch. IOS menangani paling luas (termasuk video "made for kids"); ANDROID_VR
// cadangan. Tiap track difetch dgn UA client-nya.
const CLIENTS: InnerTubeClient[] = [
  {
    ctx: {
      clientName: "IOS", clientVersion: "20.03.02", deviceMake: "Apple",
      deviceModel: "iPhone16,2", osName: "iPhone", osVersion: "18.2.1.22C161", hl: "en",
    },
    ua: "com.google.ios.youtube/20.03.02 (iPhone16,2; U; CPU iOS 18_2_1 like Mac OS X)",
  },
  {
    ctx: {
      clientName: "ANDROID_VR", clientVersion: "1.62.27", deviceMake: "Oculus",
      deviceModel: "Quest 3", androidSdkVersion: 32, osName: "Android", osVersion: "12L", hl: "en",
    },
    ua: "com.google.android.apps.youtube.vr.oculus/1.62.27 (Linux; U; Android 12L; GB) gzip",
  },
];

const NON_LATIN = new Set(["ja", "ko", "zh", "ar", "ru", "hi", "th"]);

interface CaptionTrack {
  baseUrl: string;
  languageCode?: string;
  kind?: string; // 'asr' = auto-generated
}

interface RawCue {
  start: number;
  end: number;
  target: string;
}

async function fetchTimeout(url: string, init: RequestInit, ms = 9000): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

// visitorData bikin banyak video yang tadinya LOGIN_REQUIRED jadi playable +
// caption-nya kebaca. Cache di memori proses (token valid berjam-jam).
let cachedVisitor: { value: string; at: number } | null = null;
const VISITOR_TTL_MS = 6 * 60 * 60 * 1000;

async function getVisitorData(): Promise<string> {
  if (cachedVisitor && Date.now() - cachedVisitor.at < VISITOR_TTL_MS) return cachedVisitor.value;
  try {
    const res = await fetchTimeout(
      `https://www.youtube.com/youtubei/v1/visitor_id?key=${INNERTUBE_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: { client: { clientName: "IOS", clientVersion: "20.03.02" } } }),
      },
      6000
    );
    if (!res.ok) return "";
    const data = await res.json();
    const vd = data?.responseContext?.visitorData;
    if (typeof vd === "string" && vd) {
      cachedVisitor = { value: vd, at: Date.now() };
      return vd;
    }
  } catch {
    /* fallback tanpa token */
  }
  return "";
}

async function getCaptionTracks(
  videoId: string
): Promise<{ tracks: CaptionTrack[]; ua: string } | null> {
  const visitorData = await getVisitorData();
  for (const client of CLIENTS) {
    try {
      const res = await fetchTimeout(`https://www.youtube.com/youtubei/v1/player?key=${INNERTUBE_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": client.ua,
          Origin: "https://www.youtube.com",
        },
        body: JSON.stringify({
          context: { client: visitorData ? { ...client.ctx, visitorData } : client.ctx },
          videoId,
          contentCheckOk: true,
          racyCheckOk: true,
        }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (Array.isArray(tracks) && tracks.length) {
        return { tracks: tracks as CaptionTrack[], ua: client.ua };
      }
    } catch {
      /* coba client berikutnya */
    }
  }
  return null;
}

// Pilih track terbaik: track manusia di bahasa target dulu, lalu auto-caption di
// bahasa itu. `allowForeign` mengizinkan bahasa lain (buat free-paste); untuk
// katalog kita ketat — kalau tak ada di bahasa target, balikin null (fallback CC).
function pickTrack(
  tracks: CaptionTrack[],
  langCode: string,
  allowForeign: boolean
): CaptionTrack | null {
  if (!tracks.length) return null;
  const base = (langCode || "").split("-")[0].toLowerCase();
  const human = tracks.filter((t) => t.kind !== "asr");
  const asr = tracks.filter((t) => t.kind === "asr");
  const inLang = (list: CaptionTrack[]) =>
    base ? list.find((t) => t.languageCode?.toLowerCase().startsWith(base)) : undefined;
  const native = inLang(human) ?? inLang(asr);
  if (native) return native;
  if (allowForeign) {
    if (base && NON_LATIN.has(base)) return null; // track Latin tak berguna utk target non-Latin
    return human[0] ?? asr[0] ?? tracks[0] ?? null;
  }
  return null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;|&#34;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

function cleanCaptionText(raw: string): string {
  let t = decodeEntities(raw.replace(/<[^>]+>/g, ""));
  if (/&(?:amp|lt|gt|quot|apos|#\d+);/.test(t)) t = decodeEntities(t);
  t = t.replace(/<[^>]+>/g, "");
  return t.replace(/\s+/g, " ").trim();
}

async function fetchXml(url: string, ua: string): Promise<string | null> {
  try {
    const res = await fetchTimeout(url, { headers: { "User-Agent": ua } });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

// Feed legacy srv1 "<text start dur>" (detik) — baris bersih & non-overlap.
function parseSrv1(xml: string): RawCue[] {
  const cues: RawCue[] = [];
  const re = /<text\s+start="([\d.]+)"(?:[^>]*?\bdur="([\d.]+)")?[^>]*>([\s\S]*?)<\/text>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const start = parseFloat(m[1]);
    const dur = m[2] ? parseFloat(m[2]) : 0;
    const target = cleanCaptionText(m[3]);
    if (!target || Number.isNaN(start)) continue;
    cues.push({ start, end: start + (dur > 0 ? dur : 4), target });
  }
  return cues;
}

interface Srv3Word {
  t: number;
  raw: string;
}

// Feed srv3 "<p t d>" (ms). Auto-caption = rolling window yang overlap; kita ambil
// kata level `<s>` dgn timestamp absolut, buang echo, regroup ke cue rapi.
function parseSrv3(xml: string): RawCue[] {
  const words: Srv3Word[] = [];
  const plain: RawCue[] = [];
  let segmented = false;
  const pRe = /<p\b([^>]*)>([\s\S]*?)<\/p>/g;
  let pm: RegExpExecArray | null;
  while ((pm = pRe.exec(xml))) {
    const attrs = pm[1];
    const inner = pm[2];
    const ptM = /\bt="(-?\d+)"/.exec(attrs);
    if (!ptM) continue;
    const pStart = parseInt(ptM[1], 10);
    if (Number.isNaN(pStart) || pStart < 0) continue;
    const sRe = /<s\b([^>]*)>([\s\S]*?)<\/s>/g;
    let sm: RegExpExecArray | null;
    let anySeg = false;
    while ((sm = sRe.exec(inner))) {
      const offM = /\bt="(-?\d+)"/.exec(sm[1]);
      const off = offM ? parseInt(offM[1], 10) : 0;
      const raw = decodeEntities(sm[2].replace(/<[^>]+>/g, ""));
      if (!raw.trim()) continue;
      anySeg = true;
      words.push({ t: pStart + (Number.isFinite(off) ? off : 0), raw });
    }
    if (anySeg) {
      segmented = true;
      continue;
    }
    const target = cleanCaptionText(inner);
    if (!target) continue;
    const pdM = /\bd="(\d+)"/.exec(attrs);
    const durMs = pdM ? parseInt(pdM[1], 10) : 0;
    const start = pStart / 1000;
    plain.push({ start, end: start + (durMs > 0 ? durMs / 1000 : 4), target });
  }
  if (!segmented) return plain;

  words.sort((a, b) => a.t - b.t);
  const uniq: Srv3Word[] = [];
  for (const w of words) {
    const prev = uniq[uniq.length - 1];
    if (prev && prev.t === w.t && prev.raw.trim() === w.raw.trim()) continue;
    uniq.push(w);
  }
  const cues: RawCue[] = [];
  let buf: Srv3Word[] = [];
  const flush = (nextStart?: number) => {
    if (!buf.length) return;
    const start = buf[0].t / 1000;
    const lastStart = buf[buf.length - 1].t / 1000;
    const end = nextStart != null ? Math.min(nextStart / 1000, lastStart + 2) : lastStart + 1.2;
    const target = cleanCaptionText(buf.map((w) => w.raw).join(""));
    if (target) cues.push({ start, end: Math.max(end, start + 0.4), target });
    buf = [];
  };
  for (let i = 0; i < uniq.length; i++) {
    const w = uniq[i];
    if (buf.length) {
      const gap = w.t - uniq[i - 1].t;
      const span = w.t - buf[0].t;
      if (gap > 800 || buf.length >= 9 || span > 5500) flush(w.t);
    }
    buf.push(w);
  }
  flush();
  return cues;
}

function normalizeCues(cues: RawCue[]): RawCue[] {
  cues.sort((a, b) => a.start - b.start);
  const deduped: RawCue[] = [];
  for (const c of cues) {
    const prev = deduped[deduped.length - 1];
    if (prev && prev.target === c.target && Math.abs(prev.start - c.start) < 0.05) continue;
    deduped.push(c);
  }
  for (let i = 0; i < deduped.length - 1; i++) {
    if (deduped[i].end > deduped[i + 1].start) deduped[i].end = deduped[i + 1].start;
  }
  return deduped.filter((c) => c.end > c.start);
}

async function fetchCues(track: CaptionTrack, ua: string): Promise<RawCue[]> {
  const clean = track.baseUrl.replace(/[?&]fmt=[^&]*/g, "");
  const withFmt = (fmt: string) => `${clean}${clean.includes("?") ? "&" : "?"}fmt=${fmt}`;
  const srv1Xml = await fetchXml(withFmt("srv1"), ua);
  let cues = srv1Xml ? parseSrv1(srv1Xml) : [];
  if (!cues.length) {
    const srv3Xml = await fetchXml(withFmt("srv3"), ua);
    cues = srv3Xml ? parseSrv3(srv3Xml) : [];
  }
  return normalizeCues(cues);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const videoId = typeof body?.videoId === "string" ? body.videoId.trim() : "";
    const language = typeof body?.language === "string" ? body.language.trim() : "";
    const allowForeign = body?.allowForeign === true;
    if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
      return NextResponse.json({ error: "videoId tidak valid" }, { status: 400 });
    }

    const picked = await getCaptionTracks(videoId);
    if (!picked) return NextResponse.json({ cues: [], reason: "no_captions" });

    const track = pickTrack(picked.tracks, language, allowForeign);
    if (!track) return NextResponse.json({ cues: [], reason: "no_captions" });

    const cues = await fetchCues(track, picked.ua);
    if (!cues.length) return NextResponse.json({ cues: [], reason: "empty" });

    return NextResponse.json(
      { cues, trackLang: track.languageCode ?? "", kind: track.kind ?? "manual" },
      { headers: { "Cache-Control": "public, max-age=3600" } }
    );
  } catch (e) {
    return NextResponse.json({ cues: [], reason: "error", detail: (e as Error)?.message }, { status: 200 });
  }
}
