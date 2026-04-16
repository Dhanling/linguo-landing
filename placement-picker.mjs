#!/usr/bin/env node
// Build: Placement Test language picker modal
// - Create PlacementPicker component
// - Patch page.tsx: navbar buttons open picker instead of direct link
// Run: cd ~/linguo-landing && node placement-picker.mjs

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const pagePath = path.join(ROOT, 'src/app/page.tsx');

if (!fs.existsSync(pagePath)) {
  console.error('❌ Run dari ~/linguo-landing');
  process.exit(1);
}

const changes = [];

// ============================================================
// 1. Create PlacementPicker component
// ============================================================
console.log('📝 [1/2] Create PlacementPicker component...\n');

const pickerDir = path.join(ROOT, 'src/components');
fs.mkdirSync(pickerDir, { recursive: true });

const pickerCode = [
  '"use client";',
  '',
  'import { motion, AnimatePresence } from "framer-motion";',
  '',
  'const LANGUAGES = [',
  '  { slug: "english", name: "Inggris", native: "English", flag: "\\ud83c\\uddec\\ud83c\\udde7", available: true },',
  '  { slug: "japanese", name: "Jepang", native: "\\u65e5\\u672c\\u8a9e", flag: "\\ud83c\\uddef\\ud83c\\uddf5", available: false },',
  '  { slug: "korean", name: "Korea", native: "\\ud55c\\uad6d\\uc5b4", flag: "\\ud83c\\uddf0\\ud83c\\uddf7", available: false },',
  '  { slug: "mandarin", name: "Mandarin", native: "\\u4e2d\\u6587", flag: "\\ud83c\\udde8\\ud83c\\uddf3", available: false },',
  '  { slug: "spanish", name: "Spanyol", native: "Espa\\u00f1ol", flag: "\\ud83c\\uddea\\ud83c\\uddf8", available: false },',
  '  { slug: "french", name: "Prancis", native: "Fran\\u00e7ais", flag: "\\ud83c\\uddeb\\ud83c\\uddf7", available: false },',
  '  { slug: "arabic", name: "Arab", native: "\\u0627\\u0644\\u0639\\u0631\\u0628\\u064a\\u0629", flag: "\\ud83c\\uddf8\\ud83c\\udde6", available: false },',
  '  { slug: "german", name: "Jerman", native: "Deutsch", flag: "\\ud83c\\udde9\\ud83c\\uddea", available: false },',
  '  { slug: "bipa", name: "BIPA", native: "Bahasa Indonesia", flag: "\\ud83c\\uddee\\ud83c\\udde9", available: false },',
  '];',
  '',
  'interface Props {',
  '  open: boolean;',
  '  onClose: () => void;',
  '}',
  '',
  'export default function PlacementPicker({ open, onClose }: Props) {',
  '  return (',
  '    <AnimatePresence>',
  '      {open && (',
  '        <>',
  '          <motion.div',
  '            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}',
  '            onClick={onClose}',
  '            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"',
  '          />',
  '          <motion.div',
  '            initial={{ opacity: 0, scale: 0.95, y: 20 }}',
  '            animate={{ opacity: 1, scale: 1, y: 0 }}',
  '            exit={{ opacity: 0, scale: 0.95, y: 20 }}',
  '            transition={{ type: "spring", damping: 25, stiffness: 300 }}',
  '            className="fixed z-[60] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"',
  '          >',
  '            {/* Header */}',
  '            <div className="px-6 pt-6 pb-4 flex items-center justify-between">',
  '              <div>',
  '                <div className="flex items-center gap-2 mb-1">',
  '                  <span className="text-2xl">\\ud83c\\udfaf</span>',
  '                  <h2 className="text-xl font-bold text-gray-900">Placement Test</h2>',
  '                </div>',
  '                <p className="text-sm text-gray-500">Pilih bahasa untuk tes level kamu</p>',
  '              </div>',
  '              <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500">',
  '                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>',
  '              </button>',
  '            </div>',
  '',
  '            {/* Language list */}',
  '            <div className="px-6 pb-6 space-y-2">',
  '              {LANGUAGES.map((lang) => {',
  '                if (lang.available) {',
  '                  return (',
  '                    <a',
  '                      key={lang.slug}',
  '                      href={"/silabus/" + lang.slug + "/coba"}',
  '                      className="flex items-center gap-3 p-3.5 rounded-2xl border-2 border-[#1A9E9E] bg-[#1A9E9E]/5 hover:bg-[#1A9E9E]/10 transition-colors group"',
  '                    >',
  '                      <span className="text-3xl">{lang.flag}</span>',
  '                      <div className="flex-1">',
  '                        <div className="font-bold text-gray-900">Bahasa {lang.name}</div>',
  '                        <div className="text-xs text-gray-500">{lang.native}</div>',
  '                      </div>',
  '                      <span className="text-xs font-semibold text-white bg-[#1A9E9E] px-3 py-1.5 rounded-full group-hover:bg-[#147a7a] transition-colors">Mulai Test</span>',
  '                    </a>',
  '                  );',
  '                }',
  '                return (',
  '                  <a',
  '                    key={lang.slug}',
  '                    href={"https://wa.me/6282116859493?text=Halo%20Linguo%2C%20saya%20mau%20placement%20test%20Bahasa%20" + encodeURIComponent(lang.name)}',
  '                    target="_blank"',
  '                    rel="noopener"',
  '                    className="flex items-center gap-3 p-3.5 rounded-2xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors"',
  '                  >',
  '                    <span className="text-3xl opacity-70">{lang.flag}</span>',
  '                    <div className="flex-1">',
  '                      <div className="font-semibold text-gray-700">Bahasa {lang.name}</div>',
  '                      <div className="text-xs text-gray-400">{lang.native}</div>',
  '                    </div>',
  '                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full uppercase tracking-wider">Segera</span>',
  '                  </a>',
  '                );',
  '              })}',
  '            </div>',
  '',
  '            {/* Footer */}',
  '            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">',
  '              <p className="text-xs text-gray-500 text-center">',
  '                Bahasa lain?{" "}',
  '                <a href="https://wa.me/6282116859493?text=Halo%20Linguo%2C%20saya%20mau%20placement%20test" target="_blank" rel="noopener" className="text-[#1A9E9E] font-semibold hover:underline">Hubungi kami via WhatsApp</a>',
  '              </p>',
  '            </div>',
  '          </motion.div>',
  '        </>',
  '      )}',
  '    </AnimatePresence>',
  '  );',
  '}',
].join('\n');

fs.writeFileSync(path.join(pickerDir, 'PlacementPicker.tsx'), pickerCode, 'utf8');
console.log('  ✅ src/components/PlacementPicker.tsx created\n');
changes.push('PlacementPicker.tsx component created');

// ============================================================
// 2. Patch page.tsx
// ============================================================
console.log('📝 [2/2] Patch page.tsx...\n');

let page = fs.readFileSync(pagePath, 'utf8');
const pageBefore = page;

// --- A. Add import ---
if (!page.includes('PlacementPicker')) {
  // Insert after last import line
  const lastImportIdx = page.lastIndexOf('import ');
  const lineEnd = page.indexOf('\n', lastImportIdx);
  if (lineEnd !== -1) {
    page = page.slice(0, lineEnd + 1) + 'import PlacementPicker from "@/components/PlacementPicker";\n' + page.slice(lineEnd + 1);
    changes.push('Import PlacementPicker added');
  }
}

// --- B. Add state ---
if (!page.includes('placementPickerOpen')) {
  // Insert after funnelOpen state
  const anchor = 'const [funnelOpen, setFunnelOpen] = useState(false);';
  const anchorIdx = page.indexOf(anchor);
  if (anchorIdx !== -1) {
    const insertAt = anchorIdx + anchor.length;
    page = page.slice(0, insertAt) + '\n  const [placementPickerOpen, setPlacementPickerOpen] = useState(false);' + page.slice(insertAt);
    changes.push('State placementPickerOpen added');
  } else {
    console.log('  ⚠️  funnelOpen state anchor tidak match');
  }
}

// --- C. Desktop navbar: <a> → <button> onClick open picker ---
const desktopOld = '<a href="/silabus/english/coba" className="bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold px-6 py-2.5 rounded-full text-sm transition-all active:scale-95">Placement Test</a>';
const desktopNew = '<button onClick={()=>setPlacementPickerOpen(true)} className="bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold px-6 py-2.5 rounded-full text-sm transition-all active:scale-95">Placement Test</button>';

if (page.includes(desktopOld)) {
  page = page.replace(desktopOld, desktopNew);
  changes.push('Desktop navbar: Placement Test → opens picker modal');
} else {
  console.log('  ⚠️  Desktop <a> pattern tidak match');
}

// --- D. Mobile drawer: <a> → <button> onClick open picker ---
const mobileOld = '<a href="/silabus/english/coba" onClick={()=>setOpen(false)} className="mt-2 bg-[#1A9E9E] text-white text-center py-3 rounded-full font-semibold text-sm w-full block">Placement Test</a>';
const mobileNew = '<button onClick={()=>{setPlacementPickerOpen(true);setOpen(false)}} className="mt-2 bg-[#1A9E9E] text-white text-center py-3 rounded-full font-semibold text-sm w-full">Placement Test</button>';

if (page.includes(mobileOld)) {
  page = page.replace(mobileOld, mobileNew);
  changes.push('Mobile drawer: Placement Test → opens picker modal');
} else {
  console.log('  ⚠️  Mobile <a> pattern tidak match');
}

// --- E. Render PlacementPicker near FunnelModal ---
const funnelRender = '<FunnelModal open={funnelOpen}';
const funnelIdx = page.indexOf(funnelRender);
if (funnelIdx !== -1 && !page.includes('<PlacementPicker')) {
  page = page.slice(0, funnelIdx) + '<PlacementPicker open={placementPickerOpen} onClose={()=>setPlacementPickerOpen(false)} />\n            ' + page.slice(funnelIdx);
  changes.push('PlacementPicker rendered before FunnelModal');
} else if (page.includes('<PlacementPicker')) {
  console.log('  ✓ PlacementPicker sudah rendered');
} else {
  console.log('  ⚠️  FunnelModal render anchor tidak ditemukan');
}

// --- Write ---
if (page !== pageBefore) {
  fs.writeFileSync(pagePath, page, 'utf8');
  console.log('\n  ✅ page.tsx updated');
} else {
  console.log('\n  ⚠️  page.tsx tidak berubah');
}

// ============================================================
// Summary + Git
// ============================================================
console.log('\n═══════════════════════════════════════════════');
console.log('📋 Changes:');
changes.forEach((c) => console.log('   • ' + c));
console.log('═══════════════════════════════════════════════\n');

if (changes.length === 0) {
  console.log('⚠️  Tidak ada perubahan.\n');
  try { fs.unlinkSync(fileURLToPath(import.meta.url)); } catch {}
  process.exit(1);
}

console.log('🚀 Git commit + push...\n');
try {
  execSync('git add -A', { stdio: 'inherit', cwd: ROOT });
  execSync('git commit -m "feat(nav): placement test language picker modal"', { stdio: 'inherit', cwd: ROOT });
  execSync('git push', { stdio: 'inherit', cwd: ROOT });
  console.log('\n✅ Pushed\n');
} catch (e) {
  console.log('\n⚠️  Git error:', e.message);
  console.log('Manual: cd ~/linguo-landing && git add -A && git commit -m "feat: placement picker" && git push');
}

try { fs.unlinkSync(fileURLToPath(import.meta.url)); } catch {}

console.log('═══════════════════════════════════════════════');
console.log('📋 TEST:');
console.log('   1. linguo.id → klik "Placement Test" di navbar');
console.log('   2. Modal muncul: 9 bahasa, English hijau "Mulai Test"');
console.log('   3. Klik English → masuk /silabus/english/coba');
console.log('   4. Klik bahasa lain → WA waitlist');
console.log('   5. Test juga di mobile (hamburger menu)');
console.log('═══════════════════════════════════════════════\n');
