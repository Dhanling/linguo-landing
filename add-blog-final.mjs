import { readFileSync, writeFileSync } from 'fs';

const FILE = 'src/app/page.tsx';
let content = readFileSync(FILE, 'utf-8');

// 1. Desktop nav — add ["Blog","/blog"] after ["FAQ","faq"]
const desktopOld = `["FAQ","faq"]].map`;
const desktopNew = `["FAQ","faq"],["Blog","/blog"]].map`;
if (content.includes(desktopOld)) {
  content = content.replace(desktopOld, desktopNew);
  console.log('✅ Desktop nav: added Blog after FAQ');
} else {
  console.log('❌ Desktop nav pattern not found');
}

// 2. Mobile nav — add Blog link after FAQ button
const mobileOld = `<button onClick={()=>{scrollTo("faq");setOpen(false)}} className="text-sm py-2.5 text-left">FAQ</button>`;
const mobileNew = `<button onClick={()=>{scrollTo("faq");setOpen(false)}} className="text-sm py-2.5 text-left">FAQ</button>
            <a href="/blog" onClick={()=>setOpen(false)} className="text-sm py-2.5">Blog</a>`;
if (content.includes(mobileOld)) {
  content = content.replace(mobileOld, mobileNew);
  console.log('✅ Mobile nav: added Blog after FAQ');
} else {
  console.log('❌ Mobile nav pattern not found');
}

writeFileSync(FILE, content, 'utf-8');
console.log('\n🎉 Done! Run:\n  git add -A && git commit -m "add Blog to navbar" && git push');
