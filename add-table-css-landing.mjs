#!/usr/bin/env node
// add-table-css-landing.mjs — drag ke root linguo-landing, lalu: node add-table-css-landing.mjs
import fs from "fs";
import { execSync } from "child_process";

const FILE = "src/app/blog/[slug]/ArticleContent.tsx";
if (!fs.existsSync(FILE)) { console.error("❌ Jalankan dari root linguo-landing"); process.exit(1); }

let code = fs.readFileSync(FILE, "utf-8");
let n = 0;

// Add table CSS after blockquote styles
const anchor = `.article-body img {`;
const tableCSS = `/* Tables */
.article-body table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  font-size: 0.95rem;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}
.article-body thead tr {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}
.article-body th {
  padding: 0.75rem 1rem;
  font-weight: 700;
  text-align: left;
  color: #0f172a;
  font-size: 0.875rem;
  border-bottom: 2px solid #e2e8f0;
  letter-spacing: -0.01em;
}
.article-body td {
  padding: 0.75rem 1rem;
  color: #1e293b;
  border-bottom: 1px solid #f1f5f9;
  line-height: 1.6;
}
.article-body tbody tr:hover {
  background-color: #f8fafc;
}
.article-body tbody tr:last-child td {
  border-bottom: none;
}

.article-body img {`;

if (code.includes(anchor) && !code.includes(".article-body table {")) {
  code = code.replace(anchor, tableCSS);
  n++; console.log("✅ Added table CSS — rounded, gradient header, hover rows");
}

// Add mobile table responsive
const mobileAnchor = `  .article-body figure.youtube-embed {
    margin: 1.5rem -1.5rem;
    border-radius: 0;
  }`;

const mobileTable = `  .article-body table {
    font-size: 0.85rem;
    display: block;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .article-body th, .article-body td {
    padding: 0.5rem 0.75rem;
    white-space: nowrap;
  }
  .article-body figure.youtube-embed {
    margin: 1.5rem -1.5rem;
    border-radius: 0;
  }`;

if (code.includes(mobileAnchor) && !code.includes("overflow-x: auto")) {
  code = code.replace(mobileAnchor, mobileTable);
  n++; console.log("✅ Added mobile table responsive (horizontal scroll)");
}

if (n === 0) { console.log("⚠️ Tidak ada perubahan"); process.exit(0); }

fs.writeFileSync(FILE, code);
console.log(`\n📝 ${n} changes applied\n`);

execSync("git add -A", { stdio: "inherit" });
execSync('git commit -m "feat(blog): styled tables — rounded, gradient header, hover, mobile scroll"', { stdio: "inherit" });
execSync("git push", { stdio: "inherit" });
console.log("🚀 Pushed!");
fs.unlinkSync("add-table-css-landing.mjs");
console.log("🧹 Done.");
