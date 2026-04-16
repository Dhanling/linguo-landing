#!/usr/bin/env node
// Fix YouTube embed: ensure content div has article-body class
// + upgrade hydrate to also find raw iframes
// Run: cd ~/linguo-landing && node fix-youtube-blog.mjs

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const filePath = path.join(ROOT, 'src/app/blog/[slug]/ArticleContent.tsx');

if (!fs.existsSync(filePath)) {
  console.error('❌ File tidak ada');
  process.exit(1);
}

let c = fs.readFileSync(filePath, 'utf8');
const before = c;
const changes = [];

// Fix 1: Ensure content div has class "article-body"
// Pattern: <div dangerouslySetInnerHTML={{ __html: post.content }} />
// Might be: <div className="..." dangerouslySetInnerHTML=...
// Or: <div dangerouslySetInnerHTML=... (no className)

if (c.includes('className="article-body"') && c.includes('dangerouslySetInnerHTML={{ __html: post.content }}')) {
  console.log('✓ Content div sudah punya article-body class');
} else {
  // Case A: div tanpa className
  const noClass = '<div dangerouslySetInnerHTML={{ __html: post.content }} />';
  if (c.includes(noClass)) {
    c = c.replace(noClass, '<div className="article-body" dangerouslySetInnerHTML={{ __html: post.content }} />');
    changes.push('Content div: added className="article-body"');
  }
  // Case B: div punya className tapi bukan article-body
  else {
    const withClass = /(<div\s+className="[^"]*")\s+(dangerouslySetInnerHTML=\{\{ __html: post\.content \}\} \/>)/;
    const m = c.match(withClass);
    if (m) {
      const existingClass = m[1];
      if (!existingClass.includes('article-body')) {
        c = c.replace(withClass, existingClass.replace('className="', 'className="article-body ') + ' ' + m[2]);
        changes.push('Content div: prepended article-body to className');
      }
    }
  }
}

// Fix 2: Upgrade hydrate to also handle raw <iframe> YouTube embeds
// Currently only handles: .article-body figure.youtube-embed[data-youtube-id]
// Add: also find any <iframe> with youtube in src and wrap them properly

const oldHydrate = 'const hydrateYouTube = () => {';
const newHydrate = `const hydrateYouTube = () => {
      // Also handle raw iframes from editor
      const rawIframes = document.querySelectorAll<HTMLIFrameElement>(".article-body iframe[src*='youtube']");
      rawIframes.forEach(iframe => {
        const wrapper = document.createElement("div");
        wrapper.style.cssText = "position:relative;width:100%;padding-bottom:56.25%;margin:1.5rem 0;border-radius:1rem;overflow:hidden;";
        iframe.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;border:none;border-radius:1rem;";
        iframe.parentNode?.insertBefore(wrapper, iframe);
        wrapper.appendChild(iframe);
      });
`;

if (c.includes(oldHydrate) && !c.includes("rawIframes")) {
  c = c.replace(oldHydrate, newHydrate);
  changes.push('Hydrate: added raw iframe YouTube handler');
}

if (c === before) {
  console.log('⚠️  Tidak ada perubahan');
  process.exit(0);
}

fs.writeFileSync(filePath, c, 'utf8');
console.log('Changes:');
changes.forEach(ch => console.log('  • ' + ch));

console.log('\n🚀 Git...\n');
try {
  execSync('git add -A', { stdio: 'inherit', cwd: ROOT });
  execSync('git commit -m "fix(blog): YouTube embed class + raw iframe handler"', { stdio: 'inherit', cwd: ROOT });
  execSync('git push', { stdio: 'inherit', cwd: ROOT });
  console.log('\n✅ Pushed\n');
} catch (e) {
  console.log('Manual: cd ~/linguo-landing && git add -A && git commit -m "fix: youtube" && git push');
}

try { fs.unlinkSync(fileURLToPath(import.meta.url)); } catch {}
