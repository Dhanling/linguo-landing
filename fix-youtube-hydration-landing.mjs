#!/usr/bin/env node
// Add client-side hydration for YouTube figures missing iframe
// Also strengthens editor-side embed so contenteditable doesn't strip iframe
// Run from ~/linguo-landing root
import fs from "fs";
import { execSync } from "child_process";

const FILE = "src/app/blog/[slug]/ArticleContent.tsx";
if (!fs.existsSync(FILE)) {
  console.error("[ERR] " + FILE + " not found.");
  process.exit(1);
}

let src = fs.readFileSync(FILE, "utf8");

// Make sure useEffect is imported
if (!src.includes("useEffect")) {
  // Try to add to existing react import
  src = src.replace(/import \{ ([^}]*) \} from "react"/, 'import { $1, useEffect } from "react"');
  if (!src.includes("useEffect")) {
    src = src.replace(/"use client";/, '"use client";\nimport { useEffect } from "react";');
  }
  console.log("[OK] Added useEffect import");
}

// Insert hydration useEffect inside ArticleContent function, after track view effect
const TRACK_VIEW_END = `    }).catch(() => { /* silently fail - analytics shouldnt break UX */ });
  }, [post?.slug, post?.id]);`;

const HYDRATE_EFFECT = `    }).catch(() => { /* silently fail - analytics shouldnt break UX */ });
  }, [post?.slug, post?.id]);

  // Hydrate YouTube embeds — contenteditable may strip iframes on save
  // We rebuild them from data-youtube-id on client mount
  useEffect(() => {
    const figures = document.querySelectorAll<HTMLElement>(".article-body figure.youtube-embed");
    figures.forEach(fig => {
      const id = fig.getAttribute("data-youtube-id");
      if (!id) return;
      const hasIframe = fig.querySelector("iframe");
      if (hasIframe) return;
      // Rebuild iframe
      const iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube.com/embed/" + id;
      iframe.setAttribute("frameborder", "0");
      iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
      iframe.setAttribute("allowfullscreen", "");
      iframe.setAttribute("loading", "lazy");
      iframe.setAttribute("title", "YouTube video");
      iframe.style.cssText = "width:100%;height:100%;aspect-ratio:16/9;border:none;border-radius:0.75rem;";
      // Clear any stray children (like <br>)
      fig.innerHTML = "";
      fig.appendChild(iframe);
    });
  }, [post?.content]);`;

if (src.includes("Hydrate YouTube embeds")) {
  console.log("OK  YouTube hydration already present");
} else if (src.includes(TRACK_VIEW_END)) {
  src = src.replace(TRACK_VIEW_END, HYDRATE_EFFECT);
  console.log("[OK] Added YouTube hydration effect (rebuilds iframe on mount)");
} else {
  console.warn("[WARN] Track view effect not found — adding hydration at function start instead");
  // Fallback: add at start of component
  const fallbackOld = `export default function ArticleContent({ post, relatedPosts }: { post: BlogPost; relatedPosts: BlogPost[] }) {
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";`;
  const fallbackNew = `export default function ArticleContent({ post, relatedPosts }: { post: BlogPost; relatedPosts: BlogPost[] }) {
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  useEffect(() => {
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
  if (src.includes(fallbackOld)) {
    src = src.replace(fallbackOld, fallbackNew);
    console.log("[OK] Added hydration at component start (fallback)");
  }
}

fs.writeFileSync(FILE, src, "utf8");

try {
  execSync("git add -A", { stdio: "inherit" });
  execSync('git commit -m "fix(blog): hydrate YouTube iframes on mount — rebuild from data-youtube-id"', { stdio: "inherit" });
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
console.log("YOUTUBE HYDRATION FIX DEPLOYED");
console.log("============================================================");
console.log("Setelah Vercel deploy (~1 min):");
console.log("1. Artikel Uzbek dengan YouTube kotak hitam -> iframe auto muncul");
console.log("2. Future embed tanpa iframe -> auto di-hydrate dari data-id");
console.log("3. Fallback kalau contenteditable strip iframe dari browser");
console.log("============================================================");
console.log("");
console.log("NEXT: juga butuh fix dashboard biar iframe gak mudah strip");
console.log("Run: node blog-embed-stronger.mjs");
