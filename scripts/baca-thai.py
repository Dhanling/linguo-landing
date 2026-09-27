#!/usr/bin/env python3
"""[ebook-baca-thai-v1] Pemeriksa NADA & jumlah suku cara baca modul Thai.

Cara baca modul Thai (konvensi th-a1, gaya Paiboon) memakai tanda nada di atas
vokal: tanpa tanda = datar, ` rendah, ^ turun, ´ tinggi, ˇ naik. Salah satu
tanda nada = kata lain (มา maa datang, ม้า máa kuda, หมา mǎa anjing), dan
pemeriksa bentuk berkas (cek-unit-ebook.mjs) tak tahu apa-apa soal itu.

Skrip ini menurunkan nada tiap suku dari AKSARA Thai-nya lewat pustaka tltk
(th2ipa: 1 datar, 2 rendah, 3 turun, 4 tinggi, 5 naik), lalu membandingkannya
dengan tanda nada di `baca`. Yang diperiksa:
  - tiap pasangan ruby [aksara|baca] di dialog, tabel, paragraf, soal
  - tiap entri kosakata {th, baca}
Yang TIDAK diperiksa: panjang vokal & ejaan huruf (konvensi A1 tak seragam),
letak tanda hubung.

tltk tak jalan di Python 3.14 bawaan; pakai venv 3.9 yang sudah disiapkan:
  ~/ebook-brief-th/venv39/bin/python scripts/baca-thai.py th-a2 [--unit NN]
  ~/ebook-brief-th/venv39/bin/python scripts/baca-thai.py --kata "ภาษาไทย"

Laporan dibagi dua: NADA (jumlah suku sama, nadanya beda — hampir pasti
salah, kecuali kata yang lafal lisannya memang menyimpang dari ejaan, mis.
ฉัน chǎn/chán, เขา khǎo, ไหม mǎi, คะ/ค่ะ — lihat PENGECUALIAN) dan SUKU
(jumlah suku tak cocok — sering cuma beda pemenggalan tltk; periksa mata).
"""
import json, re, sys, os, glob, unicodedata, warnings, io, contextlib
from functools import lru_cache

warnings.filterwarnings("ignore")
with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
    from tltk import nlp  # noqa: E402

THAI = re.compile(r"[฀-๿]")
RUBY = re.compile(r"\[([^\[\]|]+)\|([^\[\]|]+)\]")
TANDA = {"̀": 2, "̂": 3, "́": 4, "̌": 5}

# Kata yang lafal bakunya sendiri memang tak mengikuti aturan ejaan, atau yang
# dibaca tltk keliru. Kunci = aksara, nilai = urutan nada yang diterima.
PENGECUALIAN = {
    "ฉัน": {"5", "4"}, "เขา": {"5"}, "ไหม": {"5"}, "คะ": {"4"}, "ค่ะ": {"3"},
    "นะคะ": {"44"}, "หรือ": {"5"}, "ผม": {"5"}, "เรา": {"1"},
    "ไม้": {"4"}, "น้ำ": {"4"}, "เงิน": {"1"}, "สาม": {"5"}, "หนึ่ง": {"2"},
    "ครับ": {"4"}, "ค่า": {"3"}, "มั้ย": {"4"}, "ป่ะ": {"2"},
}


def nada_baca(baca):
    suku = [s for s in re.split(r"[\s\-‑–]+", baca.strip()) if re.search(r"[A-Za-zÀ-ɏ]", s)]
    hasil = []
    for s in suku:
        n = 1
        for ch in unicodedata.normalize("NFD", s):
            if ch in TANDA:
                n = TANDA[ch]
        hasil.append(str(n))
    return "".join(hasil)


@lru_cache(maxsize=None)
def nada_aksara(th):
    teks = "".join(ch for ch in th if THAI.match(ch) and ch not in "ๆฯ")
    if not teks:
        return None
    with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
        try:
            ipa = nlp.th2ipa(teks)
        except Exception:
            return None
    ipa = ipa.replace("<s/>", " ")
    return "".join(re.findall(r"([1-5])(?=[.\s]|$)", ipa))


def periksa_pasangan(th, baca):
    """None = cocok/tak bisa diperiksa; ('NADA'|'SUKU', harapan, tertulis)."""
    if not THAI.search(th) or not baca.strip():
        return None
    th_bersih = th.replace("ๆ", "").strip()
    tertulis = nada_baca(baca)
    if th_bersih in PENGECUALIAN and tertulis in PENGECUALIAN[th_bersih]:
        return None
    harap = nada_aksara(th_bersih)
    if not harap:
        return None
    # ๆ mengulang kata sebelumnya: cara baca menuliskan ulangannya
    if "ๆ" in th and len(tertulis) > len(harap):
        harap = harap + harap[-len(tertulis) + len(harap):] if len(tertulis) - len(harap) <= len(harap) else harap
    if harap == tertulis:
        return None
    # Kata berpengecualian di dalam frasa: ganti bagian yang diketahui
    if len(harap) == len(tertulis):
        return ("NADA", harap, tertulis)
    return ("SUKU", harap, tertulis)


def jalan_string(s, tempat, keluar):
    for m in RUBY.finditer(s):
        r = periksa_pasangan(m.group(1), m.group(2))
        if r:
            keluar.append((tempat, m.group(1), m.group(2), *r))


def jalan(obj, tempat, keluar):
    if isinstance(obj, str):
        jalan_string(obj, tempat, keluar)
    elif isinstance(obj, list):
        for i, x in enumerate(obj):
            jalan(x, tempat, keluar)
    elif isinstance(obj, dict):
        if "th" in obj and "baca" in obj and isinstance(obj["th"], str):
            r = periksa_pasangan(obj["th"], obj["baca"])
            if r:
                keluar.append((tempat + " kosakata", obj["th"], obj["baca"], *r))
        for k, v in obj.items():
            if k in ("baca",):
                continue
            jalan(v, tempat, keluar)


NAMA_NADA = {"1": "datar", "2": "rendah", "3": "turun", "4": "tinggi", "5": "naik"}


def fmt(n):
    return "·".join(NAMA_NADA.get(c, c) for c in n)


def main():
    arg = sys.argv[1:]
    if not arg:
        print(__doc__)
        sys.exit(1)
    if arg[0] == "--kata":
        for kata in arg[1:]:
            n = nada_aksara(kata)
            with contextlib.redirect_stdout(io.StringIO()):
                ipa = nlp.th2ipa(kata)
            print(f"{kata}\t{ipa.replace('<s/>', '').strip()}\t{fmt(n or '')}")
        return
    slug = arg[0]
    unit = None
    if "--unit" in arg:
        unit = arg[arg.index("--unit") + 1].zfill(2)
    semua = "--semua" in arg
    folder = f"content/ebook/{slug}"
    berkas = sorted(glob.glob(f"{folder}/unit-*.json"))
    if unit:
        berkas = [b for b in berkas if b.endswith(f"unit-{unit}.json")]
    elif os.path.exists(f"{folder}/meta.json"):
        berkas.append(f"{folder}/meta.json")
    total_nada = total_suku = 0
    for b in berkas:
        keluar = []
        jalan(json.load(open(b)), os.path.basename(b), keluar)
        seen = set()
        for tempat, th, baca, jenis, harap, tulis in keluar:
            if (th, baca) in seen:
                continue
            seen.add((th, baca))
            if jenis == "NADA":
                total_nada += 1
                print(f"NADA  {tempat}: {th} [{baca}] → tertulis {fmt(tulis)}, aksara {fmt(harap)}")
            else:
                total_suku += 1
                if semua:
                    print(f"suku  {tempat}: {th} [{baca}] → tertulis {len(tulis)} suku, tltk {len(harap)} ({harap})")
    print(f"\n{total_nada} nada menyimpang, {total_suku} jumlah-suku tak cocok"
          + ("" if semua else " (tampilkan dengan --semua)"))


if __name__ == "__main__":
    main()
