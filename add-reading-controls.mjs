#!/usr/bin/env node
// add-reading-controls.mjs — drag ke root linguo-landing, lalu: node add-reading-controls.mjs
import fs from "fs";
import { execSync } from "child_process";

const FILE = "src/app/blog/[slug]/ArticleContent.tsx";
if (!fs.existsSync(FILE)) { console.error("❌ Jalankan dari root linguo-landing"); process.exit(1); }

let code = fs.readFileSync(FILE, "utf-8");
let n = 0;

// 1. Add reading controls component before ClapButton
const clapAnchor = `// ========== CLAP BUTTON (Medium-style) ==========`;
const readingControls = `// ========== READING CONTROLS (font size + dark mode) ==========
function ReadingControls({ fontSize, setFontSize, darkMode, setDarkMode }: {
  fontSize: "s" | "m" | "l"; setFontSize: (s: "s" | "m" | "l") => void;
  darkMode: boolean; setDarkMode: (b: boolean) => void;
}) {
  const sizes: { key: "s" | "m" | "l"; label: string }[] = [
    { key: "s", label: "A" },
    { key: "m", label: "A" },
    { key: "l", label: "A" },
  ];
  return (
    <div className="flex items-center gap-3">
      {/* Font size */}
      <div className={\`flex items-center rounded-full p-0.5 \${darkMode ? "bg-slate-700" : "bg-slate-100"}\`}>
        {sizes.map((s, i) => (
          <button key={s.key} onClick={() => setFontSize(s.key)}
            className={\`px-2.5 py-1 rounded-full text-center transition-all font-semibold leading-none \${
              fontSize === s.key
                ? darkMode ? "bg-slate-600 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm"
                : darkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-400 hover:text-slate-600"
            }\`}
            title={\`Font \${s.key === "s" ? "kecil" : s.key === "m" ? "sedang" : "besar"}\`}
            style={{ fontSize: i === 0 ? "12px" : i === 1 ? "15px" : "18px" }}
          >{s.label}</button>
        ))}
      </div>
      {/* Dark/Light */}
      <button onClick={() => setDarkMode(!darkMode)}
        className={\`w-9 h-9 rounded-full flex items-center justify-center transition-all \${
          darkMode
            ? "bg-slate-700 text-amber-400 hover:bg-slate-600"
            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
        }\`}
        title={darkMode ? "Light mode" : "Dark mode"}
      >
        {darkMode ? (
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        ) : (
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
        )}
      </button>
    </div>
  );
}

// ========== CLAP BUTTON (Medium-style) ==========`;

if (code.includes(clapAnchor) && !code.includes("ReadingControls")) {
  code = code.replace(clapAnchor, readingControls);
  n++; console.log("✅ Added ReadingControls component");
}

// 2. Add state for fontSize and darkMode in main component
const oldShareUrl = `  const shareUrl = typeof window !== "undefined" ? window.location.href : \`https://linguo.id/blog/\${post.slug}\`;`;
const newShareUrl = `  const shareUrl = typeof window !== "undefined" ? window.location.href : \`https://linguo.id/blog/\${post.slug}\`;
  const [fontSize, setFontSize] = useState<"s" | "m" | "l">("m");
  const [darkMode, setDarkMode] = useState(false);

  const fontClass = fontSize === "s" ? "text-size-s" : fontSize === "l" ? "text-size-l" : "";`;

if (code.includes(oldShareUrl) && !code.includes("fontSize")) {
  code = code.replace(oldShareUrl, newShareUrl);
  n++; console.log("✅ Added fontSize + darkMode state");
}

// 3. Add dark mode CSS + font size CSS to ARTICLE_CSS
const cssEnd = `/* Responsive */`;
const darkCSS = `/* Font size variants */
.text-size-s .article-body p,
.text-size-s .article-body li { font-size: 0.9375rem; line-height: 1.75; }
.text-size-s .article-body h2 { font-size: 1.375rem; }
.text-size-s .article-body h3 { font-size: 1.125rem; }

.text-size-l .article-body p,
.text-size-l .article-body li { font-size: 1.1875rem; line-height: 1.9; }
.text-size-l .article-body h2 { font-size: 1.875rem; }
.text-size-l .article-body h3 { font-size: 1.5rem; }

/* Dark mode */
.blog-dark { background-color: #0f172a; color: #e2e8f0; }
.blog-dark nav { background: rgba(15,23,42,0.95) !important; border-color: #1e293b !important; }
.blog-dark nav a, .blog-dark nav span { color: #94a3b8 !important; }
.blog-dark nav a:hover { color: #e2e8f0 !important; }
.blog-dark .article-meta-card { background: #1e293b; border-color: #334155; }
.blog-dark .article-body h2 { color: #f1f5f9; border-color: #334155; }
.blog-dark .article-body h3 { color: #f1f5f9; }
.blog-dark .article-body p { color: #cbd5e1; }
.blog-dark .article-body strong { color: #f1f5f9; }
.blog-dark .article-body li { color: #cbd5e1; }
.blog-dark .article-body a { color: #2dd4bf; }
.blog-dark .article-body blockquote { background: #1e293b; border-color: #2dd4bf; color: #94a3b8; }
.blog-dark .article-body table { border-color: #334155; }
.blog-dark .article-body th { background: #1e293b; color: #e2e8f0; border-color: #334155; }
.blog-dark .article-body td { color: #cbd5e1; border-color: #1e293b; }
.blog-dark .article-body tbody tr:hover { background-color: #1e293b; }
.blog-dark .comment-section { border-color: #334155; }
.blog-dark .comment-form { background: #1e293b; }
.blog-dark .comment-form input, .blog-dark .comment-form textarea {
  background: #0f172a; border-color: #334155; color: #e2e8f0;
}
.blog-dark .social-bar { border-color: #334155; }
.blog-dark .tag-bottom { border-color: #334155; }
.blog-dark .related-card { background: #1e293b; border-color: #334155; }
.blog-dark .related-card h3 { color: #e2e8f0; }

/* Responsive */`;

if (code.includes(cssEnd) && !code.includes("blog-dark")) {
  code = code.replace(cssEnd, darkCSS);
  n++; console.log("✅ Added dark mode + font size CSS");
}

// 4. Add dark mode class to root div
const oldRoot = `    <div className="blog-page min-h-screen bg-white">`;
const newRoot = `    <div className={\`blog-page min-h-screen transition-colors duration-300 \${darkMode ? "blog-dark bg-[#0f172a]" : "bg-white"} \${fontClass}\`}>`;
if (code.includes(oldRoot)) {
  code = code.replace(oldRoot, newRoot);
  n++; console.log("✅ Root div → dynamic dark/font class");
}

// 5. Add reading controls bar below article meta card
const oldMetaEnd = `        {/* Article Body */}
        <article className="article-body`;
const newMetaEnd = `        {/* Reading Controls */}
        <div className={\`flex items-center justify-between py-3 px-1 mb-6 border-b \${darkMode ? "border-slate-700" : "border-slate-100"}\`}>
          <span className={\`text-xs font-medium \${darkMode ? "text-slate-500" : "text-slate-400"}\`}>{minutes} min read</span>
          <ReadingControls fontSize={fontSize} setFontSize={setFontSize} darkMode={darkMode} setDarkMode={setDarkMode} />
        </div>

        {/* Article Body */}
        <article className="article-body`;

if (code.includes(oldMetaEnd)) {
  code = code.replace(oldMetaEnd, newMetaEnd);
  n++; console.log("✅ Added reading controls bar above article");
}

// 6. Add article-meta-card class for dark mode
const oldMetaCard = `relative -mt-10 bg-white rounded-2xl shadow-sm border border-slate-100 px-6`;
const newMetaCard = `article-meta-card relative -mt-10 rounded-2xl shadow-sm border px-6`;
if (code.includes(oldMetaCard)) {
  code = code.replace(oldMetaCard, newMetaCard);
  n++; console.log("✅ Meta card → dark mode compatible");
}

// 7. Add dark-compatible classes to social bar
const oldSocialBar = `"flex items-center justify-between py-5 px-1 mb-8 border-y border-slate-100"`;
const newSocialBar = `\`social-bar flex items-center justify-between py-5 px-1 mb-8 border-y \${darkMode ? "border-slate-700" : "border-slate-100"}\``;
if (code.includes(oldSocialBar)) {
  code = code.replace(oldSocialBar, newSocialBar);
  n++; console.log("✅ Social bar → dark mode borders");
}

// 8. Tags section dark mode
const oldTagSection = `"flex flex-wrap gap-2 pb-8 border-t border-slate-100 pt-6 mb-8"`;
const newTagSection = `\`tag-bottom flex flex-wrap gap-2 pb-8 border-t pt-6 mb-8 \${darkMode ? "border-slate-700" : "border-slate-100"}\``;
if (code.includes(oldTagSection)) {
  code = code.replace(oldTagSection, newTagSection);
  n++; console.log("✅ Tags section → dark mode");
}

// 9. Comments section dark mode
const oldCommentBorder = `"border-t border-slate-100 pt-10 mb-16"`;
const newCommentBorder = `"comment-section border-t border-slate-100 pt-10 mb-16"`;
if (code.includes(oldCommentBorder)) {
  code = code.replace(oldCommentBorder, newCommentBorder);
  n++; console.log("✅ Comments → dark mode class");
}

const oldCommentForm = `"bg-slate-50 rounded-2xl p-5 sm:p-6 mb-8"`;
const newCommentForm = `"comment-form bg-slate-50 rounded-2xl p-5 sm:p-6 mb-8"`;
if (code.includes(oldCommentForm)) {
  code = code.replace(oldCommentForm, newCommentForm);
  n++; console.log("✅ Comment form → dark mode class");
}

// 10. Title color dynamic
const oldH1 = `font-extrabold text-slate-900 leading-tight mb-6`;
const newH1 = `font-extrabold leading-tight mb-6`;
if (code.includes(oldH1)) {
  code = code.replace(oldH1, newH1);
  n++; console.log("✅ H1 → inherits dark mode color");
}

if (n === 0) { console.log("⚠️ Tidak ada perubahan"); process.exit(0); }

fs.writeFileSync(FILE, code);
console.log(`\n📝 ${n} changes applied\n`);

execSync("git add -A", { stdio: "inherit" });
execSync('git commit -m "feat(blog): font size toggle (S/M/L) + dark mode toggle"', { stdio: "inherit" });
execSync("git push", { stdio: "inherit" });
console.log("\n🚀 Pushed!");
fs.unlinkSync("add-reading-controls.mjs");
console.log("🧹 Done.");
