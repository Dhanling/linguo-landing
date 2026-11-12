const fs = require('node:fs');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = process.argv[2] || process.cwd();
const ready = JSON.parse(fs.readFileSync(`${root}/src/data/a1CuteCoverReady.json`, 'utf8'));
const code = ts.transpileModule(fs.readFileSync(`${root}/src/lib/a1CuteCover.ts`, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS }}).outputText;
const out = {};
new Function('require', 'exports', code)(() => ({default: ready}), out);
const replace = out.a1CuteCover;
for (const [key,path] of Object.entries(ready)) {
 assert(fs.existsSync(`${root}/public${path}`), path);
 const legacy = `/slide-cover/${key}-cover-cute-vector-v1.svg`;
 assert.equal(replace(legacy), path);
 assert.equal(replace(legacy, false), legacy);
 const lang = key.split('-a1-')[0];
 for (const level of ['a2','b1','b2']) for(let session=1;session<=16;session++) {
  const result=replace(`/slide-cover/${lang}-${level}-1-sesi-${session}-cover-cute-vector-v1.svg`);
  assert(result.includes(`/${lang}-a1-`), result);
  assert(fs.existsSync(`${root}/public${result}`), result);
 }
}
for(const path of ['/slide-cover/custom.jpg','/slide-cover/custom.svg','https://example.com/cover.png','/slide-cover/arabic-a1-2-sesi-1-tujuan-cute-vector-v1.svg']) assert.equal(replace(path),path);
console.log(`${Object.keys(ready).length} cover tersedia; fallback A2–B2, pemisahan bahasa, dan perlindungan slide isi lulus.`);
