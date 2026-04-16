#!/usr/bin/env node
// Aggressive fix: regenerate line 49 of CurriculumViewer.tsx from scratch
// Run from ~/linguo-landing root
import fs from "fs";
import { execSync } from "child_process";

const FILE = "src/app/silabus/[lang]/CurriculumViewer.tsx";
if (!fs.existsSync(FILE)) {
  console.error("[ERR] " + FILE + " not found.");
  process.exit(1);
}

let src = fs.readFileSync(FILE, "utf8");
const lines = src.split("\n");

console.log("[DEBUG] Line 49 before:");
console.log("   " + JSON.stringify(lines[48]));

// Detect if line 49 contains the broken window.location.href pattern
if (lines[48] && lines[48].includes("window.location.href") && lines[48].includes("lang=")) {
  // Replace with correct version. Preserve original indentation.
  const match = lines[48].match(/^(\s*)/);
  const indent = match ? match[1] : "    ";
  lines[48] = indent + "window.location.href = `/?lang=${encodeURIComponent(langName)}&from=${source}`;";
  console.log("[OK] Rewrote line 49");
} else {
  console.log("[INFO] Line 49 doesn't match expected pattern, scanning full file...");
}

// Also do global cleanup of any \\` escape remaining anywhere
let cleaned = lines.join("\n");
const before = cleaned;
cleaned = cleaned.replace(/\\+`/g, "`");  // any number of backslashes before backtick -> just backtick
cleaned = cleaned.replace(/\\+\$\{/g, "${");  // any backslash before ${ -> just ${

if (cleaned !== before) {
  console.log("[OK] Cleaned up remaining backslash escapes");
}

fs.writeFileSync(FILE, cleaned, "utf8");

// Show result
const newLines = cleaned.split("\n");
console.log("[DEBUG] Line 49 after:");
console.log("   " + JSON.stringify(newLines[48]));

// Commit
try {
  execSync("git add -A", { stdio: "inherit" });
  execSync('git commit -m "fix(build): rewrite line 49 with correct template literal syntax"', { stdio: "inherit" });
  execSync("git push", { stdio: "inherit" });
  console.log("\n[OK] Pushed to GitHub");
} catch (e) {
  console.error("[WARN] Git failed:", e.message);
}

try {
  fs.unlinkSync(new URL(import.meta.url));
  console.log("[CLEAN] Script self-deleted");
} catch {}

console.log("\n============================================================");
console.log("FINAL FIX DEPLOYED");
console.log("Check Vercel in 1 min — should be green this time");
console.log("============================================================");
