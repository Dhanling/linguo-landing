#!/usr/bin/env node
// fix-yt-css.mjs — drag ke root linguo-landing, lalu: node fix-yt-css.mjs
import fs from "fs";
import { execSync } from "child_process";

const FILE = "src/app/blog/[slug]/ArticleContent.tsx";
if (!fs.existsSync(FILE)) { console.error("❌ Jalankan dari root linguo-landing"); process.exit(1); }

let code = fs.readFileSync(FILE, "utf-8");
let n = 0;

// FIX: YouTube figure CSS — height:0 (classic responsive iframe trick)
const old1 = `  position: relative;
  width: 100%;
  padding-bottom: 56.25%;
  aspect-ratio: 16 / 9;
  height: auto;`;

const new1 = `  position: relative;
  width: 100%;
  padding-bottom: 56.25%;
  height: 0;`;

if (code.includes(old1)) {
  code = code.replace(old1, new1);
  n++;
  console.log("✅ YouTube CSS → height:0 (classic responsive iframe)");
}

if (n === 0) { console.log("⚠️ Tidak ada perubahan"); process.exit(0); }

fs.writeFileSync(FILE, code);
execSync("git add -A", { stdio: "inherit" });
execSync('git commit -m "fix(blog): YouTube iframe height:0 classic responsive pattern"', { stdio: "inherit" });
execSync("git push", { stdio: "inherit" });
console.log("🚀 Pushed!");
fs.unlinkSync("fix-yt-css.mjs");
console.log("🧹 Done.");
