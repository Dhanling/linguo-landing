import { readFileSync, writeFileSync } from "fs";

let code = readFileSync("src/app/page.tsx", "utf8");

// 1. FIX HERO: Remove min-h-screen on mobile → less empty teal space
code = code.replace(
  `<section className="bg-[#1A9E9E] min-h-screen flex items-center relative overflow-hidden pt-32">`,
  `<section className="bg-[#1A9E9E] min-h-[60vh] lg:min-h-screen flex items-center relative overflow-hidden pt-24 lg:pt-32 pb-12 lg:pb-0">`
);
console.log("✅ Hero: reduced mobile height");

// 2. FIX HERO: Smaller heading on mobile
code = code.replace(
  `<h1 className="text-4xl sm:text-5xl lg:text-[3.8rem] font-extrabold text-white leading-[1.08] mb-8">`,
  `<h1 className="text-3xl sm:text-5xl lg:text-[3.8rem] font-extrabold text-white leading-[1.08] mb-6 lg:mb-8">`
);
console.log("✅ Hero: smaller mobile heading");

// 3. FIX PRODUCT DOCK: Make horizontally scrollable on mobile
code = code.replace(
  `<div ref={containerRef}
      className="flex justify-center gap-4 items-end py-6 px-4"
      onMouseMove={(e)=>setMouseX(e.clientX)}
      onMouseLeave={()=>setMouseX(null)}>`,
  `<div ref={containerRef}
      className="flex lg:justify-center gap-4 items-end py-6 px-4 overflow-x-auto lg:overflow-visible snap-x snap-mandatory pb-4 -mx-2 lg:mx-0"
      onMouseMove={(e)=>setMouseX(e.clientX)}
      onMouseLeave={()=>setMouseX(null)}>`
);
console.log("✅ Product Dock: horizontally scrollable on mobile");

// 4. FIX DOCK CARD: smaller on mobile, snap points
code = code.replace(
  `className="flex flex-col bg-white border-2 rounded-2xl p-5 w-[200px] cursor-pointer origin-bottom"`,
  `className="flex flex-col bg-white border-2 rounded-2xl p-4 lg:p-5 w-[170px] lg:w-[200px] shrink-0 snap-center cursor-pointer origin-bottom"`
);
console.log("✅ Dock Card: mobile-friendly size + snap");

// 5. FIX HOW IT WORKS: mobile grid
code = code.replace(
  `<div className="grid sm:grid-cols-2 gap-8 max-w-3xl mx-auto lg:hidden">`,
  `<div className="grid grid-cols-2 gap-4 sm:gap-8 max-w-3xl mx-auto lg:hidden">`
);
console.log("✅ How It Works: 2-col grid on all mobile");

// 6. FIX TEACHER GRID: smaller gaps on mobile
code = code.replace(
  `<div className="grid grid-cols-2 sm:grid-cols-3 gap-6">`,
  `<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">`
);
console.log("✅ Teacher Grid: tighter mobile gaps");

// 7. FIX PRICING: responsive padding
code = code.replace(
  `<section id="produk" className="py-24 bg-slate-50">`,
  `<section id="produk" className="py-16 lg:py-24 bg-slate-50">`
);
console.log("✅ Pricing: less mobile padding");

// 8. FIX GENERAL: section spacing on mobile
code = code.replace(
  `<section className="py-24 bg-white relative overflow-hidden">`,
  `<section className="py-16 lg:py-24 bg-white relative overflow-hidden">`
);
code = code.replace(
  `<section id="teacher" className="py-24 bg-slate-50">`,
  `<section id="teacher" className="py-16 lg:py-24 bg-slate-50">`
);
code = code.replace(
  `<section className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-14">Story from our student</h2>`,
  `<section className="py-16 lg:py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-2xl lg:text-3xl font-bold text-center mb-10 lg:mb-14">Story from our student</h2>`
);
console.log("✅ Sections: reduced mobile padding");

// 9. FIX FAQ section
code = code.replace(
  `<section id="faq" className="py-24 bg-white">`,
  `<section id="faq" className="py-16 lg:py-24 bg-white">`
);
console.log("✅ FAQ: mobile padding");

// 10. FIX CTA section
code = code.replace(
  `<section className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-5">`,
  `<section className="py-16 lg:py-24 bg-white">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-5">`
);
console.log("✅ CTA: smaller mobile heading");

writeFileSync("src/app/page.tsx", code);
console.log("\n✅ All mobile fixes applied! Push to deploy.");
