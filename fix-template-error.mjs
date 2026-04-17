#!/usr/bin/env node
// fix-template-error.mjs — drag ke root linguo-landing, lalu: node fix-template-error.mjs
import fs from "fs";
import { execSync } from "child_process";

const FILE = "src/app/blog/[slug]/ArticleContent.tsx";
if (!fs.existsSync(FILE)) { console.error("❌ Jalankan dari root linguo-landing"); process.exit(1); }

let code = fs.readFileSync(FILE, "utf-8");

// Read line 667 area to find the broken template literal
// The issue is the social bar className - fix the escaping
const broken = 'className=`social-bar flex items-center justify-between py-5 px-1 mb-8 border-y ${darkMode ? "border-slate-700" : "border-slate-100"}`';
const fixed = 'className={`social-bar flex items-center justify-between py-5 px-1 mb-8 border-y ${darkMode ? "border-slate-700" : "border-slate-100"}`}';

if (code.includes(broken)) {
  code = code.replace(broken, fixed);
  fs.writeFileSync(FILE, code);
  console.log("✅ Fixed template literal (missing JSX braces)");
} else {
  // Try alternate fix - find the line with social-bar and fix it
  const lines = code.split("\n");
  let changed = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("social-bar") && lines[i].includes("className=`")) {
      lines[i] = lines[i].replace('className=`', 'className={`').replace(/`\s*>/, '`}>');
      changed = true;
      console.log("✅ Fixed line " + (i+1) + ": social-bar template literal");
    }
    if (lines[i].includes("tag-bottom") && lines[i].includes("className=`")) {
      lines[i] = lines[i].replace('className=`', 'className={`').replace(/`\s*>/, '`}>');
      changed = true;
      console.log("✅ Fixed line: tag-bottom template literal");
    }
  }
  if (changed) {
    code = lines.join("\n");
    fs.writeFileSync(FILE, code);
  } else {
    console.log("⚠️ Pattern not found, trying broader fix...");
    // Broader: find any className=` (without {) and fix
    const regex = /className=`([^`]*\$\{[^`]*)`/g;
    if (regex.test(code)) {
      code = code.replace(/className=`([^`]*\$\{[^`]*)`/g, 'className={`$1`}');
      fs.writeFileSync(FILE, code);
      console.log("✅ Fixed all className template literals");
    } else {
      console.log("⚠️ No fix needed or pattern different");
      process.exit(0);
    }
  }
}

execSync("git add -A", { stdio: "inherit" });
execSync('git commit -m "fix(blog): template literal syntax error in social bar className"', { stdio: "inherit" });
execSync("git push", { stdio: "inherit" });
console.log("🚀 Pushed!");
fs.unlinkSync("fix-template-error.mjs");
console.log("🧹 Done.");
