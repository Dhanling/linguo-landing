import { copyFileSync } from 'fs';

copyFileSync('BlogContent.tsx', 'src/app/blog/BlogContent.tsx');
console.log('✅ Blog listing page redesigned!');
console.log('');
console.log('Features:');
console.log('  • Promo banner CTA at top');
console.log('  • Featured article hero card');
console.log('  • 3-column article grid with gradient covers');
console.log('  • Author avatar + name + date on cards');
console.log('  • "Baca →" hover effect');
console.log('  • Numbered pagination + "next" button');
console.log('  • Category filters below pagination');
console.log('  • Terbaru / Populer / Direkomendasikan sections');
console.log('  • Navbar with category links + search');
console.log('  • Footer with all links');
console.log('');
console.log('Run: git add -A && git commit -m "redesign: blog listing page (Figma + Medium style)" && git push');
