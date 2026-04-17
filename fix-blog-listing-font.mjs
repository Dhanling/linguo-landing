#!/usr/bin/env node
// fix-blog-listing-font.mjs — drag ke root linguo-landing, lalu: node fix-blog-listing-font.mjs
import fs from "fs";
import { execSync } from "child_process";

const FILE = "src/app/blog/BlogContent.tsx";
if (!fs.existsSync(FILE)) { console.error("❌ Jalankan dari root linguo-landing"); process.exit(1); }

let code = fs.readFileSync(FILE, "utf-8");
let n = 0;

// 1. Add font import style + blog-page wrapper class
const oldWrapper = `    <div className="min-h-screen bg-white">`;
const newWrapper = `    <div className="min-h-screen bg-white" style={{fontFamily:"'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,sans-serif"}}>
      <style dangerouslySetInnerHTML={{__html:\`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500&display=swap');\`}}/>`;
if (code.includes(oldWrapper) && !code.includes("Plus Jakarta Sans")) {
  code = code.replace(oldWrapper, newWrapper);
  n++; console.log("✅ Added Plus Jakarta Sans font");
}

// 2. Feed item excerpt: slate-500 → slate-700
const oldExc = `<p className="text-[15px] text-slate-500 leading-relaxed line-clamp-2`;
const newExc = `<p className="text-[15px] text-slate-600 leading-relaxed line-clamp-2`;
if (code.includes(oldExc)) {
  code = code.replace(oldExc, newExc);
  n++; console.log("✅ Feed excerpt → darker text");
}

// 3. Feed item title: make slightly bigger
const oldTitle = `<h2 className="text-[20px] font-extrabold text-slate-900`;
const newTitle = `<h2 className="text-[20px] font-extrabold text-[#0f172a]`;
if (code.includes(oldTitle)) {
  code = code.replace(oldTitle, newTitle);
  n++; console.log("✅ Feed title → true black");
}

// 4. Grid card excerpt: slate-400 → slate-600
const oldGridExc = `<p className="text-xs text-slate-400 line-clamp-2 mb-4`;
const newGridExc = `<p className="text-xs text-slate-600 line-clamp-2 mb-4`;
if (code.includes(oldGridExc)) {
  code = code.replace(oldGridExc, newGridExc);
  n++; console.log("✅ Grid excerpt → darker");
}

// 5. Grid card title: darker
const oldGridTitle = `<h3 className="font-bold text-[15px] text-slate-900`;
const newGridTitle = `<h3 className="font-bold text-[15px] text-[#0f172a]`;
if (code.includes(oldGridTitle)) {
  code = code.replace(oldGridTitle, newGridTitle);
  n++; console.log("✅ Grid title → true black");
}

// 6. Author name: darker
const oldAuthor = `<span className="font-medium text-slate-800">Linguo Team</span>`;
const newAuthor = `<span className="font-semibold text-[#0f172a]">Linguo Team</span>`;
if (code.includes(oldAuthor)) {
  code = code.replaceAll(oldAuthor, newAuthor);
  n++; console.log("✅ Author name → bold black");
}

// 7. Category "in" text: darker
const oldCatIn = `{post.category&&<> in <span className="font-medium text-slate-800">{post.category}</span></>}`;
const newCatIn = `{post.category&&<> in <span className="font-semibold text-[#0f172a]">{post.category}</span></>}`;
if (code.includes(oldCatIn)) {
  code = code.replace(oldCatIn, newCatIn);
  n++; console.log("✅ Category text → bold black");
}

// 8. Sidebar section titles: darker
const oldPicks = `<h3 className="text-[15px] font-extrabold text-slate-900 mb-4">Staff Picks</h3>`;
const newPicks = `<h3 className="text-[15px] font-extrabold text-[#0f172a] mb-4">Staff Picks</h3>`;
if (code.includes(oldPicks)) {
  code = code.replace(oldPicks, newPicks);
  n++; console.log("✅ Staff Picks title → black");
}

if (n === 0) { console.log("⚠️ Tidak ada perubahan"); process.exit(0); }

fs.writeFileSync(FILE, code);
console.log(`\n📝 ${n} changes applied\n`);

execSync("git add -A", { stdio: "inherit" });
execSync('git commit -m "feat(blog): Plus Jakarta Sans font + darker text for blog listing"', { stdio: "inherit" });
execSync("git push", { stdio: "inherit" });
console.log("🚀 Pushed!");
fs.unlinkSync("fix-blog-listing-font.mjs");
console.log("🧹 Done.");
