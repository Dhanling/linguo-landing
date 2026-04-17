#!/usr/bin/env node
// fix-blog-build.mjs — drag ke root linguo-landing, lalu: node fix-blog-build.mjs
import fs from "fs";
import { execSync } from "child_process";

const FILE = "src/app/blog/[slug]/ArticleContent.tsx";
if (!fs.existsSync(FILE)) { console.error("❌ Jalankan dari root linguo-landing"); process.exit(1); }

let code = fs.readFileSync(FILE, "utf-8");

// Fix: remove non-existent lucide icons from import
const old = `import { Clock, ArrowLeft, MessageCircle, Share2, ThumbsUp, Send, Facebook, Copy, Check, ChevronUp } from "lucide-react";`;
const fix = `import { Clock, ArrowLeft, MessageCircle, Share2, Send, Copy, Check } from "lucide-react";`;

if (code.includes(old)) {
  code = code.replace(old, fix);
  fs.writeFileSync(FILE, code);
  console.log("✅ Removed Facebook, ThumbsUp, ChevronUp from imports (using inline SVGs)");
  execSync("git add -A", { stdio: "inherit" });
  execSync('git commit -m "fix(blog): remove non-existent lucide icons from import"', { stdio: "inherit" });
  execSync("git push", { stdio: "inherit" });
  console.log("🚀 Pushed!");
} else {
  console.log("⚠️ Pattern not found");
}

fs.unlinkSync("fix-blog-build.mjs");
console.log("🧹 Done.");
