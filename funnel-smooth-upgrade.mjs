#!/usr/bin/env node
// Upgrade window.__openFunnel untuk terima {language, source}
// + FunnelModal auto-skip ke step 2 kalau language di-preset
// + /api/save-lead terima source
// Run from ~/linguo-landing

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
if (!fs.existsSync(path.join(ROOT, 'src/app/page.tsx'))) {
  console.error('❌ Run dari ~/linguo-landing');
  process.exit(1);
}

const pagePath = path.join(ROOT, 'src/app/page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');
const original = content;
const changes = [];

// ============================================================
// 1. Upgrade FunnelModal signature: tambah initialLang + sourceProp
// ============================================================
console.log('🔧 [1/4] FunnelModal signature...\n');

// Old: function FunnelModal({open,onClose,initialProgram=""}:{open:boolean;onClose:()=>void;initialProgram?:string}) {
const sigOld = /function FunnelModal\(\{open,onClose,initialProgram=""\}:\{open:boolean;onClose:\(\)=>void;initialProgram\?:string\}\) \{/;
if (sigOld.test(content)) {
  content = content.replace(
    sigOld,
    'function FunnelModal({open,onClose,initialProgram="",initialLang="",initialSource=""}:{open:boolean;onClose:()=>void;initialProgram?:string;initialLang?:string;initialSource?:string}) {'
  );
  changes.push('FunnelModal: added initialLang + initialSource props');
} else {
  console.log('  ⚠️  Signature tidak match — mungkin sudah di-update. Lanjut.');
}

// ============================================================
// 2. useEffect: kalau initialLang ada, auto setSelLang + setStep(2)
// ============================================================
console.log('🔧 [2/4] FunnelModal useEffect auto-skip...\n');

// Old: useEffect(() => { if (open && initialProgram) { setSelProgram(initialProgram); setStep(1); } if (!open) { setStep(1); setSelProgram(""); } }, [open, initialProgram]);
const effectOld = /useEffect\(\(\) => \{ if \(open && initialProgram\) \{ setSelProgram\(initialProgram\); setStep\(1\); \} if \(!open\) \{ setStep\(1\); setSelProgram\(""\); \} \}, \[open, initialProgram\]\);/;
if (effectOld.test(content)) {
  content = content.replace(
    effectOld,
    `useEffect(() => {
    if (open) {
      // Priority: initialLang + initialProgram → skip to step 3 (pilih level)
      // initialLang only → skip to step 2 (pilih program)
      // initialProgram only → stay at step 1 (pilih bahasa)
      if (initialLang && initialProgram) {
        setSelLang(initialLang); setSelProgram(initialProgram); setStep(3);
      } else if (initialLang) {
        setSelLang(initialLang); setStep(2);
      } else if (initialProgram) {
        setSelProgram(initialProgram); setStep(1);
      }
    }
    if (!open) { setStep(1); setSelProgram(""); setSelLang(""); }
  }, [open, initialProgram, initialLang]);`
  );
  changes.push('FunnelModal: useEffect smart-skip based on initialLang/initialProgram');
} else {
  console.log('  ⚠️  useEffect pattern tidak match. Lanjut.');
}

// ============================================================
// 3. Upgrade window.__openFunnel bridge: terima string | object
// ============================================================
console.log('🔧 [3/4] window.__openFunnel bridge...\n');

// Old: if(typeof window!=="undefined")(window as any).__openFunnel=(prog:string)=>{setFunnelProg(prog);setFunnelOpen(true)};
const bridgeOld = /if\(typeof window!=="undefined"\)\(window as any\)\.__openFunnel=\(prog:string\)=>\{setFunnelProg\(prog\);setFunnelOpen\(true\)\};/;
if (bridgeOld.test(content)) {
  content = content.replace(
    bridgeOld,
    `if(typeof window!=="undefined")(window as any).__openFunnel=(input:string|{language?:string;program?:string;source?:string})=>{
      if(typeof input==="string"){setFunnelProg(input);setFunnelLang("");setFunnelSource("");}
      else{setFunnelProg(input.program||"");setFunnelLang(input.language||"");setFunnelSource(input.source||"");}
      setFunnelOpen(true);
    };`
  );
  changes.push('window.__openFunnel: now accepts string | {language, program, source}');
} else {
  console.log('  ⚠️  Bridge pattern tidak match. Lanjut.');
}

// ============================================================
// 4. Tambah state setFunnelLang + setFunnelSource & pass ke FunnelModal
// ============================================================
console.log('🔧 [4/4] State + FunnelModal props wiring...\n');

// Find existing setFunnelProg state declaration
const stateOld = /const \[funnelProg,\s*setFunnelProg\]\s*=\s*useState\(""\);/;
if (stateOld.test(content)) {
  content = content.replace(
    stateOld,
    `const [funnelProg, setFunnelProg] = useState("");
  const [funnelLang, setFunnelLang] = useState("");
  const [funnelSource, setFunnelSource] = useState("");`
  );
  changes.push('Added funnelLang + funnelSource states');
} else {
  console.log('  ⚠️  funnelProg state tidak ditemukan — mungkin pattern beda.');
  // Fallback: cari "const [funnelOpen" dan insert sebelumnya
  const openStateOld = /(const \[funnelOpen,\s*setFunnelOpen\]\s*=\s*useState\(false\);)/;
  if (openStateOld.test(content) && !/const \[funnelLang,\s*setFunnelLang\]/.test(content)) {
    content = content.replace(
      openStateOld,
      `const [funnelLang, setFunnelLang] = useState("");
  const [funnelSource, setFunnelSource] = useState("");
  $1`
    );
    changes.push('Added funnelLang + funnelSource states (fallback path)');
  }
}

// Update FunnelModal render to pass initialLang + initialSource
// Old: <FunnelModal open={funnelOpen} onClose={()=>setFunnelOpen(false)} initialProgram={funnelProg}/>
const modalRenderOld = /<FunnelModal open=\{funnelOpen\} onClose=\{\(\)=>setFunnelOpen\(false\)\} initialProgram=\{funnelProg\}\/>/;
if (modalRenderOld.test(content)) {
  content = content.replace(
    modalRenderOld,
    '<FunnelModal open={funnelOpen} onClose={()=>setFunnelOpen(false)} initialProgram={funnelProg} initialLang={funnelLang} initialSource={funnelSource}/>'
  );
  changes.push('FunnelModal render: passed initialLang + initialSource');
} else {
  console.log('  ⚠️  FunnelModal render pattern tidak match.');
}

// ============================================================
// Write
// ============================================================
if (content === original) {
  console.log('\n❌ Tidak ada perubahan. Aborting.\n');
  process.exit(1);
}

fs.writeFileSync(pagePath, content, 'utf8');
console.log('\n✅ Changes applied:');
changes.forEach((c) => console.log('   • ' + c));

// ============================================================
// 5. Patch /api/save-lead/route.ts — terima source
// ============================================================
console.log('\n🔧 [5/5] API /api/save-lead...\n');

const apiPath = path.join(ROOT, 'src/app/api/save-lead/route.ts');
if (fs.existsSync(apiPath)) {
  let api = fs.readFileSync(apiPath, 'utf8');
  const apiBefore = api;

  // Find destructure line: const { name, email, wa, ... } = body;
  // Heuristic: cari "await request.json()" atau "await req.json()"
  if (/source/.test(api)) {
    console.log('  ✓ API sudah terima source, skip');
  } else {
    // Try to inject source into destructure and insert payload
    const destructurePat = /(const\s*\{\s*[^}]+)(\}\s*=\s*(?:await\s+)?(?:request|req)\.json\(\);)/;
    const m = api.match(destructurePat);
    if (m) {
      const before = m[1];
      const rest = m[2];
      if (!before.includes('source')) {
        api = api.replace(destructurePat, `${before}, source${rest}`);
      }
      // Try to inject source into insert/upsert payload
      // Find obj like: { name, email, wa, ... } inside insert({...}) or .insert([{...}])
      api = api.replace(
        /(\.insert\(\s*\[?\s*\{\s*)([^}]+?)(\s*\}\s*\]?\s*\))/,
        (full, open, fields, close) => {
          if (fields.includes('source')) return full;
          return `${open}${fields.trimEnd()}, source: source || null${close}`;
        }
      );
      if (api !== apiBefore) {
        fs.writeFileSync(apiPath, api, 'utf8');
        console.log('  ✅ Patched /api/save-lead/route.ts');
        changes.push('API save-lead: accepts source field');
      } else {
        console.log('  ⚠️  API patch tidak berubah — structure berbeda. Share ke Claude.');
      }
    } else {
      console.log('  ⚠️  Destructure pattern tidak ditemukan. Share file ke Claude.');
    }
  }
} else {
  console.log('  ⚠️  /api/save-lead/route.ts tidak ada — skip API patch');
}

// ============================================================
// Write SQL migration to /tmp
// ============================================================
const sqlPath = '/tmp/silabus-source-migration.sql';
fs.writeFileSync(sqlPath, `-- Add source column to leads table (for tracking lead origin)
-- Run ini di Supabase SQL Editor

ALTER TABLE leads ADD COLUMN IF NOT EXISTS source TEXT;

-- Index untuk query analytics (berapa lead dari silabus vs homepage)
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);

-- Sample query untuk cek source distribution:
-- SELECT source, COUNT(*) AS total FROM leads GROUP BY source ORDER BY total DESC;
`, 'utf8');
console.log(`\n📄 SQL migration disimpan di: ${sqlPath}`);
console.log('   Copy-paste ke Supabase SQL Editor → Run sekali saja');

// ============================================================
// Git
// ============================================================
console.log('\n🚀 Git...\n');
try {
  execSync('git add -A', { stdio: 'inherit', cwd: ROOT });
  execSync(
    'git commit -m "feat(funnel): accept {language, program, source} via window.__openFunnel"',
    { stdio: 'inherit', cwd: ROOT }
  );
  execSync('git push', { stdio: 'inherit', cwd: ROOT });
  console.log('\n✅ Pushed\n');
} catch (e) {
  console.log('\n⚠️  Git:', e.message);
}

try { fs.unlinkSync(fileURLToPath(import.meta.url)); } catch {}

console.log('═══════════════════════════════════════════════');
console.log('📋 NEXT STEP:');
console.log('   1. Buka Supabase SQL Editor');
console.log(`   2. Copy-paste isi ${sqlPath}`);
console.log('   3. Run');
console.log('   4. Test: buka linguo.id/silabus/english → klik "Mulai Belajar"');
console.log('      → harusnya langsung masuk step "Pilih Program" (bukan bahasa)');
console.log('═══════════════════════════════════════════════\n');
