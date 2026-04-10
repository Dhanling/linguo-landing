import { readFileSync, writeFileSync } from "fs";

let code = readFileSync("src/app/page.tsx", "utf8");

// 1. Fix hero height - even smaller on mobile
code = code.replace(
  `<section className="bg-[#1A9E9E] min-h-[60vh] lg:min-h-screen flex items-center relative overflow-hidden pt-24 lg:pt-32 pb-12 lg:pb-0">`,
  `<section className="bg-[#1A9E9E] lg:min-h-screen flex items-center relative overflow-hidden pt-24 lg:pt-32 pb-10 lg:pb-0">`
);
console.log("✅ Hero: removed min-h on mobile");

// 2. Fix WA input - make button smaller on mobile so it doesn't get cut off
code = code.replace(
  `className="bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold px-4 py-2 text-xs transition-all active:scale-95 whitespace-nowrap rounded-full m-1 shrink-0">
            Dapatkan Diskon →`,
  `className="bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold px-3 sm:px-4 py-2 text-[10px] sm:text-xs transition-all active:scale-95 whitespace-nowrap rounded-full m-1 shrink-0">
            <span className="hidden sm:inline">Dapatkan Diskon →</span><span className="sm:hidden">Diskon →</span>`
);
console.log("✅ WA button: shorter text on mobile");

// 3. Fix WA input container - max width on mobile
code = code.replace(
  `<div className="bg-white rounded-full flex items-center max-w-sm shadow-lg">`,
  `<div className="bg-white rounded-full flex items-center max-w-[340px] sm:max-w-sm shadow-lg">`
);
console.log("✅ WA input: constrained width on mobile");

// 4. Show hero character on mobile (smaller version)
code = code.replace(
  `<motion.div initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} transition={{delay:0.3}} className="hidden lg:flex justify-end relative -mr-20">
          <div className="relative w-[750px] h-[750px]">`,
  `<motion.div initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} transition={{delay:0.3}} className="hidden lg:flex justify-end relative -mr-20">
          <div className="relative w-[750px] h-[750px]">`
);
// Add a small mobile character after google review
code = code.replace(
  `<img src="/images/google-review.png" alt="Google Reviews 5.0/5" className="h-8 mt-6 opacity-90"/>`,
  `<img src="/images/google-review.png" alt="Google Reviews 5.0/5" className="h-8 mt-6 opacity-90"/>
          <img src="/images/hero-character.png" alt="" className="lg:hidden w-48 sm:w-56 mx-auto mt-6 drop-shadow-xl"/>`
);
console.log("✅ Hero character: visible on mobile (smaller)");

writeFileSync("src/app/page.tsx", code);
console.log("\n✅ Mobile hero fixes applied!");
