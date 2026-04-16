import { copyFileSync, readFileSync, writeFileSync } from 'fs';

// 1. Copy fixed article detail files
copyFileSync('slug-page.tsx', 'src/app/blog/[slug]/page.tsx');
console.log('✅ Fixed src/app/blog/[slug]/page.tsx');

copyFileSync('ArticleContent.tsx', 'src/app/blog/[slug]/ArticleContent.tsx');
console.log('✅ Fixed src/app/blog/[slug]/ArticleContent.tsx');

// 2. Fix BlogContent.tsx — replace featured_image with cover_image
const blogContent = 'src/app/blog/BlogContent.tsx';
let content = readFileSync(blogContent, 'utf-8');
const count = (content.match(/featured_image/g) || []).length;
content = content.replace(/featured_image/g, 'cover_image');
writeFileSync(blogContent, content, 'utf-8');
console.log(`✅ Fixed BlogContent.tsx — replaced ${count} instances of featured_image → cover_image`);

console.log('\n🎉 All fixed! Run:');
console.log('  git add -A && git commit -m "fix: article detail page + cover_image column" && git push');
