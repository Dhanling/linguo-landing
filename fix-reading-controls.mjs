#!/usr/bin/env node
// fix-reading-controls.mjs — drag ke root linguo-landing, lalu: node fix-reading-controls.mjs
import fs from "fs";
import { execSync } from "child_process";

const FILE = "src/app/blog/[slug]/ArticleContent.tsx";
if (!fs.existsSync(FILE)) { console.error("❌ Jalankan dari root linguo-landing"); process.exit(1); }

let code = fs.readFileSync(FILE, "utf-8");
const lines = code.split("\n");
let n = 0;

// Find and remove duplicate reading controls blocks
// Keep only the first one, remove lines 658-662 area (second block)
// Strategy: find all "ReadingControls" JSX lines, remove the second occurrence's parent block

let controlsCount = 0;
let removeStart = -1;
let removeEnd = -1;

for (let i = 0; i < lines.length; i++) {
  // Find "Reading Controls" comment or "min read" + ReadingControls pattern
  if (lines[i].includes("{minutes} min read</span>") && !lines[i].includes("Clock")) {
    // This is a duplicate "min read" bar - check if it's the second one
    controlsCount++;
    if (controlsCount === 2) {
      // Find the parent div (should be ~2 lines before)
      removeStart = i - 1; // the div wrapper
      // Find closing </div>
      for (let j = i; j < Math.min(i + 10, lines.length); j++) {
        if (lines[j].includes("ReadingControls")) {
          // Find next </div>
          for (let k = j; k < Math.min(j + 5, lines.length); k++) {
            if (lines[k].trim() === "</div>") {
              removeEnd = k;
              break;
            }
          }
          break;
        }
      }
    }
  }
}

if (removeStart > 0 && removeEnd > 0) {
  lines.splice(removeStart, removeEnd - removeStart + 1);
  code = lines.join("\n");
  n++;
  console.log(`✅ Removed duplicate ReadingControls block (lines ${removeStart+1}-${removeEnd+1})`);
}

// Also remove the old "min read" span with Clock icon if it exists in meta card
// This is line 646: <span className="flex items-center gap-1 text-xs font-medium"><Clock...
// We keep it since it's in the meta card - that's fine

// Now make the remaining reading controls bar sticky
const oldControlsBar = `flex items-center justify-between py-3 px-1 mb-6 border-b`;
const newControlsBar = `sticky top-16 z-30 flex items-center justify-between py-3 px-2 mb-6 border-b backdrop-blur-xl`;

if (code.includes(oldControlsBar)) {
  code = code.replace(oldControlsBar, newControlsBar);
  n++;
  console.log("✅ Reading controls bar → sticky + backdrop blur");
}

// Add bg to sticky bar for dark/light
const oldBarDark = `\${darkMode ? "border-slate-700" : "border-slate-100"}\`}>`;
const newBarDark = `\${darkMode ? "border-slate-700 bg-[#0f172a]/95" : "border-slate-100 bg-white/95"}\`}>`;
// Only replace the first occurrence (the controls bar, not social bar)
if (code.includes(oldBarDark)) {
  code = code.replace(oldBarDark, newBarDark);
  n++;
  console.log("✅ Sticky bar → translucent bg for dark/light");
}

if (n === 0) { console.log("⚠️ Tidak ada perubahan"); process.exit(0); }

fs.writeFileSync(FILE, code);
console.log(`\n📝 ${n} changes applied\n`);

execSync("git add -A", { stdio: "inherit" });
execSync('git commit -m "fix(blog): remove duplicate reading controls, make sticky with blur"', { stdio: "inherit" });
execSync("git push", { stdio: "inherit" });
console.log("🚀 Pushed!");
fs.unlinkSync("fix-reading-controls.mjs");
console.log("🧹 Done.");
