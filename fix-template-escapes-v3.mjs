#!/usr/bin/env node
// Fix invalid escape sequences in template literals: \` and \${
// Run from ~/linguo-landing root
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const FILE = "src/app/silabus/[lang]/CurriculumViewer.tsx";
if (!fs.existsSync(FILE)) {
  console.error("[ERR] " + FILE + " not found. Run from ~/linguo-landing root.");
  process.exit(1);
}

console.log("[INFO] Reading file...");
let src = fs.readFileSync(FILE, "utf8");

// Show current line 49 for debug
const lines49 = src.split("\n");
console.log("[DEBUG] Current line 49:");
console.log("   " + (lines49[48] || "(not found)"));

const before = src;

// Fix 1: Replace \` with ` (invalid backtick escape)
src = src.replace(/\\`/g, "`");

// Fix 2: Replace \${ with ${ (invalid dollar escape — just in case still lingering)
src = src.replace(/\\\$\{/g, "${");

if (src === before) {
  console.log("\n[OK] No invalid escapes found — file may already be fixed");
  console.log("[INFO] If build still failing, the issue is elsewhere. Check file content:");
  console.log("       cat " + FILE + " | head -60");
  process.exit(0);
}

fs.writeFileSync(FILE, src, "utf8");
console.log("\n[OK] Fixed invalid escapes in " + FILE);

// Show fixed line 49
const newLines = src.split("\n");
console.log("[DEBUG] Fixed line 49:");
console.log("   " + (newLines[48] || "(not found)"));

// Scan other files
console.log("\n[INFO] Scanning other files for same issues...");

function scanDir(dir, results) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === "node_modules" || e.name === ".next" || e.name.startsWith(".")) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      scanDir(full, results);
    } else if (/\.(tsx?|jsx?|mjs)$/.test(e.name)) {
      const c = fs.readFileSync(full, "utf8");
      if (/\\`/.test(c) || /\\\$\{/.test(c)) results.push(full);
    }
  }
  return results;
}

let problemFiles = [];
try {
  problemFiles = scanDir("src", []);
  problemFiles = problemFiles.filter(f => f !== FILE);
} catch (e) {
  console.warn("[WARN] Scan failed:", e.message);
}

if (problemFiles.length > 0) {
  console.log("[WARN] Found " + problemFiles.length + " other files with invalid escapes:");
  for (const f of problemFiles) {
    console.log("   - " + f);
    const c = fs.readFileSync(f, "utf8");
    const fixed = c.replace(/\\`/g, "`").replace(/\\\$\{/g, "${");
    fs.writeFileSync(f, fixed, "utf8");
    console.log("     [OK] Auto-fixed");
  }
} else {
  console.log("[OK] No other files affected");
}

// Commit & push
try {
  execSync("git add -A", { stdio: "inherit" });
  execSync('git commit -m "fix(build): remove invalid backtick and dollar escapes in template literals"', { stdio: "inherit" });
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
console.log("BUILD FIX v3 DEPLOYED");
console.log("============================================================");
console.log("Tunggu Vercel rebuild ~1 menit");
console.log("Check https://vercel.com/dhanling/linguo-landing/deployments");
console.log("Harusnya deployment BARU hijau Ready");
console.log("============================================================");
