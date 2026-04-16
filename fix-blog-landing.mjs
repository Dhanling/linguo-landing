#!/usr/bin/env node
// fix-blog-landing.mjs — drag ke root linguo-landing, lalu: node fix-blog-landing.mjs
import fs from "fs";
import { execSync } from "child_process";

const FILE = "src/app/blog/[slug]/ArticleContent.tsx";
if (!fs.existsSync(FILE)) { console.error("❌ Jalankan dari root linguo-landing"); process.exit(1); }

let code = fs.readFileSync(FILE, "utf-8");
let n = 0;

// Cleanup: hapus .mjs files yang tidak sengaja ke-commit sebelumnya
for (const f of ["fix-youtube-landing.mjs","navbar-placement-test.mjs"]) {
  if (fs.existsSync(f)) { fs.unlinkSync(f); console.log("🧹 Removed stale " + f); }
}

// FIX 1: YouTube CSS — absolute positioning pattern
const a1 = `.article-body figure.youtube-embed {
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
const b1 = `.article-body figure.youtube-embed {
  margin: 2rem 0;
  border-radius: 1rem;
  overflow: hidden;
  background: #0f172a;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.12);
  position: relative;
  width: 100%;
  padding-bottom: 56.25%;
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
if (code.includes(a1)) { code = code.replace(a1, b1); n++; console.log("✅ YouTube CSS → absolute positioning"); }

// FIX 2: Mobile YouTube border-radius
const a2 = `  .article-body figure.youtube-embed {
    margin: 1.5rem -1rem;
    border-radius: 0;
  }`;
const b2 = `  .article-body figure.youtube-embed {
    margin: 1.5rem -1rem;
    border-radius: 0;
  }
  .article-body figure.youtube-embed iframe {
    border-radius: 0;
  }`;
if (code.includes(a2) && !code.includes(b2)) { code = code.replace(a2, b2); n++; console.log("✅ Mobile YouTube border-radius"); }

// FIX 3: Hydration useEffect — robust rAF + nocookie
const a3 = `  useEffect(() => {
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
const b3 = `  useEffect(() => {
    const hydrateYouTube = () => {
      const figures = document.querySelectorAll<HTMLElement>(".article-body figure.youtube-embed");
      figures.forEach(fig => {
        const id = fig.getAttribute("data-youtube-id");
        if (!id) return;
        const existing = fig.querySelector("iframe");
        if (existing && existing.src.includes(id)) return;
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
    requestAnimationFrame(() => { requestAnimationFrame(hydrateYouTube); });
  }, [post?.content]);`;
if (code.includes(a3)) { code = code.replace(a3, b3); n++; console.log("✅ YouTube hydration → rAF + nocookie + absolute"); }

if (n === 0) { console.log("⚠️ Tidak ada perubahan"); process.exit(0); }

fs.writeFileSync(FILE, code);
console.log(`\n📝 ${n} fix applied\n`);

execSync("git add -A", { stdio: "inherit" });
execSync('git commit -m "fix(blog): YouTube embed not visible + robust hydration"', { stdio: "inherit" });
execSync("git push", { stdio: "inherit" });
console.log("\n🚀 Pushed!");
fs.unlinkSync("fix-blog-landing.mjs");
console.log("🧹 Script deleted.");
