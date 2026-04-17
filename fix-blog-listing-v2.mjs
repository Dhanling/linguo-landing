#!/usr/bin/env node
// fix-blog-listing-v2.mjs — drag ke root linguo-landing, lalu: node fix-blog-listing-v2.mjs
import fs from "fs";
import { execSync } from "child_process";

const FILE = "src/app/blog/BlogContent.tsx";
if (!fs.existsSync(FILE)) { console.error("❌ Jalankan dari root linguo-landing"); process.exit(1); }

let code = fs.readFileSync(FILE, "utf-8");
let n = 0;

// 1. Grid card title: bigger + bolder
const oldGridTitle = `<h3 className="font-bold text-[15px] text-[#0f172a]`;
const newGridTitle = `<h3 className="font-extrabold text-[17px] text-[#0f172a]`;
if (code.includes(oldGridTitle)) {
  code = code.replace(oldGridTitle, newGridTitle);
  n++; console.log("✅ Grid title → 17px extrabold");
}

// 2. Feed title: bigger
const oldFeedTitle = `<h2 className="text-[20px] font-extrabold text-[#0f172a]`;
const newFeedTitle = `<h2 className="text-[22px] font-extrabold text-[#0f172a]`;
if (code.includes(oldFeedTitle)) {
  code = code.replace(oldFeedTitle, newFeedTitle);
  n++; console.log("✅ Feed title → 22px");
}

// 3. Category tabs: black text + pill highlight animation
const oldTabs = `          {CATEGORIES.map(c=>(
            <button key={c} onClick={()=>{setActiveCat(c);setPage(1)}}
              className={\`text-sm whitespace-nowrap py-3 border-b-2 transition-all \${activeCat===c?"border-[#1A9E9E] text-[#1A9E9E] font-semibold":"border-transparent text-slate-400 hover:text-slate-600"}\`}>
              {c==="Semua"?"For you":c}
            </button>
          ))}`;

const newTabs = `          {CATEGORIES.map(c=>(
            <button key={c} onClick={()=>{setActiveCat(c);setPage(1)}}
              className={\`text-sm whitespace-nowrap py-3 transition-all relative font-semibold \${activeCat===c?"text-[#0f172a]":"text-slate-400 hover:text-slate-700"}\`}>
              {c==="Semua"?"For you":c}
              {activeCat===c&&<span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1A9E9E] rounded-full"/>}
            </button>
          ))}`;

if (code.includes(oldTabs)) {
  code = code.replace(oldTabs, newTabs);
  n++; console.log("✅ Category tabs → black text + teal underline indicator");
}

// 4. Grid card excerpt: slightly bigger
const oldGridExc = `<p className="text-xs text-slate-600 line-clamp-2 mb-4`;
const newGridExc = `<p className="text-[13px] text-slate-600 leading-relaxed line-clamp-2 mb-4`;
if (code.includes(oldGridExc)) {
  code = code.replace(oldGridExc, newGridExc);
  n++; console.log("✅ Grid excerpt → 13px with relaxed leading");
}

if (n === 0) { console.log("⚠️ Tidak ada perubahan"); process.exit(0); }

fs.writeFileSync(FILE, code);
console.log(`\n📝 ${n} changes applied\n`);

execSync("git add -A", { stdio: "inherit" });
execSync('git commit -m "feat(blog): bigger titles, black category tabs with teal indicator"', { stdio: "inherit" });
execSync("git push", { stdio: "inherit" });
console.log("🚀 Pushed!");
fs.unlinkSync("fix-blog-listing-v2.mjs");
console.log("🧹 Done.");
