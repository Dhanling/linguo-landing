import { readFileSync, writeFileSync } from "fs";

let code = readFileSync("src/app/page.tsx", "utf8");

// 1. Fix logo - find exact string
code = code.replace(
  `<img src="/images/logo-white.png" alt="Linguo" className={\`h-14 object-contain`,
  `<img src="/images/logo-white.png" alt="Linguo" className={\`h-8 sm:h-14 object-contain`
);
if (code.includes('h-9 sm:h-14 object-contain')) {
  code = code.replace('h-9 sm:h-14 object-contain', 'h-8 sm:h-14 object-contain');
}
console.log("✅ Logo: smaller mobile");

// 2. Character bigger
code = code.replace(
  `<img src="/images/hero-character.png" alt="" className="w-32 sm:w-40 drop-shadow-xl"/>`,
  `<img src="/images/hero-character.png" alt="" className="w-36 sm:w-44 drop-shadow-xl"/>`
);
// Also try old size
code = code.replace(
  `<img src="/images/hero-character.png" alt="" className="w-24 sm:w-32 drop-shadow-xl"/>`,
  `<img src="/images/hero-character.png" alt="" className="w-36 sm:w-44 drop-shadow-xl"/>`
);
console.log("✅ Character: bigger");

// 3. "Semua kebutuhan" section - even less top padding
code = code.replace(
  `<section className="bg-white py-6 sm:py-14 border-b border-slate-100">`,
  `<section className="bg-white py-4 sm:py-14 border-b border-slate-100">`
);
console.log("✅ Product section: minimal top padding");

// 4. "Semua kebutuhan" title smaller margin
code = code.replace(
  `<h2 className="text-xl sm:text-2xl font-bold text-center mb-2">Semua kebutuhan belajar bahasa ada di Linguo</h2>`,
  `<h2 className="text-lg sm:text-2xl font-bold text-center mb-1">Semua kebutuhan belajar bahasa ada di Linguo</h2>`
);
console.log("✅ Product title: smaller + less margin");

// 5. Replace ProductDock on mobile with simple grid (no animation)
// Replace the whole ProductDock function to disable hover on mobile
code = code.replace(
  `function ProductDock({setPricingTab}:{setPricingTab:(t:number)=>void}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [mouseX, setMouseX] = useState<number|null>(null);

  const getScale = (el:HTMLDivElement|null) => {
    if(mouseX===null || !el) return 1;
    const rect = el.getBoundingClientRect();
    const center = rect.left + rect.width/2;
    const dist = Math.abs(mouseX - center);
    const maxDist = 300;
    if(dist > maxDist) return 1;
    return 1 + 0.1 * Math.pow(1 - dist/maxDist, 2);
  };

  return (
    <div ref={containerRef}
      className="flex lg:justify-center gap-4 items-end py-6 px-4 overflow-x-auto lg:overflow-visible snap-x snap-mandatory pb-4 -mx-2 lg:mx-0"
      onMouseMove={(e)=>setMouseX(e.clientX)}
      onMouseLeave={()=>setMouseX(null)}>
      {PRODUCTS.map((p,i)=>(
        <DockCard key={i} product={p} getScale={getScale} setPricingTab={setPricingTab}/>
      ))}
    </div>
  );
}`,
  `function ProductDock({setPricingTab}:{setPricingTab:(t:number)=>void}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [mouseX, setMouseX] = useState<number|null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const getScale = (el:HTMLDivElement|null) => {
    if(isMobile || mouseX===null || !el) return 1;
    const rect = el.getBoundingClientRect();
    const center = rect.left + rect.width/2;
    const dist = Math.abs(mouseX - center);
    const maxDist = 300;
    if(dist > maxDist) return 1;
    return 1 + 0.1 * Math.pow(1 - dist/maxDist, 2);
  };

  return (
    <div ref={containerRef}
      className="flex lg:justify-center gap-3 lg:gap-4 items-end py-2 lg:py-6 px-2 lg:px-4 overflow-x-auto lg:overflow-visible snap-x snap-mandatory pb-3 lg:pb-4 -mx-2 lg:mx-0"
      onMouseMove={(e)=>setMouseX(e.clientX)}
      onMouseLeave={()=>setMouseX(null)}>
      {PRODUCTS.map((p,i)=>(
        <DockCard key={i} product={p} getScale={getScale} setPricingTab={setPricingTab}/>
      ))}
    </div>
  );
}`
);
console.log("✅ ProductDock: no hover zoom on mobile");

// 6. DockCard smaller on mobile
code = code.replace(
  `className="flex flex-col bg-white border-2 rounded-2xl p-4 lg:p-5 w-[170px] lg:w-[200px] shrink-0 snap-center cursor-pointer origin-bottom"`,
  `className="flex flex-col bg-white border-2 rounded-2xl p-3 lg:p-5 w-[150px] lg:w-[200px] shrink-0 snap-center cursor-pointer origin-bottom"`
);
console.log("✅ DockCard: smaller mobile cards");

writeFileSync("src/app/page.tsx", code);
console.log("\n✅ All final tweaks applied!");
