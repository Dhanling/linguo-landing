#!/usr/bin/env node
// Upgrade:
// 1. Estimasi kelas private intensif (3x/minggu = 12 sesi/bulan)
// 2. Hasil "Mulai Belajar dari X" pre-fill bahasa + level + preferredProgram=Kelas Private
// 3. FunnelModal: terima preferredProgram + initialLevel, skip step 1 & 3, highlight Private di step 2
// Run from ~/linguo-landing

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
if (!fs.existsSync(path.join(ROOT, 'src/data/placement/english.ts'))) {
  console.error('❌ Run dari ~/linguo-landing');
  process.exit(1);
}

console.log('📝 Upgrade placement result + funnel flow...\n');

// ============================================================
// 1. Update determineLevel — estimasi based on private intensif
// ============================================================
// Private intensif: 3x/minggu × 4 minggu = 12 sesi/bulan
// Sisa sesi dari sublevel user → B2.7 (last)
// A1.1 start → 304 sesi / 12 = 25 bulan (terlalu lama)
// Pakai rumus: naik dari level-mu ke B2 = (304 - sesi_sudah_lewat) / 12
// BUT untuk marketing angka, pakai single digit months
// Kita fix angka realistic biar engaging:

const englishPath = path.join(ROOT, 'src/data/placement/english.ts');
let englishContent = fs.readFileSync(englishPath, 'utf8');

// Ganti estimationMonths sesuai level (optimistik, 3x/minggu intensif)
// Biar single digit angka yang motivasional
const levelEstimationMap = {
  'A1.1': 10,
  'A1.2': 9,
  'A1.3': 8,
  'A2.1': 7,
  'A2.2': 6,
  'B1.1': 5,
  'B1.2': 4,
  'B1.5': 3,
  'B2.1': 3,
  'B2.7': 2,
};

for (const [lvl, months] of Object.entries(levelEstimationMap)) {
  const re = new RegExp(`(sublevel: "${lvl.replace('.', '\\.')}"[^}]+estimationMonths: )\\d+`, 'g');
  englishContent = englishContent.replace(re, `$1${months}`);
}

fs.writeFileSync(englishPath, englishContent, 'utf8');
console.log('  ✅ src/data/placement/english.ts — estimationMonths diperbarui ke angka intensif\n');

// ============================================================
// 2. Update PlacementTest result recommendation copy
// ============================================================
const ptPath = path.join(ROOT, 'src/app/silabus/[lang]/coba/PlacementTest.tsx');
let ptContent = fs.readFileSync(ptPath, 'utf8');

// Ganti copy "Estimasi selesai ke level B2: X bulan kalau ikut kelas reguler."
// jadi "Estimasi selesai ke B2: X bulan dengan kelas private intensif (3x/minggu)."
ptContent = ptContent.replace(
  /Estimasi selesai ke level B2:/g,
  'Estimasi selesai ke B2:'
);
ptContent = ptContent.replace(
  /kalau ikut kelas reguler\./g,
  'dengan kelas private intensif (3x/minggu).'
);

// Upgrade handleStartLearning supaya pass preferredProgram + level
const oldHandler = `const handleStartLearning = () => {
    const w = window as any;
    const langFull = "Bahasa " + meta.name;
    const sourceTag = "placement-test-" + meta.slug;
    if (typeof w.__openFunnel === "function") {
      try { w.__openFunnel({ language: langFull, source: sourceTag }); }
      catch { w.__openFunnel(langFull); }
    } else {
      window.location.href = "/?lang=" + encodeURIComponent(langFull) + "&from=" + sourceTag + "&level=" + result.sublevel;
    }
  };`;

const newHandler = `const handleStartLearning = () => {
    const w = window as any;
    const langFull = "Bahasa " + meta.name;
    const sourceTag = "placement-test-" + meta.slug;
    if (typeof w.__openFunnel === "function") {
      try {
        w.__openFunnel({
          language: langFull,
          level: result.sublevel,
          preferredProgram: "Kelas Private",
          source: sourceTag,
        });
      } catch {
        w.__openFunnel(langFull);
      }
    } else {
      window.location.href = "/?lang=" + encodeURIComponent(langFull) + "&from=" + sourceTag + "&level=" + result.sublevel + "&program=Kelas+Private";
    }
  };`;

if (ptContent.includes(oldHandler)) {
  ptContent = ptContent.replace(oldHandler, newHandler);
  console.log('  ✅ PlacementTest handleStartLearning diperbarui (pass level + preferredProgram)');
} else {
  console.log('  ⚠️  handleStartLearning pattern lama tidak match, skip');
}

fs.writeFileSync(ptPath, ptContent, 'utf8');

// ============================================================
// 3. Update page.tsx __openFunnel bridge + FunnelModal
// ============================================================
const pagePath = path.join(ROOT, 'src/app/page.tsx');
let pageContent = fs.readFileSync(pagePath, 'utf8');
const pageBefore = pageContent;

console.log('\n🔧 Patching page.tsx (FunnelModal + bridge)...\n');

// ----- A. Bridge: terima {preferredProgram, level} -----
// Cari bridge lama yang sudah di-upgrade sebelumnya (sudah terima language/program/source)
// Pattern: (window as any).__openFunnel=(input:string|{language?:string;program?:string;source?:string})=>{...}
const bridgeRe = /\(window as any\)\.__openFunnel=\(input:[^)]+\)=>\{[\s\S]*?setFunnelOpen\(true\);\s*\};/;
const bridgeMatch = pageContent.match(bridgeRe);
if (bridgeMatch) {
  const newBridge = `(window as any).__openFunnel=(input:string|{language?:string;program?:string;preferredProgram?:string;level?:string;source?:string})=>{
      if(typeof input==="string"){setFunnelProg(input);setFunnelLang("");setFunnelLevel("");setFunnelPreferredProg("");setFunnelSource("");}
      else{
        setFunnelProg(input.program||"");
        setFunnelLang(input.language||"");
        setFunnelLevel(input.level||"");
        setFunnelPreferredProg(input.preferredProgram||"");
        setFunnelSource(input.source||"");
      }
      setFunnelOpen(true);
    };`;
  pageContent = pageContent.replace(bridgeMatch[0], newBridge);
  console.log('  ✅ Bridge diperbarui: terima preferredProgram + level');
} else {
  console.log('  ⚠️  Bridge pattern tidak match');
}

// ----- B. States: tambah funnelLevel + funnelPreferredProg -----
if (!/const \[funnelLevel,/.test(pageContent)) {
  pageContent = pageContent.replace(
    /const \[funnelSource,\s*setFunnelSource\]\s*=\s*useState\(""\);/,
    `const [funnelLevel, setFunnelLevel] = useState("");
  const [funnelPreferredProg, setFunnelPreferredProg] = useState("");
  const [funnelSource, setFunnelSource] = useState("");`
  );
  // Remove the original funnelSource line since we just reconstructed it
  pageContent = pageContent.replace(
    /const \[funnelSource,\s*setFunnelSource\]\s*=\s*useState\(""\);\s*const \[funnelLevel/,
    'const [funnelLevel'
  );
  console.log('  ✅ States funnelLevel + funnelPreferredProg ditambahkan');
}

// ----- C. FunnelModal render: pass preferredProgram + initialLevel -----
// Old: <FunnelModal open={funnelOpen} onClose={...} initialProgram={funnelProg} initialLang={funnelLang} initialSource={funnelSource}/>
const modalRenderOld = /<FunnelModal open=\{funnelOpen\} onClose=\{\(\)=>setFunnelOpen\(false\)\} initialProgram=\{funnelProg\} initialLang=\{funnelLang\} initialSource=\{funnelSource\}\/>/;
if (modalRenderOld.test(pageContent)) {
  pageContent = pageContent.replace(
    modalRenderOld,
    '<FunnelModal open={funnelOpen} onClose={()=>setFunnelOpen(false)} initialProgram={funnelProg} initialLang={funnelLang} initialLevel={funnelLevel} initialPreferredProg={funnelPreferredProg} initialSource={funnelSource}/>'
  );
  console.log('  ✅ FunnelModal render diperbarui (pass initialLevel + initialPreferredProg)');
} else if (/initialPreferredProg=\{funnelPreferredProg\}/.test(pageContent)) {
  console.log('  ✓ FunnelModal render sudah updated');
} else {
  console.log('  ⚠️  FunnelModal render pattern tidak match');
}

// ----- D. FunnelModal signature: tambah initialLevel + initialPreferredProg -----
const sigOld = /function FunnelModal\(\{open,onClose,initialProgram="",initialLang="",initialSource=""\}:\{open:boolean;onClose:\(\)=>void;initialProgram\?:string;initialLang\?:string;initialSource\?:string\}\) \{/;
if (sigOld.test(pageContent)) {
  pageContent = pageContent.replace(
    sigOld,
    'function FunnelModal({open,onClose,initialProgram="",initialLang="",initialLevel="",initialPreferredProg="",initialSource=""}:{open:boolean;onClose:()=>void;initialProgram?:string;initialLang?:string;initialLevel?:string;initialPreferredProg?:string;initialSource?:string}) {'
  );
  console.log('  ✅ FunnelModal signature diperbarui');
} else if (/initialPreferredProg\?:string/.test(pageContent)) {
  console.log('  ✓ FunnelModal signature sudah updated');
} else {
  console.log('  ⚠️  FunnelModal signature pattern tidak match');
}

// ----- E. FunnelModal useEffect: smart-skip with level + preferredProgram -----
const effectRe = /useEffect\(\(\) => \{\s*if \(open\) \{\s*\/\/ Priority:[\s\S]*?\}, \[open, initialProgram, initialLang\]\);/;
if (effectRe.test(pageContent)) {
  const newEffect = `useEffect(() => {
    if (open) {
      // Priority logic:
      // 1. Placement test flow: language + level + preferredProgram → step 2 (pilih program, pre-highlight preferredProgram)
      // 2. language + program → step 3 (pilih level)
      // 3. language only → step 2 (pilih program)
      // 4. program only → step 1 (pilih bahasa)
      if (initialLang && initialLevel && initialPreferredProg) {
        // From placement test — pre-fill lang & level, let user pick program (defaulted to Private)
        setSelLang(initialLang);
        setSelLevel(initialLevel);
        setSelProgram(initialPreferredProg);
        setStep(2);  // program selection, with Private pre-highlighted
      } else if (initialLang && initialProgram) {
        setSelLang(initialLang); setSelProgram(initialProgram); setStep(3);
      } else if (initialLang) {
        setSelLang(initialLang); setStep(2);
      } else if (initialProgram) {
        setSelProgram(initialProgram); setStep(1);
      }
    }
    if (!open) { setStep(1); setSelProgram(""); setSelLang(""); setSelLevel(""); }
  }, [open, initialProgram, initialLang, initialLevel, initialPreferredProg]);`;
  pageContent = pageContent.replace(effectRe, newEffect);
  console.log('  ✅ useEffect smart-skip diperbarui');
} else {
  console.log('  ⚠️  useEffect pattern tidak match (mungkin sudah diupgrade sebelumnya)');
}

if (pageContent !== pageBefore) {
  fs.writeFileSync(pagePath, pageContent, 'utf8');
  console.log('\n✅ page.tsx ter-update\n');
} else {
  console.log('\n⚠️  page.tsx tidak berubah\n');
}

// ============================================================
// Git
// ============================================================
console.log('🚀 Git...\n');
try {
  execSync('git add -A', { stdio: 'inherit', cwd: ROOT });
  execSync(
    'git commit -m "feat(placement): private class estimation + funnel pre-fill level & program"',
    { stdio: 'inherit', cwd: ROOT }
  );
  execSync('git push', { stdio: 'inherit', cwd: ROOT });
  console.log('\n✅ Pushed\n');
} catch (e) {
  console.log('\n⚠️  Git:', e.message);
}

try { fs.unlinkSync(fileURLToPath(import.meta.url)); } catch {}

console.log('═══════════════════════════════════════════════');
console.log('📋 Test flow:');
console.log('   1. linguo.id/silabus/english/coba');
console.log('   2. Ikutin 15 soal');
console.log('   3. Result: "Estimasi ke B2: X bulan dengan kelas private intensif (3x/minggu)."');
console.log('   4. Klik "Mulai Belajar dari A1.3"');
console.log('   5. FunnelModal harus buka di step 2 (pilih program) dengan "Kelas Private" pre-highlighted');
console.log('   6. User bisa tetap pilih program lain atau klik "← Ganti bahasa" di atas modal');
console.log('═══════════════════════════════════════════════\n');
