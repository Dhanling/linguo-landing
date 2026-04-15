import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';

const files = [
  { src: 'blog-page.tsx',       dest: 'src/app/blog/page.tsx' },
  { src: 'BlogContent.tsx',     dest: 'src/app/blog/BlogContent.tsx' },
  { src: 'slug-page.tsx',       dest: 'src/app/blog/[slug]/page.tsx' },
  { src: 'ArticleContent.tsx',  dest: 'src/app/blog/[slug]/ArticleContent.tsx' },
];

console.log('📦 Installing blog redesign files...\n');

for (const { src, dest } of files) {
  // Ensure directory exists
  const dir = dirname(dest);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    console.log(`  📁 Created ${dir}`);
  }

  try {
    copyFileSync(src, dest);
    console.log(`  ✅ ${src} → ${dest}`);
  } catch (e) {
    console.log(`  ❌ Failed: ${src} → ${dest}`, e.message);
  }
}

console.log('\n🎉 Blog redesign installed! Now run:');
console.log('  git add -A && git commit -m "blog redesign: listing + detail + footer (Figma)" && git push');
console.log('\n💡 Tip: If you see Tailwind prose errors, run:');
console.log('  npm install -D @tailwindcss/typography');
