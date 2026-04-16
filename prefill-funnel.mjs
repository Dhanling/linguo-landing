#!/usr/bin/env node
// Prefill name + WA dari placement soft-gate ke FunnelModal
// PlacementTest: handleStartLearning kirim prefillName + prefillWa
// page.tsx: __openFunnel terima prefillName/prefillWa, FunnelModal auto-fill formName/formWa
// Run: cd ~/linguo-landing && node prefill-funnel.mjs

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
if (!fs.existsSync(path.join(ROOT, 'src/app/page.tsx'))) {
  console.error('❌ Run dari ~/linguo-landing');
  process.exit(1);
}

const changes = [];

// ============================================================
// 1. Patch PlacementTest.tsx — pass prefillName + prefillWa
// ============================================================
console.log('🔧 [1/2] Patch PlacementTest.tsx\n');

const ptPath = path.join(ROOT, 'src/app/silabus/[lang]/coba/PlacementTest.tsx');
if (!fs.existsSync(ptPath)) {
  console.error('❌ PlacementTest.tsx tidak ada');
  process.exit(1);
}

let pt = fs.readFileSync(ptPath, 'utf8');
const ptBefore = pt;

// Upgrade handleStartLearning — include prefillName + prefillWa dari state
// Cari pattern handleStartLearning dan upgrade
const oldHandler = `const handleStartLearning = () => {
    const w = window as any;
    const langFull = "Bahasa " + meta.name;
    const sourceTag = "placement-test-" + meta.slug;
    if (typeof w.__openFunnel === "function") {
      try {
        w.__openFunnel({
          language: langFull, level: result.sublevel,
          preferredProgram: "Kelas Private", source: sourceTag,
        });
      } catch { w.__openFunnel(langFull); }
    } else {
      window.location.href = "/?lang=" + encodeURIComponent(langFull) + "&from=" + sourceTag + "&level=" + result.sublevel;
    }
  };`;

const newHandler = `const handleStartLearning = () => {
    const w = window as any;
    const langFull = "Bahasa " + meta.name;
    const sourceTag = "placement-test-" + meta.slug;
    // Get prefill data from localStorage (set by soft-gate submit)
    let prefillName = "";
    let prefillWa = "";
    try {
      const stored = localStorage.getItem("linguo_prefill");
      if (stored) {
        const data = JSON.parse(stored);
        prefillName = data.name || "";
        prefillWa = data.whatsapp || "";
      }
    } catch {}
    if (typeof w.__openFunnel === "function") {
      try {
        w.__openFunnel({
          language: langFull, level: result.sublevel,
          preferredProgram: "Kelas Private", source: sourceTag,
          prefillName, prefillWa,
        });
      } catch { w.__openFunnel(langFull); }
    } else {
      window.location.href = "/?lang=" + encodeURIComponent(langFull) + "&from=" + sourceTag + "&level=" + result.sublevel;
    }
  };`;

if (pt.includes(oldHandler)) {
  pt = pt.replace(oldHandler, newHandler);
  changes.push('PlacementTest: handleStartLearning pakai localStorage prefill');
} else {
  console.log('  ⚠️  handleStartLearning pattern tidak match');
}

// Upgrade submitGate — setelah sukses simpan API, juga simpan ke localStorage
const oldGate = `setUnlocked(true);
      setShowGate(false);`;

const newGate = `// Simpan ke localStorage untuk prefill FunnelModal nanti
      try {
        localStorage.setItem("linguo_prefill", JSON.stringify({
          name: nameValue.trim(),
          whatsapp: wa,
        }));
      } catch {}
      setUnlocked(true);
      setShowGate(false);`;

if (pt.includes(oldGate)) {
  pt = pt.replace(oldGate, newGate);
  changes.push('PlacementTest: submitGate simpan ke localStorage');
} else {
  console.log('  ⚠️  submitGate pattern tidak match');
}

if (pt !== ptBefore) {
  fs.writeFileSync(ptPath, pt, 'utf8');
  console.log('  ✅ PlacementTest.tsx ter-update\n');
} else {
  console.log('  ⚠️  PlacementTest.tsx tidak berubah\n');
}

// ============================================================
// 2. Patch page.tsx — terima prefillName + prefillWa
// ============================================================
console.log('🔧 [2/2] Patch page.tsx\n');

const pagePath = path.join(ROOT, 'src/app/page.tsx');
let page = fs.readFileSync(pagePath, 'utf8');
const pageBefore = page;

// ----- A. Upgrade window.__openFunnel bridge -----
const bridgeRe = /\(window as any\)\.__openFunnel=\(input:[^)]+\)=>\{[\s\S]*?setFunnelOpen\(true\);\s*\};/;
const bridgeMatch = page.match(bridgeRe);
if (bridgeMatch) {
  const newBridge = `(window as any).__openFunnel=(input:string|{language?:string;program?:string;preferredProgram?:string;level?:string;source?:string;prefillName?:string;prefillWa?:string})=>{
      if(typeof input==="string"){setFunnelProg(input);setFunnelLang("");setFunnelLevel("");setFunnelPreferredProg("");setFunnelSource("");setFunnelPrefillName("");setFunnelPrefillWa("");}
      else{
        setFunnelProg(input.program||"");
        setFunnelLang(input.language||"");
        setFunnelLevel(input.level||"");
        setFunnelPreferredProg(input.preferredProgram||"");
        setFunnelSource(input.source||"");
        setFunnelPrefillName(input.prefillName||"");
        setFunnelPrefillWa(input.prefillWa||"");
      }
      setFunnelOpen(true);
    };`;
  page = page.replace(bridgeMatch[0], newBridge);
  changes.push('Bridge: terima prefillName + prefillWa');
} else {
  console.log('  ⚠️  Bridge pattern tidak match');
}

// ----- B. Tambah state funnelPrefillName + funnelPrefillWa -----
if (!/const \[funnelPrefillName,/.test(page)) {
  // Insert setelah funnelPreferredProg
  const anchorRe = /const \[funnelPreferredProg,\s*setFunnelPreferredProg\]\s*=\s*useState\(""\);/;
  if (anchorRe.test(page)) {
    page = page.replace(
      anchorRe,
      `const [funnelPreferredProg, setFunnelPreferredProg] = useState("");
  const [funnelPrefillName, setFunnelPrefillName] = useState("");
  const [funnelPrefillWa, setFunnelPrefillWa] = useState("");`
    );
    changes.push('States funnelPrefillName + funnelPrefillWa added');
  } else {
    console.log('  ⚠️  funnelPreferredProg anchor tidak match');
  }
}

// ----- C. FunnelModal render: pass initialName + initialWa -----
const modalRenderOld = /<FunnelModal open=\{funnelOpen\} onClose=\{\(\)=>setFunnelOpen\(false\)\} initialProgram=\{funnelProg\} initialLang=\{funnelLang\} initialLevel=\{funnelLevel\} initialPreferredProg=\{funnelPreferredProg\} initialSource=\{funnelSource\}\/>/;
if (modalRenderOld.test(page)) {
  page = page.replace(
    modalRenderOld,
    '<FunnelModal open={funnelOpen} onClose={()=>setFunnelOpen(false)} initialProgram={funnelProg} initialLang={funnelLang} initialLevel={funnelLevel} initialPreferredProg={funnelPreferredProg} initialSource={funnelSource} initialName={funnelPrefillName} initialWa={funnelPrefillWa}/>'
  );
  changes.push('FunnelModal render: pass initialName + initialWa');
} else {
  console.log('  ⚠️  FunnelModal render pattern tidak match');
}

// ----- D. FunnelModal signature -----
const sigOld = /function FunnelModal\(\{open,onClose,initialProgram="",initialLang="",initialLevel="",initialPreferredProg="",initialSource=""\}:\{open:boolean;onClose:\(\)=>void;initialProgram\?:string;initialLang\?:string;initialLevel\?:string;initialPreferredProg\?:string;initialSource\?:string\}\) \{/;
if (sigOld.test(page)) {
  page = page.replace(
    sigOld,
    'function FunnelModal({open,onClose,initialProgram="",initialLang="",initialLevel="",initialPreferredProg="",initialSource="",initialName="",initialWa=""}:{open:boolean;onClose:()=>void;initialProgram?:string;initialLang?:string;initialLevel?:string;initialPreferredProg?:string;initialSource?:string;initialName?:string;initialWa?:string}) {'
  );
  changes.push('FunnelModal signature: initialName + initialWa');
} else {
  console.log('  ⚠️  FunnelModal signature tidak match');
}

// ----- E. useEffect: kalau open + initialName/initialWa ada, auto-set formName/formWa -----
// Find useEffect block yang handle open state
const effectRe = /useEffect\(\(\) => \{\s*if \(open\) \{\s*\/\/ Priority logic:[\s\S]*?\}, \[open, initialProgram, initialLang, initialLevel, initialPreferredProg\]\);/;
if (effectRe.test(page)) {
  const newEffect = `useEffect(() => {
    if (open) {
      // Priority logic:
      // 1. Placement test flow: language + level + preferredProgram → step 2 (pilih program, pre-highlight preferredProgram)
      // 2. language + program → step 3 (pilih level)
      // 3. language only → step 2 (pilih program)
      // 4. program only → step 1 (pilih bahasa)
      if (initialLang && initialLevel && initialPreferredProg) {
        setSelLang(initialLang);
        setSelLevel(initialLevel);
        setSelProgram(initialPreferredProg);
        setStep(5); // Skip straight to data diri form (nama/email/WA already partially known)
      } else if (initialLang && initialProgram) {
        setSelLang(initialLang); setSelProgram(initialProgram); setStep(3);
      } else if (initialLang) {
        setSelLang(initialLang); setStep(2);
      } else if (initialProgram) {
        setSelProgram(initialProgram); setStep(1);
      }
      // Auto-fill form fields dari prefill (placement test flow)
      if (initialName) setFormName(initialName);
      if (initialWa) setFormWa(initialWa);
    }
    if (!open) { setStep(1); setSelProgram(""); setSelLang(""); setSelLevel(""); }
  }, [open, initialProgram, initialLang, initialLevel, initialPreferredProg, initialName, initialWa]);`;
  page = page.replace(effectRe, newEffect);
  changes.push('useEffect: auto-fill formName + formWa from prefill, go to step 5 if placement flow');
} else {
  console.log('  ⚠️  useEffect pattern tidak match');
}

if (page !== pageBefore) {
  fs.writeFileSync(pagePath, page, 'utf8');
  console.log('  ✅ page.tsx ter-update\n');
} else {
  console.log('  ⚠️  page.tsx tidak berubah\n');
}

// ============================================================
// Summary + Git
// ============================================================
console.log('═══════════════════════════════════════════════');
console.log('📋 Changes:');
changes.forEach((c) => console.log('   • ' + c));
console.log('═══════════════════════════════════════════════\n');

if (changes.length === 0) {
  console.log('⚠️  Tidak ada perubahan, abort git\n');
  try { fs.unlinkSync(fileURLToPath(import.meta.url)); } catch {}
  process.exit(1);
}

console.log('🚀 Git commit + push...\n');
try {
  execSync('git add -A', { stdio: 'inherit', cwd: ROOT });
  execSync('git commit -m "feat(placement): prefill name+WA to FunnelModal, skip to step 5"', { stdio: 'inherit', cwd: ROOT });
  execSync('git push', { stdio: 'inherit', cwd: ROOT });
  console.log('\n✅ Pushed\n');
} catch (e) {
  console.log('\n⚠️  Git error:', e.message);
  console.log('Manual: cd ~/linguo-landing && git add -A && git commit -m "feat: prefill funnel" && git push');
}

try { fs.unlinkSync(fileURLToPath(import.meta.url)); } catch {}

console.log('═══════════════════════════════════════════════');
console.log('📋 TEST FLOW:');
console.log('   1. Buka linguo.id/silabus/english/coba');
console.log('   2. Ikutin 15 soal');
console.log('   3. Di result: klik "Dapatkan Learning Plan Gratis"');
console.log('   4. Input nama + WA → submit');
console.log('   5. Klik "Langsung Daftar Kelas"');
console.log('   6. FunnelModal harus langsung di STEP 5 (data diri)');
console.log('      dengan nama + WA sudah terisi.');
console.log('      User tinggal tambah email → submit.');
console.log('═══════════════════════════════════════════════\n');
