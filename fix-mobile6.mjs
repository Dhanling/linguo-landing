import { readFileSync, writeFileSync } from "fs";

let code = readFileSync("src/app/page.tsx", "utf8");

// 1. Reduce ALL remaining py-14 to py-10 on mobile for tighter sections
code = code.replaceAll('py-14 lg:py-24', 'py-8 lg:py-24');
console.log("✅ All sections: py-14 → py-8 on mobile");

// 2. Product section even tighter
code = code.replace(
  `<section className="bg-white py-8 sm:py-14 border-b border-slate-100">`,
  `<section className="bg-white py-6 sm:py-14 border-b border-slate-100">`
);
console.log("✅ Product section: tighter");

// 3. Client marquee less padding
code = code.replace(
  `<section className="py-10 bg-white border-b border-slate-100 overflow-hidden group">`,
  `<section className="py-5 sm:py-10 bg-white border-b border-slate-100 overflow-hidden group">`
);
console.log("✅ Clients marquee: less padding mobile");

// 4. Popular Class "Browse more" less margin
code = code.replace(
  `<div className="text-center mt-10">`,
  `<div className="text-center mt-5 sm:mt-10">`
);
console.log("✅ Browse more: less margin mobile");

// 5. Fix Pricing section - make plans 2-col grid on mobile
// Find the pricing plans rendering and change from flex-col to grid
code = code.replace(
  `<div className="flex flex-col gap-4 max-w-sm mx-auto">`,
  `<div className="grid grid-cols-2 gap-3 sm:flex sm:flex-col sm:gap-4 sm:max-w-sm sm:mx-auto">`
);
console.log("✅ Pricing plans: 2-col grid on mobile");

// If that didn't match, try alternative pattern
if (!code.includes('grid grid-cols-2 gap-3 sm:flex sm:flex-col')) {
  // Look for the plans map container - it might be different
  // Let me search for the plan cards rendering pattern
  const planCardPattern = /className="flex flex-col gap-4">\s*\{tab\.plans/;
  if (planCardPattern.test(code)) {
    code = code.replace(
      /className="flex flex-col gap-4">/,
      'className="grid grid-cols-2 gap-3 sm:flex sm:flex-col sm:gap-4">'
    );
    console.log("✅ Pricing plans (alt): 2-col grid on mobile");
  }
}

// 6. "Choose a learning plan" heading smaller mobile
code = code.replace(
  `<h2 className="text-3xl sm:text-4xl font-bold text-center mb-3">Choose a learning plan<br/>that speaks to you</h2>`,
  `<h2 className="text-xl sm:text-4xl font-bold text-center mb-3">Choose a learning plan<br/>that speaks to you</h2>`
);
console.log("✅ Pricing heading: smaller mobile");

// 7. Why Linguo heading smaller
code = code.replace(
  `<h2 className="text-3xl font-bold text-center text-[#1A9E9E] mb-4">Why Linguo?</h2>`,
  `<h2 className="text-xl sm:text-3xl font-bold text-center text-[#1A9E9E] mb-4">Why Linguo?</h2>`
);
console.log("✅ Why Linguo heading: smaller mobile");

// 8. CTA section less space
code = code.replace(
  `<p className="text-slate-500 mb-8 max-w-lg mx-auto">`,
  `<p className="text-slate-500 mb-4 sm:mb-8 max-w-lg mx-auto">`
);
console.log("✅ CTA: less gap mobile");

writeFileSync("src/app/page.tsx", code);
console.log("\n✅ Spacing & pricing grid fixes applied!");
