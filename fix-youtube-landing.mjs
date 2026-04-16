#!/usr/bin/env node
// fix-youtube-landing.mjs
// Fixes: YouTube embed not visible on blog articles
// Root cause: iframe height:100% doesn't resolve properly when parent uses aspect-ratio only
// Fix: use position:absolute + inset:0 pattern (classic responsive iframe)
// Run from: linguo-landing root
// Usage: node fix-youtube-landing.mjs

import fs from "fs";
import { execSync } from "child_process";

const FILE = "src/app/blog/[slug]/ArticleContent.tsx";
if (!fs.existsSync(FILE)) {
  console.error("❌ File tidak ditemukan:", FILE);
  console.error("   Pastikan script dijalankan dari root linguo-landing");
  process.exit(1);
}

let code = fs.readFileSync(FILE, "utf-8");
let changes = 0;

// ============================================================
// FIX 1: YouTube embed CSS — use absolute positioning for iframe
// Old: height:100%!important on iframe (doesn't resolve with aspect-ratio parent in some browsers)
// New: position:absolute + inset:0 (reliable responsive iframe pattern)
// ============================================================
const oldYoutubeCSS = `.article-body figure.youtube-embed {
  margin: 2rem 0;
  border-radius: 1rem;
  overflow: hidden;
  background: #0f172a;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.12);
  position: relative;
  aspect-ratio: 16 / 9;
}
.article-body figure.youtube-embed iframe {
  width: 100% !important;
  height: 100% !important;
  border-radius: 1rem;
  display: block;
  border: none;
  aspect-ratio: 16 / 9;
}`;

const newYoutubeCSS = `.article-body figure.youtube-embed {
  margin: 2rem 0;
  border-radius: 1rem;
  overflow: hidden;
  background: #0f172a;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.12);
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 fallback for browsers without aspect-ratio */
  aspect-ratio: 16 / 9;
  height: auto;
}
.article-body figure.youtube-embed iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 1rem;
  display: block;
  border: none;
}`;

if (code.includes(oldYoutubeCSS)) {
  code = code.replace(oldYoutubeCSS, newYoutubeCSS);
  changes++;
  console.log("✅ Fix 1: YouTube CSS → absolute positioning pattern");
} else {
  console.warn("⚠️  Fix 1: YouTube CSS pattern tidak ditemukan — skip");
}

// ============================================================
// FIX 2: Hydration useEffect — more robust iframe rebuild
// - Always rebuild iframes (don't skip if iframe exists but has wrong src)
// - Add referrerpolicy for better compatibility
// - Use requestAnimationFrame to ensure DOM is ready
// ============================================================
const oldHydration = `  useEffect(() => {
    const figures = document.querySelectorAll<HTMLElement>(".article-body figure.youtube-embed");
    figures.forEach(fig => {
      const id = fig.getAttribute("data-youtube-id");
      if (!id) return;
      if (fig.querySelector("iframe")) return;
      const iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube.com/embed/" + id;
      iframe.setAttribute("frameborder", "0");
      iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
      iframe.setAttribute("allowfullscreen", "");
      iframe.setAttribute("loading", "lazy");
      iframe.style.cssText = "width:100%;height:100%;aspect-ratio:16/9;border:none;border-radius:0.75rem;";
      fig.innerHTML = "";
      fig.appendChild(iframe);
    });
  }, [post?.content]);`;

const newHydration = `  useEffect(() => {
    // Hydrate YouTube embeds — rebuild iframes from data-youtube-id
    // Uses requestAnimationFrame to ensure DOM is painted before querying
    const hydrateYouTube = () => {
      const figures = document.querySelectorAll<HTMLElement>(".article-body figure.youtube-embed");
      figures.forEach(fig => {
        const id = fig.getAttribute("data-youtube-id");
        if (!id) return;
        // Check if iframe already exists with correct src
        const existing = fig.querySelector("iframe");
        if (existing && existing.src.includes(id)) return;
        // Build fresh iframe
        const iframe = document.createElement("iframe");
        iframe.src = "https://www.youtube-nocookie.com/embed/" + id;
        iframe.setAttribute("frameborder", "0");
        iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
        iframe.setAttribute("allowfullscreen", "");
        iframe.setAttribute("loading", "lazy");
        iframe.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
        iframe.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;border:none;border-radius:1rem;";
        fig.innerHTML = "";
        fig.appendChild(iframe);
      });
    };
    // Run after paint to ensure dangerouslySetInnerHTML content is in DOM
    requestAnimationFrame(() => { requestAnimationFrame(hydrateYouTube); });
  }, [post?.content]);`;

if (code.includes(oldHydration)) {
  code = code.replace(oldHydration, newHydration);
  changes++;
  console.log("✅ Fix 2: YouTube hydration → more robust with rAF + youtube-nocookie + absolute pos");
} else {
  console.warn("⚠️  Fix 2: Hydration useEffect pattern tidak ditemukan — skip");
}

// ============================================================
// FIX 3: Mobile responsive — update YouTube mobile CSS too
// ============================================================
const oldMobileCSS = `  .article-body figure.youtube-embed {
    margin: 1.5rem -1rem;
    border-radius: 0;
  }`;

const newMobileCSS = `  .article-body figure.youtube-embed {
    margin: 1.5rem -1rem;
    border-radius: 0;
  }
  .article-body figure.youtube-embed iframe {
    border-radius: 0;
  }`;

if (code.includes(oldMobileCSS)) {
  code = code.replace(oldMobileCSS, newMobileCSS);
  changes++;
  console.log("✅ Fix 3: Mobile YouTube border-radius fix");
} else {
  console.warn("⚠️  Fix 3: Mobile YouTube CSS pattern tidak ditemukan — skip");
}

// ============================================================
// WRITE & COMMIT
// ============================================================
if (changes === 0) {
  console.log("\n⚠️  Tidak ada perubahan. Mungkin pattern sudah berubah.");
  process.exit(0);
}

fs.writeFileSync(FILE, code);
console.log(`\n📝 ${changes} fix(es) applied ke ${FILE}`);

try {
  execSync("git add .", { stdio: "inherit" });
  execSync(`git commit -m "fix(blog): YouTube embed not visible — absolute positioning + robust hydration"`, { stdio: "inherit" });
  execSync("git push", { stdio: "inherit" });
  console.log("\n🚀 Pushed! Vercel akan deploy otomatis.");
} catch (e) {
  console.error("❌ Git error:", e.message);
  process.exit(1);
}

// Self-delete
fs.unlinkSync(new URL(import.meta.url).pathname);
console.log("🧹 Script self-deleted.");
