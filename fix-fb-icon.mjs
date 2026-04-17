#!/usr/bin/env node
// fix-fb-icon.mjs — drag ke root linguo-landing, lalu: node fix-fb-icon.mjs
import fs from "fs";
import { execSync } from "child_process";

const FILE = "src/app/blog/[slug]/ArticleContent.tsx";
if (!fs.existsSync(FILE)) { console.error("❌ Jalankan dari root linguo-landing"); process.exit(1); }

let code = fs.readFileSync(FILE, "utf-8");

const old = `<Facebook className="w-[18px] h-[18px]" />`;
const fix = `<svg className="w-[16px] h-[16px]" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`;

if (code.includes(old)) {
  code = code.replace(old, fix);
  fs.writeFileSync(FILE, code);
  console.log("✅ Replaced <Facebook /> with inline SVG");
  execSync("git add -A", { stdio: "inherit" });
  execSync('git commit -m "fix(blog): replace Facebook lucide icon with inline SVG"', { stdio: "inherit" });
  execSync("git push", { stdio: "inherit" });
  console.log("🚀 Pushed!");
} else {
  console.log("⚠️ Pattern not found");
}

fs.unlinkSync("fix-fb-icon.mjs");
console.log("🧹 Done.");
