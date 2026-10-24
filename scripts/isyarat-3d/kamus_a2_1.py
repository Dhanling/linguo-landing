# [isyarat-asl-a1a2-v1] Kamus isyarat ASL A2.1 "Daily Life — Kehidupan Sehari-hari".
# Bentuk sitasi (Lifeprint/HandSpeak), tangan dominan kanan. Format = kamus.py.
# ⚠️ Ditulis dari kamus umum — perlu dicek pengajar Tuli.

from kamus import S, k, A, lingkar, bolak, cermin, IST
import isyarat as I

_G = I.GENGGAM
I.BENTUK.update({
    # U dengan ibu jari terbuka (HORSE) + versi jari menekuk
    "A21_U_JEMPOL": (I._jari(_G, index=(0, 0, 0, -3), middle=(0, 0, 0, 2)), "keluar_L"),
    "A21_U_TEKUK":  (I._jari(_G, index=(70, 15, 5, -3), middle=(70, 15, 5, 2)), "keluar_L"),
    # Telunjuk, tengah, manis lurus + ibu jari terbuka (langkah FEW)
    "A21_TIGA_JEMPOL": (I._jari(I.LURUS, I.RENGGANG, pinky=_G), "keluar"),
})

def _ist(sisi, t):
    d = dict(IST[sisi]); d["t"] = t; return d

# ── Sapaan lanjutan ─────────────────────────────────────────────────────────

_R = [
    k(0, p="dada_kanan+0.012*depan", a="tengah", b="OPEN_8", j="atas+0.3*dalam", tp="belakang"),
    k(0.15),
    k(0.55, p="dada_kanan+0.15*depan+0.07*atas+0.03*luar", j="atas+0.6*depan", tp="belakang+0.6*atas"),
    k(0.75),
]
S("WHATS_UP", "Apa kabar? / Ada apa? (santai)", "Sapaan", _R, L=cermin(_R), wajah="senang", gloss="WHAT'S-UP",
  cara="Dua tangan terbuka dengan jari tengah menekuk menyentuh dada, lalu dijentik ke atas-depan.")

# ── Keluarga besar ─────────────────────────────────────────────────────────

def _kakek_nenek(kode, arti, lok, cara):
    S(kode, arti, "Keluarga", [
        k(0, p=f"{lok}+0.006*depan", a="jempol", b="5", j="atas", tp="dalam"),
        k(0.12),
        k(0.32, p=f"{lok}+0.07*depan+0.03*atas"),
        k(0.48, p=f"{lok}+0.12*depan"),
        k(0.66, p=f"{lok}+0.18*depan+0.03*atas"),
        k(0.82, p=f"{lok}+0.23*depan"),
        k(0.95),
    ], cara=cara)

_kakek_nenek("GRANDMOTHER", "Nenek", "dagu",
             "Seperti MOTHER (ibu jari tangan 5 di dagu), lalu tangan melompat dua kali ke depan.")
_kakek_nenek("GRANDFATHER", "Kakek", "dahi",
             "Seperti FATHER (ibu jari tangan 5 di dahi), lalu tangan melompat dua kali ke depan.")

S("AUNT", "Bibi / tante", "Keluarga", [
    k(0, p="rahang+0.07*depan+0.06*luar+0.02*atas", a="telapak", b="A", j="atas", tp="depan+0.8*dalam"),
    *bolak(0.14, 0.14, 5, {"putar": -28}, {"putar": 22}),
    k(0.85, putar=0),
], cara="Tangan bentuk A di dekat pipi/rahang (area perempuan), digoyang kecil di pergelangan.")

S("UNCLE", "Paman / om", "Keluarga", [
    k(0, p="pelipis+0.08*depan+0.06*luar+0.08*bawah", a="telapak", b="U", j="atas+0.3*depan", tp="depan+0.8*dalam"),
    *bolak(0.14, 0.14, 5, {"putar": -28}, {"putar": 22}),
    k(0.85, putar=0),
], cara="Tangan bentuk U di dekat pelipis (area laki-laki), digoyang kecil di pergelangan.")

S("COUSIN", "Sepupu", "Keluarga", [
    k(0, p="pipi+0.07*luar+0.06*depan+0.02*bawah", a="telapak", b="C", j="atas", tp="dalam+0.3*depan"),
    *bolak(0.14, 0.14, 5, {"putar": -28}, {"putar": 22}),
    k(0.85, putar=0),
], cara="Tangan bentuk C di samping wajah, digoyang kecil di pergelangan (lebih tinggi = laki-laki, lebih rendah = perempuan).")

S("MARRIED", "Menikah", "Keluarga", [
    k(0, p=A(0.02, -0.33, 1.28), a="telapak", b="C", j="dalam+0.5*depan", tp="bawah"),
    k(0.15),
    k(0.5, p=A(0.04, -0.31, 1.192)),
    k(0.75),
], L=[k(0, p=A(0.04, -0.31, 1.16), a="telapak", b="C", j="dalam+0.5*depan", tp="atas")],
  wajah="senang", cara="Tangan kanan bentuk C turun dan 'menggenggam' tangan kiri yang menghadap atas, seperti bergandengan.")

_R = [
    k(0, p=A(-0.018, -0.33, 1.24), a="buku", b="D", j="atas+0.3*dalam", tp="belakang"),
    k(0.15),
    k(0.55, p=A(-0.17, -0.37, 1.25), j="atas+0.2*luar", tp="depan"),
    k(0.75),
]
S("DIVORCED", "Bercerai", "Keluarga", _R, L=cermin(_R), wajah="sedih",
  cara="Dua tangan bentuk D berdempetan di depan badan, lalu dipisahkan ke samping sambil telapak berputar ke depan.")

# ── Rutinitas & frekuensi ──────────────────────────────────────────────────

S("EVERY_DAY", "Setiap hari", "Waktu", [
    k(0, p="pipi+0.008*depan", a="jempol", b="10", j="atas", tp="dalam"),
    k(0.1),
    k(0.35, p="pipi+0.12*depan+0.02*bawah", j="atas+0.6*depan"),
    k(0.5, p="pipi+0.008*depan", j="atas"),
    k(0.75, p="pipi+0.12*depan+0.02*bawah", j="atas+0.6*depan"),
    k(0.9),
], gloss="EVERY-DAY", cara="Ibu jari tangan 10 di pipi bergerak maju (TOMORROW) berulang-ulang.")

_PAGI_R = dict(p=A(-0.02, -0.38, 1.12), a="telapak", b="FLAT", j="dalam+0.6*depan", tp="atas+0.4*belakang")
_PAGI_R2 = dict(p=A(-0.07, -0.36, 1.30), j="atas+0.5*dalam+0.2*depan", tp="belakang")
S("EVERY_MORNING", "Setiap pagi", "Waktu", [
    k(0, **_PAGI_R), k(0.12), k(0.55, **_PAGI_R2), k(0.68),
    k(0.85, p=_PAGI_R["p"], j=_PAGI_R["j"], tp=_PAGI_R["tp"]), k(1.3, **_PAGI_R2), k(1.45),
], L=[k(0, p=A(-0.11, -0.25, 1.085), a="telapak", b="FLAT", j="dalam+0.2*depan", tp="bawah")],
  gloss="EVERY-MORNING", cara="Isyarat MORNING (lengan bawah naik seperti matahari terbit) diulang dua kali.")

_MINGGU_L = [k(0, p=A(0.05, -0.31, 1.15), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")]
_W0, _W1 = A(0.085, -0.29, 1.168), A(-0.02, -0.34, 1.168)
S("EVERY_WEEK", "Setiap minggu", "Waktu", [
    k(0, p=_W0, a="jari_telunjuk", b="1", j="dalam+0.5*depan", tp="bawah"),
    k(0.1), k(0.4, p=_W1), k(0.55, p=_W0 + A(0, 0, 0.03)), k(0.65, p=_W0), k(0.95, p=_W1), k(1.1),
], L=_MINGGU_L, gloss="EVERY-WEEK",
  cara="Telunjuk kanan meluncur di telapak kiri dari pangkal ke ujung (WEEK), diulang dua kali.")

S("ALWAYS", "Selalu", "Waktu",
  lingkar(0, 0.9, "netral+0.06*atas", 0.035, "luar", "atas", n=10, mulai=90, putaran=2,
          a="telunjuk", b="1", j="depan+0.5*atas+0.2*dalam", tp="atas+0.3*dalam") + [k(1.05)],
  cara="Telunjuk menunjuk ke depan-atas (telapak ke atas) dan berputar membentuk lingkaran berulang.")

S("OFTEN", "Sering", "Waktu", [
    k(0, p=A(0.03, -0.33, 1.235), a="ujung", b="BENT_B", j="dalam+0.4*atas", tp="bawah+0.3*dalam"),
    *bolak(0.15, 0.15, 4, {"p": A(0.04, -0.31, 1.176)}, {"p": A(0.03, -0.33, 1.235)}),
    k(0.75, p=A(0.04, -0.31, 1.176)),
], L=[k(0, p=A(0.04, -0.31, 1.15), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")],
  cara="Ujung jari tangan kanan yang tertekuk mengetuk telapak kiri berulang (seperti AGAIN diulang).")

S("SOMETIMES", "Kadang-kadang", "Waktu", [
    k(0, p=A(0.035, -0.32, 1.165), a="telunjuk", b="1", j="dalam+0.3*depan", tp="bawah+0.5*belakang"),
    k(0.15), k(0.45, p=A(0.035, -0.32, 1.25)), k(0.75),
    k(0.85, p=A(0.035, -0.32, 1.165)), k(1.15, p=A(0.035, -0.32, 1.25)), k(1.35),
], L=[k(0, p=A(0.055, -0.32, 1.20), a="telapak", b="FLAT", j="depan+0.4*atas", tp="dalam")],
  cara="Ujung telunjuk kanan menyapu ke atas di telapak kiri yang tegak, dua kali dengan jeda.")

# ── Pakaian ────────────────────────────────────────────────────────────────

_R = [
    k(0, p="dada_kanan+0.05*atas+0.01*luar+0.012*depan", a="telunjuk", b="F", j="atas+0.3*dalam", tp="belakang"),
    *bolak(0.15, 0.15, 4, {"p": "dada_kanan+0.05*atas+0.01*luar+0.05*depan"}, {"p": "dada_kanan+0.05*atas+0.01*luar+0.012*depan"}),
    k(0.75),
]
S("SHIRT", "Kemeja / baju", "Pakaian", _R, L=cermin(_R),
  cara="Dua tangan bentuk F mencubit kain baju di dada atas, ditarik kecil dua kali.")

_R = [
    k(0, p="perut+0.12*luar+0.12*bawah+0.03*depan", a="telapak", b="5", j="bawah+0.3*dalam", tp="belakang"),
    *bolak(0.15, 0.2, 4, {"p": "perut+0.12*luar+0.03*bawah+0.03*depan"}, {"p": "perut+0.12*luar+0.12*bawah+0.03*depan"}),
    k(0.9),
]
S("PANTS", "Celana", "Pakaian", _R, L=cermin(_R),
  cara="Dua tangan terbuka di depan paha, ditarik ke atas ke pinggang dua kali.")

S("SHOES", "Sepatu", "Pakaian", [
    k(0, p=A(-0.06, -0.33, 1.17), a="sisi_telunjuk", b="S", j="depan+0.2*dalam", tp="bawah"),
    *bolak(0.15, 0.15, 4, {"p": A(-0.012, -0.33, 1.17)}, {"p": A(-0.06, -0.33, 1.17)}),
    k(0.75, p=A(-0.012, -0.33, 1.17)),
], L=cermin([
    k(0, p=A(-0.06, -0.33, 1.17), a="sisi_telunjuk", b="S", j="depan+0.2*dalam", tp="bawah"),
    *bolak(0.15, 0.15, 4, {"p": A(-0.012, -0.33, 1.17)}, {"p": A(-0.06, -0.33, 1.17)}),
    k(0.75, p=A(-0.012, -0.33, 1.17)),
]), cara="Dua kepalan S (telapak ke bawah) diadu sisi ibu jarinya dua kali.")

_R = [
    k(0, p="dada_kanan+0.02*bawah+0.02*depan", a="jempol", b="5", j="bawah+0.6*dalam", tp="belakang", siku="bawah+0.5*luar"),
    k(0.12),
    k(0.7, p="perut+0.14*luar+0.10*bawah+0.06*depan", j="bawah+0.5*luar", tp="belakang+0.4*dalam"),
    k(0.9),
]
S("DRESS", "Gaun / rok terusan", "Pakaian", _R, L=cermin(_R),
  cara="Ibu jari dua tangan terbuka di dada atas, disapukan turun ke pinggang lalu melebar keluar.")

S("HAT", "Topi", "Pakaian", [
    k(0, p=A(-0.03, -0.04, 1.80), a="telapak", b="FLAT", j="dalam+0.3*depan", tp="bawah"),
    *bolak(0.15, 0.15, 4, {"p": A(-0.03, -0.04, 1.762)}, {"p": A(-0.03, -0.04, 1.80)}),
    k(0.75, p=A(-0.03, -0.04, 1.762)),
], cara="Telapak tangan datar menepuk puncak kepala dua kali.")

_R = [
    k(0, p="dada_kanan+0.06*atas+0.04*luar+0.02*depan", a="jempol", b="10", j="bawah+0.3*dalam", tp="belakang+0.6*dalam", siku="bawah+0.5*luar"),
    k(0.12),
    k(0.65, p="dada+0.10*bawah+0.03*luar+0.03*depan", j="bawah+0.2*dalam"),
    k(0.85),
]
S("COAT", "Jaket / mantel", "Pakaian", _R, L=cermin(_R),
  cara="Ibu jari dua kepalan di bahu, disapukan turun-ke tengah mengikuti kerah jaket.")

_R = [
    k(0, p="dada_kanan+0.02*bawah+0.02*depan", a="jempol", b="5", j="bawah+0.6*dalam", tp="belakang", siku="bawah+0.5*luar"),
    *bolak(0.15, 0.2, 4, {"p": "dada_kanan+0.11*bawah+0.02*depan"}, {"p": "dada_kanan+0.02*bawah+0.02*depan"}),
    k(0.9),
]
S("WEAR", "Memakai (baju) / pakaian", "Pakaian", _R, L=cermin(_R),
  cara="Ibu jari dua tangan terbuka menyapu dada ke bawah dua kali (sama dengan CLOTHES).")

# ── Sekolah & kampus ───────────────────────────────────────────────────────

_R = [
    k(0, p=A(-0.035, -0.33, 1.25), a="telapak", b="C", j="atas", tp="depan"),
    k(0.15),
    k(0.45, p=A(-0.15, -0.40, 1.25), tp="depan+0.7*luar"),
    k(0.8, p=A(-0.04, -0.46, 1.25), tp="belakang+0.3*dalam"),
    k(0.95),
]
S("CLASS", "Kelas", "Sekolah", _R, L=cermin(_R),
  cara="Dua tangan bentuk C berputar keluar membentuk lingkaran sampai bertemu di depan (kelompok).")

_R = [
    k(0, p="netral+0.15*atas+0.07*luar", a="telunjuk", b="1", j="atas", tp="depan"),
    k(0.15),
    k(0.35, p="netral+0.12*atas+0.05*luar+0.03*depan", b="X", j="atas+0.4*depan"),
    k(0.65, p="netral+0.02*bawah+0.06*luar+0.06*depan", j="depan+0.5*bawah"),
    k(0.85, p="netral+0.04*bawah+0.06*luar+0.12*depan", b="1", j="depan"),
    k(1.0),
]
S("TEST", "Ujian / tes", "Sekolah", _R, L=cermin(_R),
  cara="Dua telunjuk 'menggambar' tanda tanya ke bawah, lalu didorong ke depan.")

S("HOMEWORK", "PR / pekerjaan rumah", "Sekolah", [
    k(0, p="sudut_mulut+0.008*depan", a="ujung", b="FLAT_O", j="belakang+0.6*atas", tp="bawah+0.3*dalam"),
    k(0.12),
    k(0.32, p="pipi+0.01*depan"),
    k(0.42),
    k(0.7, p=A(0.03, -0.31, 1.25), a="telapak", b="S", j="dalam+0.6*depan", tp="bawah"),
    *bolak(0.82, 0.14, 4, {"p": A(0.03, -0.31, 1.205)}, {"p": A(0.03, -0.31, 1.25)}),
    k(1.35, p=A(0.03, -0.31, 1.205)),
], L=[_ist("L", 0), _ist("L", 0.45),
      k(0.7, p=A(0.045, -0.31, 1.175), a="punggung", b="S", j="dalam+0.6*depan", tp="bawah"), k(1.35)],
  cara="HOME (O-pipih di sudut mulut lalu pipi) + WORK (kepalan kanan mengetuk punggung kepalan kiri).")

S("COLLEGE", "Kuliah / perguruan tinggi", "Sekolah", [
    k(0, p=A(0.04, -0.31, 1.182), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="bawah"),
    k(0.15),
    k(0.35, p=A(0.0, -0.36, 1.23), tp="bawah+0.3*luar"),
    k(0.5, p=A(0.06, -0.34, 1.28)),
    k(0.65, p=A(0.09, -0.29, 1.32)),
    k(0.8, p=A(0.03, -0.33, 1.36)),
    k(0.95),
], L=[k(0, p=A(0.04, -0.31, 1.16), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")],
  cara="Telapak kanan di atas telapak kiri, lalu naik memutar ke atas (seperti SCHOOL yang 'naik tingkat').")

S("MATH", "Matematika", "Sekolah", [
    k(0, p=A(-0.07, -0.34, 1.25), a="jari_tengah", b="M", j="dalam+0.3*atas", tp="belakang"),
    k(0.1),
    k(0.35, p=A(0.03, -0.34, 1.21)),
    k(0.55, p=A(-0.07, -0.34, 1.25)),
    k(0.8, p=A(0.03, -0.34, 1.21)),
    k(0.95),
], L=[k(0, p=A(0.07, -0.31, 1.22), a="jari_tengah", b="M", j="dalam+0.3*atas", tp="belakang")],
  cara="Dua tangan bentuk M (telapak ke badan); tangan kanan menyilang melewati tangan kiri dua kali.")

S("ENGLISH", "Bahasa Inggris / orang Inggris", "Sekolah", [
    k(0, p=A(0.03, -0.34, 1.215), a="telapak", b="C", j="dalam+0.5*depan", tp="bawah"),
    k(0.15),
    k(0.55, p=A(0.03, -0.28, 1.215)),
    k(0.75),
], L=[k(0, p=A(0.04, -0.34, 1.18), a="punggung", b="FLAT", j="dalam+0.5*depan", tp="bawah"),
      k(0.15), k(0.55, p=A(0.04, -0.28, 1.18)), k(0.75)],
  cara="Tangan kanan memegang punggung tangan kiri, keduanya ditarik sedikit ke arah badan.")

# ── Olahraga ───────────────────────────────────────────────────────────────

S("SPORT", "Olahraga / bertanding", "Olahraga", [
    k(0, p=A(-0.045, -0.32, 1.22), a="telapak", b="10", j="depan+0.2*atas", tp="dalam"),
    *bolak(0.15, 0.17, 5, {"p": A(-0.045, -0.40, 1.22)}, {"p": A(-0.045, -0.28, 1.22)}),
    k(1.0),
], L=[
    k(0, p=A(0.045, -0.40, 1.22), a="telapak", b="10", j="depan+0.2*atas", tp="dalam"),
    *bolak(0.15, 0.17, 5, {"p": A(0.045, -0.28, 1.22)}, {"p": A(0.045, -0.40, 1.22)}),
    k(1.0),
], cara="Dua kepalan (ibu jari tegak) saling berhadapan, maju-mundur bergantian seperti berlomba.")

_R = [
    k(0, p=A(-0.09, -0.31, 1.28), a="telapak", b="CLAW", j="atas+0.3*depan", tp="dalam"),
    k(0.15),
    k(0.45, p=A(-0.09, -0.40, 1.42), j="depan+0.6*atas", tp="dalam+0.4*bawah"),
    k(0.65),
]
S("BASKETBALL", "Bola basket", "Olahraga", _R, L=cermin(_R),
  cara="Dua tangan cakar seperti memegang bola di depan dada, lalu 'menembak' ke atas-depan.")

S("SOCCER", "Sepak bola", "Olahraga", [
    k(0, p=A(-0.01, -0.33, 1.08), a="sisi_telunjuk", b="FLAT", j="dalam+0.3*depan", tp="belakang"),
    k(0.1),
    k(0.3, p=A(0.02, -0.34, 1.175)),
    k(0.45, p=A(-0.01, -0.33, 1.08)),
    k(0.65, p=A(0.02, -0.34, 1.175)),
    k(0.85),
], L=[k(0, p=A(0.04, -0.34, 1.21), a="telapak", b="FLAT", j="dalam+0.3*depan", tp="belakang")],
  cara="Tangan datar kanan berayun naik 'menendang' sisi bawah tangan datar kiri, dua kali.")

_RUN = [(0.0, "L"), (0.15, "BENT_L"), (0.3, "L"), (0.45, "BENT_L"), (0.6, "L"), (0.75, "BENT_L")]
S("RUN", "Berlari", "Olahraga", [
    k(0, p=A(-0.01, -0.29, 1.21), a="telunjuk", b="L", j="depan+0.2*dalam", tp="bawah+0.6*dalam"),
    *[k(t, b=b, p=A(-0.01, -0.29 - 0.14 * t / 0.75, 1.21)) for t, b in _RUN[1:]],
    k(0.9),
], L=[
    k(0, p=A(0.03, -0.33, 1.20), a="jempol", b="L", j="depan+0.2*dalam", tp="bawah+0.6*dalam"),
    *[k(t, b=b, p=A(0.03, -0.33 - 0.14 * t / 0.75, 1.20)) for t, b in _RUN[1:]],
    k(0.9),
], cara="Dua tangan bentuk L, telunjuk kanan mengait ibu jari kiri; keduanya maju cepat sambil telunjuk menekuk-lurus.")

S("WIN", "Menang", "Olahraga", [
    k(0, p=A(-0.15, -0.34, 1.36), a="telapak", b="5", j="atas+0.4*dalam", tp="dalam+0.5*bawah"),
    k(0.1),
    k(0.4, p=A(0.03, -0.32, 1.235), b="S", j="dalam+0.6*depan", tp="bawah"),
    k(0.5),
    k(0.85, p=A(-0.02, -0.36, 1.40), j="atas+0.2*depan", tp="dalam"),
    k(1.0),
], L=[k(0, p=A(0.04, -0.32, 1.19), a="telapak", b="S", j="dalam+0.6*depan", tp="bawah")],
  wajah="senang", cara="Tangan 5 kanan menyambar turun menjadi kepalan di atas kepalan kiri, lalu diangkat tinggi.")

S("LOSE", "Kalah", "Olahraga", [
    k(0, p=A(0.03, -0.33, 1.29), a="buku", b="BENT_V", j="atas+0.3*depan", tp="belakang"),
    k(0.15),
    k(0.45, p=A(0.04, -0.31, 1.18), j="dalam+0.6*depan", tp="bawah"),
    k(0.7),
], L=[k(0, p=A(0.04, -0.31, 1.15), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")],
  wajah="sedih", cara="Tangan bentuk V tertekuk jatuh dan mendarat di telapak kiri yang menghadap atas.")

# ── Hewan ──────────────────────────────────────────────────────────────────

S("BIRD", "Burung", "Hewan", [
    k(0, p="sudut_mulut+0.03*depan+0.01*luar", a="pergelangan", b="G", j="depan+0.2*dalam", tp="luar+0.3*bawah"),
    *bolak(0.13, 0.13, 6, {"b": "BABY_O"}, {"b": "G"}),
    k(0.85, b="BABY_O"),
], cara="Telunjuk & ibu jari (bentuk G) di depan mulut membuka-menutup seperti paruh burung.")

S("FISH", "Ikan", "Hewan", [
    k(0, p=A(-0.03, -0.30, 1.22), a="pergelangan", b="FLAT", j="depan", tp="dalam"),
    *bolak(0.12, 0.15, 6, {"j": "depan+0.45*dalam"}, {"j": "depan+0.45*luar"}),
    k(1.0, j="depan"),
], L=[k(0, p=A(0.005, -0.28, 1.225), a="ujung", b="FLAT", j="luar+0.6*depan", tp="bawah")],
  cara="Tangan datar kanan (telapak ke samping) meliuk ke kiri-kanan seperti ikan berenang; ujung jari kiri di pergelangan kanan.")

S("HORSE", "Kuda", "Hewan", [
    k(0, p="pelipis+0.012*depan", a="jempol", b="A21_U_JEMPOL", j="atas", tp="depan"),
    *bolak(0.15, 0.15, 4, {"b": "A21_U_TEKUK"}, {"b": "A21_U_JEMPOL"}),
    k(0.75, b="A21_U_TEKUK"),
], cara="Ibu jari di pelipis, dua jari (U) menghadap depan ditekuk berulang seperti telinga kuda.")

_R = [
    k(0, p="dada_kanan+0.01*depan", a="ujung", b="BENT_B", j="atas+0.2*luar", tp="belakang"),
    *bolak(0.15, 0.17, 5, {"j": "atas+0.6*dalam"}, {"j": "atas+0.3*luar"}),
    k(1.0),
]
S("ANIMAL", "Hewan / binatang", "Hewan", _R, L=cermin(_R),
  cara="Ujung jari dua tangan tertekuk di dada; tangan diayun ke dalam-keluar dengan ujung jari tetap menempel.")

# ── Perasaan lanjutan ─────────────────────────────────────────────────────

_R = [
    k(0, p="perut+0.05*atas+0.02*depan+0.03*luar", a="ujung", b="CLAW", j="atas+0.3*dalam", tp="belakang"),
    k(0.12),
    k(0.5, p="dada+0.08*atas+0.07*depan+0.04*luar", j="atas+0.2*dalam+0.2*depan"),
    k(0.75),
]
S("ANGRY", "Marah", "Perasaan", _R, L=cermin(_R), wajah="wh",
  kepala=[(0.1, 0, 0, 0), (0.5, -6, 0, 0), (0.75, -6, 0, 0)],
  cara="Dua tangan cakar di perut ditarik naik ke dada dengan tegang, alis berkerut.")

_R = [
    k(0, p="dada_kanan+0.13*luar+0.12*depan", a="telapak", b="S", j="atas+0.3*dalam", tp="belakang"),
    k(0.12),
    k(0.32, p="dada_kanan+0.03*luar+0.09*depan", b="5", j="dalam+0.4*atas"),
    k(0.6),
]
S("SCARED", "Takut", "Perasaan", _R, L=cermin(_R), wajah="ya_tidak",
  kepala=[(0.1, 0, 0, 0), (0.35, -8, 0, 0), (0.6, -8, 0, 0)],
  cara="Dua kepalan di samping dada tiba-tiba membuka ke tengah seperti melindungi diri, mata melebar.")

S("EXCITED", "Bersemangat / antusias", "Perasaan",
  lingkar(0, 1.0, "dada_kanan+0.03*depan", 0.035, "depan", "atas", n=10, mulai=180, putaran=2,
          a="tengah", b="OPEN_8", j="atas+0.3*dalam", tp="belakang") + [k(1.1)],
  L=cermin(lingkar(0, 1.0, "dada_kanan+0.03*depan", 0.035, "depan", "atas", n=10, mulai=0, putaran=2,
                   a="tengah", b="OPEN_8", j="atas+0.3*dalam", tp="belakang") + [k(1.1)]),
  wajah="senang", cara="Jari tengah dua tangan (bentuk 8 terbuka) bergantian mengusap dada ke atas sambil memutar.")

S("BORED", "Bosan", "Perasaan", [
    k(0, p="hidung+0.022*luar+0.005*depan", a="telunjuk", b="1", j="atas+0.5*dalam+0.4*belakang", tp="dalam+0.5*belakang"),
    k(0.15),
    k(0.55, putar=-40),
    k(0.8),
], kepala=[(0.1, 0, 0, 0), (0.6, 4, 0, 6)], wajah="sedih",
  cara="Ujung telunjuk di sisi hidung, diputar pelan; wajah malas dan datar.")

_R = [
    k(0, p="netral+0.05*luar", a="telapak", b="5", j="depan+0.3*dalam", tp="bawah"),
    *bolak(0.1, 0.08, 9, {"putar": -14, "p": "netral+0.05*luar+0.008*atas"}, {"putar": 14, "p": "netral+0.05*luar"}),
    k(0.95, putar=0),
]
S("NERVOUS", "Gugup / grogi", "Perasaan", _R, L=cermin(_R), wajah="sedih",
  cara="Dua tangan terbuka (telapak ke bawah) bergetar cepat di depan badan.")

S("PROUD", "Bangga", "Perasaan", [
    k(0, p="perut+0.05*atas+0.012*depan+0.02*luar", a="jempol", b="10", j="bawah+0.8*depan", tp="dalam+0.3*belakang", siku="bawah+luar"),
    k(0.15),
    k(0.65, p="dada+0.02*atas+0.012*depan+0.02*luar"),
    k(0.85),
], kepala=[(0.2, 0, 0, 0), (0.7, -6, 0, 0)], wajah="senang",
  cara="Ibu jari (menunjuk ke bawah) di perut disapukan naik ke dada; dagu sedikit terangkat.")

# ── Mengajak & menolak ─────────────────────────────────────────────────────

_R = [
    k(0, p="netral+0.08*atas+0.04*luar", a="telapak", b="S", j="depan+0.2*dalam", tp="bawah"),
    k(0.12),
    k(0.35, p="netral+0.04*bawah+0.04*luar"),
    k(0.6),
]
S("CAN", "Bisa / dapat", "Modal", _R, L=cermin(_R),
  cara="Dua kepalan (telapak ke bawah) digerakkan turun dengan mantap.")

S("CANT", "Tidak bisa", "Modal", [
    k(0, p=A(0.0, -0.37, 1.31), a="telunjuk", b="1", j="depan+0.3*dalam", tp="bawah"),
    k(0.12),
    k(0.4, p=A(0.0, -0.37, 1.15)),
    k(0.6),
], L=[k(0, p=A(0.03, -0.31, 1.205), a="pergelangan", b="1", j="dalam+0.5*depan", tp="bawah")],
  kepala=[(0.1, 0, 0, 0), (0.3, 0, 12, 0), (0.5, 0, -12, 0), (0.7, 0, 0, 0)],
  gloss="CAN'T", cara="Telunjuk kanan menyambar turun melewati ujung telunjuk kiri, sambil menggeleng.")

S("MAYBE", "Mungkin", "Modal", [
    k(0, p="netral+0.08*luar", a="telapak", b="FLAT", j="depan+0.3*luar", tp="atas"),
    *bolak(0.12, 0.18, 4, {"p": "netral+0.08*luar+0.05*bawah"}, {"p": "netral+0.08*luar+0.04*atas"}),
    k(0.85),
], L=[
    k(0, p="netral_kiri+0.08*luar", a="telapak", b="FLAT", j="depan+0.3*luar", tp="atas"),
    *bolak(0.12, 0.18, 4, {"p": "netral_kiri+0.08*luar+0.04*atas"}, {"p": "netral_kiri+0.08*luar+0.05*bawah"}),
    k(0.85),
], kepala=[(0.1, 0, 0, 0), (0.4, 0, 0, 8), (0.85, 0, 0, -4)],
  cara="Dua telapak menghadap atas naik-turun bergantian seperti menimbang.")

S("BUSY", "Sibuk", "Modal", [
    k(0, p=A(0.05, -0.31, 1.205), a="sisi_kelingking", b="FLAT", j="depan+0.3*atas", tp="dalam"),
    *bolak(0.12, 0.13, 6, {"p": A(0.10, -0.31, 1.205)}, {"p": A(0.05, -0.31, 1.205)}),
    k(0.9),
], L=[k(0, p=A(0.08, -0.30, 1.17), a="pergelangan", b="S", j="dalam+0.5*depan", tp="bawah")],
  cara="Sisi kelingking tangan datar kanan menggosok punggung pergelangan kepalan kiri bolak-balik.")

S("FREE", "Bebas / luang", "Modal", [
    k(0, p=A(0.025, -0.36, 1.24), a="pergelangan", b="F", j="atas+0.5*dalam", tp="belakang"),
    k(0.12),
    k(0.5, p=A(-0.16, -0.37, 1.26), j="atas+0.3*luar", tp="depan"),
    k(0.7),
], L=[
    k(0, p=A(-0.025, -0.33, 1.24), a="pergelangan", b="F", j="atas+0.5*dalam", tp="belakang"),
    k(0.12),
    k(0.5, p=A(0.16, -0.35, 1.26), j="atas+0.3*luar", tp="depan"),
    k(0.7),
], cara="Dua tangan bentuk F bersilang di pergelangan, lalu dibuka ke samping sambil telapak berputar ke depan.")

# ── Kalender ───────────────────────────────────────────────────────────────

S("MONTH", "Bulan (kalender)", "Waktu", [
    k(0, p=A(0.04, -0.305, 1.33), a="jari_telunjuk", b="1", j="dalam+0.2*depan", tp="belakang"),
    k(0.12),
    k(0.55, p=A(0.04, -0.305, 1.22)),
    k(0.75),
], L=[k(0, p=A(0.05, -0.33, 1.17), a="pergelangan", b="1", j="atas", tp="dalam")],
  cara="Telunjuk kanan mendatar meluncur turun di sepanjang telunjuk kiri yang tegak.")

_PUSAT_TH = A(0.03, -0.34, 1.215)
S("YEAR", "Tahun", "Waktu",
  lingkar(0, 0.75, _PUSAT_TH, 0.075, "depan", "atas", n=10, mulai=90, putaran=1,
          a="telapak", b="S", j="dalam+0.3*depan", tp="bawah+0.3*belakang") +
  [k(0.95, p=A(0.03, -0.34, 1.24)), k(1.1)],
  L=[k(0, p=A(0.05, -0.33, 1.19), a="telapak", b="S", j="dalam+0.3*depan", tp="atas+0.3*belakang")],
  cara="Kepalan kanan memutari kepalan kiri ke arah depan satu putaran, lalu mendarat di atasnya.")

S("NEXT_WEEK", "Minggu depan", "Waktu", [
    k(0, p=_W0, a="jari_telunjuk", b="1", j="dalam+0.5*depan", tp="bawah"),
    k(0.1), k(0.4, p=_W1),
    k(0.7, p=_W1 + A(-0.03, -0.12, 0.06), j="depan+0.3*atas+0.2*dalam"),
    k(0.85),
], L=_MINGGU_L, gloss="NEXT-WEEK",
  cara="Telunjuk kanan meluncur di telapak kiri (WEEK), lalu melengkung maju ke depan (masa depan).")

S("LAST_WEEK", "Minggu lalu", "Waktu", [
    k(0, p=_W0, a="jari_telunjuk", b="1", j="dalam+0.5*depan", tp="bawah"),
    k(0.1), k(0.4, p=_W1),
    k(0.75, p=A(-0.10, -0.22, 1.36), j="belakang+0.6*atas", tp="dalam"),
    k(0.9),
], L=_MINGGU_L, gloss="LAST-WEEK",
  cara="Telunjuk kanan meluncur di telapak kiri (WEEK), lalu ditarik mundur ke atas bahu (masa lalu).")

# ── Perayaan ───────────────────────────────────────────────────────────────

S("BIRTHDAY", "Ulang tahun", "Perayaan", [
    k(0, p="dagu+0.006*depan", a="tengah", b="OPEN_8", j="atas+0.3*dalam", tp="belakang"),
    k(0.15),
    k(0.5, p="dada+0.012*depan+0.02*luar"),
    k(0.7),
], wajah="senang", cara="Jari tengah tangan 8-terbuka menyentuh dagu, lalu dada.")

S("PARTY", "Pesta", "Perayaan", [
    k(0, p=A(-0.08, -0.34, 1.22), a="telapak", b="Y", j="depan+0.3*dalam", tp="bawah"),
    *bolak(0.12, 0.17, 5, {"p": A(-0.03, -0.34, 1.24)}, {"p": A(-0.13, -0.34, 1.24)}),
    k(1.0),
], L=[
    k(0, p=A(0.08, -0.34, 1.22), a="telapak", b="Y", j="depan+0.3*dalam", tp="bawah"),
    *bolak(0.12, 0.17, 5, {"p": A(0.13, -0.34, 1.24)}, {"p": A(0.03, -0.34, 1.24)}),
    k(1.0),
], wajah="senang", cara="Dua tangan bentuk Y (telapak ke bawah) diayun ke kiri-kanan bersama.")

_R = [
    k(0, p=A(-0.07, -0.28, 1.21), a="pergelangan", b="X", j="atas+0.3*depan", tp="dalam"),
    k(0.12),
    k(0.5, p=A(-0.07, -0.44, 1.25), j="depan+0.4*atas"),
    k(0.7),
]
S("GIFT", "Hadiah / kado", "Perayaan", _R, L=cermin(_R), wajah="senang",
  cara="Dua tangan bentuk X saling berhadapan, diayun maju seperti menyerahkan sesuatu (GIVE).")

_R = lingkar(0, 1.0, "dada_kanan+0.15*atas+0.07*luar+0.12*depan", 0.035, "luar", "atas", n=10, mulai=90, putaran=2,
             a="pergelangan", b="X", j="atas", tp="depan+0.4*dalam") + [k(1.1)]
S("CELEBRATE", "Merayakan", "Perayaan", _R, L=cermin(_R), wajah="senang",
  cara="Dua tangan (telunjuk menekuk) diangkat setinggi bahu dan diputar kecil seperti mengibarkan bendera.")

_R = [
    k(0, p="dada_kanan+0.07*luar+0.02*atas+0.02*depan", a="jempol", b="5", j="depan+0.3*dalam", tp="bawah+0.3*dalam", siku="bawah+luar"),
    *bolak(0.15, 0.15, 4, {"p": "dada_kanan+0.07*luar+0.02*atas+0.06*depan"}, {"p": "dada_kanan+0.07*luar+0.02*atas+0.02*depan"}),
    k(0.8),
]
S("HOLIDAY", "Liburan / hari libur", "Perayaan", _R, L=cermin(_R), wajah="senang",
  cara="Ibu jari dua tangan terbuka mengetuk dada dekat ketiak (sama dengan VACATION).")

# ── Jumlah ─────────────────────────────────────────────────────────────────

_R = [
    k(0, p="netral+0.07*luar+0.03*bawah", a="telapak", b="S", j="depan+0.3*luar", tp="atas"),
    *bolak(0.12, 0.17, 4, {"b": "5", "p": "netral+0.07*luar+0.01*atas"}, {"b": "S", "p": "netral+0.07*luar+0.03*bawah"}),
    k(0.8, b="5"),
]
S("MANY", "Banyak", "Jumlah", _R, L=cermin(_R),
  cara="Dua kepalan menghadap atas dijentik terbuka menjadi tangan 5, dua kali.")

S("FEW", "Sedikit (beberapa)", "Jumlah", [
    k(0, p="netral+0.04*luar", a="telapak", b="A", j="depan+0.3*luar", tp="atas"),
    k(0.15),
    k(0.32, b="L"),
    k(0.5, b="3"),
    k(0.68, b="A21_TIGA_JEMPOL"),
    k(0.85),
], cara="Kepalan A menghadap atas; ibu jari menyapu jari-jari sehingga terbuka satu per satu.")

S("ALL", "Semua", "Jumlah", [
    k(0, p=A(-0.01, -0.39, 1.31), a="telapak", b="FLAT", j="dalam+0.3*atas", tp="depan"),
    k(0.1),
    k(0.35, p=A(-0.13, -0.42, 1.25), tp="depan+0.5*luar"),
    k(0.58, p=A(-0.07, -0.38, 1.15), tp="belakang+0.4*luar"),
    k(0.8, p=A(0.02, -0.325, 1.20), a="punggung", j="dalam+0.3*atas", tp="belakang"),
    k(0.95),
], L=[k(0, p=A(0.03, -0.35, 1.20), a="telapak", b="FLAT", j="dalam+0.3*atas", tp="belakang")],
  cara="Tangan kanan memutari tangan kiri, lalu punggung tangan kanan mendarat di telapak kiri.")

S("SOME", "Sebagian / beberapa", "Jumlah", [
    k(0, p=A(0.03, -0.38, 1.19), a="sisi_kelingking", b="FLAT", j="depan+0.2*dalam", tp="dalam"),
    k(0.15),
    k(0.6, p=A(0.03, -0.30, 1.19), b="BENT_B"),
    k(0.8),
], L=[k(0, p=A(0.05, -0.34, 1.165), a="telapak", b="FLAT", j="depan+0.3*dalam", tp="atas+0.5*dalam")],
  cara="Sisi kelingking tangan kanan 'memotong' telapak kiri lalu ditarik ke arah badan.")

# ── Kesukaan ───────────────────────────────────────────────────────────────

S("FAVORITE", "Favorit / paling suka", "Kesukaan", [
    k(0, p="dagu+0.03*depan", a="tengah", b="OPEN_8", j="atas+0.3*dalam", tp="belakang"),
    *bolak(0.15, 0.15, 4, {"p": "dagu+0.004*depan"}, {"p": "dagu+0.03*depan"}),
    k(0.7, p="dagu+0.004*depan"),
], wajah="senang", cara="Jari tengah tangan 8-terbuka mengetuk dagu dua kali.")

S("BEST", "Terbaik / paling bagus", "Kesukaan", [
    k(0, p="dagu+0.015*bawah", a="ujung", b="FLAT", j="atas", tp="belakang"),
    k(0.15),
    k(0.6, p="pelipis+0.04*bawah+0.13*luar+0.08*depan", a="telapak", b="10", j="atas", tp="dalam"),
    k(0.8),
], wajah="senang", cara="Ujung jari di dagu (GOOD), lalu tangan naik tinggi ke samping kepala menjadi kepalan ibu jari tegak.")

S("WORST", "Terburuk / paling jelek", "Kesukaan", [
    k(0, p="dagu+0.015*bawah", a="ujung", b="FLAT", j="atas", tp="belakang"),
    k(0.15),
    k(0.4, p="dagu+0.12*depan+0.12*bawah", j="depan+0.4*bawah", tp="bawah"),
    k(0.85, p="pelipis+0.04*bawah+0.13*luar+0.08*depan", a="telapak", b="10", j="atas", tp="dalam"),
    k(1.0),
], wajah="sedih", cara="Ujung jari di dagu lalu dibalik ke bawah (BAD), kemudian naik tinggi ke samping kepala (akhiran -EST).")
