# Ambil dek produksi sebagai pembanding sebelum dan sesudah deploy.
import json,urllib.request,concurrent.futures,pathlib,sys
langs=['danish','french','polish','bulgarian','hebrew','norwegian','romanian','arabic']
base=pathlib.Path(sys.argv[1]);base.mkdir(parents=True,exist_ok=True)
def get(k):
 with urllib.request.urlopen('https://teach.linguo.id/dek-siswa/'+k+'.json?audit=20261124',timeout=60) as r:d=json.load(r)
 (base/(k+'.json')).write_text(json.dumps(d,ensure_ascii=False))
 svg=[{'session':n,'slide':i+1,'cover':s['cover']} for n,ss in d.items() for i,s in enumerate(ss) if '.svg' in s.get('cover','')]
 return {'key':k,'sessions':len(d),'svg':svg}
keys=[f'{l}-{level}-{n}' for l in langs for level,count in [('a1',3),('a2',4)] for n in range(1,count+1)]
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:results=list(ex.map(get,keys))
pathlib.Path(sys.argv[2]).write_text(json.dumps(results,ensure_ascii=False,indent=2))
for l in langs: print(l, sum(len(d['svg']) for d in results if d['key'].startswith(l+'-')))
