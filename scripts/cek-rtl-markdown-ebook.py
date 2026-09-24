#!/usr/bin/env python3
"""[ebook-rtl-markdown-v1] Pemeriksa modul RTL (Arab dsb.): tanda markdown (** atau *) yang
jatuh DI TENGAH untaian Arab — huruf Arab di kedua sisinya, hanya dipisah spasi/tanda baca.
Tag <b>/<i> memotong untaian jadi dua pagar `.rtl` bersebelahan, dan dua pagar itu diurutkan
kiri-ke-kanan: frasanya terbaca terbalik (lihat [ebook-rtl-arab-v1] di build-ebook-pdf.mjs).
Kata Arab yang SELURUHNYA di dalam **…** aman. Teks penjelasan yang dibuka aksara Arab hanya
dilaporkan kalau meta memakai `rtl_baris_plaintext` (lihat cek-rtl-baris-ebook.mjs).
Pakai: python3 scripts/cek-rtl-markdown-ebook.py <slug>"""
import json, re, sys, glob, os
slug = sys.argv[1]
AR = "؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿"
TEBAL = re.compile(r"\*\*([^*]+)\*\*|(?<!\*)\*([^*]+)\*(?!\*)")
BUKA_AR = re.compile(rf"^[^A-Za-zÀ-ɏ{AR}]*[{AR}]")
salah = 0
_mp = f"content/ebook/{slug}/meta.json"
PLAINTEXT_META = os.path.exists(_mp) and bool(json.load(open(_mp)).get("rtl_baris_plaintext"))
def lapor(f, jalur, s, pesan):
    global salah; salah += 1
    print(f"  ✗ {os.path.basename(f)} {jalur}: {pesan}: {s[:90]}")
NETRAL = " \u00A0.,\u060C\u061B\u061F!?:;()\\[\\]/\\-\u2013\u2014\u00AB\u00BB0-9\u0660-\u0669"
# Hanya spasi di antara keduanya = satu frasa yang terbelah. Kalau ada titik/titik dua
# (judul catatan "**Isim كَأَنَّ.** كَأَنَّ termasuk…"), itu dua frasa terpisah dan urutan
# kiri-ke-kanan antara dua pagar memang benar.
POTONG = re.compile(rf"[{AR}][ \u00A0]*\*+[ \u00A0]*[{AR}]")
PLAINTEXT = PLAINTEXT_META
def cek_md(f, jalur, s):
    if POTONG.search(s): lapor(f, jalur, s, "markdown memotong untaian Arab")
def jelaskan(f, jalur, s):
    cek_md(f, jalur, s)
    if PLAINTEXT and BUKA_AR.match(s): lapor(f, jalur, s, "penjelasan dibuka aksara Arab")
def blok(f, jalur, blocks):
    for i, b in enumerate(blocks or []):
        for k in ("text", "title"):
            if isinstance(b.get(k), str): jelaskan(f, f"{jalur}.{i}.{k}", b[k])
        for j, it in enumerate(b.get("items") or []):
            if isinstance(it, str): jelaskan(f, f"{jalur}.{i}.items.{j}", it)
        for r in b.get("rows") or []:
            for c in r:
                if isinstance(c, str): cek_md(f, f"{jalur}.{i}.tabel", c)
for f in sorted(glob.glob(f"content/ebook/{slug}/unit-*.json")):
    u = json.load(open(f))
    for k in ("goal", "title"): jelaskan(f, k, u.get(k, ""))
    for j, b in enumerate(u.get("bekal", [])): jelaskan(f, f"bekal.{j}", b)
    for di, d in enumerate(u["dialogs"]):
        jelaskan(f, f"d{di}.intro", d.get("intro", ""))
        for j, n in enumerate(d.get("notes", [])): jelaskan(f, f"d{di}.notes.{j}", n)
        for gi, g in enumerate(d.get("grammars", [])):
            jelaskan(f, f"d{di}.g{gi}.title", g.get("title", ""))
            for k in ("body", "after"):
                for j, s in enumerate(g.get(k) or []): jelaskan(f, f"d{di}.g{gi}.{k}.{j}", s)
            for r in (g.get("table") or {}).get("rows", []):
                for c in r: cek_md(f, f"d{di}.g{gi}.tabel", c)
        for l in d["lines"]:
            for k in ("id", "literal", "text"): cek_md(f, "baris", l.get(k, ""))
    for si, s in enumerate(u.get("sections", [])):
        jelaskan(f, f"s{si}.title", s["title"]); blok(f, f"s{si}", s.get("blocks"))
    for ei, e in enumerate(u.get("exercises", [])):
        cek_md(f, f"ex{ei}.prompt", e["prompt"])
        for it in e["items"]: cek_md(f, f"ex{ei}.item", it)
    for a in u.get("answers", []): cek_md(f, "answers", a)
mp = f"content/ebook/{slug}/meta.json"
if os.path.exists(mp):
    m = json.load(open(mp))
    for part in ("front", "back"):
        for i, sec in enumerate(m.get(part, [])):
            jelaskan(mp, f"{part}.{i}.title", sec.get("title", "")); blok(mp, f"{part}.{i}", sec.get("blocks"))
print(f"{slug}: {salah} masalah RTL-markdown")
