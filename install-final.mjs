import { copyFileSync, mkdirSync, existsSync } from 'fs';

const dir = 'src/app/blog';
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

copyFileSync('BlogContent.tsx', dir + '/BlogContent.tsx');
console.log('✅ BlogContent.tsx installed to src/app/blog/');
console.log('');
console.log('🎨 Feed view (Medium-style):');
console.log('   • Infinite scroll with IntersectionObserver');
console.log('   • 👏 Clap button (localStorage)');
console.log('   • 🔖 Bookmark/save toggle');
console.log('   • 💬 Comment count');
console.log('   • ⋯ More menu (Not interested + Copy link)');
console.log('   • Sidebar: Staff Picks + Recommended Topics');
console.log('');
console.log('📱 Grid view (Figma):');
console.log('   • Banner + 3-col cards + pagination');
console.log('   • Terbaru / Populer / Direkomendasikan');
console.log('');
console.log('Run: git add -A && git commit -m "feat: Medium-style blog with clap, bookmark, more menu" && git push');
