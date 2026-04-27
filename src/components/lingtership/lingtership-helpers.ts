// ════════════════════════════════════════════════════════════════
// Lingtership Sprint 3 — Shared Helpers & Constants
// ════════════════════════════════════════════════════════════════
// Place at: src/components/lingtership/lingtership-helpers.ts
// ════════════════════════════════════════════════════════════════

// ─── Platform Definitions ────────────────────────────────────────

export type PlatformId = "instagram" | "tiktok" | "youtube" | "twitter" | "facebook" | "other";

export const PLATFORM_OPTIONS: { id: PlatformId; label: string; urlPrefix: string }[] = [
  { id: "instagram", label: "Instagram", urlPrefix: "https://instagram.com/" },
  { id: "tiktok",    label: "TikTok",    urlPrefix: "https://tiktok.com/@" },
  { id: "youtube",   label: "YouTube",   urlPrefix: "https://youtube.com/@" },
  { id: "twitter",   label: "X / Twitter", urlPrefix: "https://x.com/" },
  { id: "facebook",  label: "Facebook",  urlPrefix: "https://facebook.com/" },
  { id: "other",     label: "Lainnya",   urlPrefix: "" },
];

export const PLATFORM_LABEL: Record<string, string> = Object.fromEntries(
  PLATFORM_OPTIONS.map(p => [p.id, p.label])
);

// ─── Niche Definitions ───────────────────────────────────────────

export const NICHE_OPTIONS: { id: string; label: string }[] = [
  { id: "bahasa",       label: "Bahasa" },
  { id: "edukasi",      label: "Edukasi" },
  { id: "study_abroad", label: "Study Abroad" },
  { id: "polyglot",     label: "Polyglot" },
  { id: "travel",       label: "Travel" },
  { id: "food",         label: "Food" },
  { id: "lifestyle",    label: "Lifestyle" },
  { id: "tech",         label: "Tech" },
  { id: "beauty",       label: "Beauty" },
  { id: "parenting",    label: "Parenting" },
  { id: "business",     label: "Business" },
  { id: "gaming",       label: "Gaming" },
  { id: "music",        label: "Music" },
  { id: "fitness",      label: "Fitness" },
  { id: "books",        label: "Books / Literature" },
];

export const NICHE_LABEL: Record<string, string> = Object.fromEntries(
  NICHE_OPTIONS.map(n => [n.id, n.label])
);

// Format custom niches yang nggak ada di list — capitalize first letter
export function formatNicheLabel(niche: string): string {
  if (NICHE_LABEL[niche]) return NICHE_LABEL[niche];
  return niche.charAt(0).toUpperCase() + niche.slice(1);
}

// ─── Audience Size Tier ─────────────────────────────────────────

export type AudienceTier = "nano" | "micro" | "mid" | "macro";

export const AUDIENCE_TIER_OPTIONS: {
  id: AudienceTier;
  label: string;
  range: string;
  emoji: string;
}[] = [
  { id: "nano",  label: "Nano",  range: "< 10K",       emoji: "🌱" },
  { id: "micro", label: "Micro", range: "10K – 100K",  emoji: "🌿" },
  { id: "mid",   label: "Mid",   range: "100K – 500K", emoji: "🌳" },
  { id: "macro", label: "Macro", range: "> 500K",      emoji: "🏔️" },
];

export const AUDIENCE_TIER_LABEL: Record<string, string> = Object.fromEntries(
  AUDIENCE_TIER_OPTIONS.map(t => [t.id, `${t.emoji} ${t.label} (${t.range})`])
);

// ─── Approach Method ────────────────────────────────────────────

export type ApproachMethod = "like" | "comment" | "story_reply" | "dm_direct";

export const APPROACH_METHOD_OPTIONS: {
  id: ApproachMethod;
  label: string;
  description: string;
}[] = [
  { id: "like",        label: "Like",         description: "Engage via likes di posts" },
  { id: "comment",     label: "Comment",      description: "Komentar di posts KOL" },
  { id: "story_reply", label: "Story Reply",  description: "Reply di story" },
  { id: "dm_direct",   label: "Cold DM",      description: "Langsung DM tanpa warm-up" },
];

export const APPROACH_METHOD_LABEL: Record<string, string> = Object.fromEntries(
  APPROACH_METHOD_OPTIONS.map(m => [m.id, m.label])
);

// ─── URL Parsing ────────────────────────────────────────────────

/**
 * Extract handle dari URL atau plain text.
 * Examples:
 *   "https://instagram.com/bahasakini"          → "@bahasakini"
 *   "https://www.instagram.com/bahasakini/"     → "@bahasakini"
 *   "https://tiktok.com/@polyglot.id"           → "@polyglot.id"
 *   "https://youtube.com/@channelname/videos"   → "@channelname"
 *   "@bahasakini"                               → "@bahasakini"
 *   "bahasakini"                                → "@bahasakini"
 */
export function extractHandleFromUrl(input: string): string {
  if (!input) return "";
  const trimmed = input.trim();
  if (!trimmed) return "";

  // Already a handle format
  if (trimmed.startsWith("@") && !trimmed.includes("/")) {
    return trimmed.split(/\s/)[0]; // Strip whitespace if any
  }

  // Plain username (no @, no slash, no dot for domain)
  if (!trimmed.includes("/") && !trimmed.includes(".")) {
    return "@" + trimmed.replace(/^@/, "");
  }

  try {
    // Try parsing as URL
    const url = new URL(trimmed.startsWith("http") ? trimmed : "https://" + trimmed);
    let path = url.pathname.replace(/^\/+|\/+$/g, ""); // Trim slashes

    // YouTube: /@channelname/videos → @channelname
    // TikTok:  /@username           → @username
    // IG/FB:   /username            → username

    // Take first segment only
    path = path.split("/")[0];

    // Strip "videos", "shorts", etc trailing
    if (!path) return "";

    // YouTube/TikTok already have @ prefix
    if (path.startsWith("@")) return path;

    return "@" + path;
  } catch {
    // Fallback: take last meaningful segment
    const parts = trimmed.split("/").filter(Boolean);
    const last = parts[parts.length - 1] || "";
    if (!last) return "";
    return last.startsWith("@") ? last : "@" + last;
  }
}

/**
 * Build a profile URL from handle + platform.
 * Examples:
 *   buildProfileUrl("@bahasakini", "instagram") → "https://instagram.com/bahasakini"
 *   buildProfileUrl("bahasakini", "tiktok")     → "https://tiktok.com/@bahasakini"
 *   buildProfileUrl("@chan", "youtube")         → "https://youtube.com/@chan"
 */
export function buildProfileUrl(handle: string, platform: PlatformId): string {
  if (!handle) return "";
  const cleanHandle = handle.replace(/^@/, "").trim();
  if (!cleanHandle) return "";

  const platformDef = PLATFORM_OPTIONS.find(p => p.id === platform);
  if (!platformDef || !platformDef.urlPrefix) return "";

  return platformDef.urlPrefix + cleanHandle;
}

/**
 * Validate URL — returns true kalau URL valid (or empty).
 */
export function isValidUrl(url: string): boolean {
  if (!url) return true; // Empty is OK (optional field)
  try {
    new URL(url.startsWith("http") ? url : "https://" + url);
    return true;
  } catch {
    return false;
  }
}
