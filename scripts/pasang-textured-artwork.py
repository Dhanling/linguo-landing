# Pasang hanya aset batch Jepang, Korea, Islandia ke worktree tujuan.
from pathlib import Path
import json,shutil,sys
source=Path(__file__).resolve().parent.parent
folder='next-priority-textured-v2'
queue=json.loads((source/'output/imagegen'/folder/'queue.json').read_text())
assert len(queue)==94
for x in queue: assert (source/'public/slide-cover'/folder/(x['id']+'.webp')).exists()
for lang in ['japanese','korean','icelandic']: assert (source/'public/slide-cover'/folder/(lang+'-objectives.webp')).exists()
for target in sys.argv[1:]:
 root=Path(target)
 shutil.copytree(source/'public/slide-cover'/folder,root/'public/slide-cover'/folder,dirs_exist_ok=True)
 manifest=root/'src/data/a1CuteCoverReady.json'
 ready=json.loads(manifest.read_text())
 ready.update({x['id']:f"/slide-cover/{folder}/{x['id']}.webp" for x in queue})
 manifest.write_text(json.dumps(ready,ensure_ascii=False,indent=2)+'\n')
 helper=root/'src/lib/a1CuteCover.ts';t=helper.read_text()
 line="    if (tujuan && ['japanese', 'korean', 'icelandic'].includes(tujuan[1])) {\n      return `/slide-cover/next-priority-textured-v2/${tujuan[1]}-objectives.webp`;\n    }\n"
 if line not in t:
  assert '    return tujuan && bahasaTujuan.has(tujuan[1])' in t
  t=t.replace('    return tujuan && bahasaTujuan.has(tujuan[1])',line+'    return tujuan && bahasaTujuan.has(tujuan[1])')
 helper.write_text(t)
 norm=root/'src/lib/materiSlides.ts';t=norm.read_text()
 if folder not in t:
  assert 'priority-goals-v1|' in t
  t=t.replace('priority-goals-v1|',folder+'|priority-goals-v1|')
 norm.write_text(t)
 print(root,len(ready))
