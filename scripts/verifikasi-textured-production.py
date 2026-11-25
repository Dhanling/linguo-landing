# Audit semua level Jepang, Korea, Islandia dan cocokkan aset produksi dengan lokal.
import json,pathlib,urllib.request,concurrent.futures,hashlib,sys
root=pathlib.Path(__file__).resolve().parent.parent
admin=pathlib.Path(sys.argv[1]);langs={'japanese','korean','icelandic'}
catalog=json.loads((root/'reports/audit-svg-production-20261124.json').read_text())
keys=[d['key'] for d in catalog['decks'] if d['key'].split('-')[0] in langs]
assert len(keys)==57, f'Katalog tidak lengkap: {len(keys)}'
def read(url):
 with urllib.request.urlopen(url,timeout=90) as r:return r.read()
def deck(k):
 d=json.loads(read('https://teach.linguo.id/dek-siswa/'+k+'.json?audit=textured-final-20261125'))
 svg=[(n,i+1,s['cover']) for n,ss in d.items() for i,s in enumerate(ss) if '.svg' in s.get('cover','')]
 return {'key':k,'sessions':len(d),'svg':svg}
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:decks=list(ex.map(deck,keys))
assert not any(d['svg'] for d in decks),'Masih ada SVG produksi'
assets=[p for folder in ['next-priority-textured-v2'] for p in (root/'public/slide-cover'/folder).glob('*.webp')]
def asset(job):
 domain,p=job;url=domain+'/'+str(p.relative_to(root/'public'))
 assert hashlib.sha256(read(url)).digest()==hashlib.sha256(p.read_bytes()).digest(),url
 return url
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:checked=list(ex.map(asset,[(d,p) for d in ['https://teach.linguo.id','https://linguo.id'] for p in assets]))
report={'date':'2026-11-25','decks':decks,'svgRemaining':0,'assetsPerDomain':len(assets),'assetUrlsVerified':len(checked),'passed':True}
(root/'reports/textured-production-20261125.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print({'decks':len(decks),'sessions':sum(d['sessions'] for d in decks),'svg':0,'assetUrls':len(checked),'passed':True})
