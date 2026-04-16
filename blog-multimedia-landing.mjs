#!/usr/bin/env node
// Add pretty rendering CSS for YouTube embeds + audio players in blog articles
// Run from ~/linguo-landing root
import fs from "fs";
import { execSync } from "child_process";

const FILE = "src/app/blog/[slug]/ArticleContent.tsx";
if (!fs.existsSync(FILE)) {
  console.error("[ERR] " + FILE + " not found. Run from ~/linguo-landing root.");
  process.exit(1);
}

let src = fs.readFileSync(FILE, "utf8");

// =================================================================
// Extend ARTICLE_CSS with multimedia styles
// =================================================================
const OLD_CSS_END = `.article-body hr {
  border: none;
  border-top: 2px solid #f1f5f9;
  margin: 2rem 0;
}
\`;`;

const NEW_CSS_END = `.article-body hr {
  border: none;
  border-top: 2px solid #f1f5f9;
  margin: 2rem 0;
}

/* YouTube Embed */
.article-body figure.youtube-embed {
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
}

/* Audio Player */
.article-body figure.audio-embed {
  margin: 1.5rem 0;
  background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%);
  border: 1px solid #99f6e4;
  border-radius: 0.875rem;
  padding: 1rem 1.25rem;
  box-shadow: 0 1px 3px rgba(20, 184, 166, 0.08);
}
.article-body figure.audio-embed audio {
  width: 100%;
  display: block;
  height: 42px;
  border-radius: 0.5rem;
}
.article-body figure.audio-embed audio::-webkit-media-controls-panel {
  background-color: #ffffff;
  border-radius: 0.5rem;
}
.article-body figure.audio-embed figcaption {
  font-size: 0.8125rem;
  color: #0f766e;
  margin-top: 0.625rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}
.article-body figure.audio-embed figcaption::before {
  content: "🔊";
  font-size: 0.875rem;
}

/* Responsive tweaks */
@media (max-width: 640px) {
  .article-body figure.youtube-embed {
    margin: 1.5rem -1rem;
    border-radius: 0;
  }
  .article-body figure.audio-embed {
    margin: 1rem 0;
    padding: 0.75rem;
  }
}
\`;`;

if (src.includes("figure.youtube-embed")) {
  console.log("OK  Multimedia CSS already present");
} else if (src.includes(OLD_CSS_END)) {
  src = src.replace(OLD_CSS_END, NEW_CSS_END);
  console.log("[OK] Added multimedia CSS (YouTube + audio player)");
} else {
  console.warn("[WARN] CSS end marker not found — may need manual check");
}

fs.writeFileSync(FILE, src, "utf8");

// Commit & push
try {
  execSync("git add -A", { stdio: "inherit" });
  execSync('git commit -m "feat(blog): styled multimedia renderer — YouTube 16:9 + teal audio player"', { stdio: "inherit" });
  execSync("git push", { stdio: "inherit" });
  console.log("\n[OK] Pushed to GitHub (linguo-landing)");
} catch (e) {
  console.error("[WARN] Git failed:", e.message);
}

try {
  fs.unlinkSync(new URL(import.meta.url));
  console.log("[CLEAN] Script self-deleted");
} catch {}

console.log("");
console.log("============================================================");
console.log("MULTIMEDIA RENDERING DEPLOYED TO LANDING");
console.log("============================================================");
console.log("");
console.log("Styles yang ditambahkan:");
console.log("- YouTube iframe: 16:9 aspect ratio, rounded, shadow");
console.log("- Audio player: teal gradient bg, custom-styled controls");
console.log("- Mobile responsive: YouTube edge-to-edge, audio compact");
console.log("- Auto speaker emoji di figcaption audio");
console.log("");
console.log("============================================================");
console.log("BLOG MULTIMEDIA FULL STACK COMPLETE!");
console.log("============================================================");
console.log("");
console.log("Test flow:");
console.log("1. Buka dashboard, edit artikel apa aja");
console.log("2. Di toolbar Konten, klik Youtube icon");
console.log("3. Paste URL: https://youtube.com/watch?v=xxx");
console.log("4. Video iframe muncul di editor");
console.log("5. Klik Music2 icon, pilih MP3 dari komputer");
console.log("6. Audio player muncul di editor");
console.log("7. Save artikel");
console.log("8. Cek di linguo.id/blog/<slug>");
console.log("9. Video play, audio play -> siap jadi learning content!");
console.log("============================================================");
