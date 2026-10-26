# [isyarat-bisindo-v1] Kamus isyarat BISINDO (Bahasa Isyarat Indonesia) — TERPISAH
# dari kamus ASL. Dipanggang dengan:  KAMUS=kamus_bisindo $B -b … tanda.py -- …
# Helper (k, A, lingkar, bolak, cermin, IST, WAJAH) dipinjam dari kamus.py; KAMUS &
# S() milik sendiri, jadi klip ASL tidak ikut terpanggang.
#
# Rujukan bentuk: dataset terbuka Mendeley — "BISINDO DATASET" (4xnkvr88tk, mengikuti
# rujukan abjad BISINDO Kemendikdasmen), "BISINDO Alphabet Image Data" (ywnjpbcz8m), dan
# "BISINDO Video Dataset" (f33k9w86wr, penanda Tuli: Alphabets.mp4, Numbers.mp4).
# ⚠️ Belum dicek pengajar Tuli (Keren Noni/Melinda); variasi daerah belum dimasukkan.
#
# Tangan dominan = kanan (R), tangan pasif = kiri (L). Huruf dua tangan banyak memakai
# "tiang": telunjuk kiri tegak, tangan kanan menempel di sisi kanannya (B, D, F, K, P, T, Y).

from kamus import k, A, lingkar, bolak, cermin, IST, WAJAH, _tambah
import isyarat as I

KAMUS = {}

def S(kode, arti, kat, R, L=None, kepala=None, wajah=None, cara="", gloss=None, ragu=False):
    # [isyarat-bisindo-a1a2-v1] ragu=True → bentuk belum yakin, WAJIB dicek pengajar Tuli
    # (ikut ke kamus.json / isyarat-gerak.json sebagai "ragu": true, tak tampil ke siswa).
    if kode in KAMUS: raise ValueError(f"kode BISINDO dobel: {kode}")
    KAMUS[kode] = dict(kode=kode, arti=arti, kat=kat, R=R, L=L, kepala=kepala or [], wajah=wajah, cara=cara, gloss=gloss or kode.replace("_", "-"), ragu=ragu)

_G = I.GENGGAM
I.BENTUK.update({
    # B: telunjuk & tengah mengait (dua lengkung huruf B)
    "BIS_KAIT2": (I._jari(_G, index=(35, 95, 45, -2), middle=(35, 95, 45, 2)), "depan_genggam_manis"),
    # P/D kecil: telunjuk melengkung + ibu jari (setengah C)
    "BIS_KAIT1": (I._jari(_G, index=(35, 70, 40)), "C"),
})

# ── Titik ruang eja dua tangan ─────────────────────────────────────────────
TENGAH = A(0.0, -0.30, 1.36)
TIANG_X = 0.022
def tiang(dz=0.0, dx=0.0, dy=0.0):
    """Titik di sisi kanan telunjuk kiri yang tegak (dz dari ujung ke bawah = negatif)."""
    return A(TIANG_X - 0.012 + dx, -0.305 + dy, 1.40 + dz)

TIANG_L = [k(0, p=A(TIANG_X, -0.30, 1.40), a="telunjuk", b="1", j="atas", tp="belakang+0.35*dalam")]

def _dua(h, R, L, cara):
    S(f"HURUF_{h}", f"Huruf {h}", "Abjad jari", R, L=L, gloss=h, cara=cara)

def _diam(**kw):
    return [k(0, **kw), k(0.5)]

# ── Abjad jari BISINDO ─────────────────────────────────────────────────────

_dua("A",
     _diam(p=A(-0.004, -0.31, 1.405), a="telunjuk", b="L", j="atas+0.55*dalam", tp="depan"),
     [k(0, p=A(0.004, -0.31, 1.405), a="telunjuk", b="L", j="atas+0.55*dalam", tp="depan")],
     "Dua tangan bentuk L: ujung telunjuk bertemu di atas, ibu jari bertemu di bawah — membentuk segitiga huruf A.")
_dua("B",
     _diam(p=tiang(-0.030, -0.002, 0.012), a="jari_telunjuk", b="BIS_KAIT2", j="dalam", tp="belakang+0.3*bawah"),
     TIANG_L, "Telunjuk kiri tegak; telunjuk & jari tengah kanan mengait di sisi kanannya — dua lengkung huruf B.")
_dua("C",
     _diam(p="eja", a="telapak", b="C", j="atas", tp="dalam+0.3*depan"), None,
     "Satu tangan membentuk lengkung C, bukaan menghadap ke dalam.")
_dua("D",
     _diam(p=tiang(-0.050, 0.040), a="telapak", b="C", j="atas", tp="dalam"),
     TIANG_L, "Telunjuk kiri tegak; tangan kanan bentuk C menangkup sisi kanannya — huruf D.")
_dua("E",
     _diam(p="eja", a="telapak", b="W", j="dalam", tp="belakang"), None,
     "Telunjuk, jari tengah & jari manis lurus mendatar (punggung tangan ke lawan bicara) — tiga garis huruf E.")
_dua("F",
     _diam(p=tiang(-0.006), a="telunjuk", b="U", j="dalam", tp="belakang"),
     TIANG_L, "Telunjuk kiri tegak; telunjuk & jari tengah kanan mendatar menempel di ujung atasnya — huruf F.")
_dua("G",
     _diam(p=TENGAH + A(0, 0, 0.045), a="telapak", b="S", j="dalam+0.3*depan", tp="bawah"),
     [k(0, p=TENGAH, a="punggung", b="S", j="dalam+0.3*depan", tp="bawah")],
     "Dua kepalan bertumpuk: kepalan kanan di atas kepalan kiri.")
_dua("H",
     _diam(p=A(-0.004, -0.31, 1.355), a="jempol", b="L", j="atas", tp="depan"),
     [k(0, p=A(0.004, -0.31, 1.355), a="jempol", b="L", j="atas", tp="depan")],
     "Dua tangan bentuk L, telunjuk tegak & ujung ibu jari bertemu di tengah — dua tiang dan palang huruf H.")
_dua("I",
     _diam(p="eja", a="telapak", b="I", j="atas", tp="depan+0.3*dalam"), None,
     "Kelingking tegak, jari lain menggenggam.")
_dua("J",
     [k(0, p="eja", a="telapak", b="J", j="atas", tp="depan+0.5*dalam"),
      k(0.18, p="eja+0.04*bawah", tp="dalam+0.4*belakang"),
      k(0.36, p="eja+0.05*bawah+0.035*dalam", tp="belakang"),
      k(0.55)], None,
     "Kelingking tegak lalu digerakkan melengkung ke bawah seperti kait huruf J.")
_dua("K",
     _diam(p=tiang(-0.030, 0.004), a="telunjuk", b="V", j="dalam+0.15*atas", tp="belakang"),
     TIANG_L, "Telunjuk kiri tegak; telunjuk & jari tengah kanan (bentuk V) menyentuh sisi kanannya — huruf K.")
_dua("L",
     _diam(p="eja", a="telapak", b="L", j="atas", tp="depan"), None,
     "Telunjuk tegak & ibu jari mendatar membentuk L.")
_dua("M",
     _diam(p=A(0.015, -0.335, 1.345), a="telapak", b="W", j="bawah", tp="belakang"),
     [k(0, p=A(0.03, -0.31, 1.36), a="telapak", b="5", j="atas", tp="depan")],
     "Telapak kiri terbuka menghadap lawan bicara; tiga jari kanan (telunjuk, tengah, manis) menunjuk ke bawah di depannya — huruf M.")
_dua("N",
     _diam(p=A(0.015, -0.335, 1.345), a="telapak", b="U", j="bawah", tp="belakang"),
     [k(0, p=A(0.03, -0.31, 1.36), a="telapak", b="5", j="atas", tp="depan")],
     "Telapak kiri terbuka menghadap lawan bicara; telunjuk & jari tengah kanan menunjuk ke bawah di depannya — huruf N.")
_dua("O",
     _diam(p="eja", a="telapak", b="O", j="atas", tp="dalam+0.3*depan"), None,
     "Semua jari melengkung bertemu ibu jari membentuk O.")
_dua("P",
     _diam(p=tiang(-0.012, 0.030), a="telapak", b="BIS_KAIT1", j="atas", tp="dalam"),
     TIANG_L, "Telunjuk kiri tegak; telunjuk & ibu jari kanan melengkung di bagian atasnya — huruf P.")
_dua("Q",
     _diam(p=TENGAH + A(-0.01, 0, 0.03), a="telapak", b="O", j="atas", tp="dalam+0.3*depan"),
     [k(0, p=TENGAH + A(-0.025, -0.015, -0.010), a="telunjuk", b="1", j="dalam+0.45*bawah", tp="depan+0.3*bawah")],
     "Tangan kanan membentuk O; telunjuk kiri miring di bawahnya sebagai ekor — huruf Q.")
_dua("R",
     _diam(p="eja", a="telapak", b="R", j="atas", tp="depan"), None,
     "Telunjuk & jari tengah bersilang.")
_dua("S",
     _diam(p=TENGAH + A(-0.025, 0, 0.050), a="telapak", b="C", j="atas", tp="dalam+0.2*depan"),
     [k(0, p=TENGAH + A(0.025, 0, -0.030), a="telapak", b="C", j="atas", tp="dalam+0.2*depan")],
     "Dua tangan bentuk C bertumpuk berlawanan arah (kanan di atas, kiri di bawah) — lengkung huruf S.")
_dua("T",
     _diam(p=tiang(0.004, 0.012), a="jari_telunjuk", b="1", j="dalam", tp="belakang"),
     TIANG_L, "Telunjuk kiri tegak; telunjuk kanan mendatar di atas ujungnya — huruf T.")
_dua("U",
     _diam(p="eja", a="telapak", b="L", j="atas+1.0*luar", tp="depan"), None,
     "Telunjuk & ibu jari sama-sama terangkat ke atas (jari lain menggenggam) — lengkung huruf U.")
_dua("V",
     _diam(p="eja", a="telapak", b="V", j="atas", tp="depan"), None,
     "Telunjuk & jari tengah terbuka membentuk V.")
_dua("W",
     _diam(p=A(-0.003, -0.31, 1.33), a="jempol", b="L", j="atas+1.0*luar", tp="depan"),
     [k(0, p=A(0.003, -0.31, 1.33), a="jempol", b="L", j="atas+1.0*luar", tp="depan")],
     "Dua tangan bentuk U (telunjuk & ibu jari terangkat), ujung ibu jari bertemu di tengah — huruf W.")
_dua("X",
     _diam(p=TENGAH + A(0, -0.012, 0.02), a="jari_telunjuk", b="1", j="atas+0.9*dalam", tp="depan+0.4*dalam"),
     [k(0, p=TENGAH + A(0, 0.004, 0.02), a="jari_telunjuk", b="1", j="atas+0.9*dalam", tp="depan+0.4*dalam")],
     "Dua telunjuk bersilang membentuk X.")
_dua("Y",
     _diam(p=A(TIANG_X - 0.004, -0.325, 1.40), a="buku", b="V", j="atas", tp="depan"),
     [k(0, p=A(TIANG_X, -0.30, 1.37), a="telunjuk", b="1", j="atas", tp="belakang+0.35*dalam")],
     "Telunjuk kiri tegak sebagai tiang; tangan kanan bentuk V di atasnya — huruf Y.")
_dua("Z",
     [k(0, p="eja+0.04*luar+0.05*atas", a="telapak", b="FLAT", j="dalam", tp="bawah"),
      k(0.18, p="eja+0.05*dalam+0.05*atas"),
      k(0.36, p="eja+0.04*luar"),
      k(0.54, p="eja+0.05*dalam"),
      k(0.65)], None,
     "Tangan datar, telapak menghadap bawah, digerakkan zig-zag seperti menulis Z.")

# ── Angka 1–10 ─────────────────────────────────────────────────────────────
# 1–5 satu tangan, telapak menghadap lawan bicara; 6–9 = tangan kiri 5 + tangan kanan
# 1–4; 10 = kedua tangan 5 (Numbers.mp4, BISINDO Video Dataset).

ANGKA_L = A(0.125, -0.30, 1.375)
_BENTUK_ANGKA = {1: "1", 2: "V", 3: "W", 4: "4", 5: "5"}

def _angka(n, R, L, cara):
    S(f"ANGKA_{n}", f"Angka {n}", "Angka", R, L=L, gloss=str(n), cara=cara)

for n in range(1, 6):
    _angka(n, _diam(p="angka", a="telapak", b=_BENTUK_ANGKA[n], j="atas", tp="depan+0.1*dalam"), None,
           {1: "Telunjuk tegak, telapak menghadap lawan bicara.",
            2: "Telunjuk & jari tengah tegak (V).",
            3: "Telunjuk, jari tengah & jari manis tegak; ibu jari menahan kelingking.",
            4: "Empat jari tegak, ibu jari terlipat.",
            5: "Lima jari terbuka."}[n])
for n in range(6, 11):
    _angka(n, _diam(p="angka", a="telapak", b=_BENTUK_ANGKA[n - 5], j="atas", tp="depan+0.1*dalam"),
           [k(0, p=ANGKA_L, a="telapak", b="5", j="atas", tp="depan+0.1*dalam")],
           f"Tangan kiri terbuka (5) + tangan kanan {n - 5} — dua tangan dijumlah." if n < 10
           else "Kedua tangan terbuka (5 + 5).")

# ── [isyarat-bisindo-a1a2-v1] Kosakata per sublevel A1.1–A2.4 ─────────────────
# Tiap berkas kamus_bisindo_<sub>.py memakai S()/k()/… dari modul ini; pembagian kode
# di ../ALOKASI_BISINDO.md supaya tidak bentrok. Berkas yang belum ada dilewati.
import importlib as _il, os as _os, sys as _sys
_sys.modules.setdefault("kamus_bisindo", _sys.modules[__name__])
for _m in ("kamus_bisindo_a1_1", "kamus_bisindo_a1_2", "kamus_bisindo_a1_3", "kamus_bisindo_a2_1",
           "kamus_bisindo_a2_2", "kamus_bisindo_a2_3", "kamus_bisindo_a2_4"):
    if _os.path.exists(_os.path.join(_os.path.dirname(__file__), _m + ".py")):
        _il.import_module(_m)
