#!/usr/bin/env node
// Simple: add Silabus nav link right BEFORE Blog in page.tsx
// Only touches src/app/page.tsx, only ONE replacement.
// Run from ~/linguo-landing

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const file = path.join(ROOT, 'src/app/page.tsx');

if (!fs.existsSync(file)) {
  console.error('❌ src/app/page.tsx tidak ada. Run dari ~/linguo-landing');
  process.exit(1);
}

let content = fs.readFileSync(file, 'utf8');

// Safety: kalau Silabus udah ada di area sekitar Blog nav link, skip
const blogIdx = content.search(/href=["']\/blog["']/);
if (blogIdx >= 0) {
  const nearby = content.slice(Math.max(0, blogIdx - 400), blogIdx + 100);
  if (/Silabus/.test(nearby) && /\/silabus/.test(nearby)) {
    console.log('✅ Silabus sudah ada di sekitar Blog nav, tidak perlu patch.\n');
    process.exit(0);
  }
}

let patched = false;
let changeDesc = '';

// Pattern A: JSX link tag
// <Link href="/blog" ...>Blog</Link>  atau  <a href="/blog" ...>Blog</a>
const jsxPat = /<(Link|a)\s+([^>]*?)href=(["'])\/blog\3([^>]*?)>\s*Blog\s*<\/\1>/;
const jsxMatch = content.match(jsxPat);
if (jsxMatch) {
  const [full, tag, attrsBefore, quote, attrsAfter] = jsxMatch;
  const silabusTag = `<${tag} ${attrsBefore}href=${quote}/silabus${quote}${attrsAfter}>Silabus</${tag}>`;
  content = content.replace(full, `${silabusTag}\n            ${full}`);
  patched = true;
  changeDesc = `JSX: ${silabusTag}`;
}

// Pattern B: data object {name:"Blog",href:"/blog"} atau variasi key/order
if (!patched) {
  const objPat = /(\{[^{}]{0,150}["'](?:Blog)["'][^{}]{0,150}href\s*:\s*["']\/blog["'][^{}]{0,50}\})/;
  const objPat2 = /(\{[^{}]{0,50}href\s*:\s*["']\/blog["'][^{}]{0,150}["'](?:Blog)["'][^{}]{0,150}\})/;
  const m = content.match(objPat) || content.match(objPat2);
  if (m) {
    const blogObj = m[1];
    const silabusObj = blogObj.replace(/\/blog/g, '/silabus').replace(/["']Blog["']/g, '"Silabus"');
    content = content.replace(blogObj, `${silabusObj},${blogObj}`);
    patched = true;
    changeDesc = `Data object: ${silabusObj}`;
  }
}

if (!patched) {
  console.log('❌ Tidak nemu pattern Blog nav link.');
  console.log('   Share 10 line sekitar "Blog" ke Claude:');
  console.log('   grep -n -B2 -A2 "/blog" src/app/page.tsx | head -20');
  process.exit(1);
}

fs.writeFileSync(file, content, 'utf8');
console.log(`✅ Inserted → ${changeDesc}\n`);

try {
  execSync('git add src/app/page.tsx', { stdio: 'inherit', cwd: ROOT });
  execSync('git commit -m "feat(nav): add Silabus link before Blog"', { stdio: 'inherit', cwd: ROOT });
  execSync('git push', { stdio: 'inherit', cwd: ROOT });
  console.log('\n✅ Pushed\n');
} catch (e) {
  console.log('⚠️  Git:', e.message);
}

try { fs.unlinkSync(fileURLToPath(import.meta.url)); } catch {}
