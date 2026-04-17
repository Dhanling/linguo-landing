#!/usr/bin/env node
// add-video-css-landing.mjs — drag ke root linguo-landing, lalu: node add-video-css-landing.mjs
import fs from "fs";
import { execSync } from "child_process";

const FILE = "src/app/blog/[slug]/ArticleContent.tsx";
if (!fs.existsSync(FILE)) { console.error("❌ Jalankan dari root linguo-landing"); process.exit(1); }

let code = fs.readFileSync(FILE, "utf-8");
let n = 0;

// Add video-embed CSS after audio-embed CSS
const anchor = `.article-body figure.audio-embed figcaption::before {
  content: "🔊";
  font-size: 0.875rem;
}`;

const videoCSS = `.article-body figure.audio-embed figcaption::before {
  content: "🔊";
  font-size: 0.875rem;
}

/* Video Player */
.article-body figure.video-embed {
  margin: 2rem 0;
  border-radius: 1rem;
  overflow: hidden;
  background: #0f172a;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.12);
}
.article-body figure.video-embed video {
  width: 100%;
  display: block;
  border-radius: 1rem;
}
.article-body figure.video-embed figcaption {
  font-size: 0.8125rem;
  color: #94a3b8;
  padding: 0.625rem 1rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}
.article-body figure.video-embed figcaption::before {
  content: "🎬";
  font-size: 0.875rem;
}`;

if (code.includes(anchor) && !code.includes("video-embed")) {
  code = code.replace(anchor, videoCSS);
  n++; console.log("✅ Added video-embed CSS");
}

// Add mobile responsive for video
const mobileAnchor = `  .article-body figure.audio-embed {
    margin: 1rem 0;
    padding: 0.75rem;
  }`;

const mobileVideo = `  .article-body figure.audio-embed {
    margin: 1rem 0;
    padding: 0.75rem;
  }
  .article-body figure.video-embed {
    margin: 1.5rem -1rem;
    border-radius: 0;
  }
  .article-body figure.video-embed video {
    border-radius: 0;
  }`;

if (code.includes(mobileAnchor) && !code.includes("video-embed")) {
  code = code.replace(mobileAnchor, mobileVideo);
  n++; console.log("✅ Added video-embed mobile CSS");
}

if (n === 0) { console.log("⚠️ Tidak ada perubahan"); process.exit(0); }

fs.writeFileSync(FILE, code);
console.log(`\n📝 ${n} changes applied\n`);

execSync("git add -A", { stdio: "inherit" });
execSync('git commit -m "feat(blog): video player CSS — dark bg, rounded, responsive mobile"', { stdio: "inherit" });
execSync("git push", { stdio: "inherit" });
console.log("\n🚀 Pushed!");
fs.unlinkSync("add-video-css-landing.mjs");
console.log("🧹 Done.");
