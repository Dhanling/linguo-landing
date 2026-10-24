# [isyarat-asl-a1a2-v1] Tulis semua kode KAMUS ke <out.json> (dipakai cek_kode.mjs).
#   Blender -b --factory-startup --python daftar_kode.py -- out.json
import sys, os, json
sys.path.insert(0, os.path.dirname(__file__))
import kamus as K
json.dump(sorted(K.KAMUS.keys()), open(sys.argv[sys.argv.index("--") + 1], "w"))
print("KODE", len(K.KAMUS))
