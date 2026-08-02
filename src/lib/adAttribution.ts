// ============================================================================
// ads-conversion-sync — Fase 1: penangkap click ID iklan (sisi klien)
// ============================================================================
// Kenapa di KLIEN, bukan middleware seperti `linguo_ref`: kita butuh membaca
// cookie `_fbp` yang ditulis oleh Facebook Pixel SETELAH halaman jalan.
// Middleware jalan sebelum itu, jadi `_fbp` selalu kosong di sana.
//
// Yang disimpan: fbclid/gclid (click ID — ini yang bikin match rate Conversions
// API melonjak), cookie _fbp/_fbc, dan UTM. Disimpan dua kali:
//   • localStorage `linguo_attr` — sumber kebenaran, umur 90 hari.
//   • cookie `linguo_attr`       — supaya SEMUA route API server-side bisa ikut
//                                  menyertakan attribution tanpa tiap form
//                                  harus diubah satu-satu.
//
// Aturan touch: FIRST-TOUCH menang, KECUALI datang click ID iklan baru.
// Kedatangan fbclid/gclid baru = orangnya klik iklan lagi → seluruh touch
// (click ID + UTM + landing path) di-refresh. UTM doang tanpa click ID TIDAK
// meng-overwrite touch pertama — kalau tidak, link organik ber-UTM bakal
// mencuri kredit dari iklan yang sebenarnya membawa orang itu.
// ============================================================================

export type AdAttribution = {
  fbclid?: string;
  gclid?: string;
  fbp?: string;
  fbc?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  landing_path?: string;
  referrer?: string;
  first_seen_at?: string;
  last_seen_at?: string;
};

export const AD_ATTR_KEY = "linguo_attr";
const TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 hari — sejalan dengan window Google Ads
const COOKIE_MAX_AGE = 90 * 24 * 60 * 60; // detik
// Cookie di atas ~3 KB berisiko kena batas header; kalau kepanjangan, buang
// field yang paling tidak penting buat matching (referrer/UTM panjang).
const COOKIE_SOFT_LIMIT = 3000;

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

// ── base64url: cookie value harus aman dari `;` `,` spasi & unicode ──────────
function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeAdAttributionCookie(raw: string): AdAttribution | null {
  try {
    const b64 = raw.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    return parsed && typeof parsed === "object" ? (parsed as AdAttribution) : null;
  } catch {
    return null;
  }
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const hit = document.cookie
    .split("; ")
    .find((c) => c.startsWith(name + "="));
  return hit ? hit.slice(name.length + 1) : undefined;
}

function clean(v: string | null | undefined): string | undefined {
  const s = (v ?? "").trim();
  return s ? s.slice(0, 512) : undefined;
}

// Nilai kosong dibuang, bukan disimpan sebagai "" — biar merge di server tidak
// menimpa data bagus dengan string kosong.
function compact(a: AdAttribution): AdAttribution {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(a)) {
    if (typeof v === "string" && v.trim()) out[k] = v.trim();
  }
  return out as AdAttribution;
}

function load(): AdAttribution | null {
  try {
    const raw = localStorage.getItem(AD_ATTR_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdAttribution;
    const seen = parsed.last_seen_at ? Date.parse(parsed.last_seen_at) : NaN;
    if (Number.isFinite(seen) && Date.now() - seen > TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function persist(attr: AdAttribution) {
  const data = compact(attr);
  try {
    localStorage.setItem(AD_ATTR_KEY, JSON.stringify(data));
  } catch {
    /* mode privat / kuota penuh — cookie di bawah tetap jalan */
  }

  // Cookie: dipangkas kalau kepanjangan (field paling bawah dibuang duluan).
  const droppable = ["referrer", "utm_term", "utm_content", "landing_path"];
  const slim: Record<string, unknown> = { ...data };
  let encoded = toBase64Url(JSON.stringify(slim));
  for (const k of droppable) {
    if (encoded.length <= COOKIE_SOFT_LIMIT) break;
    delete slim[k];
    encoded = toBase64Url(JSON.stringify(slim));
  }
  if (encoded.length > COOKIE_SOFT_LIMIT) return; // menyerah; localStorage sudah aman

  try {
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${AD_ATTR_KEY}=${encoded}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
  } catch {
    /* abaikan */
  }
}

/**
 * Baca URL + cookie Pixel, gabung dengan touch tersimpan, lalu simpan.
 * Aman dipanggil berkali-kali (idempoten) — dipanggil tiap pindah halaman.
 */
export function captureAdAttribution(): AdAttribution | null {
  if (typeof window === "undefined") return null;

  const sp = new URLSearchParams(window.location.search);
  const stored = load();
  const now = new Date().toISOString();

  const urlFbclid = clean(sp.get("fbclid"));
  const urlGclid =
    clean(sp.get("gclid")) || clean(sp.get("gbraid")) || clean(sp.get("wbraid"));

  // Cookie yang ditulis Pixel. _fbc cuma ada kalau pendaratan bawa fbclid dan
  // Pixel sempat jalan; kalau kosong tapi fbclid ada, kita sintesis sendiri
  // dengan format resmi Meta: fb.{subdomainIndex}.{creationTime}.{fbclid}
  const cookieFbp = clean(readCookie("_fbp"));
  const cookieFbc = clean(readCookie("_fbc"));
  const fbclid = urlFbclid || stored?.fbclid;
  const syntheticFbc =
    !cookieFbc && urlFbclid ? `fb.1.${Date.now()}.${urlFbclid}` : undefined;

  const isNewClick =
    (!!urlFbclid && urlFbclid !== stored?.fbclid) ||
    (!!urlGclid && urlGclid !== stored?.gclid);

  const urlUtms: AdAttribution = {};
  for (const k of UTM_KEYS) {
    const v = clean(sp.get(k));
    if (v) (urlUtms as Record<string, string>)[k] = v;
  }

  let next: AdAttribution;

  if (!stored) {
    next = {
      ...urlUtms,
      fbclid: urlFbclid,
      gclid: urlGclid,
      fbp: cookieFbp,
      fbc: cookieFbc || syntheticFbc,
      landing_path: clean(window.location.pathname),
      referrer: clean(document.referrer),
      first_seen_at: now,
      last_seen_at: now,
    };
  } else if (isNewClick) {
    // Klik iklan baru → touch di-refresh seutuhnya, tapi first_seen_at tetap
    // menandai kapan orang ini pertama kali kita lihat.
    next = {
      ...urlUtms,
      fbclid: urlFbclid || stored.fbclid,
      gclid: urlGclid || stored.gclid,
      fbp: cookieFbp || stored.fbp,
      fbc: cookieFbc || syntheticFbc || stored.fbc,
      landing_path: clean(window.location.pathname),
      referrer: clean(document.referrer) || stored.referrer,
      first_seen_at: stored.first_seen_at || now,
      last_seen_at: now,
    };
  } else {
    // Kunjungan biasa: cuma ISI yang masih kosong. _fbp/_fbc diambil yang
    // terbaru karena itu identitas browser saat ini, bukan bagian dari "touch".
    next = {
      ...stored,
      ...Object.fromEntries(
        Object.entries(urlUtms).filter(
          ([k]) => !(stored as Record<string, unknown>)[k],
        ),
      ),
      fbclid: stored.fbclid || fbclid,
      gclid: stored.gclid || urlGclid,
      fbp: cookieFbp || stored.fbp,
      fbc: cookieFbc || stored.fbc || syntheticFbc,
      landing_path: stored.landing_path || clean(window.location.pathname),
      referrer: stored.referrer || clean(document.referrer),
      first_seen_at: stored.first_seen_at || now,
      last_seen_at: now,
    };
  }

  const compacted = compact(next);
  persist(compacted);
  return compacted;
}

/** Touch tersimpan, buat diselipkan ke body form. Null kalau belum ada. */
export function getAdAttribution(): AdAttribution | null {
  if (typeof window === "undefined") return null;
  return load();
}

/**
 * Selipkan `attribution` ke body request form. Dipakai di titik submit yang
 * memang punya email/HP. Route server tetap punya fallback baca cookie
 * `linguo_attr`, jadi ini opsional — bukan syarat.
 */
export function withAdAttribution<T extends Record<string, unknown>>(body: T): T {
  const attr = getAdAttribution();
  return attr ? ({ ...body, attribution: attr } as T) : body;
}
