#!/usr/bin/env node
// Fix: remove invalid backslash-dollar in template literals causing Vercel build fail
// Run from ~/linguo-landing root
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const FILE = "src/app/silabus/[lang]/CurriculumViewer.tsx";
if (!fs.existsSync(FILE)) {
  console.error("[ERR] " + FILE + " not found. Run from ~/linguo-landing root.");
  process.exit(1);
}

let src = fs.readFileSync(FILE, "utf8");
const before = src;

// Replace literal `\${...}` with `${...}` inside template literals
src = src.replace(/\\\$\{/g, "${");

if (src === before) {
  console.log("OK  No backslash-dollar found in " + FILE);
} else {
  fs.writeFileSync(FILE, src, "utf8");
  console.log("[OK] Fixed backslash-dollar in " + FILE);
}

// Scan other files for same issue
console.log("\n[INFO] Scanning other files for same issue...");

function scanDir(dir, results) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === "node_modules" || e.name === ".next" || e.name.startsWith(".")) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      scanDir(full, results);
    } else if (/\.(tsx?|jsx?|mjs)$/.test(e.name)) {
      const c = fs.readFileSync(full, "utf8");
      if (/\\\$\{/.test(c)) results.push(full);
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
  console.log("[WARN] Found " + problemFiles.length + " other files with same issue:");
  for (const f of problemFiles) {
    console.log("   - " + f);
    const c = fs.readFileSync(f, "utf8");
    fs.writeFileSync(f, c.replace(/\\\$\{/g, "${"), "utf8");
    console.log("     [OK] Auto-fixed");
  }
} else {
  console.log("[OK] No other files affected");
}

// Commit & push
try {
  execSync("git add -A", { stdio: "inherit" });
  execSync('git commit -m "fix(build): remove invalid backslash-dollar escape in template literals"', { stdio: "inherit" });
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
console.log("BUILD FIX DEPLOYED");
console.log("============================================================");
console.log("");
console.log("Tunggu ~1 menit buat Vercel rebuild, terus:");
console.log("1. Cek https://vercel.com/dashboard -> linguo-landing");
console.log("2. Deployment terbaru harusnya HIJAU (Ready)");
console.log("3. Balik ke dashboard Blog -> klik Simpan artikel Uzbek");
console.log("4. Error 'Load failed' harusnya HILANG");
console.log("5. Video YouTube akan muncul di linguo.id/blog/belajar-bahasa-uzbek");
console.log("============================================================");
