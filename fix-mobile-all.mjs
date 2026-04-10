import { readFileSync, writeFileSync } from "fs";

let code = readFileSync("src/app/page.tsx", "utf8");
let changes = 0;

function fix(old, replacement, label) {
  if (code.includes(old)) {
    code = code.replace(old, replacement);
    changes++;
    console.log("✅ " + label);
  } else {
    console.log("⚠️  SKIP: " + label);
  }
}

// ═══════════════════════════════════════════
// HERO SECTION
// ═══════════════════════════════════════════

// 1. Hero container - less padding on mobile
fix(
  `<section className="bg-[#1A9E9E] lg:min-h-screen flex items-center relative overflow-hidden pt-24 lg:pt-32 pb-10 lg:pb-0">`,
  `<section className="bg-[#1A9E9E] lg:min-h-screen flex items-center relative overflow-hidden pt-20 lg:pt-32 pb-6 lg:pb-0">`,
  "Hero: tighter mobile padding"
);

// 2. Hero inner - less padding
fix(
  `<div className="max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-[1fr_1.3fr] gap-4 items-center py-16 lg:py-0">`,
  `<div className="max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-[1fr_1.3fr] gap-4 items-center py-4 lg:py-0">`,
  "Hero inner: less mobile padding"
);

// 3. Hero headline + character side by side on mobile
fix(
  `<motion.div initial={{opacity:0,x:-30}} animate={{opacity:1,x:0}} transition={{duration:0.7}}>
          <h1 className="text-3xl sm:text-5xl lg:text-[3.8rem] font-extrabold text-white leading-[1.08] mb-6 lg:mb-8">
            Belajar 55+<br/>{lang==="id"?"bahasa online":"languages online"}<br/>{lang==="id"?"rasa offline!":"feels offline!"}
          </h1>`,
  `<motion.div initial={{opacity:0,x:-30}} animate={{opacity:1,x:0}} transition={{duration:0.7}}>
          <div className="flex items-start gap-3 lg:block mb-4 lg:mb-0">
            <div className="flex-1">
              <h1 className="text-[1.6rem] sm:text-4xl lg:text-[3.8rem] font-extrabold text-white leading-[1.1] mb-4 lg:mb-8">
                Belajar 55+<br/>{lang==="id"?"bahasa online":"languages online"}<br/>{lang==="id"?"rasa offline!":"feels offline!"}
              </h1>
            </div>
            <div className="lg:hidden shrink-0 relative">
              <img src="/images/hero-character.png" alt="" className="w-24 sm:w-32 drop-shadow-xl"/>
              <motion.div animate={{y:[0,-5,0]}} transition={{duration:3,repeat:Infinity}} className="absolute -top-6 -left-6 sm:-top-8 sm:-left-8">
                <div className="relative bg-white rounded-xl px-2 py-1.5 sm:px-3 sm:py-2 shadow-lg">
                  <span className="font-bold text-[#1A9E9E] text-xs sm:text-sm flex items-center gap-1"><span>{GREETINGS[0].flag}</span> Hello!</span>
                  <div className="absolute -bottom-1 right-3 w-2.5 h-2.5 bg-white rotate-45"/>
                </div>
              </motion.div>
            </div>
          </div>`,
  "Hero: character + bubble beside headline on mobile"
);

// 4. Remove the old mobile character below google review
fix(
  `<img src="/images/hero-character.png" alt="" className="lg:hidden w-48 sm:w-56 mx-auto mt-6 drop-shadow-xl"/>`,
  ``,
  "Hero: removed old mobile character below"
);

// 5. Google review smaller on mobile
fix(
  `<img src="/images/google-review.png" alt="Google Reviews 5.0/5" className="h-8 mt-6 opacity-90"/>`,
  `<img src="/images/google-review.png" alt="Google Reviews 5.0/5" className="h-7 sm:h-8 mt-4 sm:mt-6 opacity-90"/>`,
  "Google review: smaller on mobile"
);

// 6. "Aku mau belajar" smaller on mobile
fix(
  `<span className="text-white text-lg font-semibold">`,
  `<span className="text-white text-sm sm:text-lg font-semibold">`,
  "Subtitle: smaller on mobile"
);

// 7. Globe button smaller on mobile
fix(
  `className="group h-11 rounded-full bg-white/20`,
  `className="group h-9 sm:h-11 rounded-full bg-white/20`,
  "Globe button: smaller on mobile"
);

// 8. HeroFunnel gap tighter
fix(
  `<div className="flex items-center gap-3 mb-4">`,
  `<div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">`,
  "Hero funnel: tighter gaps"
);

// ═══════════════════════════════════════════
// PRODUCT DOCK
// ═══════════════════════════════════════════

// 9. Section heading smaller on mobile
fix(
  `<h2 className="text-2xl font-bold text-center mb-2">Semua kebutuhan belajar bahasa ada di Linguo</h2>`,
  `<h2 className="text-xl sm:text-2xl font-bold text-center mb-2">Semua kebutuhan belajar bahasa ada di Linguo</h2>`,
  "Products heading: smaller mobile"
);

// ═══════════════════════════════════════════
// SECTION SPACING - reduce py-24 on mobile
// ═══════════════════════════════════════════

// How It Works
fix(
  `{/* HOW IT WORKS */}
    <section className="py-24 bg-slate-50">`,
  `{/* HOW IT WORKS */}
    <section className="py-14 lg:py-24 bg-slate-50">`,
  "How It Works: less padding mobile"
);

// How It Works heading smaller
fix(
  `<h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1A9E9E] mb-3">Learning new language is complicated<br/>but we can make it easy for you</h2>`,
  `<h2 className="text-lg sm:text-3xl lg:text-4xl font-bold text-[#1A9E9E] mb-3">Learning new language is complicated<br/>but we can make it easy for you</h2>`,
  "How It Works heading: smaller mobile"
);

fix(
  `<p className="text-slate-500 mb-16">Linguo helps you to become fluent in many language.</p>`,
  `<p className="text-slate-500 mb-8 lg:mb-16">Linguo helps you to become fluent in many language.</p>`,
  "How It Works: less gap mobile"
);

// Mobile grid gap
fix(
  `<div className="grid grid-cols-2 gap-8 lg:hidden">`,
  `<div className="grid grid-cols-2 gap-4 sm:gap-8 lg:hidden">`,
  "How It Works grid: smaller gap mobile"
);

// Popular Class
fix(
  `{/* POPULAR CLASS */}
    <section className="py-24 bg-white">`,
  `{/* POPULAR CLASS */}
    <section className="py-14 lg:py-24 bg-white">`,
  "Popular Class: less padding mobile"
);

fix(
  `<h2 className="text-3xl font-bold">Most popular class</h2>`,
  `<h2 className="text-xl sm:text-3xl font-bold">Most popular class</h2>`,
  "Popular Class heading: smaller mobile"
);

// Popular class cards smaller on mobile
fix(
  `className="w-[360px] shrink-0 group/card cursor-pointer">`,
  `className="w-[280px] sm:w-[360px] shrink-0 group/card cursor-pointer">`,
  "Popular class cards: smaller mobile"
);

fix(
  `<div className="relative h-56 rounded-2xl mb-4`,
  `<div className="relative h-44 sm:h-56 rounded-2xl mb-3 sm:mb-4`,
  "Popular class image: shorter mobile"
);

// Why Linguo
fix(
  `<section className="py-24 bg-white relative overflow-hidden">`,
  `<section className="py-14 lg:py-24 bg-white relative overflow-hidden">`,
  "Why Linguo: less padding mobile"
);

// Teachers
fix(
  `<section id="teacher" className="py-24 bg-slate-50">`,
  `<section id="teacher" className="py-14 lg:py-24 bg-slate-50">`,
  "Teachers: less padding mobile"
);

// Teacher grid smaller gaps
fix(
  `<div className="grid grid-cols-2 sm:grid-cols-3 gap-6">`,
  `<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">`,
  "Teacher grid: smaller gap mobile"
);

// Teacher heading
fix(
  `<h2 className="text-3xl font-bold mb-3">Meet Our Teacher</h2>`,
  `<h2 className="text-xl sm:text-3xl font-bold mb-3">Meet Our Teacher</h2>`,
  "Teacher heading: smaller mobile"
);

// Testimonial
fix(
  `<section className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-14">Story from our student</h2>`,
  `<section className="py-14 lg:py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-xl sm:text-3xl font-bold text-center mb-8 lg:mb-14">Story from our student</h2>`,
  "Testimonial: smaller heading + padding mobile"
);

// CTA
fix(
  `{/* CTA */}
    <section className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-5">`,
  `{/* CTA */}
    <section className="py-14 lg:py-24 bg-white">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-5">`,
  "CTA: smaller heading + padding mobile"
);

// FAQ
fix(
  `<section id="faq" className="py-24 bg-white">`,
  `<section id="faq" className="py-14 lg:py-24 bg-white">`,
  "FAQ: less padding mobile"
);

fix(
  `<h2 className="text-3xl font-bold text-center mb-3">Frequently Asked Questions</h2>`,
  `<h2 className="text-xl sm:text-3xl font-bold text-center mb-3">Frequently Asked Questions</h2>`,
  "FAQ heading: smaller mobile"
);

// WA widget smaller on mobile
fix(
  `<div className="h-14 w-14 rounded-full bg-[#25D366]`,
  `<div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-[#25D366]`,
  "WA widget: smaller mobile"
);

writeFileSync("src/app/page.tsx", code);
console.log(`\n✅ Done! ${changes} fixes applied.`);
