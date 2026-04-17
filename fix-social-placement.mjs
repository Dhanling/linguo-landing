#!/usr/bin/env node
// fix-social-placement.mjs — drag ke root linguo-landing, lalu: node fix-social-placement.mjs
import fs from "fs";
import { execSync } from "child_process";

const FILE = "src/app/blog/[slug]/ArticleContent.tsx";
if (!fs.existsSync(FILE)) { console.error("❌ Jalankan dari root linguo-landing"); process.exit(1); }

let code = fs.readFileSync(FILE, "utf-8");
let n = 0;

// 1. Remove sticky desktop social bar
const stickyBar = `        {/* Sticky Social Bar (desktop) */}
        <div className="hidden lg:flex fixed left-[max(1rem,calc(50%-560px))] top-1/2 -translate-y-1/2 flex-col items-center gap-4 z-40">
          <ClapButton postId={post.id} />
          <div className="w-px h-6 bg-slate-200" />
          <ShareButtons url={shareUrl} title={post.title} />
        </div>`;

if (code.includes(stickyBar)) {
  code = code.replace(stickyBar, "");
  n++; console.log("✅ Removed sticky social bar");
}

// 2. Replace mobile-only social bar with always-visible one (better styling)
const oldMobileBar = `        {/* Mobile Social Bar */}
        <div className="lg:hidden flex items-center justify-between py-4 px-2 mb-8 border-y border-slate-100">
          <ClapButton postId={post.id} />
          <ShareButtons url={shareUrl} title={post.title} />
        </div>`;

const newSocialBar = `        {/* Social Bar — Clap + Share */}
        <div className="flex items-center justify-between py-5 px-1 mb-8 border-y border-slate-100">
          <ClapButton postId={post.id} />
          <ShareButtons url={shareUrl} title={post.title} />
        </div>`;

if (code.includes(oldMobileBar)) {
  code = code.replace(oldMobileBar, newSocialBar);
  n++; console.log("✅ Social bar now always visible below article");
}

if (n === 0) { console.log("⚠️ Tidak ada perubahan"); process.exit(0); }

fs.writeFileSync(FILE, code);
execSync("git add -A", { stdio: "inherit" });
execSync('git commit -m "fix(blog): move social bar below article, remove sticky sidebar"', { stdio: "inherit" });
execSync("git push", { stdio: "inherit" });
console.log("🚀 Pushed!");
fs.unlinkSync("fix-social-placement.mjs");
console.log("🧹 Done.");
