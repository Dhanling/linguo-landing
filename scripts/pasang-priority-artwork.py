# Pasang aset prioritas ke worktree bersih, gabungkan manifest terbaru.
from pathlib import Path
import json,shutil,sys
source=Path(__file__).resolve().parent.parent
for target in sys.argv[1:]:
 root=Path(target)
 for folder in ['a1-minimal-spanish-v2','priority-goals-v1']:
  shutil.copytree(source/'public/slide-cover'/folder,root/'public/slide-cover'/folder,dirs_exist_ok=True)
 manifest=root/'src/data/a1CuteCoverReady.json'
 ready=json.loads(manifest.read_text())
 ready.update({k:v for k,v in json.loads((source/'src/data/a1CuteCoverReady.json').read_text()).items() if '/a1-minimal-spanish-v2/' in v})
 manifest.write_text(json.dumps(ready,ensure_ascii=False,indent=2)+'\n')
 helper=root/'src/lib/a1CuteCover.ts'
 t=helper.read_text()
 if 'const bahasaTujuan' not in t:
  t=t.replace('/** Ganti hanya sampul SVG lama; label level dan materi tetap dari dek asli. */',"const bahasaTujuan = new Set(['danish', 'french', 'polish', 'bulgarian', 'hebrew', 'norwegian', 'romanian', 'arabic']);\n\n/** Ganti hanya SVG bawaan lama; materi dan gambar pilihan pengajar tetap dijaga. */")
  t=t.replace('  if (!isTitle || !cover) return cover;',r'''  if (!cover) return cover;
  if (!isTitle) {
    const tujuan = /^\/slide-cover\/([a-z-]+)-a[12]-[1-4]-sesi-(?:[1-9]|1[0-6])-tujuan-cute-vector-v1\.svg$/.exec(cover);
    return tujuan && bahasaTujuan.has(tujuan[1])
      ? `/slide-cover/priority-goals-v1/${tujuan[1]}-objectives.webp`
      : cover;
  }''')
  assert 'const tujuan' in t
  helper.write_text(t)
 norm=root/'src/lib/materiSlides.ts'
 t=norm.read_text()
 for folder in ['a1-minimal-spanish-v2','priority-goals-v1']:
  if folder not in t:t=t.replace('a1-cute-2026-11|','a1-cute-2026-11|'+folder+'|')
 norm.write_text(t)
 dek=root/'src/lib/dekSilabus.ts'
 if dek.exists():
  t=dek.read_text()
  line='    if (bersih[1]) bersih[1].cover = a1CuteCover(bersih[1].cover, false);'
  if line not in t:t=t.replace('    if (bersih.length) out[Number(no)] = bersih;',line+'\n    if (bersih.length) out[Number(no)] = bersih;')
  dek.write_text(t)
 print(root,len(ready))
