// Validasi dek produksi lama melalui normalizer dan pengolah dek terbaru.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const esbuild=require('esbuild'),sharp=require('sharp');
const admin=process.argv[2],landing=process.argv[3],input=process.argv[4];
(async()=>{
 const reports=[];
 for(const [name,root] of [['admin',admin],['landing',landing]]){
  const bundle='/private/tmp/textured-'+name+'.cjs';
  esbuild.buildSync({stdin:{contents:`export {a1CuteCover} from '${root}/src/lib/a1CuteCover'; export {normalizeSlide} from '${root}/src/lib/materiSlides'; ${name==='admin'?`export {rapikanDek} from '${root}/src/lib/dekSilabus';`:''}`,resolveDir:root},outfile:bundle,bundle:true,platform:'node',format:'cjs',alias:{'@':root},logLevel:'warning'});
  const lib=require(bundle);
  console.log(name,'exports',Object.keys(lib));
  let sessions=0,replaced=0; const assets=new Set();
  for(const f of fs.readdirSync(input).filter(f=>f.endsWith('.json'))){
   const raw=JSON.parse(fs.readFileSync(path.join(input,f))); const key=f.slice(0,-5); const m=/^(.+)-(a[12])-([1-4])$/.exec(key);
   const result=name==='admin'?lib.rapikanDek(m[1],m[2].toUpperCase()+'.'+m[3],raw):raw;
   for(const [n,slides]of Object.entries(raw)){
    sessions++;
    for(const [i,s]of slides.entries()){
     const cover=lib.a1CuteCover(s.cover,s.type==='title');
     assert.ok(!cover?.endsWith('.svg'),`${name} ${key} ${n} ${i}: ${cover}`);
     if(cover!==s.cover){ assert.equal(lib.normalizeSlide({...s,cover})?.cover,cover); assert.equal(lib.normalizeSlide(s)?.cover,cover);replaced++;assets.add(cover);assert.ok(fs.existsSync(root+'/public'+cover),cover)}
    }
    if(name==='admin'){
     assert.ok(result[n]);
     assert.equal(result[n][0].heading,slides[0].heading);
     assert.equal(result[n][1].heading,slides[1].heading);
     assert.deepEqual(result[n][1].points,slides[1].points);
     for(const s of result[n]) assert.ok(!s.cover?.endsWith('.svg'),`${key} still SVG ${s.cover}`);
     for(const s of slides.filter(s=>s.visual))assert.ok(result[n].some(t=>t.heading===s.heading && t.visual?.kind===s.visual.kind));
    }
   }
  }
  for(const cover of assets){const meta=await sharp(root+'/public'+cover).metadata();assert.equal(meta.format,'webp');assert.ok(Math.abs(meta.width/meta.height-16/9)<0.02)}
  for(const s of ['/slide-cover/custom.svg','/slide-cover/danish-custom.jpg','/slide-cover/swedish-a1-2-sesi-1-tujuan-cute-vector-v1.svg'])assert.equal(lib.a1CuteCover(s,false),s);
  reports.push({name,sessions,replaced,assets:assets.size,passed:true});
 }
 fs.writeFileSync('reports/textured-artwork-verification-20261125.json',JSON.stringify(reports,null,2));console.log(reports);
})().catch(e=>{console.error(e);process.exit(1)});
