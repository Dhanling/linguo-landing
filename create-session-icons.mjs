#!/usr/bin/env node
// Create missing src/data/curriculum/sessionIcons.ts
// Run from ~/linguo-landing root
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const FILE = "src/data/curriculum/sessionIcons.ts";

if (fs.existsSync(FILE)) {
  console.log("[OK] " + FILE + " already exists — no changes needed");
  process.exit(0);
}

// Simple icon mapping based on session title/type keywords
// Uses lucide-react icon names. Component will import dynamically.
const CONTENT = `// Auto-generated minimal sessionIcons — maps session content to a Lucide icon name.
// Extend this mapping as needed for richer curriculum iconography.

export type SessionIconName =
  | "BookOpen" | "MessageCircle" | "Mic" | "Headphones" | "PenLine"
  | "FileText" | "ListChecks" | "Puzzle" | "Globe" | "Users"
  | "Sparkles" | "GraduationCap" | "Languages" | "Music" | "Target"
  | "Trophy" | "Lightbulb" | "Calendar" | "Clock" | "Flag";

interface SessionLike {
  title?: string;
  type?: string;
  category?: string;
  topic?: string;
}

const KEYWORD_MAP: Array<{ keywords: string[]; icon: SessionIconName }> = [
  { keywords: ["listening", "dengar", "audio", "podcast"], icon: "Headphones" },
  { keywords: ["speaking", "bicara", "conversation", "percakapan", "dialog"], icon: "MessageCircle" },
  { keywords: ["pronunciation", "pelafalan", "pronoun", "mic"], icon: "Mic" },
  { keywords: ["writing", "tulis", "essay", "karangan"], icon: "PenLine" },
  { keywords: ["reading", "baca", "teks"], icon: "FileText" },
  { keywords: ["grammar", "tata bahasa", "structure"], icon: "ListChecks" },
  { keywords: ["vocabulary", "kosakata", "vocab", "kata"], icon: "BookOpen" },
  { keywords: ["quiz", "test", "ujian", "exam", "exercise", "latihan"], icon: "Target" },
  { keywords: ["culture", "budaya", "tradisi"], icon: "Globe" },
  { keywords: ["music", "lagu", "song"], icon: "Music" },
  { keywords: ["review", "ulasan", "summary", "rangkuman"], icon: "Trophy" },
  { keywords: ["intro", "perkenalan", "pengenalan", "introduction"], icon: "Sparkles" },
  { keywords: ["practice", "praktik", "drill"], icon: "Puzzle" },
  { keywords: ["tip", "trik", "tips"], icon: "Lightbulb" },
  { keywords: ["discussion", "diskusi", "group"], icon: "Users" },
  { keywords: ["assessment", "evaluasi", "penilaian"], icon: "GraduationCap" },
];

/**
 * Return a Lucide icon name that best fits the session content.
 * Falls back to "BookOpen" if no keyword match.
 */
export function getIconForSession(session: SessionLike | string | undefined | null): SessionIconName {
  if (!session) return "BookOpen";

  const text = (
    typeof session === "string"
      ? session
      : [session.title, session.type, session.category, session.topic].filter(Boolean).join(" ")
  ).toLowerCase();

  if (!text) return "BookOpen";

  for (const { keywords, icon } of KEYWORD_MAP) {
    if (keywords.some(kw => text.includes(kw))) return icon;
  }

  return "BookOpen";
}

export default getIconForSession;
`;

// Ensure directory exists
const dir = path.dirname(FILE);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
  console.log("[OK] Created directory " + dir);
}

fs.writeFileSync(FILE, CONTENT, "utf8");
console.log("[OK] Created " + FILE);
console.log("[INFO] File exports getIconForSession() returning Lucide icon names");
console.log("[INFO] Works with string or object { title, type, category, topic }");
console.log("[INFO] Falls back to 'BookOpen' if no keyword match");

// Commit & push
try {
  execSync("git add -A", { stdio: "inherit" });
  execSync('git commit -m "fix(build): create missing sessionIcons module with keyword-based mapping"', { stdio: "inherit" });
  execSync("git push", { stdio: "inherit" });
  console.log("\n[OK] Pushed to GitHub");
} catch (e) {
  console.error("[WARN] Git failed:", e.message);
}

try {
  fs.unlinkSync(new URL(import.meta.url));
  console.log("[CLEAN] Script self-deleted");
} catch {}

console.log("");
console.log("============================================================");
console.log("MISSING MODULE CREATED");
console.log("============================================================");
console.log("Tunggu Vercel rebuild ~1 menit.");
console.log("Kalau masih error, screenshot log baru dari Vercel ya.");
console.log("============================================================");
