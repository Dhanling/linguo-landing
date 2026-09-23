#!/usr/bin/env python3
"""Sisipkan "Ulangan berjenjang — unit N-2" ke unit N dari 5 baris `kunci` unit N-2,
lalu buang penanda `kunci`. Pakai: python3 scripts/ebook-sisip-ulangan.py <slug> [--cek]

Pola tulis-paralel: tiap penulis unit menandai tepat 5 baris dialog `"kunci": true`;
skrip ini yang merakit bagian ulangannya, jadi penulis unit N+2 tak perlu tahu isi unit N.
Kolom kanan berjudul "Bosanski" — ganti untuk bahasa lain."""
import json, sys, os, glob

slug = sys.argv[1]
cek = "--cek" in sys.argv
d = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "content", "ebook", slug)
units = {}
for f in sorted(glob.glob(f"{d}/unit-*.json")):
    units[int(f[-7:-5])] = (f, json.load(open(f)))

kunci = {}
for n, (f, u) in units.items():
    k = [l for dl in u["dialogs"] for l in dl["lines"] if l.get("kunci")]
    kunci[n] = k
    if len(k) != 5:
        print(f"  ! unit {n}: {len(k)} baris kunci")

if cek:
    sys.exit(0)

for n, (f, u) in units.items():
    src = n - 2
    u["sections"] = [s for s in u["sections"] if not s["title"].startswith("Ulangan berjenjang")]
    if src in kunci and kunci[src]:
        u["sections"].append({
            "title": f"Ulangan berjenjang — unit {src}",
            "blocks": [
                {"type": "p", "text": "Tutup kolom Bosnia, baca terjemahan Indonesianya, lalu susun kembali kalimatnya dari ingatan."},
                {"type": "tabel", "head": ["Bahasa Indonesia", "Bosanski"],
                 "rows": [[l["id"], f"*{l['text']}*"] for l in kunci[src]]},
            ],
        })

for n, (f, u) in units.items():
    for dl in u["dialogs"]:
        for l in dl["lines"]:
            l.pop("kunci", None)
    with open(f, "w") as fh:
        json.dump(u, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
print(f"{slug}: {len(units)} unit diproses")
