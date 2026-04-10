import { readFileSync, writeFileSync } from "fs";

let code = readFileSync("src/app/page.tsx", "utf8");

// Remove previous mobile character (absolute positioned)
code = code.replace(
  `{/* Mobile character - positioned absolute right */}
      <img src="/images/hero-character.png" alt="" className="lg:hidden absolute right-0 bottom-0 w-40 sm:w-52 opacity-30 pointer-events-none" style={{filter:'drop-shadow(0 0 20px rgba(0,0,0,0.1))'}}/>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-[1fr_1.3fr] gap-4 items-center py-8 lg:py-0 relative z-10">`,
  `<div className="max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-[1fr_1.3fr] gap-4 items-center py-6 lg:py-0">`
);

// Replace the headline + hero area to include mobile character beside text
code = code.replace(
  `<motion.div initial={{opacity:0,x:-30}} animate={{opacity:1,x:0}} transition={{duration:0.7}}>
          <h1 className="text-[1.7rem] sm:text-5xl lg:text-[3.8rem] font-extrabold text-white leading-[1.1] mb-4 sm:mb-6 lg:mb-8">
            Belajar 55+<br/>{lang==="id"?"bahasa online":"languages online"}<br/>{lang==="id"?"rasa offline!":"feels offline!"}
          </h1>`,
  `<motion.div initial={{opacity:0,x:-30}} animate={{opacity:1,x:0}} transition={{duration:0.7}}>
          {/* Mobile: headline + character side by side */}
          <div className="flex items-start gap-2 lg:block">
            <h1 className="text-[1.65rem] sm:text-5xl lg:text-[3.8rem] font-extrabold text-white leading-[1.1] mb-4 sm:mb-6 lg:mb-8 flex-1">
              Belajar 55+<br/>{lang==="id"?"bahasa online":"languages online"}<br/>{lang==="id"?"rasa offline!":"feels offline!"}
            </h1>
            <div className="lg:hidden shrink-0 relative mt-1">
              <img src="/images/hero-character.png" alt="" className="w-28 sm:w-36 drop-shadow-xl"/>
              <div className="absolute -top-3 -left-4 bg-white rounded-xl px-2.5 py-1.5 shadow-lg">
                <TypingBubble/>
              </div>
            </div>
          </div>`
);
console.log("✅ Hero: character + bubble beside headline on mobile");

// Fix TypingBubble mobile size - make it smaller
// Need to check if TypingBubble is accessible from here - it's defined earlier in the file so it should be fine

writeFileSync("src/app/page.tsx", code);
console.log("✅ Saved!");
