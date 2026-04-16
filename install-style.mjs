import { copyFileSync } from 'fs';

copyFileSync('ArticleContent.tsx', 'src/app/blog/[slug]/ArticleContent.tsx');
console.log('✅ Updated ArticleContent.tsx with:');
console.log('   - Custom CSS for h2, p, strong, a, blockquote styling');
console.log('   - Auto-generated gradient cover image per language');
console.log('   - Better article meta card layout');
console.log('   - CTA with WhatsApp button');
console.log('   - Decorative hero with language initial');
console.log('\n🎉 Run: git add -A && git commit -m "style: article detail page redesign" && git push');
